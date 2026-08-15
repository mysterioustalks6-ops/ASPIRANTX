import { UserProfile, StudySession } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const getProfileKey = (userId?: string) => `aspirantx_user_profile_v3_${userId || 'guest'}`;
const getSessionsKey = (userId?: string) => `aspirantx_study_sessions_v3_${userId || 'guest'}`;

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'usr_guest_101',
  name: '',
  email: 'aspirant@example.com',
  exam: '',
  targetYear: 2026,
  streakDays: 1,
  lastActiveDate: getISTDateString(),
  isPremium: false,
  studyHoursToday: 0,
  xp: 0,
  coins: 0,
  level: 1,
  isProfileComplete: false,
};

/**
  * Standard IST date helper matching server-side streak engine
  */
export function getISTDateString(date = new Date()): string {
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const istDate = new Date(date.getTime() + istOffset);
  return istDate.toISOString().split('T')[0];
}

/**
 * Calculates and updates daily study streak based on last active date in IST
 */
export function updateDailyStreak(profile: UserProfile): { updatedProfile: UserProfile; streakIncremented: boolean } {
  const todayStr = getISTDateString(new Date());
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterdayStr = getISTDateString(d);

  const lastActive = profile.lastActiveDate || '';
  const currentStreak = Math.max(1, profile.streakDays || 1);

  if (!lastActive) {
    return {
      updatedProfile: { ...profile, streakDays: currentStreak, lastActiveDate: todayStr },
      streakIncremented: false,
    };
  }

  if (lastActive === todayStr) {
    return {
      updatedProfile: { ...profile, streakDays: currentStreak },
      streakIncremented: false,
    };
  }

  if (lastActive === yesterdayStr) {
    // Consecutive daily study! Increment streak and grant +20 XP bonus
    const newStreak = currentStreak + 1;
    const newXP = (profile.xp || 0) + 20;
    const { level } = calculateLevelFromXP(newXP);
    return {
      updatedProfile: {
        ...profile,
        streakDays: newStreak,
        lastActiveDate: todayStr,
        xp: newXP,
        level,
      },
      streakIncremented: true,
    };
  } else {
    // Missed one or more days, reset streak to 1
    return {
      updatedProfile: {
        ...profile,
        streakDays: 1,
        lastActiveDate: todayStr,
      },
      streakIncremented: false,
    };
  }
}

/**
 * Calculates Level and Progress percentage based on total XP
 */
export function calculateLevelFromXP(totalXP: number) {
  const level = Math.max(1, Math.floor(totalXP / 150) + 1);
  const xpCurrentLevelStart = (level - 1) * 150;
  const xpNextLevel = level * 150;
  const xpInCurrentLevel = totalXP - xpCurrentLevelStart;
  const progressPercentage = Math.min(100, Math.round((xpInCurrentLevel / 150) * 100));

  return {
    level,
    xpInCurrentLevel,
    xpNextLevel,
    xpNeededForNextLevel: 150 - xpInCurrentLevel,
    progressPercentage,
  };
}

/**
 * Checks whether the user's Premium access is active (verified by server database)
 */
export function isUserPremiumActive(profile: UserProfile): boolean {
  return Boolean(profile.isPremium);
}

/**
 * Generates a standard unique referral code for a student
 */
export function generateReferralCode(userId?: string): string {
  const hash = (userId || 'guest_101')
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const num = (hash % 8999) + 1000;
  return `ASPIRANT-${num}`;
}

/**
 * Loads User Profile from LocalStorage / Supabase
 */
