-- Migration: Add workspace_preferences JSONB column to user_profiles table
-- Allows authenticated users to persist their customized workspace tool layout, reorderings, and active preferences across sessions.

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS workspace_preferences JSONB DEFAULT NULL;

COMMENT ON COLUMN public.user_profiles.workspace_preferences IS 'Stores customized workspace layout, active feature toggles, sort orders, and last used timestamps.';
