-- Migration: Reddit-style User Karma and Karma Votes
-- Creates user_karma and karma_votes tables with automated recalculation trigger

-- 1. Table: user_karma
CREATE TABLE IF NOT EXISTS public.user_karma (
  user_id TEXT PRIMARY KEY,
  post_karma INT NOT NULL DEFAULT 0,
  comment_karma INT NOT NULL DEFAULT 0,
  total_karma INT GENERATED ALWAYS AS (post_karma + comment_karma) STORED,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: karma_votes
CREATE TABLE IF NOT EXISTS public.karma_votes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  voter_id TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id TEXT NOT NULL,
  target_owner_id TEXT NOT NULL,
  vote SMALLINT NOT NULL CHECK (vote IN (1, -1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT karma_votes_no_self_vote CHECK (voter_id <> target_owner_id),
  CONSTRAINT uq_karma_votes_voter_target UNIQUE (voter_id, target_type, target_id)
);

CREATE INDEX IF NOT EXISTS idx_karma_votes_target ON public.karma_votes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_karma_votes_target_owner ON public.karma_votes(target_owner_id);
CREATE INDEX IF NOT EXISTS idx_karma_votes_voter ON public.karma_votes(voter_id);

-- 3. Recalculation Procedure (Exact SUM from votes)
CREATE OR REPLACE FUNCTION public.recalculate_karma(p_user_id TEXT)
RETURNS VOID AS $$
DECLARE
  v_post_karma INT;
  v_comment_karma INT;
BEGIN
  -- Recompute exact sum of post votes received
  SELECT COALESCE(SUM(vote), 0) INTO v_post_karma
  FROM public.karma_votes
  WHERE target_owner_id = p_user_id AND target_type = 'post';

  -- Recompute exact sum of comment votes received
  SELECT COALESCE(SUM(vote), 0) INTO v_comment_karma
  FROM public.karma_votes
  WHERE target_owner_id = p_user_id AND target_type = 'comment';

  -- Upsert into user_karma table
  INSERT INTO public.user_karma (user_id, post_karma, comment_karma, updated_at)
  VALUES (p_user_id, v_post_karma, v_comment_karma, NOW())
  ON CONFLICT (user_id) DO UPDATE SET
    post_karma = EXCLUDED.post_karma,
    comment_karma = EXCLUDED.comment_karma,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Automated Trigger on karma_votes (AFTER INSERT / UPDATE / DELETE)
CREATE OR REPLACE FUNCTION public.trig_recalculate_karma()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_karma(OLD.target_owner_id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.target_owner_id <> NEW.target_owner_id THEN
      PERFORM public.recalculate_karma(OLD.target_owner_id);
    END IF;
    PERFORM public.recalculate_karma(NEW.target_owner_id);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.recalculate_karma(NEW.target_owner_id);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_karma_votes_recalculate ON public.karma_votes;
CREATE TRIGGER tr_karma_votes_recalculate
  AFTER INSERT OR UPDATE OR DELETE ON public.karma_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.trig_recalculate_karma();

-- 5. RLS Policies: Service-role only access (Server interacts securely with service_role key)
ALTER TABLE public.user_karma ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karma_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only access for user_karma" ON public.user_karma;
CREATE POLICY "Service role only access for user_karma"
  ON public.user_karma
  FOR ALL
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS "Service role only access for karma_votes" ON public.karma_votes;
CREATE POLICY "Service role only access for karma_votes"
  ON public.karma_votes
  FOR ALL
  USING (false)
  WITH CHECK (false);
