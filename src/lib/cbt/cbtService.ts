import crypto from 'crypto';
import { queryPostgres, pgPool } from '../postgres.js';
import { generateExamQuestions, QuestionPublicView } from './questionGenerator.js';
import { RewardEngine } from '../rewards/rewardEngine.js';

export interface CbtAttemptSummary {
  id: string;
  user_id: string;
  exam_id: string;
  blueprint_id?: string | null;
  mode: string;
  title: string;
  status: 'IN_PROGRESS' | 'PAUSED' | 'SUBMITTED' | 'EXPIRED';
  duration_seconds: number;
  remaining_time_seconds: number;
  started_at: string;
  paused_at?: string | null;
  resumed_at?: string | null;
  expires_at: string;
  submitted_at?: string | null;
  current_question_index: number;
  total_questions: number;
}

export interface CbtAttemptWithQuestions extends CbtAttemptSummary {
  questions: QuestionPublicView[];
}

export interface CbtResultAnalysis {
  id: string;
  attempt_id: string;
  user_id: string;
  exam_id: string;
  score: number;
  max_possible_score: number;
  accuracy_percent: number;
  total_questions: number;
  attempted_count: number;
  unattempted_count: number;
  correct_count: number;
  incorrect_count: number;
  negative_marks_deducted: number;
  time_taken_seconds: number;
  subject_analysis: Record<string, any>;
  chapter_analysis: Record<string, any>;
  topic_analysis: Record<string, any>;
  confidence_analysis: Record<string, any>;
  weak_areas: Array<{ topic: string; subject: string; accuracy: number; questions_count: number }>;
  created_at: string;
}

export interface QuestionReviewItem extends QuestionPublicView {
  correct_answer: number;
  explanation?: string | null;
  option_explanations?: Record<string, string> | null;
  is_correct: boolean;
  mistake_category?: string | null;
  mistake_notes?: string | null;
}

/**
 * CBT Service: Authoritative business logic, concurrency-safe atomic operations,
 * zero-leak security projections.
 */
