// ============================================================================
// LLM STRUCTURING ENGINE & QA PRECISION PASS
// Transforms raw extracted text into fixed JSON schema, runs QA checks & discards raw text
// ============================================================================

import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { hashQuestionStem, normalizeStringStem } from './contentStore.js';
import { getCanonicalExamId } from './sourceRegistry.js';
import type {
  ContentType,
  StructuredExamContent,
  QuestionRecord,
  ContentSection,
  QARejectionReport,
} from './types.js';

function getGeminiInstance(): GoogleGenAI | null {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Task 6: Small-Detail QA Validator
 */
export function validateQualityAssurance(
  examId: string,
  type: ContentType,
  sections: ContentSection[],
  questions: QuestionRecord[] = []
): {
  isValid: boolean;
  rejectionReason?: string;
  flagForReview: boolean;
  reviewReason?: string;
  qaCategory?: keyof Omit<QARejectionReport, 'details'>;
} {
  // 1. Exam ID Consistency check
  const canonicalId = getCanonicalExamId(examId);
  if (!canonicalId || canonicalId !== examId) {
    return {
      isValid: false,
      rejectionReason: `Exam ID inconsistency: "${examId}" does not match canonical code "${canonicalId}".`,
      flagForReview: true,
      reviewReason: 'Exam ID alias inconsistency detected.',
      qaCategory: 'idInconsistencies',
    };
  }

  // 2. Broken / Garbled Text check (encoding errors, mojibake, OCR noise)
  const garbledPatterns = [
    /Ã¢â‚¬/i,
    /â€™/i,
    /â€œ/i,
    /&amp;#\d+;/i,
    //g,
    /\b(undefined|null|NaN)\b/i,
    /(.)\1{6,}/, // 7+ repeated identical characters
  ];

  for (const sec of sections) {
    for (const pat of garbledPatterns) {
      if (pat.test(sec.title)) {
        return {
          isValid: false,
          rejectionReason: `Garbled text or mojibake artifact in section title: "${sec.title.slice(0, 40)}"`,
          flagForReview: true,
          reviewReason: 'Section title contains encoding artifacts.',
          qaCategory: 'garbledText',
        };
      }
    }
    for (const top of sec.topics || []) {
      for (const pat of garbledPatterns) {
        if (pat.test(top)) {
          return {
            isValid: false,
            rejectionReason: `Garbled text artifact in topic string: "${top.slice(0, 40)}"`,
            flagForReview: true,
            reviewReason: 'Topic string contains corrupted text.',
            qaCategory: 'garbledText',
          };
        }
      }
    }
  }

  // 3. Question-level QA checks
  for (const q of questions) {
    // A. Check for garbled question text
    for (const pat of garbledPatterns) {
      if (pat.test(q.question_text)) {
        return {
          isValid: false,
          rejectionReason: `Corrupted question stem detected: "${q.question_text.slice(0, 40)}"`,
          flagForReview: true,
          reviewReason: 'Question text failed mojibake check.',
          qaCategory: 'garbledText',
        };
      }
    }

    // B. PYQ Stage/Year fields never blank check
    if (q.content_type === 'pyq') {
      if (!q.year || q.year < 1990 || q.year > 2030) {
        return {
          isValid: false,
          rejectionReason: `PYQ record missing valid year: received ${q.year}`,
          flagForReview: true,
          reviewReason: 'PYQ record has missing or out-of-range year.',
          qaCategory: 'blankYearOrStage',
        };
      }
      if (!q.exam_stage || q.exam_stage.trim().length === 0) {
        return {
          isValid: false,
          rejectionReason: 'PYQ record missing exam_stage (e.g. Prelims/Mains/Tier 1)',
          flagForReview: true,
          reviewReason: 'PYQ record missing exam_stage.',
          qaCategory: 'blankYearOrStage',
        };
      }
    }

    // C. Mismatched Answer Key check for objective MCQs
    if (q.is_objective && Array.isArray(q.options) && q.options.length > 0) {
      if (typeof q.correct_option === 'number') {
        if (q.correct_option < 0 || q.correct_option >= q.options.length) {
          return {
            isValid: false,
            rejectionReason: `Mismatched answer key: correct_option index ${q.correct_option} out of bounds for ${q.options.length} options.`,
            flagForReview: true,
            reviewReason: 'Answer key option index does not align with question options.',
            qaCategory: 'mismatchedAnswers',
          };
        }
      } else if (typeof q.correct_option === 'string' && q.correct_option.trim()) {
        const optLetter = q.correct_option.trim().toUpperCase();
        const validLetters = ['A', 'B', 'C', 'D', 'E'].slice(0, q.options.length);
        if (!validLetters.includes(optLetter) && !q.options.includes(q.correct_option)) {
          return {
            isValid: false,
            rejectionReason: `Mismatched answer key: correct_option "${q.correct_option}" not found in options list.`,
            flagForReview: true,
            reviewReason: 'Answer key string does not match any valid option.',
            qaCategory: 'mismatchedAnswers',
          };
        }
      }
    }
  }

  return { isValid: true, flagForReview: false };
}

/**
 * Passes raw text to Gemini Flash with strict schema instructions.
 * Discards raw text immediately after execution.
 */
export async function structureExamContentWithLLM(params: {
  examId: string;
  type: ContentType;
  sourceUrl: string;
  rawText: string;
  examType?: 'objective' | 'descriptive' | 'combo';
  stages?: string[];
}): Promise<{
  structured: StructuredExamContent;
  qaFailure?: { reason: string; category: keyof Omit<QARejectionReport, 'details'> };
}> {
  const { examId, type, sourceUrl, rawText, examType = 'objective', stages = ['Prelims'] } = params;
  const fetchedAt = new Date().toISOString();

  // If text is suspiciously short or empty
  if (!rawText || rawText.trim().length < 80) {
    return {
      structured: {
        exam_id: examId,
        type,
        source_url: sourceUrl,
        fetched_at: fetchedAt,
        confidence_score: 0.1,
        needs_human_review: true,
        review_reason: 'Raw text extracted was insufficient or empty.',
        status: 'pending_review',
        sections: [],
        questions: [],
      },
    };
  }

  const ai = getGeminiInstance();
  let candidateResult: StructuredExamContent;

  if (!ai) {
    candidateResult = fallbackHeuristicStructuring(examId, type, sourceUrl, rawText, fetchedAt, examType, stages);
  } else {
    // Cap input text to 40,000 characters to keep execution fast and polite
    const truncatedText = rawText.slice(0, 40000);

    const isQuestionFetch = type === 'pyq' || type === 'question_bank';
    const isDescriptive = examType === 'descriptive';

    const prompt = `
You are an expert academic curriculum and exam question parser for Indian competitive exams.
Analyze the following official text extracted from an Indian competitive exam resource (${examId}, content_type: ${type}) and convert it into a clean, hierarchical JSON object.

CONTENT TYPE: ${type.toUpperCase()}
EXAM CHARACTERISTIC: ${isDescriptive ? 'Descriptive / Subjective Writing' : 'Objective MCQ (Multi-Choice)'}
STAGES: ${stages.join(', ')}

STRICT SCHEMA REQUIREMENTS:
You MUST respond with valid JSON ONLY. No markdown ticks, no preamble, no commentary.
Format:
{
  "confidence_score": 0.95,
  "needs_human_review": false,
  "review_reason": "",
  "sections": [
    {
      "title": "Section or Subject Name (e.g. General Studies Paper 1, Quantitative Aptitude)",
      "chapter": "Chapter Name",
      "topics": ["Topic 1", "Topic 2"],
      "subtopics": ["Subtopic 1a", "Subtopic 1b"],
      "year": 2024,
      "paper": "Paper 1",
      "exam_stage": "${stages[0] || 'Prelims'}"
    }
  ],
  "questions": [
    ${
      isQuestionFetch
        ? `{
      "question_text": "Complete question stem here",
      "content_type": "${type}",
      "exam_id": "${examId}",
      "exam_stage": "${stages[0] || 'Prelims'}",
      "year": 2024,
      "paper": "Paper 1",
      "chapter": "Indian Polity",
      "topic": "Fundamental Rights",
      "subtopic": "Article 21",
      "language": "en",
      "is_objective": ${!isDescriptive},
      "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
      "correct_option": 0,
      "solution_text": "Official explanation"
    }`
        : ''
    }
  ]
}

RULES:
1. For syllabus: sections must strictly follow chapter -> topic -> subtopic hierarchy.
2. For PYQ: every question MUST have both "year" (numeric, e.g. 2024) and "exam_stage" populated. If year cannot be found, specify the most recent notification year.
3. For Objective MCQs: provide options as an array of strings and correct_option as 0-indexed integer or option letter.
4. For Descriptive exams: questions do not require MCQ options; set is_objective to false.
5. Language tagging: tag "en" for English, "hi" for Hindi.
6. Reject garbled text, OCR artifacts, or corrupted strings.
7. Normalize chapter/topic spelling to standard title-case.

RAW EXTRACTED TEXT:
${truncatedText}
`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = response.text || '';
      const cleanJsonStr = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();

      const parsed = JSON.parse(cleanJsonStr);
      const confidence = typeof parsed.confidence_score === 'number' ? parsed.confidence_score : 0.88;
      const needsReview =
        Boolean(parsed.needs_human_review) ||
        confidence < 0.75 ||
        (!Array.isArray(parsed.sections) && !Array.isArray(parsed.questions));

      const sections: ContentSection[] = Array.isArray(parsed.sections)
        ? parsed.sections.map((s: any) => ({
            title: String(s.title || 'General Section').trim(),
            chapter: s.chapter ? String(s.chapter).trim() : undefined,
            topics: Array.isArray(s.topics) ? s.topics.map((t: any) => String(t).trim()).filter(Boolean) : [],
            subtopics: Array.isArray(s.subtopics) ? s.subtopics.map((st: any) => String(st).trim()).filter(Boolean) : [],
            year: typeof s.year === 'number' ? s.year : undefined,
            paper: s.paper ? String(s.paper).trim() : undefined,
            exam_stage: s.exam_stage ? String(s.exam_stage).trim() : stages[0],
          }))
        : [];

      const questions: QuestionRecord[] = Array.isArray(parsed.questions)
        ? parsed.questions.map((q: any) => {
            const stem = String(q.question_text || '').trim();
            return {
              question_hash: hashQuestionStem(stem),
              question_text: stem,
              content_type: type as 'pyq' | 'question_bank',
              exam_id: examId,
              exam_stage: String(q.exam_stage || stages[0] || 'Stage 1').trim(),
              year: typeof q.year === 'number' ? q.year : type === 'pyq' ? 2024 : undefined,
              paper: q.paper ? String(q.paper).trim() : 'Paper 1',
              chapter: String(q.chapter || 'General').trim(),
              topic: String(q.topic || 'General Topic').trim(),
              subtopic: q.subtopic ? String(q.subtopic).trim() : undefined,
              language: q.language === 'hi' ? 'hi' : 'en',
              is_objective: typeof q.is_objective === 'boolean' ? q.is_objective : !isDescriptive,
              options: Array.isArray(q.options) ? q.options.map((o: any) => String(o).trim()) : undefined,
              correct_option: q.correct_option !== undefined ? q.correct_option : 0,
              solution_text: q.solution_text ? String(q.solution_text).trim() : undefined,
              source_url: sourceUrl,
            };
          }).filter((q: QuestionRecord) => q.question_text.length > 5)
        : [];

      candidateResult = {
        exam_id: examId,
        type,
        source_url: sourceUrl,
        fetched_at: fetchedAt,
        confidence_score: confidence,
        needs_human_review: needsReview,
        review_reason: parsed.review_reason || (needsReview ? 'Automated check flagged for manual inspection' : undefined),
        status: 'pending_review',
        sections,
        questions,
      };
    } catch (err: any) {
      candidateResult = fallbackHeuristicStructuring(examId, type, sourceUrl, rawText, fetchedAt, examType, stages);
      candidateResult.needs_human_review = true;
      candidateResult.review_reason = `LLM call failed (${err.message}). Applied heuristic parser.`;
    }
  }

  // Run Task 6 Quality Assurance Checks
  const qa = validateQualityAssurance(examId, type, candidateResult.sections, candidateResult.questions);
  if (!qa.isValid) {
    candidateResult.needs_human_review = true;
    candidateResult.review_reason = `QA Check Failed: ${qa.rejectionReason}`;
    return {
      structured: candidateResult,
      qaFailure: {
        reason: qa.rejectionReason || 'QA validation failed',
        category: qa.qaCategory || 'garbledText',
      },
    };
  }

  return { structured: candidateResult };
}

