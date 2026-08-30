// ============================================================================
// ENTERPRISE AI STUDY ASSISTANT & STREAMING ROUTES
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

const router = Router();
const __dirname = path.resolve();

router.post('/api/gemini/moderate', async (req, res) => {
  try {
    const { text = '', fileName = '', user = 'Guest Aspirant', room = 'Community', userId, userEmail } = req.body;

    if (userId || userEmail) {
      const bannedUser = adminUsersDb.find(
        (u) =>
          (userId && u.id === userId) ||
          (userEmail && u.email?.toLowerCase() === String(userEmail).toLowerCase())
      );
      if (bannedUser && bannedUser.status === 'BANNED') {
        return res.json({ safe: false, banned: true, reason: 'Your account has been suspended.', category: 'banned' });
      }
    }

    const contentToTest = `${text} ${fileName}`.trim();

    if (!contentToTest) {
      return res.json({ safe: true, reason: 'Empty content' });
    }

    const modSettings = globalAdminSettings.moderation || {
      enabled: true,
      autoban: true,
      keywords: ['nsfw', 'porn', 'nude', 'hate', 'abuse', 'fuck', 'bitch', 'asshole', 'bastard', 'explicit']
    };

    const activeKeywords = modSettings.enabled && Array.isArray(modSettings.keywords) ? modSettings.keywords : [];
    const lower = contentToTest.toLowerCase();
    const hasLocalViolation = activeKeywords.some((kw: string) => lower.includes(kw.toLowerCase()));

    let modResult = { safe: true, reason: 'Clean', category: 'clean' };

    if (hasLocalViolation) {
      modResult = { safe: false, reason: 'Message contains profane or abusive language violating study guidelines.', category: 'abuse' };
    } else {
      const ai = getGeminiClient();
      if (ai) {
        const systemInstruction = `You are AspirantX AI Security Guard, an automated content moderation engine for a student UPSC/SSC study application.
Analyze the input string (message text or attachment filename).
Detect any NSFW content, sexual explicitness, hate speech, severe profanity, harassment, or dangerous material.
You MUST reply ONLY with a valid JSON object matching this schema:
{
  "safe": boolean,
  "reason": string (short explanation if unsafe, or "Clean" if safe),
  "category": string ("clean" | "nsfw" | "abuse" | "hate" | "violence")
}`;

        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: `Content to evaluate: "${contentToTest}"`,
            config: {
              systemInstruction,
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          });
          if (response.text) {
            modResult = JSON.parse(response.text.trim());
          }
        } catch (e) {
          console.warn('Moderation AI evaluation error:', e);
        }
      }
    }

    let isBanned = false;
    if (!modResult.safe) {
      const clientIp = String(req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || '127.0.0.1').split(',')[0].trim();
      const requestId = String(req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
      
      recordAdminAuditLog({
        user: userEmail || user,
        action: 'AI_MODERATION_VIOLATION',
        details: `${modResult.reason} in ${room}: "${contentToTest.substring(0, 80)}"`,
        ip: clientIp,
        requestId,
        endpoint: req.originalUrl,
        outcome: 'DENIED',
      });

      if (modSettings.autoban && (userId || userEmail)) {
        let targetUser = adminUsersDb.find(u => u.id === userId || (userEmail && u.email.toLowerCase() === String(userEmail).toLowerCase()));
        if (!targetUser && userEmail) {
          targetUser = {
            id: userId || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: String(userEmail).split('@')[0],
            email: String(userEmail).toLowerCase(),
            exam: 'UPSC CSE 2026',
            role: 'USER',
            isPremium: false,
            planName: 'FREE',
            streakDays: 1,
            xp: 100,
            coins: 50,
            level: 1,
            completedTopicsCount: 0,
            joinedAt: new Date().toISOString(),
            status: 'ACTIVE'
          };
          adminUsersDb.push(targetUser);
        }
        if (targetUser && targetUser.role !== 'ADMIN') {
          targetUser.status = 'BANNED';
          isBanned = true;
          if (supabaseServer) {
            try {
              await supabaseServer.from('admin_users').upsert([
                { ...targetUser, updated_at: new Date().toISOString() }
              ], { onConflict: 'id' });
            } catch (e) {}
          }
          saveAdminStoreToDisk();
          recordAdminAuditLog({
            user: targetUser.email || user,
            action: 'AUTO_BAN_TRIGGERED',
            details: `Auto-banned user for violating moderation policy: "${contentToTest.substring(0, 60)}"`,
            outcome: 'DENIED'
          });
        }
      }
    }

    res.json({ ...modResult, banned: isBanned });
  } catch (error: any) {
    console.error('Moderation error:', error);
    res.json({ safe: true, reason: 'Bypassed error safely' });
  }
});

