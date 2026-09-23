# ProTrack — Comprehensive Rewards, Achievements, Challenges, Focus Shield & Download Architecture Audit

**Date:** 2026-09-23  
**Status:** Complete  
**Scope:** Scratch-to-Production Architectural Inspection (Phase 0)  

---

## 1. Executive Summary

This audit establishes the baseline architectural state of the AspirantX / ProTrack repository across the Neon PostgreSQL authoritative database, Express backend API layer, React web frontend, and Android Capacitor native application. 

Currently:
- Gamification state (XP, Coins, Level, Streaks) is partially synchronized to Neon (`user_profiles`) but also relies heavily on client-side calculation and `localStorage` caching in `src/lib/gamification.ts`.
- Pomodoro sessions are persisted to `user_pomodoro_sessions` via `POST /api/user/study-sessions` and `POST /api/user/study-sessions/:id/complete`. However, duration verification is client-reported rather than server-measured.
- Tasks are persisted to `user_tasks` in Neon with complete CRUD and ownership controls.
- CBT exams are fully server-authoritative (`cbt_attempts`, `cbt_attempt_results`, `cbt_attempt_questions`) with row locking, cheat-proof projection, and tamper-proof scoring.
- Flashcards are persisted to `flashcards` and `flashcard_reviews` with spaced repetition Leitner boxes.
- **Trophies, Achievements, Challenges, and Focus Sessions do NOT currently exist as authoritative tables in Neon.** Existing "Reward Milestones" (`reward_milestones`, `reward_claims`) are tied to verified study hours for physical/digital kit delivery rather than an achievement engine.
- Android Capacitor project is fully operational with custom native plugins (`AspirantXWallpaperPlugin`), Android 15 compatibility, release keystore signing (`app-release.apk`, ~11.3 MB), and direct APK distribution (`/api/download/apk`, `/protrack.apk`).
- Android Focus Shield can be implemented natively using Android's official `VpnService` with per-app network routing (`addAllowedApplication()`), avoiding invasive and heavily restricted `AccessibilityService` or `QUERY_ALL_PACKAGES` APIs.

---

## 2. Component-by-Component Inspection

### 2.1 Current Reward / XP / Coin System
- **Database:** Neon `public.user_profiles` columns: `xp (integer)`, `coins (integer)`, `level (integer)`, `streak_days (integer)`, `last_active_date (date)`.
- **Backend Endpoints:**
  - `GET /api/user/rewards` & `GET /api/rewards/status` in `routes/user.routes.ts`: Returns streak, coins, and ad reward status.
  - `GET /api/rewards/streak` & `POST /api/rewards/claim-streak`: Updates daily streak and grants +20 XP.
  - `GET /api/rewards/milestones`: Returns physical/swag milestone tracks (e.g., Aspirant Starter Kit, Pen Set) requiring verified study hours.
  - `POST /api/rewards/claim`: Submits a claim for admin review (`reward_claims`).
- **Defects / Architectural Gaps:**
  - XP is currently adjusted opportunistically in various handlers (Pomodoro +20 XP, Streak +20 XP).
  - No central `study_event` bus exists; rewards are scattered and lack idempotent event logging.
  - No `achievements`, `user_achievements`, `challenges`, or `user_challenges` tables exist in Neon.

### 2.2 Current Pomodoro Persistence
- **Database:** Neon `public.user_pomodoro_sessions` columns:
  - `id (text)`
  - `user_id (uuid)`
  - `minutes (integer)`
  - `date (text)`
  - `created_at (timestamp with time zone)`
- **Backend Endpoints:**
  - `GET /api/user/study-sessions`: Queries recent 100 sessions.
  - `POST /api/user/study-sessions`: Inserts or updates a session.
  - `POST /api/user/study-sessions/:id/complete`: Records completion, calculates XP (`min(100, max(10, round(minutes * 2)))`), and triggers streak update.
- **Defects / Architectural Gaps:**
  - The client provides `completedDuration` directly. A compromised client or devtools user can submit `completedDuration: 180` without actually studying.
  - No heartbeat or timestamp-bound session state machine (`IDLE -> ACTIVE -> PAUSED -> COMPLETED`) exists on the server.

### 2.3 Current Tasks Persistence
- **Database:** Neon `public.user_tasks` columns:
  - `id (text)`
  - `user_id (uuid)`
  - `title (text)`
  - `subject (text)`
  - `priority (text)`
  - `minutes (integer)`
  - `status (text)`
  - `completed (boolean)`
  - `exam (text)`
  - `created_at (timestamp with time zone)`
  - `updated_at (timestamp with time zone)`
