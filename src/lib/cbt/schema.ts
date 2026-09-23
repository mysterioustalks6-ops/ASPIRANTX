// ============================================================================
// CANONICAL CBT DATABASE SCHEMA & MIGRATION RUNNER (NEON POSTGRESQL)
// Strictly additive, non-destructive, and idempotent.
// ============================================================================

import { queryPostgres } from '../postgres.js';

export const CBT_SCHEMA_DDL = `
-- 1. Canonical Questions Table
CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(64) PRIMARY KEY,
  exam_id VARCHAR(64) NOT NULL,
  subject_id VARCHAR(64),
  unit_id VARCHAR(64),
  chapter_id VARCHAR(64),
  topic_id VARCHAR(64),
  subtopic_id VARCHAR(64),
  subject VARCHAR(255) NOT NULL,
  chapter VARCHAR(255),
  topic VARCHAR(255),
  subtopic VARCHAR(255),
  question_type VARCHAR(32) NOT NULL DEFAULT 'mcq',
  question_text TEXT NOT NULL,
  passage_text TEXT,
  assertion_text TEXT,
  reason_text TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer INT NOT NULL,
  explanation TEXT,
  option_explanations JSONB,
  difficulty VARCHAR(16) NOT NULL DEFAULT 'Medium',
  marks NUMERIC NOT NULL DEFAULT 2.0,
  negative_marks NUMERIC NOT NULL DEFAULT 0.66,
  estimated_time_seconds INT DEFAULT 60,
  source_type VARCHAR(32) NOT NULL DEFAULT 'QUESTION_BANK',
  source_id VARCHAR(128),
  source_name VARCHAR(255),
  source_year INT,
  content_usage VARCHAR(32) NOT NULL DEFAULT 'structured_factual_information',
  verification_status VARCHAR(32) NOT NULL DEFAULT 'pending_review',
  created_by VARCHAR(128) DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_exam_subject ON questions(exam_id, subject);
CREATE INDEX IF NOT EXISTS idx_questions_exam_topic ON questions(exam_id, topic);
CREATE INDEX IF NOT EXISTS idx_questions_source_status ON questions(source_type, verification_status);

-- 2. Exam Blueprints Table
CREATE TABLE IF NOT EXISTS cbt_blueprints (
  id VARCHAR(64) PRIMARY KEY,
  exam_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  mode VARCHAR(32) NOT NULL DEFAULT 'full',
  duration_seconds INT NOT NULL,
  total_questions INT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  marking_scheme JSONB NOT NULL DEFAULT '{"correct": 2, "incorrect": 0.66, "unattempted": 0}'::jsonb,
  negative_marking NUMERIC NOT NULL DEFAULT 0.66,
  allow_pause BOOLEAN NOT NULL DEFAULT true,
  navigation_rules JSONB DEFAULT '{"allow_jump": true, "allow_change_answer": true}'::jsonb,
  verification_status VARCHAR(32) NOT NULL DEFAULT 'verified',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cbt_blueprints_exam ON cbt_blueprints(exam_id);

-- 3. Exam Attempts Table
CREATE TABLE IF NOT EXISTS cbt_attempts (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL,
  exam_id VARCHAR(64) NOT NULL,
  blueprint_id VARCHAR(64),
  mode VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
  duration_seconds INT NOT NULL,
  remaining_time_seconds INT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  current_question_index INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cbt_attempts_user ON cbt_attempts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_cbt_attempts_expires ON cbt_attempts(expires_at) WHERE status = 'IN_PROGRESS';

-- 4. Attempt Questions Table (Stable Ordered Question List)
CREATE TABLE IF NOT EXISTS cbt_attempt_questions (
  attempt_id VARCHAR(64) NOT NULL REFERENCES cbt_attempts(id) ON DELETE CASCADE,
  question_id VARCHAR(64) NOT NULL REFERENCES questions(id),
  position INT NOT NULL,
  selected_answer INT,
  is_answered BOOLEAN NOT NULL DEFAULT false,
  is_marked BOOLEAN NOT NULL DEFAULT false,
  confidence_level VARCHAR(16),
  time_spent_seconds INT NOT NULL DEFAULT 0,
  visited_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (attempt_id, question_id),
  CONSTRAINT uq_attempt_position UNIQUE (attempt_id, position)
);

CREATE INDEX IF NOT EXISTS idx_attempt_questions_lookup ON cbt_attempt_questions(attempt_id, position);

-- 5. Attempt Results Table
CREATE TABLE IF NOT EXISTS cbt_attempt_results (
  id VARCHAR(64) PRIMARY KEY,
  attempt_id VARCHAR(64) NOT NULL UNIQUE REFERENCES cbt_attempts(id) ON DELETE CASCADE,
  user_id VARCHAR(128) NOT NULL,
  exam_id VARCHAR(64) NOT NULL,
  score NUMERIC NOT NULL,
  max_possible_score NUMERIC NOT NULL,
  accuracy_percent NUMERIC NOT NULL,
  total_questions INT NOT NULL,
  attempted_count INT NOT NULL,
  unattempted_count INT NOT NULL,
  correct_count INT NOT NULL,
  incorrect_count INT NOT NULL,
  negative_marks_deducted NUMERIC NOT NULL DEFAULT 0,
  time_taken_seconds INT NOT NULL,
  subject_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  chapter_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  topic_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  weak_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cbt_results_user ON cbt_attempt_results(user_id, exam_id);

-- 6. Question Feedback / Mistake Analysis Table
CREATE TABLE IF NOT EXISTS cbt_question_feedback (
  id VARCHAR(64) PRIMARY KEY,
  attempt_id VARCHAR(64) NOT NULL REFERENCES cbt_attempts(id) ON DELETE CASCADE,
  question_id VARCHAR(64) NOT NULL REFERENCES questions(id),
  user_id VARCHAR(128) NOT NULL,
  mistake_category VARCHAR(32) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cbt_feedback_user ON cbt_question_feedback(user_id, question_id);

-- 7. Teacher Exams Table
CREATE TABLE IF NOT EXISTS teacher_exams (
  id VARCHAR(64) PRIMARY KEY,
  teacher_id VARCHAR(128) NOT NULL,
  exam_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL,
  total_marks NUMERIC NOT NULL,
  negative_marking NUMERIC NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_exams_teacher ON teacher_exams(teacher_id, exam_id);

CREATE TABLE IF NOT EXISTS teacher_exam_questions (
  exam_id VARCHAR(64) NOT NULL REFERENCES teacher_exams(id) ON DELETE CASCADE,
  question_id VARCHAR(64) NOT NULL REFERENCES questions(id),
  position INT NOT NULL,
  marks NUMERIC NOT NULL DEFAULT 2,
  negative_marks NUMERIC NOT NULL DEFAULT 0.66,
  PRIMARY KEY (exam_id, question_id),
  CONSTRAINT uq_teacher_exam_position UNIQUE (exam_id, position)
);
`;

export async function initCbtTables(): Promise<void> {
  try {
    await queryPostgres(CBT_SCHEMA_DDL);
  } catch (err: any) {
    console.error('[CBT Schema] Migration execution error:', err.message);
    throw err;
  }
}