router.post('/api/gemini/bot-moderator', async (req, res) => {
  try {
    const { room = 'UPSC Room', query, user = 'Aspirant' } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }

    const ai = getGeminiClient();

    if (!ai) {
      const demoReply = `@${user}, regarding your query in ${room}: "${query}" - Here is a quick study takeaway: Ensure you cross-reference this with the official syllabus roadmap and current affairs! Keep grinding! [LAUNCH]`;
      return res.json({ reply: demoReply });
    }

    const systemInstruction = `You are @AspirantX Bot, the official AI Room Moderator and Study Assistant in the ${room} community chat room for UPSC Civil Services & SSC aspirants.
- Address the user (@${user}) directly.
- Provide crisp, authoritative, exam-relevant study insights, PYQ tips, or concept explanations.
- Use bullet points, mnemonic tricks, and an encouraging tone.
- Keep the response around 80-120 words maximum so it fits nicely inside the live room chat stream.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `User query in ${room}: "${query}"`,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || `@${user} I'm here to assist! Let me know if you need specific notes or formulas.`;
    res.json({ reply });
  } catch (error: any) {
    console.error('Bot moderator error:', error);
    res.status(500).json({ error: 'Failed to generate bot response' });
  }
});

router.post('/api/gemini/chat', async (req, res) => {
  try {
    const { message, exam = 'UPSC_CSE', history = [], userEmail } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message field is required' });
    }

    // Backend Premium Enforcement Check
    const chatFlag = featureFlagsStore.find((f) => f.feature_name === 'chat');
    if (chatFlag && chatFlag.is_premium) {
      const emailToCheck = userEmail || (req.headers['x-user-email'] as string);
      if (!checkUserServerPremiumStatus(emailToCheck)) {
        return res.status(403).json({
          error: 'ACCESS DENIED: Premium subscription required. Access blocked by server security.',
          isPremiumRequired: true,
        });
      }
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Return smart simulated response if API key is not yet set
      const demoReply = `[AspirantX AI Mentor (${exam})]: Great query regarding ${exam}! I see you asked: "${message}". Remember to correlate static concepts (like Laxmikanth or NCERTs) with current affairs from The Hindu / PIB. For detailed answer evaluation or custom notes generation, attach your outline!`;
      return res.json({ reply: demoReply });
    }

    const systemInstruction = `You are AspirantX AI Mentor, an elite, encouraging, high-precision study assistant for ${exam} (UPSC Civil Services & SSC Exams).
- Provide ultra-structured, concise, exam-focused answers.
- Use bullet points, mnemonic devices, key constitutional articles, and PYQ trends where applicable.
- Adopt a Gen-Z motivational, disciplined yet empathetic tone. Use modern formatting with markdown headers and code blocks if appropriate.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'Sorry, I could not generate a response at this time.';
    res.json({ reply });
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({
      error: 'Failed to process AI chat request',
      details: error.message || 'Unknown server error',
    });
  }
});

router.post('/api/gemini/parse-syllabus', (req, res, next) => {
  req.url = '/api/syllabus/ai-organize';
  return (req.app as any)._router.handle(req, res, next);
});

router.get('/api/ai/conversations', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const emailQuery = (req.query.email as string) || '';
    const targetEmail = (verifiedUser?.email || emailQuery || 'guest@aspirantx.in').trim().toLowerCase();

    const conversations: AiConversationRecord[] = [];
    for (const [_, conv] of aiConversationsDb.entries()) {
      if (conv.userEmail === targetEmail) {
        conversations.push(conv);
      }
    }

    // Sort pinned first, then newest updated
    conversations.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    res.json({ success: true, conversations });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch conversations', details: err.message });
  }
});

router.post('/api/ai/conversations', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const { title = 'New AI Study Session', exam = 'UPSC_CSE', mode = 'general', userEmail: bodyEmail } = req.body;
    const targetEmail = (verifiedUser?.email || bodyEmail || 'guest@aspirantx.in').trim().toLowerCase();

    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newConv: AiConversationRecord = {
      id,
      userEmail: targetEmail,
      title: title.trim(),
      exam,
      mode,
      isPinned: false,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };

    aiConversationsDb.set(id, newConv);
    aiMessagesDb.set(id, []);

    if (supabaseServer) {
      try {
        await supabaseServer.from('ai_conversations').upsert([newConv]);
      } catch (e) {
        console.warn('Supabase conv save note:', e);
      }
    }

    res.json({ success: true, conversation: newConv });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create conversation', details: err.message });
  }
});

router.put('/api/ai/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, isPinned, isArchived, mode, summary } = req.body;

    const conv = aiConversationsDb.get(id);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (title !== undefined) conv.title = String(title).trim();
    if (isPinned !== undefined) conv.isPinned = Boolean(isPinned);
    if (isArchived !== undefined) conv.isArchived = Boolean(isArchived);
    if (mode !== undefined) conv.mode = String(mode);
    if (summary !== undefined) conv.summary = String(summary);
    conv.updatedAt = new Date().toISOString();

    aiConversationsDb.set(id, conv);

    if (supabaseServer) {
      try {
        await supabaseServer.from('ai_conversations').upsert([conv]);
      } catch (e) {}
    }

    res.json({ success: true, conversation: conv });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update conversation', details: err.message });
  }
});

router.delete('/api/ai/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    aiConversationsDb.delete(id);
    aiMessagesDb.delete(id);

    if (supabaseServer) {
      try {
        await supabaseServer.from('ai_conversations').delete().eq('id', id);
        await supabaseServer.from('ai_messages').delete().eq('conversationId', id);
      } catch (e) {}
    }

    res.json({ success: true, message: 'Conversation deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete conversation', details: err.message });
  }
});

router.get('/api/ai/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const messages = aiMessagesDb.get(id) || [];
    res.json({ success: true, messages });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch messages', details: err.message });
  }
});

router.post('/api/ai/messages/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback, conversationId } = req.body;

    if (conversationId && aiMessagesDb.has(conversationId)) {
      const msgs = aiMessagesDb.get(conversationId) || [];
      const msg = msgs.find((m) => m.id === id);
      if (msg) {
        msg.feedback = feedback;
        aiMessagesDb.set(conversationId, msgs);
      }
    }

    res.json({ success: true, id, feedback });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit feedback', details: err.message });
  }
});

router.post('/api/ai/stream', async (req, res) => {
  const verifiedUser = await extractVerifiedUserFromReq(req);
  const {
    conversationId,
    message,
    exam = 'UPSC_CSE',
    mode = 'general',
    history = [],
    userEmail: bodyEmail,
  } = req.body;

  const targetEmail = (verifiedUser?.email || bodyEmail || 'guest@aspirantx.in').trim().toLowerCase();

  // Premium Feature Flag Enforcement
  const chatFlag = featureFlagsStore.find((f) => f.feature_name === 'chat');
  if (chatFlag && chatFlag.is_premium) {
    if (!checkUserServerPremiumStatus(targetEmail)) {
      res.status(403).json({
        error: 'ACCESS DENIED: Premium subscription required to access AI Mentor.',
        isPremiumRequired: true,
      });
      return;
    }
  }

  const cleanInput = sanitizeAiPrompt(message);
  if (!cleanInput) {
    res.status(400).json({ error: 'Valid input message is required.' });
    return;
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const convId = conversationId || `conv_${Date.now()}`;

  // Ensure conversation exists in DB
  if (!aiConversationsDb.has(convId)) {
    const newConv: AiConversationRecord = {
      id: convId,
      userEmail: targetEmail,
      title: cleanInput.slice(0, 35) + '...',
      exam,
      mode,
      isPinned: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    aiConversationsDb.set(convId, newConv);
    aiMessagesDb.set(convId, []);
  }

  const userMsgRecord: AiMessageRecord = {
    id: `msg_u_${Date.now()}`,
    conversationId: convId,
    sender: 'user',
    text: cleanInput,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    modeTag: mode,
  };

  const existingMsgs = aiMessagesDb.get(convId) || [];
  existingMsgs.push(userMsgRecord);
  aiMessagesDb.set(convId, existingMsgs);

  const assistantMsgId = `msg_a_${Date.now()}`;
  let fullAssistantText = '';

  const ai = getGeminiClient();

  if (!ai) {
    // Simulated SSE Stream when API key is not active
    const simulatedResponse = `[AspirantX AI Mentor (${mode.toUpperCase()} - ${exam})]\n\n` +
      `**Analysis & Guidance for Query:**\n\n"${cleanInput}"\n\n` +
      `1. **Core Concept Overview**: In ${exam} preparation, analyzing this query requires combining static fundamentals (NCERT / standard textbooks) with current policy updates.\n` +
      `2. **Key Keywords**: Make sure to incorporate key terminology, relevant Constitutional Articles (or equations/data), and Supreme Court judgments.\n` +
      `3. **Way Forward**: Structure your answer with clear intro, subheadings, and a forward-looking conclusion.\n\n` +
      `*Note: Set your GEMINI_API_KEY in environment or AI Studio settings for real-time Live Gemini streaming.*`;

    const chunks = simulatedResponse.split(' ');
    let i = 0;
    const interval = setInterval(async () => {
      if (i < chunks.length) {
        const word = chunks[i] + ' ';
        fullAssistantText += word;
        res.write(`data: ${JSON.stringify({ text: word })}\n\n`);
        i++;
      } else {
        clearInterval(interval);

        const assistantMsgRecord: AiMessageRecord = {
          id: assistantMsgId,
          conversationId: convId,
          sender: 'assistant',
          text: fullAssistantText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modeTag: mode,
        };
        existingMsgs.push(assistantMsgRecord);
        aiMessagesDb.set(convId, existingMsgs);

        if (supabaseServer) {
          try {
            await supabaseServer.from('ai_messages').upsert([
              {
                id: userMsgRecord.id,
                conversationId: convId,
                sender: userMsgRecord.sender,
                text: userMsgRecord.text,
                timestamp: userMsgRecord.timestamp,
                mode_tag: userMsgRecord.modeTag,
                updated_at: new Date().toISOString()
              },
              {
                id: assistantMsgRecord.id,
                conversationId: convId,
                sender: assistantMsgRecord.sender,
                text: assistantMsgRecord.text,
                timestamp: assistantMsgRecord.timestamp,
                mode_tag: assistantMsgRecord.modeTag,
                updated_at: new Date().toISOString()
              }
            ], { onConflict: 'id' });
          } catch (e) {}
        }

        res.write(`data: ${JSON.stringify({ done: true, messageId: assistantMsgId, conversationId: convId })}\n\n`);
        res.end();
      }
    }, 30);

    req.on('close', () => {
      clearInterval(interval);
    });
    return;
  }

  try {
    const conv = aiConversationsDb.get(convId);
    const summary = conv?.summary;
    const systemInstruction = getSystemInstructionForMode(mode, exam, summary);

    // Format history for context window
    const formattedHistory = Array.isArray(history)
      ? history.slice(-8).map((h: any) => ({
          role: h.sender === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        }))
      : [];

    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: cleanInput }] },
    ];

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        fullAssistantText += chunk.text;
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    // Save Assistant Response
    const assistantMsgRecord: AiMessageRecord = {
      id: assistantMsgId,
      conversationId: convId,
      sender: 'assistant',
      text: fullAssistantText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modeTag: mode,
    };
    existingMsgs.push(assistantMsgRecord);
    aiMessagesDb.set(convId, existingMsgs);

    if (supabaseServer) {
      try {
        await supabaseServer.from('ai_messages').upsert([
          {
            id: userMsgRecord.id,
            conversationId: convId,
            sender: userMsgRecord.sender,
            text: userMsgRecord.text,
            timestamp: userMsgRecord.timestamp,
            mode_tag: userMsgRecord.modeTag,
            updated_at: new Date().toISOString()
          },
          {
            id: assistantMsgRecord.id,
            conversationId: convId,
            sender: assistantMsgRecord.sender,
            text: assistantMsgRecord.text,
            timestamp: assistantMsgRecord.timestamp,
            mode_tag: assistantMsgRecord.modeTag,
            updated_at: new Date().toISOString()
          }
        ], { onConflict: 'id' });
      } catch (e) {}
    }

    // Update conversation timestamp
    if (conv) {
      conv.updatedAt = new Date().toISOString();
      aiConversationsDb.set(convId, conv);
    }

    res.write(`data: ${JSON.stringify({ done: true, messageId: assistantMsgId, conversationId: convId })}\n\n`);
    res.end();
  } catch (err: any) {
    console.error('SSE Stream error:', err);
    res.write(`data: ${JSON.stringify({ error: err.message || 'Stream processing error occurred.' })}\n\n`);
    res.end();
  }
});

router.post('/api/ai/evaluate', async (req, res) => {
  try {
    const { answerText, questionText, exam = 'UPSC_CSE', type = 'mains' } = req.body;

    if (!answerText || typeof answerText !== 'string' || answerText.trim().length < 10) {
      return res.status(400).json({ error: 'Answer text (minimum 10 characters) is required for evaluation.' });
    }

    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        success: true,
        evaluation: {
          totalScore: 6.5,
          structureScore: 7,
          contentScore: 6,
          keywordsScore: 6.5,
          wayForwardScore: 7,
          strengths: [
            'Good structural intro linking topic to current context',
            'Subheadings used effectively to divide arguments',
            'Neutral, balanced administrative tone preserved',
          ],
          weaknesses: [
            'Missing explicit Constitutional Articles (e.g., Art. 38, Art. 39)',
            'Budgetary data / Economic Survey figures could be cited',
            'Way forward needs specific committee recommendations (e.g., NITI Aayog/ARC)',
          ],
          missedKeywords: ['Article 39(b)', 'Fiscal Consolidation', 'SDG 8', 'Inclusive Growth'],
          suggestedAdditions: ['Include a schematic flowchart showing institutional mechanisms.'],
          modelAnswerBlueprint: `**Introduction**: Define core concept and link to recent government policy.\n\n**Body**: Split into 3 dimensions (Administrative, Economic, Social).\n\n**Conclusion**: Conclude with a vision towards Amrit Kaal 2047.`,
        },
      });
    }

    const prompt = `You are an expert UPSC Civil Services Mains Answer Evaluator.
Evaluate the following ${type.toUpperCase()} response.

Question: ${questionText || 'UPSC GS Mains Standard Question'}
Student Answer:
${answerText}

Return a valid JSON object with EXACTLY this structure:
{
  "totalScore": 6.5,
  "structureScore": 7.0,
  "contentScore": 6.0,
  "keywordsScore": 6.5,
  "wayForwardScore": 7.0,
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
  "missedKeywords": ["Keyword 1", "Keyword 2", "Keyword 3"],
  "suggestedAdditions": ["Addition 1", "Addition 2"],
  "modelAnswerBlueprint": "Detailed markdown outline for a top-scoring model answer"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const jsonText = response.text || '{}';
    const evalData = JSON.parse(jsonText);

    res.json({ success: true, evaluation: evalData });
  } catch (err: any) {
    console.error('AI Evaluation error:', err);
    res.status(500).json({ error: 'Failed to complete AI answer evaluation', details: err.message });
  }
});

