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
  version: '2.6.2',
  versionCode: 20,
  apkDownloadUrl: '/studyride.apk',
  apkFileName: 'StudyRide.apk',
  releaseDate: 'October 2, 2026',
  minSupportedVersion: '2.0.0',
  playStoreUrl: null,
  releaseNotes: 'v2.6.2: Restored original native Focus Shield with app & shorts blocker, instant exam search modal, classic Pomodoro timer, and complete JEE syllabus.',
};
