# ASPIRANTX — LIVE DYNAMIC WALLPAPER MASTER IMPLEMENTATION PLAN
**Document Type:** Architectural Blueprint & Implementation Specification (Phase 4 Deliverable)  
**Standard:** Enterprise Non-Superficial Android Native Architecture  
**Status:** READY FOR EXECUTION  
**Date:** 2026-09-04  

---

## 1. Exact Files to Modify

| File Path | Language | Architectural Role | Modification Scope |
| :--- | :--- | :--- | :--- |
| `src/lib/nativeWallpaperBridge.ts` | TypeScript | TS Bridge | Unify `CanonicalWallpaperState`, add persona/theme/user fields, add `Capacitor.App` state change listeners, enhance plugin contract. |
| `src/components/ExamWallpaperWidget.tsx` | React / TSX | UI View & State Machine | Implement `WallpaperStatus` state machine (`NOT_SUPPORTED`, `SUPPORTED`, `READY`, `PREVIEW_OPENED`, `ACTIVE`, `INACTIVE`, `REPLACED`), remove fake permission check, sync on persona change, listen for app resume. |
| `android/app/src/main/java/com/aspirantx/app/AspirantXWallpaperPlugin.java` | Java (Android) | Capacitor Plugin | Handle canonical state with persona/theme/quote, use robust `ComponentName` matching in `isLiveWallpaperActive`, return diagnostic details. |
| `android/app/src/main/java/com/aspirantx/app/AspirantXWallpaperService.java` | Java (Android) | Live Wallpaper Engine | Render dynamic persona background gradient, accent color, and quote; split BroadcastReceiver for modern Android 13/14 security; eliminate `ACTION_TIME_TICK` battery drain. |
| `android/app/src/main/AndroidManifest.xml` | XML | Android Manifest | Ensure proper permissions, intent filters, and exported service attributes. |
| `android/app/src/main/res/xml/wallpaper.xml` | XML | Wallpaper Metadata | Verify description, thumbnail, and settings activity. |

---

## 2. Exact Native Bridge API

The plugin interface in `nativeWallpaperBridge.ts` and `AspirantXWallpaperPlugin.java` will be updated to:

```typescript
export interface CanonicalWallpaperState {
  candidateName: string;
  examName: string;
  targetDate: string;
  targetEpochMs: number;
  daysRemaining: number;
  syllabusPercentage: number;
  currentStreak: number;
  completedDays: number;
  personaId: string;
  personaTitle: string;
  characterQuote: string;
  accentColor: string;
  bgGradient: [string, string, string]; // Top, Middle, Bottom hex colors
  habitMatrix: Array<{
    dayNumber: number;
    isCompleted: boolean;
    isMissed: boolean;
    isToday: boolean;
  }>;
}

export interface AspirantXWallpaperPluginInterface {
  updateWallpaperData(data: CanonicalWallpaperState): Promise<{ success: boolean }>;
  openLiveWallpaperPicker(): Promise<{ success: boolean; intentFired: string }>;
  isLiveWallpaperActive(): Promise<{ 
    isActive: boolean; 
    activePackage: string | null;
    activeService: string | null;
  }>;
}
```

---

## 3. Exact Android Intent Flow

```text
User Taps "Set as Live Wallpaper"
       │
       ▼
Plugin Method: openLiveWallpaperPicker()
       │
       ▼
Create Intent:
  Action: WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER ("android.app.action.CHANGE_LIVE_WALLPAPER")
  Extra: WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT
  Value: ComponentName(context, AspirantXWallpaperService.class)
  Flags: Intent.FLAG_ACTIVITY_NEW_TASK
       │
       ├── Can resolve Intent? ──► YES ──► context.startActivity(intent)
       │                                     └── Opens official Android live wallpaper preview
       │                                         with AspirantX rendered directly on screen
       └── NO (Old or Restricted ROM) ──► context.startActivity(ACTION_LIVE_WALLPAPER_CHOOSER)
                                             └── Fallback to system live wallpaper list
```

---

## 4. Manifest / Service Requirements