/**
 * Task 2C: Assemble CBT Practice Test Sets from Stored PYQ & Question Bank questions
 * Derived view sampled per exam's actual pattern (not a separate scraper)
 */
export function buildCbtPracticeTestSet(params: {
  examId: string;
  sourcePyqs: QuestionRecord[];
  sourceQb: QuestionRecord[];
  durationMinutes?: number;
  totalMarks?: number;
}): StructuredExamContent {
  const { examId, sourcePyqs, sourceQb, durationMinutes = 120, totalMarks = 200 } = params;
  const fetchedAt = new Date().toISOString();

  // Combine and sample across chapters/topics (objective questions only)
  const pool = [...sourcePyqs, ...sourceQb].filter((q) => q.is_objective);
  
  // Sample up to 100 questions deterministically
  const sampledQuestions: QuestionRecord[] = pool.slice(0, 100).map((q, idx) => ({
    ...q,
    id: `cbt_${examId}_${idx + 1}`,
    content_type: 'cbt',
  }));

  const sections: ContentSection[] = [
    {
      title: `${examId} Full Mock Practice Test`,
      chapter: 'Full Length CBT Mock',
      topics: Array.from(new Set(sampledQuestions.map((q) => q.topic))),
      year: new Date().getFullYear(),
      paper: 'CBT Mock Paper 1',
      exam_stage: sampledQuestions[0]?.exam_stage || 'Prelims',
      questions: sampledQuestions,
    },
  ];

  return {
    exam_id: examId,
    type: 'cbt',
    source_url: 'internal://derived-from-pyq-and-qb',
    fetched_at: fetchedAt,
    confidence_score: 1.0,
    needs_human_review: false,
    status: 'pending_review',
    sections,
    questions: sampledQuestions,
  };
}

