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
  version: '2.6.1',
  versionCode: 19,
  apkDownloadUrl: '/studyride.apk',
  apkFileName: 'StudyRide.apk',
  releaseDate: 'October 2, 2026',
  minSupportedVersion: '2.0.0',
  playStoreUrl: null,
  releaseNotes: 'v2.6.1: Instant exam search modal, classic Pomodoro focus sprint with cosmic audio synth, JEE Main & Advanced subtopics syllabus integration, and 10,000 questions question bank.',
};
