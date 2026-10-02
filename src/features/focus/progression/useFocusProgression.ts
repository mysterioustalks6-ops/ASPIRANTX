import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  calculateReward, 
  getLevelFromDust, 
  getMilestoneEntity, 
  RewardCalculation, 
  LevelProgression, 
  MilestoneEntity,
  MAX_LEVEL
} from './progressionEngine';
import { supabase } from '../../../lib/supabase';
import { getISTDateString } from '../../../lib/gamification';

export interface FocusSessionRewardResult extends RewardCalculation {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  oldProgress: number;
  newProgress: number;
  milestoneChanged: boolean;
  newMilestone: MilestoneEntity;
}

export interface UseFocusProgressionReturn {
  totalDust: number;
  totalFocusMinutes: number;
  progression: LevelProgression;
  milestone: MilestoneEntity;
  isSyncing: boolean;
  lastReward: FocusSessionRewardResult | null;
  addSessionReward: (durationMinutes: number, streakDays?: number) => FocusSessionRewardResult;
  clearLastReward: () => void;
  refreshProgression: () => void;
}

const getDustStorageKey = (userId: string) => `aspirantx_cosmic_dust_${userId || 'guest'}`;
const getMinutesStorageKey = (userId: string) => `aspirantx_total_focus_mins_${userId || 'guest'}`;

export function useFocusProgression(userId: string = 'guest', initialStreakDays: number = 1): UseFocusProgressionReturn {
  // 1. Initial local state from localStorage with zero latency
  const [totalDust, setTotalDust] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(getDustStorageKey(userId));
      return stored ? Math.max(0, parseInt(stored, 10) || 0) : 0;
    } catch {
      return 0;
    }
  });

  const [totalFocusMinutes, setTotalFocusMinutes] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(getMinutesStorageKey(userId));
      return stored ? Math.max(0, parseInt(stored, 10) || 0) : 0;
    } catch {
      return 0;
    }
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastReward, setLastReward] = useState<FocusSessionRewardResult | null>(null);

  // Sync ref to avoid stale closure during async calls
  const stateRef = useRef({ totalDust, totalFocusMinutes, userId, initialStreakDays });
  useEffect(() => {
    stateRef.current = { totalDust, totalFocusMinutes, userId, initialStreakDays };
  }, [totalDust, totalFocusMinutes, userId, initialStreakDays]);

  // Derived progression and milestone values
  const progression = getLevelFromDust(totalDust);
  const milestone = getMilestoneEntity(progression.currentLevel);

  // 2. Silent background sync to Supabase / Postgres `user_focus_stats`
  const syncToBackend = useCallback(async (newDust: number, newMinutes: number, currentLevel: number, streak: number) => {
    setIsSyncing(true);
    try {
      const payload = {
        user_id: userId,
        total_dust: newDust,
        current_level: currentLevel,
        total_focus_minutes: newMinutes,
        streak_days: streak,
        last_active_date: getISTDateString(),
        updated_at: new Date().toISOString()
      };

      // 1. Safe Supabase upsert (silently handled by compatibility layer if offline or mock)
      await supabase
        .from('user_focus_stats')
        .upsert(payload, { onConflict: 'user_id' });

      // 2. Broadcast local cross-tab event
      window.dispatchEvent(
        new CustomEvent('aspirantx_progression_updated', {
          detail: { userId, totalDust: newDust, currentLevel }
        })
      );
    } catch (err) {
      console.warn('[FocusProgression] Silent background sync queued for retry:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [userId]);

  // 3. Optimistic Reward Adder
  const addSessionReward = useCallback((durationMinutes: number, streakDays?: number): FocusSessionRewardResult => {
    const currentMins = stateRef.current.totalFocusMinutes;
    const currentTotalDust = stateRef.current.totalDust;
    const effectiveStreak = streakDays !== undefined ? streakDays : stateRef.current.initialStreakDays;

    const reward = calculateReward(durationMinutes, effectiveStreak);
    const newTotalDust = currentTotalDust + reward.totalDust;
    const newTotalMinutes = currentMins + reward.durationMinutes;

    const oldProg = getLevelFromDust(currentTotalDust);
    const newProg = getLevelFromDust(newTotalDust);

    const oldMilestone = getMilestoneEntity(oldProg.currentLevel);
    const newMilestone = getMilestoneEntity(newProg.currentLevel);

    const leveledUp = newProg.currentLevel > oldProg.currentLevel;
    const milestoneChanged = newMilestone.badge !== oldMilestone.badge;

    // A. Optimistic UI update (State + LocalStorage synchronously)
    setTotalDust(newTotalDust);
    setTotalFocusMinutes(newTotalMinutes);

    try {
      localStorage.setItem(getDustStorageKey(userId), String(newTotalDust));
      localStorage.setItem(getMinutesStorageKey(userId), String(newTotalMinutes));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    const rewardResult: FocusSessionRewardResult = {
      ...reward,
      leveledUp,
      oldLevel: oldProg.currentLevel,
      newLevel: newProg.currentLevel,
      oldProgress: oldProg.currentLevelProgress,
      newProgress: newProg.currentLevelProgress,
      milestoneChanged,
      newMilestone
    };

    setLastReward(rewardResult);

    // B. Trigger Non-blocking Background Sync
    syncToBackend(newTotalDust, newTotalMinutes, newProg.currentLevel, effectiveStreak);

    return rewardResult;
  }, [userId, syncToBackend]);

  const clearLastReward = useCallback(() => {
    setLastReward(null);
  }, []);

  const refreshProgression = useCallback(() => {
    try {
      const storedDust = localStorage.getItem(getDustStorageKey(userId));
      const storedMins = localStorage.getItem(getMinutesStorageKey(userId));
      if (storedDust !== null) setTotalDust(parseInt(storedDust, 10) || 0);
      if (storedMins !== null) setTotalFocusMinutes(parseInt(storedMins, 10) || 0);
    } catch {
      // ignore
    }
  }, [userId]);

  // 4. Listen for external events and window focus
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === getDustStorageKey(userId) && e.newValue !== null) {
        setTotalDust(parseInt(e.newValue, 10) || 0);
      }
      if (e.key === getMinutesStorageKey(userId) && e.newValue !== null) {
        setTotalFocusMinutes(parseInt(e.newValue, 10) || 0);
      }
    };

    const handleProgressionUpdated = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail?.userId === userId && typeof custom.detail.totalDust === 'number') {
        setTotalDust(custom.detail.totalDust);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('aspirantx_progression_updated', handleProgressionUpdated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('aspirantx_progression_updated', handleProgressionUpdated);
    };
  }, [userId]);

  return {
    totalDust,
    totalFocusMinutes,
    progression,
    milestone,
    isSyncing,
    lastReward,
    addSessionReward,
    clearLastReward,
    refreshProgression
  };
}
