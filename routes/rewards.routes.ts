import { Router, Request, Response } from 'express';
import { extractVerifiedUserFromReq } from '../authMiddleware.js';
import { queryPostgres } from '../src/lib/postgres.js';
import { RewardEngine, StudyEventType, getISTDateKey, getISTWeekKey } from '../src/lib/rewards/rewardEngine.js';
import { toCanonicalUuid } from '../src/lib/focus/focusService.js';

const router = Router();

async function getAuthUserId(req: Request): Promise<string> {
  const verifiedUser = extractVerifiedUserFromReq(req);
  const uid = verifiedUser?.userId || (verifiedUser as any)?.sub;
  if (!uid) {
    throw new Error('Authentication Required');
  }
  return toCanonicalUuid(uid);
}

/**
 * GET /api/rewards/overview
 * Overview stats for the Rewards Header (XP, Level, Trophies Unlocked, Streak, Focus Time)
 */
router.get('/api/rewards/overview', async (req: Request, res: Response) => {
  try {
    const userId = await getAuthUserId(req);

    // Profile XP & Level
    const profRes = await queryPostgres(
      `SELECT xp, level, streak_days, is_premium FROM public.user_profiles WHERE id = $1;`,
      [userId]
    );
    const profile = profRes.rows[0] || { xp: 0, level: 1, streak_days: 1, is_premium: false };

    // Trophies Count
    const totalAchRes = await queryPostgres(`SELECT COUNT(*) as count FROM public.achievements;`);
    const unlockedAchRes = await queryPostgres(
      `SELECT COUNT(*) as count FROM public.user_achievements WHERE user_id = $1 AND is_unlocked = TRUE;`,
      [userId]
    );

    // Verified Focus Time
    const focusRes = await queryPostgres(
      `SELECT COALESCE(SUM(verified_minutes), 0) as total_minutes
       FROM public.focus_sessions
       WHERE user_id = $1 AND status = 'COMPLETED';`,
      [userId]
    );

    res.json({
      success: true,
      overview: {
        xp: Number(profile.xp) || 0,
        level: Number(profile.level) || 1,
        streakDays: Number(profile.streak_days) || 1,
        isPremium: Boolean(profile.is_premium),
        totalTrophies: Number(totalAchRes.rows[0]?.count) || 16,
        unlockedTrophies: Number(unlockedAchRes.rows[0]?.count) || 0,
        totalFocusMinutes: Number(focusRes.rows[0]?.total_minutes) || 0
      }
    });
  } catch (err: any) {
    res.status(err.message === 'Authentication Required' ? 401 : 500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/rewards/achievements
 * Returns all trophies with user's real progress and unlock dates
 */
router.get('/api/rewards/achievements', async (req: Request, res: Response) => {
  try {
    const userId = await getAuthUserId(req);

    const query = `
      SELECT 
        a.id,
        a.code,
        a.name,
        a.description,
        a.category,
        a.rarity,
        a.icon,
        a.target_value,
        a.unit,
        a.xp_reward,
        COALESCE(ua.current_value, 0) as current_value,
        COALESCE(ua.is_unlocked, FALSE) as is_unlocked,
        ua.unlocked_at,
        ua.progress_updated_at
      FROM public.achievements a
      LEFT JOIN public.user_achievements ua 
        ON a.id = ua.achievement_id AND ua.user_id = $1
      ORDER BY 
        CASE a.rarity 
          WHEN 'LEGENDARY' THEN 1 
          WHEN 'EPIC' THEN 2 
          WHEN 'RARE' THEN 3 
          ELSE 4 
        END,
        a.category,
        a.created_at;
    `;

    const result = await queryPostgres(query, [userId]);

    const achievements = result.rows.map(r => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      category: r.category,
      rarity: r.rarity,
      icon: r.icon,
      targetValue: Number(r.target_value),
      currentValue: Number(r.current_value),
      unit: r.unit,
      xpReward: Number(r.xp_reward),
      isUnlocked: Boolean(r.is_unlocked),
      unlockedAt: r.unlocked_at,
      progressPercentage: Math.min(100, Math.round((Number(r.current_value) / Number(r.target_value)) * 100))
    }));

    res.json({
      success: true,
      achievements
    });
  } catch (err: any) {
    res.status(err.message === 'Authentication Required' ? 401 : 500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/rewards/challenges
 * Returns active daily and weekly challenges with user's progress in current period
 */
router.get('/api/rewards/challenges', async (req: Request, res: Response) => {
  try {
    const userId = await getAuthUserId(req);
    const userExam = String(req.query.exam || 'ALL');

    const todayKey = getISTDateKey();
    const weekKey = getISTWeekKey();

    const query = `
      SELECT 
        c.id,
        c.code,
        c.title,
        c.description,
        c.frequency,
        c.target_value,
        c.unit,
        c.xp_reward,
        c.exam_id,
        COALESCE(uc.current_value, 0) as current_value,
        COALESCE(uc.is_completed, FALSE) as is_completed,
        COALESCE(uc.xp_awarded, FALSE) as xp_awarded,
        uc.completed_at
      FROM public.challenges c
      LEFT JOIN public.user_challenges uc 
        ON c.id = uc.challenge_id 
       AND uc.user_id = $1 
       AND uc.period_key = CASE WHEN c.frequency = 'WEEKLY' THEN $2 ELSE $3 END
      WHERE c.is_active = TRUE AND (c.exam_id = 'ALL' OR c.exam_id = $4)
      ORDER BY 
        CASE c.frequency WHEN 'DAILY' THEN 1 WHEN 'WEEKLY' THEN 2 ELSE 3 END,
        c.created_at;
    `;

    const result = await queryPostgres(query, [userId, weekKey, todayKey, userExam]);

    const challenges = result.rows.map(r => ({
      id: r.id,
      code: r.code,
      title: r.title,
      description: r.description,
      frequency: r.frequency,
      targetValue: Number(r.target_value),
      currentValue: Number(r.current_value),
      unit: r.unit,
      xpReward: Number(r.xp_reward),
      examId: r.exam_id,
      isCompleted: Boolean(r.is_completed),
      xpAwarded: Boolean(r.xp_awarded),
      completedAt: r.completed_at,
      progressPercentage: Math.min(100, Math.round((Number(r.current_value) / Number(r.target_value)) * 100))
    }));

    res.json({
      success: true,
      periodKeys: { daily: todayKey, weekly: weekKey },
      challenges
    });
  } catch (err: any) {
    res.status(err.message === 'Authentication Required' ? 401 : 500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/rewards/history
 * Ledger audit history of XP gains
 */
router.get('/api/rewards/history', async (req: Request, res: Response) => {
  try {
    const userId = await getAuthUserId(req);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));

    const result = await queryPostgres(
      `SELECT * FROM public.reward_ledger 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2;`,
      [userId, limit]
    );

    res.json({
      success: true,
      history: result.rows.map(r => ({
        id: r.id,
        xpChange: Number(r.xp_change),
        balanceAfter: Number(r.balance_after),
        source: r.source,
        referenceId: r.reference_id,
        description: r.description,
        createdAt: r.created_at
      }))
    });
  } catch (err: any) {
    res.status(err.message === 'Authentication Required' ? 401 : 500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/rewards/event
 * Internal / client event ingestion endpoint (requires authentication & server validation)
 */
router.post('/api/rewards/event', async (req: Request, res: Response) => {
  try {
    const userId = await getAuthUserId(req);
    const { eventType, referenceId, payload, exam } = req.body;

    if (!eventType || !referenceId) {
      return res.status(400).json({ success: false, error: 'eventType and referenceId are required' });
    }

    const result = await RewardEngine.processEvent({
      userId,
      eventType: eventType as StudyEventType,
      referenceId,
      payload: payload || {},
      userExam: exam || 'ALL'
    });

    res.json(result);
  } catch (err: any) {
    res.status(err.message === 'Authentication Required' ? 401 : 500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