In `android/app/src/main/AndroidManifest.xml`:
```xml
<service
    android:name=".AspirantXWallpaperService"
    android:label="@string/wallpaper_name"
    android:description="@string/wallpaper_description"
    android:permission="android.permission.BIND_WALLPAPER"
    android:exported="true">
    <intent-filter>
        <action android:name="android.service.wallpaper.WallpaperService" />
    </intent-filter>
    <meta-data
        android:name="android.service.wallpaper"
        android:resource="@xml/wallpaper" />
</service>

<uses-feature android:name="android.software.live_wallpaper" android:required="false" />
```
* The `android:permission="android.permission.BIND_WALLPAPER"` ensures ONLY the Android OS WallpaperManager can bind and render this service.
* `android:exported="true"` is mandatory so the system wallpaper manager can access the service.

---

## 5. wallpaper.xml Requirements

In `android/app/src/main/res/xml/wallpaper.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<wallpaper xmlns:android="http://schemas.android.com/apk/res/android"
    android:thumbnail="@mipmap/ic_launcher"
    android:description="@string/wallpaper_description"
    android:settingsActivity="com.aspirantx.app.MainActivity" />
```
* When the user taps "Settings" on the Android wallpaper preview, it directly opens `MainActivity` to allow instant re-customization.

---

## 6. Real Active-State Detection

In `AspirantXWallpaperPlugin.java`:
```java
WallpaperManager wm = WallpaperManager.getInstance(getContext());
WallpaperInfo info = wm.getWallpaperInfo();
boolean isActive = false;
String activePkg = null;
String activeSvc = null;

if (info != null) {
    activePkg = info.getPackageName();
    activeSvc = info.getServiceName();
    ComponentName targetComponent = new ComponentName(getContext(), AspirantXWallpaperService.class);
    ComponentName currentComponent = info.getComponent();
    
    // Robust dual-check: ComponentName equality OR matching package + class suffix
    if (targetComponent.equals(currentComponent)) {
        isActive = true;
    } else if (getContext().getPackageName().equals(activePkg) && 
               activeSvc != null && activeSvc.contains("AspirantXWallpaperService")) {
        isActive = true;
    }
}
```
* If `info == null`: user has a static photo wallpaper or system default image $\rightarrow$ `isActive = false` (`INACTIVE` or `REPLACED`).
* If `info != null` but `activePkg != "com.aspirantx.app"`: user selected another app's live wallpaper $\rightarrow$ `isActive = false` (`REPLACED`).
* If `targetComponent.equals(currentComponent)`: AspirantX is the active system live wallpaper $\rightarrow$ `isActive = true` (`ACTIVE`).

---

## 7. Canonical WallpaperState

Unified single state definition across React preview, PNG export, and Android Native:

```typescript
{
  candidateName: "Ambuj Yadav",
  examName: "UPSC CSE — Civil Services Examination",
  targetDate: "24 May 2026",
  targetEpochMs: 1779580800000,
  daysRemaining: 627,
  syllabusPercentage: 68,
  currentStreak: 45,
  completedDays: 45,
  personaId: "officer_commandant",
  personaTitle: "BHARAT SEVA • OFFICER CADRE",
  characterQuote: "Satyameva Jayate. Duty, Honour, and Unbending Discipline.",
  accentColor: "#f59e0b",
  bgGradient: ["#021612", "#0f241d", "#081018"],
  habitMatrix: [
    { dayNumber: 1, isCompleted: true, isMissed: false, isToday: false },
    ...
  ]
}
```

---

## 8. Native Persistence Strategy

* Storage Target: Private Android `SharedPreferences` (`aspirantx_live_wallpaper_prefs.xml`) at `/data/data/com.aspirantx.app/shared_prefs/`.
* Persistence Mechanism: Written via `prefs.edit()...apply()`.
* Survival: Survives app termination, WebView destruction, device restarts, and offline periods.
* Fallback: If preferences are ever empty, `AspirantXWallpaperService` falls back to sane default metrics without throwing or crashing.

---

## 9. Event & Update Strategy

* On User Action in React:
  * Persona change $\rightarrow$ immediate sync to native.
  * Syllabus progress update $\rightarrow$ immediate sync to native.
  * Pomodoro completion / Daily box completed $\rightarrow$ immediate sync to native.
