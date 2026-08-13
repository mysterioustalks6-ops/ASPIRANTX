CREATE TABLE IF NOT EXISTS public.admin_settings (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- This table is only ever read/written by the server using the service_role key
-- (never directly from the browser), so enable RLS but deny all access to the anon/public
-- roles — only the service_role (which bypasses RLS) can touch it.
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only access" ON public.admin_settings;
CREATE POLICY "Service role only access"
  ON public.admin_settings
  USING (false)
  WITH CHECK (false);
