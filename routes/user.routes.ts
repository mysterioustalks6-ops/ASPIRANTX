// ============================================================================
// USER, AUTH, PROFILE, WALLET, NOTIFICATIONS & EXAMS ROUTES
// ============================================================================
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  type AdminAnnouncement,
  type AiConversationRecord,
  type AiMessageRecord,
  type AuditLog,
  type BlogContentRequestRecord,
  type BlogPostRecord,
  type EducatorBookingRecord,
  type EducatorChatMessage,
  type EducatorRecord,
  type EncryptedErrorPayload,
  type FeatureFlagItem,
  type FeedbackReport,
  type OrderRecord,
  type QuestionRepeatInfo,
  type SubscriptionRecord,
  type TopperPodcastRecord,
  type UserErrorLogRecord,
  type UtrRequestRecord,
  type WatchdogLog
} from './shared.js';
import {
  ACADEMIC_CACHE_TTL_MS,
  APP_VERSION,
  COMPREHENSIVE_BOOKS_DATABASE,
  DEFAULT_BLOG_POSTS,
  DEFAULT_CBT_MOCKS,
  DEFAULT_COLLABORATORS_LIST,
  DEFAULT_COMMUNITY_GROUPS,
  DEFAULT_COMMUNITY_POSTS,
  DEFAULT_EDUCATORS_LIST,
  DEFAULT_NOTIFS,
  DEFAULT_OFFICE_ACTIVITIES,
  DEFAULT_PODCASTS_LIST,
  DEFAULT_SPONSORS_LIST,
  DESIGNATED_ADMIN_EMAIL,
  EXCLUDED_HYDRATION_PATHS,
  GATEWAY_SETTINGS_CACHE_MS,
  INITIAL_FEEDBACK_REPORTS,
  INITIAL_PYQS_DATABASE,
  INITIAL_QUESTION_BANK,
  INITIAL_SYLLABUS_HIERARCHY,
  JWT_SECRET,
  PROFANITY_LIST,
  SUPABASE_KEY,
  SUPABASE_URL,
  activeSponsorsStore,
  activeUsersPresenceMap,
  adRewardsDb,
  addAdminAuditLogRecord,
  adminAnnouncementsStore,
  adminCbtExamsStore,
  adminContentDb,
  adminMutationLimiter,
  adminTasksStore,
  adminTeamStore,
  adminUsersDb,
  aiConversationsDb,
  aiMessagesDb,
  aiRateLimiter,
  allPayoutsStore,
  assignmentSubmissionsStore,
  blockedAuditLogs,
  blogPostsStore,
  blogRequestsStore,
  booksStore,
  buildSimilarityIndexes,
  calculateJaccardSimilarity,
  calculateVerifiedMinutesForUser,
  cbtResultsStore,
  cbtTestsStore,
  checkUserServerPremiumStatus,
  classAssignmentsStore,
  classAttendanceStore,
  classEnrollmentsStore,
  cleanSubjectName,
  collaboratorsDb,
  communityBookmarksStore,
  communityCommentsStore,
  communityGroupMembershipsStore,
  communityGroupsStore,
  communityPollVotesStore,
  communityPostsStore,
  communityReportsStore,
  communityVotesStore,
  containsProfanity,
  customExamsStore,
  decryptErrorPayload,
  defaultFeatureFlagsStore,
  educatorBookingsStore,
  educatorChatsStore,
  educatorsStore,
  encryptErrorPayload,
  errorLogIpLimits,
  errorLogRateLimiter,
  extractVerifiedUserFromReq,
  featureFlagsStore,
  feedbackReportsStore,
  generateRealisticSyllabus,
  getCachedAcademicResult,
  getErrorLogEncryptionKeyBuffer,
  getGeminiClient,
  getISTDateString,
  getStandardSubject,
  getSubscriptionForEmail,
  getSystemInstructionForMode,
  getTokens,
  getWritableDataFilePath,
  globalAdminSettings,
  globalApiLimiter,
  hydrateAnnouncementsFromSupabase,
  hydrateCommunityPostsFromSupabase,
  hydrateFromPrimaryDatabase,
  hydrateKarmaFromSupabase,
  hydratePayoutsFromSupabase,
  hydrateWalletsFromSupabase,
  initializeServerState,
  isSupabaseDbConfigured,
  isValidUUID,
  karmaVotesStore,
  lastGatewaySettingsSync,
  lastHydratedAt,
  loadAdminStoreFromDisk,
  lockRazorpayEnvironment,
  mapRowToUtrRecord,
  mergeAdminSettings,
  normalizeExam,
  normalizePyqItem,
  normalizeQuestionItem,
  officeActivityFeed,
  parseFreeformSyllabus,
  paymentRateLimiter,
  pendingContentUploadsDb,
  pendingUtrRequestsDb,
  persistSubscriptionAtomic,
  personalSyllabusNodesStore,
  podcastsStore,
  processedSessionsStore,
  processedWebhookEvents,
  pyqQueryCache,
  pyqRepeatIndexMap,
  pyqReviewQueueStore,
  pyqStore,
  qbQueryCache,
  qbRepeatIndexMap,
  questionBankStore,
  rawServiceKey,
  recalculateUserKarma,
  recordAdminAuditLog,
  requireEnterprisePermission,
  rewardClaimsStore,
  rewardMilestonesStore,
  sanitizeAiPrompt,
  saveAdminStoreToDisk,
  seedDefaultSponsorshipTiers,
  sendTransactionalEmail,
  serverOrdersDb,
  serverSubscriptionsDb,
  setAdminContentDb,
  setAdminTasksStore,
  setAdminTeamStore,
  setAdminUsersDb,
  setCachedAcademicResult,
  setFeatureFlagsStore,
  setGlobalAdminSettings,
  setLastGatewaySettingsSync,
  setSimulatedErrors,
  setWatchdogSystemLogs,
  simulatedErrors,
  sponsorInquiriesDb,
  sponsorsDb,
  sponsorshipApplicationsStore,
  sponsorshipTiersStore,
  studyBuddyMatches,
  studyBuddyQueue,
  studyHeartbeatsStore,
  supabaseServer,
  syllabusNodesStore,
  syllabusTimeLogsStore,
  teacherClassesStore,
  teacherProfilesStore,
  teamApplicationsDb,
  updateGlobalAdminSettings,
  updateStreak,
  userCustomSubjectsDb,
  userErrorLogsStore,
  userKarmaStore,
  userManualQuestionsDb,
  userNotificationsStore,
  userPayoutsStore,
  userPomodoroSessionsDb,
  userWalletsStore,
  userWorkspacePreferencesDb,
  verifyAdminAuth,
  verifyRazorpayPaymentSignature,
  verifyTeacherOrAdmin,
  watchdogSystemLogs
} from './shared.js';
import * as Shared from './shared.js';
import { queryPostgres, pgPool } from '../src/lib/postgres.js';

const router = Router();
const __dirname = path.resolve();

// ─── Durable Offline Batch Sync Endpoint ──────────────────────────────────────
router.post('/api/sync/batch', async (req, res) => {
  try {
    const { userId, items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ success: true, acknowledgedIds: [] });
    }

    const acknowledgedIds: string[] = [];

    for (const item of items) {
      try {
        if (item.type === 'SYLLABUS_PROGRESS') {
          const { completedSubtopicIds } = item.payload || {};
          if (Array.isArray(completedSubtopicIds) && supabaseServer) {
            try {
              await supabaseServer.from('user_syllabus_progress').upsert({
                user_id: item.userId || userId || 'guest',
                exam_id: item.examId,
                completed_subtopic_ids: completedSubtopicIds,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id,exam_id' });
            } catch (ignored) {}
          }
        } else if (item.type === 'TELEMETRY') {
          const { studyMinutesIncrement } = item.payload || {};
          if (typeof studyMinutesIncrement === 'number') {
            await updateStreak(item.userId || userId || 'guest').catch(() => null);
          }
        } else if (item.type === 'CBT_RESULT') {
          if (cbtResultsStore) {
            const targetId = item.userId || userId || 'guest';
            const history = cbtResultsStore.get(targetId) || [];
            history.push(item.payload);
            cbtResultsStore.set(targetId, history);
          }
        }
        acknowledgedIds.push(item.id);
      } catch (itemErr) {
        console.warn('[SyncBatch] Error processing item:', item.id, itemErr);
      }
    }

    res.json({
      success: true,
      processed: acknowledgedIds.length,
      acknowledgedIds
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process batch sync', message: err.message });
  }
});

router.get('/api/user/subjects', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Authentication Required' });
  }
  const userId = verifiedUser.sub || 'user_dev';
  
  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from('user_custom_subjects')
        .select('*')
        .eq('user_id', userId);
      if (!error && data) {
        return res.json({ success: true, subjects: data.map(s => ({ id: s.id, userId: s.user_id, name: s.name, createdAt: s.created_at, updatedAt: s.updated_at })) });
      }
    } catch (e) {}
  }
  
  const userSubjects = userCustomSubjectsDb.filter(s => s.userId === userId);
  return res.json({ success: true, subjects: userSubjects });
});

router.post('/api/user/subjects', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Authentication Required' });
  }
  const userId = verifiedUser.sub || 'user_dev';
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Subject name is required' });
  }
  
  const newSubject = {
    id: `subj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    name: name.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  userCustomSubjectsDb.push(newSubject);

  if (supabaseServer) {
    try {
      await supabaseServer.from('user_custom_subjects').insert([{
        id: newSubject.id,
        user_id: newSubject.userId,
        name: newSubject.name,
        created_at: newSubject.createdAt,
        updated_at: newSubject.updatedAt
      }]);
    } catch (e) {}
  }

  return res.json({ success: true, subject: newSubject });
});

router.patch('/api/user/subjects/:id', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Authentication Required' });
  }
  const userId = verifiedUser.sub || 'user_dev';
  const { id } = req.params;
  const { name } = req.body;
  
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Subject name is required' });
  }

  const existing = userCustomSubjectsDb.find(s => s.id === id);
  if (existing) {
    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: Cannot modify custom subject owned by another user' });
    }
    existing.name = name.trim();
    existing.updatedAt = new Date().toISOString();
    return res.json({ success: true, subject: existing });
  }

  if (supabaseServer) {
    try {
      const { data } = await supabaseServer.from('user_custom_subjects').select('id, user_id, name, created_at, updated_at').eq('id', id).single();
      if (data) {
        if (data.user_id !== userId) {
          return res.status(403).json({ error: 'Forbidden: Cannot modify custom subject owned by another user' });
        }
        const { data: updated } = await supabaseServer.from('user_custom_subjects').update({ name: name.trim(), updated_at: new Date().toISOString() }).eq('id', id).select().single();
        return res.json({ success: true, subject: updated });
      }
    } catch (e) {}
  }

  return res.status(404).json({ error: 'Subject not found' });
});

router.put('/api/user/subjects/:id', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Authentication Required' });
  }
  const userId = verifiedUser.sub || 'user_dev';
  const { id } = req.params;
  const { name } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Subject name is required' });
  }

  const existing = userCustomSubjectsDb.find(s => s.id === id);
  if (existing) {
    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: Cannot modify custom subject owned by another user' });
    }
    existing.name = name.trim();
    existing.updatedAt = new Date().toISOString();
    return res.json({ success: true, subject: existing });
  }

  return res.status(404).json({ error: 'Subject not found' });
});

router.delete('/api/user/subjects/:id', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Authentication Required' });
  }
  const userId = verifiedUser.sub || 'user_dev';
  const { id } = req.params;

  const index = userCustomSubjectsDb.findIndex(s => s.id === id);
  if (index >= 0) {
    if (userCustomSubjectsDb[index].userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: Cannot delete custom subject owned by another user' });
    }
    const removed = userCustomSubjectsDb.splice(index, 1)[0];
    return res.json({ success: true, subject: removed });
  }

  if (supabaseServer) {
    try {
      const { data } = await supabaseServer.from('user_custom_subjects').select('id, user_id, name, created_at, updated_at').eq('id', id).single();
      if (data) {
        if (data.user_id !== userId) {
          return res.status(403).json({ error: 'Forbidden: Cannot delete custom subject owned by another user' });
        }
        await supabaseServer.from('user_custom_subjects').delete().eq('id', id);
        return res.json({ success: true, id });
      }
    } catch (e) {}
  }

  return res.status(404).json({ error: 'Subject not found' });
});

router.get('/api/user/workspace-preferences', async (req, res) => {
  const rawUserId = String(req.query.userId || '').trim();
  const userId = rawUserId || 'default_user';

  // 1. Try fetching from Supabase if connected (durable cloud storage)
  if (supabaseServer && rawUserId) {
    try {
      const { data, error } = await supabaseServer
        .from('user_profiles')
        .select('workspace_preferences')
        .eq('id', rawUserId)
        .maybeSingle();

      if (error) {
        console.warn(`[WorkspacePrefs] Supabase GET query error for user ${rawUserId}:`, error.message, error.code);
      } else if (data?.workspace_preferences) {
        // Cache locally in-memory for this specific user
        userWorkspacePreferencesDb.set(rawUserId, data.workspace_preferences);
        return res.json({ success: true, workspaceConfig: data.workspace_preferences });
      }
    } catch (err: any) {
      console.warn(`[WorkspacePrefs] Supabase GET exception for user ${rawUserId}:`, err?.message || err);
    }
  }

  // 2. Fast in-memory cache lookup strictly scoped to this specific userId (no cross-user fallback)
  if (userWorkspacePreferencesDb.has(userId)) {
    const cached = userWorkspacePreferencesDb.get(userId);
    return res.json({ success: true, workspaceConfig: cached });
  }

  return res.json({ success: true, workspaceConfig: null });
});

router.post('/api/user/workspace-preferences', async (req, res) => {
  const rawUserId = String(req.body.userId || '').trim();
  const userId = rawUserId || 'default_user';
  const workspaceConfig = req.body.workspaceConfig;

  if (!workspaceConfig) {
    return res.status(400).json({ error: 'Missing workspaceConfig payload' });
  }

  // Store in-memory strictly for this userId
  userWorkspacePreferencesDb.set(userId, workspaceConfig);

  // Sync durably to Supabase user_profiles if connected
  if (supabaseServer && rawUserId) {
    try {
      const { error } = await supabaseServer
        .from('user_profiles')
        .update({ 
          workspace_preferences: workspaceConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', rawUserId);

      if (error) {
        console.warn(`[WorkspacePrefs] Supabase POST update warning for user ${rawUserId}:`, error.message, error.code);
      }
    } catch (err: any) {
      console.warn(`[WorkspacePrefs] Supabase update exception for user ${rawUserId}:`, err?.message || err);
    }
  }

  return res.json({ success: true, workspaceConfig });
});

router.get('/api/user/questions', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Authentication Required' });
  }
  const userId = verifiedUser.sub || 'user_dev';

  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from('user_manual_questions')
        .select('*')
        .eq('user_id', userId);
      if (!error && data) {
        return res.json({
          success: true,
          questions: data.map(q => ({
            id: q.id,
            userId: q.user_id,
            subject: q.subject,
            topic: q.topic,
            questionText: q.question_text,
            options: q.options,
            correctOption: q.correct_option,
            explanation: q.explanation,
            difficulty: q.difficulty,
            source: 'manual',
            answerVerified: Boolean(q.answer_verified),
            createdAt: q.created_at
          }))
        });
      }
    } catch (e) {}
  }

  const userQuestions = userManualQuestionsDb.filter(q => q.userId === userId);
  return res.json({ success: true, questions: userQuestions });
});

router.post('/api/user/questions', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Authentication Required' });
  }
  const userId = verifiedUser.sub || 'user_dev';
  const { questionText, options, correctOption, explanation, subject, topic, difficulty } = req.body;

  if (!questionText || typeof questionText !== 'string' || !questionText.trim()) {
    return res.status(400).json({ error: 'Question text is required' });
  }

  // Answer validation rule: If correctOption is omitted, null, or empty, set correctOption = null & answerVerified = false
  const validCorrectOption = (typeof correctOption === 'number' && correctOption >= 0 && correctOption <= 3) ? correctOption : null;
  const isVerified = validCorrectOption !== null;

  const newQuestion = {
    id: `mq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    subject: (subject || 'General').trim(),
    topic: (topic || 'General').trim(),
    questionText: questionText.trim(),
    options: Array.isArray(options) ? options : [],
    correctOption: validCorrectOption,
    explanation: explanation ? String(explanation).trim() : null,
    difficulty: difficulty || 'Medium',
    source: 'manual' as const,
    answerVerified: isVerified,
    createdAt: new Date().toISOString()
  };

  userManualQuestionsDb.push(newQuestion);

  if (supabaseServer) {
    try {
      await supabaseServer.from('user_manual_questions').insert([{
        id: newQuestion.id,
        user_id: newQuestion.userId,
        subject: newQuestion.subject,
        topic: newQuestion.topic,
        question_text: newQuestion.questionText,
        options: newQuestion.options,
        correct_option: newQuestion.correctOption,
        explanation: newQuestion.explanation,
        difficulty: newQuestion.difficulty,
        source: 'manual',
        answer_verified: newQuestion.answerVerified,
        created_at: newQuestion.createdAt
      }]);
    } catch (e) {}
  }

  return res.json({ success: true, question: newQuestion });
});

