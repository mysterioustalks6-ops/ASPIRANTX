// ============================================================================
// CANONICAL CONTENT STORE (NEON POSTGRESQL PRIMARY + LOCAL CACHE FALLBACK)
// Production authority is strictly Neon Postgres via existing raw pg client
// ============================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { queryPostgres, pgPool } from '../postgres.js';
import type { ContentType, StructuredExamContent, QuestionRecord, ReviewStatus } from './types.js';

const LOCAL_CACHE_DIR = path.resolve(process.cwd(), 'data');
const LOCAL_CACHE_FILE = path.join(LOCAL_CACHE_DIR, 'exam_content.json');

// Normalize string for deduplication (trim, lowercase, whitespace collapsed)
export function normalizeStringStem(str: string): string {
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

// Compute deterministic SHA-256 hash for a question stem
export function hashQuestionStem(stem: string): string {
  const normalized = normalizeStringStem(stem);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

// Ensure local cache directory exists for offline fallback
function ensureLocalCacheFile(): void {
  try {
    if (!fs.existsSync(LOCAL_CACHE_DIR)) {
      fs.mkdirSync(LOCAL_CACHE_DIR, { recursive: true });
    }
    if (!fs.existsSync(LOCAL_CACHE_FILE)) {
      fs.writeFileSync(LOCAL_CACHE_FILE, JSON.stringify({}, null, 2), 'utf-8');
    }
  } catch (_e) {}
}

function readLocalCache(): Record<string, StructuredExamContent> {
  ensureLocalCacheFile();
  try {
    const raw = fs.readFileSync(LOCAL_CACHE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function writeLocalCache(record: StructuredExamContent): void {
  ensureLocalCacheFile();
  try {
    const cache = readLocalCache();
    const key = `${record.exam_id}::${record.type}`;
    cache[key] = record;
    fs.writeFileSync(LOCAL_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch (_e) {}
}

/**
 * Initializes the canonical exam_content table in Neon Postgres if not present.
 * Ensures status column and questions column exist.
 */
export async function initContentTable(): Promise<void> {
  if (!pgPool) return;

  const ddl = `
    CREATE TABLE IF NOT EXISTS exam_content (
      exam_id VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL,
      source_url TEXT NOT NULL,
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      confidence_score NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
      needs_human_review BOOLEAN NOT NULL DEFAULT FALSE,
      review_reason TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'pending_review',
      sections JSONB NOT NULL DEFAULT '[]'::jsonb,
      questions JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (exam_id, type)
    );

    ALTER TABLE exam_content ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'pending_review';
    ALTER TABLE exam_content ADD COLUMN IF NOT EXISTS questions JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE exam_content ADD COLUMN IF NOT EXISTS content_usage VARCHAR(50) NOT NULL DEFAULT 'structured_factual_information';
    ALTER TABLE exam_content ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) NOT NULL DEFAULT 'needs_rights_review';
    ALTER TABLE exam_content ADD COLUMN IF NOT EXISTS provenance JSONB NOT NULL DEFAULT '{}'::jsonb;
    ALTER TABLE exam_content ADD COLUMN IF NOT EXISTS factual_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

    CREATE INDEX IF NOT EXISTS idx_exam_content_freshness 
      ON exam_content (exam_id, type, fetched_at);

    CREATE INDEX IF NOT EXISTS idx_exam_content_status
      ON exam_content (exam_id, status);
  `;

  try {
    await queryPostgres(ddl);
  } catch (err: any) {
    console.warn('[AutoFetch Store] Could not initialize/migrate exam_content in Neon Postgres:', err.message);
  }
}

/**
 * Retrieves the canonical structured record for an exam from Neon Postgres.
 * Falls back to local offline JSON cache only if Neon is unreachable.
 */
export async function getContentRecord(
  examId: string,
  type: ContentType
): Promise<StructuredExamContent | null> {
  if (pgPool) {
    try {
      const res = await queryPostgres(
        `SELECT exam_id, type, source_url, fetched_at, confidence_score, needs_human_review, review_reason, status, sections, questions,
                content_usage, verification_status, provenance, factual_metadata
         FROM exam_content
         WHERE exam_id = $1 AND type = $2
         LIMIT 1`,
        [examId, type]
      );

      if (res.rows.length > 0) {
        const row = res.rows[0];
        const record: StructuredExamContent = {
          exam_id: row.exam_id,
          type: row.type as ContentType,
          source_url: row.source_url,
          fetched_at: new Date(row.fetched_at).toISOString(),
          confidence_score: parseFloat(row.confidence_score) || 1.0,
          needs_human_review: Boolean(row.needs_human_review),
          review_reason: row.review_reason || undefined,
          status: (row.status as ReviewStatus) || 'pending_review',
          content_usage: row.content_usage || (row.type === 'syllabus' ? 'structured_factual_information' : 'verbatim_exam_content'),
          verification_status: row.verification_status || 'needs_rights_review',
          provenance: typeof row.provenance === 'string' ? JSON.parse(row.provenance) : (row.provenance || undefined),
          factual_metadata: typeof row.factual_metadata === 'string' ? JSON.parse(row.factual_metadata) : (row.factual_metadata || undefined),
          sections: typeof row.sections === 'string' ? JSON.parse(row.sections) : (row.sections || []),
          questions: typeof row.questions === 'string' ? JSON.parse(row.questions) : (row.questions || []),
        };
        writeLocalCache(record);
        return record;
      }
      return null;
    } catch (err: any) {
      console.warn(`[AutoFetch Store] Neon Postgres read failed for ${examId}/${type}:`, err.message);
    }
  }

  // Fallback to local offline cache
  const cache = readLocalCache();
  const key = `${examId}::${type}`;
  return cache[key] || null;
}

/**
 * Checks whether an exam record is fresh (newer than maxAgeDays).
 */
export async function isContentFresh(
  examId: string,
  type: ContentType,
  maxAgeDays = 30
): Promise<{ isFresh: boolean; record: StructuredExamContent | null; ageDays: number }> {
  const record = await getContentRecord(examId, type);
  if (!record || !record.fetched_at) {
    return { isFresh: false, record: null, ageDays: Infinity };
  }

  const fetchTime = new Date(record.fetched_at).getTime();
  const ageMs = Date.now() - fetchTime;
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

  return {
    isFresh: ageDays < maxAgeDays,
    record,
    ageDays,
  };
}

/**
 * Saves or updates canonical structured record with deduplication.
 * Guarantees status = 'pending_review' on all new fetched records.
 */
export async function saveContentRecord(
  content: StructuredExamContent
): Promise<{ duplicatesSkipped: { syllabusTopics: number; questions: number }; bytesAdded: number }> {
  // Ensure status is pending_review if not explicitly approved
  if (!content.status) {
    content.status = 'pending_review';
  }

  let dupQuestionsCount = 0;
  let dupTopicsCount = 0;

  // Retrieve existing record to perform deduplication
  const existing = await getContentRecord(content.exam_id, content.type);

  // 1. Question Deduplication using Question Hash
  if (Array.isArray(content.questions) && content.questions.length > 0) {
    const existingQuestionHashes = new Set<string>();
    if (existing?.questions && Array.isArray(existing.questions)) {
      for (const q of existing.questions) {
        if (q.question_hash) existingQuestionHashes.add(q.question_hash);
      }
    }

    const uniqueQuestions: QuestionRecord[] = [];
    for (const q of content.questions) {
      const qHash = q.question_hash || hashQuestionStem(q.question_text);
      q.question_hash = qHash;
      if (existingQuestionHashes.has(qHash)) {
        dupQuestionsCount++;
      } else {
        existingQuestionHashes.add(qHash);
        uniqueQuestions.push(q);
      }
    }
    // Merge existing questions if any
    content.questions = [
      ...(existing?.questions || []).filter((eq) => !uniqueQuestions.some((uq) => uq.question_hash === eq.question_hash)),
      ...uniqueQuestions,
    ];
  }

  // 2. Syllabus Section / Topic Deduplication
  if (content.type === 'syllabus' && Array.isArray(content.sections)) {
    const seenTopics = new Set<string>();
    if (existing?.sections && Array.isArray(existing.sections)) {
      for (const sec of existing.sections) {
        for (const top of sec.topics || []) {
          seenTopics.add(normalizeStringStem(top));
        }
      }
    }

    const deduplicatedSections = content.sections.map((sec) => {
      const uniqueSecTopics: string[] = [];
      for (const top of sec.topics || []) {
        const norm = normalizeStringStem(top);
        if (seenTopics.has(norm)) {
          dupTopicsCount++;
        } else {
          seenTopics.add(norm);
          uniqueSecTopics.push(top.trim());
        }
      }
      return {
        ...sec,
        topics: uniqueSecTopics,
      };
    });
    content.sections = deduplicatedSections;
  }

  // Calculate approximate payload size in bytes
  const serialized = JSON.stringify({ sections: content.sections, questions: content.questions });
  const bytesAdded = Buffer.byteLength(serialized, 'utf-8');

  // Mirror to local cache for offline fallback
  writeLocalCache(content);

  // Persist to Neon Postgres
  if (pgPool) {
    try {
      const sql = `
        INSERT INTO exam_content (
          exam_id,
          type,
          source_url,
          fetched_at,
          confidence_score,
          needs_human_review,
          review_reason,
          status,
          sections,
          questions,
          content_usage,
          verification_status,
          provenance,
          factual_metadata,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        ON CONFLICT (exam_id, type) DO UPDATE SET
          source_url = EXCLUDED.source_url,
          fetched_at = EXCLUDED.fetched_at,
          confidence_score = EXCLUDED.confidence_score,
          needs_human_review = EXCLUDED.needs_human_review,
          review_reason = EXCLUDED.review_reason,
          status = EXCLUDED.status,
          sections = EXCLUDED.sections,
          questions = EXCLUDED.questions,
          content_usage = EXCLUDED.content_usage,
          verification_status = EXCLUDED.verification_status,
          provenance = EXCLUDED.provenance,
          factual_metadata = EXCLUDED.factual_metadata,
          updated_at = NOW();
      `;

      const usage = content.content_usage || (content.type === 'syllabus' ? 'structured_factual_information' : 'verbatim_exam_content');
      const rightsStatus = content.verification_status || 'needs_rights_review';

      await queryPostgres(sql, [
        content.exam_id,
        content.type,
        content.source_url,
        content.fetched_at,
        content.confidence_score,
        content.needs_human_review,
        content.review_reason || null,
        content.status,
        JSON.stringify(content.sections),
        JSON.stringify(content.questions || []),
        usage,
        rightsStatus,
        JSON.stringify(content.provenance || {}),
        JSON.stringify(content.factual_metadata || {}),
      ]);
    } catch (err: any) {
      console.warn(`[AutoFetch Store] Neon Postgres upsert failed for ${content.exam_id}/${content.type}:`, err.message);
    }
  }

  return {
    duplicatesSkipped: {
      syllabusTopics: dupTopicsCount,
      questions: dupQuestionsCount,
    },
    bytesAdded,
  };
}

/**
 * Returns stored content types for a given exam.
 * By default (approvedOnly: true), only returns records with status = 'approved'.
 * This guarantees the public app never serves unverified pending_review content!
 */
export async function getAllStoredExamContent(
  examId: string,
  options: { approvedOnly?: boolean } = { approvedOnly: true }
): Promise<{
  syllabus: StructuredExamContent | null;
  pyq: StructuredExamContent | null;
  question_bank: StructuredExamContent | null;
  cbt: StructuredExamContent | null;
}> {
  const [syllabus, pyq, question_bank, cbt] = await Promise.all([
    getContentRecord(examId, 'syllabus'),
    getContentRecord(examId, 'pyq'),
    getContentRecord(examId, 'question_bank'),
    getContentRecord(examId, 'cbt'),
  ]);

  const filterStatus = (item: StructuredExamContent | null): StructuredExamContent | null => {
    if (!item) return null;
    if (options.approvedOnly && item.status !== 'approved') {
      return null;
    }
    return item;
  };

  return {
    syllabus: filterStatus(syllabus),
    pyq: filterStatus(pyq),
    question_bank: filterStatus(question_bank),
    cbt: filterStatus(cbt),
  };
}

/**
 * Retrieves total table storage size and per-exam storage metrics from Neon Postgres.
 */
export async function getStorageSizeMetrics(): Promise<{
  totalBytes: number;
  totalExamsWithContent: number;
  examSizes: Record<string, number>;
  avgBytesPerExam: number;
}> {
  const result = {
    totalBytes: 0,
    totalExamsWithContent: 0,
    examSizes: {} as Record<string, number>,
    avgBytesPerExam: 0,
  };

  if (!pgPool) {
    return result;
  }

  try {
    const sizeRes = await queryPostgres(`
      SELECT 
        exam_id,
        SUM(pg_column_size(sections) + pg_column_size(questions)) AS bytes
      FROM exam_content
      GROUP BY exam_id
      ORDER BY bytes DESC
    `);

    for (const row of sizeRes.rows) {
      const b = parseInt(row.bytes, 10) || 0;
      result.examSizes[row.exam_id] = b;
      result.totalBytes += b;
    }

    result.totalExamsWithContent = sizeRes.rows.length;
    result.avgBytesPerExam =
      result.totalExamsWithContent > 0
        ? Math.round(result.totalBytes / result.totalExamsWithContent)
        : 0;
  } catch (err: any) {
    console.warn('[AutoFetch Store] Could not compute storage metrics from Neon Postgres:', err.message);
  }

  return result;
}
