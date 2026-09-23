# ASPIRANTX CBT ENGINE SPECIFICATION
**Version:** 3.0.0 (Production Architecture)  
**Status:** Authoritative Architectural Standard  
**Database Authority:** Neon PostgreSQL (`public` schema)  

---

## 1. Executive Summary & Principles
The AspirantX Computer Based Test (CBT) engine provides a rigorous, server-authoritative simulation of Indian competitive examinations (e.g. UPSC CSE, NEET UG, JEE Main, SSC CGL, RRB, GATE, State PSCs).

### Invariant Rules
1. **Server-Authoritative Authority**: All state transitions (Attempt Start, Answer Record, Pause, Resume, Expiration, Submission, Score Evaluation) are executed and recorded in Neon PostgreSQL. Client-side timers, React state, `localStorage`, `sessionStorage`, and in-memory server caches are strictly non-authoritative.
2. **Cheat-Proof Live Projections**: During an active examination, **the backend database query executes a safe projection that excludes `correct_answer`, `explanation`, and `option_explanations`**. It is mathematically impossible for client-side network inspection to reveal answers prior to test submission.
3. **Strict Provenance & Verification Gate**: No question is marked `verified` merely because it exists in the codebase or was previously imported. Only questions with documented official origin and verified keys may enter student CBT generation. All other questions remain `pending_review` or `legacy_fallback`.
4. **Honest Inventory Reporting**: The question generator never substitutes unrelated topics or fabricates dummy questions when inventory is insufficient. If a student requests 20 questions on a topic that only has 11 verified questions, the system explicitly reports: *"Only 11 verified questions are available for this selection."*
5. **Durable Concurrency-Safe Timer**: Timers are computed as server-side timestamps (`expires_at`). Pausing locks the database row via `SELECT ... FOR UPDATE`, freezes remaining seconds, and rejects answer mutations while paused or expired.
6. **Result Immutability**: Once an attempt is evaluated and submitted, its result in `cbt_attempt_results` is permanent. Subsequent revisions to the question bank do not retroactively mutate historical student scores.

---

## 2. Core Entities & Lifecycle Specifications

### A. Question Model
The canonical `questions` entity in Neon PostgreSQL represents a single evaluatable academic question:
- `id` (VARCHAR(64), Primary Key): Deterministic or UUID identifier (e.g. `q_upsc_polity_01`).
- `exam_id` (VARCHAR(64), Indexed): Target exam identifier (e.g. `UPSC_CSE`, `NEET_UG`).
- `subject_id` / `subject` (VARCHAR(255), Not Null): Academic subject (e.g. `Indian Polity & Governance`).
- `unit_id` / `unit` (VARCHAR(255)): Academic unit.
- `chapter_id` / `chapter` (VARCHAR(255)): Academic chapter.
- `topic_id` / `topic` (VARCHAR(255)): Specific syllabus topic.
- `subtopic_id` / `subtopic` (VARCHAR(255)): Micro-syllabus subtopic.
- `question_type` (VARCHAR(32), Not Null): One of `mcq`, `numerical`, `assertion_reason`, `passage`.
- `question_text` (TEXT, Not Null): Core question stem. Supports standard mathematical text and LaTeX.
- `passage_text` (TEXT): Associated reading passage for comprehension/case questions.
- `assertion_text` (TEXT): Assertion statement for assertion-reason questions.
- `reason_text` (TEXT): Reason statement for assertion-reason questions.
- `options` (JSONB, Not Null): Array of option representations: `["Option A text", "Option B text", ...]`.
- `correct_answer` (INT, Not Null): Zero-indexed correct option integer (0, 1, 2, or 3).
- `explanation` (TEXT): Comprehensive rationale for the correct answer.
- `option_explanations` (JSONB): Object mapping option indices to reasons for incorrectness: `{"0": "...", "2": "..."}`.
- `difficulty` (VARCHAR(16), Not Null): `Easy`, `Medium`, or `Hard`.
- `marks` (NUMERIC, Not Null): Positive marks awarded on correct answer (e.g. 2.0 or 4.0).
- `negative_marks` (NUMERIC, Not Null): Marks deducted on incorrect answer (e.g. 0.66 or 1.0).
- `estimated_time_seconds` (INT): Recommended answering time.
- `source_type` (VARCHAR(32), Not Null): `PYQ`, `QUESTION_BANK`, `TEACHER_CREATED`, `ADMIN_CREATED`, `AI_GENERATED`.
- `source_id` (VARCHAR(128)): Foreign key/identifier in the originating dataset.
- `source_name` (VARCHAR(255)): Originating document title or gazette citation.
- `source_year` (INT): Applicable year for PYQs (e.g. 2024).
- `content_usage` (VARCHAR(32), Not Null): `structured_factual_information` or `verbatim_exam_content`.
- `verification_status` (VARCHAR(32), Not Null): `verified`, `pending_review`, `needs_rights_review`, `legacy_fallback`, `invalid_placeholder`, `blocked`.
- `created_by` (VARCHAR(128)): User ID or system identifier of creator.
- `created_at` / `updated_at` (TIMESTAMPTZ).