router.patch('/api/user/questions/:id', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Authentication Required' });
  }
  const userId = verifiedUser.sub || 'user_dev';
  const { id } = req.params;

  const existing = userManualQuestionsDb.find(q => q.id === id);
  if (existing) {
    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: Cannot edit manual question owned by another user' });
    }
    if (req.body.questionText) existing.questionText = req.body.questionText.trim();
    if (Array.isArray(req.body.options)) existing.options = req.body.options;
    if (req.body.correctOption !== undefined) {
      existing.correctOption = (typeof req.body.correctOption === 'number' && req.body.correctOption >= 0) ? req.body.correctOption : null;
      existing.answerVerified = existing.correctOption !== null;
    }
    if (req.body.subject) existing.subject = req.body.subject;
    if (req.body.topic) existing.topic = req.body.topic;
    return res.json({ success: true, question: existing });
  }

  return res.status(404).json({ error: 'Question not found' });
});

router.put('/api/user/questions/:id', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Authentication Required' });
  }
  const userId = verifiedUser.sub || 'user_dev';
  const { id } = req.params;

  const existing = userManualQuestionsDb.find(q => q.id === id);
  if (existing) {
    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: Cannot edit manual question owned by another user' });
    }
    if (req.body.questionText) existing.questionText = req.body.questionText.trim();
    if (Array.isArray(req.body.options)) existing.options = req.body.options;
    if (req.body.correctOption !== undefined) {
      existing.correctOption = (typeof req.body.correctOption === 'number' && req.body.correctOption >= 0) ? req.body.correctOption : null;
      existing.answerVerified = existing.correctOption !== null;
    }
    if (req.body.subject) existing.subject = req.body.subject;
    if (req.body.topic) existing.topic = req.body.topic;
    return res.json({ success: true, question: existing });
  }

  return res.status(404).json({ error: 'Question not found' });
});

router.delete('/api/user/questions/:id', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Authentication Required' });
  }
  const userId = verifiedUser.sub || 'user_dev';
  const { id } = req.params;

  const index = userManualQuestionsDb.findIndex(q => q.id === id);
  if (index >= 0) {
    if (userManualQuestionsDb[index].userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: Cannot delete manual question owned by another user' });
    }
    const removed = userManualQuestionsDb.splice(index, 1)[0];
    return res.json({ success: true, question: removed });
  }

  return res.status(404).json({ error: 'Question not found' });
});

router.get('/api/user/study-sessions', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Authentication Required' });
  }
  const userId = verifiedUser.sub || 'user_dev';

  if (supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from('user_pomodoro_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        const mapped = data.map((s: any) => ({
          id: s.id,
          userId: s.user_id,
          subject: s.subject || 'General Study',
          topic: s.topic || 'General Topic',
          duration: Number(s.duration) || 25,
          startTime: s.start_time,
          endTime: s.end_time,
          completedDuration: Number(s.completed_duration) || 0,
          status: s.status || 'ACTIVE',
          questionsAttempted: Number(s.questions_attempted) || 0,
          correctAnswers: Number(s.correct_answers) || 0,
          questionIds: Array.isArray(s.question_ids) ? s.question_ids : [],
          questionSources: Array.isArray(s.question_sources) ? s.question_sources : [],
          manualQuestions: Array.isArray(s.manual_questions) ? s.manual_questions : [],
          selectedQuestions: Array.isArray(s.selected_questions) ? s.selected_questions : [],
          accuracy: Number(s.accuracy) || 0,
          xpEarned: Number(s.xp_earned) || 0,
          createdAt: s.created_at || new Date().toISOString()
        }));
        return res.json({ success: true, sessions: mapped });
      }
    } catch (err) {
      console.warn('Error fetching study sessions from Supabase:', err);
    }
  }

  const userSessions = userPomodoroSessionsDb.filter(s => s.userId === userId);
  return res.json({ success: true, sessions: userSessions });
});

router.post('/api/user/study-sessions', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Authentication Required' });
  }
  const userId = verifiedUser.sub || 'user_dev';
  const {
    sessionId,
    id,
    subject,
    topic,
    duration,
    startTime,
    endTime,
    completedDuration,
    status,
    questionsAttempted,
    correctAnswers,
    questionIds,
    questionSources,
    manualQuestions,
    selectedQuestions,
    accuracy,
    xpEarned
  } = req.body;

  const targetSessionId = sessionId || id || `pomo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let session = userPomodoroSessionsDb.find(s => s.id === targetSessionId);
  if (session) {
    if (session.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: Cannot update session owned by another user' });
    }
    if (subject) session.subject = subject;
    if (topic) session.topic = topic;
    if (duration) session.duration = duration;
    if (completedDuration !== undefined) session.completedDuration = completedDuration;
    if (status) session.status = status;
    if (questionsAttempted !== undefined) session.questionsAttempted = questionsAttempted;
    if (accuracy !== undefined) session.accuracy = accuracy;
  } else {
    session = {
      id: targetSessionId,
      userId,
      subject: subject || 'General Study',
      topic: topic || 'General Topic',
      duration: duration || 25,
      startTime: startTime || new Date().toISOString(),
      endTime: endTime || null,
      completedDuration: completedDuration || 0,
      status: status || 'ACTIVE',
      questionsAttempted: questionsAttempted || 0,
      correctAnswers: correctAnswers || 0,
      questionIds: Array.isArray(questionIds) ? questionIds : [],
      questionSources: Array.isArray(questionSources) ? questionSources : [],
      manualQuestions: Array.isArray(manualQuestions) ? manualQuestions : [],
      selectedQuestions: Array.isArray(selectedQuestions) ? selectedQuestions : [],
      accuracy: accuracy || 0,
      xpEarned: xpEarned || 0,
      createdAt: new Date().toISOString()
    };
    userPomodoroSessionsDb.push(session);
  }

  if (supabaseServer) {
    try {
      await supabaseServer.from('user_pomodoro_sessions').upsert([{
        id: session.id,
        user_id: session.userId,
        subject: session.subject,
        topic: session.topic,
        duration: session.duration,
        start_time: session.startTime,
        end_time: session.endTime,
        completed_duration: session.completedDuration,
        status: session.status,
        questions_attempted: session.questionsAttempted,
        correct_answers: session.correctAnswers,
        question_ids: session.questionIds,
        question_sources: session.questionSources,
        manual_questions: session.manualQuestions,
        selected_questions: session.selectedQuestions,
        accuracy: session.accuracy,
        xp_earned: session.xpEarned,
        created_at: session.createdAt
      }], { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase pomodoro session upsert error:', e);
    }
  }

  return res.json({ success: true, session });
});

router.post('/api/user/study-sessions/:id/complete', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  const userId = verifiedUser?.sub || req.body.userId || 'guest';
  const { id } = req.params;
  const { completedDuration, questionsAttempted, correctAnswers, accuracy, nodeId, nodeSource = 'official', subject, topic, subtopic } = req.body;

  // XP DEDUPLICATION CHECK (SERVER-SIDE IDEMPOTENCY)
  const isAlreadyProcessed = processedSessionsStore.has(id);
  
  let session = userPomodoroSessionsDb.find(s => s.id === id);
  if (session && session.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden: Cannot complete study session owned by another user' });
  }

  if (!session) {
    session = {
      id,
      userId,
      subject: req.body.subject || 'General Study',
      topic: req.body.topic || 'General Topic',
      duration: req.body.duration || 25,
      startTime: req.body.startTime || new Date().toISOString(),
      endTime: new Date().toISOString(),
      completedDuration: completedDuration || 1500,
      status: 'COMPLETED',
      questionsAttempted: questionsAttempted || 0,
      correctAnswers: correctAnswers || 0,
      questionIds: req.body.questionIds || [],
      questionSources: req.body.questionSources || [],
      manualQuestions: req.body.manualQuestions || [],
      selectedQuestions: req.body.selectedQuestions || [],
      accuracy: accuracy || 100,
      xpEarned: 50,
      createdAt: new Date().toISOString()
    };
    userPomodoroSessionsDb.push(session);
  } else {
    session.status = 'COMPLETED';
    session.endTime = new Date().toISOString();
    if (completedDuration) session.completedDuration = completedDuration;
    if (questionsAttempted !== undefined) session.questionsAttempted = questionsAttempted;
    if (correctAnswers !== undefined) session.correctAnswers = correctAnswers;
    if (accuracy !== undefined) session.accuracy = accuracy;
  }

  if (isAlreadyProcessed) {
    // Persist completed state to Supabase even on retry
    if (supabaseServer) {
      try {
        await supabaseServer.from('user_pomodoro_sessions').upsert([{
          id: session.id,
          user_id: session.userId,
          subject: session.subject,
          topic: session.topic,
          duration: session.duration,
          start_time: session.startTime,
          end_time: session.endTime,
          completed_duration: session.completedDuration,
          status: session.status,
          questions_attempted: session.questionsAttempted,
          correct_answers: session.correctAnswers,
          question_ids: session.questionIds,
          question_sources: session.questionSources,
          manual_questions: session.manualQuestions,
          selected_questions: session.selectedQuestions,
          accuracy: session.accuracy,
          xp_earned: session.xpEarned,
          created_at: session.createdAt
        }], { onConflict: 'id' });
      } catch (e) {}
    }

    return res.json({
      success: true,
      session,
      xpAwarded: 0,
      alreadyAwarded: true,
      message: 'Session already completed and XP awarded previously.'
    });
  }

  // Mark session ID as processed
  processedSessionsStore.add(id);

  // Calculate XP reward safely (e.g. 50 base XP)
  const xpAwarded = Math.min(100, Math.max(10, Math.round((session.completedDuration / 60) * 2)));
  session.xpEarned = xpAwarded;

  if (supabaseServer) {
    try {
      await supabaseServer.from('user_pomodoro_sessions').upsert([{
        id: session.id,
        user_id: session.userId,
        subject: session.subject,
        topic: session.topic,
        duration: session.duration,
        start_time: session.startTime,
        end_time: session.endTime,
        completed_duration: session.completedDuration,
        status: session.status,
        questions_attempted: session.questionsAttempted,
        correct_answers: session.correctAnswers,
        question_ids: session.questionIds,
        question_sources: session.questionSources,
        manual_questions: session.manualQuestions,
        selected_questions: session.selectedQuestions,
        accuracy: session.accuracy,
        xp_earned: session.xpEarned,
        created_at: session.createdAt
      }], { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase pomodoro completion upsert error:', e);
    }
  }

  // Trigger streak update if session >= 5 minutes (300 seconds)
  let streakResult = null;
  if ((session.completedDuration || 0) >= 300 || (session.duration || 0) >= 5) {
    try {
      streakResult = await updateStreak(userId);
    } catch (e) {
      console.warn('Streak update on study session complete error:', e);
    }
  }

  // Handle optional syllabus time logging inside the SAME completion request
  let syllabusTimeLogged = null;
  let totalTimeForNode = 0;
  const secondsLogged = Number(req.body.secondsLogged || completedDuration || (session.duration ? session.duration * 60 : 0)) || 0;

  if (secondsLogged > 0 && (nodeId || subject || topic || subtopic)) {
    try {
      const logRecord = {
        id: `stl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        user_id: userId,
        node_id: nodeId || null,
        node_source: nodeSource,
        subject: subject || session.subject || '',
        topic: topic || session.topic || '',
        subtopic: subtopic || '',
        seconds_logged: secondsLogged,
        session_id: id,
        created_at: new Date().toISOString()
      };

      if (!syllabusTimeLogsStore.has(userId)) syllabusTimeLogsStore.set(userId, []);
      syllabusTimeLogsStore.get(userId)!.push(logRecord);

      if (supabaseServer) {
        await supabaseServer.from('syllabus_time_log').insert([logRecord]);
      }

      // Calculate total time for this node across all logs
      const userLogs = syllabusTimeLogsStore.get(userId) || [];
      totalTimeForNode = userLogs
        .filter(l => (nodeId && l.node_id === nodeId) || (l.subject === (subject || session.subject) && l.subtopic === subtopic))
        .reduce((sum, l) => sum + (l.seconds_logged || 0), 0);

      // If personal syllabus node, increment time_studied_seconds
      if (nodeSource === 'personal' && nodeId) {
        const existingNode = personalSyllabusNodesStore.get(nodeId);
        if (existingNode) {
          existingNode.time_studied_seconds = (Number(existingNode.time_studied_seconds) || 0) + secondsLogged;
          existingNode.updated_at = new Date().toISOString();
          totalTimeForNode = Math.max(totalTimeForNode, existingNode.time_studied_seconds);
        }
        if (supabaseServer) {
          const { data: currentData } = await supabaseServer
            .from('personal_syllabus_nodes')
            .select('time_studied_seconds')
            .eq('id', nodeId)
            .maybeSingle();
          const newTime = ((Number(currentData?.time_studied_seconds)) || 0) + secondsLogged;
          totalTimeForNode = Math.max(totalTimeForNode, newTime);
          await supabaseServer
            .from('personal_syllabus_nodes')
            .update({ time_studied_seconds: newTime, updated_at: new Date().toISOString() })
            .eq('id', nodeId);
        }
      }

      syllabusTimeLogged = {
        logged: true,
        nodeId: nodeId || null,
        nodeSource,
        secondsLogged,
        totalTimeForNode
      };
    } catch (stlErr) {
      console.warn('Syllabus time logging on session complete error:', stlErr);
    }
  }

  return res.json({
    success: true,
    session,
    xpAwarded,
    alreadyAwarded: false,
    streak: streakResult,
    syllabusTimeLogged,
    totalTimeForNode,
    message: 'Session completed successfully and XP awarded.'
  });
});

