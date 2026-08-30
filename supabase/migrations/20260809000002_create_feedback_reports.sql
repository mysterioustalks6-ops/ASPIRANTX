-- Migration: Create feedback_reports table
CREATE TABLE IF NOT EXISTS public.feedback_reports (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  user_email TEXT NOT NULL,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending','Under Review','Resolved','Rejected')),
  admin_note TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  is_guest_submission BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;

-- Allow public insertion for feedback forms
CREATE POLICY "Allow feedback submission" ON public.feedback_reports
  FOR INSERT WITH CHECK (true);

-- Allow reading own feedback
CREATE POLICY "Allow reading feedback" ON public.feedback_reports
  FOR SELECT USING (true);

-- Allow admin updates
CREATE POLICY "Allow admin updates" ON public.feedback_reports
  FOR UPDATE USING (true);
