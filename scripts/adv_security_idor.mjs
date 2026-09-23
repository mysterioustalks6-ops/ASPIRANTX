import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:3000';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runAdversarialSecurityAndIdor() {
  console.log('=== STARTING ADVERSARIAL IDOR, PERSISTENCE & API DEEP TESTS ===\n');
  const results = {};

  // 1. Authenticate as Admin (User A)
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

  // Create User B (Attacker / Normal Student)
  const userBToken = jwt.sign(
    { sub: '00000000-0000-0000-0000-000000000002', email: 'attacker@example.com', role: 'STUDENT' },
    process.env.JWT_SECRET || 'fallback-secret-for-protrack-jwt-production-environment-only',
    { expiresIn: '1h' }
  );

  // --------------------------------------------------------------------------
  // TEST SECTION 7: COMMUNITY IDOR & AUTHORIZATION
  // --------------------------------------------------------------------------
  console.log('[1] Testing Community Post & Comment IDOR Security...');
  
  // Create a comment owned by User A (Admin)
  const commentPayload = {
    postId: 'post_polity_1',
    authorId: 'c1bf574e-b833-4e0c-9e8e-ba5f303c6b80',
    authorName: 'Ambuj Yadav',
    content: 'Test comment for IDOR verification'
  };
  const createCommentRes = await fetch(`${BASE_URL}/api/community/comments`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commentPayload)
  });
  const createdComment = await createCommentRes.json();
  const commentId = createdComment?.data?.id || `comm_${Date.now()}`;

  // Attack 1: Anonymous Delete
  const anonDelete = await fetch(`${BASE_URL}/api/community/comments/${commentId}`, {
    method: 'DELETE'
  });

  // Attack 2: User B (Attacker) Delete
  const attackerDelete = await fetch(`${BASE_URL}/api/community/comments/${commentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${userBToken}` }
  });

  // Legitimate Delete by Owner / Admin
  const adminDelete = await fetch(`${BASE_URL}/api/community/comments/${commentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  // Repeated Delete
  const repeatDelete = await fetch(`${BASE_URL}/api/community/comments/${commentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  results['community_idor'] = {
    commentCreated: createCommentRes.status === 200,
    createdCommentId: commentId,
    anonDeleteStatus: anonDelete.status,
    anonDeleteDenied: anonDelete.status === 401,
    attackerDeleteStatus: attackerDelete.status,
    attackerDeleteDenied: attackerDelete.status === 403,
    adminDeleteStatus: adminDelete.status,
    adminDeleteSuccess: adminDelete.status === 200,
    repeatDeleteStatus: repeatDelete.status,
    repeatDeleteClean: repeatDelete.status === 404
  };
  console.log('Community IDOR Result:', results['community_idor']);

  // --------------------------------------------------------------------------
  // TEST SECTION 6: SYLLABUS TRACKER WITH REAL UUID VS MALFORMED
  // --------------------------------------------------------------------------
  console.log('\n[2] Testing Syllabus UUID Resilience & DB Constraints...');
  
  // 1. Valid UUID progress upsert to user_syllabus_progress
  const { data: validProgressData, error: validProgressErr } = await supabase
    .from('user_syllabus_progress')
    .upsert({
      user_id: 'c1bf574e-b833-4e0c-9e8e-ba5f303c6b80',
      completed_subtopic_ids: ['polity_prelims_preamble', 'polity_prelims_dpsp'],
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    .select();

  // 2. Malformed non-UUID string ('admin-ambuj-123')
  const { data: malformedProgressData, error: malformedProgressErr } = await supabase
    .from('user_syllabus_progress')
    .upsert({
      user_id: 'admin-ambuj-123',
      completed_subtopic_ids: ['polity_prelims_preamble'],
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
    .select();

  // 3. Query syllabus nodes API
  const syllabusApiRes = await fetch(`${BASE_URL}/api/academic/syllabus?exam=UPSC_CSE`);
  const syllabusApiData = await syllabusApiRes.json();

  results['syllabus_verification'] = {
    validUuidSaved: !validProgressErr,
    validUuidError: validProgressErr?.message,
    malformedProperlyRejectedByPostgres: !!malformedProgressErr && malformedProgressErr.code === '22P02',
    malformedErrorCode: malformedProgressErr?.code,
    syllabusApiStatus: syllabusApiRes.status,
    syllabusNodesCount: Array.isArray(syllabusApiData?.syllabus) ? syllabusApiData.syllabus.length : 0
  };
  console.log('Syllabus Verification Result:', results['syllabus_verification']);

  // --------------------------------------------------------------------------
  // TEST SECTION 8: PYQ ROUTE FIX & EXPRESS ORDERING
  // --------------------------------------------------------------------------
  console.log('\n[3] Testing PYQ Route Resolution...');
  const pyqAnalytics = await fetch(`${BASE_URL}/api/academic/pyqs/analytics`);
  const pyqPdfs = await fetch(`${BASE_URL}/api/academic/pyqs/pdfs`);
  const pyqSpecific = await fetch(`${BASE_URL}/api/academic/pyqs/sample_test_id`);

  results['pyq_routes'] = {
    analyticsStatus: pyqAnalytics.status,
    analyticsIs200: pyqAnalytics.status === 200,
    pdfsStatus: pyqPdfs.status,
    pdfsIs200: pyqPdfs.status === 200,
    specificStatus: pyqSpecific.status,
    noShadowing: pyqAnalytics.status === 200 && pyqPdfs.status === 200
  };
  console.log('PYQ Routes Result:', results['pyq_routes']);

  // --------------------------------------------------------------------------
  // TEST SECTION 9: TASK CRUD & PERSISTENCE
  // --------------------------------------------------------------------------
  console.log('\n[4] Testing Task Manager Full CRUD Persistence...');
  
  // 1. Create Task
  const createTaskRes = await fetch(`${BASE_URL}/api/user/tasks`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Adversarial Verification Task',
      description: 'Verifying database server-side persistence and CRUD',
      status: 'TODO',
      priority: 'HIGH'
    })
  });
  const createdTaskData = await createTaskRes.json();
  const taskId = createdTaskData?.task?.id || createdTaskData?.data?.id;

  // 2. Read Tasks
  const readTasksRes = await fetch(`${BASE_URL}/api/user/tasks`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const readTasksData = await readTasksRes.json();
  const taskFoundInList = Array.isArray(readTasksData?.tasks) && readTasksData.tasks.some(t => t.id === taskId);

  // 3. User B (Attacker) attempting to read User A's tasks
  const attackerReadRes = await fetch(`${BASE_URL}/api/user/tasks`, {
    headers: { 'Authorization': `Bearer ${userBToken}` }
  });
  const attackerTasksData = await attackerReadRes.json();
  const attackerSeesUserATask = Array.isArray(attackerTasksData?.tasks) && attackerTasksData.tasks.some(t => t.id === taskId);

  // 4. Update Task Status
  const updateTaskRes = await fetch(`${BASE_URL}/api/user/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'DONE' })
  });

  // 5. Delete Task
  const deleteTaskRes = await fetch(`${BASE_URL}/api/user/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  // 6. Verify Deletion
  const postDeleteRead = await fetch(`${BASE_URL}/api/user/tasks`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const postDeleteData = await postDeleteRead.json();
  const taskStillPresent = Array.isArray(postDeleteData?.tasks) && postDeleteData.tasks.some(t => t.id === taskId);

  results['task_crud_persistence'] = {
    createStatus: createTaskRes.status,
    taskIdGenerated: !!taskId,
    readStatus: readTasksRes.status,
    foundInUserList: taskFoundInList,
    attackerIsolated: !attackerSeesUserATask,
    updateStatus: updateTaskRes.status,
    deleteStatus: deleteTaskRes.status,
    cleanedUpFromDb: !taskStillPresent
  };
  console.log('Task CRUD Result:', results['task_crud_persistence']);

  // --------------------------------------------------------------------------
  // TEST SECTION 5: GLOBAL SEARCH CHAOS & EDGE CASES
  // --------------------------------------------------------------------------
  console.log('\n[5] Testing Global Search Queries...');
  
  const searchQueries = [
    { name: 'normal', q: 'polity' },
    { name: 'empty', q: '' },
    { name: 'whitespace', q: '   ' },
    { name: 'hindi', q: 'संविधान' },
    { name: 'special_chars', q: '<script>alert(1)</script>' },
    { name: 'long_query', q: 'A'.repeat(250) },
    { name: 'nonexistent', q: 'xyzzy_never_found_word_99' }
  ];

  const searchResults = {};
  for (const item of searchQueries) {
    const sRes = await fetch(`${BASE_URL}/api/search?q=${encodeURIComponent(item.q)}`);
    const sData = await sRes.json().catch(() => null);
    searchResults[item.name] = {
      status: sRes.status,
      hasSuccess: sData?.success === true,
      hasDataOrResults: !!(sData?.data || sData?.results)
    };
  }
  results['global_search'] = searchResults;
  console.log('Global Search Results:', results['global_search']);

  console.log('\n=== FINAL ADVERSARIAL IDOR, PERSISTENCE & API SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));
}

runAdversarialSecurityAndIdor();