export async function loadUserProfile(userId?: string): Promise<UserProfile> {
  if (!userId) {
    console.warn('[Gamification] loadUserProfile called without a valid userId. Falling back to default guest profile.');
  }

  let profile: UserProfile = {
    ...DEFAULT_USER_PROFILE,
    id: userId || DEFAULT_USER_PROFILE.id,
  };

  const key = getProfileKey(userId);
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      profile = { ...profile, ...JSON.parse(raw) };
    } catch (e) {
      console.error('Error parsing user profile from localStorage', e);
    }
  }

  // Check lightweight per-user profile cache
  const cacheKey = `aspirantx_profile_cache_${userId || 'guest'}`;
  const cachedRaw = localStorage.getItem(cacheKey);
  if (cachedRaw) {
    try {
      const cached = JSON.parse(cachedRaw);
      if (cached && cached.userId === userId) {
        if (cached.profileComplete || cached.isProfileComplete || (cached.targetExam && cached.targetExam.trim() !== '')) {
          profile.isProfileComplete = true;
        }
        if (cached.targetExam || cached.exam) {
          profile.exam = cached.targetExam || cached.exam;
        }
        if (cached.name) {
          profile.name = cached.name;
        }
      }
    } catch (e) {}
  }

  // Ensure referral code exists
  if (!profile.referralCode) {
    profile.referralCode = generateReferralCode(profile.id);
  }
  if (profile.totalReferrals === undefined) profile.totalReferrals = 2;
  if (profile.referralEarnings === undefined) profile.referralEarnings = 200;

  // Check Supabase with fast 800ms timeout for ultra-fast site loading
  if (isSupabaseConfigured && userId) {
    try {
      const supabasePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise<any>((resolve) => setTimeout(() => resolve({ data: null, error: { message: 'timeout' } }), 800));
      const { data, error } = await Promise.race([supabasePromise, timeoutPromise]).catch(() => ({ data: null, error: null }));

      if (!data && (!error || error.code === 'PGRST116')) {
        // Profile does not exist, automatically create it in background
        const newProfileData = {
          id: userId,
          xp: profile.xp,
          coins: profile.coins,
          level: profile.level,
          is_premium: profile.isPremium,
          premium_until: profile.premiumUntil,
          exam: profile.exam,
          bio: profile.bio,
          study_goal: profile.studyGoal,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString()
        };
        (async () => {
          try {
            await supabase.from('user_profiles').insert(newProfileData);
          } catch (e) {}
        })();
      } else if (!error && data) {
          const dbComplete = data.is_profile_complete === true || Boolean(data.exam && data.exam.trim() !== '') || Boolean(data.education_category && data.education_category.trim() !== '') || profile.isProfileComplete;
          profile = {
            ...profile,
            name: data.name ?? profile.name,
            xp: data.xp ?? profile.xp,
            coins: data.coins ?? profile.coins,
            level: data.level ?? profile.level,
            streakDays: data.streak_days ?? profile.streakDays,
            lastActiveDate: data.last_active_date ?? profile.lastActiveDate,
            isPremium: data.is_premium ?? profile.isPremium,
            premiumUntil: data.premium_until ?? profile.premiumUntil,
            exam: data.exam ?? profile.exam,
            bio: data.bio ?? profile.bio,
            studyGoal: data.study_goal ?? profile.studyGoal,
            avatar_url: data.avatar_url ?? profile.avatar_url,
            isProfileComplete: dbComplete,
            educationCategory: data.education_category ?? profile.educationCategory,
            stateName: data.state_name ?? profile.stateName,
            boardOrUniversity: data.board_or_university ?? profile.boardOrUniversity,
            streamOrSubject: data.stream_or_subject ?? profile.streamOrSubject,
            targetYear: data.target_year ?? profile.targetYear,
          };
      }
    } catch (err) {
      console.warn('Supabase profile load warning, using cached:', err);
    }
  }

  // Calculate accurate level
  const { level } = calculateLevelFromXP(profile.xp);
  profile.level = level;

  // Save updated profile to per-user cache
  if (profile.id) {
    try {
      localStorage.setItem(`aspirantx_profile_cache_${profile.id}`, JSON.stringify({
        userId: profile.id,
        name: profile.name,
        targetExam: profile.exam,
        profileComplete: Boolean(profile.isProfileComplete || (profile.exam && profile.exam.trim() !== '')),
        targetYear: profile.targetYear,
        updatedAt: new Date().toISOString()
      }));
    } catch (e) {}
  }

  // Determine if profile setup is complete
  if (profile.isProfileComplete === undefined) {
    profile.isProfileComplete = Boolean(profile.exam && profile.exam.trim() !== '');
  }

  return profile;
}

/**
 * Applies a friend's referral code and grants rewards (+150 Coins & +50 XP)
 * NOTE: Premium access cannot be unlocked via referral code (requires server payment verification).
 */