### B. Question Source & Provenance
Every question must preserve its provenance trail:
1. `PYQ`: Verbatim past-year question. Must cite official conducting agency and examination year. Subject to rights review.
2. `QUESTION_BANK`: Curated practice question from verified academic teams.
3. `TEACHER_CREATED`: Authored by an educator in the Teacher Portal. Belongs to the educator's workspace.
4. `ADMIN_CREATED`: Created by platform administrators for national mocks.
5. `AI_GENERATED`: Synthesized via LLM. Must remain explicitly labeled `AI_GENERATED` and cannot be converted to `PYQ`.

### C. Question Taxonomy
Taxonomy is data-driven and matches the verified syllabus tree for the exam:
```
Exam (e.g., UPSC_CSE)
  └── Subject (e.g., Indian Polity & Governance)
        └── Unit (e.g., Constitutional Framework)
              └── Chapter (e.g., Fundamental Rights)
                    └── Topic (e.g., Right to Equality)
                          └── Subtopic (e.g., Article 14 & Reasonable Classification)
```
- If an exam does not define units or subtopics, those fields remain `NULL`.
- The CBT engine never invents artificial taxonomy strings.
- Taxonomy-scoped tests (Topic Test, Chapter Test, Subtopic Test) strictly select questions possessing verified mappings to that exact node.

### D. Exam Blueprint
The `cbt_blueprints` table defines authoritative rules for examinations:
- `id` (VARCHAR(64), Primary Key)
- `exam_id` (VARCHAR(64), Not Null)
- `title` (VARCHAR(255), Not Null)
- `mode` (VARCHAR(32), Not Null): `full`, `subject`, `chapter`, `topic`, `subtopic`, `unit`, `quick`, `pyq`, `question_bank`, `mixed`, `custom`, `teacher`.
- `duration_seconds` (INT, Not Null): Total allowable time.
- `total_questions` (INT, Not Null): Standard question count.
- `sections` (JSONB, Not Null): Section definitions, including individual question counts, time bounds, and cutoffs.
- `marking_scheme` (JSONB, Not Null): `{ correct: number, incorrect: number, unattempted: number }`.
- `negative_marking` (NUMERIC, Not Null): Deduction per incorrect response.
- `allow_pause` (BOOLEAN, Not Null): Whether the exam permits pausing (National Mocks: `false`; Practice Tests: `true`).
- `navigation_rules` (JSONB): `{ allow_jump: boolean, allow_change_answer: boolean }`.
- `verification_status` (VARCHAR(32)): `verified` or `pending_review`.

