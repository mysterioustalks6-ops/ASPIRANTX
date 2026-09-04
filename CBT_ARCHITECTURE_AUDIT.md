# AspirantX CBT Architecture Audit & Engineering Report

## Executive Summary
This document provides an end-to-end architectural audit of the Computer Based Test (CBT) engine across Desktop Web, Mobile Web, PWA, and Android/Capacitor. It identifies root causes for all reported symptoms—including missing/inaccessible submit buttons, submission failures, AI question schema mismatches, negative mark inversion, and Android API network routing—and defines the canonical fix plan.

---

## 1. Current CBT Architecture
- **Presentation Layer**: `src/components/CbtExamEngine.tsx` (single shared React component for all platforms).
- **Session State**: React state (`CbtExamSessionState`) + `localStorage` (`cbt_session_${testId}`).
- **Local Database Layer**: `src/lib/localDatabase.ts` (IndexedDB database `aspirantx_local_db`, store `content_cbt`).
- **Content Package Manager**: `src/lib/contentPackageManager.ts` (seeds initial offline content and syncs cloud packages).
- **Types & Schema**: `src/types.ts` (`CbtTest`, `CbtQuestion`, `CbtUserResponse`, `CbtExamSessionState`, `CbtExamResult`).
- **Static Seed Data**: `src/data/cbtData.ts` (`INITIAL_CBT_TESTS`).
- **Backend Routing**: `routes/academic.routes.ts` mounted at `/api/academic/cbt/*`.
- **Backend Data Stores**: `routes/shared.ts` (`cbtTestsStore`, `cbtResultsStore`, `adminCbtExamsStore`, `DEFAULT_CBT_MOCKS`).
- **AI Test Generator**: Gemini 2.0 Flash (`@google/genai`) invoked in `/api/academic/cbt/generate-custom`.
- **Exam ID Normalizer**: `src/lib/examRegistry.ts` (`normalizeExamId`) and `routes/shared.ts` (`normalizeExam`).

---

## 2. CBT Entry & Open Flow
```
User clicks CBT / Mock Tests
  → activeTab set to 'cbt' or 'cbt_exam' in App.tsx
  → Suspense wraps tab render
  → PremiumGate checks featureName="cbt"
  → CbtExamEngine mounts with userProfile and selectedExam
  → useEffect triggers fetchTests() & fetchLiveExams()
```
### Failure Points:
1. If user is in demo/guest mode and `aspirantx_guest_strict_lock` is enabled in `localStorage`, `PremiumGate` renders the demo lock modal.
2. `fetchTests()` queries `contentPackageManager.getLocalCbtTests(activeExamKey)`. If IndexedDB has records missing `sections` or `markingScheme`, the app loads corrupt test structures.
3. On Android/Capacitor, `fetch('/api/academic/cbt/tests')` tries to query `https://localhost/api/...` because `getApiUrl()` is not used.

---

## 3. Test Loading Flow
```
1. Instant Local-First: contentPackageManager.getLocalCbtTests(activeExamKey)
     ↓ (if empty or error)
2. Network Fetch: GET /api/academic/cbt/tests?exam=${activeExamKey}
     ↓ (if empty or error)
3. Static Fallback: INITIAL_CBT_TESTS filtered by activeExamKey
```
### Root Cause:
`LocalCbtRecord` in `localDatabase.ts` omits `sections: { name: string; totalQuestions: number }[]` and `markingScheme: { correct: number; incorrect: number }`, and stores `examId` instead of `exam`. When tests are loaded from IndexedDB, `test.sections` is `undefined`, causing runtime crashes on submit.

---

## 4. AI Test Generation Flow
```
UI (Custom Test Tab)
  → Select Exam, Subject, Topics, Count (10-50), Duration (10-60m), Difficulty
  → POST /api/academic/cbt/generate-custom
  → routes/academic.routes.ts calls Gemini 2.0 Flash
  → Raw text response cleaned with regex
  → JSON.parse(cleaned)
  → If parsing fails: generates placeholder fallback questions
  → Maps questions to test object:
      options: [{ id: 'opt_0', text: opt }] (INCOMPATIBLE WITH CbtQuestion)
      correctOptionId: 'opt_0'               (INCOMPATIBLE WITH CbtQuestion)
      negativeMarks: -1                      (INVERTED SIGN BUG)
  → Stores test in in-memory cbtTestsStore
  → Returns { success: true, test }
  → CbtExamEngine immediately starts test with handleStartExam(data.test)
```

---

## 5. Question Normalization Flow
Currently, **no canonical normalization pipeline exists**. There are three conflicting schemas:
1. `CbtQuestion` (`src/types.ts`): `options: string[]`, `correctOption: number` (0-indexed integer), `marks: number` (>0), `negativeMarks: number` (positive magnitude, e.g. 0.66 or 1.0).
2. `LocalCbtRecord` (`src/lib/localDatabase.ts`): `questions: any[]`, unvalidated.
3. Backend AI questions (`routes/academic.routes.ts`): `options: { id: string; text: string }[]`, `correctOptionId: string`, `negativeMarks: -1`.

