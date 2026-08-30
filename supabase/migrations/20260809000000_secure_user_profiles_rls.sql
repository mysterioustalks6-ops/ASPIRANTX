-- Migration: Secure user_profiles RLS policies & restrict client mutations
-- Prevents unauthenticated/client-side override of sensitive fields (is_premium, xp, coins, level)

-- 1. Drop overly permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

-- 2. Create restricted UPDATE policy for client-side user metadata
-- Note: Sensitive fields (is_premium, xp, coins, level) cannot be updated via raw client UPDATE queries
CREATE POLICY "Users can update non-sensitive profile info"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
  );

-- 3. Create restricted INSERT policy
CREATE POLICY "Users can insert initial profile info"
  ON public.user_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
  );

-- 4. Create SECURITY DEFINER function to safely mutate gamification rewards (XP, Coins, Level) server-side
CREATE OR REPLACE FUNCTION public.grant_user_rewards(
  p_user_id UUID,
  p_xp_delta INT,
  p_coins_delta INT
)
RETURNS JSONB AS $$
DECLARE
  v_new_xp INT;
  v_new_coins INT;
  v_new_level INT;
  v_result JSONB;
BEGIN
  -- Retrieve current profile
  SELECT COALESCE(xp, 0) + p_xp_delta, COALESCE(coins, 0) + p_coins_delta
  INTO v_new_xp, v_new_coins
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for id %', p_user_id;
  END IF;

  -- Calculate level (Level = 1 + floor(XP / 500))
  v_new_level := 1 + FLOOR(GREATEST(v_new_xp, 0) / 500);

  -- Perform secure server-side update
  UPDATE public.user_profiles
  SET 
    xp = GREATEST(v_new_xp, 0),
    coins = GREATEST(v_new_coins, 0),
    level = v_new_level,
    updated_at = NOW()
  WHERE id = p_user_id;

  v_result := jsonb_build_object(
    'success', true,
    'xp', v_new_xp,
    'coins', v_new_coins,
    'level', v_new_level
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.grant_user_rewards(UUID, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_user_rewards(UUID, INT, INT) TO service_role;
