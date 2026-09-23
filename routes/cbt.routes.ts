// ============================================================================
// CANONICAL CBT ENGINE ROUTER (PRODUCTION-GRADE NEON POSTGRESQL)
// Authoritative lifecycle, zero answer leakage, atomic row locking.
// ============================================================================

import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { queryPostgres } from '../src/lib/postgres.js';
import { CbtService } from '../src/lib/cbt/cbtService.js';
import { getQuestionInventory } from '../src/lib/cbt/questionGenerator.js';
import { extractVerifiedUserFromReq } from './shared.js';

const router = Router();

async function getEffectiveUserId(req: Request): Promise<string> {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (verifiedUser && (verifiedUser.sub || verifiedUser.email)) {
    return verifiedUser.sub || verifiedUser.email;
  }
  const customGuest = (req.headers['x-guest-user-id'] as string) || (req.body?.guestUserId as string);
  if (customGuest && typeof customGuest === 'string' && customGuest.trim().length > 0) {
    return `guest_${customGuest.trim().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  }
  return 'aspirant_anonymous_user';
}

// ----------------------------------------------------------------------------
// 1. Question Inventory & Status Transparency
// ----------------------------------------------------------------------------
router.get('/api/cbt/inventory', async (req: Request, res: Response) => {
  try {
    const examId = (req.query.examId as string) || 'UPSC_CSE';
    const inventory = await getQuestionInventory(examId);
    res.json({ success: true, inventory });
  } catch (err: any) {
    console.error('[CBT Route Error] /inventory:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 2. Verified Exam Blueprints
// ----------------------------------------------------------------------------
router.get('/api/cbt/blueprints', async (req: Request, res: Response) => {
  try {
    const examId = req.query.examId as string;
    let sql = `SELECT * FROM cbt_blueprints WHERE verification_status = 'verified'`;
    const params: any[] = [];
    if (examId) {
      sql += ` AND exam_id = $1`;
      params.push(examId);
    }
    sql += ` ORDER BY title ASC;`;
    const result = await queryPostgres(sql, params);
    res.json({ success: true, blueprints: result.rows });
  } catch (err: any) {
    console.error('[CBT Route Error] /blueprints:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 3. Create Authoritative Test Attempt Session
// ----------------------------------------------------------------------------
router.post('/api/cbt/attempts/create', async (req: Request, res: Response) => {
  try {
    const userId = await getEffectiveUserId(req);
    const {
      examId,
      blueprintId,
      mode,
      title,
      count,
      allowPendingReview,
      subject,
      topic
    } = req.body;

    if (!examId) {
      return res.status(400).json({ success: false, error: 'examId is required.' });
    }

    const { attempt, questions } = await CbtService.createAttempt({
      userId,
      examId,
      blueprintId,
      mode,
      title,
      count: count ? parseInt(count, 10) : undefined,
      allowPendingReview: allowPendingReview ?? true,
      subject,
      topic
    });

    res.json({ success: true, attempt, questions });
  } catch (err: any) {
    console.error('[CBT Route Error] /attempts/create:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 4. Get Live Attempt State (Zero Answer Leakage)
// ----------------------------------------------------------------------------
router.get('/api/cbt/attempts/:id', async (req: Request, res: Response) => {
  try {
    const userId = await getEffectiveUserId(req);
    const attemptId = req.params.id;

    const attemptData = await CbtService.getAttemptPublic(attemptId, userId);
    res.json({ success: true, ...attemptData });
  } catch (err: any) {
    console.error('[CBT Route Error] GET /attempts/:id:', err.message);
    res.status(404).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 5. Record Answer (Concurrency-Safe Row Locking)
// ----------------------------------------------------------------------------
router.post('/api/cbt/attempts/:id/answer', async (req: Request, res: Response) => {
  try {
    const userId = await getEffectiveUserId(req);
    const attemptId = req.params.id;
    const { questionId, selectedAnswer, confidenceLevel, timeSpentIncrement } = req.body;

    if (!questionId) {
      return res.status(400).json({ success: false, error: 'questionId is required.' });
    }

    const result = await CbtService.recordAnswer({
      attemptId,
      userId,
      questionId,
      selectedAnswer,
      confidenceLevel,
      timeSpentIncrement: timeSpentIncrement ? parseInt(timeSpentIncrement, 10) : 0
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[CBT Route Error] POST /attempts/:id/answer:', err.message);
    const status = err.message.includes('PAUSED') ? 409 : (err.message.includes('expired') ? 410 : 400);
    res.status(status).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 6. Mark / Unmark Question for Review
// ----------------------------------------------------------------------------
router.post('/api/cbt/attempts/:id/mark', async (req: Request, res: Response) => {
  try {
    const userId = await getEffectiveUserId(req);
    const attemptId = req.params.id;
    const { questionId, isMarked } = req.body;

    if (!questionId || typeof isMarked !== 'boolean') {
      return res.status(400).json({ success: false, error: 'questionId and isMarked (boolean) required.' });
    }

    const result = await CbtService.markQuestion({
      attemptId,
      userId,
      questionId,
      isMarked
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[CBT Route Error] POST /attempts/:id/mark:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 7. Pause Attempt (Server Authoritative)
// ----------------------------------------------------------------------------
router.post('/api/cbt/attempts/:id/pause', async (req: Request, res: Response) => {
  try {
    const userId = await getEffectiveUserId(req);
    const attemptId = req.params.id;

    const result = await CbtService.pauseAttempt(attemptId, userId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[CBT Route Error] POST /attempts/:id/pause:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 8. Resume Attempt (Server Authoritative)
// ----------------------------------------------------------------------------
router.post('/api/cbt/attempts/:id/resume', async (req: Request, res: Response) => {
  try {
    const userId = await getEffectiveUserId(req);
    const attemptId = req.params.id;

    const result = await CbtService.resumeAttempt(attemptId, userId);
    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[CBT Route Error] POST /attempts/:id/resume:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 9. Submit Attempt (Idempotent & Authoritative Evaluation)
// ----------------------------------------------------------------------------
router.post('/api/cbt/attempts/:id/submit', async (req: Request, res: Response) => {
  try {
    const userId = await getEffectiveUserId(req);
    const attemptId = req.params.id;

    const result = await CbtService.submitAttempt(attemptId, userId);
    res.json({ success: true, result });
  } catch (err: any) {
    console.error('[CBT Route Error] POST /attempts/:id/submit:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 10. Get Attempt Result
// ----------------------------------------------------------------------------
router.get('/api/cbt/attempts/:id/result', async (req: Request, res: Response) => {
  try {
    const userId = await getEffectiveUserId(req);
    const attemptId = req.params.id;

    const resDb = await queryPostgres(
      `SELECT * FROM cbt_attempt_results WHERE attempt_id = $1 AND user_id = $2;`,
      [attemptId, userId]
    );

    if (resDb.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Result not found or exam not submitted yet.' });
    }

    res.json({ success: true, result: resDb.rows[0] });
  } catch (err: any) {
    console.error('[CBT Route Error] GET /attempts/:id/result:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 11. Post-Exam Question Review (Only Allowed When Submitted)
// ----------------------------------------------------------------------------
router.get('/api/cbt/attempts/:id/review', async (req: Request, res: Response) => {
  try {
    const userId = await getEffectiveUserId(req);
    const attemptId = req.params.id;

    const questions = await CbtService.getAttemptReview(attemptId, userId);
    res.json({ success: true, questions });
  } catch (err: any) {
    console.error('[CBT Route Error] GET /attempts/:id/review:', err.message);
    const status = err.message.includes('only available after') ? 403 : 400;
    res.status(status).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 12. Tag Mistake ("Why Was I Wrong?")
// ----------------------------------------------------------------------------
router.post('/api/cbt/attempts/:id/mistake', async (req: Request, res: Response) => {
  try {
    const userId = await getEffectiveUserId(req);
    const attemptId = req.params.id;
    const { questionId, mistakeCategory, notes } = req.body;

    if (!questionId || !mistakeCategory) {
      return res.status(400).json({ success: false, error: 'questionId and mistakeCategory required.' });
    }

    const result = await CbtService.tagMistake({
      attemptId,
      userId,
      questionId,
      mistakeCategory,
      notes
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    console.error('[CBT Route Error] POST /attempts/:id/mistake:', err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 13. Historical Attempts for User
// ----------------------------------------------------------------------------
router.get('/api/cbt/history', async (req: Request, res: Response) => {
  try {
    const userId = await getEffectiveUserId(req);
    const examId = req.query.examId as string;

    const history = await CbtService.getUserHistory(userId, examId);
    res.json({ success: true, history });
  } catch (err: any) {
    console.error('[CBT Route Error] GET /history:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------------------------------
// 14. Post-Exam AI Discussion for a Specific Question
// ----------------------------------------------------------------------------
router.post('/api/cbt/ai-discuss', async (req: Request, res: Response) => {
  try {
    const { questionText, options, correctAnswer, selectedAnswer, explanation, userPrompt } = req.body;

    if (!questionText || !userPrompt) {
      return res.status(400).json({ success: false, error: 'questionText and userPrompt required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        success: true,
        reply: `AI analysis: You asked about: "${userPrompt}". The correct answer is Option ${(typeof correctAnswer === 'number' ? correctAnswer + 1 : correctAnswer)}. Explanation: ${explanation || 'Consult the standard reference books for this topic.'}`
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a high-level competitive examination mentor and subject matter expert for Indian civil services and competitive exams (UPSC, NEET, JEE, SSC).
A student has completed a Computer Based Test (CBT) and is reviewing a question.

QUESTION DETAILS:
Question: ${questionText}
Options: ${JSON.stringify(options)}
Correct Answer: Option ${typeof correctAnswer === 'number' ? correctAnswer + 1 : correctAnswer} (${options?.[correctAnswer] || ''})
Student's Selected Answer: ${selectedAnswer !== null && selectedAnswer !== undefined ? `Option ${selectedAnswer + 1} (${options?.[selectedAnswer] || ''})` : 'Unattempted'}
Official Explanation: ${explanation || 'None provided'}

STUDENT'S DOUBT / QUESTION:
"${userPrompt}"

Provide a crisp, clear, intellectually rigorous explanation that clarifies their doubt, explains why the correct option is right, why the distractor options are incorrect, and provides a memorable conceptual takeaway. Keep it supportive and focused on exam mastery.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const reply = response.text || 'Unable to generate explanation at this time.';
    res.json({ success: true, reply });
  } catch (err: any) {
    console.error('[CBT Route Error] POST /ai-discuss:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