router.patch('/api/user/study-sessions/:id', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Authentication Required' });
  }
  const userId = verifiedUser.sub || 'user_dev';
  const { id } = req.params;

  const session = userPomodoroSessionsDb.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  if (session.userId !== userId) {
    return res.status(403).json({ error: 'Forbidden: Cannot edit session owned by another user' });
  }

  if (req.body.status) session.status = req.body.status;
  if (req.body.completedDuration !== undefined) session.completedDuration = req.body.completedDuration;
  if (req.body.accuracy !== undefined) session.accuracy = req.body.accuracy;

  if (supabaseServer) {
    try {
      await supabaseServer.from('user_pomodoro_sessions').upsert([{
        id: session.id,
        user_id: session.userId,
        subject: session.subject,
        topic: session.topic,
        duration: session.duration,
        start_time: session.startTime,
        end_time: session.endTime,
        completed_duration: session.completedDuration,
        status: session.status,
        questions_attempted: session.questionsAttempted,
        correct_answers: session.correctAnswers,
        question_ids: session.questionIds,
        question_sources: session.questionSources,
        manual_questions: session.manualQuestions,
        selected_questions: session.selectedQuestions,
        accuracy: session.accuracy,
        xp_earned: session.xpEarned,
        created_at: session.createdAt
      }], { onConflict: 'id' });
    } catch (e) {
      console.warn('Supabase pomodoro patch error:', e);
    }
  }

  return res.json({ success: true, session });
});

router.delete('/api/user/study-sessions/:id', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Authentication Required' });
  }
  const userId = verifiedUser.sub || 'user_dev';
  const { id } = req.params;

  const index = userPomodoroSessionsDb.findIndex(s => s.id === id);
  if (index >= 0) {
    if (userPomodoroSessionsDb[index].userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: Cannot delete session owned by another user' });
    }
    const removed = userPomodoroSessionsDb.splice(index, 1)[0];

    if (supabaseServer) {
      try {
        await supabaseServer.from('user_pomodoro_sessions').delete().eq('id', id).eq('user_id', userId);
      } catch (e) {
        console.warn('Supabase pomodoro delete error:', e);
      }
    }

    return res.json({ success: true, session: removed });
  }

  return res.status(404).json({ error: 'Session not found' });
});

router.post('/api/user/streak/trigger', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  const userId = verifiedUser?.sub || req.body.userId || req.body.userEmail || 'guest';
  const { activityType = 'general' } = req.body;

  const result = await updateStreak(userId);
  return res.json({ success: true, activityType, ...result });
});

router.get('/api/user/profile', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Authentication Required' });
  }
  const userId = verifiedUser.sub || 'user_dev';

  if (supabaseServer && userId) {
    try {
      const { data, error } = await supabaseServer
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        const isComplete = data.is_profile_complete === true || Boolean(data.exam && data.exam.trim() !== '');
        return res.json({
          success: true,
          profile: {
            id: data.id,
            name: data.name || verifiedUser.email.split('@')[0],
            email: verifiedUser.email,
            exam: data.exam || 'NEET_UG',
            targetExam: data.exam || 'NEET_UG',
            profileComplete: isComplete,
            isProfileComplete: isComplete,
            educationCategory: data.education_category || 'UPSC_CIVILS',
            stateName: data.state_name || 'All India',
            targetYear: data.target_year || 2026,
            streakDays: data.streak_days || 1,
            lastActiveDate: data.last_active_date || getISTDateString(),
            xp: data.xp || 0,
            coins: data.coins || 0,
            level: data.level || 1,
          }
        });
      }
    } catch (e) {}
  }

  return res.json({
    success: true,
    profile: {
      id: userId,
      name: verifiedUser.email.split('@')[0],
      email: verifiedUser.email,
      exam: 'NEET_UG',
      targetExam: 'NEET_UG',
      profileComplete: true,
      isProfileComplete: true,
      targetYear: 2026,
      streakDays: 1,
      lastActiveDate: getISTDateString(),
      xp: 0,
      coins: 0,
      level: 1
    }
  });
});

router.post('/api/user/profile', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Authentication Required' });
  }
  const userId = verifiedUser.sub || 'user_dev';
  const { name, exam, targetExam, educationCategory, stateName, targetYear, isProfileComplete } = req.body;

  const chosenExam = targetExam || exam || 'NEET_UG';
  const complete = isProfileComplete !== undefined ? isProfileComplete : Boolean(chosenExam && chosenExam.trim());

  if (supabaseServer && userId) {
    try {
      await supabaseServer.from('user_profiles').upsert({
        id: userId,
        name: name || verifiedUser.email.split('@')[0],
        exam: chosenExam,
        education_category: educationCategory || 'UPSC_CIVILS',
        state_name: stateName || 'All India',
        target_year: targetYear || 2026,
        is_profile_complete: complete,
        updated_at: new Date().toISOString()
      });
    } catch (e) {}
  }

  return res.json({
    success: true,
    profile: {
      id: userId,
      name: name || verifiedUser.email.split('@')[0],
      email: verifiedUser.email,
      exam: chosenExam,
      targetExam: chosenExam,
      profileComplete: complete,
      isProfileComplete: complete,
      educationCategory,
      stateName,
      targetYear: targetYear || 2026
    }
  });
});

router.post('/api/error-log', errorLogRateLimiter, async (req, res) => {
  try {
    const { userId, userEmail, source, endpoint, severity, message, stack, context } = req.body || {};

    const plainPayload = {
      message: message || 'Unknown Error',
      stack: stack || null,
      context: context || null
    };

    const encryptedPayload = encryptErrorPayload(plainPayload);

    const logRecord: UserErrorLogRecord = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: userId ? String(userId) : null,
      userEmail: userEmail ? String(userEmail).trim().toLowerCase() : null,
      source: source === 'backend' ? 'backend' : 'frontend',
      endpoint: endpoint ? String(endpoint) : null,
      severity: severity === 'warning' ? 'warning' : 'error',
      encryptedPayload,
      createdAt: new Date().toISOString(),
      resolved: false
    };

    userErrorLogsStore.set(logRecord.id, logRecord);

    if (supabaseServer) {
      try {
        await supabaseServer.from('user_error_logs').upsert([
          { id: logRecord.id, data: logRecord, updated_at: logRecord.createdAt }
        ], { onConflict: 'id' });
      } catch (_dbErr) {}
    }

    res.json({ success: true, id: logRecord.id });
  } catch (err: any) {
    console.warn('[ERROR LOGGING API FAILED]', err);
    res.status(500).json({ error: 'Failed to record error log' });
  }
});

router.post('/api/payments/razorpay-order', paymentRateLimiter, async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  const { planId = 'monthly', amount, currency = 'INR', userEmail: bodyEmail = '', userName = '' } = req.body;
  const userEmail = verifiedUser?.email || bodyEmail;

  const razorpayConfig = globalAdminSettings.razorpay;
  const keyId = razorpayConfig.keyId || process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
  const keySecret = razorpayConfig.keySecret || process.env.RAZORPAY_KEY_SECRET || '';

  const orderAmount = amount || (planId === 'monthly' ? globalAdminSettings.planPricing.monthlyPrice : globalAdminSettings.planPricing.annualPrice);
  const amountInPaise = Math.round(orderAmount * 100);

  const validKey = Boolean(keyId) && !keyId.includes('demo') && keyId.length > 5;
  const validSecret = Boolean(keySecret) && !keySecret.includes('demo') && keySecret.length > 5;

  let orderId = '';
  let realOrderCreated = false;

  if (validKey && validSecret) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: currency || razorpayConfig.currency || 'INR',
          receipt: `receipt_${Date.now()}`,
          notes: {
            userEmail: userEmail ? String(userEmail).trim().toLowerCase() : '',
            userName: userName || '',
            planId,
          },
        }),
      });

      if (rzpRes.ok) {
        const rzpData = await rzpRes.json();
        if (rzpData && rzpData.id) {
          orderId = rzpData.id;
          realOrderCreated = true;
        } else {
          return res.status(500).json({
            success: false,
            error: 'Razorpay API returned invalid order response structure.',
          });
        }
      } else {
        const errText = await rzpRes.text();
        console.error('Razorpay Orders API failed:', errText);
        return res.status(500).json({
          success: false,
          error: `Razorpay Gateway Error: ${errText || 'Failed to create Razorpay order. Please check Key ID & Key Secret.'}`,
        });
      }
    } catch (err: any) {
      console.error('Failed to connect to Razorpay API:', err?.message || err);
      return res.status(500).json({
        success: false,
        error: `Network error connecting to Razorpay: ${err?.message || 'Unknown error'}`,
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      error: 'Razorpay Key ID and Key Secret are not configured or invalid in Admin Settings.',
    });
  }

  // Record order in server DB
  const newOrderRecord: OrderRecord = {
    orderId,
    amount: orderAmount,
    currency: currency || razorpayConfig.currency || 'INR',
    userEmail: userEmail ? String(userEmail).trim().toLowerCase() : '',
    planId,
    status: 'CREATED',
    createdAt: new Date().toISOString(),
  };
  serverOrdersDb.set(orderId, newOrderRecord);
  saveAdminStoreToDisk();
  if (supabaseServer) {
    try {
      await supabaseServer.from('orders').upsert([{ id: orderId, data: newOrderRecord, updated_at: new Date().toISOString() }], { onConflict: 'id' });
    } catch (e) {}
  }

  res.json({
    success: true,
    orderId,
    amount: orderAmount,
    currency: currency || razorpayConfig.currency || 'INR',
    keyId: validKey ? keyId : '',
    hasKey: validKey,
    enabled: validKey,
    realOrderCreated,
    environment: razorpayConfig.environment || 'test',
    name: 'ProTrack Pro Membership',
    description: `Upgrade for ${userEmail || userName || 'Aspirant'}`,
    message: validKey
      ? 'Razorpay active'
      : 'Razorpay API Key ID is missing. Configure Razorpay Key in Admin Settings or .env',
  });
});

router.post('/api/payments/verify-payment', paymentRateLimiter, async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    userEmail: bodyEmail,
    planId = 'monthly',
  } = req.body;

  const targetEmail = verifiedUser?.email || bodyEmail;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !targetEmail) {
    return res.status(400).json({
      verified: false,
      isPremium: false,
      error: 'Missing required payment verification parameters (order_id, payment_id, signature, userEmail)',
    });
  }

  const cleanEmail = String(targetEmail).trim().toLowerCase();
  const razorpayConfig = globalAdminSettings.razorpay;
  const keySecret = razorpayConfig.keySecret || process.env.RAZORPAY_KEY_SECRET || '';

  if (!keySecret || keySecret.includes('demo')) {
    return res.status(400).json({
      verified: false,
      isPremium: false,
      error: 'Razorpay Key Secret is not configured on server. Cannot verify cryptographic payment signature.',
    });
  }

  // 1. Verify Cryptographic Signature using HMAC SHA256
  const isSignatureValid = verifyRazorpayPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    keySecret
  );

  if (!isSignatureValid) {
    console.error(`SECURITY ALERT: Invalid payment signature received for order ${razorpay_order_id} from ${cleanEmail}`);
    return res.status(400).json({
      verified: false,
      isPremium: false,
      error: 'SECURITY VIOLATION: Cryptographic payment signature verification failed. Premium access DENIED.',
    });
  }

  // 2. Prevent Replay Attack & Check Idempotency in Server DB
  const existingOrder = serverOrdersDb.get(razorpay_order_id);
  if (existingOrder && existingOrder.status === 'PAID') {
    if (existingOrder.paymentId === razorpay_payment_id) {
      // Idempotent retry: Return verified status without duplicating entitlement logic
      const sub = serverSubscriptionsDb.get(cleanEmail);
      return res.json({
        success: true,
        verified: true,
        isPremium: true,
        idempotent: true,
        message: 'Payment already verified (idempotent request). Premium active.',
        subscription: sub,
      });
    } else {
      return res.status(400).json({
        verified: false,
        isPremium: false,
        error: 'SECURITY REPLAY ALERT: Order ID has already been processed with a different payment ID.',
      });
    }
  }

  // Ensure payment ID has not been used across another processed order
  for (const [_, ord] of serverOrdersDb.entries()) {
    if (ord.paymentId === razorpay_payment_id && ord.orderId !== razorpay_order_id) {
      return res.status(400).json({
        verified: false,
        isPremium: false,
        error: 'SECURITY REPLAY ALERT: Payment ID has already been processed for another order.',
      });
    }
  }

  const now = new Date();
  const orderAmount = existingOrder?.amount || (planId === 'monthly' ? globalAdminSettings.planPricing.monthlyPrice : globalAdminSettings.planPricing.annualPrice);

  // Update order in Server DB
  const verifiedOrderRecord: OrderRecord = {
    orderId: razorpay_order_id,
    amount: orderAmount,
    currency: existingOrder?.currency || 'INR',
    userEmail: cleanEmail,
    planId,
    status: 'PAID',
    createdAt: existingOrder?.createdAt || now.toISOString(),
    paidAt: now.toISOString(),
    paymentId: razorpay_payment_id,
    signatureVerified: true,
  };
  serverOrdersDb.set(razorpay_order_id, verifiedOrderRecord);
  if (supabaseServer) {
    try {
      await supabaseServer.from('orders').upsert([{ id: razorpay_order_id, data: verifiedOrderRecord, updated_at: new Date().toISOString() }], { onConflict: 'id' });
    } catch (e) {}
  }

  // Calculate Expiration Date
  let expiresAt: string | null = null;
  if (planId === 'monthly') {
    expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  } else if (planId === 'annual') {
    expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
  } else if (planId === 'lifetime') {
    expiresAt = null;
  }

  // 3. Grant Subscription Record strictly in Server Database
  const newSubRecord: SubscriptionRecord = {
    userEmail: cleanEmail,
    planId,
    isPremium: true,
    activatedAt: now.toISOString(),
    expiresAt,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    verificationMethod: 'RAZORPAY_SIGNATURE',
    amountPaid: orderAmount,
    currency: 'INR',
  };

  await persistSubscriptionAtomic(newSubRecord);
  if (supabaseServer) {
    try {
      const adminUser = adminUsersDb.find(u => u.email?.trim().toLowerCase() === cleanEmail);
      if (adminUser?.id && isValidUUID(adminUser.id)) {
        await supabaseServer.from('user_profiles').upsert({
          id: adminUser.id,
          is_premium: true,
          premium_until: newSubRecord.expiresAt,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      }
    } catch (supaErr: any) {
      console.error('Supabase subscription upsert exception:', supaErr?.message || supaErr);
    }
  }
  saveAdminStoreToDisk();

  console.log(`[SUCCESS] Verified payment ${razorpay_payment_id} for user ${cleanEmail}. Activated plan: ${planId}`);

  return res.json({
    success: true,
    verified: true,
    isPremium: true,
    message: 'Payment cryptographically verified by server. Premium membership activated.',
    subscription: newSubRecord,
  });
});

