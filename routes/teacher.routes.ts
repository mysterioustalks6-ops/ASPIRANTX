// ============================================================================
// TEACHER PORTAL, CLASSES, SPONSORSHIPS & BLOG ROUTES
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

router.get('/api/collaboration/public', (_req, res) => {
  res.json({
    success: true,
    sponsors: sponsorsDb,
    collaborators: collaboratorsDb,
    team: adminTeamStore.map(t => ({
      id: t.id,
      name: t.name,
      avatar: t.avatar,
      title: t.title,
      department: t.department,
      status: t.status,
      joinedAt: t.joinedAt
    }))
  });
});

router.post('/api/collaboration/sponsor-apply', async (req, res) => {
  try {
    const { name, organization, email, message, tier } = req.body;
    if (!name || !organization || !email) {
      return res.status(400).json({ error: 'Name, organization and email are required.' });
    }
    const inquiry = {
      id: `sp-inq-${Date.now()}`,
      name,
      organization,
      email,
      message: message || '',
      tier: tier || 'silver',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    sponsorInquiriesDb.push(inquiry);

    if (supabaseServer) {
      try {
        await supabaseServer.from('sponsor_inquiries').upsert([{
          id: inquiry.id,
          data: inquiry,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });
      } catch (e) {
        console.warn('Supabase sponsor_inquiries upsert error:', e);
      }
    }
    
    // Add to office activity feed
    const act = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      memberName: 'System Bot',
      action: 'SPONSOR',
      details: `New sponsorship lead from ${organization} (${name}) for ${tier} tier.`
    };
    officeActivityFeed.unshift(act);
    if (officeActivityFeed.length > 100) officeActivityFeed.pop();

    if (supabaseServer) {
      try {
        await supabaseServer.from('office_activity_feed').upsert([{
          id: act.id,
          data: act,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });
      } catch (e) {
        console.warn('Supabase office_activity_feed upsert error:', e);
      }
    }

    res.json({ success: true, inquiry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process inquiry' });
  }
});

router.post('/api/collaboration/join-team', async (req, res) => {
  try {
    const { name, email, role, bio, github, linkedin } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email and role are required.' });
    }
    const application = {
      id: `tm-app-${Date.now()}`,
      name,
      email,
      role,
      bio: bio || '',
      github: github || '',
      linkedin: linkedin || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    teamApplicationsDb.push(application);

    if (supabaseServer) {
      try {
        await supabaseServer.from('team_applications').upsert([{
          id: application.id,
          name: application.name,
          email: application.email,
          role: application.role,
          bio: application.bio,
          github: application.github,
          linkedin: application.linkedin,
          status: application.status,
          data: application,
          created_at: application.createdAt,
          updated_at: application.createdAt
        }], { onConflict: 'id' });
      } catch (e) {
        console.warn('Supabase team_applications upsert error:', e);
      }
    }

    // Add to office activity feed
    const act = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      memberName: 'System Bot',
      action: 'RECRUIT',
      details: `${name} applied to join the team as a ${role}.`
    };
    officeActivityFeed.unshift(act);
    if (officeActivityFeed.length > 100) officeActivityFeed.pop();

    if (supabaseServer) {
      try {
        await supabaseServer.from('office_activity_feed').upsert([{
          id: act.id,
          data: act,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });
      } catch (e) {
        console.warn('Supabase office_activity_feed upsert error:', e);
      }
    }

    res.json({ success: true, application });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

router.get('/api/collaboration/office', (_req, res) => {
  res.json({
    success: true,
    team: adminTeamStore,
    activity: officeActivityFeed,
    tasks: adminTasksStore,
    pendingUploads: pendingContentUploadsDb,
    applications: teamApplicationsDb
  });
});

router.post('/api/collaboration/update-status', async (req, res) => {
  try {
    const { email, status, currentActivity } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required to update status.' });
    }
    const member = adminTeamStore.find(t => t.email.toLowerCase() === String(email).trim().toLowerCase());
    let updatedMember;
    if (member) {
      member.status = status || 'ACTIVE';
      member.currentActivity = currentActivity || '';
      updatedMember = member;
    } else {
      // Create guest team member if not found for testing
      const newGuestMember = {
        id: `tm-guest-${Date.now()}`,
        name: email.split('@')[0],
        email: email,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        title: 'Content contributor',
        role: 'ACADEMIC_LEAD',
        department: 'Academics & Question Bank',
        status: status || 'ACTIVE',
        currentActivity: currentActivity || '',
        joinedAt: new Date().toISOString()
      };
      adminTeamStore.push(newGuestMember);
      updatedMember = newGuestMember;
    }

    const act = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      memberName: updatedMember.name,
      action: 'STATUS',
      details: `Updated status to [${status}] - ${currentActivity || 'Active'}`
    };
    officeActivityFeed.unshift(act);
    if (officeActivityFeed.length > 100) officeActivityFeed.pop();

    if (supabaseServer) {
      try {
        await supabaseServer.from('office_activity_feed').upsert([{
          id: act.id,
          data: act,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });
      } catch (e) {
        console.warn('Supabase office_activity_feed upsert error:', e);
      }
    }

    await saveAdminStoreToDisk();

    res.json({ success: true, member: updatedMember });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.post('/api/collaboration/update-task-status', async (req, res) => {
  try {
    const { taskId, newStatus } = req.body;
    if (!taskId || !newStatus) {
      return res.status(400).json({ error: 'Task ID and new status are required.' });
    }
    const task = adminTasksStore.find(t => t.id === taskId);
    if (task) {
      const oldStatus = task.status;
      task.status = newStatus;
      
      const act = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        memberName: task.assignedToName || 'Team Member',
        action: 'TASK',
        details: `Moved task "${task.title}" from ${oldStatus} to ${newStatus}`
      };
      officeActivityFeed.unshift(act);
      if (officeActivityFeed.length > 100) officeActivityFeed.pop();

      if (supabaseServer) {
        try {
          await supabaseServer.from('office_activity_feed').upsert([{
            id: act.id,
            data: act,
            updated_at: new Date().toISOString()
          }], { onConflict: 'id' });
        } catch (e) {
          console.warn('Supabase office_activity_feed upsert error:', e);
        }
      }

      await saveAdminStoreToDisk();

      res.json({ success: true, task });
    } else {
      res.status(404).json({ error: 'Task not found.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

router.post('/api/collaboration/add-activity', async (req, res) => {
  try {
    const { memberName, action, details } = req.body;
    if (!memberName || !details) {
      return res.status(400).json({ error: 'Member name and details are required.' });
    }
    const newActivity = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      memberName,
      action: action || 'GENERAL',
      details
    };
    officeActivityFeed.unshift(newActivity);
    if (officeActivityFeed.length > 100) officeActivityFeed.pop();

    if (supabaseServer) {
      try {
        await supabaseServer.from('office_activity_feed').upsert([{
          id: newActivity.id,
          data: newActivity,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });
      } catch (e) {
        console.warn('Supabase office_activity_feed upsert error:', e);
      }
    }

    res.json({ success: true, activity: newActivity });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add activity' });
  }
});

router.post('/api/collaboration/approve-content', async (req, res) => {
  try {
    const { uploadId, reviewerName } = req.body;
    if (!uploadId) {
      return res.status(400).json({ error: 'Upload ID is required.' });
    }
    const uploadIndex = pendingContentUploadsDb.findIndex(up => up.id === uploadId);
    if (uploadIndex >= 0) {
      const item = pendingContentUploadsDb[uploadIndex];
      item.status = 'APPROVED';
      pendingContentUploadsDb.splice(uploadIndex, 1);

      const act = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        memberName: reviewerName || 'Admin',
        action: 'APPROVE',
        details: `Approved "${item.title}" by ${item.uploader}. Content is now live!`
      };
      officeActivityFeed.unshift(act);
      if (officeActivityFeed.length > 100) officeActivityFeed.pop();

      if (supabaseServer) {
        try {
          await supabaseServer.from('office_activity_feed').upsert([{
            id: act.id,
            data: act,
            updated_at: new Date().toISOString()
          }], { onConflict: 'id' });
        } catch (e) {
          console.warn('Supabase office_activity_feed upsert error:', e);
        }
      }

      res.json({ success: true, approvedItem: item });
    } else {
      res.status(404).json({ error: 'Upload item not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve content' });
  }
});

router.post('/api/collaboration/reject-content', async (req, res) => {
  try {
    const { uploadId, reason, reviewerName } = req.body;
    if (!uploadId || !reason) {
      return res.status(400).json({ error: 'Upload ID and rejection reason are required.' });
    }
    const uploadIndex = pendingContentUploadsDb.findIndex(up => up.id === uploadId);
    if (uploadIndex >= 0) {
      const item = pendingContentUploadsDb[uploadIndex];
      item.status = 'REJECTED';
      item.rejectionReason = reason;
      pendingContentUploadsDb.splice(uploadIndex, 1);

      const act = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        memberName: reviewerName || 'Admin',
        action: 'REJECT',
        details: `Rejected "${item.title}" by ${item.uploader}. Reason: ${reason}`
      };
      officeActivityFeed.unshift(act);
      if (officeActivityFeed.length > 100) officeActivityFeed.pop();

      if (supabaseServer) {
        try {
          await supabaseServer.from('office_activity_feed').upsert([{
            id: act.id,
            data: act,
            updated_at: new Date().toISOString()
          }], { onConflict: 'id' });
        } catch (e) {
          console.warn('Supabase office_activity_feed upsert error:', e);
        }
      }

      res.json({ success: true, rejectedItem: item });
    } else {
      res.status(404).json({ error: 'Upload item not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject content' });
  }
});

router.post('/api/teachers/register', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const { name, subject, bio, experience, qualification, avatar, email, availability, sessionPrice } = req.body;
    
    if (!name || !subject) {
      return res.status(400).json({ error: 'Name and subject are required fields' });
    }

    const cleanEmail = (email || verifiedUser?.email || '').trim().toLowerCase();
    const id = `ed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    const newEd: EducatorRecord = {
      id,
      name,
      subject,
      experience: experience || '1+ Years',
      qualification: qualification || 'Educator',
      avatar: avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      isVerified: false,
      status: 'APPROVED',
      email: cleanEmail,
      bio: bio || '',
      availability: Array.isArray(availability) && availability.length > 0 ? availability : ['Today, 6:00 PM', 'Tomorrow, 10:00 AM', 'Tomorrow, 4:00 PM'],
      rating: 0,
      studentsCount: 0,
      reviewsCount: 0,
      sessionPrice: typeof sessionPrice === 'number' ? sessionPrice : (sessionPrice ? Number(sessionPrice) : 0),
      isOnline: false,
      createdAt: new Date().toISOString()
    };

    educatorsStore.set(id, newEd);

    if (supabaseServer) {
      try {
        await supabaseServer.from('educators').upsert([{
          id,
          data: newEd,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });
      } catch (err) {
        console.warn('Supabase register educator warning:', err);
      }
    }

    res.json({ success: true, educator: newEd, message: 'Aapka registration successfully submit ho gaya hai!' });
  } catch (err: any) {
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

router.get('/api/teachers', async (_req, res) => {
  try {
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from('educators').select('id, name, title, bio, avatar, rating, hourly_rate, subjects, data');
        if (data && data.length > 0) {
          for (const item of data) {
            const ed = item.data ? { ...item.data, id: item.id } : item;
            if (ed.id) educatorsStore.set(ed.id, ed);
          }
        }
      } catch (err) {
        console.warn('Supabase fetch educators warning:', err);
      }
    }

    if (educatorsStore.size === 0) {
      DEFAULT_EDUCATORS_LIST.forEach(ed => educatorsStore.set(ed.id, ed));
    }

    const list = Array.from(educatorsStore.values());
    res.json({ success: true, educators: list });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch educators: ' + err.message });
  }
});

router.patch('/api/teachers/:id/status', adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const educatorId = req.params.id;
    const { isOnline, status, rating, studentsCount, sessionPrice } = req.body;
    let ed = educatorsStore.get(educatorId);

    if (!ed) {
      // Check DEFAULT_EDUCATORS_LIST
      ed = DEFAULT_EDUCATORS_LIST.find(e => e.id === educatorId);
    }

    if (!ed) {
      return res.status(404).json({ error: 'Educator not found' });
    }

    if (typeof isOnline === 'boolean') ed.isOnline = isOnline;
    if (status) ed.status = status;
    if (typeof rating === 'number') ed.rating = rating;
    if (typeof studentsCount === 'number') ed.studentsCount = studentsCount;
    if (typeof sessionPrice === 'number') ed.sessionPrice = sessionPrice;

    educatorsStore.set(educatorId, ed);

    if (supabaseServer) {
      try {
        await supabaseServer.from('educators').upsert([{
          id: educatorId,
          data: ed,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });
      } catch (err) {
        console.warn('Supabase update educator status warning:', err);
      }
    }

    res.json({ success: true, educator: ed, message: `Status updated for ${ed.name}` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update educator status: ' + err.message });
  }
});

router.post('/api/teachers/:id/book', async (req, res) => {
  try {
    const educatorId = req.params.id;
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const { slot, date, time, studentEmail, studentName, notes, utrNumber } = req.body;

    const selectedSlot = slot || (date && time ? `${date} ${time}` : '');

    if (!selectedSlot) {
      return res.status(400).json({ error: 'Available session slot selection is required' });
    }

    const educator = educatorsStore.get(educatorId) || DEFAULT_EDUCATORS_LIST.find(e => e.id === educatorId);
    const price = educator?.sessionPrice ?? 0;

    const cleanEmail = (studentEmail || verifiedUser?.email || 'student@aspirantx.in').trim().toLowerCase();
    const bookingId = `bk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // If price > 0, set status to PENDING_PAYMENT unless verified; if price is 0, set to CONFIRMED
    const initialStatus = price > 0 ? 'PENDING_PAYMENT' : 'CONFIRMED';

    const newBooking: EducatorBookingRecord = {
      id: bookingId,
      educatorId,
      date: date || selectedSlot.split(' ')[0] || 'Scheduled',
      time: time || selectedSlot,
      selectedSlot,
      studentEmail: cleanEmail,
      studentName: studentName || (verifiedUser?.email ? verifiedUser.email.split('@')[0] : 'Aspirant Student'),
      notes: notes || '',
      status: initialStatus,
      price,
      utrNumber: utrNumber || '',
      createdAt: new Date().toISOString()
    };

    educatorBookingsStore.set(bookingId, newBooking);

    if (supabaseServer) {
      try {
        await supabaseServer.from('educator_bookings').upsert([{
          id: bookingId,
          data: newBooking,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });
      } catch (err) {
        console.warn('Supabase book session warning:', err);
      }
    }

    res.json({ 
      success: true, 
      booking: newBooking, 
      message: initialStatus === 'CONFIRMED'
        ? `1-to-1 Live session confirmed for ${selectedSlot}.`
        : `Booking submitted for ${selectedSlot}! Status: Pending Payment Verification.`
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Booking failed: ' + err.message });
  }
});

router.get('/api/teachers/bookings/all', verifyAdminAuth, async (_req, res) => {
  try {
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from('educator_bookings').select('id, educator_id, user_email, date, slot, status, created_at, data');
        if (data && data.length > 0) {
          for (const item of data) {
            const bk = item.data ? { ...item.data, id: item.id } : item;
            if (bk.id) educatorBookingsStore.set(bk.id, bk);
          }
        }
      } catch (err) {
        console.warn('Supabase fetch all bookings warning:', err);
      }
    }

    const bookings = Array.from(educatorBookingsStore.values());
    res.json({ success: true, bookings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch all bookings: ' + err.message });
  }
});

router.get('/api/teachers/:id/bookings', async (req, res) => {
  try {
    const educatorId = req.params.id;
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from('educator_bookings').select('id, educator_id, user_email, date, slot, status, created_at, data');
        if (data && data.length > 0) {
          for (const item of data) {
            const bk = item.data ? { ...item.data, id: item.id } : item;
            if (bk.id) educatorBookingsStore.set(bk.id, bk);
          }
        }
      } catch (err) {
        console.warn('Supabase fetch educator bookings warning:', err);
      }
    }

    const bookings = Array.from(educatorBookingsStore.values()).filter(b => b.educatorId === educatorId);
    res.json({ success: true, bookings });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch bookings: ' + err.message });
  }
});

router.post('/api/teachers/bookings/:bookingId/cancel', async (req, res) => {
  try {
    const { bookingId } = req.params;
    let bk = educatorBookingsStore.get(bookingId);

    if (!bk && supabaseServer) {
      try {
        const { data } = await supabaseServer.from('educator_bookings').select('id, educator_id, user_email, date, slot, status, created_at, data').eq('id', bookingId).single();
        if (data) {
          bk = data.data ? { ...data.data, id: data.id } : data;
          if (bk) educatorBookingsStore.set(bookingId, bk);
        }
      } catch (_err) {}
    }

    if (!bk) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    bk.status = 'CANCELLED';
    educatorBookingsStore.set(bookingId, bk);

    if (supabaseServer) {
      try {
        await supabaseServer.from('educator_bookings').upsert([{
          id: bookingId,
          data: bk,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });
      } catch (err) {
        console.warn('Supabase cancel booking warning:', err);
      }
    }

    res.json({ success: true, booking: bk, message: 'Booking has been successfully cancelled.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to cancel booking: ' + err.message });
  }
});

router.get('/api/teachers/chat/:educatorId', async (req, res) => {
  try {
    const educatorId = req.params.educatorId;
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from('educator_chats').select('*').eq('educator_id', educatorId);
        if (data && data.length > 0) {
          const msgs = data.map((item: any) => item.data || item).sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          educatorChatsStore.set(educatorId, msgs);
        }
      } catch (err) {
        console.warn('Supabase fetch educator chat warning:', err);
      }
    }

    const messages = educatorChatsStore.get(educatorId) || [];
    res.json({ success: true, messages });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

router.post('/api/teachers/chat/:educatorId', async (req, res) => {
  try {
    const educatorId = req.params.educatorId;
    const { sender, msg } = req.body;
    
    if (!msg || !msg.trim()) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const chatMsg: EducatorChatMessage = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      educatorId,
      sender: sender || 'Aspirant',
      msg: msg.trim(),
      timestamp: new Date().toISOString()
    };

    const currentMsgs = educatorChatsStore.get(educatorId) || [];
    currentMsgs.push(chatMsg);
    educatorChatsStore.set(educatorId, currentMsgs);

    if (supabaseServer) {
      try {
        await supabaseServer.from('educator_chats').upsert([{
          id: chatMsg.id,
          educator_id: educatorId,
          data: chatMsg,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });
      } catch (err) {
        console.warn('Supabase save educator chat message warning:', err);
      }
    }

    res.json({ success: true, chatMessage: chatMsg });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to post message' });
  }
});

router.get('/api/teacher/profile', async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = (req.query.userId as string) || verifiedUser?.sub;
    const email = (req.query.email as string) || verifiedUser?.email;

    if (!userId && !email) {
      return res.status(400).json({ error: 'userId or email is required' });
    }

    if (supabaseServer) {
      try {
        let q = supabaseServer.from('teacher_profiles').select('*');
        if (userId) q = q.eq('user_id', userId);
        else if (email) q = q.eq('email', email);
        const { data } = await q.single();
        if (data) {
          teacherProfilesStore.set(data.user_id || userId, data);
          return res.json({ success: true, profile: data });
        }
      } catch (_err) {}
    }

    const cached = teacherProfilesStore.get(userId) || Array.from(teacherProfilesStore.values()).find(p => p.email === email);
    res.json({ success: true, profile: cached || null });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch teacher profile' });
  }
});

router.post('/api/teacher/profile', verifyTeacherOrAdmin, async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const userId = verifiedUser?.sub || req.body.userId || `teacher_${Date.now()}`;
    const email = verifiedUser?.email || req.body.email || '';
    const { name, subjects, bio, qualification, experienceYears, photoUrl } = req.body;

    const profileData = {
      id: req.body.id || `tp_${Date.now()}`,
      userId,
      name: name || verifiedUser?.email?.split('@')[0] || 'Teacher',
      email,
      subjects: Array.isArray(subjects) ? subjects : [subjects || 'General Studies'],
      bio: bio || '',
      qualification: qualification || 'Educator',
      experienceYears: Number(experienceYears) || 1,
      photoUrl: photoUrl || '',
      updatedAt: new Date().toISOString()
    };

    teacherProfilesStore.set(userId, profileData);

    if (supabaseServer) {
      try {
        await supabaseServer.from('teacher_profiles').upsert([{
          id: profileData.id,
          user_id: userId,
          name: profileData.name,
          email,
          subjects: profileData.subjects,
          bio: profileData.bio,
          qualification: profileData.qualification,
          experience_years: profileData.experienceYears,
          photo_url: profileData.photoUrl,
          updated_at: new Date().toISOString()
        }], { onConflict: 'user_id' });
      } catch (err) {
        console.warn('Supabase save teacher profile warning:', err);
      }
    }

    res.json({ success: true, profile: profileData });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to save teacher profile' });
  }
});

router.get('/api/teacher/classes', async (req, res) => {
  try {
    const teacherId = req.query.teacherId as string;
    const status = req.query.status as string;

    if (supabaseServer) {
      try {
        let q = supabaseServer.from('teacher_classes').select('*').order('scheduled_at', { ascending: true });
        if (teacherId) q = q.eq('teacher_id', teacherId);
        if (status) q = q.in('status', status.split(','));
        const { data } = await q;
        if (data) {
          for (const c of data) {
            const mapped = {
              id: c.id,
              teacherId: c.teacher_id,
              teacherName: c.teacher_name,
              title: c.title,
              subject: c.subject,
              description: c.description,
              scheduledAt: c.scheduled_at,
              durationMins: c.duration_mins,
              maxStudents: c.max_students,
              meetingLink: c.meeting_link,
              status: c.status,
              recordingUrl: c.recording_url,
              createdAt: c.created_at
            };
            teacherClassesStore.set(c.id, mapped);
          }
        }
      } catch (_err) {}
    }

    let classes = Array.from(teacherClassesStore.values());
    if (teacherId) classes = classes.filter(c => c.teacherId === teacherId);
    if (status) {
      const allowed = status.split(',');
      classes = classes.filter(c => allowed.includes(c.status));
    }

    const enriched = classes.map(c => {
      const enrollments = classEnrollmentsStore.get(c.id) || [];
      return { ...c, enrolledCount: enrollments.length };
    });

    res.json({ success: true, classes: enriched });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch teacher classes' });
  }
});

router.post('/api/teacher/classes', verifyTeacherOrAdmin, async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const teacherId = verifiedUser?.sub || req.body.teacherId || 'teacher_dev';
    const teacherName = req.body.teacherName || verifiedUser?.email?.split('@')[0] || 'Faculty Member';
    const { title, subject, description, scheduledAt, durationMins, maxStudents, meetingLink } = req.body;

    if (!title || !subject) {
      return res.status(400).json({ error: 'Title and subject are required.' });
    }

    const newClass = {
      id: `cls_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      teacherId,
      teacherName,
      title,
      subject,
      description: description || '',
      scheduledAt: scheduledAt || new Date(Date.now() + 3600000).toISOString(),
      durationMins: Number(durationMins) || 60,
      maxStudents: Number(maxStudents) || 100,
      meetingLink: meetingLink || `https://meet.jit.si/aspirantx-class-${Date.now()}`,
      status: 'SCHEDULED',
      recordingUrl: '',
      createdAt: new Date().toISOString()
    };

    teacherClassesStore.set(newClass.id, newClass);

    if (supabaseServer) {
      try {
        await supabaseServer.from('teacher_classes').upsert([{
          id: newClass.id,
          teacher_id: teacherId,
          teacher_name: teacherName,
          title: newClass.title,
          subject: newClass.subject,
          description: newClass.description,
          scheduled_at: newClass.scheduledAt,
          duration_mins: newClass.durationMins,
          max_students: newClass.maxStudents,
          meeting_link: newClass.meetingLink,
          status: newClass.status,
          recording_url: newClass.recordingUrl,
          created_at: newClass.createdAt
        }], { onConflict: 'id' });
      } catch (err) {
        console.warn('Supabase save class warning:', err);
      }
    }

    res.json({ success: true, class: newClass });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to schedule class' });
  }
});

router.patch('/api/teacher/classes/:id', verifyTeacherOrAdmin, async (req, res) => {
  try {
    const classId = req.params.id;
    const { status, recordingUrl } = req.body;

    const existing = teacherClassesStore.get(classId) || {};
    const updated = {
      ...existing,
      id: classId,
      ...(status ? { status } : {}),
      ...(recordingUrl !== undefined ? { recordingUrl } : {})
    };

    teacherClassesStore.set(classId, updated);

    if (supabaseServer) {
      try {
        const payload: any = {};
        if (status) payload.status = status;
        if (recordingUrl !== undefined) payload.recording_url = recordingUrl;
        await supabaseServer.from('teacher_classes').update(payload).eq('id', classId);
      } catch (err) {
        console.warn('Supabase update class status warning:', err);
      }
    }

    res.json({ success: true, class: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update class' });
  }
});

router.post('/api/teacher/classes/:id/enroll', async (req, res) => {
  try {
    const classId = req.params.id;
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const studentId = verifiedUser ? verifiedUser.sub : `guest_${Date.now()}`;
    const studentEmail = verifiedUser ? verifiedUser.email : (req.body.studentEmail || 'guest@example.com');
    const studentName = req.body.studentName || (verifiedUser ? verifiedUser.email.split('@')[0] : 'Guest Aspirant');

    const enrollment = {
      id: `enr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      classId,
      studentId,
      studentName,
      studentEmail,
      enrolledAt: new Date().toISOString()
    };

    const current = classEnrollmentsStore.get(classId) || [];
    if (!current.some(e => e.studentId === studentId || e.studentEmail === studentEmail)) {
      current.push(enrollment);
      classEnrollmentsStore.set(classId, current);
    }

    if (supabaseServer) {
      try {
        await supabaseServer.from('class_enrollments').upsert([{
          id: enrollment.id,
          class_id: classId,
          student_id: studentId,
          student_name: studentName,
          student_email: studentEmail,
          enrolled_at: enrollment.enrolledAt
        }], { onConflict: 'id' });
      } catch (_e) {}
    }

    res.json({ success: true, enrollment });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to enroll in class' });
  }
});

router.post('/api/teacher/classes/:id/join', async (req, res) => {
  try {
    const classId = req.params.id;
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const studentId = verifiedUser ? verifiedUser.sub : `guest_${Date.now()}`;
    const studentEmail = verifiedUser ? verifiedUser.email : (req.body.studentEmail || 'guest@example.com');
    const studentName = req.body.studentName || (verifiedUser ? verifiedUser.email.split('@')[0] : 'Guest Aspirant');

    const attendanceRecord = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      classId,
      studentId,
      studentName,
      studentEmail,
      joinedAt: new Date().toISOString(),
      durationMins: 0
    };

    const currentAtt = classAttendanceStore.get(classId) || [];
    currentAtt.push(attendanceRecord);
    classAttendanceStore.set(classId, currentAtt);

    if (supabaseServer) {
      try {
        await supabaseServer.from('class_attendance').upsert([{
          id: attendanceRecord.id,
          class_id: classId,
          student_id: studentId,
          student_name: studentName,
          student_email: studentEmail,
          joined_at: attendanceRecord.joinedAt
        }], { onConflict: 'id' });
      } catch (_e) {}
    }

    const classInfo = teacherClassesStore.get(classId);
    res.json({
      success: true,
      meetingLink: classInfo?.meetingLink || `https://meet.jit.si/aspirantx-class-${classId}`,
      attendance: attendanceRecord
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record class attendance' });
  }
});

router.get('/api/teacher/classes/:id/students', verifyTeacherOrAdmin, async (req, res) => {
  try {
    const classId = req.params.id;
    let enrollments = classEnrollmentsStore.get(classId) || [];
    let attendance = classAttendanceStore.get(classId) || [];

    if (supabaseServer) {
      try {
        const [enrRes, attRes] = await Promise.all([
          supabaseServer.from('class_enrollments').select('*').eq('class_id', classId),
          supabaseServer.from('class_attendance').select('*').eq('class_id', classId)
        ]);
        if (enrRes.data) enrollments = enrRes.data.map((e: any) => ({ id: e.id, classId: e.class_id, studentId: e.student_id, studentName: e.student_name, studentEmail: e.student_email, enrolledAt: e.enrolled_at }));
        if (attRes.data) attendance = attRes.data.map((a: any) => ({ id: a.id, classId: a.class_id, studentId: a.student_id, studentName: a.student_name, studentEmail: a.student_email, joinedAt: a.joined_at }));
      } catch (_e) {}
    }

    res.json({ success: true, enrollments, attendance });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch class students' });
  }
});

router.get('/api/teacher/my-students', verifyTeacherOrAdmin, async (req, res) => {
  try {
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const teacherId = verifiedUser?.sub || (req.query.teacherId as string);

    let classes = Array.from(teacherClassesStore.values());
    if (teacherId) classes = classes.filter(c => c.teacherId === teacherId);
    const classIds = classes.map(c => c.id);

    const studentMap = new Map<string, any>();

    for (const cid of classIds) {
      const enrollments = classEnrollmentsStore.get(cid) || [];
      const attendance = classAttendanceStore.get(cid) || [];

      for (const enr of enrollments) {
        const sid = enr.studentId || enr.studentEmail;
        if (!studentMap.has(sid)) {
          studentMap.set(sid, {
            studentId: enr.studentId,
            studentName: enr.studentName,
            studentEmail: enr.studentEmail,
            classesAttendedCount: 0,
            assignmentsSubmittedCount: 0
          });
        }
      }

      for (const att of attendance) {
        const sid = att.studentId || att.studentEmail;
        const entry = studentMap.get(sid) || {
          studentId: att.studentId,
          studentName: att.studentName,
          studentEmail: att.studentEmail,
          classesAttendedCount: 0,
          assignmentsSubmittedCount: 0
        };
        entry.classesAttendedCount += 1;
        studentMap.set(sid, entry);
      }
    }

    res.json({ success: true, students: Array.from(studentMap.values()) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch teacher students' });
  }
});

router.post('/api/teacher/classes/:classId/assignments', verifyTeacherOrAdmin, async (req, res) => {
  try {
    const classId = req.params.classId;
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const teacherId = verifiedUser?.sub || req.body.teacherId || 'teacher_dev';
    const { title, description, dueDate, attachmentUrl } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Assignment title is required.' });
    }

    const assignment = {
      id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      classId,
      teacherId,
      title,
      description: description || '',
      dueDate: dueDate || new Date(Date.now() + 86400000 * 7).toISOString(),
      attachmentUrl: attachmentUrl || '',
      createdAt: new Date().toISOString()
    };

    const current = classAssignmentsStore.get(classId) || [];
    current.push(assignment);
    classAssignmentsStore.set(classId, current);

    if (supabaseServer) {
      try {
        await supabaseServer.from('class_assignments').upsert([{
          id: assignment.id,
          class_id: classId,
          teacher_id: teacherId,
          title,
          description: assignment.description,
          due_date: assignment.dueDate,
          attachment_url: assignment.attachmentUrl,
          created_at: assignment.createdAt
        }], { onConflict: 'id' });
      } catch (_e) {}
    }

    res.json({ success: true, assignment });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

router.get('/api/teacher/classes/:classId/assignments', async (req, res) => {
  try {
    const classId = req.params.classId;
    let assignments = classAssignmentsStore.get(classId) || [];

    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from('class_assignments').select('*').eq('class_id', classId);
        if (data) {
          assignments = data.map((a: any) => ({
            id: a.id,
            classId: a.class_id,
            teacherId: a.teacher_id,
            title: a.title,
            description: a.description,
            dueDate: a.due_date,
            attachmentUrl: a.attachment_url,
            createdAt: a.created_at
          }));
          classAssignmentsStore.set(classId, assignments);
        }
      } catch (_e) {}
    }

    const enriched = assignments.map(a => {
      const subs = assignmentSubmissionsStore.get(a.id) || [];
      return { ...a, submissionCount: subs.length };
    });

    res.json({ success: true, assignments: enriched });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

router.post('/api/teacher/assignments/:assignmentId/submit', async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId;
    const verifiedUser = await extractVerifiedUserFromReq(req);
    const studentId = verifiedUser ? verifiedUser.sub : `guest_${Date.now()}`;
    const studentEmail = verifiedUser ? verifiedUser.email : (req.body.studentEmail || 'guest@example.com');
    const studentName = req.body.studentName || (verifiedUser ? verifiedUser.email.split('@')[0] : 'Guest Aspirant');
    const { submissionText, attachmentUrl } = req.body;

    const submission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      assignmentId,
      studentId,
      studentName,
      studentEmail,
      submissionText: submissionText || '',
      attachmentUrl: attachmentUrl || '',
      submittedAt: new Date().toISOString()
    };

    const current = assignmentSubmissionsStore.get(assignmentId) || [];
    current.push(submission);
    assignmentSubmissionsStore.set(assignmentId, current);

    if (supabaseServer) {
      try {
        await supabaseServer.from('assignment_submissions').upsert([{
          id: submission.id,
          assignment_id: assignmentId,
          student_id: studentId,
          student_name: studentName,
          student_email: studentEmail,
          submission_text: submission.submissionText,
          attachment_url: submission.attachmentUrl,
          submitted_at: submission.submittedAt
        }], { onConflict: 'id' });
      } catch (_e) {}
    }

    res.json({ success: true, submission });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

router.get('/api/teacher/assignments/:assignmentId/submissions', verifyTeacherOrAdmin, async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId;
    let submissions = assignmentSubmissionsStore.get(assignmentId) || [];

    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from('assignment_submissions').select('*').eq('assignment_id', assignmentId);
        if (data) {
          submissions = data.map((s: any) => ({
            id: s.id,
            assignmentId: s.assignment_id,
            studentId: s.student_id,
            studentName: s.student_name,
            studentEmail: s.student_email,
            submissionText: s.submission_text,
            attachmentUrl: s.attachment_url,
            grade: s.grade,
            feedback: s.feedback,
            submittedAt: s.submitted_at,
            gradedAt: s.graded_at
          }));
          assignmentSubmissionsStore.set(assignmentId, submissions);
        }
      } catch (_e) {}
    }

    res.json({ success: true, submissions });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

router.post('/api/teacher/submissions/:submissionId/grade', verifyTeacherOrAdmin, async (req, res) => {
  try {
    const submissionId = req.params.submissionId;
    const { grade, feedback } = req.body;

    let targetSub: any = null;
    for (const [asgId, list] of assignmentSubmissionsStore.entries()) {
      const idx = list.findIndex(s => s.id === submissionId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], grade, feedback, gradedAt: new Date().toISOString() };
        targetSub = list[idx];
        assignmentSubmissionsStore.set(asgId, list);
        break;
      }
    }

    if (supabaseServer) {
      try {
        await supabaseServer.from('assignment_submissions').update({
          grade,
          feedback,
          graded_at: new Date().toISOString()
        }).eq('id', submissionId);
      } catch (_e) {}
    }

    res.json({ success: true, submission: targetSub });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

router.get('/api/sponsorship/public-stats', async (_req, res) => {
  try {
    let totalStudents = adminUsersDb.length || 12500;
    let totalQuestionsAnswered = 850000;
    let examsCovered = 14;

    if (supabaseServer) {
      try {
        const { count } = await supabaseServer.from('user_profiles').select('*', { count: 'exact', head: true });
        if (count) totalStudents = count;
      } catch (_e) {}
    }

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalQuestionsAnswered,
        examsCovered,
        activeMonthlyUsers: Math.round(totalStudents * 0.72)
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch sponsorship public stats' });
  }
});

router.get('/api/sponsorship/tiers', async (_req, res) => {
  try {
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from('sponsorship_tiers').select('*').order('sort_order', { ascending: true });
        if (data && data.length > 0) {
          sponsorshipTiersStore.clear();
          for (const t of data) {
            sponsorshipTiersStore.set(t.id, {
              id: t.id,
              name: t.name,
              priceRange: t.price_range,
              benefits: Array.isArray(t.benefits) ? t.benefits : (typeof t.benefits === 'string' ? JSON.parse(t.benefits) : []),
              sortOrder: t.sort_order,
              isActive: t.is_active,
              createdAt: t.created_at
            });
          }
        }
      } catch (_e) {}
    }

    const tiers = Array.from(sponsorshipTiersStore.values()).sort((a, b) => a.sortOrder - b.sortOrder);
    res.json({ success: true, tiers });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch sponsorship tiers' });
  }
});

router.post('/api/sponsorship/tiers', verifyAdminAuth, async (req, res) => {
  try {
    const { name, priceRange, benefits, sortOrder } = req.body;
    if (!name || !priceRange) {
      return res.status(400).json({ error: 'Name and price range are required.' });
    }

    const tier = {
      id: `tier_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      priceRange,
      benefits: Array.isArray(benefits) ? benefits : [],
      sortOrder: Number(sortOrder) || sponsorshipTiersStore.size + 1,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    sponsorshipTiersStore.set(tier.id, tier);

    if (supabaseServer) {
      try {
        await supabaseServer.from('sponsorship_tiers').upsert([{
          id: tier.id,
          name: tier.name,
          price_range: tier.priceRange,
          benefits: tier.benefits,
          sort_order: tier.sortOrder,
          is_active: tier.isActive,
          created_at: tier.createdAt
        }], { onConflict: 'id' });
      } catch (_e) {}
    }

    res.json({ success: true, tier });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create sponsorship tier' });
  }
});

router.patch('/api/sponsorship/tiers/:id', verifyAdminAuth, async (req, res) => {
  try {
    const tierId = req.params.id;
    const existing = sponsorshipTiersStore.get(tierId);
    if (!existing) {
      return res.status(404).json({ error: 'Tier not found' });
    }

    const updated = { ...existing, ...req.body };
    sponsorshipTiersStore.set(tierId, updated);

    if (supabaseServer) {
      try {
        await supabaseServer.from('sponsorship_tiers').update({
          name: updated.name,
          price_range: updated.priceRange,
          benefits: updated.benefits,
          sort_order: updated.sortOrder,
          is_active: updated.isActive
        }).eq('id', tierId);
      } catch (_e) {}
    }

    res.json({ success: true, tier: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update sponsorship tier' });
  }
});

router.delete('/api/sponsorship/tiers/:id', verifyAdminAuth, async (req, res) => {
  try {
    const tierId = req.params.id;
    sponsorshipTiersStore.delete(tierId);

    if (supabaseServer) {
      try {
        await supabaseServer.from('sponsorship_tiers').delete().eq('id', tierId);
      } catch (_e) {}
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete sponsorship tier' });
  }
});

router.get('/api/sponsorship/sponsors', async (_req, res) => {
  try {
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from('active_sponsors').select('*');
        if (data && data.length > 0) {
          activeSponsorsStore.clear();
          for (const s of data) {
            activeSponsorsStore.set(s.id, {
              id: s.id,
              name: s.name,
              logoUrl: s.logo_url,
              websiteUrl: s.website_url,
              tierName: s.tier_name,
              testimonial: s.testimonial,
              createdAt: s.created_at
            });
          }
        }
      } catch (_e) {}
    }

    res.json({ success: true, sponsors: Array.from(activeSponsorsStore.values()) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch active sponsors' });
  }
});

router.post('/api/sponsorship/sponsors', verifyAdminAuth, async (req, res) => {
  try {
    const { name, logoUrl, websiteUrl, tierName, testimonial } = req.body;
    if (!name || !logoUrl) {
      return res.status(400).json({ error: 'Sponsor name and logo URL are required.' });
    }

    const sponsor = {
      id: `sp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      logoUrl,
      websiteUrl: websiteUrl || '',
      tierName: tierName || 'Community Partner',
      testimonial: testimonial || '',
      createdAt: new Date().toISOString()
    };

    activeSponsorsStore.set(sponsor.id, sponsor);

    if (supabaseServer) {
      try {
        await supabaseServer.from('active_sponsors').upsert([{
          id: sponsor.id,
          name: sponsor.name,
          logo_url: sponsor.logoUrl,
          website_url: sponsor.websiteUrl,
          tier_name: sponsor.tierName,
          testimonial: sponsor.testimonial,
          created_at: sponsor.createdAt
        }], { onConflict: 'id' });
      } catch (_e) {}
    }

    res.json({ success: true, sponsor });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add active sponsor' });
  }
});

router.delete('/api/sponsorship/sponsors/:id', verifyAdminAuth, async (req, res) => {
  try {
    const id = req.params.id;
    activeSponsorsStore.delete(id);

    if (supabaseServer) {
      try {
        await supabaseServer.from('active_sponsors').delete().eq('id', id);
      } catch (_e) {}
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to remove active sponsor' });
  }
});

router.post('/api/sponsorship/apply', async (req, res) => {
  try {
    const { companyName, contactName, email, phone, tierInterest, message } = req.body;
    if (!companyName || !contactName || !email) {
      return res.status(400).json({ error: 'Company name, contact name, and email are required.' });
    }

    const application = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      companyName,
      contactName,
      email,
      phone: phone || '',
      tierInterest: tierInterest || 'Community Partner',
      message: message || '',
      status: 'PENDING',
      adminNote: '',
      appliedAt: new Date().toISOString()
    };

    sponsorshipApplicationsStore.set(application.id, application);

    if (supabaseServer) {
      try {
        await supabaseServer.from('sponsorship_applications').upsert([{
          id: application.id,
          company_name: companyName,
          contact_name: contactName,
          email,
          phone: application.phone,
          tier_interest: application.tierInterest,
          message: application.message,
          status: application.status,
          admin_note: '',
          applied_at: application.appliedAt
        }], { onConflict: 'id' });
      } catch (_e) {}
    }

    res.json({ success: true, application });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit sponsorship application' });
  }
});

router.get('/api/sponsorship/applications', verifyAdminAuth, async (_req, res) => {
  try {
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from('sponsorship_applications').select('*').order('applied_at', { ascending: false });
        if (data && data.length > 0) {
          sponsorshipApplicationsStore.clear();
          for (const a of data) {
            sponsorshipApplicationsStore.set(a.id, {
              id: a.id,
              companyName: a.company_name,
              contactName: a.contact_name,
              email: a.email,
              phone: a.phone,
              tierInterest: a.tier_interest,
              message: a.message,
              status: a.status,
              adminNote: a.admin_note,
              appliedAt: a.applied_at
            });
          }
        }
      } catch (_e) {}
    }

    res.json({ success: true, applications: Array.from(sponsorshipApplicationsStore.values()) });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch sponsorship applications' });
  }
});

router.post('/api/sponsorship/applications/:id/action', verifyAdminAuth, async (req, res) => {
  try {
    const appId = req.params.id;
    const { action, adminNote } = req.body;

    const app = sponsorshipApplicationsStore.get(appId);
    if (!app) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    app.status = newStatus;
    if (adminNote) app.adminNote = adminNote;

    sponsorshipApplicationsStore.set(appId, app);

    if (supabaseServer) {
      try {
        await supabaseServer.from('sponsorship_applications').update({
          status: newStatus,
          admin_note: adminNote || ''
        }).eq('id', appId);
      } catch (_e) {}
    }

    if (action === 'APPROVE') {
      const newSponsor = {
        id: `sp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: app.companyName,
        logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&auto=format&fit=crop&q=80',
        websiteUrl: '',
        tierName: app.tierInterest,
        testimonial: `Proud partner of AspirantX.`,
        createdAt: new Date().toISOString()
      };
      activeSponsorsStore.set(newSponsor.id, newSponsor);
      if (supabaseServer) {
        try {
          await supabaseServer.from('active_sponsors').upsert([{
            id: newSponsor.id,
            name: newSponsor.name,
            logo_url: newSponsor.logoUrl,
            website_url: newSponsor.websiteUrl,
            tier_name: newSponsor.tierName,
            testimonial: newSponsor.testimonial,
            created_at: newSponsor.createdAt
          }], { onConflict: 'id' });
        } catch (_e) {}
      }
    }

    res.json({ success: true, application: app });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

router.get('/api/podcasts', async (_req, res) => {
  try {
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer.from('podcasts').select('id, title, description, audio_url, duration, category, created_at, data');
        if (data && data.length > 0) {
          for (const item of data) {
            const pod = item.data ? { ...item.data, id: item.id } : item;
            if (pod.id) podcastsStore.set(pod.id, pod);
          }
        }
      } catch (err) {
        console.warn('Supabase fetch podcasts warning:', err);
      }
    }

    if (podcastsStore.size === 0) {
      DEFAULT_PODCASTS_LIST.forEach(p => podcastsStore.set(p.id, p));
    }

    const list = Array.from(podcastsStore.values());
    res.json({ success: true, podcasts: list });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch podcasts: ' + err.message });
  }
});

router.post('/api/blog/requests', adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const { teacherId, teacherEmail, teacherName, customMessage } = req.body;
    if (!teacherEmail) {
      return res.status(400).json({ error: 'Teacher email is required' });
    }

    const submissionToken = `req_tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const reqId = `breq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const blogReq: BlogContentRequestRecord = {
      id: reqId,
      teacherId: teacherId || 'ed_1',
      teacherEmail: String(teacherEmail).trim().toLowerCase(),
      teacherName: teacherName || 'Educator',
      requestedAt: new Date().toISOString(),
      status: 'sent',
      submissionToken,
      customMessage: customMessage || ''
    };

    blogRequestsStore.set(reqId, blogReq);

    if (supabaseServer) {
      try {
        await supabaseServer.from('blog_content_requests').upsert([{
          id: reqId,
          data: blogReq,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });
      } catch (err) {
        console.warn('Supabase blog_content_requests upsert warning:', err);
      }
    }

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'https';
    const submissionUrl = `${protocol}://${host}/#blog-submit/${submissionToken}`;

    const subject = 'Aaj ka current affairs/newspaper content bhejein';
    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; color: #1e293b; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0;">AspirantX Faculty Hub</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Daily Current Affairs & Editorial Content Request</p>
        </div>
        
        <p style="font-size: 15px; line-height: 1.6;">Hello <strong>${teacherName || 'Educator'}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6;">AspirantX team is requesting today's daily current affairs analysis, newspaper summary, or editorial article for our student community.</p>
        
        ${customMessage ? `<div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 16px 0; border-radius: 4px; font-size: 14px; color: #334155;"><strong>Admin Note:</strong> ${customMessage}</div>` : ''}

        <div style="text-align: center; margin: 32px 0;">
          <a href="${submissionUrl}" style="background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block;">Submit Content Now &rarr;</a>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">Or copy & paste this link in your browser:<br/><a href="${submissionUrl}" style="color: #0284c7; word-break: break-all;">${submissionUrl}</a></p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">This unique submission link is valid specifically for your teacher profile.</p>
      </div>
    `;

    const sendRes = await sendTransactionalEmail(blogReq.teacherEmail, subject, emailHtml);

    const act = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      memberName: 'Admin',
      action: 'BLOG_REQUEST',
      details: `Requested daily blog content from ${teacherName || teacherEmail}`
    };
    officeActivityFeed.unshift(act);
    if (officeActivityFeed.length > 100) officeActivityFeed.pop();

    res.json({
      success: true,
      request: blogReq,
      emailSent: sendRes.sent,
      emailError: sendRes.error,
      submissionUrl
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create blog request: ' + err.message });
  }
});

router.get('/api/blog/requests', verifyAdminAuth, async (_req, res) => {
  try {
    const list = Array.from(blogRequestsStore.values()).sort((a, b) => 
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
    );
    res.json({ success: true, requests: list });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch blog requests' });
  }
});

router.get('/api/blog/submit/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const request = Array.from(blogRequestsStore.values()).find(r => r.submissionToken === token);
    if (!request) {
      return res.status(404).json({ error: 'Invalid or expired submission link.' });
    }
    res.json({ success: true, request });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load submission form data' });
  }
});

router.post('/api/blog/submit/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { title, body, category, coverImageUrl } = req.body;

    const request = Array.from(blogRequestsStore.values()).find(r => r.submissionToken === token);
    if (!request) {
      return res.status(404).json({ error: 'Invalid or expired submission token.' });
    }

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and content body are required.' });
    }

    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPost: BlogPostRecord = {
      id: postId,
      title: String(title).trim(),
      body: String(body).trim(),
      category: category || 'Current Affairs',
      authorTeacherId: request.teacherId,
      authorName: request.teacherName || 'Faculty',
      status: 'pending',
      coverImageUrl: coverImageUrl || 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    };

    blogPostsStore.set(postId, newPost);

    request.status = 'submitted';
    request.submittedPostId = postId;
    blogRequestsStore.set(request.id, request);

    if (supabaseServer) {
      try {
        await Promise.all([
          supabaseServer.from('blog_posts').upsert([{ id: postId, data: newPost, updated_at: new Date().toISOString() }], { onConflict: 'id' }),
          supabaseServer.from('blog_content_requests').upsert([{ id: request.id, data: request, updated_at: new Date().toISOString() }], { onConflict: 'id' })
        ]);
      } catch (err) {
        console.warn('Supabase save submitted blog post warning:', err);
      }
    }

    const act = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      memberName: request.teacherName || 'Faculty',
      action: 'BLOG_SUBMIT',
      details: `Submitted post "${newPost.title}" for review.`
    };
    officeActivityFeed.unshift(act);
    if (officeActivityFeed.length > 100) officeActivityFeed.pop();

    res.json({ success: true, post: newPost, message: 'Blog post submitted successfully! Pending admin approval.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit blog post: ' + err.message });
  }
});

router.get('/api/blog/posts', async (req, res) => {
  try {
    const statusParam = req.query.status ? String(req.query.status) : 'published';
    const allPosts = Array.from(blogPostsStore.values());
    
    let filtered = allPosts;
    if (statusParam !== 'all') {
      filtered = allPosts.filter(p => p.status === statusParam);
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, posts: filtered });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

router.get('/api/blog/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const post = blogPostsStore.get(id);
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    res.json({ success: true, post });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

router.post('/api/blog/posts/:id/approve', adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const post = blogPostsStore.get(id);
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    post.status = 'published';
    post.publishedAt = new Date().toISOString();
    blogPostsStore.set(id, post);

    if (supabaseServer) {
      try {
        await supabaseServer.from('blog_posts').upsert([{
          id,
          data: post,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });
      } catch (err) {
        console.warn('Supabase approve blog post warning:', err);
      }
    }

    const act = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      memberName: 'Admin',
      action: 'BLOG_APPROVE',
      details: `Approved blog post "${post.title}". It is now published live!`
    };
    officeActivityFeed.unshift(act);
    if (officeActivityFeed.length > 100) officeActivityFeed.pop();

    res.json({ success: true, post, message: 'Blog post approved and published!' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to approve blog post' });
  }
});

router.post('/api/blog/posts/:id/reject', adminMutationLimiter, verifyAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const post = blogPostsStore.get(id);
    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    post.status = 'rejected';
    post.rejectionReason = reason || 'Content does not meet editorial standards.';
    blogPostsStore.set(id, post);

    if (supabaseServer) {
      try {
        await supabaseServer.from('blog_posts').upsert([{
          id,
          data: post,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });
      } catch (err) {
        console.warn('Supabase reject blog post warning:', err);
      }
    }

    const act = {
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      memberName: 'Admin',
      action: 'BLOG_REJECT',
      details: `Rejected blog post "${post.title}". Reason: ${post.rejectionReason}`
    };
    officeActivityFeed.unshift(act);
    if (officeActivityFeed.length > 100) officeActivityFeed.pop();

    res.json({ success: true, post, message: 'Blog post rejected.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reject blog post' });
  }
});

export default router;