### E. Exam Attempt Lifecycle
The `cbt_attempts` table manages live candidate attempts:
```
           ┌──────────┐
           │ CREATED  │
           └────┬─────┘
                │
                ▼
        ┌──────────────┐       Pause        ┌──────────┐
        │ IN_PROGRESS  ├───────────────────►│  PAUSED  │
        └───┬──────┬───┘◄───────────────────┴────┬─────┘
            │      │           Resume            │
     Submit │      │ Timer Expiry                │ Cancel
            ▼      ▼                             ▼
       ┌───────────────┐                   ┌───────────┐
       │   SUBMITTED   │                   │ CANCELLED │
       │  (Evaluated)  │                   └───────────┘
       └───────────────┘
```
Fields:
- `id` (UUID / VARCHAR(64), Primary Key)
- `user_id` (VARCHAR(128), Not Null, Indexed)
- `exam_id` (VARCHAR(64), Not Null)
- `blueprint_id` (VARCHAR(64))
- `mode` (VARCHAR(32), Not Null)
- `title` (VARCHAR(255), Not Null)
- `status` (VARCHAR(32), Not Null): `CREATED`, `IN_PROGRESS`, `PAUSED`, `SUBMITTED`, `EXPIRED`, `CANCELLED`.
- `duration_seconds` (INT, Not Null)
- `remaining_time_seconds` (INT, Not Null)
- `started_at` (TIMESTAMPTZ, Not Null)
- `paused_at` (TIMESTAMPTZ)
- `resumed_at` (TIMESTAMPTZ)
- `expires_at` (TIMESTAMPTZ, Not Null)
- `submitted_at` (TIMESTAMPTZ)
- `current_question_index` (INT, Default 0)
- `total_questions` (INT, Not Null)

### F. Attempt Question Snapshot
When an attempt is instantiated, questions are snapshotted into `cbt_attempt_questions`:
- `attempt_id` (VARCHAR(64), References `cbt_attempts(id)`)
- `question_id` (VARCHAR(64), References `questions(id)`)
- `position` (INT, 1-indexed stable display order)
- `selected_answer` (INT, Nullable: 0..3)
- `is_answered` (BOOLEAN, Default `false`)
- `is_marked` (BOOLEAN, Default `false`)
- `confidence_level` (VARCHAR(16), Nullable: `Sure`, `Maybe`, `Guess`)
- `time_spent_seconds` (INT, Default 0)
- `visited_at` (TIMESTAMPTZ)
- `answered_at` (TIMESTAMPTZ)
- Primary Key: `(attempt_id, question_id)`
- Unique: `(attempt_id, position)`

This guarantees that:
- Refreshing the browser or reopening on mobile **never reshuffles question order**.
- Upstream changes to the Question Bank never alter in-flight attempts.

### G. Answer Handling
- `POST /api/cbt/attempts/:id/answer`: Validates user ownership, verifies attempt is `IN_PROGRESS` and `NOW() <= expires_at`. Updates `selected_answer`, `confidence_level`, and increments `time_spent_seconds`.
- `POST /api/cbt/attempts/:id/clear`: Clears `selected_answer = NULL` and sets `is_answered = false`.
- Answers are rejected with `409 Conflict` if the attempt is `PAUSED`, `EXPIRED`, or `SUBMITTED`.

### H. Mark for Review
- `POST /api/cbt/attempts/:id/mark`: Toggles `is_marked = !is_marked`.
- Question Palette displays 5 distinct states:
  1. `Unvisited`: Gray / Neutral.
  2. `Visited & Unanswered`: Red / Alert border.
  3. `Answered`: Green / Check.
  4. `Marked for Review`: Purple / Flag.
  5. `Answered & Marked for Review`: Purple with Green pip.

### I & J. Pause & Resume Semantics
- **Pause**:
  1. Transaction begins (`BEGIN`).
  2. `SELECT * FROM cbt_attempts WHERE id = $1 FOR UPDATE`.
  3. Verify `blueprint.allow_pause === true` and `status === 'IN_PROGRESS'`.
  4. `remaining_time_seconds = MAX(0, EXTRACT(EPOCH FROM (expires_at - NOW())))`.
  5. If `remaining_time_seconds <= 0`, set `status = 'EXPIRED'`, auto-evaluate, and commit.
  6. Else set `status = 'PAUSED'`, `paused_at = NOW()`, `remaining_time_seconds = remaining_time_seconds`.
  7. Commit.
- **Resume**:
  1. Transaction begins (`BEGIN`).
  2. `SELECT * FROM cbt_attempts WHERE id = $1 FOR UPDATE`.
  3. Verify `status === 'PAUSED'`.
  4. `expires_at = NOW() + remaining_time_seconds * INTERVAL '1 second'`.
  5. Set `status = 'IN_PROGRESS'`, `resumed_at = NOW()`.
  6. Commit.

