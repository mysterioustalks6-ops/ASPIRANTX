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
  version: '2.4.1',
  versionCode: 2,
  apkDownloadUrl: '/aspirantx.apk',
  apkFileName: 'AspirantX.apk',
  releaseDate: 'September 5, 2026',
  minSupportedVersion: '2.0.0',
  playStoreUrl: null,
  releaseNotes: '26k+ PYQ & Question Bank live connection, Native Dynamic Streak Wallpaper, CBT Mock Simulator, and AI Study Mentor.',
};
