// ============================================================================
// COMMUNITY, KARMA, POSTS, COMMENTS & REPUTATION ROUTES
// ============================================================================
import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { queryPostgres, pgPool } from '../src/lib/postgres.js';
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

    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '20'), 10) || 20));
    const total = posts.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedPosts = posts.slice(startIndex, startIndex + limit);
    const hasMore = page < totalPages;

    res.json({
      success: true,
      posts: paginatedPosts,
      total,
      page,
      limit,
      totalPages,
      hasMore
    });
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

    const verifiedUser = await extractVerifiedUserFromReq(req);
    if (!verifiedUser) {
      return res.status(401).json({ success: false, error: 'Authentication required to delete a comment' });
    }

    let targetComment: any = null;
    let targetPostId: string | null = null;

    for (const [postId, list] of communityCommentsStore.entries()) {
      const found = list.find((c: any) => c.id === id);
      if (found) {
        targetComment = found;
        targetPostId = postId;
        break;
      }
    }

    if (!targetComment && supabaseServer) {
      const { data } = await supabaseServer.from('community_comments').select('*').eq('id', id).maybeSingle();
      if (data) {
        targetComment = data;
        targetPostId = data.post_id || data.postId;
      }
    }

    if (!targetComment) {
      return res.status(404).json({ success: false, error: 'Comment not found' });
    }

    const isAuthor = targetComment.authorId === verifiedUser.sub || targetComment.user_id === verifiedUser.sub;
    const isAdmin = verifiedUser.role === 'ADMIN' || verifiedUser.email === DESIGNATED_ADMIN_EMAIL.toLowerCase();

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden: You can only delete your own comments' });
    }

    if (targetPostId && communityCommentsStore.has(targetPostId)) {
      const list = communityCommentsStore.get(targetPostId) || [];
      const idx = list.findIndex((c: any) => c.id === id);
      if (idx !== -1) {
        list.splice(idx, 1);
        communityCommentsStore.set(targetPostId, list);
        const post = communityPostsStore.get(targetPostId);
        if (post && post.commentCount) {
          post.commentCount = Math.max(0, post.commentCount - 1);
          communityPostsStore.set(targetPostId, post);
        }
      }
    }

    if (supabaseServer) {
      await supabaseServer.from('community_comments').delete().eq('id', id);
    }

    res.json({ success: true, data: { id, deleted: true } });
  } catch (err: any) {
    console.error('[DELETE /api/community/comments/:id] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

router.delete('/api/community/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: 'Post ID is required' });

    const verifiedUser = await extractVerifiedUserFromReq(req);
    if (!verifiedUser) {
      return res.status(401).json({ success: false, error: 'Authentication required to delete a post' });
    }

    let post = communityPostsStore.get(id);
    if (!post && supabaseServer) {
      const { data } = await supabaseServer.from('community_posts').select('*').eq('id', id).maybeSingle();
      if (data) post = data;
    }

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    const isAuthor = post.authorId === verifiedUser.sub;
    const isAdmin = verifiedUser.role === 'ADMIN' || verifiedUser.email === DESIGNATED_ADMIN_EMAIL.toLowerCase();

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden: You can only delete your own posts' });
    }

    communityPostsStore.delete(id);
    communityCommentsStore.delete(id);

    if (supabaseServer) {
      await supabaseServer.from('community_posts').delete().eq('id', id);
      await supabaseServer.from('community_comments').delete().eq('post_id', id);
    }

    res.json({ success: true, data: { id, deleted: true } });
  } catch (err: any) {
    console.error('[DELETE /api/community/posts/:id] error:', err);
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

// ============================================================================
// LIVE STUDY BATTLE GROUPS & REAL-TIME COMPETITION ENGINE
// ============================================================================

export interface StudyBattleMemberRecord {
  id: string;
  name: string;
  avatar_url?: string;
  exam?: string;
  todayStudyMinutes: number;
  currentSessionSeconds?: number;
  isLiveStudying?: boolean;
  isCamOn?: boolean;
  isAudioOn?: boolean;
  activeStatus?: string;
  lastActive?: string;
  isHost?: boolean;
}

export interface StudyBattleGroupRecord {
  id: string;
  name: string;
  description: string;
  avatar_url: string;
  banner_url?: string;
  targetExam: string;
  dailyGoalHours: number;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  videoCallAllowed: boolean;
  createdAt: string;
  members: StudyBattleMemberRecord[];
  memberCount: number;
  totalHoursStudiedToday: number;
  announcement?: string;
}

const DEFAULT_BATTLE_GROUPS: StudyBattleGroupRecord[] = [
  {
    id: 'battle_upsc_warriors',
    name: 'UPSC 12-Hour Warriors (Civil Services League)',
    description: 'Strict silent study arena for UPSC aspirants. Target: GS Mains + Optional. Camera on or live timer study mandatory. Minimum 6 hours daily goal.',
    avatar_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
    targetExam: 'UPSC_CSE',
    dailyGoalHours: 12,
    hostId: 'host_upsc_1',
    hostName: 'Rohit Sharma (IAS 2026 Focus)',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    videoCallAllowed: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    memberCount: 8,
    totalHoursStudiedToday: 38.5,
    announcement: '🔥 GS-2 Governance revision marathon scheduled from 2 PM to 6 PM. All members stay locked in!',
    members: [
      {
        id: 'host_upsc_1',
        name: 'Rohit Sharma (IAS 2026 Focus)',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        exam: 'UPSC_CSE',
        todayStudyMinutes: 495,
        isLiveStudying: true,
        isCamOn: true,
        activeStatus: '📖 Laxmikanth Polity Revision Ch 18',
        lastActive: 'Just now',
        isHost: true,
      },
      {
        id: 'u_priya_ias',
        name: 'Priya Patel (IPS Mission)',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        exam: 'UPSC_CSE',
        todayStudyMinutes: 440,
        isLiveStudying: true,
        isCamOn: false,
        activeStatus: '✍️ GS-1 Geography Answer Writing',
        lastActive: 'Just now',
        isHost: false,
      },
      {
        id: 'u_vikram_irs',
        name: 'Vikram Rajput',
        avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
        exam: 'UPSC_CSE',
        todayStudyMinutes: 380,
        isLiveStudying: true,
        isCamOn: true,
        activeStatus: '🧠 Modern Indian History Spectrum',
        lastActive: '2m ago',
        isHost: false,
      },
      {
        id: 'u_neha_ifs',
        name: 'Neha Roy',
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
        exam: 'UPSC_CSE',
        todayStudyMinutes: 320,
        isLiveStudying: false,
        isCamOn: false,
        activeStatus: '☕ Chai Break (Back in 10m)',
        lastActive: '15m ago',
        isHost: false,
      },
    ]
  },
  {
    id: 'battle_neet_top100',
    name: 'NEET 720 All-India Rankers Room',
    description: 'Intense NCERT Biology line-by-line revision + Physics HCV Numerical solving sprints. Daily leaderboard decides today\'s Top Medic!',
    avatar_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&auto=format&fit=crop&q=80',
    targetExam: 'NEET_UG',
    dailyGoalHours: 14,
    hostId: 'host_neet_1',
    hostName: 'Dr. Ananya Deshmukh',
    hostAvatar: 'https://images.unsplash.com/photo-1594824813633-82559b9a6b63?w=100&auto=format&fit=crop&q=80',
    videoCallAllowed: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    memberCount: 12,
    totalHoursStudiedToday: 45.2,
    announcement: '🎯 180 Questions Full Physics Speed Test starting at 5 PM! Join live.',
    members: [
      {
        id: 'host_neet_1',
        name: 'Dr. Ananya Deshmukh',
        avatar_url: 'https://images.unsplash.com/photo-1594824813633-82559b9a6b63?w=100&auto=format&fit=crop&q=80',
        exam: 'NEET_UG',
        todayStudyMinutes: 520,
        isLiveStudying: true,
        isCamOn: true,
        activeStatus: '🔬 Genetics & Evolution NCERT Drill',
        lastActive: 'Just now',
        isHost: true,
      },
      {
        id: 'u_tanmay_neet',
        name: 'Tanmay Saxena',
        avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
        exam: 'NEET_UG',
        todayStudyMinutes: 475,
        isLiveStudying: true,
        isCamOn: false,
        activeStatus: '✍️ Ray Optics Numerical Practice',
        lastActive: 'Just now',
        isHost: false,
      },
      {
        id: 'u_simran_neet',
        name: 'Simran Kaur',
        avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        exam: 'NEET_UG',
        todayStudyMinutes: 390,
        isLiveStudying: true,
        isCamOn: true,
        activeStatus: '🧪 Organic Reaction Mechanisms',
        lastActive: '5m ago',
        isHost: false,
      }
    ]
  },
  {
    id: 'battle_jee_advanced',
    name: 'JEE Advanced Physics & Math Crucible',
    description: 'For hardcore engineering aspirants aiming for Top 500 AIR. Solving Irodov, Pathfinder, and Advanced PYQs.',
    avatar_url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=200&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80',
    targetExam: 'JEE_ADV',
    dailyGoalHours: 10,
    hostId: 'host_jee_1',
    hostName: 'Aryan Singhal (IIT-B Aim)',
    hostAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
    videoCallAllowed: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    memberCount: 9,
    totalHoursStudiedToday: 32.0,
    announcement: '⚡ Calculus + Electromagnetism advanced problem session now live.',
    members: [
      {
        id: 'host_jee_1',
        name: 'Aryan Singhal (IIT-B Aim)',
        avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
        exam: 'JEE_ADV',
        todayStudyMinutes: 460,
        isLiveStudying: true,
        isCamOn: true,
        activeStatus: '✍️ Rotational Dynamics Tough Problems',
        lastActive: 'Just now',
        isHost: true,
      },
      {
        id: 'u_kavya_jee',
        name: 'Kavya Sen',
        avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
        exam: 'JEE_ADV',
        todayStudyMinutes: 415,
        isLiveStudying: true,
        isCamOn: false,
        activeStatus: '🧠 Integral Calculus Area Under Curve',
        lastActive: '1m ago',
        isHost: false,
      }
    ]
  },
  {
    id: 'battle_night_owls',
    name: 'Night Owls 4AM Grind Club (All Exams)',
    description: 'Midnight study warriors who thrive when the rest of the world is asleep. 10 PM to 4 AM silent deep work chamber.',
    avatar_url: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?w=200&auto=format&fit=crop&q=80',
    banner_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80',
    targetExam: 'ALL_INDIA',
    dailyGoalHours: 8,
    hostId: 'host_night_1',
    hostName: 'Midnight Monk',
    hostAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
    videoCallAllowed: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    memberCount: 15,
    totalHoursStudiedToday: 52.4,
    announcement: '🌙 Keep the midnight fire burning! Track every minute.',
    members: [
      {
        id: 'host_night_1',
        name: 'Midnight Monk',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        exam: 'ALL_INDIA',
        todayStudyMinutes: 430,
        isLiveStudying: true,
        isCamOn: true,
        activeStatus: '🎧 Deep Focus Pomodoro Block 4',
        lastActive: 'Just now',
        isHost: true,
      }
    ]
  }
];

const communityBattleGroupsStore = new Map<string, StudyBattleGroupRecord>();
DEFAULT_BATTLE_GROUPS.forEach(g => communityBattleGroupsStore.set(g.id, g));

let battleGroupsTableInitialized = false;
async function ensureBattleGroupsTable() {
  if (battleGroupsTableInitialized || !pgPool) return;
  try {
    await queryPostgres(`
      CREATE TABLE IF NOT EXISTS public.study_battle_groups (
        id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    const { rows } = await queryPostgres('SELECT id, data FROM public.study_battle_groups;');
    if (rows && rows.length > 0) {
      for (const row of rows) {
        if (row.id && row.data) {
          communityBattleGroupsStore.set(row.id, row.data);
        }
      }
    } else {
      // Seed default groups into Neon
      for (const g of DEFAULT_BATTLE_GROUPS) {
        await queryPostgres(
          'INSERT INTO public.study_battle_groups (id, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (id) DO NOTHING;',
          [g.id, JSON.stringify(g)]
        ).catch(() => {});
      }
    }
    battleGroupsTableInitialized = true;
  } catch (err) {
    console.warn('[BattleGroups] Database table init notice:', err);
  }
}

// Background trigger
ensureBattleGroupsTable().catch(() => {});

// GET /api/community/battle-groups
router.get('/api/community/battle-groups', async (req, res) => {
  try {
    await ensureBattleGroupsTable();
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const callerId = verifiedUser?.sub || (req.query.userId as string) || '';

    const list = Array.from(communityBattleGroupsStore.values()).map(g => {
      const isJoined = callerId ? g.members.some(m => m.id === callerId) : false;
      const sortedMembers = [...g.members].sort((a, b) => (b.todayStudyMinutes || 0) - (a.todayStudyMinutes || 0));
      return {
        ...g,
        isJoined,
        members: sortedMembers,
        memberCount: g.members.length,
      };
    });

    res.json({ success: true, groups: list });
  } catch (err: any) {
    console.error('[GET /api/community/battle-groups] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch battle groups' });
  }
});

// POST /api/community/battle-groups (Host creates a new study arena)
router.post('/api/community/battle-groups', async (req, res) => {
  try {
    await ensureBattleGroupsTable();
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const {
      name,
      description,
      avatar_url,
      banner_url,
      targetExam = 'UPSC_CSE',
      dailyGoalHours = 8,
      videoCallAllowed = true,
      announcement
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Group name is required' });
    }

    const hostId = verifiedUser?.sub || req.body.hostId || 'usr_' + Date.now();
    const hostName = (verifiedUser as any)?.name || req.body.hostName || 'Aspirant Host';
    const hostAvatar = (verifiedUser as any)?.avatar_url || req.body.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';

    const newGroupId = 'battle_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newGroup: StudyBattleGroupRecord = {
      id: newGroupId,
      name: name.trim(),
      description: (description || 'Daily high-intensity study battle arena. Compete live and stay disciplined.').trim(),
      avatar_url: avatar_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
      banner_url: banner_url || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80',
      targetExam,
      dailyGoalHours: Number(dailyGoalHours) || 8,
      hostId,
      hostName,
      hostAvatar,
      videoCallAllowed: Boolean(videoCallAllowed),
      createdAt: new Date().toISOString(),
      announcement: announcement || 'Welcome to the arena! Let\'s break personal study records today.',
      members: [
        {
          id: hostId,
          name: hostName,
          avatar_url: hostAvatar,
          exam: targetExam,
          todayStudyMinutes: 0,
          isLiveStudying: true,
          isCamOn: Boolean(videoCallAllowed),
          activeStatus: '🚀 Arena Created • Getting Ready',
          lastActive: 'Just now',
          isHost: true,
        }
      ],
      memberCount: 1,
      totalHoursStudiedToday: 0
    };

    communityBattleGroupsStore.set(newGroup.id, newGroup);

    if (pgPool) {
      await queryPostgres(
        'INSERT INTO public.study_battle_groups (id, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW();',
        [newGroup.id, JSON.stringify(newGroup)]
      ).catch(() => {});
    }

    res.json({ success: true, group: { ...newGroup, isJoined: true } });
  } catch (err: any) {
    console.error('[POST /api/community/battle-groups] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to create battle group' });
  }
});

// PUT /api/community/battle-groups/:id (Host edits profile, rules, or announcement)
router.put('/api/community/battle-groups/:id', async (req, res) => {
  try {
    await ensureBattleGroupsTable();
    const { id } = req.params;
    const group = communityBattleGroupsStore.get(id);
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

    const { name, description, avatar_url, banner_url, targetExam, dailyGoalHours, announcement, videoCallAllowed } = req.body;

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();
    if (avatar_url) group.avatar_url = avatar_url;
    if (banner_url) group.banner_url = banner_url;
    if (targetExam) group.targetExam = targetExam;
    if (dailyGoalHours) group.dailyGoalHours = Number(dailyGoalHours);
    if (announcement !== undefined) group.announcement = announcement.trim();
    if (videoCallAllowed !== undefined) group.videoCallAllowed = Boolean(videoCallAllowed);

    communityBattleGroupsStore.set(id, group);

    if (pgPool) {
      await queryPostgres(
        'UPDATE public.study_battle_groups SET data = $1, updated_at = NOW() WHERE id = $2;',
        [JSON.stringify(group), id]
      ).catch(() => {});
    }

    res.json({ success: true, group });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to update group' });
  }
});

// POST /api/community/battle-groups/:id/join
router.post('/api/community/battle-groups/:id/join', async (req, res) => {
  try {
    await ensureBattleGroupsTable();
    const { id } = req.params;
    const group = communityBattleGroupsStore.get(id);
    if (!group) return res.status(404).json({ success: false, error: 'Battle group not found' });

    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = verifiedUser?.sub || req.body.userId || 'usr_guest_101';
    const userName = (verifiedUser as any)?.name || req.body.userName || 'Aspirant';
    const userAvatar = (verifiedUser as any)?.avatar_url || req.body.userAvatar || '';
    const userExam = req.body.userExam || group.targetExam;

    const existingIdx = group.members.findIndex(m => m.id === userId);
    let isJoined = false;

    if (existingIdx >= 0) {
      // Don't allow host to leave their own group
      if (group.hostId === userId) {
        isJoined = true;
      } else {
        group.members.splice(existingIdx, 1);
        isJoined = false;
      }
    } else {
      group.members.push({
        id: userId,
        name: userName,
        avatar_url: userAvatar,
        exam: userExam,
        todayStudyMinutes: 0,
        isLiveStudying: true,
        isCamOn: false,
        activeStatus: '🔥 Just Joined Room',
        lastActive: 'Just now',
        isHost: group.hostId === userId,
      });
      isJoined = true;
    }

    group.memberCount = group.members.length;
    communityBattleGroupsStore.set(id, group);

    if (pgPool) {
      await queryPostgres(
        'UPDATE public.study_battle_groups SET data = $1, updated_at = NOW() WHERE id = $2;',
        [JSON.stringify(group), id]
      ).catch(() => {});
    }

    res.json({ success: true, isJoined, group });
  } catch (err: any) {
    console.error('[POST /api/community/battle-groups/:id/join] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to toggle group join' });
  }
});

// POST /api/community/battle-groups/:id/log-study (Logs live study session minutes)
router.post('/api/community/battle-groups/:id/log-study', async (req, res) => {
  try {
    await ensureBattleGroupsTable();
    const { id } = req.params;
    const group = communityBattleGroupsStore.get(id);
    if (!group) return res.status(404).json({ success: false, error: 'Battle group not found' });

    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = verifiedUser?.sub || req.body.userId || 'usr_guest_101';
    const userName = (verifiedUser as any)?.name || req.body.userName || 'Aspirant';
    const userAvatar = (verifiedUser as any)?.avatar_url || req.body.userAvatar || '';
    const minutes = Math.max(1, Number(req.body.minutes) || 1);

    let member = group.members.find(m => m.id === userId);
    if (!member) {
      member = {
        id: userId,
        name: userName,
        avatar_url: userAvatar,
        exam: group.targetExam,
        todayStudyMinutes: 0,
        isLiveStudying: true,
        isCamOn: false,
        activeStatus: '📖 Deep Focus Study',
        lastActive: 'Just now',
        isHost: group.hostId === userId,
      };
      group.members.push(member);
    }

    member.todayStudyMinutes = (member.todayStudyMinutes || 0) + minutes;
    member.lastActive = 'Just now';
    if (req.body.activeStatus) member.activeStatus = req.body.activeStatus;
    if (req.body.isLiveStudying !== undefined) member.isLiveStudying = Boolean(req.body.isLiveStudying);
    if (req.body.isCamOn !== undefined) member.isCamOn = Boolean(req.body.isCamOn);

    // Recalculate group total hours
    const totalMins = group.members.reduce((acc, m) => acc + (m.todayStudyMinutes || 0), 0);
    group.totalHoursStudiedToday = Math.round((totalMins / 60) * 10) / 10;
    group.memberCount = group.members.length;

    communityBattleGroupsStore.set(id, group);

    if (pgPool) {
      await queryPostgres(
        'UPDATE public.study_battle_groups SET data = $1, updated_at = NOW() WHERE id = $2;',
        [JSON.stringify(group), id]
      ).catch(() => {});
    }

    const sortedMembers = [...group.members].sort((a, b) => (b.todayStudyMinutes || 0) - (a.todayStudyMinutes || 0));
    res.json({
      success: true,
      todayStudyMinutes: member.todayStudyMinutes,
      group: {
        ...group,
        members: sortedMembers
      }
    });
  } catch (err: any) {
    console.error('[POST /api/community/battle-groups/:id/log-study] error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to log study minutes' });
  }
});

// POST /api/community/battle-groups/:id/heartbeat (Live presence, cam on/off, activity update)
router.post('/api/community/battle-groups/:id/heartbeat', async (req, res) => {
  try {
    const { id } = req.params;
    const group = communityBattleGroupsStore.get(id);
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = verifiedUser?.sub || req.body.userId || 'usr_guest_101';
    const userName = (verifiedUser as any)?.name || req.body.userName || 'Aspirant';
    const userAvatar = (verifiedUser as any)?.avatar_url || req.body.userAvatar || '';

    let member = group.members.find(m => m.id === userId);
    if (!member) {
      member = {
        id: userId,
        name: userName,
        avatar_url: userAvatar,
        exam: group.targetExam,
        todayStudyMinutes: 0,
        isLiveStudying: true,
        isCamOn: Boolean(req.body.isCamOn),
        activeStatus: req.body.activeStatus || '📖 Focused Study',
        lastActive: 'Just now',
        isHost: group.hostId === userId,
      };
      group.members.push(member);
    } else {
      if (req.body.isLiveStudying !== undefined) member.isLiveStudying = Boolean(req.body.isLiveStudying);
      if (req.body.isCamOn !== undefined) member.isCamOn = Boolean(req.body.isCamOn);
      if (req.body.activeStatus) member.activeStatus = req.body.activeStatus;
      member.lastActive = 'Just now';
    }

    communityBattleGroupsStore.set(id, group);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