export class CbtService {
  /**
   * Create a new authoritative test attempt session.
   */
  static async createAttempt(params: {
    userId: string;
    examId: string;
    blueprintId?: string;
    mode?: string;
    title?: string;
    count?: number;
    allowPendingReview?: boolean;
    subject?: string;
    topic?: string;
  }): Promise<{ attempt: CbtAttemptSummary; questions: QuestionPublicView[] }> {
    const { userId, examId, blueprintId, subject, topic } = params;
    const mode = params.mode || (blueprintId ? 'full' : 'topic');
    const allowPendingReview = params.allowPendingReview ?? true; // defaults to true for mock/study suite

    let durationSeconds = 3600;
    let title = params.title || `${examId} Mock Exam`;
    let count = params.count || 20;

    // Load blueprint if provided
    if (blueprintId) {
      const bpRes = await queryPostgres(
        `SELECT * FROM cbt_blueprints WHERE id = $1;`,
        [blueprintId]
      );
      if (bpRes.rows.length > 0) {
        const bp = bpRes.rows[0];
        durationSeconds = bp.duration_seconds;
        title = bp.title;
        count = bp.total_questions;
      }
    }

    // Select questions
    const gen = await generateExamQuestions({
      examId,
      count,
      mode,
      subject,
      topic,
      allowPendingReview
    });

    if (!gen.can_generate || gen.question_ids.length === 0) {
      throw new Error(
        gen.reason || `Unable to generate exam. Insufficient inventory for ${examId}.`
      );
    }

    const attemptId = `att_${crypto.randomUUID()}`;

    // Execute insertion in a transaction
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      const startedAt = new Date();
      const expiresAt = new Date(startedAt.getTime() + durationSeconds * 1000);

      const attemptInsertRes = await client.query(
        `INSERT INTO cbt_attempts (
          id, user_id, exam_id, blueprint_id, mode, title, status,
          duration_seconds, remaining_time_seconds, started_at,
          expires_at, total_questions
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'IN_PROGRESS',
          $7, $7, $8,
          $9, $10
        ) RETURNING *;`,
        [
          attemptId,
          userId,
          examId,
          blueprintId || null,
          mode,
          title,
          durationSeconds,
          startedAt,
          expiresAt,
          gen.question_ids.length
        ]
      );

      // Insert attempt questions with fixed positions
      for (let i = 0; i < gen.question_ids.length; i++) {
        await client.query(
          `INSERT INTO cbt_attempt_questions (
            attempt_id, question_id, position, is_answered, is_marked, time_spent_seconds
          ) VALUES ($1, $2, $3, false, false, 0);`,
          [attemptId, gen.question_ids[i], i]
        );
      }

      await client.query('COMMIT');

      const fullAttempt = await this.getAttemptPublic(attemptId, userId);
      return {
        attempt: {
          id: fullAttempt.id,
          user_id: fullAttempt.user_id,
          exam_id: fullAttempt.exam_id,
          blueprint_id: fullAttempt.blueprint_id,
          mode: fullAttempt.mode,
          title: fullAttempt.title,
          status: fullAttempt.status,
          duration_seconds: fullAttempt.duration_seconds,
          remaining_time_seconds: fullAttempt.remaining_time_seconds,
          started_at: fullAttempt.started_at,
          expires_at: fullAttempt.expires_at,
          current_question_index: fullAttempt.current_question_index,
          total_questions: fullAttempt.total_questions
        },
        questions: fullAttempt.questions
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Fetch live attempt session with zero answer leakage.
   * Checks expiration and computes live remaining seconds.
   */
  static async getAttemptPublic(attemptId: string, userId: string): Promise<CbtAttemptWithQuestions> {
    const res = await queryPostgres(
      `SELECT * FROM cbt_attempts WHERE id = $1;`,
      [attemptId]
    );

    if (res.rows.length === 0) {
      throw new Error(`Attempt ${attemptId} not found.`);
    }

    const row = res.rows[0];
    if (row.user_id !== userId) {
      throw new Error(`Unauthorized access to attempt ${attemptId}.`);
    }

    let status = row.status;
    let remaining = row.remaining_time_seconds;

    // Check expiry if IN_PROGRESS
    if (status === 'IN_PROGRESS') {
      const now = new Date();
      const expiresAt = new Date(row.expires_at);
      if (now > expiresAt) {
        // Auto-submit expired attempt
        await this.submitAttempt(attemptId, userId);
        return this.getAttemptPublic(attemptId, userId);
      }
      remaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
    }

    // Query sanitized questions strictly without correct_answer or explanations
    const qRes = await queryPostgres(
      `SELECT
         q.id,
         q.exam_id,
         q.subject,
         q.chapter,
         q.topic,
         q.subtopic,
         q.question_type,
         q.question_text,
         q.passage_text,
         q.assertion_text,
         q.reason_text,
         q.options,
         q.marks::float as marks,
         q.negative_marks::float as negative_marks,
         q.estimated_time_seconds,
         q.verification_status,
         aq.position,
         aq.selected_answer,
         aq.is_answered,
         aq.is_marked,
         aq.confidence_level,
         aq.time_spent_seconds
       FROM cbt_attempt_questions aq
       JOIN questions q ON aq.question_id = q.id
       WHERE aq.attempt_id = $1
       ORDER BY aq.position ASC;`,
      [attemptId]
    );

    const questions: QuestionPublicView[] = qRes.rows.map((q: any) => ({
      id: q.id,
      exam_id: q.exam_id,
      subject: q.subject,
      chapter: q.chapter,
      topic: q.topic,
      subtopic: q.subtopic,
      question_type: q.question_type,
      question_text: q.question_text,
      passage_text: q.passage_text,
      assertion_text: q.assertion_text,
      reason_text: q.reason_text,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      marks: q.marks,
      negative_marks: q.negative_marks,
      estimated_time_seconds: q.estimated_time_seconds,
      verification_status: q.verification_status,
      position: q.position,
      selected_answer: q.selected_answer,
      is_answered: q.is_answered,
      is_marked: q.is_marked,
      confidence_level: q.confidence_level,
      time_spent_seconds: q.time_spent_seconds
    }));

    return {
      id: row.id,
      user_id: row.user_id,
      exam_id: row.exam_id,
      blueprint_id: row.blueprint_id,
      mode: row.mode,
      title: row.title,
      status: status,
      duration_seconds: row.duration_seconds,
      remaining_time_seconds: remaining,
      started_at: row.started_at,
      paused_at: row.paused_at,
      resumed_at: row.resumed_at,
      expires_at: row.expires_at,
      submitted_at: row.submitted_at,
      current_question_index: row.current_question_index,
      total_questions: row.total_questions,
      questions
    };
  }

  /**
   * Concurrency-safe answer recording using atomic row locking.
   */
  static async recordAnswer(params: {
    attemptId: string;
    userId: string;
    questionId: string;
    selectedAnswer: number | null;
    confidenceLevel?: string;
    timeSpentIncrement?: number;
  }): Promise<{ success: boolean; is_answered: boolean }> {
    const { attemptId, userId, questionId, selectedAnswer, confidenceLevel, timeSpentIncrement = 0 } = params;

    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      // Atomic lock on attempt
      const attemptRes = await client.query(
        `SELECT * FROM cbt_attempts WHERE id = $1 FOR UPDATE;`,
        [attemptId]
      );

      if (attemptRes.rows.length === 0) {
        throw new Error(`Attempt ${attemptId} not found.`);
      }

      const attempt = attemptRes.rows[0];
      if (attempt.user_id !== userId) {
        throw new Error('Unauthorized');
      }

      if (attempt.status === 'PAUSED') {
        throw new Error('Cannot record answer: Attempt is currently PAUSED. Resume attempt first.');
      }

      if (attempt.status !== 'IN_PROGRESS') {
        throw new Error(`Cannot record answer: Attempt is ${attempt.status}.`);
      }

      // Check expiry
      if (new Date() > new Date(attempt.expires_at)) {
        await client.query('COMMIT');
        await this.submitAttempt(attemptId, userId);
        throw new Error('Exam time has expired. Attempt has been auto-submitted.');
      }

      const isAnswered = selectedAnswer !== null && selectedAnswer !== undefined;

      // Update question state
      await client.query(
        `UPDATE cbt_attempt_questions
         SET
           selected_answer = $1,
           is_answered = $2,
           confidence_level = COALESCE($3, confidence_level),
           time_spent_seconds = time_spent_seconds + $4,
           answered_at = CASE WHEN $2 THEN NOW() ELSE NULL END,
           updated_at = NOW()
         WHERE attempt_id = $5 AND question_id = $6;`,
        [selectedAnswer, isAnswered, confidenceLevel || null, timeSpentIncrement, attemptId, questionId]
      );

      await client.query(
        `UPDATE cbt_attempts SET updated_at = NOW() WHERE id = $1;`,
        [attemptId]
      );

      await client.query('COMMIT');
      return { success: true, is_answered: isAnswered };
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Mark or unmark question for review.
   */
  static async markQuestion(params: {
    attemptId: string;
    userId: string;
    questionId: string;
    isMarked: boolean;
  }): Promise<{ success: boolean; is_marked: boolean }> {
    const { attemptId, userId, questionId, isMarked } = params;

    const res = await queryPostgres(
      `UPDATE cbt_attempt_questions aq
       SET is_marked = $1, updated_at = NOW()
       FROM cbt_attempts a
       WHERE aq.attempt_id = a.id
         AND a.id = $2
         AND a.user_id = $3
         AND a.status IN ('IN_PROGRESS', 'PAUSED')
         AND aq.question_id = $4
       RETURNING aq.is_marked;`,
      [isMarked, attemptId, userId, questionId]
    );

    if (res.rows.length === 0) {
      throw new Error('Unable to mark question. Attempt not found or unauthorized.');
    }

    return { success: true, is_marked: res.rows[0].is_marked };
  }

  /**
   * Concurrency-safe Pause Attempt.
   * Atomically computes remaining seconds and freezes expiration.
   */
  static async pauseAttempt(attemptId: string, userId: string): Promise<{ success: boolean; remaining_time_seconds: number }> {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      const lockRes = await client.query(
        `SELECT * FROM cbt_attempts WHERE id = $1 FOR UPDATE;`,
        [attemptId]
      );

      if (lockRes.rows.length === 0) {
        throw new Error(`Attempt ${attemptId} not found.`);
      }

      const attempt = lockRes.rows[0];
      if (attempt.user_id !== userId) {
        throw new Error('Unauthorized');
      }

      if (attempt.status === 'PAUSED') {
        await client.query('COMMIT');
        return { success: true, remaining_time_seconds: attempt.remaining_time_seconds };
      }

      if (attempt.status !== 'IN_PROGRESS') {
        throw new Error(`Cannot pause attempt in status: ${attempt.status}`);
      }

      const now = new Date();
      const expiresAt = new Date(attempt.expires_at);
      const remainingSeconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

      await client.query(
        `UPDATE cbt_attempts
         SET
           status = 'PAUSED',
           paused_at = NOW(),
           remaining_time_seconds = $1,
           updated_at = NOW()
         WHERE id = $2;`,
        [remainingSeconds, attemptId]
      );

      await client.query('COMMIT');
      return { success: true, remaining_time_seconds: remainingSeconds };
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Concurrency-safe Resume Attempt.
   * Atomically recalculates expires_at from frozen remaining seconds.
   */
  static async resumeAttempt(attemptId: string, userId: string): Promise<{ success: boolean; expires_at: string; remaining_time_seconds: number }> {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      const lockRes = await client.query(
        `SELECT * FROM cbt_attempts WHERE id = $1 FOR UPDATE;`,
        [attemptId]
      );

      if (lockRes.rows.length === 0) {
        throw new Error(`Attempt ${attemptId} not found.`);
      }

      const attempt = lockRes.rows[0];
      if (attempt.user_id !== userId) {
        throw new Error('Unauthorized');
      }

      if (attempt.status === 'IN_PROGRESS') {
        await client.query('COMMIT');
        return {
          success: true,
          expires_at: attempt.expires_at,
          remaining_time_seconds: attempt.remaining_time_seconds
        };
      }

      if (attempt.status !== 'PAUSED') {
        throw new Error(`Cannot resume attempt in status: ${attempt.status}`);
      }

      const remainingSeconds = attempt.remaining_time_seconds;
      const resumedAt = new Date();
      const expiresAt = new Date(resumedAt.getTime() + remainingSeconds * 1000);

      const updateRes = await client.query(
        `UPDATE cbt_attempts
         SET
           status = 'IN_PROGRESS',
           resumed_at = $1,
           expires_at = $2,
           updated_at = NOW()
         WHERE id = $3
         RETURNING expires_at;`,
        [resumedAt, expiresAt, attemptId]
      );

      await client.query('COMMIT');
      return {
        success: true,
        expires_at: updateRes.rows[0].expires_at,
        remaining_time_seconds: remainingSeconds
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Server-authoritative submission and evaluation.
   * Idempotent: safe against double submissions.
   */
  static async submitAttempt(attemptId: string, userId: string): Promise<CbtResultAnalysis> {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      const lockRes = await client.query(
        `SELECT * FROM cbt_attempts WHERE id = $1 FOR UPDATE;`,
        [attemptId]
      );

      if (lockRes.rows.length === 0) {
        throw new Error(`Attempt ${attemptId} not found.`);
      }

      const attempt = lockRes.rows[0];
      if (attempt.user_id !== userId) {
        throw new Error('Unauthorized');
      }

      // If already submitted, return existing result idempotently
      if (attempt.status === 'SUBMITTED') {
        const existingResult = await client.query(
          `SELECT * FROM cbt_attempt_results WHERE attempt_id = $1;`,
          [attemptId]
        );
        await client.query('COMMIT');
        if (existingResult.rows.length > 0) {
          return existingResult.rows[0] as CbtResultAnalysis;
        }
      }

      // Fetch all attempt questions joined with questions table
      const qRes = await client.query(
        `SELECT
           aq.question_id,
           aq.position,
           aq.selected_answer,
           aq.is_answered,
           aq.confidence_level,
           aq.time_spent_seconds,
           q.subject,
           q.chapter,
           q.topic,
           q.marks::float as marks,
           q.negative_marks::float as negative_marks,
           q.correct_answer
         FROM cbt_attempt_questions aq
         JOIN questions q ON aq.question_id = q.id
         WHERE aq.attempt_id = $1
         ORDER BY aq.position ASC;`,
        [attemptId]
      );

      const rows = qRes.rows;
      let score = 0;
      let maxPossibleScore = 0;
      let attemptedCount = 0;
      let unattemptedCount = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      let negativeMarksDeducted = 0;
      let totalTimeSpent = 0;

      const subjectStats: Record<string, { total: number; correct: number; incorrect: number; score: number }> = {};
      const topicStats: Record<string, { total: number; correct: number; incorrect: number; subject: string }> = {};

      for (const r of rows) {
        const marks = r.marks || 2.0;
        const neg = r.negative_marks || 0.66;
        const subj = r.subject || 'General Studies';
        const top = r.topic || 'General';

        maxPossibleScore += marks;
        totalTimeSpent += (r.time_spent_seconds || 0);

        if (!subjectStats[subj]) {
          subjectStats[subj] = { total: 0, correct: 0, incorrect: 0, score: 0 };
        }
        subjectStats[subj].total++;

        if (!topicStats[top]) {
          topicStats[top] = { total: 0, correct: 0, incorrect: 0, subject: subj };
        }
        topicStats[top].total++;

        if (!r.is_answered || r.selected_answer === null || r.selected_answer === undefined) {
          unattemptedCount++;
        } else {
          attemptedCount++;
          if (r.selected_answer === r.correct_answer) {
            correctCount++;
            score += marks;
            subjectStats[subj].correct++;
            subjectStats[subj].score += marks;
            topicStats[top].correct++;
          } else {
            incorrectCount++;
            score -= neg;
            negativeMarksDeducted += neg;
            subjectStats[subj].incorrect++;
            subjectStats[subj].score -= neg;
            topicStats[top].incorrect++;
          }
        }
      }

      const totalQuestions = rows.length;
      const accuracyPercent = attemptedCount > 0 ? Number(((correctCount / attemptedCount) * 100).toFixed(2)) : 0;
      score = Number(Math.max(0, score).toFixed(2)); // avoid negative total score displays

      // Compute weak areas (topics where accuracy is below 50%)
      const weakAreas: Array<{ topic: string; subject: string; accuracy: number; questions_count: number }> = [];
      for (const [tName, data] of Object.entries(topicStats)) {
        const attemptedInTopic = data.correct + data.incorrect;
        const acc = attemptedInTopic > 0 ? (data.correct / attemptedInTopic) * 100 : 0;
        if (acc < 50 || data.correct === 0) {
          weakAreas.push({
            topic: tName,
            subject: data.subject,
            accuracy: Number(acc.toFixed(1)),
            questions_count: data.total
          });
        }
      }

      // Mark attempt as SUBMITTED
      await client.query(
        `UPDATE cbt_attempts
         SET
           status = 'SUBMITTED',
           submitted_at = NOW(),
           updated_at = NOW()
         WHERE id = $1;`,
        [attemptId]
      );

      // Insert result record
      const resultId = `res_${crypto.randomUUID()}`;
      const insertRes = await client.query(
        `INSERT INTO cbt_attempt_results (
          id, attempt_id, user_id, exam_id, score, max_possible_score,
          accuracy_percent, total_questions, attempted_count, unattempted_count,
          correct_count, incorrect_count, negative_marks_deducted,
          time_taken_seconds, subject_analysis, topic_analysis, weak_areas
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        ) RETURNING *;`,
        [
          resultId,
          attemptId,
          userId,
          attempt.exam_id,
          score,
          maxPossibleScore,
          accuracyPercent,
          totalQuestions,
          attemptedCount,
          unattemptedCount,
          correctCount,
          incorrectCount,
          negativeMarksDeducted,
          totalTimeSpent,
          JSON.stringify(subjectStats),
          JSON.stringify(topicStats),
          JSON.stringify(weakAreas)
        ]
      );

      await client.query('COMMIT');

      // Trigger RewardEngine asynchronously / safely
      try {
        await RewardEngine.processEvent({
          userId,
          eventType: 'CBT_COMPLETED',
          referenceId: attemptId,
          payload: {
            attemptId,
            examId: attempt.exam_id,
            score,
            accuracy: accuracyPercent,
            totalQuestions,
            correctCount
          },
          userExam: attempt.exam_id
        });
      } catch (rewardErr: any) {
        console.warn('[CbtService.submitAttempt] RewardEngine warning:', rewardErr?.message || rewardErr);
      }

      return insertRes.rows[0] as CbtResultAnalysis;
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get post-exam review: includes correct answers, solutions, and user's mistake tags.
   * Strictly disallowed while attempt is IN_PROGRESS or PAUSED.
   */
  static async getAttemptReview(attemptId: string, userId: string): Promise<QuestionReviewItem[]> {
    const attemptRes = await queryPostgres(
      `SELECT status, user_id FROM cbt_attempts WHERE id = $1;`,
      [attemptId]
    );

    if (attemptRes.rows.length === 0) {
      throw new Error(`Attempt ${attemptId} not found.`);
    }

    const attempt = attemptRes.rows[0];
    if (attempt.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    if (attempt.status !== 'SUBMITTED') {
      throw new Error('Review is only available after final submission.');
    }

    const reviewRes = await queryPostgres(
      `SELECT
         q.id,
         q.exam_id,
         q.subject,
         q.chapter,
         q.topic,
         q.subtopic,
         q.question_type,
         q.question_text,
         q.passage_text,
         q.assertion_text,
         q.reason_text,
         q.options,
         q.correct_answer,
         q.explanation,
         q.option_explanations,
         q.marks::float as marks,
         q.negative_marks::float as negative_marks,
         q.estimated_time_seconds,
         q.verification_status,
         aq.position,
         aq.selected_answer,
         aq.is_answered,
         aq.is_marked,
         aq.confidence_level,
         aq.time_spent_seconds,
         (aq.selected_answer = q.correct_answer) as is_correct,
         fb.mistake_category,
         fb.notes as mistake_notes
       FROM cbt_attempt_questions aq
       JOIN questions q ON aq.question_id = q.id
       LEFT JOIN cbt_question_feedback fb ON fb.attempt_id = aq.attempt_id AND fb.question_id = aq.question_id
       WHERE aq.attempt_id = $1
       ORDER BY aq.position ASC;`,
      [attemptId]
    );

    return reviewRes.rows.map((r: any) => ({
      id: r.id,
      exam_id: r.exam_id,
      subject: r.subject,
      chapter: r.chapter,
      topic: r.topic,
      subtopic: r.subtopic,
      question_type: r.question_type,
      question_text: r.question_text,
      passage_text: r.passage_text,
      assertion_text: r.assertion_text,
      reason_text: r.reason_text,
      options: typeof r.options === 'string' ? JSON.parse(r.options) : r.options,
      correct_answer: r.correct_answer,
      explanation: r.explanation,
      option_explanations: typeof r.option_explanations === 'string' ? JSON.parse(r.option_explanations) : r.option_explanations,
      marks: r.marks,
      negative_marks: r.negative_marks,
      estimated_time_seconds: r.estimated_time_seconds,
      verification_status: r.verification_status,
      position: r.position,
      selected_answer: r.selected_answer,
      is_answered: r.is_answered,
      is_marked: r.is_marked,
      confidence_level: r.confidence_level,
      time_spent_seconds: r.time_spent_seconds,
      is_correct: !!r.is_correct,
      mistake_category: r.mistake_category,
      mistake_notes: r.mistake_notes
    }));
  }

  /**
   * Tag mistake for analysis ("Why was I wrong?").
   */
  static async tagMistake(params: {
    attemptId: string;
    userId: string;
    questionId: string;
    mistakeCategory: string;
    notes?: string;
  }): Promise<{ success: boolean }> {
    const { attemptId, userId, questionId, mistakeCategory, notes } = params;

    const id = `fb_${crypto.randomUUID()}`;
    await queryPostgres(
      `INSERT INTO cbt_question_feedback (
        id, attempt_id, question_id, user_id, mistake_category, notes
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO NOTHING;`,
      [id, attemptId, questionId, userId, mistakeCategory, notes || null]
    );

    return { success: true };
  }

  /**
   * Get user's completed CBT history.
   */
  static async getUserHistory(userId: string, examId?: string): Promise<any[]> {
    let sql = `
      SELECT
        r.*,
        a.title,
        a.mode,
        a.duration_seconds
      FROM cbt_attempt_results r
      JOIN cbt_attempts a ON r.attempt_id = a.id
      WHERE r.user_id = $1
    `;
    const params: any[] = [userId];

    if (examId) {
      sql += ` AND r.exam_id = $2`;
      params.push(examId);
    }

    sql += ` ORDER BY r.created_at DESC LIMIT 20;`;

    const res = await queryPostgres(sql, params);
    return res.rows;
  }
}
