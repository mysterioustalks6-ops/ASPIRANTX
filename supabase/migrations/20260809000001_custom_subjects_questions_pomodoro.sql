-- Migration: User-Owned Custom Subjects, Manual Questions, and Pomodoro Sessions
-- Enables RLS and ownership isolation (auth.uid() = user_id)

-- 1. Custom Subjects Table
CREATE TABLE IF NOT EXISTS public.user_custom_subjects (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_custom_subjects_user_id ON public.user_custom_subjects(user_id);

ALTER TABLE public.user_custom_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own custom subjects" ON public.user_custom_subjects;
CREATE POLICY "Users can read their own custom subjects"
ON public.user_custom_subjects FOR SELECT
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own custom subjects" ON public.user_custom_subjects;
CREATE POLICY "Users can insert their own custom subjects"
ON public.user_custom_subjects FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own custom subjects" ON public.user_custom_subjects;
CREATE POLICY "Users can update their own custom subjects"
ON public.user_custom_subjects FOR UPDATE
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete their own custom subjects" ON public.user_custom_subjects;
CREATE POLICY "Users can delete their own custom subjects"
ON public.user_custom_subjects FOR DELETE
USING (auth.uid()::text = user_id);

-- 2. Manual Questions Table
CREATE TABLE IF NOT EXISTS public.user_manual_questions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    correct_option INT DEFAULT NULL,
    explanation TEXT DEFAULT NULL,
    difficulty TEXT DEFAULT 'Medium',
    source TEXT DEFAULT 'manual',
    answer_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_manual_questions_user_id ON public.user_manual_questions(user_id);

ALTER TABLE public.user_manual_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own manual questions" ON public.user_manual_questions;
CREATE POLICY "Users can read their own manual questions"
ON public.user_manual_questions FOR SELECT
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own manual questions" ON public.user_manual_questions;
CREATE POLICY "Users can insert their own manual questions"
ON public.user_manual_questions FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own manual questions" ON public.user_manual_questions;
CREATE POLICY "Users can update their own manual questions"
ON public.user_manual_questions FOR UPDATE
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete their own manual questions" ON public.user_manual_questions;
CREATE POLICY "Users can delete their own manual questions"
ON public.user_manual_questions FOR DELETE
USING (auth.uid()::text = user_id);

-- 3. Pomodoro Study Sessions Table
CREATE TABLE IF NOT EXISTS public.user_pomodoro_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    duration INT NOT NULL,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ DEFAULT NULL,
    completed_duration INT DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE',
    questions_attempted INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    question_ids JSONB DEFAULT '[]'::jsonb,
    question_sources JSONB DEFAULT '[]'::jsonb,
    manual_questions JSONB DEFAULT '[]'::jsonb,
    selected_questions JSONB DEFAULT '[]'::jsonb,
    accuracy NUMERIC DEFAULT 0,
    xp_earned INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_pomodoro_sessions_user_id ON public.user_pomodoro_sessions(user_id);

ALTER TABLE public.user_pomodoro_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own study sessions" ON public.user_pomodoro_sessions;
CREATE POLICY "Users can read their own study sessions"
ON public.user_pomodoro_sessions FOR SELECT
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own study sessions" ON public.user_pomodoro_sessions;
CREATE POLICY "Users can insert their own study sessions"
ON public.user_pomodoro_sessions FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own study sessions" ON public.user_pomodoro_sessions;
CREATE POLICY "Users can update their own study sessions"
ON public.user_pomodoro_sessions FOR UPDATE
USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete their own study sessions" ON public.user_pomodoro_sessions;
CREATE POLICY "Users can delete their own study sessions"
ON public.user_pomodoro_sessions FOR DELETE
USING (auth.uid()::text = user_id);
