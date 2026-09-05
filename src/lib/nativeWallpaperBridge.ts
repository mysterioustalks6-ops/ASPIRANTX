import { registerPlugin, Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { getAuthoritativeWallpaperTelemetry, getKnownExamDateString } from './dailyStudyTracker';
import { normalizeExamId } from './examRegistry';
import { WALLPAPER_PERSONAS, WallpaperPersona } from './wallpaperPersonas';

export interface CanonicalWallpaperState {
  candidateName: string;
  examName: string;
  targetDate: string;
  targetEpochMs: number;
  daysRemaining: number;
  syllabusPercentage: number;
  currentStreak: number;
  completedDays: number;
  personaId: string;
  personaTitle: string;
  characterQuote: string;
  accentColor: string;
  bgGradient: [string, string, string];
  habitMatrix: Array<{
    dayNumber: number;
    isCompleted: boolean;
    isMissed: boolean;
    isToday: boolean;
  }>;
}

// Backward-compatible alias
export type WallpaperDataPayload = CanonicalWallpaperState;

export interface LiveWallpaperStatusResult {
  isActive: boolean;
  activePackage?: string | null;
  activeService?: string | null;
}

export interface WallpaperPickerResult {
  success: boolean;
  method?: string;           // 'direct' | 'chooser' | 'settings_display' | 'oem_vivo' | 'set_wallpaper_action' | 'manual' | 'error'
  oem?: string;              // lowercase brand e.g. 'vivo', 'xiaomi', 'samsung'
  androidVersion?: number;
  isVivoDevice?: boolean;
  isXiaomiDevice?: boolean;
  isOEMRestricted?: boolean; // true when device blocks all picker intents
  serviceComponent?: string;
  error?: string;
}

export type WallpaperStatusCode = 'NOT_SUPPORTED' | 'AVAILABLE_NOT_SET' | 'ACTIVE' | 'ERROR';

export interface WallpaperStatusResult {
  status: WallpaperStatusCode;
  isSupported: boolean;
  isActive: boolean;
  activePackage?: string | null;
  activeComponent?: string | null;
  oem?: string;
  manufacturer?: string;
  model?: string;
  androidVersion?: string;
  sdkInt?: number;
  error?: string;
}

export interface DeviceCapabilitiesResult {
  notificationsGranted: boolean;
  isIgnoringBatteryOptimizations: boolean;
  oem: string;
  manufacturer?: string;
  model?: string;
  androidVersion?: string;
  sdkInt?: number;
  error?: string;
}

export interface AspirantXWallpaperPluginInterface {
  updateWallpaperData(data: CanonicalWallpaperState): Promise<{ success: boolean }>;
  openLiveWallpaperPicker(): Promise<WallpaperPickerResult>;
  isLiveWallpaperActive(): Promise<LiveWallpaperStatusResult>;
  getWallpaperStatus(): Promise<WallpaperStatusResult>;
  getDeviceCapabilities(): Promise<DeviceCapabilitiesResult>;
  requestBatteryOptimizationExemption(): Promise<{ success: boolean; alreadyExempt?: boolean; error?: string }>;
  openOemBatterySettings(): Promise<{ success: boolean; oem?: string; error?: string }>;
}

export const AspirantXWallpaper = registerPlugin<AspirantXWallpaperPluginInterface>('AspirantXWallpaper');

/**
 * Resolves the currently selected or saved persona
 */
export function getAuthoritativePersona(personaIdOrObj?: string | WallpaperPersona | null): WallpaperPersona {
  if (personaIdOrObj && typeof personaIdOrObj === 'object' && 'id' in personaIdOrObj) {
    return personaIdOrObj;
  }
  const targetId = typeof personaIdOrObj === 'string' 
    ? personaIdOrObj 
    : (() => {
        try {
          return localStorage.getItem('aspirantx_wallpaper_persona_id');
        } catch {
          return null;
        }
      })();

  return WALLPAPER_PERSONAS.find(p => p.id === targetId) || WALLPAPER_PERSONAS[0];
}

/**
 * Builds the canonical wallpaper state used identically across React preview,
 * static Canvas export, and the native Android Live Wallpaper Engine.
 */
export function buildCanonicalWallpaperState(
  userId?: string | null,
  examId?: string | null,
  persona?: WallpaperPersona | null,
  candidateName?: string | null
): CanonicalWallpaperState {
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

  const activePersona = getAuthoritativePersona(persona);
  let resolvedName = candidateName && candidateName.trim() ? candidateName.trim() : null;
  if (!resolvedName) {
    try {
      const storedUser = localStorage.getItem('aspirantx_user_profile') || localStorage.getItem('aspirantx_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.name && typeof parsed.name === 'string' && parsed.name.trim()) {
          resolvedName = parsed.name.trim();
        }
      }
    } catch {}
  }
  if (!resolvedName) {
    resolvedName = 'Dedicated Aspirant';
  }

  return {
    candidateName: resolvedName,
    examName: telemetry.examName,
    targetDate: telemetry.schedule.formattedDate,
    targetEpochMs,
    daysRemaining: telemetry.schedule.daysRemaining ?? 0,
    syllabusPercentage: telemetry.syllabusPercentage,
    currentStreak: telemetry.currentStreak,
    completedDays: telemetry.totalCompletedDays,
    personaId: activePersona.id,
    personaTitle: activePersona.characterTitle,
    characterQuote: activePersona.characterQuote,
    accentColor: activePersona.accentColor,
    bgGradient: activePersona.bgGradient,
    habitMatrix: telemetry.dateBoxes.map(b => ({
      dayNumber: parseInt(b.dayNumber, 10) || 1,
      isCompleted: b.isCompleted,
      isMissed: b.isMissed,
      isToday: b.isToday
    }))
  };
}

