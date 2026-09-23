import { queryPostgres } from '../postgres.js';

export interface QuestionPublicView {
  id: string;
  exam_id: string;
  subject: string;
  chapter?: string | null;
  topic?: string | null;
  subtopic?: string | null;
  question_type: string;
  question_text: string;
  passage_text?: string | null;
  assertion_text?: string | null;
  reason_text?: string | null;
  options: string[];
  marks: number;
  negative_marks: number;
  estimated_time_seconds?: number | null;
  verification_status: string;
  position?: number;
  selected_answer?: number | null;
  is_answered?: boolean;
  is_marked?: boolean;
  confidence_level?: string | null;
  time_spent_seconds?: number;
}

export interface QuestionInventorySummary {
  exam_id: string;
  total_count: number;
  verified_count: number;
  pending_review_count: number;
  by_subject: Record<string, { total: number; verified: number; pending: number }>;
}

/**
 * Audit question inventory for an exam or topic.
 * Strictly truthful: never fabricates counts or hides status.
 */
export async function getQuestionInventory(examId: string): Promise<QuestionInventorySummary> {
  const res = await queryPostgres(
    `SELECT
       exam_id,
       subject,
       verification_status,
       COUNT(*) as count
     FROM questions
     WHERE exam_id = $1
     GROUP BY exam_id, subject, verification_status;`,
    [examId]
  );

  let total = 0;
  let verified = 0;
  let pending = 0;
  const by_subject: Record<string, { total: number; verified: number; pending: number }> = {};

  for (const row of res.rows) {
    const c = parseInt(row.count, 10);
    const subj = row.subject || 'General Studies';
    const status = row.verification_status;

    total += c;
    if (status === 'verified') verified += c;
    else if (status === 'pending_review') pending += c;

    if (!by_subject[subj]) {
      by_subject[subj] = { total: 0, verified: 0, pending: 0 };
    }
    by_subject[subj].total += c;
    if (status === 'verified') by_subject[subj].verified += c;
    else if (status === 'pending_review') by_subject[subj].pending += c;
  }

  return {
    exam_id: examId,
    total_count: total,
    verified_count: verified,
    pending_review_count: pending,
    by_subject
  };
}

/**
 * Question Generator Service.
 * Respects strict inventory boundaries: fails fast with exact inventory if insufficient questions exist.
 * Never inserts mock/fake questions.
 */
export async function generateExamQuestions(params: {
  examId: string;
  count: number;
  mode?: string;
  subject?: string;
  topic?: string;
  difficulty?: string;
  allowPendingReview?: boolean;
}): Promise<{
  can_generate: boolean;
  available_count: number;
  question_ids: string[];
  reason?: string;
}> {
  const { examId, count, subject, topic, difficulty, allowPendingReview = false } = params;

  // Build query with strict status filter
  const conditions: string[] = ['exam_id = $1'];
  const values: any[] = [examId];
  let paramIdx = 2;

  if (!allowPendingReview) {
    conditions.push(`verification_status = 'verified'`);
  } else {
    conditions.push(`verification_status IN ('verified', 'pending_review')`);
  }

  if (subject && subject !== 'All Subjects') {
    conditions.push(`subject = $${paramIdx++}`);
    values.push(subject);
  }

  if (topic && topic !== 'All Topics') {
    conditions.push(`topic = $${paramIdx++}`);
    values.push(topic);
  }

  if (difficulty && difficulty !== 'All') {
    conditions.push(`difficulty = $${paramIdx++}`);
    values.push(difficulty);
  }

  const whereClause = conditions.join(' AND ');

  // Count available
  const countRes = await queryPostgres(
    `SELECT COUNT(*) as cnt FROM questions WHERE ${whereClause};`,
    values
  );
  const availableCount = parseInt(countRes.rows[0]?.cnt || '0', 10);

  if (availableCount < count) {
    return {
      can_generate: false,
      available_count: availableCount,
      question_ids: [],
      reason: `Insufficient question inventory for exam ${examId}. Requested ${count}, but only ${availableCount} available with status ${allowPendingReview ? 'verified/pending_review' : 'verified'}.`
    };
  }

  // Sample requested number using RANDOM()
  const qRes = await queryPostgres(
    `SELECT id FROM questions
     WHERE ${whereClause}
     ORDER BY RANDOM()
     LIMIT $${paramIdx};`,
    [...values, count]
  );

  const questionIds = qRes.rows.map((r: any) => r.id);

  return {
    can_generate: true,
    available_count: availableCount,
    question_ids: questionIds
  };
}
