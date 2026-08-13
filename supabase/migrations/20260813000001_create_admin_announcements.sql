CREATE TABLE IF NOT EXISTS public.admin_announcements (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and restrict public access (server accesses via service_role key)
ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only access for admin_announcements" ON public.admin_announcements;
CREATE POLICY "Service role only access for admin_announcements"
  ON public.admin_announcements
  USING (false)
  WITH CHECK (false);
