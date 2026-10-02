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
  version: '2.7.0',
  versionCode: 21,
  apkDownloadUrl: '/studyride.apk',
  apkFileName: 'StudyRide.apk',
  releaseDate: 'October 2, 2026',
  minSupportedVersion: '2.0.0',
  playStoreUrl: null,
  releaseNotes: 'v2.7.0: Universal Indian Competitive Exam CBT Engine, multi-timing models, strict section locking, bilingual presentation, virtual numerical keypads, and mobile test engine.',
};
