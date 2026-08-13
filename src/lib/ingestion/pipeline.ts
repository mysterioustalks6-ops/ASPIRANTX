// ============================================================
// UNIVERSAL INGESTION PIPELINE — ORCHESTRATOR
//
// Pipeline:
//   EXTRACT → NORMALIZE → SEGMENT → CLASSIFY → REPAIR →
//   QUALITY SCORE → REPAIR ATTEMPT 2 (if needed) →
//   DEDUPLICATE → PUBLISH / REVIEW / REJECT
// ============================================================

import crypto from 'crypto';
import type {
  IngestionSourceType,
  ExamId,
  RepairedQuestion,
  IngestionReport,
  IngestionJobStatus,
  SourceMeta,
  QualityBreakdown,
} from './types.js';
import { repairMathText, repairOptions, stripSourceContamination } from './mathRepair.js';
import { segmentQuestions, segmentPastedText, normalizeExtractedText } from './segmenter.js';
import {
  classifySubject,
  classifyTopic,
  detectExamFromContent,
  detectYear,
  detectStage,
} from './classifier.js';
import { computeQualityScore, scoreToStatus } from './qualityGate.js';
import {
  computeContentHash,
  checkDuplicate,
  buildDedupStores,
} from './deduplicator.js';

// ── In-memory job status store ────────────────────────────
const jobStatuses = new Map<string, IngestionJobStatus>();
const jobReports  = new Map<string, IngestionReport>();

export function getJobStatus(jobId: string): IngestionJobStatus | null {
  return jobStatuses.get(jobId) || null;
}

export function getJobReport(jobId: string): IngestionReport | null {
  return jobReports.get(jobId) || null;
}

// ── Answer extraction from raw string ────────────────────
function extractCorrectOption(rawAnswer: string | number | undefined, options: string[]): number | null {
  if (rawAnswer === undefined || rawAnswer === null) return null;

  const s = String(rawAnswer).trim().toUpperCase();

  // Letter: A B C D
  if (s === 'A') return 0;
  if (s === 'B') return 1;
  if (s === 'C') return 2;
  if (s === 'D') return 3;

  // Number 1–4
  const n = parseInt(s, 10);
  if (n >= 1 && n <= 4) return n - 1;

  // Already 0–3
  if (n >= 0 && n <= 3) return n;

  // Full option text match
  const lower = s.toLowerCase();
  const idx = options.findIndex(o => String(o || '').toLowerCase().includes(lower));
  if (idx >= 0) return idx;

  return null;
}

