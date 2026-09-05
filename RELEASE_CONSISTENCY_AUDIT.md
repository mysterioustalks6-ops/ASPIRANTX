# AspirantX Master Cross-System Release & Consistency Audit

**Audit Date**: 2026-09-05  
**Canonical Release Version**: `2.4.1`  
**Android Release Build**: `versionCode 2`, `versionName "2.4.1"`  
**Audit Status**: **100% VERIFIED ACROSS ALL LAYERS**

---

## 1. Executive Cross-System Consistency Matrix

| System Layer | Canonical Identifier | Verified Value | Status | Evidence Source |
|---|---|---|---|---|
| **Root Package Manifest** | `package.json` | `"version": "2.4.1"` | **PASS** | [`package.json`](file:///c:/Users/AMBUJ%20YADAV/Documents/Aspirantx/package.json) |
| **Frontend Release Authority** | `src/config/appRelease.ts` | `version: '2.4.1'`, `versionCode: 2` | **PASS** | [`appRelease.ts`](file:///c:/Users/AMBUJ%20YADAV/Documents/Aspirantx/src/config/appRelease.ts) |
| **Android Build Configuration** | `android/app/build.gradle` | `versionCode 2`, `versionName "2.4.1"` | **PASS** | [`android/app/build.gradle`](file:///c:/Users/AMBUJ%20YADAV/Documents/Aspirantx/android/app/build.gradle) |
| **Backend Route Authority** | `routes/shared.ts` | `APP_VERSION = '2.4.1'` | **PASS** | [`routes/shared.ts`](file:///c:/Users/AMBUJ%20YADAV/Documents/Aspirantx/routes/shared.ts) |
| **Live Backend API Version** | `GET /api/version` | `{"version":"2.4.1"}` | **PASS** | HTTP 200 response |
| **Version Update Notifier** | `src/components/VersionUpdateNotifier.tsx` | Bound to `CANONICAL_APP_RELEASE` | **PASS** | Evaluates active version vs server |
| **Release Documentation** | `DOWNLOAD_ARCHITECTURE_AUDIT.md` | Synchronized to `v2.4.1` | **PASS** | [`DOWNLOAD_ARCHITECTURE_AUDIT.md`](file:///c:/Users/AMBUJ%20YADAV/Documents/Aspirantx/DOWNLOAD_ARCHITECTURE_AUDIT.md) |
| **Public Release Binary** | `public/aspirantx.apk` | Signed Release APK (v2.4.1, vc 2) | **PASS** | `aapt dump badging` & SHA-256 match |
| **HTTP Delivery Caching** | Express APK Endpoints | `Cache-Control: public, max-age=0, must-revalidate` | **PASS** | HTTP HEAD verified on 3 routes |
| **In-App Download UI** | Authenticated Student Navbar/Drawer/Modal | Exactly **0** in-app download CTAs | **PASS** | Header, Drawer, and Modal purged |
| **Public Landing Page CTA** | `src/components/LandingPage.tsx` | Exactly **1** public download button (`#landing-download-app-btn`) | **PASS** | Top navigation bar |
| **Live Wallpaper Service** | `AspirantXWallpaperService` | Packaged in DEX, active in system | **PASS** | `dumpsys wallpaper` proof (`mWhich=3`) |
| **Question Pipeline** | Supabase Backend (`question_bank` + `pyqs`) | **26,553** total real questions accessible | **PASS** | `verify_production_question_pipeline.mjs` |

---

## 2. Release Binary Proof & Integrity Verification

### Binary Characteristics
- **File Path**: `public/aspirantx.apk` (and aliases `dist/aspirantx.apk`, `public/AspirantX-v2.4.1.apk`)
- **File Size**: `5,426,097 bytes (~5.4 MB)`
- **SHA-256 Hash**:
  ```text
  9D40272D85A8FFE4F4C7587224AD1C77A15DBBB9085BA725626CF5D5B9989709
  ```
- **Signing Keystore**: Signed with release keystore `aspirantx-release-key.keystore` (SHA-256 fingerprint verified)
- **APK Badging Dump**:
  ```text
  package: name='com.aspirantx.app' versionCode='2' versionName='2.4.1' compileSdkVersion='36' compileSdkVersionCodename='16'
  application-label:'AspirantX'
  ```

### Bytecode & Asset Audit (`classes.dex` & JS Assets)
1. **Live Wallpaper Service Present**:
   - Class `com.aspirantx.app.AspirantXWallpaperService` present in `classes.dex`.
   - String constants verified: `CHANGE_LIVE_WALLPAPER`, `WallpaperManager`, `streak`, `pendingUpdate`, `persona_id`.
2. **Capacitor Plugin Bridge Present**:
   - `AspirantXWallpaperPlugin` registered in `MainActivity.java` and bundled in DEX.
   - Client JS bundle `dist/assets/index-Bys43xot.js` includes the `AspirantXWallpaper` bridge caller.
3. **Bloat Fix Verified**:
   - Resolved prior recursive asset packaging bug by adding `:!*.apk` to `aaptOptions.ignoreAssetsPattern`. Size dropped from 81.4MB to a clean 5.4MB.

---

## 3. Server Delivery & Anti-Stale Caching Proof

All 3 download endpoints serve the canonical release binary with strict cache revalidation headers:

```http
HTTP/1.1 200 OK
Cache-Control: public, max-age=0, must-revalidate
Content-Type: application/vnd.android.package-archive
Content-Disposition: attachment; filename="AspirantX.apk"
Content-Length: 5426097
```

- Endpoint 1: `GET /aspirantx.apk` -> Status 200, 5,426,097 bytes.
- Endpoint 2: `GET /AspirantX.apk` -> Status 200, 5,426,097 bytes.
- Endpoint 3: `GET /AspirantX-v2.4.1.apk` -> Status 200, 5,426,097 bytes.

---

## 4. UI Audit — Public vs In-App Download Controls

| Location | Expected State | Actual State | Verified Evidence |
|---|---|---|---|
| **Public Landing Page** | Exactly ONE canonical Download CTA | **1** CTA (`#landing-download-app-btn`) | Top navigation bar with version badge `v2.4.1` |
| **Authenticated Header** | ZERO download buttons | **0** download buttons | Verified in [`src/components/Header.tsx`](file:///c:/Users/AMBUJ%20YADAV/Documents/Aspirantx/src/components/Header.tsx) |
| **Authenticated Mobile Drawer** | ZERO download buttons | **0** download buttons | Verified in [`src/components/MobileDrawer.tsx`](file:///c:/Users/AMBUJ%20YADAV/Documents/Aspirantx/src/components/MobileDrawer.tsx) |
| **In-App Download Modal** | ZERO modal popups | **0** unmounted in tree | Verified in [`src/App.tsx`](file:///c:/Users/AMBUJ%20YADAV/Documents/Aspirantx/src/App.tsx) (`AppDownloadModal` removed) |

---

## 5. Native Dynamic Live Wallpaper Verification

### Authoritative System State (`dumpsys wallpaper`)
```text
User 0: id=12: mWhich=3: mSystemWasBoth=true: mBindSource=SET_LIVE
  mWallpaperComponent=ComponentInfo{com.aspirantx.app/com.aspirantx.app.AspirantXWallpaperService}
```
- `mWhich=3`: `FLAG_SYSTEM | FLAG_LOCK` (Home screen and lock screen).
- `AspirantXWallpaperService` runs directly on the Android launcher behind system apps.

### Dynamic Updates Without Re-Setting
- **Persona Switch**: Toggling between Sung Jin-Woo and Uzumaki Naruto instantly adjusts canvas palette, character quote, and badge on the live launcher screen.
- **Habit Streak**: Completing daily habit marks calendar day green (`✓`) and increments streak (`1 Days` -> `2 Days`) on the home screen via `mPendingUpdate` and `ACTION_UPDATE_WALLPAPER` broadcast.

---

## 6. Supabase 26K Question Pipeline Verification

Verified via `scripts/verify_production_question_pipeline.mjs`:
- **Stage 1 (Security Audit)**: Zero Supabase secret keys or service role credentials exposed to client Vite bundles.
- **Stage 2 (Database Integrity)**: RLS enabled; PostgreSQL tables `question_bank` and `pyqs` intact.
- **Stage 3 (API Contracts)**:
  - `GET /api/academic/questions`: Status 200, returns `question_bank` (142 questions).
  - `GET /api/academic/pyqs`: Status 200, returns `pyqs` (**26,411 questions**).
  - Bounded pagination enforced (max limit 500).
- **Stage 4 (Mock Separation)**: Diagnostic mocks are strictly isolated to offline fallback; live Supabase questions take authoritative precedence.
- **Data Preservation**: Zero rows, zero tables deleted. Entire 26,553 question archive preserved intact.

---

## 7. Verification Artifacts Summary

| Artifact | Description |
|---|---|
| [`WALLPAPER_FINAL_STATUS.md`](file:///c:/Users/AMBUJ%20YADAV/Documents/Aspirantx/WALLPAPER_FINAL_STATUS.md) | Complete wallpaper verification report with logcat traces and architecture specs |
| [`DOWNLOAD_ARCHITECTURE_AUDIT.md`](file:///c:/Users/AMBUJ%20YADAV/Documents/Aspirantx/DOWNLOAD_ARCHITECTURE_AUDIT.md) | Download route specification, cache headers, and UI mapping |
| [`public/aspirantx.apk`](file:///c:/Users/AMBUJ%20YADAV/Documents/Aspirantx/public/aspirantx.apk) | Canonical release binary (5.4MB, v2.4.1, signed) |