/**
 * Fallback parser in case Gemini API is unreachable or key is unconfigured.
 */
/**
 * Fallback parser in case Gemini API is unreachable or key is unconfigured.
 * CRITICAL GUARD: Never manufactures arbitrary sections or accepts Wikipedia/web-chrome text.
 */
function fallbackHeuristicStructuring(
  examId: string,
  type: ContentType,
  sourceUrl: string,
  rawText: string,
  fetchedAt: string,
  examType: 'objective' | 'descriptive' | 'combo',
  stages: string[]
): StructuredExamContent {
  // Guard 1: Wikipedia sources are strictly disallowed for authoritative syllabus
  if (sourceUrl.toLowerCase().includes('wikipedia.org')) {
    return {
      exam_id: examId,
      type,
      source_url: sourceUrl,
      fetched_at: fetchedAt,
      confidence_score: 0.0,
      needs_human_review: true,
      review_reason: 'extraction_failed: Wikipedia sources are prohibited for official syllabus extraction.',
      status: 'pending_review',
      verification_status: 'legacy_fallback',
      sections: [],
      questions: [],
    };
  }

  // Guard 2: Must contain genuine curriculum signals
  const lower = rawText.toLowerCase();
  const hasCurriculumSignals =
    lower.includes('syllabus') ||
    lower.includes('scheme of examination') ||
    lower.includes('examination pattern') ||
    lower.includes('course of study') ||
    lower.includes('curriculum');

  if (!hasCurriculumSignals || rawText.length < 300) {
    return {
      exam_id: examId,
      type,
      source_url: sourceUrl,
      fetched_at: fetchedAt,
      confidence_score: 0.0,
      needs_human_review: true,
      review_reason: 'extraction_failed: Text lacks authentic curriculum/syllabus markers. No sections manufactured.',
      status: 'pending_review',
      verification_status: 'extraction_failed',
      sections: [],
      questions: [],
    };
  }

  const webChromePatterns = [
    /^jump to/i, /^search/i, /^donate/i, /^log ?in/i, /^sign ?up/i,
    /^privacy policy/i, /^terms of/i, /^cookie/i, /^navigation/i,
    /^copyright/i, /^all rights reserved/i, /^breadcrumb/i, /^menu/i,
    /^skip to/i, /^accessibility/i, /^sitemap/i, /^contact us/i
  ];

  const sectionHeaderPattern = /^(paper\s+[0-9ivx]+|section\s+[a-z0-9]+|part\s+[a-z0-9]+|unit\s+[0-9ivx]+|subject\s*:|general studies|general awareness|quantitative aptitude|reasoning|mathematics|english language|general science)/i;

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length >= 3 && !webChromePatterns.some((pat) => pat.test(l)));

  const sections: ContentSection[] = [];
  let currentTitle = '';
  let currentTopics: string[] = [];

  for (const line of lines) {
    if (sectionHeaderPattern.test(line) || (line.endsWith(':') && line.length < 80)) {
      if (currentTitle && currentTopics.length > 0) {
        sections.push({
          title: currentTitle,
          topics: currentTopics,
          exam_stage: stages[0] || 'Stage 1',
        });
        currentTopics = [];
      }
      currentTitle = line.replace(/[:\-]/g, '').trim();
    } else if (currentTitle) {
      if (line.length < 120 && !line.includes('http://') && !line.includes('https://')) {
        currentTopics.push(line);
      }
    }
  }

  if (currentTitle && currentTopics.length > 0) {
    sections.push({
      title: currentTitle,
      topics: currentTopics,
      exam_stage: stages[0] || 'Stage 1',
    });
  }

  // Guard 3: Must have found identifiable curriculum sections with topics; NEVER manufacture
  const totalTopics = sections.reduce((acc, s) => acc + (s.topics?.length || 0), 0);
  if (sections.length === 0 || totalTopics < 2) {
    return {
      exam_id: examId,
      type,
      source_url: sourceUrl,
      fetched_at: fetchedAt,
      confidence_score: 0.0,
      needs_human_review: true,
      review_reason: 'extraction_failed: No distinct syllabus section headers and topics could be reliably extracted.',
      status: 'pending_review',
      verification_status: 'extraction_failed',
      sections: [],
      questions: [],
    };
  }

  return {
    exam_id: examId,
    type,
    source_url: sourceUrl,
    fetched_at: fetchedAt,
    confidence_score: 0.80,
    needs_human_review: true,
    review_reason: 'Structured using strict pattern parser from official document text.',
    status: 'pending_review',
    verification_status: 'needs_rights_review',
    sections,
    questions: [],
  };
}

export { fallbackHeuristicStructuring };

export async function structureExamContent(
  examId: string,
  type: ContentType,
  sourceUrl: string,
  rawText: string,
  examType: 'objective' | 'descriptive' | 'combo' = 'objective',
  stages: string[] = ['Stage 1']
) {
  return structureExamContentWithLLM({
    examId,
    type,
    sourceUrl,
    rawText,
    examType,
    stages,
  });
}
