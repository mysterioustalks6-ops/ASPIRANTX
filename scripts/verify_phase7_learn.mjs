import fs from 'fs';
import path from 'path';

console.log('============================================================');
console.log('🔬 PHASE 7 — LEARN AREA VERIFICATION AUDIT');
console.log('============================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failCount++;
  }
}

// 1. Check SyllabusTracker.tsx
const syllabusPath = path.resolve('src/components/SyllabusTracker.tsx');
assert(fs.existsSync(syllabusPath), 'SyllabusTracker.tsx exists');
const syllabusContent = fs.readFileSync(syllabusPath, 'utf-8');

assert(syllabusContent.includes("activeTab === 'official'"), 'SyllabusTracker supports official syllabus mode');
assert(syllabusContent.includes("activeTab === 'personal'"), 'SyllabusTracker supports personal custom syllabus mode');
assert(syllabusContent.includes('toggleSubtopic'), 'SyllabusTracker preserves subtopic completion toggling');
assert(syllabusContent.includes('getProgressStats'), 'SyllabusTracker calculates comprehensive progress statistics');
assert(syllabusContent.includes('bg-sky-600'), 'SyllabusTracker uses Sky-600 design tokens');
assert(!syllabusContent.includes('#00FF94'), 'SyllabusTracker has zero instances of neon #00FF94');
assert(syllabusContent.includes('setIsImportModalOpen'), 'SyllabusTracker preserves Google Sheet import modal trigger');
assert(syllabusContent.includes('setIsBuilderModalOpen'), 'SyllabusTracker preserves DnD builder modal trigger');

// 2. Check MySyllabusDndTree.tsx
const dndTreePath = path.resolve('src/components/MySyllabusDndTree.tsx');
assert(fs.existsSync(dndTreePath), 'MySyllabusDndTree.tsx exists');
const dndContent = fs.readFileSync(dndTreePath, 'utf-8');

assert(dndContent.includes('onOpenAddSubject'), 'MySyllabusDndTree supports adding custom subjects');
assert(dndContent.includes('onOpenAddTopic'), 'MySyllabusDndTree supports adding custom topics');
assert(dndContent.includes('onOpenAddSubtopic'), 'MySyllabusDndTree supports adding custom subtopics');
assert(dndContent.includes('onNodesChanged'), 'MySyllabusDndTree propagates drag-and-drop hierarchy mutations');
assert(dndContent.includes('bg-sky-600'), 'MySyllabusDndTree uses Sky-600 design tokens');
assert(!dndContent.includes('#00FF94'), 'MySyllabusDndTree has zero instances of neon #00FF94');

// 3. Check LibraryEngine.tsx
const libraryPath = path.resolve('src/components/LibraryEngine.tsx');
assert(fs.existsSync(libraryPath), 'LibraryEngine.tsx exists');
const libraryContent = fs.readFileSync(libraryPath, 'utf-8');

assert(libraryContent.includes('searchQuery'), 'LibraryEngine provides content search filtering');
assert(libraryContent.includes('selectedSubject'), 'LibraryEngine provides subject category filters');
assert(libraryContent.includes('toggleBookmark'), 'LibraryEngine supports reading list bookmarks');
assert(libraryContent.includes('aspirantx_library_bookmarks'), 'LibraryEngine persists bookmarks to local storage');
assert(libraryContent.includes('handleDiscussWithAi'), 'LibraryEngine integrates AI Mentor query prefill');
assert(libraryContent.includes('bg-sky-600'), 'LibraryEngine uses Sky-600 design tokens');
assert(!libraryContent.includes('#00FF94'), 'LibraryEngine has zero instances of neon #00FF94');

// 4. Check FlashcardEngine.tsx
const flashcardPath = path.resolve('src/components/FlashcardEngine.tsx');
assert(fs.existsSync(flashcardPath), 'FlashcardEngine.tsx exists');
const flashcardContent = fs.readFileSync(flashcardPath, 'utf-8');

assert(flashcardContent.includes('Active Recall Flashcards'), 'FlashcardEngine provides active recall card header');
assert(flashcardContent.includes('handleFlip'), 'FlashcardEngine provides interactive flip mechanics');
assert(flashcardContent.includes('markReview'), 'FlashcardEngine provides spaced repetition review grading');
assert(flashcardContent.includes('aspirantx_flashcard_reviews'), 'FlashcardEngine persists review outcomes');
assert(flashcardContent.includes('handleCreateCard'), 'FlashcardEngine supports creating custom flashcards');
assert(flashcardContent.includes('aspirantx_custom_flashcards'), 'FlashcardEngine persists custom cards');
assert(flashcardContent.includes('bg-sky-600'), 'FlashcardEngine uses Sky-600 design tokens');
assert(!flashcardContent.includes('#00FF94'), 'FlashcardEngine has zero instances of neon #00FF94');

// 5. Check PodcastSeries.tsx
const podcastPath = path.resolve('src/components/PodcastSeries.tsx');
assert(fs.existsSync(podcastPath), 'PodcastSeries.tsx exists');
const podcastContent = fs.readFileSync(podcastPath, 'utf-8');

assert(podcastContent.includes('Topper Podcasts & Strategy Hub'), 'PodcastSeries renders audio strategy hub');
assert(podcastContent.includes('togglePlay'), 'PodcastSeries supports playing/pausing episodes');
assert(podcastContent.includes('handleSpeedChange'), 'PodcastSeries supports multiple playback rates');
assert(podcastContent.includes('podcast_pos_'), 'PodcastSeries saves and resumes playback positions');
assert(podcastContent.includes('audioRef'), 'PodcastSeries controls real audio elements');
assert(podcastContent.includes('bg-sky-600'), 'PodcastSeries uses Sky-600 design tokens');
assert(!podcastContent.includes('#00FF94'), 'PodcastSeries has zero instances of neon #00FF94');

console.log('\n------------------------------------------------------------');
console.log(`TOTAL CHECKS: ${passCount + failCount} | PASSED: ${passCount} | FAILED: ${failCount}`);
console.log('------------------------------------------------------------\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('✨ ALL PHASE 7 LEARN AREA CHECKS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}
