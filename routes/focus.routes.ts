import { Router, Request, Response } from 'express';
import { extractVerifiedUserFromReq } from '../authMiddleware.js';
import { FocusService, toCanonicalUuid } from '../src/lib/focus/focusService.js';

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
 * POST /api/focus/session/start
 * Starts a server-authoritative focus session
 */
router.post('/api/focus/session/start', async (req: Request, res: Response) => {
  try {
    const userId = await getAuthUserId(req);
    const { requestedMinutes, blockedApps } = req.body;

    const result = await FocusService.startSession({
      userId,
      requestedMinutes: Number(requestedMinutes) || 25,
      blockedApps: Array.isArray(blockedApps) ? blockedApps : []
    });

    res.json(result);
  } catch (err: any) {
    res.status(err.message === 'Authentication Required' ? 401 : 500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/focus/session/:id/heartbeat
 * Periodic heartbeat ping from active client session
 */
router.post('/api/focus/session/:id/heartbeat', async (req: Request, res: Response) => {
  try {
    const userId = await getAuthUserId(req);
    const sessionId = req.params.id;

    const result = await FocusService.heartbeat({ userId, sessionId });
    res.json(result);
  } catch (err: any) {
    res.status(err.message === 'Authentication Required' ? 401 : 500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/focus/session/:id/pause
 * Pause session
 */
router.post('/api/focus/session/:id/pause', async (req: Request, res: Response) => {
  try {
    const userId = await getAuthUserId(req);
    const sessionId = req.params.id;

    const result = await FocusService.pauseSession({ userId, sessionId });
    res.json(result);
  } catch (err: any) {
    res.status(err.message === 'Authentication Required' ? 401 : 500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/focus/session/:id/resume
 * Resume session
 */
router.post('/api/focus/session/:id/resume', async (req: Request, res: Response) => {
  try {
    const userId = await getAuthUserId(req);
    const sessionId = req.params.id;

    const result = await FocusService.resumeSession({ userId, sessionId });
    res.json(result);
  } catch (err: any) {
    res.status(err.message === 'Authentication Required' ? 401 : 500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/focus/session/:id/complete
 * Completes session and triggers Reward Engine evaluation
 */
router.post('/api/focus/session/:id/complete', async (req: Request, res: Response) => {
  try {
    const userId = await getAuthUserId(req);
    const sessionId = req.params.id;
    const { exam } = req.body;

    const result = await FocusService.completeSession({
      userId,
      sessionId,
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

/**
 * POST /api/focus/session/:id/cancel
 * Cancel / abort active session
 */
router.post('/api/focus/session/:id/cancel', async (req: Request, res: Response) => {
  try {
    const userId = await getAuthUserId(req);
    const sessionId = req.params.id;

    const result = await FocusService.cancelSession({ userId, sessionId });
    res.json(result);
  } catch (err: any) {
    res.status(err.message === 'Authentication Required' ? 401 : 500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * GET /api/focus/stats
 * Telemetry stats (today, week, recent sessions)
 */
router.get('/api/focus/stats', async (req: Request, res: Response) => {
  try {
    const userId = await getAuthUserId(req);
    const stats = await FocusService.getFocusStats(userId);
    res.json({ success: true, stats });
  } catch (err: any) {
    res.status(err.message === 'Authentication Required' ? 401 : 500).json({
      success: false,
      error: err.message
    });
  }
});

export default router;