router.post('/api/payments/razorpay-webhook', async (req, res) => {
  const webhookSignature = req.headers['x-razorpay-signature'] as string;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || globalAdminSettings.razorpay.keySecret || '';

  if (!webhookSignature || !webhookSecret) {
    return res.status(400).json({ error: 'Missing webhook signature or secret' });
  }

  try {
    const rawPayload = (req as any).rawBody || JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawPayload)
      .digest('hex');

    const bufExpected = Buffer.from(expectedSignature, 'utf-8');
    const bufReceived = Buffer.from(webhookSignature, 'utf-8');

    if (bufExpected.length !== bufReceived.length || !crypto.timingSafeEqual(bufExpected, bufReceived)) {
      console.error('SECURITY ALERT: Invalid Razorpay webhook signature');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body;
    const eventId = event?.id || event?.payload?.payment?.entity?.id || `event_${Date.now()}`;

    // Idempotency check: Ignore duplicate webhook events
    if (processedWebhookEvents.has(eventId)) {
      return res.json({ status: 'ok', idempotency: 'already_processed' });
    }

    if (event && (event.event === 'payment.captured' || event.event === 'order.paid')) {
      const paymentEntity = event.payload?.payment?.entity;
      const notes = paymentEntity?.notes || {};
      const userEmail = notes.userEmail;
      const planId = notes.planId || 'monthly';
      const orderId = paymentEntity?.order_id || `wh_${Date.now()}`;
      const paymentId = paymentEntity?.id || `pay_${Date.now()}`;

      if (userEmail) {
        const cleanEmail = String(userEmail).trim().toLowerCase();
        const now = new Date();
        let expiresAt: string | null = null;
        if (planId === 'monthly') {
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        } else if (planId === 'annual') {
          expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
        }

        const subRec: SubscriptionRecord & { updated_at?: string } = {
          userEmail: cleanEmail,
          planId,
          isPremium: true,
          activatedAt: now.toISOString(),
          expiresAt,
          paymentId,
          orderId,
          verificationMethod: 'RAZORPAY_WEBHOOK',
          amountPaid: (paymentEntity?.amount || 0) / 100,
          currency: paymentEntity?.currency || 'INR',
          updated_at: new Date().toISOString(),
        };
        await persistSubscriptionAtomic(subRec);
        processedWebhookEvents.add(eventId);
        saveAdminStoreToDisk();

        console.log(`[WEBHOOK SUCCESS] Activated subscription via webhook for ${cleanEmail}`);
      }
    } else {
      processedWebhookEvents.add(eventId);
    }

    return res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

router.post('/api/payments/utr-submit', paymentRateLimiter, async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const { utr, plan = 'monthly', amount = 499, userEmail: bodyEmail, userName = '' } = req.body;
    const userEmail = verifiedUser?.email || bodyEmail;

    if (!utr || typeof utr !== 'string' || utr.trim().length < 6) {
      return res.status(400).json({ success: false, error: 'Valid UTR / Transaction reference (minimum 6 characters) is required.' });
    }
    if (!userEmail || typeof userEmail !== 'string' || !userEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid user email is required for UTR verification submission.' });
    }

    const allowedPlans = ['monthly', 'quarterly', 'yearly', 'annual', 'pro', 'lifetime'];
    if (plan && !allowedPlans.includes(plan.toString().toLowerCase())) {
      return res.status(400).json({ success: false, error: 'Invalid subscription plan specified.' });
    }

    const parsedAmount = Number(amount);
    if (amount !== undefined && (isNaN(parsedAmount) || parsedAmount <= 0)) {
      return res.status(400).json({ success: false, error: 'Invalid payment amount specified.' });
    }

    const cleanUtr = utr.trim().toUpperCase();
    const cleanEmail = userEmail.trim().toLowerCase();

    if (!pgPool) {
      return res.status(500).json({ success: false, error: 'Authoritative database pool unavailable' });
    }

    // 1. Authoritative Neon PostgreSQL duplicate check
    const existingRes = await queryPostgres(
      'SELECT id, utr, plan, amount, user_email, user_name, status, created_at, updated_at, data FROM public.utr_requests WHERE utr = $1 LIMIT 1',
      [cleanUtr]
    );

    if (existingRes.rows.length > 0) {
      const existing = existingRes.rows[0];
      const existingRecord: UtrRequestRecord = {
        id: existing.id,
        userEmail: existing.user_email || cleanEmail,
        userName: existing.user_name || 'Aspirant Student',
        utr: existing.utr || cleanUtr,
        plan: existing.plan || plan,
        amount: Number(existing.amount) || parsedAmount,
        submittedAt: existing.created_at || new Date().toISOString(),
        status: existing.status || 'PENDING'
      };
      pendingUtrRequestsDb.set(existing.id, existingRecord);
      return res.status(200).json({
        success: true,
        idempotent: true,
        message: `UTR '${cleanUtr}' has already been submitted for verification. Current status: ${existingRecord.status}`,
        record: existingRecord
      });
    }

    // 2. Authoritative Neon PostgreSQL Insert
    const recordId = `utr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date();
    const utrRecord: UtrRequestRecord = {
      id: recordId,
      userEmail: cleanEmail,
      userName: userName || (verifiedUser ? verifiedUser.email : 'Aspirant Student'),
      utr: cleanUtr,
      plan: plan.toString().toLowerCase(),
      amount: parsedAmount || 499,
      submittedAt: now.toISOString(),
      status: 'PENDING'
    };

    try {
      const insertRes = await queryPostgres(
        `INSERT INTO public.utr_requests 
         (id, user_id, email, user_email, user_name, utr, plan, amount, status, data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', $9, $10, $10)
         RETURNING id, utr, plan, amount, user_email, user_name, status, created_at, updated_at`,
        [
          recordId,
          verifiedUser?.sub || null,
          cleanEmail,
          cleanEmail,
          utrRecord.userName,
          cleanUtr,
          utrRecord.plan,
          utrRecord.amount,
          JSON.stringify(utrRecord),
          now
        ]
      );

      const inserted = insertRes.rows[0];
      pendingUtrRequestsDb.set(recordId, utrRecord);
      saveAdminStoreToDisk();

      return res.status(200).json({
        success: true,
        message: `UTR reference '${cleanUtr}' received and queued for Admin verification.`,
        record: {
          ...utrRecord,
          id: inserted.id,
          status: inserted.status
        }
      });
    } catch (dbErr: any) {
      if (dbErr.code === '23505') { // Postgres Unique Constraint on utr
        const dupRes = await queryPostgres(
          'SELECT id, utr, plan, amount, user_email, user_name, status, created_at FROM public.utr_requests WHERE utr = $1 LIMIT 1',
          [cleanUtr]
        );
        const dup = dupRes.rows[0] || utrRecord;
        return res.status(200).json({
          success: true,
          idempotent: true,
          message: `UTR '${cleanUtr}' has already been submitted for verification. Current status: ${dup.status || 'PENDING'}`,
          record: dup
        });
      }
      console.error('[POST /api/payments/utr-submit] Database error:', dbErr.message);
      return res.status(500).json({ success: false, error: 'Database persistence error: ' + dbErr.message });
    }
  } catch (err: any) {
    console.error('[POST /api/payments/utr-submit] unexpected error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

router.get('/api/user/subscription', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  const emailQuery = (req.query.email as string) || '';
  const cleanEmail = verifiedUser?.email || emailQuery.trim().toLowerCase();

  if (!cleanEmail) {
    return res.json({ isPremium: false, planId: 'FREE', expiresAt: null, premiumSource: null });
  }

  const sub = await getSubscriptionForEmail(cleanEmail);
  const isPaidPremium = sub ? (Boolean(sub.isPremium) && (!sub.expiresAt || new Date(sub.expiresAt).getTime() > Date.now())) : checkUserServerPremiumStatus(cleanEmail);

  if (isPaidPremium && sub) {
    return res.json({
      isPremium: true,
      planId: sub.planId,
      expiresAt: sub.expiresAt,
      activatedAt: sub.activatedAt,
      verificationMethod: sub.verificationMethod,
      paymentId: sub.paymentId,
      premiumSource: 'paid',
    });
  }

  // Check Ad Reward Premium
  const adRecord = adRewardsDb.get(cleanEmail);
  const now = Date.now();
  const rewardActive = Boolean(adRecord?.reward_premium_until && new Date(adRecord.reward_premium_until).getTime() > now);

  if (rewardActive) {
    return res.json({
      isPremium: true,
      planId: 'REWARD_PREMIUM',
      expiresAt: adRecord?.reward_premium_until,
      activatedAt: adRecord?.updated_at,
      verificationMethod: 'AD_REWARD',
      paymentId: null,
      premiumSource: 'reward',
    });
  }

  return res.json({
    isPremium: false,
    planId: 'FREE',
    expiresAt: null,
    premiumSource: null,
  });
});

// ============================================================================
// SERVER-AUTHORITATIVE REWARD LEDGER & CRYPTOGRAPHIC AD VERIFICATION
// ============================================================================

export interface RewardTransactionRecord {
  id: string;
  user_id: string;
  user_email: string;
  type: string;
  source: string;
  amount: number;
  reference_id: string;
  status: 'completed' | 'rejected' | 'pending';
  date: string;
  metadata?: any;
  created_at: string;
}

export interface AdSessionRecord {
  sessionId: string;
  userId: string;
  userEmail: string;
  startTime: number;
  minDurationMs: number;
  expiresAt: number;
  redeemed: boolean;
}

const rewardLedgerStore = new Map<string, RewardTransactionRecord>();
const activeAdSessionsStore = new Map<string, AdSessionRecord>();
const userProfilesMap = new Map<string, any>();

// Persistent file path for rewards
function getRewardsStoreFilePath(): string {
  const candidateDirs = [
    path.join(process.cwd(), '.data'),
    path.join(os.tmpdir(), 'aspirantx_data'),
    os.tmpdir(),
  ];
  for (const dir of candidateDirs) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      return path.join(dir, 'rewards_store.json');
    } catch (_e) {}
  }
  return path.join(os.tmpdir(), 'rewards_store.json');
}

function persistRewardsToDisk() {
  try {
    const filePath = getRewardsStoreFilePath();
    const data = {
      transactions: Array.from(rewardLedgerStore.values()),
      savedAt: new Date().toISOString()
    };
    const tmp = `${filePath}.tmp_${Date.now()}`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmp, filePath);
  } catch (err: any) {
    console.warn('[Rewards] Persistence warning:', err?.message || err);
  }
}

function hydrateRewardsFromDisk() {
  try {
    const filePath = getRewardsStoreFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.transactions)) {
        for (const tx of data.transactions) {
          if (tx.id) rewardLedgerStore.set(tx.id, tx);
        }
      }
    }
  } catch (_err) {}
}

hydrateRewardsFromDisk();

// 1. GET REWARD STATUS
router.get('/api/rewards/status', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const queryUserId = (req.query.userId as string) || '';
    const userId = verifiedUser?.sub || (queryUserId && queryUserId !== 'guest' ? queryUserId : null);
    const email = verifiedUser?.email || (req.query.email as string)?.trim()?.toLowerCase() || '';

    if (!userId && !email) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' });
    }

    const todayDate = new Date().toISOString().slice(0, 10);
    const userTxs = Array.from(rewardLedgerStore.values()).filter(t => 
      ((userId && t.user_id === userId) || (email && t.user_email === email)) && t.status === 'completed'
    );

    const todayViews = userTxs.filter(t => t.type === 'ad_watch' && t.date === todayDate).length;
    const totalViews = userTxs.filter(t => t.type === 'ad_watch').length;

    // Check premium status
    const adRecord = email ? adRewardsDb.get(email) : null;
    const now = Date.now();
    let rewardPremiumUntil = adRecord?.reward_premium_until || null;

    // Check user_profiles in DB/memory
    if (userId) {
      const profile = userProfilesMap.get(userId);
      if (profile?.premium_until && new Date(profile.premium_until).getTime() > now) {
        rewardPremiumUntil = profile.premium_until;
      }
    }

    const rewardActive = Boolean(rewardPremiumUntil && new Date(rewardPremiumUntil).getTime() > now);

    res.json({
      success: true,
      viewsToday: todayViews,
      viewsNeeded: 5,
      rewardActive,
      rewardPremiumUntil,
      totalVideosWatched: totalViews,
      justUnlocked: false,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. START CRYPTOGRAPHICALLY VERIFIABLE AD SESSION
router.post('/api/rewards/ad-session/start', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    if (!verifiedUser?.sub) {
      return res.status(401).json({ success: false, error: 'Authentication required to start rewardable ad session' });
    }

    const userId = verifiedUser.sub;
    const todayDate = new Date().toISOString().slice(0, 10);

    // Verify daily quota from authoritative ledger
    const userTodayViews = Array.from(rewardLedgerStore.values()).filter(t => 
      t.user_id === userId && t.type === 'ad_watch' && t.date === todayDate && t.status === 'completed'
    ).length;

    if (userTodayViews >= 5) {
      return res.status(429).json({
        success: false,
        error: 'Daily rewarded study ad limit of 5 has already been completed today. Enjoy your PRO Pass!'
      });
    }

    const sessionId = `adsess_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    const startTime = Date.now();

    // Cryptographic HMAC token bound to session, user, and timestamp
    const sessionToken = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${sessionId}:${userId}:${startTime}`)
      .digest('hex');

    const sessionRecord: AdSessionRecord = {
      sessionId,
      userId,
      userEmail: verifiedUser.email,
      startTime,
      minDurationMs: 15000, // Strictly 15 seconds minimum watch time (enforced server-side)
      expiresAt: startTime + 300000, // 5 minutes validity
      redeemed: false
    };

    activeAdSessionsStore.set(sessionId, sessionRecord);

    res.json({
      success: true,
      sessionId,
      sessionToken,
      minDurationSeconds: 15
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to start ad session: ' + err.message });
  }
});

// 3. VERIFY AD COMPLETION & RECORD REWARD IN LEDGER
router.post('/api/rewards/watch-ad', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    if (!verifiedUser?.sub) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required' });
    }

    const userId = verifiedUser.sub;
    const { sessionId, sessionToken } = req.body;

    // Handle legacy calls with informative error
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Verification failed: sessionId is required. Client must initiate a reward session via /api/rewards/ad-session/start.'
      });
    }

    const session = activeAdSessionsStore.get(sessionId);
    if (!session) {
      return res.status(400).json({ success: false, error: 'Invalid or expired ad session' });
    }

    // 1. User Association Check
    if (session.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden: Ad session user mismatch' });
    }

    // 2. Cryptographic HMAC Signature Verification
    const expectedToken = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${sessionId}:${session.userId}:${session.startTime}`)
      .digest('hex');

    if (sessionToken !== expectedToken) {
      return res.status(403).json({ success: false, error: 'Forbidden: Ad session cryptographic signature is invalid or tampered' });
    }

    // 3. Anti-Replay Protection
    if (session.redeemed) {
      return res.status(409).json({ success: false, error: 'Conflict: Ad session has already been redeemed. Replay rejected.' });
    }

    // 4. Minimum Watch Duration Verification
    const now = Date.now();
    const elapsed = now - session.startTime;
    if (elapsed < session.minDurationMs) {
      return res.status(400).json({
        success: false,
        error: `Ad verification failed: minimum watch duration of 15 seconds not completed (elapsed: ${Math.round(elapsed / 1000)}s).`
      });
    }

    // 5. Expiration Verification
    if (now > session.expiresAt) {
      return res.status(400).json({ success: false, error: 'Ad session has expired. Please start a new session.' });
    }

    // Atomically mark session as redeemed
    session.redeemed = true;
    activeAdSessionsStore.set(sessionId, session);

    // Record immutable transaction in ledger
    const txId = `rtx_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    const todayDate = new Date().toISOString().slice(0, 10);

    const tx: RewardTransactionRecord = {
      id: txId,
      user_id: userId,
      user_email: verifiedUser.email,
      type: 'ad_watch',
      source: 'rewarded_study_ad',
      amount: 1,
      reference_id: sessionId,
      status: 'completed',
      date: todayDate,
      metadata: {
        elapsedSeconds: Math.round(elapsed / 1000),
        sessionId
      },
      created_at: new Date().toISOString()
    };

    if (pgPool) {
      try {
        await queryPostgres(
          'INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
          [userId, verifiedUser.email || 'user@example.com']
        );
        await queryPostgres(
          `INSERT INTO public.reward_transactions (id, user_id, user_email, type, source, amount, reference_id, status, metadata, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (reference_id) DO NOTHING`,
          [txId, userId, verifiedUser.email, 'ad_watch', 'rewarded_study_ad', 1, sessionId, 'completed', JSON.stringify(tx.metadata), tx.created_at]
        );
      } catch (txErr: any) {
        console.error('[Rewards] Failed to write reward transaction to PostgreSQL:', txErr.message);
        return res.status(500).json({ success: false, error: 'Database persistence error: ' + txErr.message });
      }
    } else if (supabaseServer) {
      const { error: txErr } = await supabaseServer.from('reward_transactions').insert([{
        id: txId,
        user_id: userId,
        user_email: verifiedUser.email,
        type: 'ad_watch',
        source: 'rewarded_study_ad',
        amount: 1,
        reference_id: sessionId,
        status: 'completed',
        metadata: tx.metadata,
        created_at: tx.created_at
      }]);
      if (txErr) {
        console.error('[Rewards] Failed to write reward transaction to Supabase:', txErr.message);
        return res.status(500).json({ success: false, error: 'Database persistence error: ' + txErr.message });
      }
    }

    rewardLedgerStore.set(txId, tx);
    persistRewardsToDisk();

    // Compute user's authoritative views from ledger
    const userTxs = Array.from(rewardLedgerStore.values()).filter(t => 
      t.user_id === userId && t.status === 'completed'
    );
    const todayViews = userTxs.filter(t => t.type === 'ad_watch' && t.date === todayDate).length;
    const totalViews = userTxs.filter(t => t.type === 'ad_watch').length;

    let justUnlocked = false;
    let rewardPremiumUntil: string | null = null;

    if (todayViews >= 5) {
      justUnlocked = true;
      const duration = 48 * 60 * 60 * 1000; // 48 hours (2 days)
      const existingProfile = userProfilesMap.get(userId);
      let baseTime = now;
      if (existingProfile?.premium_until) {
        const exp = new Date(existingProfile.premium_until).getTime();
        if (!isNaN(exp) && exp > now) baseTime = exp;
      }

      rewardPremiumUntil = new Date(baseTime + duration).toISOString();

      // Update user profile in DB and memory
      if (existingProfile) {
        existingProfile.is_premium = true;
        existingProfile.premium_until = rewardPremiumUntil;
        existingProfile.updated_at = new Date().toISOString();
        userProfilesMap.set(userId, existingProfile);
      }

      if (supabaseServer) {
        try {
          await supabaseServer.from('user_profiles').update({
            is_premium: true,
            premium_until: rewardPremiumUntil,
            updated_at: new Date().toISOString()
          }).eq('id', userId);
        } catch (_e) {}
      }

      // Record unlock in ledger
      const unlockTxId = `rtx_unlock_${Date.now()}_${crypto.randomUUID().substring(0, 6)}`;
      rewardLedgerStore.set(unlockTxId, {
        id: unlockTxId,
        user_id: userId,
        user_email: verifiedUser.email,
        type: 'pro_pass_unlocked',
        source: 'daily_ad_milestone',
        amount: 48,
        reference_id: `unlock_${userId}_${todayDate}`,
        status: 'completed',
        date: todayDate,
        created_at: new Date().toISOString()
      });
      persistRewardsToDisk();
    }

    // Sync to legacy adRewardsDb for backwards compatibility
    const legacyRecord = {
      email: verifiedUser.email,
      views_today: todayViews,
      last_view_date: todayDate,
      total_videos_watched: totalViews,
      reward_premium_until: rewardPremiumUntil,
      updated_at: new Date().toISOString()
    };
    adRewardsDb.set(verifiedUser.email, legacyRecord);

    if (supabaseServer) {
      try {
        await supabaseServer.from('ad_rewards').upsert([{
          id: verifiedUser.email,
          email: verifiedUser.email,
          data: legacyRecord,
          updated_at: legacyRecord.updated_at
        }], { onConflict: 'id' });
      } catch (_e) {}
    }

    const rewardActive = Boolean(rewardPremiumUntil && new Date(rewardPremiumUntil).getTime() > now);

    res.json({
      success: true,
      viewsToday: todayViews,
      viewsNeeded: 5,
      rewardActive,
      rewardPremiumUntil,
      totalVideosWatched: totalViews,
      justUnlocked
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to record ad view: ' + err.message });
  }
});

// 4. SERVER-AUTHORITATIVE STREAK ENGINE
router.get('/api/rewards/streak', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    if (!verifiedUser?.sub) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const userId = verifiedUser.sub;
    
    // Aggregate all unique active dates from Pomodoro and Study sessions
    const activeDates = new Set<string>();
    const pomodoroSessions = (userPomodoroSessionsDb || []).filter((s: any) => s.userId === userId || s.user_id === userId);
    for (const s of pomodoroSessions as any[]) {
      const d = s.completedAt || s.completed_at || s.createdAt || s.created_at || s.startTime;
      if (d) activeDates.add(String(d).slice(0, 10));
    }

    if (supabaseServer) {
      try {
        const { data: dbSessions } = await supabaseServer
          .from('user_pomodoro_sessions')
          .select('completed_at, created_at, start_time')
          .eq('user_id', userId);
        if (Array.isArray(dbSessions)) {
          for (const s of dbSessions) {
            const d = s.completed_at || s.created_at || s.start_time;
            if (d) activeDates.add(String(d).slice(0, 10));
          }
        }
      } catch (_e) {}
    }

    // Today and yesterday strings
    const today = new Date().toISOString().slice(0, 10);
    const yesterdayDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    // Calculate consecutive streak ending today or yesterday
    let streakDays = 0;
    let checkDate = new Date();
    // If no activity today, check if active yesterday
    if (!activeDates.has(today)) {
      if (activeDates.has(yesterdayDate)) {
        checkDate = new Date(Date.now() - 86400000);
      } else {
        // Streak broken
        streakDays = 0;
      }
    }

    if (activeDates.has(today) || activeDates.has(yesterdayDate)) {
      while (true) {
        const dateKey = checkDate.toISOString().slice(0, 10);
        if (activeDates.has(dateKey)) {
          streakDays++;
          checkDate = new Date(checkDate.getTime() - 86400000);
        } else {
          break;
        }
      }
    }

    // Minimum streak is 1 if user is active today
    if (activeDates.has(today) && streakDays === 0) streakDays = 1;

    // Check user_profiles record
    const profile = userProfilesMap.get(userId);
    if (profile) {
      profile.streak_days = Math.max(streakDays, profile.streak_days || 0);
      profile.last_active_date = today;
    }

    res.json({
      success: true,
      streakDays: Math.max(1, streakDays),
      lastActiveDate: today,
      totalActiveDays: activeDates.size
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to calculate streak: ' + err.message });
  }
});

// 5. CLAIM STREAK REWARD WITH IDEMPOTENCY & TAMPER-PROOFING
router.post('/api/rewards/claim-streak', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    if (!verifiedUser?.sub) {
      return res.status(401).json({ success: false, error: 'Authentication required to claim streak reward' });
    }

    const { milestoneDays } = req.body;
    const days = Number(milestoneDays);
    if (!days || isNaN(days) || days <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid milestoneDays' });
    }

    const userId = verifiedUser.sub;
    const claimKey = `streak_claim_${userId}_${days}`;

    // Anti-replay check: prevent duplicate milestone claims
    if (rewardClaimsStore.has(claimKey)) {
      return res.status(409).json({
        success: false,
        error: `Milestone of ${days} days has already been claimed.`
      });
    }

    // Verify streak on server
    const profile = userProfilesMap.get(userId);
    const currentStreak = profile?.streak_days || 1;
    if (currentStreak < days) {
      return res.status(400).json({
        success: false,
        error: `Streak milestone not reached. Server-verified streak is ${currentStreak} days, but ${days} days required.`
      });
    }

    // Reward amount in coins/XP
    const coinsReward = days * 50;
    const claimRecord = {
      id: claimKey,
      userId,
      userEmail: verifiedUser.email,
      milestoneId: `streak_${days}`,
      milestoneTitle: `${days}-Day Study Streak Champion`,
      rewardCoins: coinsReward,
      status: 'completed',
      claimedAt: new Date().toISOString()
    };

    rewardClaimsStore.set(claimKey, claimRecord);

    if (profile) {
      profile.coins = (profile.coins || 0) + coinsReward;
      profile.xp = (profile.xp || 0) + days * 100;
    }

    if (supabaseServer) {
      try {
        await supabaseServer.from('reward_claims').upsert([{
          id: claimKey,
          data: claimRecord,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });
      } catch (_e) {}
    }

    res.json({
      success: true,
      milestoneDays: days,
      rewardGranted: true,
      coinsAwarded: coinsReward
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to claim streak milestone: ' + err.message });
  }
});

router.post('/api/buddy/join', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const email = verifiedUser?.email || req.body?.email?.trim()?.toLowerCase();
    const userId = verifiedUser?.sub || req.body?.userId || 'guest';
    const { exam, targetYear } = req.body;

    if (!email || !exam) {
      return res.status(400).json({ error: 'Email and exam are required' });
    }

    // Remove existing queue entry first
    studyBuddyQueue.delete(email);
    if (supabaseServer) {
      await supabaseServer.from('study_buddy_queue').delete().eq('email', email);
    }

    // Check if user already has an active match
    for (const [roomId, match] of studyBuddyMatches.entries()) {
      if ((match.user1Email === email || match.user2Email === email) && match.active) {
        const buddyEmail = match.user1Email === email ? match.user2Email : match.user1Email;
        return res.json({ matched: true, roomId, buddyEmail });
      }
    }

    // Search queue for another waiting user with same exam
    let foundMatch: any = null;
    for (const [qEmail, qUser] of studyBuddyQueue.entries()) {
      if (qEmail !== email && qUser.exam.toLowerCase().trim() === exam.toLowerCase().trim()) {
        if (!targetYear || !qUser.targetYear || Number(qUser.targetYear) === Number(targetYear)) {
          foundMatch = qUser;
          break;
        }
      }
    }

    if (foundMatch) {
      const random = Math.floor(Math.random() * 900000 + 100000);
      const roomId = `buddy_${Date.now()}_${random}`;
      const matchObj = {
        roomId,
        user1Email: foundMatch.email,
        user2Email: email,
        exam,
        active: true,
        createdAt: new Date().toISOString(),
      };

      studyBuddyMatches.set(roomId, matchObj);
      studyBuddyQueue.delete(foundMatch.email);

      if (supabaseServer) {
        await Promise.all([
          supabaseServer.from('study_buddy_matches').upsert([{ room_id: roomId, data: matchObj, updated_at: new Date().toISOString() }], { onConflict: 'room_id' }),
          supabaseServer.from('study_buddy_queue').delete().eq('email', foundMatch.email),
        ]);
      }

      return res.json({ matched: true, roomId, buddyEmail: foundMatch.email });
    } else {
      const queueObj = {
        email,
        userId,
        exam,
        targetYear: targetYear ? Number(targetYear) : undefined,
        joinedAt: new Date().toISOString(),
      };
      studyBuddyQueue.set(email, queueObj);

      if (supabaseServer) {
        await supabaseServer.from('study_buddy_queue').upsert([{ email, data: queueObj, updated_at: new Date().toISOString() }], { onConflict: 'email' });
      }

      return res.json({ matched: false, waiting: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/buddy/status', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const emailQuery = (req.query.email as string) || '';
    const email = verifiedUser?.email || emailQuery.trim().toLowerCase();

    if (!email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    for (const [roomId, match] of studyBuddyMatches.entries()) {
      if ((match.user1Email === email || match.user2Email === email) && match.active) {
        const buddyEmail = match.user1Email === email ? match.user2Email : match.user1Email;
        return res.json({ status: 'matched', roomId, buddyEmail });
      }
    }

    if (studyBuddyQueue.has(email)) {
      return res.json({ status: 'waiting' });
    }

    return res.json({ status: 'unmatched' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/buddy/leave', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const email = verifiedUser?.email || req.body?.email?.trim()?.toLowerCase();

    if (!email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    studyBuddyQueue.delete(email);
    if (supabaseServer) {
      await supabaseServer.from('study_buddy_queue').delete().eq('email', email);
    }

    for (const [roomId, match] of studyBuddyMatches.entries()) {
      if ((match.user1Email === email || match.user2Email === email) && match.active) {
        match.active = false;
        studyBuddyMatches.set(roomId, match);
        if (supabaseServer) {
          await supabaseServer.from('study_buddy_matches').upsert([{ room_id: roomId, data: match, updated_at: new Date().toISOString() }], { onConflict: 'room_id' });
        }
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/user/set-exam', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const email = verifiedUser?.email || req.body?.email?.trim()?.toLowerCase();
    const { exam } = req.body;

    if (!email || !exam) {
      return res.status(400).json({ error: 'Email and exam are required' });
    }

    // Sync back to local admin database cache
    let updated = false;
    setAdminUsersDb(adminUsersDb.map((u) => {
      if (String(u.email).trim().toLowerCase() === String(email).trim().toLowerCase()) {
        updated = true;
        return { ...u, exam };
      }
      return u;
    }));

    if (updated) {
      saveAdminStoreToDisk();
    }

    if (supabaseServer && verifiedUser?.sub) {
      await supabaseServer.from('user_profiles').update({ exam, updated_at: new Date().toISOString() }).eq('id', verifiedUser.sub);
    }

    res.json({ success: true, exam });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/user/update-profile', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const email = verifiedUser?.email || req.body?.email?.trim()?.toLowerCase();
    const { 
      name, 
      exam, 
      educationCategory, 
      stateName, 
      boardOrUniversity, 
      streamOrSubject, 
      targetYear,
      isProfileComplete 
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'User email is required' });
    }

    let updated = false;
    setAdminUsersDb(adminUsersDb.map((u) => {
      if (String(u.email).trim().toLowerCase() === String(email).trim().toLowerCase()) {
        updated = true;
        return { 
          ...u, 
          name: name || u.name,
          exam: exam || u.exam,
          stateName: stateName || u.stateName,
          educationCategory: educationCategory || u.educationCategory,
          boardOrUniversity: boardOrUniversity || u.boardOrUniversity,
          streamOrSubject: streamOrSubject || u.streamOrSubject,
          targetYear: targetYear !== undefined ? Number(targetYear) : u.targetYear,
          isProfileComplete: isProfileComplete !== undefined ? Boolean(isProfileComplete) : u.isProfileComplete
        };
      }
      return u;
    }));

    if (updated) {
      saveAdminStoreToDisk();
    }

    if (supabaseServer && verifiedUser?.sub) {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (name) dbUpdates.name = name;
      if (exam) dbUpdates.exam = exam;
      if (stateName) dbUpdates.state_name = stateName;
      if (educationCategory) dbUpdates.education_category = educationCategory;
      if (boardOrUniversity) dbUpdates.board_or_university = boardOrUniversity;
      if (streamOrSubject) dbUpdates.stream_or_subject = streamOrSubject;
      if (targetYear !== undefined) dbUpdates.target_year = Number(targetYear);
      if (isProfileComplete !== undefined) dbUpdates.is_profile_complete = Boolean(isProfileComplete);

      await supabaseServer.from('user_profiles').update(dbUpdates).eq('id', verifiedUser.sub);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/study/heartbeat', async (req, res) => {
  try {
    const { userId, sessionId, subject, topicId } = req.body;
    if (!userId || !sessionId) {
      return res.status(400).json({ error: 'userId and sessionId are required' });
    }

    if (!studyHeartbeatsStore.has(sessionId)) {
      studyHeartbeatsStore.set(sessionId, []);
    }
    const sessionHbs = studyHeartbeatsStore.get(sessionId)!;
    const now = Date.now();

    // Rate-limit: reject (204, no-op) if same sessionId already has a heartbeat in the last 15 seconds
    if (sessionHbs.length > 0) {
      const lastHb = sessionHbs[sessionHbs.length - 1];
      const lastTime = new Date(lastHb.pingedAt || lastHb.pinged_at).getTime();
      if (now - lastTime < 15000) {
        return res.status(204).send();
      }
    }

    const hb = {
      id: `hb_${now}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      sessionId,
      subject: subject || 'General',
      topicId: topicId || null,
      pingedAt: new Date().toISOString()
    };

    sessionHbs.push(hb);

    if (supabaseServer) {
      try {
        await supabaseServer.from('study_heartbeats').upsert([{
          id: hb.id,
          user_id: hb.userId,
          session_id: hb.sessionId,
          subject: hb.subject,
          topic_id: hb.topicId,
          pinged_at: hb.pingedAt
        }], { onConflict: 'id' });
      } catch (e) {}
    }

    res.json({ success: true, heartbeatId: hb.id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record heartbeat', details: err.message });
  }
});

router.get('/api/study/verified-time', async (req, res) => {
  try {
    const userId = (req.query.userId || '').toString().trim();
    const topicId = (req.query.topicId || '').toString().trim();

    if (!userId) {
      return res.json({ verifiedSeconds: 0, verifiedMinutes: 0 });
    }

    let verifiedSeconds = 0;

    for (const [sessionId, hbs] of studyHeartbeatsStore.entries()) {
      const userHbs = hbs.filter(h => (h.userId || h.user_id) === userId);
      if (userHbs.length === 0) continue;

      if (topicId) {
        const matches = userHbs.some(h => (h.topicId || h.topic_id) === topicId);
        if (!matches) continue;
      }

      const sorted = [...userHbs].sort((a, b) => {
        const ta = new Date(a.pingedAt || a.pinged_at).getTime();
        const tb = new Date(b.pingedAt || b.pinged_at).getTime();
        return ta - tb;
      });

      for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i-1].pingedAt || sorted[i-1].pinged_at).getTime();
        const curr = new Date(sorted[i].pingedAt || sorted[i].pinged_at).getTime();
        const diffSec = (curr - prev) / 1000;
        if (diffSec > 0 && diffSec <= 35) {
          verifiedSeconds += Math.min(30, Math.round(diffSec));
        }
      }
    }

    res.json({
      verifiedSeconds,
      verifiedMinutes: Math.floor(verifiedSeconds / 60)
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to calculate verified time', details: err.message });
  }
});

router.get('/api/rewards/milestones', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = (req.query.userId || '').toString().trim();
    const emailQuery = (req.query.userEmail || '').toString().trim();
    const userEmail = verifiedUser?.email || emailQuery || userId;

    const isPremium = checkUserServerPremiumStatus(userEmail) || 
                      checkUserServerPremiumStatus(userId) ||
                      (() => {
                        const adRecord = adRewardsDb.get(userEmail.toLowerCase());
                        return Boolean(adRecord?.reward_premium_until && new Date(adRecord.reward_premium_until).getTime() > Date.now());
                      })() ||
                      (verifiedUser?.email ? checkUserServerPremiumStatus(verifiedUser.email) : false);

    if (!isPremium) {
      return res.json({ success: true, milestones: [], premiumRequired: true });
    }

    const allMilestones = Array.from(rewardMilestonesStore.values()).filter(m => m.isActive !== false);

    // Get user's approved/fulfilled claims
    const userClaimsList = Array.from(rewardClaimsStore.values()).filter(c => 
      (c.userId === userId || (userEmail && c.userEmail?.toLowerCase() === userEmail.toLowerCase())) &&
      (['approved', 'fulfilled'].includes((c.status || '').toLowerCase()))
    );

    const milMap = new Map();
    for (const m of allMilestones) {
      milMap.set(m.id, m);
    }

    const trackMaxCompletedTier = new Map<string, number>();
    for (const c of userClaimsList) {
      const mil = milMap.get(c.milestoneId);
      if (mil && mil.trackId) {
        const t = Number(mil.tier) || 1;
        const curMax = trackMaxCompletedTier.get(mil.trackId) || 0;
        if (t > curMax) {
          trackMaxCompletedTier.set(mil.trackId, t);
        }
      }
    }

    const tracksMap = new Map<string, any[]>();
    const untracked: any[] = [];

    for (const m of allMilestones) {
      const tid = (m.trackId || '').trim();
      if (!tid) {
        untracked.push({ ...m, locked: false, tier: m.tier || 1 });
      } else {
        if (!tracksMap.has(tid)) tracksMap.set(tid, []);
        tracksMap.get(tid)!.push(m);
      }
    }

    const filteredMilestones: any[] = [...untracked];

    for (const [tid, milList] of tracksMap.entries()) {
      milList.sort((a, b) => (Number(a.tier) || 1) - (Number(b.tier) || 1));
      const maxCompleted = trackMaxCompletedTier.get(tid) || 0;
      const maxUnlocked = maxCompleted + 1;

      for (const m of milList) {
        const t = Number(m.tier) || 1;
        if (t <= maxUnlocked) {
          filteredMilestones.push({ ...m, tier: t, locked: false });
        } else if (t === maxUnlocked + 1) {
          filteredMilestones.push({ ...m, tier: t, locked: true });
        }
      }
    }

    res.json({ success: true, milestones: filteredMilestones, premiumRequired: false });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch reward milestones', details: err.message });
  }
});