- **Backend Endpoints:**
  - `GET /api/user/tasks`: Loads tasks for authenticated user (`sub`).
  - `POST /api/user/tasks`: Creates a task.
  - `PUT /api/user/tasks/:id`: Updates task title, status (`TODO`, `IN_PROGRESS`, `DONE`), or completed flag.
  - `DELETE /api/user/tasks/:id`: Deletes task with IDOR check.
- **Evaluation:** Robust, secure, and properly indexed. Can easily emit `TASK_COMPLETED` events to the reward engine.

### 2.4 Current CBT Result Persistence
- **Database:** Neon `cbt_attempts` and `cbt_attempt_results`:
  - Fully authoritative with row-locking (`FOR UPDATE`).
  - Columns include: `score`, `accuracy_percent`, `total_questions`, `attempted_count`, `correct_count`, `incorrect_count`, `negative_marks_deducted`, `time_taken_seconds`, `subject_analysis`, `weak_areas`.
- **Evaluation:** Complete, robust, zero answer leakage. Emits `CBT_COMPLETED` and `QUESTION_SOLVED` events seamlessly.

### 2.5 Current Flashcard Events
- **Database:** Neon `flashcards` and `flashcard_reviews`:
  - Tracks user reviews: `rating ('easy' | 'hard')`, `leitner_box (integer 1-5)`, `next_review_at`, `review_count`.
- **Backend Endpoints:**
  - `POST /api/academic/flashcards/review`: Processes Leitner box promotion/demotion.
- **Evaluation:** Authoritative. Emits `FLASHCARD_REVIEWED` events seamlessly.

### 2.6 Current User Profile & Identity
- **Database:** Neon `user_profiles`:
  - Primary key: `id (uuid)`.
  - Columns: `xp`, `coins`, `level`, `is_premium`, `premium_until`, `streak_days`, `last_active_date`, `workspace_preferences`.
  - User identity is verified via JWT Bearer tokens or Edge cookies (`authMiddleware.ts` -> `extractVerifiedUserFromReq`).
- **Evaluation:** Authoritative and protected against IDOR.

### 2.7 Current Notification System
- **Database:** Neon `public.notifications`:
  - Columns: `id (text)`, `user_id (text)`, `email (text)`, `data (jsonb)`, `created_at`, `updated_at`.
- **Backend Endpoints:**
  - `GET /api/user/notifications` and `POST /api/user/notifications/mark-read`.
- **Evaluation:** Readily available for in-app notification toasts and bell badges.

### 2.8 Current Android / Capacitor Project
- **App ID / Namespace:** `com.aspirantx.app`
- **Capacitor Configuration:** `capacitor.config.json`
- **Installed Capacitor Plugins:**
  - `@capacitor/app@8.1.1`
  - `@capacitor/browser@8.0.4`
  - `@capacitor/filesystem@8.1.3`
  - `@capacitor/local-notifications@8.3.1`
  - `@capacitor/share@8.0.1`
- **Native Android Plugin:**
  - `AspirantXWallpaperPlugin.java` registered in `MainActivity.java`.
- **Build & Signing Toolchain:**
  - Gradle 8.13.0, Android Gradle Plugin 8.13.0.
  - Compile SDK 34/35, Target SDK 34, Min SDK 23.
  - Java 17 toolchain.
  - Keystore: `android/app/aspirantx-release-key.keystore` (Alias: `aspirantx`).
  - Output APK: `android/app/build/outputs/apk/release/app-release.apk` (11.3 MB).
  - Web asset sync: `npx cap sync android` copies `dist/` to `android/app/src/main/assets/public/`.

---

## 3. Android Focus Shield: Native Network Restriction Architecture

### 3.1 Android API Options Analysis

| Approach | Android API | How it Works | Google Play Compatibility | User Privacy | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Option A: Local VpnService** | `android.net.VpnService` with `addAllowedApplication()` | System routes network packets of *only selected apps* to a local TUN interface. The local TUN interface acts as a black hole (drops packets), cutting off their internet. | **Fully compliant.** Standard for digital wellbeing, firewall, and privacy apps. | **100% On-Device.** Zero traffic sent to remote servers. ProTrack traffic is unaffected. | **RECOMMENDED & CHOSEN** |
| **Option B: AccessibilityService** | `android.accessibilityservice.AccessibilityService` | Intercepts foreground window state events (`TYPE_WINDOW_STATE_CHANGED`) and forces the app to close or displays an overlay. | **Extremely High Risk.** Google Play strictly restricts Accessibility API for non-disability use cases. Apps face immediate removal unless meeting narrow accessibility criteria. | Reads window content and package names. | **REJECTED (Play Policy Hazard)** |
| **Option C: UsageStats + System Alert Window** | `UsageStatsManager` + `SYSTEM_ALERT_WINDOW` | Polls foreground package every second and draws a blocking floating window over distracting apps. | High battery drain, latency (user sees Instagram for 1-2 sec before overlay appears), requires invasive "Display over other apps" + "Usage access" permissions. | Moderate. | **REJECTED** |
| **Option D: Broad Package Scan** | `QUERY_ALL_PACKAGES` | Scans all installed apps on device to list them. | **Violates Google Play Policy.** Google restricts `QUERY_ALL_PACKAGES` only to device search, antivirus, and backup apps. Study apps are explicitly rejected. | Low. | **STRICTLY REJECTED** |

