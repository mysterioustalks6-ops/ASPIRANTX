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
  version: '2.4.0',
  versionCode: 1,
  apkDownloadUrl: '/aspirantx.apk',
  apkFileName: 'AspirantX.apk',
  releaseDate: 'September 2026',
  minSupportedVersion: '2.0.0',
  playStoreUrl: null,
  releaseNotes: 'Offline Habit Wallpaper Engine, 35-Yr PYQ archive, CBT Mock Simulator, and AI Study Mentor.',
};