router.post('/api/ai/trend-prediction', async (req, res) => {
  try {
    const { userEmail, exam = 'UPSC_CSE', clientAttempts } = req.body;
    const emailToCheck = (userEmail || (req.headers['x-user-email'] as string) || '').toString().trim().toLowerCase();

    // Look up CBT / Quiz history on server
    let history: any[] = [];
    if (emailToCheck) {
      const direct = cbtResultsStore.get(emailToCheck);
      if (Array.isArray(direct)) {
        history.push(...direct);
      }
      if (history.length === 0) {
        // Scan store entries for matching email
        for (const [key, records] of cbtResultsStore.entries()) {
          if (Array.isArray(records)) {
            const matches = records.filter((r: any) => 
              (r.userEmail && r.userEmail.toLowerCase() === emailToCheck) ||
              (r.user_email && r.user_email.toLowerCase() === emailToCheck)
            );
            if (matches.length > 0) {
              history.push(...matches);
            }
          }
        }
      }
    }

    // Merge client-provided attempts if available
    const clientAttemptArray = Array.isArray(clientAttempts) ? clientAttempts : [];
    const totalAttemptsCount = history.length + clientAttemptArray.length;

    if (totalAttemptsCount < 1) {
      return res.json({
        success: false,
        notEnoughData: true,
        message: 'Attempt at least 3 practice questions or PYQ tests first so Gemini AI can analyze your accuracy and weak areas!'
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        success: false,
        geminiNotConfigured: true,
        message: 'AI prediction unavailable - GEMINI_API_KEY is not configured in the server environment.'
      });
    }

    // Calculate aggregated stats
    let totalAccuracy = 0;
    const weakTopicsSet = new Set<string>();
    const strongTopicsSet = new Set<string>();

    history.forEach((h: any) => {
      if (typeof h.accuracy === 'number') totalAccuracy += h.accuracy;
      if (Array.isArray(h.weakTopics)) h.weakTopics.forEach((t: string) => weakTopicsSet.add(t));
      if (Array.isArray(h.weakSubjects)) h.weakSubjects.forEach((s: string) => weakTopicsSet.add(s));
      if (Array.isArray(h.strongTopics)) h.strongTopics.forEach((t: string) => strongTopicsSet.add(t));
      if (Array.isArray(h.strongSubjects)) h.strongSubjects.forEach((s: string) => strongTopicsSet.add(s));
    });

    clientAttemptArray.forEach((ca: any) => {
      if (typeof ca.accuracy === 'number') totalAccuracy += ca.accuracy;
      if (ca.weakTopic) weakTopicsSet.add(ca.weakTopic);
      if (ca.subject) strongTopicsSet.add(ca.subject);
    });

    const avgAccuracy = Math.round(totalAccuracy / Math.max(1, totalAttemptsCount));
    const weakTopicsList = Array.from(weakTopicsSet);
    const strongTopicsList = Array.from(strongTopicsSet);

    const prompt = `You are an expert AI Exam Trend Analyst for competitive exams like ${exam}.
Analyze the candidate's actual practice performance data and generate a high-yield AI Trend & Weak Area Prediction Report.

Candidate Data:
- Target Exam: ${exam}
- Total Practice Tests / Quizzes Attempted: ${totalAttemptsCount}
- Average Accuracy Rate: ${avgAccuracy}%
- Identified Weak Topics/Subjects: ${weakTopicsList.join(', ') || 'Polity Constitutional Amendments, Economic Monetary Policy'}
- Identified Strong Topics/Subjects: ${strongTopicsList.join(', ') || 'Modern History, Indian Geography'}

Output MUST be formatted in clean Markdown with clear emoji headings:
### [HOT] High-Probability Topics for ${exam} (2026 Prediction)
(List 3 specific high-probability topics based on candidate's weak/strong areas and historical exam patterns)

### [!CRITICAL] Weak-Area Diagnostic & Remediation
(Provide concise diagnostic advice on how to fix their weak areas)

### [GOAL] 7-Day High-Yield Action Plan
(3 actionable steps for the upcoming week)

Keep the response concise, razor-sharp, and highly motivating (around 150-200 words max).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        temperature: 0.4,
      },
    });

    const predictionText = response.text || 'Unable to generate trend prediction report at this moment.';

    res.json({
      success: true,
      prediction: predictionText,
      summaryStats: {
        totalAttempts: totalAttemptsCount,
        avgAccuracy,
        weakTopics: weakTopicsList,
        strongTopics: strongTopicsList
      }
    });
  } catch (err: any) {
    console.error('AI Trend Prediction Error:', err);
    res.status(500).json({ error: 'Failed to generate AI trend prediction', details: err.message });
  }
});

router.post('/api/ai/summarize', async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId) {
      return res.status(400).json({ error: 'conversationId parameter is required' });
    }

    const msgs = aiMessagesDb.get(conversationId) || [];
    if (msgs.length < 4) {
      return res.json({ success: true, message: 'Conversation too short for summarization' });
    }

    const fullTranscript = msgs.map((m) => `${m.sender.toUpperCase()}: ${m.text}`).join('\n\n');

    const ai = getGeminiClient();
    let summaryText = 'Discussion covered UPSC core syllabus topics, key articles, and exam strategy.';

    if (ai) {
      const prompt = `Summarize the following study discussion in 3-4 bullet points capturing key facts, articles, mnemonics, and topics covered for memory retention:\n\n${fullTranscript.slice(0, 8000)}`;
      const resp = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: { temperature: 0.3 },
      });
      summaryText = resp.text || summaryText;
    }

    const conv = aiConversationsDb.get(conversationId);
    if (conv) {
      conv.summary = summaryText;
      conv.updatedAt = new Date().toISOString();
      aiConversationsDb.set(conversationId, conv);
    }

    res.json({ success: true, summary: summaryText });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to summarize conversation', details: err.message });
  }
});

export default router;