export async function applyReferralCode(
  user: UserProfile,
  codeToApply: string
): Promise<{ success: boolean; message: string; updatedUser: UserProfile }> {
  const cleanCode = codeToApply.trim().toUpperCase();

  if (!cleanCode) {
    return { success: false, message: 'Please enter a valid Referral Code.', updatedUser: user };
  }

  if (user.referredBy) {
    return {
      success: false,
      message: `You have already redeemed a referral code (${user.referredBy})!`,
      updatedUser: user,
    };
  }

  if (cleanCode === user.referralCode) {
    return {
      success: false,
      message: 'You cannot redeem your own referral code!',
      updatedUser: user,
    };
  }

  // Grant rewards: +150 Coins & +50 XP (Premium access requires verified server payment)
  const updatedUser: UserProfile = {
    ...user,
    referredBy: cleanCode,
    coins: (user.coins || 0) + 150,
    xp: (user.xp || 0) + 50,
  };

  await saveUserProfile(updatedUser);

  return {
    success: true,
    message: `🎉 Success! Referral Code '${cleanCode}' Applied. You earned +150 Bonus Coins & +50 XP!`,
    updatedUser,
  };
}

/**
 * Saves User Profile locally and syncs to Supabase
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const key = getProfileKey(profile.id);
  localStorage.setItem(key, JSON.stringify(profile));

  if (profile.id) {
    try {
      localStorage.setItem(`aspirantx_profile_cache_${profile.id}`, JSON.stringify({
        userId: profile.id,
        name: profile.name,
        targetExam: profile.exam,
        profileComplete: Boolean(profile.isProfileComplete || (profile.exam && profile.exam.trim() !== '')),
        targetYear: profile.targetYear,
        updatedAt: new Date().toISOString()
      }));
    } catch (e) {}
  }

  // Broadcast custom update event
  try {
    window.dispatchEvent(new CustomEvent('aspirantx_gamification_updated', { detail: profile }));
  } catch (e) {
    try {
      const evt = document.createEvent('CustomEvent');
      evt.initCustomEvent('aspirantx_gamification_updated', false, false, profile);
      window.dispatchEvent(evt);
    } catch (err) {
      console.warn('Could not dispatch gamification event:', err);
    }
  }

  if (isSupabaseConfigured && profile.id) {
    try {
      await supabase.from('user_profiles').upsert(
        {
          id: profile.id,
          name: profile.name,
          xp: profile.xp,
          coins: profile.coins,
          level: profile.level,
          exam: profile.exam,
          bio: profile.bio,
          study_goal: profile.studyGoal,
          avatar_url: profile.avatar_url,
          is_profile_complete: Boolean(profile.isProfileComplete || (profile.exam && profile.exam.trim() !== '')),
          education_category: profile.educationCategory,
          state_name: profile.stateName,
          board_or_university: profile.boardOrUniversity,
          stream_or_subject: profile.streamOrSubject,
          target_year: profile.targetYear,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch (err) {
      console.warn('Supabase user profile sync error:', err);
    }
  }

  // Sync to Express backend server database (for admin tracking)
  if (profile.email) {
    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      fetch('/api/user/update-profile', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: profile.name,
          exam: profile.exam,
          educationCategory: profile.educationCategory,
          stateName: profile.stateName,
          boardOrUniversity: profile.boardOrUniversity,
          streamOrSubject: profile.streamOrSubject,
          targetYear: profile.targetYear,
          isProfileComplete: profile.isProfileComplete,
          xp: profile.xp,
          coins: profile.coins,
          level: profile.level,
        })
      }).catch(() => {});
    } catch (e) {
      console.warn('Failed to dispatch server sync:', e);
    }
  }
}

/**
 * Awards user XP Points and Coins
 */
export async function awardXPAndCoins(
  xpToAdd: number,
  coinsToAdd: number,
  reason: string,
  userId?: string
): Promise<{ newXP: number; newCoins: number; leveledUp: boolean; newLevel: number }> {
  const profile = await loadUserProfile(userId);
  const oldLevel = profile.level;

  profile.xp += xpToAdd;
  profile.coins += coinsToAdd;

  const { level: newLevel } = calculateLevelFromXP(profile.xp);
  profile.level = newLevel;
  const leveledUp = newLevel > oldLevel;

  await saveUserProfile(profile);

  return {
    newXP: profile.xp,
    newCoins: profile.coins,
    leveledUp,
    newLevel,
  };
}

