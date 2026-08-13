-- Migration: Team Applications table for Join Team submissions
-- RLS Policy: Service-role only access (deny public read/write)

CREATE TABLE IF NOT EXISTS public.team_applications (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    bio TEXT DEFAULT '',
    github TEXT DEFAULT '',
    linkedin TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_applications_created_at ON public.team_applications(created_at DESC);

ALTER TABLE public.team_applications ENABLE ROW LEVEL SECURITY;

-- Service-role only RLS policy (matching 20260813000000_create_admin_settings.sql style)
DROP POLICY IF EXISTS "Deny public access to team applications" ON public.team_applications;
CREATE POLICY "Deny public access to team applications"
ON public.team_applications
FOR ALL
USING (false)
WITH CHECK (false);
