# ASPIRANTX — DATA AUTHORITY MATRIX & ARCHITECTURE VERIFICATION

**Document Version**: 1.0.0-Enterprise  
**Date**: September 4, 2026  
**Status**: Authoritative Architectural Specification  

---

## 1. Forensic Architecture Verification

### 1.1 The "SQLite / Cloudflare D1" Investigation Finding
A previous report summary mistakenly cited:
> *"Node/Express + SQLite D1"*

A comprehensive forensic audit of the repository was conducted:
- `package.json` contains: `express`, `@supabase/supabase-js`, `@supabase/ssr`, `@google/genai`, `@capacitor/core`, `@capacitor/android`.
- Zero occurrences of `better-sqlite3`, `sqlite3`, `libsql`, `drizzle`, `wrangler`, `@cloudflare/d1`, or `D1Database`.
- **Verdict**: The claim that AspirantX uses SQLite or Cloudflare D1 was an erroneous assumption in a previous summary. The actual production architecture is **Node.js/Express + Supabase PostgreSQL (v2 format)** with an in-memory/JSON disk fallback (`.data/admin_store.json`) and client-side **IndexedDB** (`src/lib/localDatabase.ts`).

### 1.2 Actual System Architecture
1. **Primary Database & Source of Truth**: **Supabase PostgreSQL** hosted at `https://ixwpkzorjutnhpnybuvx.supabase.co` with service role keys and Row-Level Security.
2. **Server Runtime**: Node.js + Express (`server.ts` compiled to `dist/server.cjs`), proxying requests, verifying tokens, and hosting administrative API endpoints.
3. **Server Emergency Backup**: In-memory Maps and Sets synchronized to `.data/admin_store.json` via `saveAdminStoreToDisk()`.
4. **Client-Side Cache & Offline Persistence**: Browser **IndexedDB** (`src/lib/localDatabase.ts` and `src/lib/contentPackageManager.ts`) + `localStorage` for offline study packs, syllabus tracking, and offline quiz completion.
5. **Mobile Shell**: Capacitor Android (`@capacitor/android`) communicating with the same Express/Supabase backend.

---

## 2. Data Authority Matrix Across All Domains

