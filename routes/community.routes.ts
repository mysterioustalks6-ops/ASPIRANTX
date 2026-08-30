// ============================================================================
// COMMUNITY, KARMA, POSTS, COMMENTS & REPUTATION ROUTES
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

router.get('/api/community/groups', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const callerUserId = verifiedUser?.sub || (req.query.userId as string) || 'usr_guest_101';

    const groups = Array.from(communityGroupsStore.values()).map((g) => {
      const isJoined = communityGroupMembershipsStore.get(`${callerUserId}:${g.id}`) || false;
      return {
        ...g,
        isJoined,
      };
    });
    res.json({ success: true, groups });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

router.post('/api/community/groups', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    if (!verifiedUser) {
      return res.status(401).json({ error: 'Authentication required to create a group' });
    }
    const creatorId = verifiedUser.sub;
    const { name, description, exam = 'UPSC_CSE', category = 'public', icon = 'Users' } = req.body;
    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }
    const newGroup = {
      id: 'grp_' + Date.now(),
      name,
      description,
      category,
      exam,
      memberCount: 1,
      icon,
    };
    communityGroupsStore.set(newGroup.id, newGroup);
    communityGroupMembershipsStore.set(`${creatorId}:${newGroup.id}`, true);

    if (supabaseServer) {
      try {
        const { error } = await supabaseServer.from('community_groups').upsert([{ id: newGroup.id, data: newGroup, updated_at: new Date().toISOString() }], { onConflict: 'id' });
        if (error) console.error('[SUPABASE GROUP UPSERT FAILURE]', error.message);
      } catch (e: any) {
        console.error('[SUPABASE GROUP UPSERT EXCEPTION]', e?.message || e);
      }
    }
    res.json({ success: true, group: { ...newGroup, isJoined: true } });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

router.post('/api/community/groups/:id/join', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    if (!verifiedUser) {
      return res.status(401).json({ error: 'Authentication required to join or leave groups' });
    }
    const userId = verifiedUser.sub;
    const groupId = req.params.id;
    const group = communityGroupsStore.get(groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const key = `${userId}:${groupId}`;
    const isCurrentlyJoined = communityGroupMembershipsStore.get(key) || false;
    const isJoined = !isCurrentlyJoined;

    if (isJoined) {
      communityGroupMembershipsStore.set(key, true);
      group.memberCount = (group.memberCount || 0) + 1;
    } else {
      communityGroupMembershipsStore.delete(key);
      group.memberCount = Math.max(0, (group.memberCount || 1) - 1);
    }
    communityGroupsStore.set(group.id, group);

    if (supabaseServer) {
      try {
        await supabaseServer.from('community_groups').upsert([{ id: group.id, data: group, updated_at: new Date().toISOString() }], { onConflict: 'id' });
      } catch (e: any) {
        console.error('[SUPABASE GROUP JOIN EXCEPTION]', e?.message || e);
      }
    }

    res.json({ success: true, isJoined, memberCount: group.memberCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to toggle group membership' });
  }
});

router.get('/api/community/posts', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const callerUserId = verifiedUser?.sub || (req.query.userId as string) || 'usr_guest_101';

    const groupId = req.query.groupId as string;
    const search = (req.query.search as string || '').toLowerCase().trim();
    const tag = (req.query.tag as string || '').toLowerCase().trim();
    const filter = (req.query.filter as string || 'all').toLowerCase().trim();
    const sort = (req.query.sort as string || 'recent').toLowerCase().trim();

    if (communityPostsStore.size <= 2 && supabaseServer) {
      await hydrateCommunityPostsFromSupabase().catch(() => {});
    }

    let posts = Array.from(communityPostsStore.values());

    if (groupId) {
      posts = posts.filter((p) => p.groupId === groupId);
    }

    if (tag) {
      posts = posts.filter((p) =>
        Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase().includes(tag))
      );
    }

    if (search) {
      posts = posts.filter((p) =>
        p.title.toLowerCase().includes(search) ||
        p.content.toLowerCase().includes(search) ||
        (Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase().includes(search))) ||
        (p.authorName && p.authorName.toLowerCase().includes(search))
      );
    }

    // Attach caller-specific vote status, score, bookmark status, and poll vote status
    posts = posts.map((p) => {
      const kVoteKey = `${callerUserId}:post:${p.id}`;
      const kVote = karmaVotesStore.get(kVoteKey);
      const userVote = kVote ? (kVote.vote === 1 ? 'up' : 'down') : null;

      const upvotes = p.upvotesCount ?? p.likesCount ?? 0;
      const downvotes = p.downvotesCount ?? 0;
      const score = p.score ?? (upvotes - downvotes);
      const isBookmarked = communityBookmarksStore.get(`${callerUserId}:${p.id}`) || false;

      const userVotedOptionId = p.poll ? communityPollVotesStore.get(`${callerUserId}:${p.id}`) : undefined;
      const poll = p.poll ? { ...p.poll, userVotedOptionId } : undefined;

      return {
        ...p,
        score,
        upvotesCount: upvotes,
        downvotesCount: downvotes,
        userVote,
        isLiked: userVote === 'up',
        likesCount: upvotes,
        isBookmarked,
        poll,
      };
    });

    if (filter === 'bookmarked') {
      posts = posts.filter((p) => p.isBookmarked);
    } else if (filter === 'my_posts') {
      posts = posts.filter((p) => p.authorId === callerUserId || (callerUserId === 'usr_guest_101' && p.authorId === 'usr_curr'));
    }

    if (sort === 'popular') {
      posts.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sort === 'discussed') {
      posts.sort((a, b) => (b.repliesCount || 0) - (a.repliesCount || 0));
    } else {
      posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    res.json({ success: true, posts });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch community posts' });
  }
});