router.get('/api/rewards/progress', async (req, res) => {
  try {
    const userId = (req.query.userId || '').toString().trim();
    const milestoneId = (req.query.milestoneId || '').toString().trim();
    if (!userId || !milestoneId) {
      return res.status(400).json({ error: 'userId and milestoneId are required' });
    }

    const milestone = rewardMilestonesStore.get(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const { verifiedMinutes } = calculateVerifiedMinutesForUser(
      userId, 
      milestone.requiredSubject, 
      milestone.requiredTopicId
    );

    const requiredMinutes = Number(milestone.requiredVerifiedMinutes) || 600;
    const canClaim = verifiedMinutes >= requiredMinutes;

    res.json({
      success: true,
      verifiedMinutes,
      requiredMinutes,
      canClaim
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to calculate progress', details: err.message });
  }
});

router.post('/api/rewards/claim', async (req, res) => {
  try {
    const { userId, userEmail, milestoneId } = req.body;
    if (!userId || !milestoneId) {
      return res.status(400).json({ error: 'userId and milestoneId are required' });
    }

    const cleanEmail = (userEmail || '').trim().toLowerCase();
    const isPremium = checkUserServerPremiumStatus(cleanEmail) ||
                      checkUserServerPremiumStatus(userId) ||
                      (() => {
                        const adRecord = adRewardsDb.get(cleanEmail);
                        return Boolean(adRecord?.reward_premium_until && new Date(adRecord.reward_premium_until).getTime() > Date.now());
                      })();

    if (!isPremium) {
      return res.status(403).json({ error: 'Premium subscription required to claim reward milestones.' });
    }

    const milestone = rewardMilestonesStore.get(milestoneId);
    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    // Verify track & tier unlock status if trackId is present
    if (milestone.trackId) {
      const tid = milestone.trackId;
      const targetTier = Number(milestone.tier) || 1;

      const allMilestonesInTrack = Array.from(rewardMilestonesStore.values()).filter(m => m.trackId === tid);
      const milMapInTrack = new Map(allMilestonesInTrack.map(m => [m.id, m]));

      const userClaimsInTrack = Array.from(rewardClaimsStore.values()).filter(c =>
        (c.userId === userId || (cleanEmail && c.userEmail?.toLowerCase() === cleanEmail)) &&
        (['approved', 'fulfilled'].includes((c.status || '').toLowerCase())) &&
        milMapInTrack.has(c.milestoneId)
      );

      let maxCompleted = 0;
      for (const c of userClaimsInTrack) {
        const mil = milMapInTrack.get(c.milestoneId);
        if (mil) {
          const t = Number(mil.tier) || 1;
          if (t > maxCompleted) maxCompleted = t;
        }
      }

      const maxUnlocked = maxCompleted + 1;
      if (targetTier > maxUnlocked) {
        return res.status(403).json({ error: `Milestone tier ${targetTier} is locked. Complete tier ${maxUnlocked - 1} first.` });
      }
    }

    const { verifiedMinutes } = calculateVerifiedMinutesForUser(
      userId,
      milestone.requiredSubject,
      milestone.requiredTopicId
    );

    const requiredMinutes = Number(milestone.requiredVerifiedMinutes) || 600;
    if (verifiedMinutes < requiredMinutes) {
      return res.status(400).json({
        error: `You've studied ${verifiedMinutes} of ${requiredMinutes} required minutes - keep going, you're not done yet.`
      });
    }

    const claimId = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const claimObj = {
      id: claimId,
      userId,
      userEmail: cleanEmail || userId,
      milestoneId,
      milestoneTitle: milestone.title,
      verifiedMinutesAtClaim: verifiedMinutes,
      status: 'pending',
      claimedAt: new Date().toISOString()
    };

    rewardClaimsStore.set(claimId, claimObj);

    if (supabaseServer) {
      try {
        await supabaseServer.from('reward_claims').upsert([{
          id: claimId,
          data: claimObj,
          updated_at: claimObj.claimedAt
        }], { onConflict: 'id' });
      } catch (e) {}
    }

    res.json({ success: true, claim: claimObj, message: 'Claim submitted successfully - pending admin review.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit reward claim', details: err.message });
  }
});

router.get('/api/rewards/my-claims', (req, res) => {
  const userId = (req.query.userId || '').toString().trim();
  const userEmail = (req.query.userEmail || '').toString().trim().toLowerCase();
  
  const allClaims = Array.from(rewardClaimsStore.values());
  const userClaims = allClaims.filter(c => {
    if (userId && c.userId === userId) return true;
    if (userEmail && c.userEmail && c.userEmail.toLowerCase() === userEmail) return true;
    return false;
  });

  res.json({ success: true, claims: userClaims });
});

router.post('/api/auth/token', async (req, res) => {
  const authHeader = req.headers.authorization;
  const clientIp = String(req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim();
  const requestId = String(req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    recordAdminAuditLog({
      user: 'anonymous',
      action: 'TOKEN_ISSUANCE_DENIED',
      details: 'Rejected /api/auth/token attempt: Missing Bearer token in Authorization header.',
      ip: clientIp,
      requestId,
      endpoint: '/api/auth/token',
      outcome: 'DENIED',
    });
    return res.status(401).json({
      error: 'Authentication Required: Missing Bearer authorization token in headers.',
    });
  }

  const token = authHeader.substring(7).trim();
  let verifiedEmail = '';
  let userId = '';
  let tokenVerified = false;

  // 1. Try decoding/verifying as internal application JWT first
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.email) {
      verifiedEmail = String(decoded.email).trim().toLowerCase();
      userId = decoded.sub || 'user_dev';
      tokenVerified = true;
    }
  } catch (_jwtErr) {}

  // 2. If not verified as internal JWT, try Supabase access token verification
  if (!tokenVerified && supabaseServer) {
    try {
      const { data, error } = await supabaseServer.auth.getUser(token);
      if (!error && data?.user?.email) {
        verifiedEmail = data.user.email.trim().toLowerCase();
        userId = data.user.id;
        tokenVerified = true;
      }
    } catch (_supaErr) {}
  }

  if (!tokenVerified || !verifiedEmail) {
    recordAdminAuditLog({
      user: 'unverified_token',
      action: 'TOKEN_ISSUANCE_FAILED',
      details: 'All token verification methods failed for /api/auth/token',
      ip: clientIp,
      requestId,
      endpoint: '/api/auth/token',
      outcome: 'DENIED',
    });
    return res.status(401).json({
      error: 'Authentication Failed: Could not verify access token with identity provider or internal secret.',
    });
  }

  // 2. Load authoritative user role and premium status strictly from server database
  const isSuper = verifiedEmail === DESIGNATED_ADMIN_EMAIL.toLowerCase();
  const knownUser = adminUsersDb.find((u) => u.email.toLowerCase() === verifiedEmail);

  let finalUser = knownUser;
  if (!knownUser && !isSuper) {
    finalUser = {
      id: userId || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: verifiedEmail.split('@')[0],
      email: verifiedEmail,
      exam: '',
      role: 'USER',
      isPremium: false,
      planName: 'FREE',
      streakDays: 1,
      xp: 100,
      coins: 50,
      level: 1,
      completedTopicsCount: 0,
      joinedAt: new Date().toISOString(),
      status: 'ACTIVE',
      isProfileComplete: false,
    };
    adminUsersDb.push(finalUser);

    if (supabaseServer) {
      try {
        await supabaseServer.from('admin_users').upsert([
          { ...finalUser, updated_at: new Date().toISOString() }
        ], { onConflict: 'id' });
      } catch (e) {}
    }
    saveAdminStoreToDisk();
  }

  if (finalUser && finalUser.status === 'BANNED' && !isSuper) {
    recordAdminAuditLog({
      user: verifiedEmail,
      action: 'BANNED_LOGIN_BLOCKED',
      details: 'Blocked token issuance for banned user',
      ip: clientIp,
      requestId,
      endpoint: '/api/auth/token',
      outcome: 'DENIED',
    });
    return res.status(403).json({ 
      error: 'ACCOUNT_BANNED', 
      message: 'Your account has been suspended for violating community guidelines. Contact support if you believe this is a mistake.' 
    });
  }

  const assignedRole = isSuper ? 'ADMIN' : (finalUser ? finalUser.role : 'USER');
  const userIsPremium = isSuper || (finalUser ? finalUser.isPremium : false);

  // 3. Issue cryptographically signed internal application JWT
  const internalToken = jwt.sign(
    {
      sub: userId,
      email: verifiedEmail,
      role: assignedRole,
      isPremium: userIsPremium,
      iss: 'protrack-auth-server',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  recordAdminAuditLog({
    user: verifiedEmail,
    action: 'TOKEN_ISSUED_SUCCESSFULLY',
    details: `Issued internal JWT for verified identity '${verifiedEmail}' with role '${assignedRole}'`,
    ip: clientIp,
    requestId,
    endpoint: '/api/auth/token',
    outcome: 'SUCCESS',
  });

  return res.json({
    success: true,
    token: internalToken,
    user: {
      id: userId,
      email: verifiedEmail,
      role: assignedRole,
      isPremium: userIsPremium,
    },
  });
});

router.post('/api/user/heartbeat', (req, res) => {
  try {
    const { userId, email, name, exam } = req.body;
    const identifier = email || userId || req.ip;
    if (identifier) {
      activeUsersPresenceMap.set(identifier, {
        userId: userId || identifier,
        email: email || '',
        name: name || email?.split('@')[0] || 'User',
        exam: exam || 'UPSC CSE',
        lastSeen: Date.now(),
        ip: req.ip
      });
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to record heartbeat' });
  }
});

router.get('/api/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const exam = (req.query.exam as string) || 'UPSC_CSE';

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    if (supabaseServer) {
      const { data, error } = await supabaseServer
        .from('user_dashboards')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return res.json({ success: true, data });
      }
    }

    const karma = userKarmaStore.get(userId) || { totalKarma: 0, postKarma: 0, commentKarma: 0 };
    const wallet = userWalletsStore.get(userId) || { coins: 0, balance: 0.0 };

    const dashboardData = {
      userId,
      exam,
      currentStreak: 7,
      totalStudyMinutes: 480,
      completedTopicsCount: 14,
      totalTopicsCount: 85,
      testAccuracy: 78.5,
      karmaPoints: karma.totalKarma,
      coinsEarned: wallet.coins,
      recentActivity: [
        { type: 'test', title: 'Polity Prelims Mock 1', score: '82%', date: new Date().toISOString() },
        { type: 'study', title: 'Fundamental Rights and DPSP', duration: '45 mins', date: new Date(Date.now() - 86400000).toISOString() },
      ],
    };

    res.json({ success: true, data: dashboardData });
  } catch (err: any) {
    console.error('[GET /api/dashboard/:userId] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

router.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    if (supabaseServer) {
      const { data, error } = await supabaseServer
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return res.json({ success: true, data });
      }
    }

    const defaultNotifications = [
      {
        id: 'notif_1',
        userId,
        title: 'Daily Goal Reminder',
        message: 'Complete your remaining 2 syllabus topics today to maintain your streak!',
        type: 'reminder',
        read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: 'notif_2',
        userId,
        title: 'New Live CBT Test Available',
        message: 'National Level Mock Test Series is now live. Rank yourself nationwide.',
        type: 'announcement',
        read: false,
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
    ];

    res.json({ success: true, data: defaultNotifications });
  } catch (err: any) {
    console.error('[GET /api/notifications/:userId] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

router.post('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Notification ID is required' });
    }

    if (supabaseServer) {
      const { error } = await supabaseServer
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('[POST /api/notifications/:id/read] Supabase error:', error.message);
      }
    }

    res.json({ success: true, data: { id, read: true } });
  } catch (err: any) {
    console.error('[POST /api/notifications/:id/read] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

router.post('/api/notifications', async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Title and message are required' });
    }

    const notificationRecord = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId || 'all',
      title,
      message,
      type: type || 'general',
      read: false,
      created_at: new Date().toISOString(),
    };

    if (supabaseServer) {
      const { error } = await supabaseServer
        .from('notifications')
        .insert(notificationRecord);

      if (error) {
        console.error('[POST /api/notifications] Supabase error:', error.message);
      }
    }

    res.json({ success: true, data: notificationRecord });
  } catch (err: any) {
    console.error('[POST /api/notifications] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

router.get('/api/search', async (req, res) => {
  try {
    const query = ((req.query.q as string) || '').toLowerCase().trim();

    if (!query) {
      return res.json({ success: true, data: { posts: [], topics: [], questions: [] } });
    }

    const posts = Array.from(communityPostsStore.values())
      .filter((p: any) => (p.title || '').toLowerCase().includes(query) || (p.content || '').toLowerCase().includes(query))
      .slice(0, 10);

    const questions = Array.from(questionBankStore.values())
      .filter((q: any) => (q.question || q.text || '').toLowerCase().includes(query) || (q.topic || '').toLowerCase().includes(query))
      .slice(0, 10);

    const topics: any[] = Array.from(syllabusNodesStore.values())
      .filter((n: any) => (n.name || n.title || '').toLowerCase().includes(query))
      .map((n: any) => ({ id: n.id, name: n.name || n.title, type: n.type || 'topic', subject: n.subject || '' }))
      .slice(0, 10);

    const payload = {
      posts,
      topics,
      questions,
    };

    res.json({
      success: true,
      data: payload,
      results: payload,
    });
  } catch (err: any) {
    console.error('[GET /api/search] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

router.get(['/api/wallet/:userId', '/api/user/wallet'], async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    if (!verifiedUser) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const rawUserId = req.params.userId || (req.query.userId as string) || verifiedUser.sub || (verifiedUser as any).id;
    if (!rawUserId || typeof rawUserId !== 'string' || !rawUserId.trim() || rawUserId.trim().length > 128) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const userId = rawUserId.trim();
    const callerId = (verifiedUser.sub || (verifiedUser as any).id || (verifiedUser as any).userId || '').toString().trim();
    const callerRole = (verifiedUser.role || '').toString().toUpperCase();
    const callerEmail = (verifiedUser.email || '').toString().toLowerCase();
    const isOwner = callerId === userId;
    const isAdmin = callerRole === 'ADMIN' || callerEmail === DESIGNATED_ADMIN_EMAIL.toLowerCase();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden: Access denied to another user\'s wallet' });
    }

    // Authoritative Neon PostgreSQL initialization and fetch
    // Uses ON CONFLICT to ensure concurrency-safe single row
    const { rows } = await queryPostgres(
      `INSERT INTO public.user_wallets (user_id, balance, coins, total_earned, data, created_at, updated_at)
       VALUES ($1, 0.0, 0, 0.0, '{}'::jsonb, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET updated_at = public.user_wallets.updated_at
       RETURNING user_id, balance, coins, total_earned, created_at, updated_at;`,
      [userId]
    );

    const row = rows[0];
    const wallet = {
      userId: row.user_id,
      balance: Number(row.balance),
      coins: Number(row.coins),
      totalEarned: Number(row.total_earned),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    // Keep memory map as non-authoritative cache
    userWalletsStore.set(userId, wallet);

    return res.status(200).json({
      success: true,
      data: wallet,
      wallet,
    });
  } catch (err: any) {
    console.error('[GET /api/wallet/:userId] Neon authoritative error:', err);
    return res.status(500).json({ success: false, error: 'Database error accessing wallet' });
  }
});

router.get(['/api/wallet/:userId/transactions', '/api/user/wallet/transactions', '/api/user/wallet/payouts'], async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    if (!verifiedUser) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const rawUserId = req.params.userId || (req.query.userId as string) || verifiedUser.sub || (verifiedUser as any).id;
    if (!rawUserId || typeof rawUserId !== 'string' || !rawUserId.trim() || rawUserId.trim().length > 128) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    const userId = rawUserId.trim();
    const callerId = (verifiedUser.sub || (verifiedUser as any).id || (verifiedUser as any).userId || '').toString().trim();
    const callerRole = (verifiedUser.role || '').toString().toUpperCase();
    const callerEmail = (verifiedUser.email || '').toString().toLowerCase();
    const isOwner = callerId === userId;
    const isAdmin = callerRole === 'ADMIN' || callerEmail === DESIGNATED_ADMIN_EMAIL.toLowerCase();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden: Access denied to user transactions' });
    }

    const { rows } = await queryPostgres(
      `SELECT id, user_id, type, amount, status, created_at
       FROM public.wallet_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC;`,
      [userId]
    );

    const transactions = rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      amount: Number(r.amount),
      status: r.status,
      created_at: r.created_at,
      createdAt: r.created_at,
    }));

    return res.status(200).json({
      success: true,
      data: transactions,
      transactions,
    });
  } catch (err: any) {
    console.error('[GET /api/wallet/:userId/transactions] Neon authoritative error:', err);
    return res.status(500).json({ success: false, error: 'Database error reading transactions' });
  }
});

