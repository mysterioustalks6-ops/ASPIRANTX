import { queryPostgres, pgPool } from '../src/lib/postgres.js';
import { RewardEngine, getISTDateKey, getISTWeekKey } from '../src/lib/rewards/rewardEngine.js';
import { FocusService } from '../src/lib/focus/focusService.js';

async function runTestSuite() {
  console.log('====================================================');
  console.log('  PROTRACK REWARDS & FOCUS ENGINE TEST SUITE');
  console.log('====================================================');

  const testUserId = '00000000-0000-0000-0000-000000000001';
  const client = await pgPool!.connect();

  try {
    // 0. Ensure test user profile exists
    await client.query(`
      INSERT INTO user_profiles (id, xp, coins, level, is_premium, streak_days, updated_at)
      VALUES ($1, 0, 0, 1, false, 0, NOW())
      ON CONFLICT (id) DO UPDATE SET xp = 0, level = 1, updated_at = NOW();
    `, [testUserId]);

    // Clean previous test artifacts for this user
    await client.query(`DELETE FROM reward_ledger WHERE user_id = $1`, [testUserId]);
    await client.query(`DELETE FROM reward_events WHERE user_id = $1`, [testUserId]);
    await client.query(`DELETE FROM user_challenges WHERE user_id = $1`, [testUserId]);
    await client.query(`DELETE FROM user_achievements WHERE user_id = $1`, [testUserId]);
    await client.query(`DELETE FROM focus_sessions WHERE user_id = $1`, [testUserId]);

    console.log('\n[TEST 1] RewardEngine: Event Processing & XP Ledger');
    const ev1Ref = `test_pomo_${Date.now()}_1`;
    const res1 = await RewardEngine.processEvent({
      userId: testUserId,
      eventType: 'POMODORO_COMPLETED',
      referenceId: ev1Ref,
      payload: { verifiedMinutes: 25, minutes: 25, subject: 'Physics' },
      userExam: 'NEET_UG'
    });

    if (res1.xpGained < 50) {
      throw new Error(`Expected at least 50 XP awarded for 25 min pomodoro, got ${res1.xpGained}`);
    }
    console.log(`  ✓ Successfully processed POMODORO_COMPLETED: +${res1.xpGained} XP (New Balance: ${res1.newBalance})`);

    // Verify ledger entry
    const ledgerCheck = await client.query(
      `SELECT * FROM reward_ledger WHERE user_id = $1 AND reference_id = $2`,
      [testUserId, ev1Ref]
    );
    if (ledgerCheck.rowCount !== 1) {
      throw new Error('Ledger entry missing from database!');
    }
    console.log('  ✓ Ledger entry recorded transactionally in Neon PostgreSQL');

    console.log('\n[TEST 2] Strict Idempotency Check');
    const dupRes = await RewardEngine.processEvent({
      userId: testUserId,
      eventType: 'POMODORO_COMPLETED',
      referenceId: ev1Ref, // Exact same reference ID
      payload: { verifiedMinutes: 25, minutes: 25 }
    });
    if (!dupRes.duplicate || dupRes.xpGained !== 0) {
      throw new Error(`Duplicate event should be rejected with duplicate: true and 0 XP, got: ${JSON.stringify(dupRes)}`);
    }
    console.log('  ✓ Duplicate event rejected gracefully with duplicate: true, 0 XP awarded');

    console.log('\n[TEST 3] Challenge Progress Tracking');
    const todayKey = getISTDateKey();
    const chProgress = await client.query(`
      SELECT uc.*, c.code, c.title, c.target_value
      FROM user_challenges uc
      JOIN challenges c ON uc.challenge_id = c.id
      WHERE uc.user_id = $1 AND uc.period_key = $2
    `, [testUserId, todayKey]);

    console.log(`  ✓ Found ${chProgress.rows.length} updated daily challenges for ${todayKey}`);
    const dailyFocusCh = chProgress.rows.find((r: any) => r.code === 'DAILY_FOCUS_45');
    if (!dailyFocusCh) {
      throw new Error('DAILY_FOCUS_45 challenge progress missing!');
    }
    console.log(`  ✓ Challenge '${dailyFocusCh.title}': progress = ${dailyFocusCh.current_value}/${dailyFocusCh.target_value} (completed: ${dailyFocusCh.is_completed})`);
    if (Number(dailyFocusCh.current_value) < 25) {
      throw new Error(`Challenge progress was expected >= 25, got ${dailyFocusCh.current_value}`);
    }

    console.log('\n[TEST 4] FocusService: Lifecycle & Anti-Cheat Verification');
    // Start session
    const startRes = await FocusService.startSession({
      userId: testUserId,
      requestedMinutes: 25,
      blockedApps: ['com.google.android.youtube', 'com.instagram.android']
    });
    console.log(`  ✓ Started focus session: ${startRes.session.id}`);

    // Heartbeat
    const hbRes = await FocusService.heartbeat({
      userId: testUserId,
      sessionId: startRes.session.id
    });
    console.log(`  ✓ Heartbeat accepted: elapsed = ${hbRes.elapsedSeconds}s`);

    // Anti-cheat test: Complete session claiming 25 mins when only ~1 second actually elapsed
    console.log('  Testing Anti-Cheat: client attempts completion after only ~2 seconds real time...');
    const completeRes = await FocusService.completeSession({
      userId: testUserId,
      sessionId: startRes.session.id
    });

    console.log(`  ✓ Session completed: verifiedMinutes = ${completeRes.verifiedMinutes} min (rewards XP: +${completeRes.rewards.xpGained})`);
    // Verified minutes must be 1 min (minimum bound), NOT 25 mins!
    if (completeRes.verifiedMinutes > 2) {
      throw new Error(`Anti-cheat failure! Client completed instantly and server gave ${completeRes.verifiedMinutes} mins!`);
    }
    console.log(`  ✓ Anti-cheat passed: instant completion was safely clipped to ${completeRes.verifiedMinutes} min!`);

    console.log('\n[TEST 5] IDOR & Security Isolation');
    const attackerUserId = '00000000-0000-0000-0000-000000000002';
    try {
      await FocusService.completeSession({
        userId: attackerUserId,
        sessionId: startRes.session.id
      });
      throw new Error('IDOR failure: attacker was able to complete victim session!');
    } catch (e: any) {
      if (e.message.includes('not found')) {
        console.log('  ✓ IDOR security verified: cross-user session tampering rejected with 404/Not Found');
      } else {
        throw e;
      }
    }

    console.log('\n[TEST 6] Achievement Threshold & Trophy Unlock');
    const uAchRes = await client.query(`
      SELECT ua.*, a.code, a.name, a.target_value
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = $1
    `, [testUserId]);

    console.log(`  ✓ Found ${uAchRes.rows.length} updated achievements in DB`);
    const firstStep = uAchRes.rows.find((r: any) => r.code === 'FOCUS_FIRST_STEP');
    if (!firstStep) {
      throw new Error('FOCUS_FIRST_STEP achievement missing in user_achievements');
    }
    console.log(`  ✓ '${firstStep.name}': progress = ${firstStep.current_value}/${firstStep.target_value}, is_unlocked = ${firstStep.is_unlocked}`);
    if (!firstStep.is_unlocked) {
      throw new Error('FOCUS_FIRST_STEP should be unlocked after 25 min pomodoro');
    }

    console.log('\n[TEST 7] User Rewards Overview & Level Calculation');
    const profRes = await client.query(`SELECT xp, level FROM user_profiles WHERE id = $1`, [testUserId]);
    const finalProf = profRes.rows[0];
    const unlockedCount = uAchRes.rows.filter((r: any) => r.is_unlocked).length;
    console.log(`  ✓ Final User Profile: XP = ${finalProf.xp}, Level = ${finalProf.level}, Unlocked Trophies = ${unlockedCount}`);
    if (Number(finalProf.xp) < 50 || Number(finalProf.level) < 1 || unlockedCount < 1) {
      throw new Error('Profile XP/Level/Trophies verification failed');
    }

    // Clean up test data
    await client.query(`DELETE FROM reward_ledger WHERE user_id = $1`, [testUserId]);
    await client.query(`DELETE FROM reward_events WHERE user_id = $1`, [testUserId]);
    await client.query(`DELETE FROM user_challenges WHERE user_id = $1`, [testUserId]);
    await client.query(`DELETE FROM user_achievements WHERE user_id = $1`, [testUserId]);
    await client.query(`DELETE FROM focus_sessions WHERE user_id = $1`, [testUserId]);
    await client.query(`DELETE FROM user_profiles WHERE id = $1`, [testUserId]);
    console.log('  ✓ Test fixtures cleaned up safely');

    console.log('\n====================================================');
    console.log('  ALL 7 TESTS PASSED SUCCESSFULLY! (100% HEALTHY)');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
  } finally {
    client.release();
    await pgPool?.end();
  }
}

runTestSuite();
