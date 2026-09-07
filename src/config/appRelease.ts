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
  version: '2.4.2',
  versionCode: 3,
  apkDownloadUrl: '/protrack.apk',
  apkFileName: 'ProTrack.apk',
  releaseDate: 'September 7, 2026',
  minSupportedVersion: '2.0.0',
  playStoreUrl: null,
  releaseNotes: 'Rebranded to ProTrack: Streamlined secure login flow, 26k+ PYQ & Question Bank live connection, Native Dynamic Streak Wallpaper, CBT Mock Simulator, and AI Study Mentor.',
};
