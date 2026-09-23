import { pgPool, queryPostgres } from '../postgres.js';
import crypto from 'crypto';

export type StudyEventType = 
  | 'POMODORO_COMPLETED'
  | 'TASK_COMPLETED'
  | 'CBT_COMPLETED'
  | 'QUESTION_SOLVED'
  | 'FLASHCARD_REVIEWED'
  | 'CHAPTER_COMPLETED'
  | 'FOCUS_SESSION_COMPLETED'
  | 'STREAK_CONTINUED';

export interface StudyEventPayload {
  minutes?: number;
  verifiedMinutes?: number;
  score?: number;
  accuracy?: number;
  totalQuestions?: number;
  correctCount?: number;
  subject?: string;
  examId?: string;
  rating?: string;
  blockedAppsCount?: number;
  streakDays?: number;
  date?: string;
  [key: string]: any;
}

export interface TrophyUnlock {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  icon: string;
  xpReward: number;
  unlockedAt: string;
}

export interface EventProcessResult {
  success: boolean;
  duplicate: boolean;
  xpGained: number;
  newBalance: number;
  newLevel: number;
  challengesProgressed: number;
  unlockedTrophies: TrophyUnlock[];
}

/**
 * Standard IST date helpers for Daily & Weekly challenge periods
 */
export function getISTDateKey(d = new Date()): string {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(d.getTime() + istOffset);
  return ist.toISOString().split('T')[0];
}