* Native Broadcast:
  * Plugin sends `com.aspirantx.app.ACTION_UPDATE_WALLPAPER` upon data change.
  * Service's `BroadcastReceiver` catches it and invokes `drawFrame()`.
* System Broadcasts:
  * `Intent.ACTION_DATE_CHANGED`: recalculates days remaining at midnight.
  * `Intent.ACTION_TIME_CHANGED` & `Intent.ACTION_TIMEZONE_CHANGED`: adjusts clock calculations.

---

## 10. Visibility & Battery Strategy

* 0% Idle CPU:
  * In `onVisibilityChanged(boolean visible)`: if `visible == false`, rendering is stopped. No timers, no threads, no handlers run.
  * When screen unlocks / launcher appears (`visible == true`): draws once via `drawFrame()`.
* Eliminate Tick Drain:
  * Remove `Intent.ACTION_TIME_TICK` (per-minute redraws are completely eliminated).
  * Recalculates `calculatedDaysLeft` on visibility change or date change only.

---

## 11. Offline Behavior

* Live Wallpaper Service requires **ZERO network permissions or requests**.
* Operates 100% locally from SharedPreferences and device hardware clock.
* When offline, all countdowns, streaks, syllabus percentages, and habit boxes render with 0ms latency.

---

## 12. Reboot & Restart Behavior

* When Android boots, the OS WallpaperManager binds `AspirantXWallpaperService`.
* Service reads SharedPreferences from disk and renders immediately.
* No need to launch or open the AspirantX app after phone reboot.

---

## 13. External Wallpaper Replacement Behavior

* If the user changes wallpaper via Android Settings or another launcher, `WallpaperManager.getWallpaperInfo()` changes.
* When the user opens AspirantX, the app resume listener queries `isLiveWallpaperActive()`.
* The state machine transitions from `ACTIVE` to `REPLACED` / `INACTIVE`.
* The UI immediately presents the "Set as Live Wallpaper" button again.

---

## 14. Premium / Entitlement Handling

* Basic wallpapers and default personas available to all users.
* Premium personas gated via `isUserPremium || isAdmin`.
* Live wallpaper engine itself works natively without external token checks.

---

## 15. Fallback Behavior

* On Web / Desktop:
  * Detects non-Android platform.
  * State is `NOT_SUPPORTED` for live wallpaper.
  * Offers full HD Static Wallpaper Export (1080x2400 PNG) and Fullscreen Live Desk Stand Companion.
* On Android without Live Wallpaper support:
  * Graceful fallback to `ACTION_LIVE_WALLPAPER_CHOOSER` or native Share intent to set as picture wallpaper.

---

## 16. Android Compatibility Strategy

* API 26 (Android 8.0 Oreo) through API 34+ (Android 14 / 15).
* Modern Broadcast Safety:
  * Internal app broadcast registered with `Context.RECEIVER_NOT_EXPORTED` on API 33+.
  * System broadcasts (`ACTION_DATE_CHANGED`) registered properly without export restriction conflicts.
* Display Insets:
  * Canvas margins dynamic relative to `width` and `height`, with top clearance for status bar / camera notch and bottom clearance for navigation pill.

---

## 17. Testing Strategy

1. Compile and build APK via Gradle wrapper (`android/gradlew.bat assembleDebug`).
2. Install on Android device/emulator (`adb install -r ...`).
3. Test full lifecycle:
   - Launch app $\rightarrow$ Open Wallpaper.
   - Tap "Set as Live Wallpaper" $\rightarrow$ Android official preview opens.
   - Confirm in preview $\rightarrow$ Return to app.
   - Verify UI switches to "Wallpaper Active" / "Manage Wallpaper".
   - Verify live wallpaper renders on Android homescreen.
   - Change theme persona $\rightarrow$ Verify live wallpaper updates colors immediately.
   - Replace wallpaper with standard Android wallpaper $\rightarrow$ Verify app detects `REPLACED` state.

---

## 18. Rollback Strategy

* All changes are additive and maintain 100% backward compatibility with existing `SharedPreferences` keys.
* If any step in the native bridge encounters an exception, it falls back to static canvas export without breaking existing study telemetry.
