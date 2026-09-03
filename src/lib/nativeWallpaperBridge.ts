import { registerPlugin, Capacitor } from '@capacitor/core';
import { getAuthoritativeWallpaperTelemetry, getKnownExamDateString } from './dailyStudyTracker';
import { normalizeExamId } from './examRegistry';

export interface WallpaperDataPayload {
  examName: string;
  targetDate: string;
  targetEpochMs: number;
  daysRemaining: number;
  syllabusPercentage: number;
  currentStreak: number;
  completedDays: number;
  habitMatrix: Array<{
    dayNumber: number;
    isCompleted: boolean;
    isMissed: boolean;
    isToday: boolean;
  }>;
}

export interface AspirantXWallpaperPluginInterface {
  updateWallpaperData(data: WallpaperDataPayload): Promise<{ success: boolean }>;
  openLiveWallpaperPicker(): Promise<{ success: boolean }>;
  isLiveWallpaperActive(): Promise<{ isActive: boolean }>;
}

export const AspirantXWallpaper = registerPlugin<AspirantXWallpaperPluginInterface>('AspirantXWallpaper');

/**
 * Bridges local authoritative study & exam metrics from IndexedDB/localStorage
 * directly to the native Android WallpaperService without any network requests.
 */
export async function syncAuthoritativeWallpaperToNative(
  userId?: string | null,
  examId?: string | null
): Promise<boolean> {
  try {
    const telemetry = getAuthoritativeWallpaperTelemetry(userId, examId);
    const canonicalExamId = normalizeExamId(examId || 'NEET_UG');
    const knownDateStr = getKnownExamDateString(canonicalExamId);
    
    let targetEpochMs = 0;
    if (knownDateStr) {
      const parsed = Date.parse(knownDateStr);
      if (!isNaN(parsed)) {
        targetEpochMs = parsed;
      }
    }

    const payload: WallpaperDataPayload = {
      examName: telemetry.examName,
      targetDate: telemetry.schedule.formattedDate,
      targetEpochMs,
      daysRemaining: telemetry.schedule.daysRemaining ?? 0,
      syllabusPercentage: telemetry.syllabusPercentage,
      currentStreak: telemetry.currentStreak,
      completedDays: telemetry.totalCompletedDays,
      habitMatrix: telemetry.dateBoxes.map(b => ({
        dayNumber: parseInt(b.dayNumber, 10) || 1,
        isCompleted: b.isCompleted,
        isMissed: b.isMissed,
        isToday: b.isToday
      }))
    };

    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      await AspirantXWallpaper.updateWallpaperData(payload);
      return true;
    } else {
      // In web browser: save to localStorage for local testing
      try {
        localStorage.setItem('aspirantx_web_live_wallpaper_state', JSON.stringify(payload));
      } catch (ignored) {}
      return true;
    }
  } catch (err) {
    console.warn('[AspirantX Live Wallpaper Bridge] Sync failed:', err);
    return false;
  }
}

/**
 * Launches the Android system Live Wallpaper Picker to apply the AspirantX
 * dynamic habit wallpaper to home/lock screen.
 */
export async function requestSetLiveWallpaper(
  userId?: string | null,
  examId?: string | null
): Promise<boolean> {
  try {
    // 1. Ensure latest local data is pushed to native SharedPreferences first
    await syncAuthoritativeWallpaperToNative(userId, examId);

    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      const res = await AspirantXWallpaper.openLiveWallpaperPicker();
      return !!res.success;
    } else {
      console.info('[AspirantX Wallpaper] Live Wallpaper picker is native Android only.');
      return false;
    }
  } catch (err) {
    console.error('[AspirantX Wallpaper] Failed to open live wallpaper picker:', err);
    return false;
  }
}

/**
 * Checks if AspirantX Live Wallpaper is currently the active system wallpaper.
 */
export async function checkIsLiveWallpaperActive(): Promise<boolean> {
  try {
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      const res = await AspirantXWallpaper.isLiveWallpaperActive();
      return !!res.isActive;
    }
    return false;
  } catch (err) {
    return false;
  }
}
