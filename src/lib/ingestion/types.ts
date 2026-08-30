// ============================================================
// UNIVERSAL INGESTION PIPELINE — SHARED TYPES
// ============================================================

export type IngestionSourceType =
  | 'pdf_native'      // Native text PDF
  | 'pdf_scanned'     // Scanned PDF (needs OCR)
  | 'image'           // PNG/JPG screenshot
  | 'docx'            // Word document
  | 'txt'             // Plain text
  | 'json'            // Existing JSON records
  | 'pasted_text';    // User-pasted raw text

export type ExamId = 'NEET_UG' | 'NDA_NA' | 'UPSC_CSE' | 'SSC_CGL' | string;

export type QualityStatus =
  | 'auto_publish'    // score >= 90
  | 'needs_repair'    // score 75–89 (auto-repair attempt)
  | 'review'          // score < 75
  | 'corrupted'       // critical failure — never publish
  | 'rejected';       // duplicate or exam mismatch

export interface SourceMeta {
  sourceDocument: string;
  sourcePage?: number;
  sourceQuestionNumber?: number;
  sourceUrl?: string;
  sourceType: IngestionSourceType;
  sourceYear?: number;
  sourceShift?: string;
  ingestionTimestamp: string;
}

export interface RawExtractedQuestion {
  /** Raw extracted text before any repair */
  rawQuestionText: string;
  rawOptions: string[];
  rawAnswer?: string | number;       // As extracted from source
  rawSubject?: string;
  rawTopic?: string;
  rawYear?: string | number;
  rawExam?: string;
  sourceMeta: SourceMeta;
  ocrConfidence?: number;            // 0–1
  extractionMethod: 'native_pdf' | 'ocr' | 'gemini_vision' | 'text_parse';
}

export interface QualityBreakdown {
  readability: number;           // 0–20
  optionCompleteness: number;    // 0–20
  answerValidity: number;        // 0–20
  subjectConfidence: number;     // 0–15
  topicConfidence: number;       // 0–10
  mathRepairConfidence: number;  // 0–10
  boundaryConfidence: number;    // 0–5
  totalScore: number;            // 0–100
  criticalFailures: string[];    // reasons to never publish
  warnings: string[];
}

export interface RepairedQuestion {
  id: string;
  exam: ExamId;
  questionText: string;
  options: string[];              // Always 4
  correctOption: number | null;   // 0–3, or null if unverified
  answerVerified: boolean;
  subject: string;
  topic: string;
  year: number | null;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  stage: 'Prelims' | 'Mains' | 'Tier-1' | 'Tier-2';
  explanation?: string;
  qualityScore: number;
  qualityStatus: QualityStatus;
  qualityBreakdown: QualityBreakdown;
  qualityFlags: string[];
  mathRepaired: boolean;
  repairAttempts: number;
  sourceMeta: SourceMeta;
  isDuplicate: boolean;
  duplicateOf?: string;
  contentHash: string;            // MD5 of normalized question+options
}

export interface IngestionReport {
  jobId: string;
  sourceDocument: string;
  sourceType: IngestionSourceType;
  exam: ExamId;
  startedAt: string;
  completedAt?: string;
  status: 'processing' | 'complete' | 'failed';

  // Counts
  detected: number;
  autoRepaired: number;
  published: number;
  duplicatesRemoved: number;
  sentToReview: number;
  rejected: number;

  averageQualityScore: number;
  questions: RepairedQuestion[];
  reviewQueue: RepairedQuestion[];
  rejectedQueue: RepairedQuestion[];

  errors: string[];
}

export interface IngestionJobStatus {
  jobId: string;
  status: 'queued' | 'extracting' | 'repairing' | 'scoring' | 'deduplicating' | 'publishing' | 'processing' | 'complete' | 'failed';
  progress: number;              // 0–100
  currentStep: string;
  detected: number;
  processed: number;
  published: number;
  startedAt: string;
  error?: string;
}