router.post('/api/community/posts', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    if (!verifiedUser) {
      return res.status(401).json({ error: 'Authentication required to create a post' });
    }
    const authorId = verifiedUser.sub;

    const { groupId, title, content, tags, authorName = 'Aspirant', authorAvatar, attachments, poll } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const group = communityGroupsStore.get(groupId) || Array.from(communityGroupsStore.values())[0];
    if (!group) {
      return res.status(404).json({ error: 'Community group not found' });
    }

    const formattedPoll = poll && poll.question && Array.isArray(poll.options) && poll.options.length > 0 ? {
      question: poll.question,
      options: poll.options.map((optText: string, i: number) => ({
        id: `opt_${Date.now()}_${i}`,
        text: optText,
        votes: 0,
      })),
      totalVotes: 0,
      userVotedOptionId: undefined,
    } : undefined;

    const newPost = {
      id: 'post_' + Date.now(),
      groupId: group.id,
      groupName: group.name,
      authorId,
      authorName: authorName || (verifiedUser ? verifiedUser.email.split('@')[0] : 'Aspirant'),
      authorAvatar: authorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
      authorRole: verifiedUser?.role || 'Aspirant',
      title,
      content,
      tags: tags && tags.length > 0 ? tags : ['Discussion'],
      createdAt: new Date().toISOString(),
      score: 1,
      upvotesCount: 1,
      downvotesCount: 0,
      likesCount: 1,
      repliesCount: 0,
      isLiked: false,
      isBookmarked: false,
      isPinned: false,
      attachments,
      poll: formattedPoll,
    };

    communityPostsStore.set(newPost.id, newPost);
    if (supabaseServer) {
      try {
        const { error } = await supabaseServer.from('community_posts').upsert([{ id: newPost.id, data: newPost, updated_at: new Date().toISOString() }], { onConflict: 'id' });
        if (error) console.error('[SUPABASE POST UPSERT FAILURE]', error.message);
      } catch (e: any) {
        console.error('[SUPABASE POST UPSERT EXCEPTION]', e?.message || e);
      }
    }
    res.json({ success: true, post: newPost });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.get('/api/karma/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    if (typeof hydrateKarmaFromSupabase === 'function') {
      await hydrateKarmaFromSupabase(userId);
    }

    let karma = userKarmaStore.get(userId);
    if (!karma) {
      karma = recalculateUserKarma(userId);
    }

    const recentVotes: Array<{
      id: string;
      voterId: string;
      targetType: 'post' | 'comment';
      targetId: string;
      targetOwnerId: string;
      voteType: 'up' | 'down';
      targetTitle: string;
      timestamp: string;
    }> = [];

    karmaVotesStore.forEach((v) => {
      if (v.targetOwnerId === userId || v.voterId === userId) {
        let targetTitle = v.targetType === 'post' ? 'Discussion Post' : 'Peer Comment';
        if (v.targetType === 'post') {
          const post = communityPostsStore.get(v.targetId);
          if (post) targetTitle = post.title;
        } else if (v.targetType === 'comment') {
        for (const commentList of communityCommentsStore.values()) {
          const found = commentList.find((c: any) => c.id === v.targetId);
          if (found && found.content) {
            targetTitle = found.content.substring(0, 40) + '...';
            break;
          }
        }
      }

      recentVotes.push({
        id: v.id,
        voterId: v.voterId,
        targetType: v.targetType,
        targetId: v.targetId,
        targetOwnerId: v.targetOwnerId,
        voteType: v.vote === 1 ? 'up' : 'down',
        targetTitle,
        timestamp: v.createdAt || new Date().toISOString(),
      });
    }
  });

  recentVotes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const limitedVotes = recentVotes.slice(0, 20);

  res.json({
    success: true,
    karma: {
      ...karma,
      recentVotes: limitedVotes,
      activityFeed: limitedVotes,
    },
    recentVotes: limitedVotes,
  });
} catch (err: any) {
  console.error('[API /karma/:userId] error:', err);
  res.status(500).json({ success: false, error: err.message || 'Internal error' });
}
});