| Domain | Source of Truth | Read Path | Write Path | Cache | Fallback | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **Auth** | Supabase Auth (`auth.users`) | `supabase.auth.getUser()`, `extractVerifiedUserFromReq()` | `supabase.auth.signUp()`, `supabase.auth.signInWithPassword()`, OAuth | `localStorage` (`sb-*-auth-token`), in-memory session | Development JWT (`JWT_SECRET`) if Supabase offline | **PASS** |
| **Users** | Supabase `user_profiles` | `GET /api/user/profile`, Supabase client | `POST /api/user/profile`, `supabase.auth.updateUser()` | In-memory `AuthContext` state | In-memory `adminUsersDb` in `routes/shared.ts` | **PASS** |
| **Profiles** | Supabase `user_profiles` | `GET /api/user/profile` -> `supabaseServer.from('user_profiles')` | `POST /api/user/profile` -> `supabaseServer.from('user_profiles').upsert(...)` | `localStorage` (`aspirantx_profile_*`) | In-memory user state | **PASS** |
| **Subscriptions** | Supabase `subscriptions` | `GET /api/user/subscription` -> `serverSubscriptionsDb` / Supabase | Webhook `/api/payments/razorpay/webhook`, `/api/payments/verify`, Admin grant | Server `serverSubscriptionsDb` Map | `.data/admin_store.json` | **PASS** |
| **Payments** | Razorpay Gateway + Supabase `orders` | `GET /api/user/orders`, `GET /api/admin/orders` | `POST /api/payments/create-order`, `/api/payments/verify` | Server `serverOrdersDb` Map | `.data/admin_store.json` | **PASS** |
| **Orders** | Supabase `orders` | `GET /api/user/orders` -> `supabaseServer.from('orders')` | `POST /api/payments/create-order` -> `supabaseServer.from('orders').upsert(...)` | In-memory `serverOrdersDb` | Local disk `.data/admin_store.json` | **PASS** |
| **Syllabus** | Supabase `user_syllabus_progress` + Static Curriculum | `GET /api/user/syllabus-progress`, `personalSyllabus.ts` | `POST /api/user/syllabus-progress` -> `supabaseServer.from('user_syllabus_progress').upsert(...)` | Client IndexedDB (`localDatabase.ts`), `localStorage` | Bundled `INITIAL_SYLLABUS_HIERARCHY` (`src/data/academicData.ts`) | **PASS** |
| **Questions** | Static Bundled Data + Supabase `user_manual_questions` | `contentPackageManager.ts`, `routes/academic.routes.ts` | Admin Upload / Manual Creator -> `user_manual_questions` table | Client IndexedDB `questions` store | Bundled `INITIAL_QUESTION_BANK` | **PASS** |
| **PYQ (1991–2026)** | Bundled Academic Archive + Supabase `pyqs` | `contentPackageManager.ts`, `routes/academic.routes.ts` | Admin PYQ Importer in `routes/admin.routes.ts` | IndexedDB `pyqs` store | Bundled `INITIAL_PYQS_DATABASE` (35 years) | **PASS** |
| **CBT Tests** | Server Templates (`academic.routes.ts`) + Supabase `cbt_tests` | `GET /api/cbt/tests`, `GET /api/cbt/tests/:id` | Admin CBT Creator, AI Test Generator | Client memory state | Standard built-in exam templates | **PASS** |
| **CBT Results** | Supabase `cbt_results` | `GET /api/cbt/results/:userId`, `GET /api/cbt/result/:attemptId` | `POST /api/cbt/submit` (Server-authoritative calculation: $+2.0 / -0.66$) | IndexedDB `cbt_results` store | Client offline sync queue (`syncWorker.ts`) | **PASS** |
| **Progress** | Supabase `user_pomodoro_sessions`, `syllabus_time_log` | `GET /api/user/analytics`, `dailyStudyTracker.ts` | `POST /api/user/pomodoro/complete`, `POST /api/user/study-time` | `dailyStudyTracker.ts` in `localStorage` + IndexedDB | Local progress calculation | **PASS** |
| **Community** | Supabase `community_posts`, `community_comments` | `GET /api/community/posts` in `routes/community.routes.ts` | `POST /api/community/posts`, `POST /api/community/comments` | In-memory `serverCommunityPostsDb` | `.data/admin_store.json` | **PASS** |
| **Notifications** | Supabase `user_notifications` | `GET /api/user/notifications` | `POST /api/user/notifications/read`, Server triggers | Client memory state | In-memory notifications list | **PASS** |
| **Rewards / XP** | Supabase `user_profiles` (`xp`, `coins`, `streak`) | `GET /api/user/profile`, `gamification.ts` | `POST /api/user/gamification/award` -> `user_profiles` | `localStorage` (`aspirantx_gamification_*`) | Client gamification engine (`gamification.ts`) | **PASS** |
| **Teacher** | Supabase `teacher_profiles`, `teacher_courses` | `routes/teacher.routes.ts` | `routes/teacher.routes.ts` mutation endpoints | In-memory `teacherDb` | In-memory state in `teacher.routes.ts` | **PASS** |
| **Admin** | Supabase `admin_settings`, `feature_flags`, `admin_content` | `routes/admin.routes.ts` (RBAC verified) | `routes/admin.routes.ts` (Writes to Supabase + calls `saveAdminStoreToDisk()`) | In-memory settings objects | Local disk `.data/admin_store.json` | **PASS** |
| **Analytics** | Server Aggregated + Supabase Logs | `GET /api/admin/analytics`, `GET /api/user/analytics` | Background logging via `recordAdminAuditLog()`, `user_error_logs` | In-memory rolling metrics | Local audit log buffer | **PASS** |
| **AI** | Google Gemini 2.5 API via Server Proxy | `POST /api/ai/chat`, `POST /api/ai/generate-test` | Ephemeral inference / conversation context | In-memory prompt deduplicator (`apiDeduplicator.ts`) | Deterministic fallback question generator | **PASS** |
| **Files / Storage**| Supabase Storage Buckets + Local `/public` | Public Supabase Storage URL / Local URL | Multi-part uploads via `multer` in `routes/admin.routes.ts` | Browser HTTP Cache / CDN | Local static files | **PASS** |

---

## 3. Data Safety & Non-Destructive Integrity Confirmation

1. **Zero Destructive Migrations**: No database tables, columns, or records have been dropped, truncated, or overwritten.
2. **Dual-Read & Dual-Write Architecture**:
   - Write operations write directly to Supabase if connected, while updating in-memory cache and `.data/admin_store.json`.
   - Read operations attempt Supabase first; if unconfigured or unreachable, they gracefully fall back to local in-memory stores and offline IndexedDB.
3. **Data Divergence Prevention**:
   - On server startup, `hydrateFromPrimaryDatabase()` safely pulls global settings (`admin_settings`, `feature_flags`, `admin_content`) from Supabase with a bounded 5000ms timeout, ensuring that local memory matches cloud configuration without causing an unbounded data storm.
