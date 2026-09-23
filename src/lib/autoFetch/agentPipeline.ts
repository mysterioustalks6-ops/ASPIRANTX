// ============================================================================
// AUTONOMOUS EXAM DATA AUTO-FETCH AGENT — PIPELINE ORCHESTRATOR
// ============================================================================

import {
  getExamTarget,
  getAllExamTargets,
  isCopyrightedOrPaidSource,
  EXAM_ALIAS_MAP,
} from './sourceRegistry.js';
import { isUrlPermittedByRobots } from './robotsCompliance.js';
import { politeFetch, getDomainStats } from './politeFetcher.js';
import { extractTextContent } from './textExtractor.js';
import {
  structureExamContentWithLLM,
  buildCbtPracticeTestSet,
} from './structuringEngine.js';
import {
  initContentTable,
  isContentFresh,
  saveContentRecord,
  getStorageSizeMetrics,
  getContentRecord,
} from './contentStore.js';
import type {
  ContentType,
  PipelineExecutionOptions,
  AgentRunSummary,
  ExamTarget,
  QuestionRecord,
} from './types.js';

let latestRunSummary: AgentRunSummary | null = null;
let isPipelineRunning = false;

export function getLatestRunSummary(): AgentRunSummary | null {
  return latestRunSummary;
}

export function isAutoFetchRunning(): boolean {
  return isPipelineRunning;
}

/**
 * Runs the autonomous fetch pipeline across registered exams with precision QA.
 */
