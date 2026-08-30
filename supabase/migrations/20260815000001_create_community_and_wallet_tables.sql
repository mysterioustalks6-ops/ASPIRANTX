-- Migration: Community Posts, Community Votes, User Wallets, User Payouts, Community Groups, Comments, Reports & CBT Results
-- RLS Policy: Service-role only access (deny public direct read/write; server operates via service_role key)

-- 1. Community Posts
CREATE TABLE IF NOT EXISTS public.community_posts (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at DESC);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only access for community_posts" ON public.community_posts;
CREATE POLICY "Service role only access for community_posts"
  ON public.community_posts
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- 2. Community Votes (Reddit-style up/down votes with relational lookup)
CREATE TABLE IF NOT EXISTS public.community_votes (
  key TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  vote_type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_votes_post_id ON public.community_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_votes_user_id ON public.community_votes(user_id);

ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only access for community_votes" ON public.community_votes;
CREATE POLICY "Service role only access for community_votes"
  ON public.community_votes
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- 3. User Wallets (Study Coins balance, escrow held, transactions)
CREATE TABLE IF NOT EXISTS public.user_wallets (
  user_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only access for user_wallets" ON public.user_wallets;
CREATE POLICY "Service role only access for user_wallets"
  ON public.user_wallets
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- 4. User Payouts (Real Escrow & Admin Reviewed Payout Requests)
CREATE TABLE IF NOT EXISTS public.user_payouts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_payouts_user_id ON public.user_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payouts_created_at ON public.user_payouts(created_at DESC);

ALTER TABLE public.user_payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only access for user_payouts" ON public.user_payouts;
CREATE POLICY "Service role only access for user_payouts"
  ON public.user_payouts
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- 5. Community Groups
CREATE TABLE IF NOT EXISTS public.community_groups (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only access for community_groups" ON public.community_groups;
CREATE POLICY "Service role only access for community_groups"
  ON public.community_groups
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- 6. Community Comments
CREATE TABLE IF NOT EXISTS public.community_comments (
  post_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only access for community_comments" ON public.community_comments;
CREATE POLICY "Service role only access for community_comments"
  ON public.community_comments
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- 7. Community Abuse Reports
CREATE TABLE IF NOT EXISTS public.community_reports (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only access for community_reports" ON public.community_reports;
CREATE POLICY "Service role only access for community_reports"
  ON public.community_reports
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- 8. CBT Exam Results
CREATE TABLE IF NOT EXISTS public.cbt_results (
  user_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cbt_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only access for cbt_results" ON public.cbt_results;
CREATE POLICY "Service role only access for cbt_results"
  ON public.cbt_results
  FOR ALL
  USING (false)
  WITH CHECK (false);
