-- Add streak_days and last_active_date columns to user_profiles table for persistence
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_active_date DATE DEFAULT NULL;