export async function runAutoFetchPipeline(
  options: PipelineExecutionOptions = {}
): Promise<AgentRunSummary> {
  if (isPipelineRunning) {
    throw new Error('An auto-fetch pipeline run is already in progress.');
  }

  isPipelineRunning = true;
  const startedAt = new Date().toISOString();
  const runId = `run_${Date.now()}`;
  const mode = options.mode || (options.examId ? 'on-demand' : 'batch');
  const freshnessDays = options.freshnessDays ?? 30;

  // Determine target content types
  let targetTypes: ContentType[];
  if (options.type === 'syllabus') {
    targetTypes = ['syllabus'];
  } else if (options.type === 'pyq') {
    targetTypes = ['pyq'];
  } else if (options.type === 'question_bank') {
    targetTypes = ['question_bank'];
  } else if (options.type === 'cbt') {
    targetTypes = ['cbt'];
  } else {
    // Default 'all' fetches syllabus, pyq, question_bank, and derives cbt
    targetTypes = ['syllabus', 'pyq', 'question_bank'];
  }

  const summary: AgentRunSummary = {
    runId,
    startedAt,
    finishedAt: '',
    mode,
    totalExamTargetsEvaluated: 0,
    examStatusCounts: {
      officialSuccess: 0,
      fallbackSuccess: 0,
      failed: 0,
    },
    successfulFetches: [],
    skippedFresh: [],
    skippedNotFoundOrBlocked: [],
    rejectedCopyrightOrPaid: [],
    duplicatesSkipped: {
      syllabusTopics: 0,
      questions: 0,
    },
    storageStats: {
      totalBytesAdded: 0,
      avgBytesPerExam: 0,
      examSizes: {},
    },
    qaRejections: {
      garbledText: 0,
      mismatchedAnswers: 0,
      blankYearOrStage: 0,
      idInconsistencies: 0,
      spellingInconsistencies: 0,
      details: [],
    },
    questionsStoredPerExam: {},
    flaggedExams: [],
    domainRequestStats: {},
  };

  try {
    // 1. Ensure canonical table and migrations exist in Neon Postgres
    await initContentTable();

    // 2. Resolve target exams
    const targets: ExamTarget[] = options.examId
      ? [getExamTarget(options.examId)]
      : getAllExamTargets();

    summary.totalExamTargetsEvaluated = targets.length;

    for (const target of targets) {
      // Check alias to avoid redundant scraping
      if (EXAM_ALIAS_MAP[target.id]) {
        continue;
      }

      if (!summary.questionsStoredPerExam[target.id]) {
        summary.questionsStoredPerExam[target.id] = {
          pyq: 0,
          question_bank: 0,
          cbt: 0,
          syllabusSections: 0,
        };
      }

      let examHadOfficialSuccess = false;
      let examHadFallbackSuccess = false;

      for (const cType of targetTypes) {
        // A. Freshness check in Neon Postgres
        if (!options.force) {
          const freshCheck = await isContentFresh(target.id, cType, freshnessDays);
          if (freshCheck.isFresh && freshCheck.record) {
            summary.skippedFresh.push({
              examId: target.id,
              type: cType,
              lastFetchedAt: freshCheck.record.fetched_at,
              ageDays: freshCheck.ageDays,
            });

            // Update stats from existing fresh record
            if (cType === 'syllabus') {
              summary.questionsStoredPerExam[target.id].syllabusSections +=
                freshCheck.record.sections?.length || 0;
            } else if (cType === 'pyq') {
              summary.questionsStoredPerExam[target.id].pyq +=
                freshCheck.record.questions?.length || 0;
            } else if (cType === 'question_bank') {
              summary.questionsStoredPerExam[target.id].question_bank +=
                freshCheck.record.questions?.length || 0;
            }

            continue;
          }
        }

        // B. Select legitimate public source URLs per bucket
        let candidateUrls: string[] = [];
        if (cType === 'syllabus') {
          candidateUrls = [
            ...target.officialSyllabusUrls,
            ...(target.fallbackSyllabusUrls || []),
          ];
        } else if (cType === 'pyq') {
          // PYQ Bucket: Official conducting-body previous year question papers / answer keys ONLY
          candidateUrls = [...target.officialPyqUrls];
        } else if (cType === 'question_bank') {
          // Question Bank Bucket: Open educational / NCERT / sample content only
          candidateUrls = [...(target.openQuestionBankUrls || [])];
        }

        if (candidateUrls.length === 0) {
          if (cType !== 'question_bank') {
            summary.skippedNotFoundOrBlocked.push({
              examId: target.id,
              type: cType,
              reason: `No verified official public URL registered for ${target.id} (${cType}). Logged for manual review.`,
            });
            summary.flaggedExams.push({
              examId: target.id,
              type: cType,
              reason: 'Missing official URL endpoint in registry.',
            });
          }
          continue;
        }

        let fetchSucceeded = false;

        for (const candidateUrl of candidateUrls) {
          // C. Check Copyright / Paid Heuristic
          const copyrightCheck = isCopyrightedOrPaidSource(candidateUrl);
          if (copyrightCheck.rejected) {
            summary.rejectedCopyrightOrPaid.push({
              examId: target.id,
              type: cType,
              url: candidateUrl,
              reason: copyrightCheck.reason || 'Source identified as commercial/paid.',
            });
            continue;
          }

          // D. Check robots.txt permissions
          const robotsCheck = await isUrlPermittedByRobots(candidateUrl);
          if (!robotsCheck.permitted) {
            summary.skippedNotFoundOrBlocked.push({
              examId: target.id,
              type: cType,
              reason: `Robots.txt check disallowed URL ${candidateUrl}: ${robotsCheck.reason}`,
            });
            continue;
          }

          // E. Polite Fetch (Enforces 2.5-5s delay per domain)
          const fetchRes = await politeFetch(candidateUrl, options.customDelayMs);

          if (fetchRes.isBlockedOrRateLimited) {
            summary.skippedNotFoundOrBlocked.push({
              examId: target.id,
              type: cType,
              reason: `Rate-limited or blocked by domain (${fetchRes.error}). Halting requests to this domain.`,
            });
            continue;
          }

          if (fetchRes.error || fetchRes.statusCode !== 200) {
            continue;
          }

          // F. Extract text from raw HTML or native PDF
          const extraction = await extractTextContent(fetchRes);
          if (extraction.error || !extraction.text || extraction.isScannedPdf) {
            if (extraction.isScannedPdf) {
              summary.skippedNotFoundOrBlocked.push({
                examId: target.id,
                type: cType,
                reason: `Source document ${candidateUrl} is a scanned PDF with no text layer. Logged for manual review.`,
              });
              summary.flaggedExams.push({
                examId: target.id,
                type: cType,
                reason: 'Scanned PDF with no extractable text layer.',
              });
            }
            continue;
          }

          // Secondary copyright check on extracted text snippet
          const snippetCheck = isCopyrightedOrPaidSource(candidateUrl, extraction.text.slice(0, 2000));
          if (snippetCheck.rejected) {
            summary.rejectedCopyrightOrPaid.push({
              examId: target.id,
              type: cType,
              url: candidateUrl,
              reason: snippetCheck.reason || 'Extracted text contained proprietary/copyright notice.',
            });
            continue;
          }

          // G. Pass text to Gemini LLM for strict schema structuring & Task 6 QA checks
          const { structured, qaFailure } = await structureExamContentWithLLM({
            examId: target.id,
            type: cType,
            sourceUrl: candidateUrl,
            rawText: extraction.text,
            examType: target.examType,
            stages: target.stages,
          });

          // DISCARD RAW BUFFERS & TEXT IMMEDIATELY (Task 4 hard requirement)
          delete (fetchRes as any).buffer;
          delete (fetchRes as any).text;
          (extraction as any).text = '';

          // Track QA failure diagnostics if any
          if (qaFailure) {
            summary.qaRejections[qaFailure.category]++;
            summary.qaRejections.details.push({
              examId: target.id,
              type: cType,
              reason: qaFailure.reason,
            });
          }

          // H. Store structured JSON to Neon Postgres with deduplication
          // Note: status is strictly 'pending_review' per Task 1 / gate
          if (!options.dryRun) {
            const saveRes = await saveContentRecord(structured);
            summary.duplicatesSkipped.syllabusTopics += saveRes.duplicatesSkipped.syllabusTopics;
            summary.duplicatesSkipped.questions += saveRes.duplicatesSkipped.questions;
            summary.storageStats.totalBytesAdded += saveRes.bytesAdded;
            summary.storageStats.examSizes[target.id] =
              (summary.storageStats.examSizes[target.id] || 0) + saveRes.bytesAdded;
          }

          const isFallback =
            target.fallbackSyllabusUrls?.includes(candidateUrl) ||
            !candidateUrl.includes(target.officialDomain);

          if (isFallback) {
            examHadFallbackSuccess = true;
          } else {
            examHadOfficialSuccess = true;
          }

          const qCount = structured.questions?.length || 0;
          if (cType === 'syllabus') {
            summary.questionsStoredPerExam[target.id].syllabusSections += structured.sections.length;
          } else if (cType === 'pyq') {
            summary.questionsStoredPerExam[target.id].pyq += qCount;
          } else if (cType === 'question_bank') {
            summary.questionsStoredPerExam[target.id].question_bank += qCount;
          }

          summary.successfulFetches.push({
            examId: target.id,
            type: cType,
            sourceUrl: candidateUrl,
            sectionCount: structured.sections.length,
            questionCount: qCount,
            confidence: structured.confidence_score,
            needsReview: structured.needs_human_review,
            isFallback,
          });

          if (structured.needs_human_review) {
            summary.flaggedExams.push({
              examId: target.id,
              type: cType,
              reason: structured.review_reason || 'Low confidence score or incomplete sections.',
            });
          }

          fetchSucceeded = true;
          break; // Stop candidate loop on first success
        }

        if (!fetchSucceeded && candidateUrls.length > 0) {
          const alreadyLogged = summary.skippedNotFoundOrBlocked.some(
            (s) => s.examId === target.id && s.type === cType
          );
          if (!alreadyLogged) {
            summary.skippedNotFoundOrBlocked.push({
              examId: target.id,
              type: cType,
              reason: 'All candidate official URLs failed or returned non-parsable content. Manual review needed.',
            });
            summary.flaggedExams.push({
              examId: target.id,
              type: cType,
              reason: 'All candidate source URLs failed to return valid content.',
            });
          }
        }
      }

      // Update exam success counts
      if (examHadOfficialSuccess) {
        summary.examStatusCounts.officialSuccess++;
      } else if (examHadFallbackSuccess) {
        summary.examStatusCounts.fallbackSuccess++;
      } else {
        summary.examStatusCounts.failed++;
      }

      // Task 2C: CBT Practice Test Bucket Generation
      // Built FROM PYQ + Question Bank records already stored (derived view, not scraped)
      if (
        (options.type === 'all' || options.type === 'cbt') &&
        target.examType !== 'descriptive'
      ) {
        try {
          const [storedPyq, storedQb] = await Promise.all([
            getContentRecord(target.id, 'pyq'),
            getContentRecord(target.id, 'question_bank'),
          ]);

          const pyqQuestions = storedPyq?.questions || [];
          const qbQuestions = storedQb?.questions || [];

          if (pyqQuestions.length > 0 || qbQuestions.length > 0) {
            const cbtContent = buildCbtPracticeTestSet({
              examId: target.id,
              sourcePyqs: pyqQuestions,
              sourceQb: qbQuestions,
            });

            if (!options.dryRun) {
              const saveRes = await saveContentRecord(cbtContent);
              summary.storageStats.totalBytesAdded += saveRes.bytesAdded;
              summary.storageStats.examSizes[target.id] =
                (summary.storageStats.examSizes[target.id] || 0) + saveRes.bytesAdded;
            }

            summary.questionsStoredPerExam[target.id].cbt += cbtContent.questions?.length || 0;
            summary.successfulFetches.push({
              examId: target.id,
              type: 'cbt',
              sourceUrl: 'internal://derived-cbt-mock',
              sectionCount: cbtContent.sections.length,
              questionCount: cbtContent.questions?.length || 0,
              confidence: 1.0,
              needsReview: false,
            });
          }
        } catch (_cbtErr) {}
      }
    }

    // Refresh overall Neon Postgres storage metrics
    const dbMetrics = await getStorageSizeMetrics();
    if (dbMetrics.totalBytes > 0) {
      summary.storageStats.examSizes = dbMetrics.examSizes;
      summary.storageStats.totalBytesAdded = dbMetrics.totalBytes;
      summary.storageStats.avgBytesPerExam = dbMetrics.avgBytesPerExam;
    } else {
      const examCount = Object.keys(summary.storageStats.examSizes).length;
      summary.storageStats.avgBytesPerExam =
        examCount > 0 ? Math.round(summary.storageStats.totalBytesAdded / examCount) : 0;
    }
  } finally {
    summary.finishedAt = new Date().toISOString();
    summary.domainRequestStats = getDomainStats();
    latestRunSummary = summary;
    isPipelineRunning = false;
  }

  return summary;
}