### 3.2 Chosen Technical Architecture: Local `FocusShieldVpnService`
1. **Curated App Selection (No `QUERY_ALL_PACKAGES`):**
   - The user interface provides a curated set of verified high-distraction social and video apps:
     - **YouTube:** `com.google.android.youtube`
     - **Instagram:** `com.instagram.android`
     - **Facebook:** `com.facebook.katana`
     - **Snapchat:** `com.snapchat.android`
     - **Reddit:** `com.reddit.frontpage`
     - **X (Twitter):** `com.twitter.android`
   - Only selected apps are passed to the native plugin.
2. **`VpnService.Builder` Configuration:**
   ```java
   VpnService.Builder builder = new VpnService.Builder();
   builder.setSession("ProTrack Focus Shield");
   builder.addAddress("10.254.1.1", 32);
   builder.addRoute("0.0.0.0", 0);
   // Route ONLY the selected distracting apps:
   for (String pkg : selectedPackages) {
       builder.addAllowedApplication(pkg);
   }
   builder.setBlocking(true);
   ParcelFileDescriptor vpnInterface = builder.establish();
   ```
3. **Traffic Black-Hole Engine:**
   - A lightweight background thread reads incoming packets from `vpnInterface` and immediately discards them.
   - Result: Instagram and YouTube receive network timeouts / "No internet connection". They cannot load Reels, Feeds, or Shorts.
   - All other applications (ProTrack, WhatsApp, Web Browser, Google Docs, etc.) are **not** in the allowed list and therefore **bypass the VPN completely**, maintaining high-speed normal internet connection.
4. **Lifecycle & Foreground Service:**
   - Runs as a Foreground Service with an ongoing notification: *"Focus Shield Active — Distracting apps restricted"*.
   - When the user pauses, finishes, or cancels the session, the VPN interface is cleanly closed and normal connectivity restores instantly.

---

## 4. Anti-Cheat & Server-Authoritative Focus Session Model

To prevent students from minimizing the app, browsing social media, or manipulating local clocks to earn trophies:
1. **Server-Authoritative Session Lifecycle:**
   - `POST /api/focus/sessions/start`: Initializes session on server with server timestamp `started_at`, requested duration, and selected apps.
   - `POST /api/focus/sessions/:id/heartbeat`: Sent periodically by active timer (every 60 seconds). Updates `last_heartbeat_at`.
   - `POST /api/focus/sessions/:id/pause`: Freezes elapsed verified seconds on server.
   - `POST /api/focus/sessions/:id/resume`: Re-anchors active timestamp.
   - `POST /api/focus/sessions/:id/complete`: Server computes:
     $$\text{verified\_seconds} = \min(\text{requested\_seconds}, \Delta(\text{resumed\_at} \to \text{completed\_at}) + \text{accumulated\_seconds})$$
   - If heartbeats are missing or elapsed time is far below requested duration, only the *actual verified minutes* are credited.
2. **One Continuous Event Pipeline:**
   - Completion triggers `POMODORO_COMPLETED` and `FOCUS_SESSION_COMPLETED` events in the central Reward Engine.
   - The engine updates daily/weekly challenge progress and evaluates achievement thresholds.

---

## 5. Download Page Architecture

- **Web Route:** `/download` (and ActiveTab `download`).
- **Real Release Artifacts:**
  - Android APK: `/protrack.apk` and `/api/download/apk` pointing directly to `public/protrack.apk` (mirrored from `android/app/build/outputs/apk/release/app-release.apk`).
  - Size: ~11.3 MB.
  - Direct QR Code generation encoding the canonical production download URL (`https://aspirantx.vercel.app/protrack.apk`).
- **iOS Handling:**
  - Accurately labeled *"iOS App — Coming Soon"*. No fake App Store links.
- **Trust Section:**
  - Real claims: *"On-device network filtering"*, *"Local VPN with zero data collection"*, *"Server-verified study tracking"*, *"No advertisements during focus"*. No fake "256-bit military encryption" buzzwords.

---

## 6. Audit Verdict
All prerequisites for Phase 1 (Product Specification) and Phase 2 (Implementation) are satisfied. The native Android VpnService is technically viable, Play Store compliant, privacy-preserving, and integrates cleanly with our Capacitor architecture.
