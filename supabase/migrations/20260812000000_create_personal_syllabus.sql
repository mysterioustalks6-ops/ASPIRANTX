-- Migration: Create Personal Syllabus Nodes table for student-owned custom syllabus
-- Enables RLS so students can only read/write their own syllabus rows

CREATE TABLE IF NOT EXISTS public.personal_syllabus_nodes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam TEXT NOT NULL,
  subject TEXT NOT NULL,
  chapter TEXT,
  topic TEXT,
  subtopic TEXT,
  stage TEXT,
  weightage TEXT,
  tags TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.personal_syllabus_nodes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to prevent conflicts
DROP POLICY IF EXISTS "Users can view their own personal syllabus" ON public.personal_syllabus_nodes;
CREATE POLICY "Users can view their own personal syllabus"
  ON public.personal_syllabus_nodes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own personal syllabus" ON public.personal_syllabus_nodes;
CREATE POLICY "Users can insert their own personal syllabus"
  ON public.personal_syllabus_nodes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own personal syllabus" ON public.personal_syllabus_nodes;
CREATE POLICY "Users can update their own personal syllabus"
  ON public.personal_syllabus_nodes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own personal syllabus" ON public.personal_syllabus_nodes;
CREATE POLICY "Users can delete their own personal syllabus"
  ON public.personal_syllabus_nodes FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for fast lookups by user, exam, and subject
CREATE INDEX IF NOT EXISTS idx_personal_syllabus_user_exam_subject
  ON public.personal_syllabus_nodes (user_id, exam, subject);