router.post(['/api/wallet/withdraw', '/api/user/wallet/payout-request'], async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    if (!verifiedUser) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { amount, upiId, method } = req.body;
    const rawUserId = req.body.userId || verifiedUser.sub || (verifiedUser as any).id;

    if (!rawUserId || typeof rawUserId !== 'string' || !rawUserId.trim()) {
      return res.status(400).json({ success: false, error: 'Valid user ID is required' });
    }

    const userId = rawUserId.trim();
    const withdrawAmount = Number(amount);
    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid positive withdrawal amount is required' });
    }

    const callerId = (verifiedUser.sub || (verifiedUser as any).id || (verifiedUser as any).userId || '').toString().trim();
    const callerRole = (verifiedUser.role || '').toString().toUpperCase();
    const callerEmail = (verifiedUser.email || '').toString().toLowerCase();
    const isOwner = callerId === userId;
    const isAdmin = callerRole === 'ADMIN' || callerEmail === DESIGNATED_ADMIN_EMAIL.toLowerCase();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
    }

    // Connect to Neon Pool for Atomic DB Transaction
    const client = await pgPool!.connect();
    try {
      await client.query('BEGIN');

      const selRes = await client.query(
        `SELECT user_id, balance, coins, total_earned FROM public.user_wallets WHERE user_id = $1 FOR UPDATE;`,
        [userId]
      );

      if (selRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Wallet not initialized' });
      }

      const currentBalance = Number(selRes.rows[0].balance);
      if (currentBalance < withdrawAmount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Insufficient wallet balance' });
      }

      const updRes = await client.query(
        `UPDATE public.user_wallets
         SET balance = balance - $1, updated_at = NOW()
         WHERE user_id = $2
         RETURNING user_id, balance, coins, total_earned, created_at, updated_at;`,
        [withdrawAmount, userId]
      );

      const payoutId = `payout_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const now = new Date();

      await client.query(
        `INSERT INTO public.wallet_transactions (id, user_id, type, amount, status, created_at)
         VALUES ($1, $2, 'payout', $3, 'pending', $4);`,
        [payoutId, userId, withdrawAmount, now]
      );

      await client.query('COMMIT');

      const updatedRow = updRes.rows[0];
      const updatedWallet = {
        userId: updatedRow.user_id,
        balance: Number(updatedRow.balance),
        coins: Number(updatedRow.coins),
        totalEarned: Number(updatedRow.total_earned),
        createdAt: updatedRow.created_at,
        updatedAt: updatedRow.updated_at,
      };

      const payoutRecord = {
        id: payoutId,
        userId,
        amount: withdrawAmount,
        upiId: upiId || 'aspirant@upi',
        method: method || 'UPI',
        status: 'pending',
        createdAt: now.toISOString(),
      };

      userWalletsStore.set(userId, updatedWallet);

      return res.status(200).json({
        success: true,
        data: { payout: payoutRecord, wallet: updatedWallet },
        wallet: updatedWallet,
        payout: payoutRecord,
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[POST /api/wallet/withdraw] Neon authoritative error:', err);
    return res.status(500).json({ success: false, error: 'Database error processing withdrawal' });
  }
});

router.post('/api/user/wallet/convert', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    if (!verifiedUser) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const { coins } = req.body;
    const rawUserId = req.body.userId || verifiedUser.sub || (verifiedUser as any).id;

    if (!rawUserId || typeof rawUserId !== 'string' || !rawUserId.trim()) {
      return res.status(400).json({ success: false, error: 'Valid user ID is required' });
    }

    const userId = rawUserId.trim();
    const callerId = (verifiedUser.sub || (verifiedUser as any).id || (verifiedUser as any).userId || '').toString().trim();
    const callerRole = (verifiedUser.role || '').toString().toUpperCase();
    const callerEmail = (verifiedUser.email || '').toString().toLowerCase();
    const isOwner = callerId === userId;
    const isAdmin = callerRole === 'ADMIN' || callerEmail === DESIGNATED_ADMIN_EMAIL.toLowerCase();

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
    }

    const requestedCoins = Math.floor(Number(coins));
    if (!requestedCoins || isNaN(requestedCoins) || requestedCoins <= 0) {
      return res.status(400).json({ success: false, error: 'Valid positive coin amount is required' });
    }

    // Conversion rate: 10 coins = 1 INR
    const convertedAmount = Number((requestedCoins / 10).toFixed(2));

    const client = await pgPool!.connect();
    try {
      await client.query('BEGIN');

      const selRes = await client.query(
        `SELECT user_id, balance, coins, total_earned FROM public.user_wallets WHERE user_id = $1 FOR UPDATE;`,
        [userId]
      );

      if (selRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Wallet not initialized' });
      }

      const currentCoins = Number(selRes.rows[0].coins);
      if (currentCoins < requestedCoins) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Insufficient study coins' });
      }

      const updRes = await client.query(
        `UPDATE public.user_wallets
         SET coins = coins - $1, balance = balance + $2, total_earned = total_earned + $2, updated_at = NOW()
         WHERE user_id = $3
         RETURNING user_id, balance, coins, total_earned, created_at, updated_at;`,
        [requestedCoins, convertedAmount, userId]
      );

      const txnId = `conv_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      await client.query(
        `INSERT INTO public.wallet_transactions (id, user_id, type, amount, status, created_at)
         VALUES ($1, $2, 'conversion', $3, 'completed', NOW());`,
        [txnId, userId, convertedAmount]
      );

      await client.query('COMMIT');

      const updatedRow = updRes.rows[0];
      const updatedWallet = {
        userId: updatedRow.user_id,
        balance: Number(updatedRow.balance),
        coins: Number(updatedRow.coins),
        totalEarned: Number(updatedRow.total_earned),
        createdAt: updatedRow.created_at,
        updatedAt: updatedRow.updated_at,
      };

      userWalletsStore.set(userId, updatedWallet);

      return res.status(200).json({
        success: true,
        message: `Converted ${requestedCoins} coins to ₹${convertedAmount}`,
        data: updatedWallet,
        wallet: updatedWallet,
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[POST /api/user/wallet/convert] Neon authoritative error:', err);
    return res.status(500).json({ success: false, error: 'Database error converting coins' });
  }
});