// ── Single question repair + score ────────────────────────
function processRawQuestion(params: {
  questionText: string;
  options: string[];
  rawAnswer?: string | number;
  exam: ExamId;
  hintSubject?: string;
  sourceMeta: SourceMeta;
  repairAttempt: number;
}): RepairedQuestion {
  const { exam, hintSubject, sourceMeta, repairAttempt } = params;
  let { questionText, options } = params;

  const id = 'ing_' + crypto.randomBytes(6).toString('hex');
  const qualityFlags: string[] = [];
  let mathRepaired = false;

  // ── Step 1: Strip source contamination ───────────────────
  const { text: cleanText, stripped } = stripSourceContamination(questionText);
  if (stripped) questionText = cleanText;

  // ── Step 2: Math repair on question text ─────────────────
  const mathResult = repairMathText(questionText);
  if (mathResult.changed) {
    questionText = mathResult.text;
    mathRepaired = true;
  }
  qualityFlags.push(...mathResult.flags);

  // ── Step 3: Math repair on options ───────────────────────
  const optResult = repairOptions(options);
  if (optResult.changed) {
    options = optResult.options;
    mathRepaired = true;
  }
  qualityFlags.push(...optResult.flags.filter(f => !qualityFlags.includes(f)));

  // ── Step 4: Normalize text ────────────────────────────────
  questionText = normalizeExtractedText(questionText);
  options = options.map(o => normalizeExtractedText(o));

  // ── Step 5: Answer extraction ────────────────────────────
  const correctOption = extractCorrectOption(params.rawAnswer, options);
  const answerVerified = correctOption !== null;

  // ── Step 6: Subject classification ───────────────────────
  const subjResult = classifySubject(exam, questionText, hintSubject);
  const topicResult = classifyTopic(exam, subjResult.subject, questionText);

  // ── Step 7: Year + Stage ─────────────────────────────────
  const year = detectYear(sourceMeta.sourceDocument, questionText) ||
               (sourceMeta.sourceYear ?? null);

  const stage = detectStage(sourceMeta.sourceDocument, exam);

  // ── Step 8: Quality scoring ───────────────────────────────
  const partialQ: Partial<RepairedQuestion> = {
    questionText,
    options,
    correctOption,
    answerVerified,
    qualityFlags,
    mathRepaired,
    qualityBreakdown: {
      readability: 0,
      optionCompleteness: 0,
      answerValidity: 0,
      subjectConfidence: Math.round(subjResult.confidence * 15),
      topicConfidence: Math.round(topicResult.confidence * 10),
      mathRepairConfidence: 0,
      boundaryConfidence: 5,
      totalScore: 0,
      criticalFailures: [],
      warnings: [],
    },
  };

  const breakdown = computeQualityScore(partialQ);
  const qualityStatus = scoreToStatus(breakdown);
  const contentHash = computeContentHash(questionText, options);

  return {
    id,
    exam,
    questionText,
    options,
    correctOption,
    answerVerified,
    subject: subjResult.subject,
    topic: topicResult.topic,
    year: year ?? null,
    difficulty: 'Medium',
    stage,
    qualityScore: breakdown.totalScore,
    qualityStatus,
    qualityBreakdown: breakdown,
    qualityFlags: [...new Set(qualityFlags)],
    mathRepaired,
    repairAttempts: repairAttempt,
    sourceMeta,
    isDuplicate: false,
    contentHash,
  };
}