/**
 * Bridges local authoritative study & exam metrics directly to the native
 * Android WallpaperService without any network requests.
 */
export const isAndroidPlatform = (): boolean => {
  try {
    return (
      Capacitor.getPlatform() === 'android' ||
      Capacitor.isNativePlatform() ||
      (typeof window !== 'undefined' && (/Android/i.test(navigator.userAgent) || !!(window as any).Capacitor))
    );
  } catch {
    return false;
  }
};

export async function syncAuthoritativeWallpaperToNative(
  userId?: string | null,
  examId?: string | null,
  persona?: WallpaperPersona | null,
  candidateName?: string | null
): Promise<boolean> {
  try {
    const payload = buildCanonicalWallpaperState(userId, examId, persona, candidateName);

    if (isAndroidPlatform()) {
      try {
        await AspirantXWallpaper.updateWallpaperData(payload);
        return true;
      } catch (nativeErr) {
        console.warn('[AspirantX Live Wallpaper Bridge] Native plugin update failed:', nativeErr);
      }
    }
    // In web browser: save to localStorage for local preview / parity
    try {
      localStorage.setItem('aspirantx_web_live_wallpaper_state', JSON.stringify(payload));
    } catch (ignored) {}
    return true;
  } catch (err) {
    console.warn('[AspirantX Live Wallpaper Bridge] Sync failed:', err);
    return false;
  }
}

/**
 * Launches the Android system Live Wallpaper Picker/Preview to apply the AspirantX
 * dynamic live wallpaper to home/lock screen.
 */
export async function requestSetLiveWallpaper(
  userId?: string | null,
  examId?: string | null,
  persona?: WallpaperPersona | null,
  candidateName?: string | null
): Promise<WallpaperPickerResult> {
  try {
    // 1. Ensure latest authoritative data and persona theme is pushed to native SharedPreferences first
    await syncAuthoritativeWallpaperToNative(userId, examId, persona, candidateName);

    if (isAndroidPlatform()) {
      const res = await AspirantXWallpaper.openLiveWallpaperPicker();
      console.info('[AspirantX Wallpaper] Picker result:', JSON.stringify(res));
      return res;
    } else {
      console.info('[AspirantX Wallpaper] Live Wallpaper picker is native Android only.');
      return { success: false, method: 'not_android' };
    }
  } catch (err) {
    console.error('[AspirantX Wallpaper] Failed to open live wallpaper picker:', err);
    return { success: false, method: 'error', error: String(err) };
  }
}

/**
 * Checks if AspirantX Live Wallpaper is currently the active system wallpaper on Android.
 */