### K. Timer
- Timer authority resides strictly on the server via `expires_at`.
- Client runs a countdown ticker against `expires_at`.
- Local clock drift, tab sleeping, or device restarts do not grant extra time; when the client next communicates, the server checks `NOW() > expires_at` and automatically expires the attempt.

### L. Submission
- `POST /api/cbt/attempts/:id/submit`:
  1. Uses atomic transaction with row lock.
  2. If attempt is already `SUBMITTED`, immediately returns the existing result (idempotency).
  3. Transitions status to `SUBMITTED`, sets `submitted_at = NOW()`.
  4. Triggers the Evaluation Engine.

### M. Evaluation Engine
- Calculates:
  - `total_questions`
  - `attempted_count`
  - `unattempted_count`
  - `correct_count`
  - `incorrect_count`
  - `score` = `(correct_count * marks) - (incorrect_count * negative_marks)`
  - `accuracy_percent` = `(correct_count / attempted_count) * 100` (or 0 if attempted is 0)
  - `subject_analysis`, `chapter_analysis`, `topic_analysis`
  - `confidence_analysis`:
    - `correct_sure`, `correct_maybe`, `correct_guess`
    - `wrong_sure`, `wrong_maybe`, `wrong_guess`
  - `weak_areas`: Topics where accuracy < 50%.
- Writes record to `cbt_attempt_results`.

### N. Result Page
- Displays key performance indicators: Score, Accuracy, Time Taken, Correct, Incorrect, Negative Deductions.
- Performance breakdown by Subject, Chapter, and Topic.
- Factual confidence breakdown: *"3 of your 5 guessed answers were correct."*
- Action buttons: "Review All", "Review Mistakes", "Discuss with AI", "Practice Weak Topic".

### O. Review Mode
- `GET /api/cbt/attempts/:id/review`:
- **Only accessible after attempt status is `SUBMITTED` or `EXPIRED`**.
- Returns questions with:
  - Question stem and options
  - Candidate's `selected_answer`
  - Canonical `correct_answer`
  - Source explanation and option-level explanations
  - Confidence tag and time spent
- Filters: `All`, `Incorrect`, `Correct`, `Unattempted`, `Marked`, `Guessed`.

### P. Explanation Engine
- Explanation display includes explicit provenance badges:
  - `[Verified Explanation]`: Extracted from official commission keys or audited master sources.
  - `[Teacher Explanation]`: Authored by certified educator.
  - `[AI Explanation]`: Generated by AI tutor in post-exam discussion.
  - `[Explanation Unavailable]`: When official key does not provide narrative text.

### Q. Mistake Analysis ("Why was I wrong?")
- On any incorrect question, candidate can self-categorize their error:
  - `Concept Gap`
  - `Careless Error`
  - `Misread Question`
  - `Calculation Error`
  - `Memory Error`
  - `Confusion`
  - `Time Pressure`
  - `Guess`
  - `Other`
- Stored in `cbt_question_feedback`. Feeds personal learning loop analytics without making patronizing automated assumptions.

### R. Confidence & Guessing
- Candidate can optionally tag an answer as `Sure`, `Maybe`, or `Guess`.
- Stored per answer; aggregated in evaluation.
- Helps students calibrate risk and avoid negative marks on exams with harsh penalties.

### S. AI Discussion
- Available strictly in **Review Mode**.
- `POST /api/cbt/ai-discuss`:
  - Context sent to Gemini: question stem, options, user's answer, correct answer, explanation, subject/topic, candidate's mistake classification.
  - Response grounded in curriculum facts.
  - If Gemini API is unconfigured or unavailable, returns HTTP 503 with honest message: *"AI discussion is temporarily unavailable."*
  - Zero fake AI messages.