// ── Main pipeline function ────────────────────────────────
export async function runIngestionPipeline(params: {
  jobId: string;
  rawText: string;
  sourceType: IngestionSourceType;
  exam: ExamId;
  sourceMeta: Omit<SourceMeta, 'ingestionTimestamp'>;
  existingQuestions?: Array<{ id: string; questionText: string; options: string[] }>;
  hintSubject?: string;
  onProgress?: (status: IngestionJobStatus) => void;
}): Promise<IngestionReport> {
  const {
    jobId, rawText, sourceType, exam, sourceMeta,
    existingQuestions = [], hintSubject, onProgress,
  } = params;

  const startedAt = new Date().toISOString();
  const fullSourceMeta: SourceMeta = {
    ...sourceMeta,
    ingestionTimestamp: startedAt,
  };

  const updateStatus = (step: string, progress: number, extra: Partial<IngestionJobStatus> = {}) => {
    const status: IngestionJobStatus = {
      jobId,
      status: progress < 100 ? 'processing' : 'complete',
      progress,
      currentStep: step,
      detected: extra.detected ?? 0,
      processed: extra.processed ?? 0,
      published: extra.published ?? 0,
      startedAt,
      ...extra,
    };
    jobStatuses.set(jobId, status);
    onProgress?.(status);
  };

  try {
    // ── STEP 1: EXTRACT (text already provided) ───────────
    updateStatus('Extracting questions', 10);

    // ── STEP 2: SEGMENT ───────────────────────────────────
    updateStatus('Segmenting questions', 20);
    const segments = sourceType === 'pasted_text'
      ? segmentPastedText(rawText)
      : segmentQuestions(rawText);

    updateStatus('Segmentation complete', 30, { detected: segments.length });

    // ── STEP 3: BUILD DEDUP STORES ────────────────────────
    updateStatus('Building deduplication index', 35);
    const { hashStore, textStore } = buildDedupStores(existingQuestions);

    // ── STEP 4: PROCESS EACH QUESTION ─────────────────────
    const published: RepairedQuestion[] = [];
    const reviewQueue: RepairedQuestion[] = [];
    const rejectedQueue: RepairedQuestion[] = [];
    let autoRepaired = 0;
    let duplicatesRemoved = 0;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const progress = 35 + Math.round((i / segments.length) * 50);
      updateStatus(`Processing question ${i + 1}/${segments.length}`, progress, {
        detected: segments.length,
        processed: i,
        published: published.length,
      });

      // First repair attempt
      let q = processRawQuestion({
        questionText: seg.questionText,
        options: seg.options,
        rawAnswer: seg.rawAnswer,
        exam,
        hintSubject,
        sourceMeta: {
          ...fullSourceMeta,
          sourcePage: seg.questionNumber,
          sourceQuestionNumber: seg.questionNumber,
        },
        repairAttempt: 1,
      });

      // Second repair attempt for needs_repair status
      if (q.qualityStatus === 'needs_repair' && q.repairAttempts < 2) {
        q = processRawQuestion({
          questionText: q.questionText,
          options: q.options,
          rawAnswer: seg.rawAnswer,
          exam,
          hintSubject: q.subject,  // use classified subject as hint
          sourceMeta: q.sourceMeta,
          repairAttempt: 2,
        });
        if (q.qualityStatus === 'auto_publish' || q.qualityStatus === 'needs_repair') {
          autoRepaired++;
        }
      }

      // Boundary confidence from segmenter
      if (seg.boundaryConfidence < 0.8) {
        q.qualityFlags.push('low-boundary-confidence');
        q.qualityScore = Math.max(0, q.qualityScore - 10);
      }

      // Duplicate check
      const dupResult = checkDuplicate(q.questionText, q.options, hashStore, textStore);
      if (dupResult.isDuplicate) {
        duplicatesRemoved++;
        q.isDuplicate = true;
        q.duplicateOf = dupResult.duplicateOf;
        q.qualityStatus = 'rejected';
        rejectedQueue.push(q);
        continue;
      }

      // Register in dedup stores
      hashStore.set(q.contentHash, q.id);
      textStore.set(q.id, q.questionText);

      // Route to appropriate queue
      if (q.qualityStatus === 'auto_publish') {
        published.push(q);
      } else if (q.qualityStatus === 'needs_repair') {
        // After 2 attempts, goes to review
        q.qualityStatus = 'review';
        reviewQueue.push(q);
      } else if (q.qualityStatus === 'review') {
        reviewQueue.push(q);
      } else {
        // corrupted or rejected
        rejectedQueue.push(q);
      }
    }

    // ── STEP 5: BATCH-LEVEL CHECKS ────────────────────────
    updateStatus('Running batch-level checks', 90);

    // Detect suspicious batch: all answers are option 0
    const publishedWithAnswer = published.filter(q => q.correctOption !== null);
    if (publishedWithAnswer.length > 10) {
      const allZero = publishedWithAnswer.every(q => q.correctOption === 0);
      if (allZero) {
        // Mass reset — answers were probably defaulted
        publishedWithAnswer.forEach(q => {
          q.correctOption = null;
          q.answerVerified = false;
          q.qualityFlags.push('suspicious-all-zero-answer-batch');
          q.qualityScore = Math.max(0, q.qualityScore - 15);
        });
      }
    }

    const allScores = [...published, ...reviewQueue].map(q => q.qualityScore);
    const avgScore = allScores.length > 0
      ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
      : 0;

    const report: IngestionReport = {
      jobId,
      sourceDocument: sourceMeta.sourceDocument,
      sourceType,
      exam,
      startedAt,
      completedAt: new Date().toISOString(),
      status: 'complete',
      detected: segments.length,
      autoRepaired,
      published: published.length,
      duplicatesRemoved,
      sentToReview: reviewQueue.length,
      rejected: rejectedQueue.length,
      averageQualityScore: avgScore,
      questions: published,
      reviewQueue,
      rejectedQueue,
      errors: [],
    };

    jobReports.set(jobId, report);
    updateStatus('Complete', 100, {
      detected: segments.length,
      processed: segments.length,
      published: published.length,
    });

    return report;
  } catch (err: any) {
    const errReport: IngestionReport = {
      jobId,
      sourceDocument: sourceMeta.sourceDocument,
      sourceType,
      exam,
      startedAt,
      completedAt: new Date().toISOString(),
      status: 'failed',
      detected: 0, autoRepaired: 0, published: 0,
      duplicatesRemoved: 0, sentToReview: 0, rejected: 0,
      averageQualityScore: 0,
      questions: [],
      reviewQueue: [],
      rejectedQueue: [],
      errors: [err.message || 'Unknown error'],
    };
    jobReports.set(jobId, errReport);
    jobStatuses.set(jobId, {
      jobId, status: 'failed', progress: 0,
      currentStep: 'Failed', detected: 0, processed: 0, published: 0,
      startedAt, error: err.message,
    });
    return errReport;
  }
}