router.post('/api/community/vote', async (req, res) => {
  try {
    const { voterId, targetType, targetId, targetOwnerId, vote } = req.body;

    if (!voterId || !targetType || !targetId || vote === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required voting parameters' });
    }

    const voteVal = Number(vote) >= 0 ? 1 : -1;
    const voteKey = `${voterId}_${targetType}_${targetId}`;
    const existing = karmaVotesStore.get(voteKey);

    if (existing) {
      if (existing.vote === voteVal) {
        karmaVotesStore.delete(voteKey);
      } else {
        existing.vote = voteVal as 1 | -1;
        existing.createdAt = new Date().toISOString();
        karmaVotesStore.set(voteKey, existing);
      }
    } else {
      const newVote = {
        id: `v_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        voterId,
        targetType: targetType as 'post' | 'comment',
        targetId,
        targetOwnerId: targetOwnerId || '',
        vote: voteVal as 1 | -1,
        createdAt: new Date().toISOString(),
      };
      karmaVotesStore.set(voteKey, newVote);
    }

    let updatedKarma = null;
    if (targetOwnerId) {
      updatedKarma = recalculateUserKarma(targetOwnerId);
    }

    res.json({ success: true, data: { voteKey, vote: voteVal, karma: updatedKarma } });
  } catch (err: any) {
    console.error('[POST /api/community/vote] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

router.post('/api/community/comments', async (req, res) => {
  try {
    const { postId, content, authorName, authorAvatar, authorId } = req.body;

    if (!postId || !content) {
      return res.status(400).json({ success: false, error: 'Post ID and comment content are required' });
    }

    const commentList = communityCommentsStore.get(postId) || [];
    const newComment = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      postId,
      authorId: authorId || 'usr_guest_101',
      authorName: authorName || 'Aspirant',
      authorAvatar: authorAvatar || '',
      content: content.trim(),
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date().toISOString(),
    };

    commentList.push(newComment);
    communityCommentsStore.set(postId, commentList);

    const post = communityPostsStore.get(postId);
    if (post) {
      post.commentCount = (post.commentCount || 0) + 1;
      communityPostsStore.set(postId, post);
    }

    if (supabaseServer) {
      await supabaseServer.from('community_comments').insert(newComment);
    }

    res.json({ success: true, data: newComment });
  } catch (err: any) {
    console.error('[POST /api/community/comments] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

router.delete('/api/community/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Comment ID is required' });
    }

    let deleted = false;
    for (const [postId, list] of communityCommentsStore.entries()) {
      const idx = list.findIndex((c: any) => c.id === id);
      if (idx !== -1) {
        list.splice(idx, 1);
        communityCommentsStore.set(postId, list);
        const post = communityPostsStore.get(postId);
        if (post && post.commentCount) {
          post.commentCount = Math.max(0, post.commentCount - 1);
          communityPostsStore.set(postId, post);
        }
        deleted = true;
        break;
      }
    }

    if (supabaseServer) {
      await supabaseServer.from('community_comments').delete().eq('id', id);
    }

    res.json({ success: true, data: { id, deleted } });
  } catch (err: any) {
    console.error('[DELETE /api/community/comments/:id] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

router.post('/api/community/bookmark/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const post = communityPostsStore.get(postId);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    post.isBookmarked = !post.isBookmarked;
    communityPostsStore.set(postId, post);

    res.json({ success: true, data: { postId, isBookmarked: post.isBookmarked } });
  } catch (err: any) {
    console.error('[POST /api/community/bookmark/:postId] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

router.post('/api/community/tip', async (req, res) => {
  try {
    const { postId, senderId, senderName, amount } = req.body;

    if (!postId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Post ID and valid tip amount are required' });
    }

    const tipAmount = Number(amount);
    const post = communityPostsStore.get(postId);

    if (post) {
      post.tipsTotal = (post.tipsTotal || 0) + tipAmount;
      communityPostsStore.set(postId, post);
    }

    res.json({
      success: true,
      data: {
        postId,
        senderId: senderId || 'usr_guest_101',
        senderName: senderName || 'Aspirant',
        amount: tipAmount,
        message: 'Tip processed successfully',
      },
    });
  } catch (err: any) {
    console.error('[POST /api/community/tip] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

export default router;