### T. Question Generator Service
- Reusable singleton service (`src/lib/cbt/questionGenerator.ts`).
- Supports 12 test modes:
  1. `QUICK_TEST`: 5–20 questions across exam or selected subject.
  2. `SUBTOPIC_TEST`: Targeted micro-topic drill.
  3. `TOPIC_TEST`: Single topic test.
  4. `CHAPTER_TEST`: Comprehensive chapter drill.
  5. `UNIT_TEST`: Unit-level test.
  6. `SUBJECT_TEST`: Full subject sectional test.
  7. `FULL_SYLLABUS_TEST`: Simulated exam matching blueprint.
  8. `PYQ_TEST`: Official past papers.
  9. `QUESTION_BANK_TEST`: Curated practice questions.
  10. `MIXED_TEST`: Combined PYQ + Question Bank.
  11. `CUSTOM_TEST`: Student-selected questions.
  12. `TEACHER_TEST`: Assigned by educator.
- Before creation: `getInventoryCount()` reports exact verified questions in database.
- If requested > available, returns `{ can_generate: false, available_count }`.

### U & V. Teacher Question & Exam System
- `teacher_exams` and `teacher_exam_questions` tables.
- Teacher authors questions with `source_type = 'TEACHER_CREATED'`, `created_by = teacher_id`.
- Teacher creates exam blueprint, selects questions, sets duration and marking, previews, and publishes.
- Published teacher exams run on the **exact same CBT engine** as official tests.
- Teacher view receives aggregated class analytics without exposing individual students' private auth tokens.

### W & X. PYQ & Question Bank Integration
- Both PYQs and Question Bank items reside in the canonical `questions` table with `source_type = 'PYQ'` and `source_type = 'QUESTION_BANK'` respectively.
- Strict verification gate: Only records with `verification_status = 'verified'` can be selected for student examinations.

### Y. Analytics
- Per-student historical tracking in `cbt_attempt_results`.
- Weakness detection surfaces topics with lowest accuracy to the Weakness Detector component.

### Z. Security & Authorization
- All attempt endpoints require authenticated Bearer token (`extractVerifiedUserFromReq`).
- Attempt ownership verification: `attempt.user_id === verifiedUser.sub`. Returns 403 Forbidden on mismatch.
- Dual projection strategy prevents live exam data leaks.
- Rate limiting on generation and submission routes.

---

## 3. Database Schema DDL