---

## 6. Session State Flow
```
handleStartExam(test)
  → Creates initialResponses (idx === 0 ? 'not_answered' : 'not_visited')
  → Initializes CbtExamSessionState
  → Persists to localStorage ('cbt_session_' + test.id)
```
### Concurrency Race Condition:
Option selection and navigation use non-functional state updates:
`setSessionState({ ...sessionState, responses: ... })`
While the 1000ms timer interval is executing:
`setSessionState((prev) => { ... })`
When a user clicks an option or next button at the moment the interval fires, the state updates clash and the user's answer is lost.

---

## 7. Timer Flow
1. Current implementation counts ticks: `elapsedSeconds = prev.elapsedSeconds + 1`. When phone locks or tab is suspended, `setInterval` pauses, causing timer drift.
2. Auto-submission is executed as a side-effect inside the pure state reducer `setSessionState(prev => { handleFinalSubmit(prev); ... })`.
3. Fix: Use wall-clock time (`Date.now() - new Date(startTimeIso).getTime()`), run timer side-effects outside of state reducers, and prevent duplicate submissions.

---

## 8. Navigation Flow
- Controls: `Previous`, `Save & Next`, `Mark for Review & Next`, `Clear Response`, `Jump (Palette)`.
- **Last Question Bug**: When user is on question `N-1` (the last question), `handleNextQuestion` does nothing because `idx < length - 1` is false. The user clicks `Save & Next` repeatedly and nothing happens.
- Fix: On the last question, the primary forward action must transform into a clear `Save & Submit Exam` or trigger the submission confirmation modal.

---

## 9. Submit Flow
- Triggers:
  1. Desktop right sidebar bottom button.
  2. Mobile header button.
  3. Left pane bottom bar.
  4. Mobile palette drawer bottom.
  5. Timer expiry.
- **Why Submit Button Was Missing / Inaccessible**:
  1. The bottom bar was nested inside the scrollable question paper container (`flex-1 flex flex-col bg-white overflow-y-auto`). On questions with long stems, context passages, or multiple options, the bottom bar was pushed below the viewport fold.
  2. On mobile screens (width < 412px), having 5 large action buttons caused aggressive multi-line wrapping that overflowed beyond the screen height.
  3. If `selectedTest.sections` was undefined (from IndexedDB), `handleFinalSubmit` crashed on line 501: `selectedTest.sections.map(...)` with `TypeError: Cannot read properties of undefined (reading 'map')`.

---

## 10. Scoring Flow & Negative Marking Bug
```ts
// BUG in academic.routes.ts line 2863:
negativeMarks: -1

// Calculation in CbtExamEngine.tsx line 476:
score -= q.negativeMarks; // score -= (-1) => score += 1 !
```
Negative marking was accidentally awarding positive points for wrong answers on custom tests!
Canonical Rule:
- `marks` is always a positive number (e.g. 2.0 or 4.0).
- `negativeMarks` is always a positive magnitude (e.g. 0.66, 1.0).
- Deduction: `score -= Math.abs(negativeMarks)`.

---

## 11. Result Persistence Flow
1. Client calls `POST /api/academic/cbt/submit`.
2. Server evaluates responses, stores result in `cbtResultsStore` Map and Supabase `cbt_results` table.
3. Client saves to `localStorage` (`aspirantx_cbt_results_cache_${userId}_${examId}`).
4. Client enqueues result into `syncWorker.enqueueCbtResult` for durable IndexedDB sync.
5. Client clears active exam session from `localStorage`.
6. Client dispatches `aspirantx_cbt_results_updated` event.

---

## 12. IndexedDB & Cache Flow
- Store: `content_cbt`.
- Defect: `LocalCbtRecord` lacked `sections`, `markingScheme`, and renamed `exam` to `examId`.
- Fix: Ensure `LocalCbtRecord` stores all fields of `CbtTest` and `contentPackageManager.getLocalCbtTests()` returns fully valid `CbtTest` objects.

---

## 13. Backend API Flow
- `/api/academic/cbt/tests`: Serves tests by exam.
- `/api/academic/cbt/submit`: Evaluates test. If test is not found in memory (e.g. cold start), it must gracefully evaluate using submitted question payloads rather than hard-failing with 404.
- `/api/academic/cbt/generate-custom`: Generates questions using `getGeminiClient()` with strict JSON extraction, 4-option validation, and fallback to real question bank (`questionBankStore`).

---

## 14. Android / Capacitor Flow
- Web assets run under `https://localhost` on Android WebView.
- Relative URLs `fetch('/api/...')` fail on Android.
- Fix: Route all API requests through `getApiUrl(path)` from `src/lib/apiConfig.ts`.
- Fix: Add safe-area padding (`pb-safe`) and ensure header/bottom bars are strictly `flex-shrink-0` with scrollable question content between them.