// ── JSON question records ingestion ──────────────────────
export async function ingestJsonQuestions(params: {
  jobId: string;
  records: any[];
  exam: ExamId;
  sourceDoc: string;
  existingQuestions?: Array<{ id: string; questionText: string; options: string[] }>;
}): Promise<IngestionReport> {
  const { jobId, records, exam, sourceDoc, existingQuestions = [] } = params;
  const startedAt = new Date().toISOString();

  const published: RepairedQuestion[] = [];
  const reviewQueue: RepairedQuestion[] = [];
  const rejectedQueue: RepairedQuestion[] = [];
  let autoRepaired = 0;
  let duplicatesRemoved = 0;

  const { hashStore, textStore } = buildDedupStores(existingQuestions);

  for (const rec of records) {
    const q = processRawQuestion({
      questionText: String(rec.questionText || rec.text || ''),
      options: Array.isArray(rec.options) ? rec.options : [],
      rawAnswer: rec.correctOption ?? rec.answer,
      exam: (rec.exam || exam) as ExamId,
      hintSubject: rec.subject,
      sourceMeta: {
        sourceDocument: rec.sourceDocument || sourceDoc,
        sourceType: 'json',
        sourceYear: rec.year,
        ingestionTimestamp: startedAt,
        sourceUrl: rec.sourceUrl,
        sourcePage: rec.sourcePage,
        sourceQuestionNumber: rec.sourceQuestionNumber,
      } as SourceMeta,
      repairAttempt: 1,
    });

    const dup = checkDuplicate(q.questionText, q.options, hashStore, textStore);
    if (dup.isDuplicate) {
      duplicatesRemoved++;
      rejectedQueue.push({ ...q, isDuplicate: true, duplicateOf: dup.duplicateOf, qualityStatus: 'rejected' });
      continue;
    }

    hashStore.set(q.contentHash, q.id);
    textStore.set(q.id, q.questionText);

    if (q.qualityStatus === 'auto_publish') published.push(q);
    else if (q.qualityStatus === 'needs_repair') { q.qualityStatus = 'review'; reviewQueue.push(q); }
    else if (q.qualityStatus === 'review') reviewQueue.push(q);
    else rejectedQueue.push(q);
  }

  const allScores = [...published, ...reviewQueue].map(q => q.qualityScore);
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

  const report: IngestionReport = {
    jobId, sourceDocument: sourceDoc, sourceType: 'json', exam,
    startedAt, completedAt: new Date().toISOString(), status: 'complete',
    detected: records.length, autoRepaired,
    published: published.length, duplicatesRemoved,
    sentToReview: reviewQueue.length, rejected: rejectedQueue.length,
    averageQualityScore: avgScore,
    questions: published, reviewQueue, rejectedQueue, errors: [],
  };

  jobReports.set(jobId, report);
  return report;
}
