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
  version: '2.5.7',
  versionCode: 15,
  apkDownloadUrl: '/studyride.apk',
  apkFileName: 'StudyRide.apk',
  releaseDate: 'September 29, 2026',
  minSupportedVersion: '2.0.0',
  playStoreUrl: null,
  releaseNotes: 'v2.5.7: Focus Shield BLOCKS engine overhaul with instant App Group blocking, auto-refresh permissions upon returning from Android Settings, granular daily limits, and Google Play Protect compliance optimizations.',
};
