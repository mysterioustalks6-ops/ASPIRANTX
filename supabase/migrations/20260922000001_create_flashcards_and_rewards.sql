-- ============================================================================
-- ASPIRANTX / PROTRACK PRODUCTION MIGRATION
-- Flashcards, Leitner Reviews, and Authoritative Reward Transactions
-- ============================================================================

-- 1. FLASHCARDS TABLE
CREATE TABLE IF NOT EXISTS public.flashcards (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exam TEXT NOT NULL DEFAULT 'ALL',
    category TEXT NOT NULL DEFAULT 'General',
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    hint TEXT DEFAULT '',
    is_custom BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON public.flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_exam ON public.flashcards(exam);

-- 2. FLASHCARD REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating TEXT NOT NULL CHECK (rating IN ('easy', 'hard')),
    leitner_box INT NOT NULL DEFAULT 1 CHECK (leitner_box BETWEEN 1 AND 5),
    next_review_at TIMESTAMPTZ NOT NULL,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    review_count INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_user_card ON public.flashcard_reviews(user_id, card_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_next ON public.flashcard_reviews(user_id, next_review_at);

-- 3. REWARD TRANSACTIONS LEDGER TABLE
CREATE TABLE IF NOT EXISTS public.reward_transactions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    type TEXT NOT NULL,
    source TEXT NOT NULL,
    amount INT NOT NULL DEFAULT 1,
    reference_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'completed',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reward_transactions_user ON public.reward_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_ref ON public.reward_transactions(reference_id);

-- RLS POLICIES
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own flashcards
CREATE POLICY "Users can manage their own flashcards"
    ON public.flashcards
    FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to manage their own reviews
CREATE POLICY "Users can manage their own flashcard reviews"
    ON public.flashcard_reviews
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own reward transactions
CREATE POLICY "Users can view their own reward transactions"
    ON public.reward_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- 4. USER TASKS TABLE
CREATE TABLE IF NOT EXISTS public.user_tasks (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    subject TEXT DEFAULT 'General Practice',
    priority TEXT DEFAULT 'High',
    minutes INT DEFAULT 45,
    status TEXT DEFAULT 'todo',
    completed BOOLEAN DEFAULT false,
    exam TEXT DEFAULT 'NEET_UG',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_tasks_user_id ON public.user_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tasks_exam ON public.user_tasks(exam);

ALTER TABLE public.user_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tasks"
    ON public.user_tasks
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