router.get('/api/exams', async (_req, res) => {
  try {
    const exams = Array.from(customExamsStore.values());
    res.json({ success: true, data: exams });
  } catch (err: any) {
    console.error('[GET /api/exams] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

router.post('/api/exams', async (req, res) => {
  try {
    const { name, description, category, userEmail } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Exam name is required' });
    }

    const id = `exam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const examRecord = {
      id,
      name: name.trim(),
      description: description ? description.trim() : '',
      category: category || 'Custom',
      userEmail: userEmail || '',
      createdAt: new Date().toISOString(),
    };

    customExamsStore.set(id, examRecord);

    if (supabaseServer) {
      await supabaseServer.from('exams').insert(examRecord);
    }

    res.json({ success: true, data: examRecord });
  } catch (err: any) {
    console.error('[POST /api/exams] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

router.put('/api/exams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category } = req.body;

    let exam = customExamsStore.get(id);
    if (!exam) {
      return res.status(404).json({ success: false, error: 'Exam not found' });
    }

    exam = {
      ...exam,
      name: name ? name.trim() : exam.name,
      description: description !== undefined ? description.trim() : exam.description,
      category: category || exam.category,
      updatedAt: new Date().toISOString(),
    };

    customExamsStore.set(id, exam);

    if (supabaseServer) {
      await supabaseServer.from('exams').update(exam).eq('id', id);
    }

    res.json({ success: true, data: exam });
  } catch (err: any) {
    console.error('[PUT /api/exams/:id] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

router.delete('/api/exams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existed = customExamsStore.delete(id);

    if (supabaseServer) {
      await supabaseServer.from('exams').delete().eq('id', id);
    }

    res.json({ success: true, data: { id, deleted: existed } });
  } catch (err: any) {
    console.error('[DELETE /api/exams/:id] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// ============================================================================
// FEEDBACK & BUG REPORT ROUTES
// ============================================================================
router.post('/api/feedback', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const { section, type, description, user_email } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, error: 'Description is required' });
    }

    const email = verifiedUser?.email || (user_email || '').trim().toLowerCase() || 'aspirant@example.com';
    const userId = verifiedUser?.sub || 'usr_guest';

    const newReport: any = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      user_email: email,
      email,
      section: section || 'GENERAL',
      type: type || 'FEEDBACK',
      description: description.trim(),
      status: 'OPEN',
      admin_note: '',
      created_at: new Date().toISOString(),
    };

    feedbackReportsStore.set(newReport.id, newReport);

    if (supabaseServer) {
      try {
        await supabaseServer.from('user_feedback').upsert([{
          id: newReport.id,
          user_id: userId,
          user_email: email,
          section: newReport.section,
          type: newReport.type,
          description: newReport.description,
          status: newReport.status,
          created_at: newReport.created_at,
        }]);
      } catch (_supaErr) {}
    }

    res.json({ success: true, report: newReport, message: 'Feedback submitted successfully' });
  } catch (err: any) {
    console.error('[POST /api/feedback] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

router.get('/api/feedback/mine', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const email = (verifiedUser?.email || (req.query.email as string) || '').toLowerCase().trim();

    if (!email && !verifiedUser) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    let reports = Array.from(feedbackReportsStore.values()).filter((r: any) => {
      const rEmail = (r.user_email || r.email || '').toLowerCase().trim();
      const rUserId = r.user_id || r.userId;
      return (email && rEmail === email) || (verifiedUser?.sub && rUserId === verifiedUser.sub);
    });

    if (reports.length === 0 && supabaseServer) {
      try {
        let q = supabaseServer.from('user_feedback').select('*');
        if (verifiedUser?.sub) q = q.eq('user_id', verifiedUser.sub);
        else if (email) q = q.eq('user_email', email);
        const { data, error } = await q;
        if (!error && Array.isArray(data)) {
          reports = data;
          data.forEach((r: any) => feedbackReportsStore.set(r.id, r));
        }
      } catch (_supaErr) {}
    }

    res.json({ success: true, feedback: reports });
  } catch (err: any) {
    console.error('[GET /api/feedback/mine] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// ============================================================================
// USER PERSISTENT TASKS / KANBAN
// ============================================================================
const userTasksStore = new Map<string, any[]>();

router.get('/api/user/tasks', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = verifiedUser?.sub || (req.query.userId as string) || 'guest';
    const exam = (req.query.exam as string) || 'NEET_UG';

    const cacheKey = `${userId}_${exam}`;
    let tasks: any[] = [];

    if (pgPool && userId !== 'guest') {
      try {
        const { rows } = await queryPostgres(
          'SELECT * FROM public.user_tasks WHERE user_id = $1 AND exam = $2 ORDER BY created_at DESC',
          [userId, exam]
        );
        tasks = rows.map((r: any) => ({
          ...r,
          userId: r.user_id,
          completed: r.status === 'completed' || r.completed === true
        }));
        userTasksStore.set(cacheKey, tasks);
      } catch (err: any) {
        console.error('[Tasks] PostgreSQL query error:', err.message);
        return res.status(500).json({ success: false, error: 'Database query error: ' + err.message });
      }
    } else if (supabaseServer && userId !== 'guest') {
      const { data, error } = await supabaseServer
        .from('user_tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('exam', exam)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[Tasks] Supabase select error:', error.message);
        return res.status(500).json({ success: false, error: 'Database query error: ' + error.message });
      }
      tasks = data || [];
      userTasksStore.set(cacheKey, tasks);
    } else {
      tasks = userTasksStore.get(cacheKey) || [];
    }

    res.json({ success: true, tasks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api/user/tasks', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = verifiedUser?.sub || req.body.userId || 'guest';
    const { title, subject, priority, minutes, status, exam } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Task title is required' });
    }

    const newTask = {
      id: req.body.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      user_id: userId,
      title: title.trim(),
      subject: subject || 'General Practice',
      priority: priority || 'High',
      minutes: Number(minutes) || 45,
      status: status || 'todo',
      completed: status === 'completed',
      exam: exam || 'NEET_UG',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (pgPool && userId !== 'guest') {
      try {
        await queryPostgres(
          'INSERT INTO auth.users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
          [userId, verifiedUser?.email || 'user@example.com']
        );
        await queryPostgres(
          `INSERT INTO public.user_tasks (id, user_id, title, subject, priority, minutes, status, completed, exam, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             subject = EXCLUDED.subject,
             priority = EXCLUDED.priority,
             minutes = EXCLUDED.minutes,
             status = EXCLUDED.status,
             completed = EXCLUDED.completed,
             exam = EXCLUDED.exam,
             updated_at = EXCLUDED.updated_at`,
          [
            newTask.id,
            newTask.user_id,
            newTask.title,
            newTask.subject,
            newTask.priority,
            newTask.minutes,
            newTask.status,
            newTask.completed,
            newTask.exam,
            newTask.created_at,
            newTask.updated_at
          ]
        );
      } catch (dbErr: any) {
        console.error('[Tasks] PostgreSQL insert error:', dbErr.message);
        return res.status(500).json({ success: false, error: 'Database persistence error: ' + dbErr.message });
      }
    } else if (supabaseServer && userId !== 'guest') {
      const { error: dbErr } = await supabaseServer.from('user_tasks').upsert([newTask], { onConflict: 'id' });
      if (dbErr) {
        console.error('[Tasks] Supabase insert error:', dbErr.message);
        return res.status(500).json({ success: false, error: 'Database persistence error: ' + dbErr.message });
      }
    }

    const cacheKey = `${userId}_${newTask.exam}`;
    const existing = userTasksStore.get(cacheKey) || [];
    existing.unshift(newTask);
    userTasksStore.set(cacheKey, existing);

    res.json({ success: true, task: newTask });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/api/user/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = verifiedUser?.sub || req.body.userId || 'guest';
    const updates = req.body;
    const now = new Date().toISOString();

    if (pgPool && userId !== 'guest') {
      try {
        const fields: string[] = [];
        const values: any[] = [];
        let pIndex = 1;

        if (updates.title !== undefined) {
          fields.push(`title = $${pIndex++}`);
          values.push(updates.title);
        }
        if (updates.subject !== undefined) {
          fields.push(`subject = $${pIndex++}`);
          values.push(updates.subject);
        }
        if (updates.priority !== undefined) {
          fields.push(`priority = $${pIndex++}`);
          values.push(updates.priority);
        }
        if (updates.minutes !== undefined) {
          fields.push(`minutes = $${pIndex++}`);
          values.push(Number(updates.minutes));
        }
        if (updates.status !== undefined) {
          fields.push(`status = $${pIndex++}`);
          values.push(updates.status);
          fields.push(`completed = $${pIndex++}`);
          values.push(updates.status === 'completed');
        } else if (updates.completed !== undefined) {
          fields.push(`completed = $${pIndex++}`);
          values.push(Boolean(updates.completed));
          if (updates.completed) {
            fields.push(`status = $${pIndex++}`);
            values.push('completed');
          }
        }
        if (updates.exam !== undefined) {
          fields.push(`exam = $${pIndex++}`);
          values.push(updates.exam);
        }

        fields.push(`updated_at = $${pIndex++}`);
        values.push(now);

        values.push(id);
        const idIndex = pIndex++;
        values.push(userId);
        const userIndex = pIndex++;

        const sql = `UPDATE public.user_tasks SET ${fields.join(', ')} WHERE id = $${idIndex} AND user_id = $${userIndex} RETURNING *`;
        const { rows } = await queryPostgres(sql, values);
        if (rows.length === 0) {
          const exists = await queryPostgres('SELECT id, user_id FROM public.user_tasks WHERE id = $1', [id]);
          if (exists.rows.length > 0) {
            return res.status(403).json({ success: false, error: 'Forbidden: You do not own this task' });
          }
        }
      } catch (dbErr: any) {
        console.error('[Tasks] PostgreSQL update error:', dbErr.message);
        return res.status(500).json({ success: false, error: 'Database update error: ' + dbErr.message });
      }
    } else if (supabaseServer && userId !== 'guest') {
      const { error: dbErr } = await supabaseServer.from('user_tasks').update(updates).eq('id', id);
      if (dbErr) {
        console.error('[Tasks] Supabase update error:', dbErr.message);
        return res.status(500).json({ success: false, error: 'Database update error: ' + dbErr.message });
      }
    }

    let updatedTask: any = null;
    for (const [key, taskList] of userTasksStore.entries()) {
      const idx = taskList.findIndex((t: any) => t.id === id);
      if (idx !== -1) {
        taskList[idx] = {
          ...taskList[idx],
          ...updates,
          completed: updates.status ? updates.status === 'completed' : taskList[idx].completed,
          updated_at: now,
        };
        updatedTask = taskList[idx];
        userTasksStore.set(key, taskList);
        break;
      }
    }

    if (!updatedTask) {
      updatedTask = { id, ...updates, updated_at: now };
    }

    res.json({ success: true, task: updatedTask });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/api/user/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = verifiedUser?.sub || (req.query.userId as string) || 'guest';

    if (pgPool && userId !== 'guest') {
      try {
        const ownerCheck = await queryPostgres('SELECT id, user_id FROM public.user_tasks WHERE id = $1', [id]);
        if (ownerCheck.rows.length > 0 && ownerCheck.rows[0].user_id !== userId) {
          return res.status(403).json({ success: false, error: 'Forbidden: You do not own this task' });
        }
        await queryPostgres('DELETE FROM public.user_tasks WHERE id = $1 AND user_id = $2', [id, userId]);
      } catch (dbErr: any) {
        console.error('[Tasks] PostgreSQL delete error:', dbErr.message);
        return res.status(500).json({ success: false, error: 'Database delete error: ' + dbErr.message });
      }
    } else if (supabaseServer && userId !== 'guest') {
      const { error: dbErr } = await supabaseServer.from('user_tasks').delete().eq('id', id);
      if (dbErr) {
        console.error('[Tasks] Supabase delete error:', dbErr.message);
        return res.status(500).json({ success: false, error: 'Database delete error: ' + dbErr.message });
      }
    }

    for (const [key, taskList] of userTasksStore.entries()) {
      const idx = taskList.findIndex((t: any) => t.id === id);
      if (idx !== -1) {
        taskList.splice(idx, 1);
        userTasksStore.set(key, taskList);
        break;
      }
    }

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// DATA-DRIVEN USER WEAKNESS ANALYTICS
// ============================================================================
router.get('/api/user/analytics/weaknesses', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = verifiedUser?.sub || (req.query.userId as string) || 'guest';
    const exam = (req.query.exam as string) || 'NEET_UG';

    const resultsList = Array.from(cbtResultsStore.values()).filter(
      (r: any) => (r.userId === userId || userId === 'guest') && (!exam || r.exam === exam)
    );

    const topicStats: Record<string, { topic: string; subject: string; totalAttempts: number; correctCount: number; incorrectCount: number }> = {};

    resultsList.forEach((result: any) => {
      const answers = result.answers || {};
      const questions = result.questions || [];

      questions.forEach((q: any) => {
        const topic = q.topic || 'General Practice';
        const subject = q.subject || 'Core';
        if (!topicStats[topic]) {
          topicStats[topic] = { topic, subject, totalAttempts: 0, correctCount: 0, incorrectCount: 0 };
        }
        topicStats[topic].totalAttempts += 1;
        const studentChoice = answers[q.id];
        if (studentChoice !== undefined && studentChoice !== null && studentChoice === q.correctAnswer) {
          topicStats[topic].correctCount += 1;
        } else if (studentChoice !== undefined && studentChoice !== null) {
          topicStats[topic].incorrectCount += 1;
        }
      });
    });

    const topicBreakdown = Object.values(topicStats).map((stat) => {
      const accuracy = stat.totalAttempts > 0 ? Math.round((stat.correctCount / stat.totalAttempts) * 100) : 0;
      let weaknessLevel: 'High' | 'Moderate' | 'Low' = 'Low';
      if (accuracy < 50) weaknessLevel = 'High';
      else if (accuracy < 75) weaknessLevel = 'Moderate';

      return {
        topic: stat.topic,
        subject: stat.subject,
        totalAttempts: stat.totalAttempts,
        correctCount: stat.correctCount,
        incorrectCount: stat.incorrectCount,
        accuracy,
        weaknessLevel,
      };
    }).sort((a, b) => a.accuracy - b.accuracy);

    res.json({
      success: true,
      exam,
      userId,
      hasAttemptHistory: topicBreakdown.length > 0,
      totalTestsAnalyzed: resultsList.length,
      topics: topicBreakdown,
      highWeaknessCount: topicBreakdown.filter(t => t.weaknessLevel === 'High').length,
    });
  } catch (err: any) {
    console.error('[GET /api/user/analytics/weaknesses] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

export default router;