```sql
-- 1. Canonical Questions Table
CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(64) PRIMARY KEY,
  exam_id VARCHAR(64) NOT NULL,
  subject_id VARCHAR(64),
  unit_id VARCHAR(64),
  chapter_id VARCHAR(64),
  topic_id VARCHAR(64),
  subtopic_id VARCHAR(64),
  subject VARCHAR(255) NOT NULL,
  chapter VARCHAR(255),
  topic VARCHAR(255),
  subtopic VARCHAR(255),
  question_type VARCHAR(32) NOT NULL DEFAULT 'mcq',
  question_text TEXT NOT NULL,
  passage_text TEXT,
  assertion_text TEXT,
  reason_text TEXT,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer INT NOT NULL,
  explanation TEXT,
  option_explanations JSONB,
  difficulty VARCHAR(16) NOT NULL DEFAULT 'Medium',
  marks NUMERIC NOT NULL DEFAULT 2.0,
  negative_marks NUMERIC NOT NULL DEFAULT 0.66,
  estimated_time_seconds INT DEFAULT 60,
  source_type VARCHAR(32) NOT NULL DEFAULT 'QUESTION_BANK',
  source_id VARCHAR(128),
  source_name VARCHAR(255),
  source_year INT,
  content_usage VARCHAR(32) NOT NULL DEFAULT 'structured_factual_information',
  verification_status VARCHAR(32) NOT NULL DEFAULT 'pending_review',
  created_by VARCHAR(128) DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_exam_subject ON questions(exam_id, subject);
CREATE INDEX IF NOT EXISTS idx_questions_exam_topic ON questions(exam_id, topic);
CREATE INDEX IF NOT EXISTS idx_questions_source_status ON questions(source_type, verification_status);

-- 2. Exam Blueprints Table
CREATE TABLE IF NOT EXISTS cbt_blueprints (
  id VARCHAR(64) PRIMARY KEY,
  exam_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  mode VARCHAR(32) NOT NULL DEFAULT 'full',
  duration_seconds INT NOT NULL,
  total_questions INT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  marking_scheme JSONB NOT NULL DEFAULT '{"correct": 2, "incorrect": 0.66, "unattempted": 0}'::jsonb,
  negative_marking NUMERIC NOT NULL DEFAULT 0.66,
  allow_pause BOOLEAN NOT NULL DEFAULT true,
  navigation_rules JSONB DEFAULT '{"allow_jump": true, "allow_change_answer": true}'::jsonb,
  verification_status VARCHAR(32) NOT NULL DEFAULT 'verified',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Exam Attempts Table
CREATE TABLE IF NOT EXISTS cbt_attempts (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL,
  exam_id VARCHAR(64) NOT NULL,
  blueprint_id VARCHAR(64),
  mode VARCHAR(32) NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
  duration_seconds INT NOT NULL,
  remaining_time_seconds INT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  current_question_index INT NOT NULL DEFAULT 0,
  total_questions INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cbt_attempts_user ON cbt_attempts(user_id, status);

-- 4. Attempt Questions Table (Stable Ordered Question List)
CREATE TABLE IF NOT EXISTS cbt_attempt_questions (
  attempt_id VARCHAR(64) NOT NULL REFERENCES cbt_attempts(id) ON DELETE CASCADE,
  question_id VARCHAR(64) NOT NULL REFERENCES questions(id),
  position INT NOT NULL,
  selected_answer INT,
  is_answered BOOLEAN NOT NULL DEFAULT false,
  is_marked BOOLEAN NOT NULL DEFAULT false,
  confidence_level VARCHAR(16),
  time_spent_seconds INT NOT NULL DEFAULT 0,
  visited_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (attempt_id, question_id),
  CONSTRAINT uq_attempt_position UNIQUE (attempt_id, position)
);

-- 5. Attempt Results Table
CREATE TABLE IF NOT EXISTS cbt_attempt_results (
  id VARCHAR(64) PRIMARY KEY,
  attempt_id VARCHAR(64) NOT NULL UNIQUE REFERENCES cbt_attempts(id) ON DELETE CASCADE,
  user_id VARCHAR(128) NOT NULL,
  exam_id VARCHAR(64) NOT NULL,
  score NUMERIC NOT NULL,
  max_possible_score NUMERIC NOT NULL,
  accuracy_percent NUMERIC NOT NULL,
  total_questions INT NOT NULL,
  attempted_count INT NOT NULL,
  unattempted_count INT NOT NULL,
  correct_count INT NOT NULL,
  incorrect_count INT NOT NULL,
  negative_marks_deducted NUMERIC NOT NULL DEFAULT 0,
  time_taken_seconds INT NOT NULL,
  subject_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  chapter_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  topic_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
  weak_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cbt_results_user ON cbt_attempt_results(user_id, exam_id);

-- 6. Question Feedback / Mistake Analysis Table
CREATE TABLE IF NOT EXISTS cbt_question_feedback (
  id VARCHAR(64) PRIMARY KEY,
  attempt_id VARCHAR(64) NOT NULL REFERENCES cbt_attempts(id) ON DELETE CASCADE,
  question_id VARCHAR(64) NOT NULL REFERENCES questions(id),
  user_id VARCHAR(128) NOT NULL,
  mistake_category VARCHAR(32) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Teacher Exams Table
CREATE TABLE IF NOT EXISTS teacher_exams (
  id VARCHAR(64) PRIMARY KEY,
  teacher_id VARCHAR(128) NOT NULL,
  exam_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL,
  total_marks NUMERIC NOT NULL,
  negative_marking NUMERIC NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teacher_exam_questions (
  exam_id VARCHAR(64) NOT NULL REFERENCES teacher_exams(id) ON DELETE CASCADE,
  question_id VARCHAR(64) NOT NULL REFERENCES questions(id),
  position INT NOT NULL,
  marks NUMERIC NOT NULL DEFAULT 2,
  negative_marks NUMERIC NOT NULL DEFAULT 0.66,
  PRIMARY KEY (exam_id, question_id),
  CONSTRAINT uq_teacher_exam_position UNIQUE (exam_id, position)
);
```

---

## 4. REST API Endpoint Contracts

