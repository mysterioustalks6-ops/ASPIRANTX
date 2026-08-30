-- Migration: Add is_guest_submission column to feedback_reports
ALTER TABLE public.feedback_reports ADD COLUMN IF NOT EXISTS is_guest_submission BOOLEAN DEFAULT false;
