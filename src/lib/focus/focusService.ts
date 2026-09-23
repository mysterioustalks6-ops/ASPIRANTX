import { pgPool, queryPostgres } from '../postgres.js';
import { RewardEngine, EventProcessResult } from '../rewards/rewardEngine.js';
import crypto from 'crypto';

export interface FocusSessionRecord {
  id: string;
  userId: string;
  requestedMinutes: number;
  verifiedMinutes: number;
  accumulatedSeconds: number;
  blockedApps: string[];
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  startedAt: string;
  lastHeartbeatAt: string;
  resumedAt?: string;
  pausedAt?: string;
  completedAt?: string;
}

export class FocusService {
  /**
   * Start a new server-authoritative Focus Session
   */
  static async startSession(params: {
    userId: string;
    requestedMinutes: number;
    blockedApps: string[];
  }): Promise<{ success: boolean; session: FocusSessionRecord }> {
    const { userId, requestedMinutes, blockedApps } = params;

    const validRequestedMinutes = Math.max(5, Math.min(360, Math.round(Number(requestedMinutes) || 25)));
    const sessionId = `foc_${crypto.randomUUID()}`;

    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      // Cancel any existing active sessions for this user to prevent ghost sessions
      await client.query(
        `UPDATE public.focus_sessions
         SET status = 'CANCELLED', updated_at = NOW()
         WHERE user_id = $1 AND status IN ('ACTIVE', 'PAUSED');`,
        [userId]
      );

      const insertRes = await client.query(
        `INSERT INTO public.focus_sessions (
           id, user_id, requested_minutes, verified_minutes, accumulated_seconds,
           blocked_apps, status, started_at, last_heartbeat_at, resumed_at, created_at, updated_at
         )
         VALUES ($1, $2, $3, 0, 0, $4, 'ACTIVE', NOW(), NOW(), NOW(), NOW(), NOW())
         RETURNING *;`,
        [sessionId, userId, validRequestedMinutes, JSON.stringify(blockedApps || [])]
      );

      await client.query('COMMIT');

      const row = insertRes.rows[0];
      return {
        success: true,
        session: this.mapRowToSession(row)
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[FocusService.startSession] Error:', err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Heartbeat to verify continuous presence (called every 60s by client)
   */
  static async heartbeat(params: {
    userId: string;
    sessionId: string;
  }): Promise<{ success: boolean; elapsedSeconds: number }> {
    const { userId, sessionId } = params;

    const res = await queryPostgres(
      `UPDATE public.focus_sessions
       SET last_heartbeat_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status = 'ACTIVE'
       RETURNING *;`,
      [sessionId, userId]
    );

    if (res.rows.length === 0) {
      throw new Error('Active focus session not found');
    }

    const row = res.rows[0];
    const resumedAt = new Date(row.resumed_at || row.started_at).getTime();
    const currentSpanSeconds = Math.max(0, Math.floor((Date.now() - resumedAt) / 1000));
    const totalElapsed = Number(row.accumulated_seconds || 0) + currentSpanSeconds;

    return {
      success: true,
      elapsedSeconds: totalElapsed
    };
  }

  /**
   * Pause the session (e.g. urgent break)
   */
  static async pauseSession(params: {
    userId: string;
    sessionId: string;
  }): Promise<{ success: boolean; accumulatedSeconds: number }> {
    const { userId, sessionId } = params;

    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      const lockRes = await client.query(
        `SELECT * FROM public.focus_sessions WHERE id = $1 AND user_id = $2 FOR UPDATE;`,
        [sessionId, userId]
      );

      if (lockRes.rows.length === 0) {
        throw new Error('Focus session not found');
      }

      const row = lockRes.rows[0];
      if (row.status !== 'ACTIVE') {
        throw new Error(`Cannot pause session with status ${row.status}`);
      }

      const resumedAt = new Date(row.resumed_at || row.started_at).getTime();
      const currentSpanSeconds = Math.max(0, Math.floor((Date.now() - resumedAt) / 1000));
      const newAccumulated = Number(row.accumulated_seconds || 0) + currentSpanSeconds;

      await client.query(
        `UPDATE public.focus_sessions
         SET status = 'PAUSED', paused_at = NOW(), accumulated_seconds = $1, updated_at = NOW()
         WHERE id = $2;`,
        [newAccumulated, sessionId]
      );

      await client.query('COMMIT');
      return { success: true, accumulatedSeconds: newAccumulated };
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[FocusService.pauseSession] Error:', err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Resume paused session
   */
  static async resumeSession(params: {
    userId: string;
    sessionId: string;
  }): Promise<{ success: boolean; resumedAt: string }> {
    const { userId, sessionId } = params;

    const res = await queryPostgres(
      `UPDATE public.focus_sessions
       SET status = 'ACTIVE', resumed_at = NOW(), last_heartbeat_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status = 'PAUSED'
       RETURNING resumed_at;`,
      [sessionId, userId]
    );

    if (res.rows.length === 0) {
      throw new Error('Paused session not found');
    }

    return { success: true, resumedAt: res.rows[0].resumed_at };
  }

  /**
   * Complete session with strict server-side verification and Reward Engine processing
   */
  static async completeSession(params: {
    userId: string;
    sessionId: string;
    userExam?: string;
  }): Promise<{
    success: boolean;
    verifiedMinutes: number;
    rewards: EventProcessResult;
  }> {
    const { userId, sessionId, userExam = 'ALL' } = params;

    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');

      const lockRes = await client.query(
        `SELECT * FROM public.focus_sessions WHERE id = $1 AND user_id = $2 FOR UPDATE;`,
        [sessionId, userId]
      );

      if (lockRes.rows.length === 0) {
        throw new Error('Focus session not found');
      }

      const row = lockRes.rows[0];
      if (row.status === 'COMPLETED') {
        // Idempotent recovery
        await client.query('COMMIT');
        return {
          success: true,
          verifiedMinutes: Number(row.verified_minutes) || 0,
          rewards: {
            success: true,
            duplicate: true,
            xpGained: 0,
            newBalance: 0,
            newLevel: 1,
            challengesProgressed: 0,
            unlockedTrophies: []
          }
        };
      }

      if (row.status === 'CANCELLED') {
        throw new Error('Cannot complete a cancelled session');
      }

      // Calculate actual verified elapsed seconds
      let additionalSeconds = 0;
      if (row.status === 'ACTIVE') {
        const resumedAt = new Date(row.resumed_at || row.started_at).getTime();
        additionalSeconds = Math.max(0, Math.floor((Date.now() - resumedAt) / 1000));
      }

      const totalVerifiedSeconds = Number(row.accumulated_seconds || 0) + additionalSeconds;
      const requestedSeconds = Number(row.requested_minutes) * 60;

      // Anti-Cheat Bound: Cannot exceed requested time + 10% grace, and minimum 1 minute
      const boundedSeconds = Math.min(requestedSeconds * 1.1, totalVerifiedSeconds);
      const verifiedMinutes = Math.max(1, Math.floor(boundedSeconds / 60));

      await client.query(
        `UPDATE public.focus_sessions
         SET status = 'COMPLETED', verified_minutes = $1, completed_at = NOW(), updated_at = NOW()
         WHERE id = $2;`,
        [verifiedMinutes, sessionId]
      );

      // Also persist to user_pomodoro_sessions for backwards compatibility with analytics
      const pomoDate = new Date().toISOString().split('T')[0];
      await client.query(
        `INSERT INTO public.user_pomodoro_sessions (id, user_id, minutes, date, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (id) DO NOTHING;`,
        [sessionId, userId, verifiedMinutes, pomoDate]
      );

      await client.query('COMMIT');

      // Dispatch to Reward Engine
      const blockedList = Array.isArray(row.blocked_apps) ? row.blocked_apps : [];
      const rewards = await RewardEngine.processEvent({
        userId,
        eventType: 'FOCUS_SESSION_COMPLETED',
        referenceId: sessionId,
        payload: {
          verifiedMinutes,
          blockedAppsCount: blockedList.length,
          sessionId
        },
        userExam
      });

      return {
        success: true,
        verifiedMinutes,
        rewards
      };
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[FocusService.completeSession] Error:', err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Cancel / Abort active focus session
   */
  static async cancelSession(params: {
    userId: string;
    sessionId: string;
  }): Promise<{ success: boolean }> {
    const { userId, sessionId } = params;

    const res = await queryPostgres(
      `UPDATE public.focus_sessions
       SET status = 'CANCELLED', updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND status IN ('ACTIVE', 'PAUSED')
       RETURNING id;`,
      [sessionId, userId]
    );

    return { success: res.rows.length > 0 };
  }

  /**
   * Aggregated focus telemetry for student dashboard
   */
  static async getFocusStats(userId: string): Promise<{
    todayMinutes: number;
    weekMinutes: number;
    totalSessions: number;
    recentSessions: FocusSessionRecord[];
  }> {
    const todayRes = await queryPostgres(
      `SELECT COALESCE(SUM(verified_minutes), 0) as today_minutes
       FROM public.focus_sessions
       WHERE user_id = $1 AND status = 'COMPLETED' AND completed_at >= CURRENT_DATE;`,
      [userId]
    );

    const weekRes = await queryPostgres(
      `SELECT COALESCE(SUM(verified_minutes), 0) as week_minutes
       FROM public.focus_sessions
       WHERE user_id = $1 AND status = 'COMPLETED' AND completed_at >= (CURRENT_DATE - INTERVAL '7 days');`,
      [userId]
    );

    const countRes = await queryPostgres(
      `SELECT COUNT(*) as total_sessions
       FROM public.focus_sessions
       WHERE user_id = $1 AND status = 'COMPLETED';`,
      [userId]
    );

    const recRes = await queryPostgres(
      `SELECT * FROM public.focus_sessions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10;`,
      [userId]
    );

    return {
      todayMinutes: Number(todayRes.rows[0]?.today_minutes) || 0,
      weekMinutes: Number(weekRes.rows[0]?.week_minutes) || 0,
      totalSessions: Number(countRes.rows[0]?.total_sessions) || 0,
      recentSessions: recRes.rows.map(this.mapRowToSession)
    };
  }

  private static mapRowToSession(row: any): FocusSessionRecord {
    return {
      id: row.id,
      userId: row.user_id,
      requestedMinutes: Number(row.requested_minutes) || 0,
      verifiedMinutes: Number(row.verified_minutes) || 0,
      accumulatedSeconds: Number(row.accumulated_seconds) || 0,
      blockedApps: Array.isArray(row.blocked_apps) ? row.blocked_apps : [],
      status: row.status,
      startedAt: row.started_at,
      lastHeartbeatAt: row.last_heartbeat_at,
      resumedAt: row.resumed_at,
      pausedAt: row.paused_at,
      completedAt: row.completed_at
    };
  }
}