export async function checkIsLiveWallpaperActive(): Promise<LiveWallpaperStatusResult> {
  try {
    if (isAndroidPlatform()) {
      const res = await AspirantXWallpaper.isLiveWallpaperActive();
      return {
        isActive: !!res.isActive,
        activePackage: res.activePackage || null,
        activeService: res.activeService || null
      };
    }
    return { isActive: false, activePackage: null, activeService: null };
  } catch (err) {
    return { isActive: false, activePackage: null, activeService: null };
  }
}

export async function fetchWallpaperStatus(): Promise<WallpaperStatusResult> {
  try {
    if (isAndroidPlatform()) {
      if (typeof AspirantXWallpaper.getWallpaperStatus === 'function') {
        const res = await AspirantXWallpaper.getWallpaperStatus();
        return res;
      }
      // Fallback to legacy check
      const legacy = await checkIsLiveWallpaperActive();
      return {
        status: legacy.isActive ? 'ACTIVE' : 'AVAILABLE_NOT_SET',
        isSupported: true,
        isActive: legacy.isActive,
        activePackage: legacy.activePackage,
        activeComponent: legacy.activeService
      };
    }
    return {
      status: 'NOT_SUPPORTED',
      isSupported: false,
      isActive: false
    };
  } catch (err) {
    return {
      status: 'ERROR',
      isSupported: false,
      isActive: false,
      error: String(err)
    };
  }
}

export async function fetchDeviceCapabilities(): Promise<DeviceCapabilitiesResult> {
  try {
    if (isAndroidPlatform() && typeof AspirantXWallpaper.getDeviceCapabilities === 'function') {
      return await AspirantXWallpaper.getDeviceCapabilities();
    }
    return {
      notificationsGranted: true,
      isIgnoringBatteryOptimizations: true,
      oem: 'web'
    };
  } catch (err) {
    return {
      notificationsGranted: false,
      isIgnoringBatteryOptimizations: false,
      oem: 'unknown',
      error: String(err)
    };
  }
}

export async function requestBatteryExemption(): Promise<{ success: boolean; alreadyExempt?: boolean; error?: string }> {
  try {
    if (isAndroidPlatform() && typeof AspirantXWallpaper.requestBatteryOptimizationExemption === 'function') {
      return await AspirantXWallpaper.requestBatteryOptimizationExemption();
    }
    return { success: false, error: 'not_supported' };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function openOemSettings(): Promise<{ success: boolean; oem?: string; error?: string }> {
  try {
    if (isAndroidPlatform() && typeof AspirantXWallpaper.openOemBatterySettings === 'function') {
      return await AspirantXWallpaper.openOemBatterySettings();
    }
    return { success: false, error: 'not_supported' };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

const WALLPAPER_PROMPT_KEY = 'aspirantx_live_wallpaper_prompt_dismissed_until';

export function shouldPromptWallpaperSetup(): boolean {
  if (!isAndroidPlatform()) return false;
  try {
    const dismissedUntil = localStorage.getItem(WALLPAPER_PROMPT_KEY);
    if (dismissedUntil) {
      const time = parseInt(dismissedUntil, 10);
      if (!isNaN(time) && Date.now() < time) {
        return false;
      }
    }
    return true;
  } catch {
    return true;
  }
}

export function markWallpaperSetupDismissed(hours: number = 72): void {
  try {
    const until = Date.now() + hours * 60 * 60 * 1000;
    localStorage.setItem(WALLPAPER_PROMPT_KEY, until.toString());
  } catch {}
}

/**
 * Registers a robust app resume listener (Capacitor appStateChange + window focus)
 * so that when the user returns from Android's wallpaper preview or settings,
 * the app immediately re-verifies the authoritative wallpaper state.
 */
export function addWallpaperResumeListener(callback: () => void): () => void {
  let removeListener: (() => void) | null = null;
  if (Capacitor.isNativePlatform()) {
    const handlePromise = CapApp.addListener('appStateChange', (state) => {
      if (state.isActive) {
        callback();
      }
    });
    removeListener = () => {
      handlePromise.then(handle => handle.remove()).catch(() => {});
    };
  } else {
    const onFocus = () => callback();
    window.addEventListener('focus', onFocus);
    removeListener = () => {
      window.removeEventListener('focus', onFocus);
    };
  }
  return () => {
    if (removeListener) removeListener();
  };
}