### 1. `GET /api/cbt/inventory`
- **Query Params**: `examId` (required), `mode`, `subject`, `chapter`, `topic`, `difficulty`, `sourceTypes`.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "examId": "UPSC_CSE",
    "availableCount": 24,
    "breakdown": {
      "verified": 24,
      "pendingReview": 10
    }
  }
  ```

### 2. `POST /api/cbt/attempts/create`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "examId": "UPSC_CSE",
    "mode": "QUICK_TEST",
    "subject": "Indian Polity & Governance",
    "count": 10
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "attempt": {
      "id": "att_6f8b...",
      "examId": "UPSC_CSE",
      "mode": "QUICK_TEST",
      "title": "Quick Practice — Indian Polity & Governance",
      "status": "IN_PROGRESS",
      "durationSeconds": 600,
      "remainingTimeSeconds": 600,
      "expiresAt": "2026-09-23T18:10:00.000Z",
      "totalQuestions": 10,
      "questions": [
        {
          "position": 1,
          "id": "q_polity_01",
          "questionType": "mcq",
          "questionText": "With reference to the Constitution of India...",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "marks": 2.0,
          "negativeMarks": 0.66,
          "subject": "Indian Polity & Governance",
          "topic": "Fundamental Rights",
          "selectedAnswer": null,
          "isAnswered": false,
          "isMarked": false,
          "confidenceLevel": null
        }
      ]
    }
  }
  ```
- **Error (422 Unprocessable Entity)**:
  ```json
  {
    "success": false,
    "error": "INSUFFICIENT_INVENTORY",
    "message": "Only 7 verified questions are available for this selection.",
    "availableCount": 7,
    "requestedCount": 10
  }
  ```

### 3. `POST /api/cbt/attempts/:id/answer`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "questionId": "q_polity_01",
    "selectedAnswer": 1,
    "confidenceLevel": "Sure",
    "timeSpentSeconds": 24
  }
  ```
- **Response (200 OK)**:
  ```json
  { "success": true, "questionId": "q_polity_01", "isAnswered": true }
  ```
- **Error (409 Conflict)**:
  ```json
  { "success": false, "error": "ATTEMPT_PAUSED", "message": "Cannot record answer while attempt is paused." }
  ```

### 4. `POST /api/cbt/attempts/:id/pause`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": "PAUSED",
    "pausedAt": "2026-09-23T18:04:12.000Z",
    "remainingTimeSeconds": 348
  }
  ```

### 5. `POST /api/cbt/attempts/:id/resume`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "status": "IN_PROGRESS",
    "resumedAt": "2026-09-23T18:05:00.000Z",
    "expiresAt": "2026-09-23T18:10:48.000Z",
    "remainingTimeSeconds": 348
  }
  ```

### 6. `POST /api/cbt/attempts/:id/submit`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "result": {
      "attemptId": "att_6f8b...",
      "score": 14.68,
      "maxPossibleScore": 20.0,
      "accuracyPercent": 80.0,
      "totalQuestions": 10,
      "attemptedCount": 10,
      "correctCount": 8,
      "incorrectCount": 2,
      "negativeMarksDeducted": 1.32,
      "timeTakenSeconds": 412,
      "weakAreas": []
    }
  }
  ```

### 7. `GET /api/cbt/attempts/:id/review`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)** (Exposes full answers and explanations ONLY after submission):
  ```json
  {
    "success": true,
    "questions": [
      {
        "position": 1,
        "id": "q_polity_01",
        "questionText": "...",
        "options": ["..."],
        "selectedAnswer": 1,
        "correctAnswer": 1,
        "isCorrect": true,
        "explanation": "Verified explanation from official key...",
        "explanationSource": "VERIFIED",
        "optionExplanations": { "0": "Incorrect because..." }
      }
    ]
  }
  ```

---

## 5. Architectural Non-Negotiables
1. No student examination client receives `correct_answer` or `explanation` before submission.
2. In-memory `Map` stores (`cbtTestsStore`, `questionBankStore`, `pyqStore`) are deprecated for authoritative attempt and question state.
3. Every test mode queries Neon PostgreSQL for inventory and question retrieval.
4. Physical Android devices must verify end-to-end functionality via local API bridge.
