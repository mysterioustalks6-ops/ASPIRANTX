/**
 * Canonical Application Release & Download Configuration
 * Single Source of Truth for App Version, Download Destination, and Distribution.
 */

export interface AppReleaseConfig {
  version: string;
  versionCode: number;
  apkDownloadUrl: string;
  apkFileName: string;
  releaseDate: string;
  minSupportedVersion: string;
  playStoreUrl: string | null;
  releaseNotes: string;
}

export const CANONICAL_APP_RELEASE: AppReleaseConfig = {
  version: '2.5.3',
  versionCode: 14,
  apkDownloadUrl: '/studyride.apk',
  apkFileName: 'StudyRide.apk',
  releaseDate: 'September 25, 2026',
  minSupportedVersion: '2.0.0',
  playStoreUrl: null,
  releaseNotes: 'v2.5.3: Blocking engine overhaul — Shorts & Reels toggles start OFF by default, 2x faster foreground detection (3s window, 500ms poll), YouTube Study Mode fixed, toggle OFF now correctly unblocks apps. Plus OLED Dark theme, Focus Shield Pro, App Limits & Avatar Studio.',
};