export function getISTWeekKey(d = new Date()): string {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const target = new Date(d.getTime() + istOffset);
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.getTime();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  const weekNum = 1 + Math.ceil((firstThursday - target.getTime()) / 604800000);
  return `${target.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Reward Engine: Server-Authoritative Study Event Processor
 * Atomic, idempotent, and backed by Neon PostgreSQL transactions.
 */
export class RewardEngine {
  /**
   * Main entrypoint for processing any study activity
   */
  static async processEvent(params: {
    userId: string;
    eventType: StudyEventType;
    referenceId: string;
    payload: StudyEventPayload;
    userExam?: string;
  }): Promise<EventProcessResult> {
    const { userId, eventType, referenceId, payload, userExam = 'ALL' } = params;

    if (!pgPool) {
      throw new Error('Database pool is not initialized');
    }

    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      // 1. Idempotency Check: Insert into reward_events
      const eventId = `evt_${crypto.randomUUID()}`;
      const eventRes = await client.query(
        `INSERT INTO public.reward_events (id, user_id, event_type, reference_id, event_payload, processed_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (user_id, event_type, reference_id) DO NOTHING
         RETURNING id;`,
        [eventId, userId, eventType, referenceId, JSON.stringify(payload)]
      );

      // If duplicate action, return current state without double awarding
      if (eventRes.rowCount === 0) {
        await client.query('COMMIT');
        const prof = await this.getUserProfile(client, userId);
        return {
          success: true,
          duplicate: true,
          xpGained: 0,
          newBalance: prof.xp,
          newLevel: prof.level,
          challengesProgressed: 0,
          unlockedTrophies: []
        };
      }

      let totalXpToAward = 0;
      let challengesUpdatedCount = 0;
      const unlockedTrophies: TrophyUnlock[] = [];

      // 2. Base XP from Event Type
      let baseEventXp = 0;
      let eventDesc = '';

      switch (eventType) {
        case 'POMODORO_COMPLETED': {
          const mins = Math.max(1, Math.min(360, Number(payload.verifiedMinutes || payload.minutes || 25)));
          baseEventXp = Math.min(100, Math.max(10, Math.round(mins * 2)));
          eventDesc = `Completed ${mins}-minute focus sprint`;
          break;
        }
        case 'FOCUS_SESSION_COMPLETED': {
          const mins = Math.max(1, Math.min(360, Number(payload.verifiedMinutes || 25)));
          baseEventXp = Math.min(150, Math.max(15, Math.round(mins * 2.5)));
          eventDesc = `Completed ${mins}-min Focus Shield session`;
          break;
        }
        case 'CBT_COMPLETED': {
          const qCount = Number(payload.totalQuestions || 10);
          const acc = Number(payload.accuracy || 0);
          baseEventXp = Math.min(250, Math.max(25, Math.round(qCount * 2 + (acc >= 80 ? 50 : 20))));
          eventDesc = `Completed CBT Exam (${Math.round(acc)}% accuracy)`;
          break;
        }
        case 'TASK_COMPLETED': {
          baseEventXp = 25;
          eventDesc = `Completed study task`;
          break;
        }
        case 'FLASHCARD_REVIEWED': {
          baseEventXp = 5;
          eventDesc = `Reviewed flashcard`;
          break;
        }
        case 'QUESTION_SOLVED': {
          baseEventXp = payload.isCorrect ? 10 : 2;
          eventDesc = payload.isCorrect ? `Solved question correctly` : `Attempted practice question`;
          break;
        }
        case 'STREAK_CONTINUED': {
          const streak = Number(payload.streakDays || 1);
          baseEventXp = Math.min(100, 20 + Math.floor(streak / 5) * 10);
          eventDesc = `Continued daily streak (${streak} days)`;
          break;
        }
        default:
          baseEventXp = 10;
          eventDesc = `Study activity`;
      }

      totalXpToAward += baseEventXp;

      // 3. Challenge Progress Updates
      const challengeXp = await this.updateChallenges(client, userId, eventType, payload, userExam);
      totalXpToAward += challengeXp.awardedXp;
      challengesUpdatedCount = challengeXp.updatedCount;

      // 4. Achievement & Trophy Evaluation
      const trophies = await this.evaluateAchievements(client, userId, eventType, payload);
      for (const t of trophies) {
        totalXpToAward += t.xpReward;
        unlockedTrophies.push(t);
      }

      // 5. Update User Profile & Record in Ledger
      const userProfile = await this.creditUserXp(client, userId, totalXpToAward, eventType, referenceId, eventDesc);

      await client.query('COMMIT');

      return {
        success: true,
        duplicate: false,
        xpGained: totalXpToAward,
        newBalance: userProfile.xp,
        newLevel: userProfile.level,
        challengesProgressed: challengesUpdatedCount,
        unlockedTrophies
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[RewardEngine] Failed to process event:', err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Updates daily and weekly challenges and awards challenge XP upon completion
   */
  private static async updateChallenges(
    client: any,
    userId: string,
    eventType: StudyEventType,
    payload: StudyEventPayload,
    userExam: string
  ): Promise<{ awardedXp: number; updatedCount: number }> {
    const todayKey = getISTDateKey();
    const weekKey = getISTWeekKey();

    let awardedXp = 0;
    let updatedCount = 0;

    // Fetch active challenges
    const chRes = await client.query(
      `SELECT * FROM public.challenges WHERE is_active = TRUE AND (exam_id = 'ALL' OR exam_id = $1);`,
      [userExam]
    );

    for (const ch of chRes.rows) {
      let increment = 0;

      if (ch.code === 'DAILY_FOCUS_45' && (eventType === 'POMODORO_COMPLETED' || eventType === 'FOCUS_SESSION_COMPLETED')) {
        increment = Number(payload.verifiedMinutes || payload.minutes || 0);
      } else if (ch.code === 'WEEKLY_FOCUS_300' && (eventType === 'POMODORO_COMPLETED' || eventType === 'FOCUS_SESSION_COMPLETED')) {
        increment = Number(payload.verifiedMinutes || payload.minutes || 0);
      } else if (ch.code === 'DAILY_QUESTIONS_15' && (eventType === 'QUESTION_SOLVED' || eventType === 'CBT_COMPLETED')) {
        increment = Number(payload.correctCount || (payload.isCorrect ? 1 : 0));
      } else if (ch.code === 'DAILY_TASKS_2' && eventType === 'TASK_COMPLETED') {
        increment = 1;
      } else if (ch.code === 'WEEKLY_CBT_2' && eventType === 'CBT_COMPLETED') {
        increment = 1;
      } else if (ch.code === 'WEEKLY_CARDS_40' && eventType === 'FLASHCARD_REVIEWED') {
        increment = 1;
      } else if (ch.code.startsWith('EXAM_') && eventType === 'CBT_COMPLETED') {
        increment = 1;
      }

      if (increment <= 0) continue;

      const periodKey = ch.frequency === 'WEEKLY' ? weekKey : todayKey;
      const userChId = `uch_${crypto.randomUUID()}`;
      const isCompleted = Number(increment) >= Number(ch.target_value);

      // Upsert user challenge progress
      const upsertRes = await client.query(
        `INSERT INTO public.user_challenges (id, user_id, challenge_id, period_key, current_value, target_value, is_completed, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (user_id, challenge_id, period_key)
         DO UPDATE SET
           current_value = user_challenges.current_value + $5,
           is_completed = (user_challenges.current_value + $5) >= user_challenges.target_value,
           updated_at = NOW()
         RETURNING is_completed, xp_awarded, current_value;`,
        [userChId, userId, ch.id, periodKey, Number(increment), Number(ch.target_value), isCompleted]
      );

      updatedCount++;

      // Check if newly completed and XP not yet awarded
      if (upsertRes.rows.length > 0) {
        const row = upsertRes.rows[0];
        if (row.is_completed && !row.xp_awarded) {
          await client.query(
            `UPDATE public.user_challenges SET xp_awarded = TRUE, completed_at = NOW() WHERE user_id = $1 AND challenge_id = $2 AND period_key = $3;`,
            [userId, ch.id, periodKey]
          );
          awardedXp += ch.xp_reward;
        }
      }
    }

    return { awardedXp, updatedCount };
  }

  /**
   * Evaluates canonical achievements and unlocks trophies
   */
  private static async evaluateAchievements(
    client: any,
    userId: string,
    eventType: StudyEventType,
    payload: StudyEventPayload
  ): Promise<TrophyUnlock[]> {
    const unlocked: TrophyUnlock[] = [];

    // Map events to achievement codes
    const metrics: Array<{ code: string; increment?: number; setValue?: number }> = [];

    if (eventType === 'POMODORO_COMPLETED' || eventType === 'FOCUS_SESSION_COMPLETED') {
      const mins = Number(payload.verifiedMinutes || payload.minutes || 0);
      metrics.push({ code: 'FOCUS_FIRST_STEP', setValue: 25 });
      metrics.push({ code: 'FOCUS_10H', increment: mins });
      metrics.push({ code: 'FOCUS_50H', increment: mins });
      metrics.push({ code: 'FOCUS_100H', increment: mins });
      if (eventType === 'FOCUS_SESSION_COMPLETED') {
        metrics.push({ code: 'SHIELD_GUARDIAN', increment: 1 });
      }
      // Early bird check (before 7:00 AM IST)
      const istHour = new Date(Date.now() + 5.5 * 3600000).getUTCHours();
      if (istHour < 7) {
        metrics.push({ code: 'EARLY_BIRD', setValue: 1 });
      }
    } else if (eventType === 'STREAK_CONTINUED') {
      const streak = Number(payload.streakDays || 1);
      metrics.push({ code: 'STREAK_3D', setValue: streak });
      metrics.push({ code: 'STREAK_7D', setValue: streak });
      metrics.push({ code: 'STREAK_30D', setValue: streak });
    } else if (eventType === 'CBT_COMPLETED') {
      metrics.push({ code: 'CBT_FIRST_TEST', setValue: 1 });
      const acc = Number(payload.accuracy || 0);
      if (acc >= 90) {
        metrics.push({ code: 'CBT_PERFECT', setValue: acc });
      }
      const correct = Number(payload.correctCount || 0);
      if (correct > 0) {
        metrics.push({ code: 'QUESTIONS_100', increment: correct });
        metrics.push({ code: 'QUESTIONS_500', increment: correct });
      }
    } else if (eventType === 'QUESTION_SOLVED' && payload.isCorrect) {
      metrics.push({ code: 'QUESTIONS_100', increment: 1 });
      metrics.push({ code: 'QUESTIONS_500', increment: 1 });
    } else if (eventType === 'TASK_COMPLETED') {
      metrics.push({ code: 'TASKS_10', increment: 1 });
      metrics.push({ code: 'TASKS_50', increment: 1 });
    } else if (eventType === 'FLASHCARD_REVIEWED') {
      metrics.push({ code: 'CARDS_50', increment: 1 });
    }

    if (metrics.length === 0) return unlocked;

    for (const m of metrics) {
      const achRes = await client.query(`SELECT * FROM public.achievements WHERE code = $1;`, [m.code]);
      if (achRes.rows.length === 0) continue;
      const ach = achRes.rows[0];

      // Check current user achievement
      const uAchRes = await client.query(
        `SELECT * FROM public.user_achievements WHERE user_id = $1 AND achievement_id = $2;`,
        [userId, ach.id]
      );

      let curVal = 0;
      let alreadyUnlocked = false;

      if (uAchRes.rows.length > 0) {
        curVal = Number(uAchRes.rows[0].current_value);
        alreadyUnlocked = uAchRes.rows[0].is_unlocked;
      }

      if (alreadyUnlocked) continue;

      if (m.setValue !== undefined) {
        curVal = Math.max(curVal, m.setValue);
      } else if (m.increment !== undefined) {
        curVal += m.increment;
      }

      const shouldUnlock = curVal >= Number(ach.target_value);

      const uAchId = uAchRes.rows[0]?.id || `uach_${crypto.randomUUID()}`;
      await client.query(
        `INSERT INTO public.user_achievements (id, user_id, achievement_id, current_value, target_value, is_unlocked, unlocked_at, progress_updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $6 THEN NOW() ELSE NULL END, NOW())
         ON CONFLICT (user_id, achievement_id)
         DO UPDATE SET
           current_value = EXCLUDED.current_value,
           is_unlocked = EXCLUDED.is_unlocked,
           unlocked_at = CASE WHEN EXCLUDED.is_unlocked AND user_achievements.unlocked_at IS NULL THEN NOW() ELSE user_achievements.unlocked_at END,
           progress_updated_at = NOW();`,
        [uAchId, userId, ach.id, curVal, ach.target_value, shouldUnlock]
      );

      if (shouldUnlock) {
        unlocked.push({
          id: ach.id,
          code: ach.code,
          name: ach.name,
          description: ach.description,
          category: ach.category,
          rarity: ach.rarity,
          icon: ach.icon,
          xpReward: ach.xp_reward,
          unlockedAt: new Date().toISOString()
        });
      }
    }

    return unlocked;
  }

  /**
   * Atomic XP credit and ledger audit logging
   */
  private static async creditUserXp(
    client: any,
    userId: string,
    xpToAdd: number,
    source: string,
    refId: string,
    description: string
  ): Promise<{ xp: number; level: number }> {
    // 1. Fetch current profile
    const profRes = await client.query(
      `SELECT xp, level FROM public.user_profiles WHERE id = $1 FOR UPDATE;`,
      [userId]
    );

    let currentXp = 0;
    if (profRes.rows.length > 0) {
      currentXp = Number(profRes.rows[0].xp) || 0;
    }

    const newXp = currentXp + xpToAdd;
    const newLevel = Math.max(1, Math.floor(newXp / 200) + 1);

    // 2. Update user_profiles
    await client.query(
      `INSERT INTO public.user_profiles (id, xp, level, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (id) DO UPDATE SET xp = $2, level = $3, updated_at = NOW();`,
      [userId, newXp, newLevel]
    );

    // 3. Write to reward_ledger
    if (xpToAdd > 0) {
      const ledgerId = `ledg_${crypto.randomUUID()}`;
      await client.query(
        `INSERT INTO public.reward_ledger (id, user_id, xp_change, balance_after, source, reference_id, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());`,
        [ledgerId, userId, xpToAdd, newXp, source, refId, description]
      );
    }

    return { xp: newXp, level: newLevel };
  }

  private static async getUserProfile(client: any, userId: string): Promise<{ xp: number; level: number }> {
    const res = await client.query(`SELECT xp, level FROM public.user_profiles WHERE id = $1;`, [userId]);
    if (res.rows.length === 0) return { xp: 0, level: 1 };
    return {
      xp: Number(res.rows[0].xp) || 0,
      level: Number(res.rows[0].level) || 1
    };
  }
}
