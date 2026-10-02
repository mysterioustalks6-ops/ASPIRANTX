import crypto from 'crypto';
import { queryPostgres, pgPool } from '../postgres.js';
import { generateExamQuestions, QuestionPublicView } from './questionGenerator.js';
import { RewardEngine } from '../rewards/rewardEngine.js';
import { 
  getUniversalExamConfig, 
  UniversalExamConfig, 
  UniversalSectionConfig, 
  TimingModel, 
  NavigationRule 
} from './universalExamConfig.js';

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
  timing_model?: TimingModel | string;
  exam_config?: any;
  section_states?: Record<string, any>;
  current_section_id?: string;
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

    // Load universal exam configuration
    const examConfig = getUniversalExamConfig(examId);
    const primaryStage = examConfig.stages[0];
    const primaryPaper = primaryStage?.papers?.[0];
    const sections: UniversalSectionConfig[] = primaryPaper?.sections || [];

    let durationSeconds = primaryPaper?.totalDurationMinutes ? primaryPaper.totalDurationMinutes * 60 : 3600;
    let title = params.title || (primaryPaper ? `${examConfig.examName} - ${primaryPaper.paperName}` : `${examConfig.examName} Mock Exam`);
    let count = params.count || (primaryPaper ? primaryPaper.sections.reduce((acc, s) => acc + s.questionCount, 0) : 20);
    let timingModel: TimingModel = primaryPaper?.timingModel || 'GLOBAL_TIMER';

    // Load blueprint if provided (blueprint overrides defaults)
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
        if (bp.timing_model) {
          timingModel = bp.timing_model as TimingModel;
        }
      }
    }

    // Select questions with blueprint awareness
    const gen = await generateExamQuestions({
      examId,
      count,
      sections: mode === 'full' && sections.length > 0 ? sections : undefined,
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

    // Setup initial section_states
    const sectionStates: Record<string, any> = {};
    const defaultSectionId = sections.length > 0 ? sections[0].id : 'general';
    const currentSectionId = defaultSectionId;

    if (sections.length > 0) {
      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const sec = sections[sIdx];
        const isSectionTimed = timingModel === 'SECTION_TIMER';
        const secDuration = isSectionTimed 
          ? (sec.durationMinutes ? sec.durationMinutes * 60 : Math.floor(durationSeconds / sections.length))
          : durationSeconds;

        sectionStates[sec.id] = {
          sectionId: sec.id,
          name: sec.name,
          subject: sec.subject,
          status: sIdx === 0 ? 'ACTIVE' : (timingModel === 'SECTION_TIMER' ? 'LOCKED' : 'AVAILABLE'),
          durationSeconds: secDuration,
          remainingSeconds: secDuration,
          isTimed: isSectionTimed,
          navigationRule: sec.navigationRule || (timingModel === 'SECTION_TIMER' ? 'SEPARATELY_TIMED' : 'FREE_NAVIGATION'),
          questionCount: sec.questionCount,
          markingScheme: sec.markingScheme
        };
      }
    } else {
      sectionStates['general'] = {
        sectionId: 'general',
        name: 'General Section',
        subject: subject || 'General Studies',
        status: 'ACTIVE',
        durationSeconds,
        remainingSeconds: durationSeconds,
        isTimed: false,
        navigationRule: 'FREE_NAVIGATION',
        questionCount: gen.question_ids.length,
        markingScheme: { positive: 1.0, negative: 0.25, unattempted: 0 }
      };
    }

    // Execute insertion in a transaction
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      const startedAt = new Date();
      const expiresAt = new Date(startedAt.getTime() + durationSeconds * 1000);

      await client.query(
        `INSERT INTO cbt_attempts (
          id, user_id, exam_id, blueprint_id, mode, title, status,
          duration_seconds, remaining_time_seconds, started_at,
          expires_at, total_questions, timing_model, exam_config,
          section_states, current_section_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'IN_PROGRESS',
          $7, $7, $8,
          $9, $10, $11, $12, $13, $14
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
          gen.question_ids.length,
          timingModel,
          JSON.stringify(examConfig),
          JSON.stringify(sectionStates),
          currentSectionId
        ]
      );

      // Insert attempt questions with fixed positions and section tagging (batch insert)
      if (gen.question_ids.length > 0) {
        const values: any[] = [];
        const valueTuples: string[] = [];
        let p = 1;

        for (let i = 0; i < gen.question_ids.length; i++) {
          const qId = gen.question_ids[i];
          const secId = (gen.question_section_map && gen.question_section_map[qId]) || currentSectionId;
          valueTuples.push(`($${p}, $${p+1}, $${p+2}, $${p+3}, false, false, 0)`);
          values.push(attemptId, qId, secId, i);
          p += 4;
        }

        await client.query(
          `INSERT INTO cbt_attempt_questions (
            attempt_id, question_id, section_id, position, is_answered, is_marked, time_spent_seconds
          ) VALUES ${valueTuples.join(', ')};`,
          values
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
          total_questions: fullAttempt.total_questions,
          timing_model: fullAttempt.timing_model,
          exam_config: fullAttempt.exam_config,
          section_states: fullAttempt.section_states,
          current_section_id: fullAttempt.current_section_id
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
         aq.section_id,
         q.subject,
         q.chapter,
         q.topic,
         q.subtopic,
         q.question_type,
         q.question_text,
         q.question_text_hi,
         q.passage_text,
         q.assertion_text,
         q.reason_text,
         q.options,
         q.options_hi,
         q.marks::float as marks,
         q.negative_marks::float as negative_marks,
         q.estimated_time_seconds,
         q.verification_status,
         aq.position,
         aq.selected_answer,
         aq.selected_option,
         aq.is_answered,
         aq.is_marked,
         aq.confidence_level,
         aq.time_spent_seconds,
         aq.is_evaluated,
         aq.marks_obtained::float as marks_obtained
       FROM cbt_attempt_questions aq
       JOIN questions q ON aq.question_id = q.id
       WHERE aq.attempt_id = $1
       ORDER BY aq.position ASC;`,
      [attemptId]
    );

    const questions: QuestionPublicView[] = qRes.rows.map((q: any) => ({
      id: q.id,
      exam_id: q.exam_id,
      section_id: q.section_id,
      subject: q.subject,
      chapter: q.chapter,
      topic: q.topic,
      subtopic: q.subtopic,
      question_type: q.question_type,
      question_text: q.question_text,
      question_text_hi: q.question_text_hi,
      passage_text: q.passage_text,
      assertion_text: q.assertion_text,
      reason_text: q.reason_text,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      options_hi: typeof q.options_hi === 'string' ? JSON.parse(q.options_hi) : q.options_hi,
      marks: q.marks,
      negative_marks: q.negative_marks,
      estimated_time_seconds: q.estimated_time_seconds,
      verification_status: q.verification_status,
      position: q.position,
      selected_answer: q.selected_answer,
      selected_option: q.selected_option,
      is_answered: q.is_answered,
      is_marked: q.is_marked,
      confidence_level: q.confidence_level,
      time_spent_seconds: q.time_spent_seconds
    }));

    const rawExamConfig = typeof row.exam_config === 'string' ? JSON.parse(row.exam_config) : (row.exam_config || getUniversalExamConfig(row.exam_id));
    const rawSectionStates = typeof row.section_states === 'string' ? JSON.parse(row.section_states) : (row.section_states || {});

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
      timing_model: row.timing_model || 'GLOBAL_TIMER',
      exam_config: rawExamConfig,
      section_states: rawSectionStates,
      current_section_id: row.current_section_id || Object.keys(rawSectionStates)[0] || 'general',
      questions
    };
  }

  /**
   * Concurrency-safe section switching.
   * Enforces navigation rules (FREE_NAVIGATION vs SECTION_LOCKED vs SEPARATELY_TIMED).
   */
  static async switchSection(params: {
    attemptId: string;
    userId: string;
    targetSectionId: string;
  }): Promise<{ success: boolean; current_section_id: string; currentSectionId?: string; section_states: Record<string, any> }> {
    const { attemptId, userId, targetSectionId } = params;

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

      if (attempt.status !== 'IN_PROGRESS') {
        throw new Error(`Cannot switch section when attempt is ${attempt.status}`);
      }

      const timingModel = attempt.timing_model || 'GLOBAL_TIMER';
      const sectionStates = typeof attempt.section_states === 'string' 
        ? JSON.parse(attempt.section_states) 
        : (attempt.section_states || {});

      const targetSec = sectionStates[targetSectionId];
      if (!targetSec) {
        throw new Error(`Section ${targetSectionId} does not exist in this exam.`);
      }

      const currentSecId = attempt.current_section_id;
      const currentSec = sectionStates[currentSecId];
      
      const examConfig = attempt.exam_config 
        ? (typeof attempt.exam_config === 'string' ? JSON.parse(attempt.exam_config) : attempt.exam_config) 
        : getUniversalExamConfig(attempt.exam_id);
      const paperSections = examConfig?.stages?.[0]?.papers?.[0]?.sections || [];
      const orderedSectionIds = paperSections.length > 0 
        ? paperSections.map((s: any) => s.id) 
        : Object.keys(sectionStates);

      const currentIdx = orderedSectionIds.indexOf(currentSecId);
      const targetIdx = orderedSectionIds.indexOf(targetSectionId);

      if (timingModel === 'SECTION_TIMER' || currentSec?.navigationRule === 'SEPARATELY_TIMED' || currentSec?.navigationRule === 'SECTION_LOCKED') {
        // Disallow returning to completed section
        if (targetSec.status === 'COMPLETED' || (targetIdx !== -1 && targetIdx < currentIdx)) {
          throw new Error('Section navigation locked: Cannot return to already completed sections in section-timed exams.');
        }
        // Disallow jumping ahead skipping an intermediate section
        if (targetIdx > currentIdx + 1) {
          throw new Error('Strict sequence required: Cannot skip intermediate sections in section-timed exams.');
        }
        if (currentSec) {
          currentSec.status = 'COMPLETED';
        }
        targetSec.status = 'ACTIVE';
      } else {
        // Free navigation (e.g. JEE, NEET, UPSC, SSC)
        if (currentSec && currentSec.status === 'ACTIVE') {
          currentSec.status = 'AVAILABLE';
        }
        targetSec.status = 'ACTIVE';
      }

      await client.query(
        `UPDATE cbt_attempts 
         SET current_section_id = $1, section_states = $2, updated_at = NOW() 
         WHERE id = $3;`,
        [targetSectionId, JSON.stringify(sectionStates), attemptId]
      );

      await client.query('COMMIT');

      return {
        success: true,
        current_section_id: targetSectionId,
        currentSectionId: targetSectionId,
        section_states: sectionStates
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Concurrency-safe answer recording using atomic row locking.
   * Supports both numerical input and multiple-choice options.
   */
  static async recordAnswer(params: {
    attemptId: string;
    userId: string;
    questionId: string;
    selectedAnswer?: number | null;
    selectedOption?: string | number | null;
    isReview?: boolean;
    confidenceLevel?: string;
    timeSpentIncrement?: number;
    timeSpentSeconds?: number;
  }): Promise<{ success: boolean; is_answered: boolean; selected_option: string | null; status: string }> {
    const { attemptId, userId, questionId, selectedAnswer, selectedOption, isReview, confidenceLevel } = params;
    const timeSpentInc = params.timeSpentSeconds ?? params.timeSpentIncrement ?? 0;

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

      const hasStrOption = selectedOption !== null && selectedOption !== undefined && String(selectedOption).trim() !== '';
      const isAnswered = (selectedAnswer !== null && selectedAnswer !== undefined) || hasStrOption;

      const optionVal = selectedOption !== null && selectedOption !== undefined 
        ? String(selectedOption) 
        : (selectedAnswer !== null && selectedAnswer !== undefined ? String(selectedAnswer) : null);

      // Update question state
      await client.query(
        `UPDATE cbt_attempt_questions
         SET
           selected_answer = $1,
           selected_option = $2,
           is_answered = $3,
           is_marked = CASE WHEN $4::boolean IS NOT NULL THEN $4::boolean ELSE is_marked END,
           confidence_level = COALESCE($5, confidence_level),
           time_spent_seconds = time_spent_seconds + $6,
           answered_at = CASE WHEN $3 THEN NOW() ELSE NULL END,
           updated_at = NOW()
         WHERE attempt_id = $7 AND question_id = $8;`,
        [
          selectedAnswer !== undefined ? selectedAnswer : null,
          optionVal,
          isAnswered,
          isReview !== undefined ? isReview : null,
          confidenceLevel || null,
          timeSpentInc,
          attemptId,
          questionId
        ]
      );

      await client.query(
        `UPDATE cbt_attempts SET updated_at = NOW() WHERE id = $1;`,
        [attemptId]
      );

      await client.query('COMMIT');
      
      const statusStr = isAnswered && isReview ? 'answered_review' : (isAnswered ? 'answered' : (isReview ? 'marked_review' : 'not_answered'));
      return { 
        success: true, 
        is_answered: isAnswered,
        selected_option: optionVal,
        status: statusStr
      };
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
  static async submitAttempt(
    attemptIdOrParams: string | { attemptId: string; userId: string; timeSpentSeconds?: number },
    userIdParam?: string
  ): Promise<CbtResultAnalysis & { score_summary?: any }> {
    const attemptId = typeof attemptIdOrParams === 'string' ? attemptIdOrParams : attemptIdOrParams.attemptId;
    const userId = typeof attemptIdOrParams === 'string' ? (userIdParam || '') : attemptIdOrParams.userId;

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
          const row = existingResult.rows[0];
          return {
            ...row,
            score_summary: {
              total_score: row.score,
              max_possible_score: row.max_possible_score,
              accuracy_pct: row.accuracy_percent,
              total_questions: row.total_questions,
              attempted: row.attempted_count,
              unattempted: row.unattempted_count,
              correct: row.correct_count,
              incorrect: row.incorrect_count
            }
          } as any;
        }
      }

      // Fetch all attempt questions joined with questions table
      const qRes = await client.query(
        `SELECT
           aq.question_id,
           aq.section_id,
           aq.position,
           aq.selected_answer,
           aq.selected_option,
           aq.is_answered,
           aq.confidence_level,
           aq.time_spent_seconds,
           q.subject,
           q.chapter,
           q.topic,
           q.question_type,
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

      const examConfig = attempt.exam_config ? (typeof attempt.exam_config === 'string' ? JSON.parse(attempt.exam_config) : attempt.exam_config) : getUniversalExamConfig(attempt.exam_id);
      const sectionStates = attempt.section_states ? (typeof attempt.section_states === 'string' ? JSON.parse(attempt.section_states) : attempt.section_states) : {};

      const subjectStats: Record<string, { total: number; correct: number; incorrect: number; score: number }> = {};
      const topicStats: Record<string, { total: number; correct: number; incorrect: number; subject: string }> = {};
      const evalUpdates: Array<{ qId: string; marks: number }> = [];

      for (const r of rows) {
        const secId = r.section_id || 'general';
        const secState = sectionStates[secId];

        let positiveMark = r.marks || 1.0;
        let negativeMark = r.negative_marks || 0.25;

        // Apply section-specific marking scheme if defined
        if (secState?.markingScheme) {
          positiveMark = secState.markingScheme.positive ?? positiveMark;
          negativeMark = secState.markingScheme.negative ?? negativeMark;
        } else if (examConfig) {
          const foundSec = examConfig.stages?.[0]?.papers?.[0]?.sections?.find((s: any) => s.id === secId);
          if (foundSec?.markingScheme) {
            positiveMark = foundSec.markingScheme.positive ?? positiveMark;
            negativeMark = foundSec.markingScheme.negative ?? negativeMark;
          }
        }

        // Strictly enforce 0 negative mark for CTET and TET exams
        const examUpper = (attempt.exam_id || '').toUpperCase();
        if (examUpper.includes('CTET') || examUpper.includes('TET')) {
          negativeMark = 0.0;
        }

        const subj = r.subject || secState?.name || 'General Studies';
        const top = r.topic || 'General';

        maxPossibleScore += positiveMark;
        totalTimeSpent += (r.time_spent_seconds || 0);

        if (!subjectStats[subj]) {
          subjectStats[subj] = { total: 0, correct: 0, incorrect: 0, score: 0 };
        }
        subjectStats[subj].total++;

        if (!topicStats[top]) {
          topicStats[top] = { total: 0, correct: 0, incorrect: 0, subject: subj };
        }
        topicStats[top].total++;

        let isCorrect = false;
        let marksObtained = 0;

        const hasAnswer = r.is_answered && (
          (r.selected_answer !== null && r.selected_answer !== undefined) ||
          (r.selected_option !== null && r.selected_option !== undefined && String(r.selected_option).trim() !== '')
        );

        if (!hasAnswer) {
          unattemptedCount++;
        } else {
          attemptedCount++;

          if (r.question_type === 'NUMERICAL') {
            const userNum = parseFloat(r.selected_option || String(r.selected_answer));
            const correctNum = parseFloat(String(r.correct_answer));
            isCorrect = !isNaN(userNum) && !isNaN(correctNum) && Math.abs(userNum - correctNum) < 0.01;
          } else {
            isCorrect = (r.selected_answer === r.correct_answer) || 
                        (r.selected_option !== null && String(r.selected_option) === String(r.correct_answer));
          }

          if (isCorrect) {
            correctCount++;
            score += positiveMark;
            marksObtained = positiveMark;
            subjectStats[subj].correct++;
            subjectStats[subj].score += positiveMark;
            topicStats[top].correct++;
          } else {
            incorrectCount++;
            score -= negativeMark;
            marksObtained = -negativeMark;
            negativeMarksDeducted += negativeMark;
            subjectStats[subj].incorrect++;
            subjectStats[subj].score -= negativeMark;
            topicStats[top].incorrect++;
          }
        }

        evalUpdates.push({ qId: r.question_id, marks: marksObtained });
      }

      // Batch persist evaluation for all questions
      if (evalUpdates.length > 0) {
        const qIds = evalUpdates.map(u => u.qId);
        const marks = evalUpdates.map(u => u.marks);
        await client.query(
          `UPDATE cbt_attempt_questions aq
           SET is_evaluated = true,
               marks_obtained = data.marks
           FROM (
             SELECT unnest($1::text[]) AS question_id,
                    unnest($2::numeric[]) AS marks
           ) data
           WHERE aq.attempt_id = $3 AND aq.question_id = data.question_id;`,
          [qIds, marks, attemptId]
        );
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

      const row = insertRes.rows[0];
      return {
        ...row,
        score_summary: {
          total_score: row.score,
          max_possible_score: row.max_possible_score,
          accuracy_pct: row.accuracy_percent,
          total_questions: row.total_questions,
          attempted: row.attempted_count,
          unattempted: row.unattempted_count,
          correct: row.correct_count,
          incorrect: row.incorrect_count
        }
      } as any;
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

export const cbtService = CbtService;
