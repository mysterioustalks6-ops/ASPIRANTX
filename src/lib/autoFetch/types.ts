// ============================================================================
// AUTONOMOUS EXAM DATA AUTO-FETCH AGENT — TYPES & INTERFACES
// ============================================================================

export type ContentType = 'syllabus' | 'pyq' | 'question_bank' | 'cbt';
export type ReviewStatus = 'pending_review' | 'approved' | 'rejected';
export type ContentUsage = 'structured_factual_information' | 'verbatim_exam_content';

export interface QuestionRecord {
  id?: string;
  question_hash: string; // SHA256 of normalized question stem
  question_text: string;
  content_type: 'pyq' | 'question_bank' | 'cbt';
  exam_id: string;
  exam_stage: string; // e.g. "Prelims", "Mains", "Tier 1", "Tier 2"
  year?: number; // Mandatory for PYQs
  paper?: string; // e.g. "GS Paper 1", "General Studies", "Paper 1"
  chapter: string;
  topic: string;
  subtopic?: string;
  language?: string; // 'en' | 'hi'
  is_objective: boolean; // true for MCQ, false for descriptive
  options?: string[]; // Normalized options for MCQ
  correct_option?: number | string; // Index 0..3 or option text
  solution_text?: string;
  source_url: string;
}

export interface ContentSection {
  title: string;
  chapter?: string;
  topics: string[];
  subtopics?: string[];
  year?: number;
  paper?: string;
  exam_stage?: string;
  questions?: QuestionRecord[];
}

export type VerificationRightsStatus =
  | 'verified'
  | 'needs_rights_review'
  | 'restricted'
  | 'invalid_placeholder'
  | 'legacy_fallback'
  | 'not_found_official'
  | 'blocked'
  | 'needs_ocr_or_manual'
  | 'extraction_failed';

export interface SourceProvenance {
  source_url: string;
  document_url?: string;
  publisher: string;
  document_title: string;
  retrieved_at: string;
  document_hash?: string;
  source_type: string;
}

export interface FactualExamPattern {
  exam_id: string;
  stage: string;
  question_count: number;
  duration_minutes: number;
  total_marks: number;
  negative_marking: number | string;
  marking_scheme_description?: string;
  eligibility_facts?: string[];
  sections_summary?: Array<{
    name: string;
    questions: number;
    marks: number;
  }>;
}

export interface StructuredExamContent {
  exam_id: string;
  type: ContentType;
  source_url: string;
  fetched_at: string; // ISO 8601 string
  confidence_score: number; // 0.0 - 1.0
  needs_human_review: boolean;
  review_reason?: string;
  status: ReviewStatus; // Strictly 'pending_review' on fetch
  content_usage?: ContentUsage; // 'structured_factual_information' vs 'verbatim_exam_content'
  verification_status?: VerificationRightsStatus; // 'verified' | 'needs_rights_review' | 'restricted'
  provenance?: SourceProvenance;
  factual_metadata?: FactualExamPattern;
  sections: ContentSection[];
  questions?: QuestionRecord[];
}

export interface ExamTarget {
  id: string;
  name: string;
  category: string;
  conductingBody: string;
  officialDomain: string;
  officialSyllabusUrls: string[];
  officialPyqUrls: string[];
  fallbackSyllabusUrls?: string[];
  openQuestionBankUrls?: string[];
  examType?: 'objective' | 'descriptive' | 'combo';
  stages?: string[]; // ['Prelims', 'Mains'] etc.
}

export interface DomainRateTracker {
  hostname: string;
  lastRequestTimeMs: number;
  totalRequests: number;
  blockedCount: number;
}

export interface RobotsRule {
  domain: string;
  disallowedPaths: string[];
  allowedPaths: string[];
  crawlDelaySeconds?: number;
  fetchedAt: number;
}

export interface FetchResult {
  url: string;
  contentType: string; // 'html' | 'pdf'
  buffer?: Buffer;
  text?: string;
  statusCode: number;
  error?: string;
  isBlockedOrRateLimited?: boolean;
}

export interface PipelineExecutionOptions {
  examId?: string; // target single exam or undefined for all
  type?: 'syllabus' | 'pyq' | 'question_bank' | 'cbt' | 'all';
  mode?: 'batch' | 'on-demand';
  freshnessDays?: number; // default 30
  force?: boolean; // bypass 30-day freshness check
  dryRun?: boolean; // do not commit to DB
  customDelayMs?: number; // override default 2500ms delay
}

export interface QARejectionReport {
  garbledText: number;
  mismatchedAnswers: number;
  blankYearOrStage: number;
  idInconsistencies: number;
  spellingInconsistencies: number;
  details: Array<{
    examId: string;
    type: ContentType;
    reason: string;
    sample?: string;
  }>;
}

export interface AgentRunSummary {
  runId: string;
  startedAt: string;
  finishedAt: string;
  mode: 'batch' | 'on-demand';
  totalExamTargetsEvaluated: number;
  examStatusCounts: {
    officialSuccess: number;
    fallbackSuccess: number;
    failed: number;
  };
  successfulFetches: Array<{
    examId: string;
    type: ContentType;
    sourceUrl: string;
    sectionCount: number;
    questionCount: number;
    confidence: number;
    needsReview: boolean;
    isFallback?: boolean;
  }>;
  skippedFresh: Array<{
    examId: string;
    type: ContentType;
    lastFetchedAt: string;
    ageDays: number;
  }>;
  skippedNotFoundOrBlocked: Array<{
    examId: string;
    type: ContentType;
    reason: string;
  }>;
  rejectedCopyrightOrPaid: Array<{
    examId: string;
    type: ContentType;
    url: string;
    reason: string;
  }>;
  duplicatesSkipped: {
    syllabusTopics: number;
    questions: number;
  };
  storageStats: {
    totalBytesAdded: number;
    avgBytesPerExam: number;
    examSizes: Record<string, number>;
  };
  qaRejections: QARejectionReport;
  questionsStoredPerExam: Record<
    string,
    { pyq: number; question_bank: number; cbt: number; syllabusSections: number }
  >;
  flaggedExams: Array<{
    examId: string;
    type: ContentType;
    reason: string;
  }>;
  domainRequestStats: Record<string, { requests: number; minDelayEnforcedMs: number }>;
}
