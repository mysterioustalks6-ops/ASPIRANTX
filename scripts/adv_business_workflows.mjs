import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:3000';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runBusinessWorkflowsAudit() {
  console.log('=== STARTING DEEP BUSINESS WORKFLOWS & PERSISTENCE AUDIT ===\n');
  const results = {};

  // Auth tokens
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'ambujyadav0010@gmail.com',
    password: '637881@Am'
  });
  const adminSbToken = authData.session.access_token;
  const adminRes = await fetch(`${BASE_URL}/api/auth/token`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminSbToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ambujyadav0010@gmail.com' })
  });
  const { token: adminToken } = await adminRes.json();

  const studentToken = jwt.sign(
    { sub: '00000000-0000-0000-0000-000000000003', email: 'student_tester@example.com', role: 'STUDENT' },
    process.env.JWT_SECRET || 'fallback-secret-for-protrack-jwt-production-environment-only',
    { expiresIn: '1h' }
  );

  // -------------------------------------------------------------
  // SECTION 10: DASHBOARD WEAKNESS & STREAK AGGREGATION & ISOLATION
  // -------------------------------------------------------------
  console.log('[10] Testing Dashboard Analytics Aggregation & Isolation...');
  const adminAnalyticsRes = await fetch(`${BASE_URL}/api/user/analytics/weaknesses?exam=UPSC_CSE`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminAnalytics = await adminAnalyticsRes.json();

  const studentAnalyticsRes = await fetch(`${BASE_URL}/api/user/analytics/weaknesses?exam=UPSC_CSE`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const studentAnalytics = await studentAnalyticsRes.json();

  results['10_dashboard'] = {
    adminAnalyticsStatus: adminAnalyticsRes.status,
    studentAnalyticsStatus: studentAnalyticsRes.status,
    adminDataReturned: adminAnalytics?.success === true,
    studentDataReturned: studentAnalytics?.success === true,
    dataIsolated: adminAnalytics !== studentAnalytics
  };
  console.log('Dashboard Result:', results['10_dashboard']);

  // -------------------------------------------------------------
  // SECTION 11: POMODORO SERVER SYNC
  // -------------------------------------------------------------
  console.log('\n[11] Testing Pomodoro Server Sync...');
  const pomodoroId = `session_${Date.now()}`;
  const studySessionRes = await fetch(`${BASE_URL}/api/user/study-sessions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: pomodoroId,
      duration: 25,
      subject: 'Polity',
      topic: 'Preamble',
      status: 'COMPLETED',
      completedDuration: 25,
      startTime: new Date(Date.now() - 25 * 60000).toISOString(),
      endTime: new Date().toISOString()
    })
  });
  const studySessionData = await studySessionRes.json();

  const verifyPomodoroRes = await fetch(`${BASE_URL}/api/user/study-sessions`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const verifyPomodoroData = await verifyPomodoroRes.json();
  const pomodoroFound = Array.isArray(verifyPomodoroData?.sessions) && verifyPomodoroData.sessions.some(s => s.id === pomodoroId);

  results['11_pomodoro'] = {
    status: studySessionRes.status,
    synced: studySessionRes.status === 200,
    persistedInGet: pomodoroFound
  };
  console.log('Pomodoro Result:', results['11_pomodoro']);

  // -------------------------------------------------------------
  // SECTION 12: LEADERBOARD AUTHORITATIVE RANKING & EMPTY STATE
  // -------------------------------------------------------------
  console.log('\n[12] Testing Leaderboard Scopes & Empty State...');
  const nationalLeaderboard = await fetch(`${BASE_URL}/api/academic/leaderboard?scope=national&exam=UPSC_CSE`);
  const nationalData = await nationalLeaderboard.json();

  const emptyExamLeaderboard = await fetch(`${BASE_URL}/api/academic/leaderboard?scope=national&exam=NON_EXISTENT_EXAM_XYZ`);
  const emptyExamData = await emptyExamLeaderboard.json();

  results['12_leaderboard'] = {
    nationalStatus: nationalLeaderboard.status,
    nationalHasEntries: Array.isArray(nationalData?.leaderboard),
    emptyExamStatus: emptyExamLeaderboard.status,
    emptyExamHandledCleanly: Array.isArray(emptyExamData?.leaderboard) && emptyExamData.leaderboard.length === 0
  };
  console.log('Leaderboard Result:', results['12_leaderboard']);

  // -------------------------------------------------------------
  // SECTION 13: QUESTION BANK DB RETRIEVAL
  // -------------------------------------------------------------
  console.log('\n[13] Testing Question Bank Database Retrieval...');
  const qbRes = await fetch(`${BASE_URL}/api/academic/questions?exam=UPSC_CSE&limit=10`);
  const qbData = await qbRes.json();

  results['13_question_bank'] = {
    status: qbRes.status,
    questionsReturned: Array.isArray(qbData?.questions) ? qbData.questions.length : 0,
    hasExplanations: Array.isArray(qbData?.questions) && qbData.questions.every(q => !!q.explanation || !!q.options)
  };
  console.log('Question Bank Result:', results['13_question_bank']);

  // -------------------------------------------------------------
  // SECTION 14: AI MENTOR RESILIENCE & PROVIDER FAILURE HANDLING
  // -------------------------------------------------------------
  console.log('\n[14] Testing AI Mentor SSE & Error Handling...');
  const aiChatRes = await fetch(`${BASE_URL}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Explain Article 21 of the Indian Constitution' })
  });

  results['14_ai_mentor'] = {
    status: aiChatRes.status,
    notCrashingServer: aiChatRes.status !== 502 && aiChatRes.status !== 504
  };
  console.log('AI Mentor Result:', results['14_ai_mentor']);

  // -------------------------------------------------------------
  // SECTION 15: STUDY BUDDY QUEUE
  // -------------------------------------------------------------
  console.log('\n[15] Testing Study Buddy Candidate Queue...');
  const buddyRes = await fetch(`${BASE_URL}/api/buddy/join`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ exam: 'UPSC_CSE', targetYear: 2026 })
  });
  const buddyData = await buddyRes.json();

  results['15_study_buddy'] = {
    status: buddyRes.status,
    queuedOrMatched: buddyRes.status === 200,
    data: buddyData
  };
  console.log('Study Buddy Result:', results['15_study_buddy']);

  // -------------------------------------------------------------
  // SECTION 16: PREMIUM & PAYMENT TAMPERING
  // -------------------------------------------------------------
  console.log('\n[16] Testing Premium UTR Submission & Server Validation...');
  const testUtr = 'UTR_' + Date.now();
  const utrSubmitRes = await fetch(`${BASE_URL}/api/payments/utr-submit`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      utr: testUtr,
      userEmail: 'ambujyadav0010@gmail.com',
      plan: 'annual',
      amount: 1999
    })
  });
  const utrData = await utrSubmitRes.json();

  // Test duplicate UTR rejection
  const dupUtrRes = await fetch(`${BASE_URL}/api/payments/utr-submit`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      utr: testUtr,
      userEmail: 'ambujyadav0010@gmail.com',
      plan: 'annual',
      amount: 1999
    })
  });

  results['16_premium'] = {
    status: utrSubmitRes.status,
    pendingOrRecorded: utrSubmitRes.status === 200,
    duplicateRejected: dupUtrRes.status === 409,
    duplicateStatus: dupUtrRes.status
  };
  console.log('Premium Result:', results['16_premium']);

  // -------------------------------------------------------------
  // SECTION 17: REWARDS CLAIM & IDEMPOTENCY
  // -------------------------------------------------------------
  console.log('\n[17] Testing Rewards Claim Engine...');
  const rewardsStatusRes = await fetch(`${BASE_URL}/api/rewards/status?userId=c1bf574e-b833-4e0c-9e8e-ba5f303c6b80`);
  const rewardsStatusData = await rewardsStatusRes.json();

  results['17_rewards'] = {
    status: rewardsStatusRes.status,
    hasRewardsData: rewardsStatusData?.success === true
  };
  console.log('Rewards Result:', results['17_rewards']);

  // -------------------------------------------------------------
  // SECTION 18: LIBRARY CATALOGUE
  // -------------------------------------------------------------
  console.log('\n[18] Testing Library Catalogue...');
  const libraryRes = await fetch(`${BASE_URL}/api/academic/books?exam=UPSC_CSE`);
  const libraryData = await libraryRes.json();

  results['18_library'] = {
    status: libraryRes.status,
    booksCount: Array.isArray(libraryData?.books) ? libraryData.books.length : 0,
    booksValid: Array.isArray(libraryData?.books) && libraryData.books.length >= 10
  };
  console.log('Library Result:', results['18_library']);

  // -------------------------------------------------------------
  // SECTION 20: WEAKNESS ANALYTICS (REAL DB TEST AGGREGATION)
  // -------------------------------------------------------------
  console.log('\n[20] Testing Weakness Analytics Data Pipeline...');
  const weaknessRes = await fetch(`${BASE_URL}/api/user/analytics/weaknesses?exam=UPSC_CSE`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const weaknessData = await weaknessRes.json();

  results['20_weakness_analytics'] = {
    status: weaknessRes.status,
    hasWeaknessesOrSummary: !!weaknessData?.weaknesses || !!weaknessData?.summary || weaknessData?.success === true,
    topicsCount: Array.isArray(weaknessData?.weaknesses) ? weaknessData.weaknesses.length : 0
  };
  console.log('Weakness Analytics Result:', results['20_weakness_analytics']);

  // -------------------------------------------------------------
  // SECTION 21: TEACHER PORTAL DIRECTORY
  // -------------------------------------------------------------
  console.log('\n[21] Testing Teacher & Faculty Registry...');
  const teacherProfileRes = await fetch(`${BASE_URL}/api/teacher/profile?userId=c1bf574e-b833-4e0c-9e8e-ba5f303c6b80&email=ambujyadav0010@gmail.com`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const teacherProfileData = await teacherProfileRes.json();

  const teacherClassesRes = await fetch(`${BASE_URL}/api/teacher/classes?teacherId=c1bf574e-b833-4e0c-9e8e-ba5f303c6b80`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const teacherClassesData = await teacherClassesRes.json();

  results['21_teacher_portal'] = {
    profileStatus: teacherProfileRes.status,
    hasProfile: !!teacherProfileData?.profile,
    classesStatus: teacherClassesRes.status,
    hasClassesList: Array.isArray(teacherClassesData?.classes)
  };
  console.log('Teacher Portal Result:', results['21_teacher_portal']);

  // -------------------------------------------------------------
  // SECTION 22: TOPPER PODCASTS (AUDIT MEDIA SOURCES)
  // -------------------------------------------------------------
  console.log('\n[22] Testing Topper Podcasts Media Feed...');
  const podcastRes = await fetch(`${BASE_URL}/api/podcasts`);
  const podcastData = await podcastRes.json();
  const podcasts = podcastData?.podcasts || [];
  const usesSoundHelix = podcasts.some((p) => String(p.audioUrl).includes('soundhelix.com'));

  results['22_podcasts'] = {
    status: podcastRes.status,
    podcastsCount: podcasts.length,
    usesSampleAudio: usesSoundHelix,
    assessment: usesSoundHelix ? 'PARTIAL: Podcast player works, but audio sources are SoundHelix royalty-free sample music rather than authentic topper audio recordings' : 'PASS'
  };
  console.log('Podcasts Result:', results['22_podcasts']);

  // -------------------------------------------------------------
  // SECTION 24: FEEDBACK TICKET CREATION & USER ISOLATION
  // -------------------------------------------------------------
  console.log('\n[24] Testing Feedback Report Submission & Ticket Scoping...');
  const feedbackSubmit = await fetch(`${BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'BUG',
      title: 'Adversarial Verification Bug Report',
      description: 'Verifying server-side ticket generation and Supabase storage',
      severity: 'LOW'
    })
  });
  const feedbackData = await feedbackSubmit.json();
  const ticketId = feedbackData?.report?.id || feedbackData?.id;

  const myTicketsRes = await fetch(`${BASE_URL}/api/feedback/mine`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const myTicketsData = await myTicketsRes.json();
  const ticketInList = Array.isArray(myTicketsData?.reports) && myTicketsData.reports.some(r => r.id === ticketId);

  // Attacker should not see this ticket
  const attackerTicketsRes = await fetch(`${BASE_URL}/api/feedback/mine`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  const attackerTicketsData = await attackerTicketsRes.json();
  const attackerSeesTicket = Array.isArray(attackerTicketsData?.reports) && attackerTicketsData.reports.some(r => r.id === ticketId);

  results['24_feedback'] = {
    submitStatus: feedbackSubmit.status,
    ticketGenerated: !!ticketId,
    myTicketsStatus: myTicketsRes.status,
    ticketFound: ticketInList,
    attackerIsolated: !attackerSeesTicket
  };
  console.log('Feedback Result:', results['24_feedback']);

  // -------------------------------------------------------------
  // SECTION 25: BLOG & EDITORIALS
  // -------------------------------------------------------------
  console.log('\n[25] Testing Editorial Articles...');
  const blogRes = await fetch(`${BASE_URL}/api/blog/posts`);
  const blogData = await blogRes.json();

  results['25_blog'] = {
    status: blogRes.status,
    articlesFound: Array.isArray(blogData?.posts) ? blogData.posts.length : 0
  };
  console.log('Blog Result:', results['25_blog']);

  // -------------------------------------------------------------
  // SECTION 26: NOTIFICATIONS USER ISOLATION
  // -------------------------------------------------------------
  console.log('\n[26] Testing Notifications Scoping...');
  const adminNotifs = await fetch(`${BASE_URL}/api/notifications/c1bf574e-b833-4e0c-9e8e-ba5f303c6b80`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminNotifsData = await adminNotifs.json();

  results['26_notifications'] = {
    adminStatus: adminNotifs.status,
    notifsReturned: Array.isArray(adminNotifsData?.notifications)
  };
  console.log('Notifications Result:', results['26_notifications']);

  console.log('\n=== FINAL BUSINESS WORKFLOWS RESULT ===');
  console.log(JSON.stringify(results, null, 2));
}

runBusinessWorkflowsAudit();