/**
 * Redeems 100 Coins to unlock 1 Day Premium Access
 */
export async function redeemCoinsForPremium(userId?: string): Promise<{
  success: boolean;
  message: string;
  updatedProfile?: UserProfile;
}> {
  const profile = await loadUserProfile(userId);

  if (profile.coins < 100) {
    return {
      success: false,
      message: `Insufficient Coins! You need 100 Coins (Current: ${profile.coins} Coins). Keep studying to earn more!`,
    };
  }

  // Deduct 100 Coins
  profile.coins -= 100;

  // Extend 1 Day (24 hours)
  const currentExpiry = profile.premiumUntil ? new Date(profile.premiumUntil).getTime() : Date.now();
  const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
  const newExpiry = new Date(baseTime + 24 * 60 * 60 * 1000).toISOString();

  profile.premiumUntil = newExpiry;
  profile.isPremium = true;

  await saveUserProfile(profile);

  return {
    success: true,
    message: '🎉 Success! Redeemed 100 Coins for 1 Day PRO Access! Premium features unlocked until ' + new Date(newExpiry).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
    updatedProfile: profile,
  };
}

/**
 * Saves a completed Study Session (from Stopwatch or Pomodoro) to Supabase and LocalStorage
 */
export async function saveStudySessionLog(
  session: Omit<StudySession, 'id' | 'createdAt' | 'xpEarned' | 'coinsEarned'>
): Promise<{ savedSession: StudySession; xpEarned: number; coinsEarned: number }> {
  const durationMins = Math.max(1, Math.round(session.durationSeconds / 60));
  
  // Calculate rewards: 5 XP per min + 1 Coin per 2 mins (min 20 XP, 5 Coins)
  const xpEarned = Math.max(20, durationMins * 5);
  const coinsEarned = Math.max(5, Math.floor(durationMins / 2));

  const newSession: StudySession = {
    id: `sess_${Date.now()}`,
    ...session,
    createdAt: new Date().toISOString(),
    xpEarned,
    coinsEarned,
  };

  // Save to LocalStorage
  const sessionsKey = getSessionsKey(session.userId);
  const existingRaw = localStorage.getItem(sessionsKey);
  let sessions: StudySession[] = [];
  if (existingRaw) {
    try {
      sessions = JSON.parse(existingRaw);
    } catch (e) {
      console.error('Error reading study sessions:', e);
    }
  }

  sessions.unshift(newSession);
  localStorage.setItem(sessionsKey, JSON.stringify(sessions));

  // Sync to Supabase
  if (isSupabaseConfigured && session.userId) {
    try {
      await supabase.from('user_study_sessions').insert({
        id: newSession.id,
        user_id: session.userId,
        subject: session.subject,
        duration_seconds: session.durationSeconds,
        xp_earned: xpEarned,
        coins_earned: coinsEarned,
        mode: session.mode,
        created_at: newSession.createdAt,
      });
    } catch (err) {
      console.warn('Supabase session log error:', err);
    }
  }

  // Award XP and Coins
  await awardXPAndCoins(xpEarned, coinsEarned, `Completed ${durationMins}m ${session.mode} study session`, session.userId);

  return {
    savedSession: newSession,
    xpEarned,
    coinsEarned,
  };
}

/**
 * Loads recent study session logs
 */
export async function loadStudySessions(userId?: string): Promise<StudySession[]> {
  const sessionsKey = getSessionsKey(userId);
  const existingRaw = localStorage.getItem(sessionsKey);
  let sessions: StudySession[] = [];
  if (existingRaw) {
    try {
      sessions = JSON.parse(existingRaw);
    } catch (e) {
      console.error(e);
    }
  }

  if (isSupabaseConfigured && userId) {
    try {
      const { data, error } = await supabase
        .from('user_study_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        return data.map((d) => ({
          id: d.id,
          userId: d.user_id,
          subject: d.subject,
          durationSeconds: d.duration_seconds,
          createdAt: d.created_at,
          xpEarned: d.xp_earned,
          coinsEarned: d.coins_earned,
          mode: d.mode,
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch sessions error:', err);
    }
  }

  return sessions;
}
