package com.aspirantx.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.app.NotificationCompat;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class FocusShieldMonitorService extends Service {
    private static final String TAG = "FocusShieldMonitor";
    public static final String ACTION_START = "com.aspirantx.app.ACTION_START_FOCUS_MONITOR";
    public static final String ACTION_STOP = "com.aspirantx.app.ACTION_STOP_FOCUS_MONITOR";
    private static final String CHANNEL_ID = "studyride_focus_shield_channel";
    private static final String ALERT_CHANNEL_ID = "studyride_focus_shield_alerts";
    private static final int NOTIFICATION_ID = 9021;
    private static final int ALERT_NOTIFICATION_ID = 9022;

    private Handler monitorHandler;
    private Runnable monitorRunnable;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private Set<String> blockedPackages = new HashSet<>();
    private String lastForegroundPackage = "";

    // WindowManager Overlay
    private WindowManager windowManager;
    private View activeOverlayView = null;
    private String currentlyDisplayedOverlayPkg = "";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopMonitoring();
            stopSelf();
            return START_NOT_STICKY;
        }

        Notification notification = buildNotification("Focus Shield Active", "Protecting your study session");
        if (Build.VERSION.SDK_INT >= 34) { // Android 14+ requires explicit service type
            startForeground(NOTIFICATION_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        loadBlockedPackages();
        startMonitoring();

        return START_STICKY;
    }

    private void loadBlockedPackages() {
        SharedPreferences prefs = getSharedPreferences(FocusShieldPlugin.PREFS_NAME, Context.MODE_PRIVATE);
        Set<String> saved = prefs.getStringSet("blocked_packages", null);
        blockedPackages.clear();
        if (saved != null) {
            blockedPackages.addAll(saved);
        }
        // NOTE: Do NOT add default packages here — blocked list is controlled by user toggles only.
        // An empty blockedPackages means no app-group/focus-session blocking (Shorts/Reels are
        // handled via separate blockShorts/blockReels flags, not via blockedPackages set).
    }

    private void startMonitoring() {
        if (monitorHandler == null) {
            monitorHandler = new Handler(Looper.getMainLooper());
        }
        if (monitorRunnable != null) {
            monitorHandler.removeCallbacks(monitorRunnable);
        }

        monitorRunnable = new Runnable() {
            @Override
            public void run() {
                checkForegroundApp();
                if (monitorHandler != null) {
                    // Poll every 500ms for near-real-time detection on Android 12-14
                    monitorHandler.postDelayed(this, 500);
                }
            }
        };
        monitorHandler.post(monitorRunnable);
    }

    private void stopMonitoring() {
        if (monitorHandler != null && monitorRunnable != null) {
            monitorHandler.removeCallbacks(monitorRunnable);
        }
        hideBlockOverlay();
        stopForeground(true);
    }

    private void checkForegroundApp() {
        // If screen is off, hide overlay and return
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null && !pm.isInteractive()) {
                hideBlockOverlay();
                return;
            }
        } catch (Exception ignored) {}

        SharedPreferences prefs = getSharedPreferences(FocusShieldPlugin.PREFS_NAME, Context.MODE_PRIVATE);
        boolean manualActive = prefs.getBoolean(FocusShieldPlugin.PREF_ACTIVE, false);
        long endTimestamp = prefs.getLong(FocusShieldPlugin.PREF_END_TIME, 0);
        long now = System.currentTimeMillis();

        boolean hasActiveSchedule = isAnyScheduleActive(prefs);
        boolean hasDailyLimits = hasConfiguredDailyLimits(prefs);
        boolean hasAppGroups = hasConfiguredAppGroups(prefs);
        boolean blockShorts = prefs.getBoolean(FocusShieldAccessibilityService.PREF_BLOCK_SHORTS, false);
        boolean blockReels = prefs.getBoolean(FocusShieldAccessibilityService.PREF_BLOCK_REELS, false);

        // If nothing is active and no limits configured, shut down monitor
        if (!manualActive && !hasActiveSchedule && !hasDailyLimits && !hasAppGroups && !blockShorts && !blockReels) {
            stopMonitoring();
            stopSelf();
            return;
        }

        // If manual session expired, mark it inactive
        if (manualActive && now >= endTimestamp) {
            manualActive = false;
            prefs.edit().putBoolean(FocusShieldPlugin.PREF_ACTIVE, false).apply();
        }

        loadBlockedPackages(); // Keep synced with dynamic UI selection

        String currentPackage = getForegroundPackage();
        if (currentPackage != null && !currentPackage.isEmpty()) {
            // Do not block StudyRide, Android system UI, launcher or settings
            String myPkg = getPackageName();
            if (currentPackage.equals(myPkg) 
                    || currentPackage.equals("com.android.systemui") 
                    || currentPackage.equals("android") 
                    || currentPackage.equals("com.android.settings")
                    || currentPackage.contains("launcher")) {
                hideBlockOverlay();
                return;
            }

            // Check emergency grace pass
            if (isEmergencyPassActive(prefs, currentPackage, now)) {
                hideBlockOverlay();
                return;
            }

            boolean shouldBlock = false;
            String blockReason = "FOCUS_SESSION";
            String groupName = "";
            int limitMins = 0;
            int usedMins = 0;

            // Priority 1: Manual Focus Timer Active (Pomodoro / Deep Work Session)
            if (manualActive && now < endTimestamp && blockedPackages.contains(currentPackage)) {
                boolean ytStudyMode = prefs.getBoolean(FocusShieldAccessibilityService.PREF_YT_STUDY_MODE, false);
                if (currentPackage.equals("com.google.android.youtube") && ytStudyMode) {
                    shouldBlock = false;
                } else {
                    shouldBlock = true;
                    blockReason = "FOCUS_SESSION";
                    limitMins = (int) Math.max(1, (endTimestamp - now) / 60000L);
                }
            }

            // Priority 2: Automated Study Schedule Active (Planner Slot)
            if (!shouldBlock && isPackageBlockedBySchedule(prefs, currentPackage)) {
                boolean ytStudyMode = prefs.getBoolean(FocusShieldAccessibilityService.PREF_YT_STUDY_MODE, false);
                if (currentPackage.equals("com.google.android.youtube") && ytStudyMode) {
                    shouldBlock = false;
                } else {
                    shouldBlock = true;
                    blockReason = "SCHEDULE_ACTIVE";
                }
            }

            // Priority 3: 24x7 Habit Shield
            // Instagram: Fully block when Reels toggle ON
            if (!shouldBlock && blockReels && "com.instagram.android".equals(currentPackage)) {
                shouldBlock = true;
                blockReason = "REELS_BLOCKED";
            }
            // YouTube: Block when Shorts toggle ON.
            // If user granted "Watch Lecture" bypass (stored as youtube_lecture_bypass_until),
            // allow YouTube until that timestamp expires.
            if (!shouldBlock && blockShorts && "com.google.android.youtube".equals(currentPackage)) {
                boolean ytStudyMode = prefs.getBoolean(FocusShieldAccessibilityService.PREF_YT_STUDY_MODE, false);
                long lectureBypassUntil = prefs.getLong("youtube_lecture_bypass_until", 0);
                boolean bypassActive = System.currentTimeMillis() < lectureBypassUntil;
                if (!ytStudyMode && !bypassActive) {
                    shouldBlock = true;
                    blockReason = "SHORTS_BLOCKED";
                }
            }

            // Priority 4: Daily Quota Limit Reached (Individual App)
            if (!shouldBlock) {
                int[] quotaCheck = checkDailyLimitExceeded(prefs, currentPackage);
                if (quotaCheck[0] == 1) {
                    shouldBlock = true;
                    blockReason = "DAILY_LIMIT_EXCEEDED";
                    limitMins = quotaCheck[1];
                    usedMins = quotaCheck[2];
                }
            }

            // Priority 5: App Group Lock or Shared Limit
            if (!shouldBlock) {
                Object[] groupCheck = checkAppGroupBlocked(prefs, currentPackage);
                if ((Boolean) groupCheck[0]) {
                    shouldBlock = true;
                    blockReason = (String) groupCheck[1];
                    limitMins = (Integer) groupCheck[2];
                    usedMins = (Integer) groupCheck[3];
                    groupName = (String) groupCheck[4];
                }
            }

            if (shouldBlock) {
                showBlockOverlay(currentPackage, blockReason, limitMins, usedMins, groupName);
            } else {
                hideBlockOverlay();
            }
        } else {
            hideBlockOverlay();
        }
    }

    private void showBlockOverlay(final String packageName, final String reason, final int limitMins, final int usedMins, final String groupName) {
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                try {
                    // Check if Display Over Other Apps permission is granted
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(FocusShieldMonitorService.this)) {
                        triggerAlertNotification(packageName, reason, limitMins, usedMins, groupName);
                        return;
                    }

                    if (activeOverlayView != null && packageName.equals(currentlyDisplayedOverlayPkg)) {
                        return; // Already actively showing for this package
                    }

                    if (windowManager == null) {
                        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
                    }

                    if (activeOverlayView != null) {
                        try {
                            windowManager.removeView(activeOverlayView);
                        } catch (Exception ignored) {}
                        activeOverlayView = null;
                    }

                    int layoutType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                            ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                            : WindowManager.LayoutParams.TYPE_PHONE;

                    WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                            WindowManager.LayoutParams.MATCH_PARENT,
                            WindowManager.LayoutParams.MATCH_PARENT,
                            layoutType,
                            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                                    | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                                    | WindowManager.LayoutParams.FLAG_FULLSCREEN,
                            PixelFormat.TRANSLUCENT
                    );
                    params.gravity = Gravity.CENTER;

                    activeOverlayView = createOverlayView(packageName, reason, limitMins, usedMins, groupName);
                    currentlyDisplayedOverlayPkg = packageName;
                    windowManager.addView(activeOverlayView, params);
                    Log.i(TAG, "Attached Focus Shield WindowManager overlay for " + packageName);

                } catch (Exception e) {
                    Log.e(TAG, "Error displaying WindowManager overlay: " + e.getMessage());
                }
            }
        });
    }

    private void hideBlockOverlay() {
        if (activeOverlayView != null) {
            mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    try {
                        if (activeOverlayView != null && windowManager != null) {
                            windowManager.removeView(activeOverlayView);
                            activeOverlayView = null;
                            currentlyDisplayedOverlayPkg = "";
                            Log.i(TAG, "Dismissed Focus Shield WindowManager overlay");
                        }
                    } catch (Exception ignored) {}
                }
            });
        }
    }

    private View createOverlayView(final String packageName, String reason, int limitMins, int usedMins, String groupName) {
        LayoutInflater inflater = LayoutInflater.from(this);
        View view = inflater.inflate(R.layout.activity_block_overlay, null);

        TextView tvBlockedApp = view.findViewById(R.id.tvBlockedApp);
        TextView tvRemainingTime = view.findViewById(R.id.tvRemainingTime);
        TextView tvMotivationalQuote = view.findViewById(R.id.tvMotivationalQuote);
        Button btnReturn = view.findViewById(R.id.btnReturnToApp);
        Button btnHome = view.findViewById(R.id.btnGoHome);

        String appLabel = getFriendlyName(packageName);
        if (tvBlockedApp != null) {
            if ("FOCUS_SESSION".equals(reason)) {
                tvBlockedApp.setText("Focus Session • " + appLabel + " Blocked");
            } else if ("REELS_BLOCKED".equals(reason)) {
                tvBlockedApp.setText("Instagram Reels Blocked");
            } else if ("SHORTS_BLOCKED".equals(reason)) {
                tvBlockedApp.setText("YouTube Shorts Restricted");
            } else if ("GROUP_BLOCKED".equals(reason)) {
                tvBlockedApp.setText((groupName.isEmpty() ? "App Group" : groupName) + " is Locked");
            } else if ("DAILY_LIMIT_EXCEEDED".equals(reason)) {
                tvBlockedApp.setText(appLabel + " Limit Reached");
            } else if ("SCHEDULE_ACTIVE".equals(reason)) {
                tvBlockedApp.setText("Study Slot Active: " + appLabel + " Blocked");
            } else {
                tvBlockedApp.setText(appLabel + " is Blocked");
            }
        }

        if (tvRemainingTime != null) {
            if ("FOCUS_SESSION".equals(reason)) {
                tvRemainingTime.setText(limitMins + "m Left in Session");
                tvRemainingTime.setTextSize(26f);
            } else if ("DAILY_LIMIT_EXCEEDED".equals(reason)) {
                tvRemainingTime.setText(usedMins + "m / " + limitMins + "m Used");
                tvRemainingTime.setTextSize(26f);
            } else if ("REELS_BLOCKED".equals(reason)) {
                tvRemainingTime.setText("NO REELS MODE");
                tvRemainingTime.setTextSize(26f);
            } else if ("SHORTS_BLOCKED".equals(reason)) {
                tvRemainingTime.setText("NO SHORTS MODE");
                tvRemainingTime.setTextSize(26f);
            } else if ("SCHEDULE_ACTIVE".equals(reason)) {
                tvRemainingTime.setText("SCHEDULED STUDY SLOT");
                tvRemainingTime.setTextSize(22f);
            } else {
                tvRemainingTime.setText("SHIELD ACTIVE");
            }
        }

        if (tvMotivationalQuote != null) {
            tvMotivationalQuote.setText("“Padhai par dhyan do! Selection tumhara intazaar kar raha hai. Har minute keemti hai.”");
        }

        if (btnReturn != null) {
            if ("SHORTS_BLOCKED".equals(reason)) {
                // For Shorts block: show "Watch Lecture" bypass button
                btnReturn.setText("Watch Lecture ✅ (10 min)");
                btnReturn.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        // Grant 10-minute lecture bypass
                        getSharedPreferences(FocusShieldPlugin.PREFS_NAME, Context.MODE_PRIVATE)
                            .edit()
                            .putLong("youtube_lecture_bypass_until", System.currentTimeMillis() + 10 * 60 * 1000L)
                            .apply();
                        hideBlockOverlay();
                        Toast.makeText(FocusShieldMonitorService.this,
                            "✅ Lecture mode: 10 min YouTube access granted", Toast.LENGTH_SHORT).show();
                    }
                });
            } else {
                btnReturn.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        hideBlockOverlay();
                        try {
                            Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
                            if (launchIntent != null) {
                                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                                startActivity(launchIntent);
                            } else {
                                Intent homeIntent = new Intent(Intent.ACTION_MAIN);
                                homeIntent.addCategory(Intent.CATEGORY_HOME);
                                homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                                startActivity(homeIntent);
                            }
                        } catch (Exception ignored) {}
                    }
                });
            }
        }

        if (btnHome != null) {
            btnHome.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    hideBlockOverlay();
                    try {
                        Intent homeIntent = new Intent(Intent.ACTION_MAIN);
                        homeIntent.addCategory(Intent.CATEGORY_HOME);
                        homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(homeIntent);
                    } catch (Exception ignored) {}
                }
            });
        }

        return view;
    }

    private String getFriendlyName(String pkg) {
        if ("com.google.android.youtube".equals(pkg)) return "YouTube";
        if ("com.instagram.android".equals(pkg)) return "Instagram";
        if ("com.facebook.katana".equals(pkg)) return "Facebook";
        if ("com.snapchat.android".equals(pkg)) return "Snapchat";
        if ("com.twitter.android".equals(pkg)) return "X (Twitter)";
        try {
            PackageManager pm = getPackageManager();
            return pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString();
        } catch (Exception ignored) {}
        return pkg;
    }

    private String getForegroundPackage() {
        try {
            UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) return lastForegroundPackage;

            long end = System.currentTimeMillis();
            // Use 3-second window for near-real-time detection on Android 12/13/14
            // (60s window is too stale and returns wrong results on newer Android versions)
            long begin = end - 3000;

            UsageEvents events = usm.queryEvents(begin, end);
            String latest = null;

            if (events != null) {
                UsageEvents.Event event = new UsageEvents.Event();
                while (events.hasNextEvent()) {
                    events.getNextEvent(event);
                    int type = event.getEventType();
                    // ACTIVITY_RESUMED = 1 (API 29+), MOVE_TO_FOREGROUND = 1 (older)
                    if (type == UsageEvents.Event.ACTIVITY_RESUMED || type == 1) {
                        String pkg = event.getPackageName();
                        if (pkg != null && !pkg.isEmpty()) {
                            latest = pkg;
                        }
                    }
                }
            }

            if (latest != null && !latest.isEmpty()) {
                lastForegroundPackage = latest;
                return latest;
            }

            // Fallback: extend window to 10s if 3s window returned nothing
            begin = end - 10000;
            events = usm.queryEvents(begin, end);
            if (events != null) {
                UsageEvents.Event event = new UsageEvents.Event();
                while (events.hasNextEvent()) {
                    events.getNextEvent(event);
                    int type = event.getEventType();
                    if (type == UsageEvents.Event.ACTIVITY_RESUMED || type == 1) {
                        String pkg = event.getPackageName();
                        if (pkg != null && !pkg.isEmpty()) {
                            latest = pkg;
                        }
                    }
                }
            }

            if (latest != null && !latest.isEmpty()) {
                lastForegroundPackage = latest;
                return latest;
            }

            // Last fallback: queryUsageStats aggregated (slowest but most compatible)
            List<UsageStats> statsList = usm.queryUsageStats(UsageStatsManager.INTERVAL_BEST, end - 5000, end);
            if (statsList != null && !statsList.isEmpty()) {
                UsageStats mostRecent = null;
                for (UsageStats u : statsList) {
                    if (mostRecent == null || u.getLastTimeUsed() > mostRecent.getLastTimeUsed()) {
                        mostRecent = u;
                    }
                }
                if (mostRecent != null && (end - mostRecent.getLastTimeUsed() < 5000)) {
                    lastForegroundPackage = mostRecent.getPackageName();
                    return mostRecent.getPackageName();
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking foreground package: " + e.getMessage());
        }
        return lastForegroundPackage;
    }

    private boolean isEmergencyPassActive(SharedPreferences prefs, String pkg, long now) {
        try {
            String passesJson = prefs.getString(FocusShieldPlugin.PREF_EMERGENCY_PASSES, "{}");
            org.json.JSONObject obj = new org.json.JSONObject(passesJson);
            if (obj.has(pkg)) {
                long expiry = obj.optLong(pkg, 0);
                return expiry > now;
            }
        } catch (Exception ignored) {}
        return false;
    }

    private boolean hasConfiguredDailyLimits(SharedPreferences prefs) {
        try {
            String limitsJson = prefs.getString(FocusShieldPlugin.PREF_DAILY_LIMITS, "{}");
            org.json.JSONObject obj = new org.json.JSONObject(limitsJson);
            return obj.length() > 0;
        } catch (Exception ignored) {}
        return false;
    }

    private int[] checkDailyLimitExceeded(SharedPreferences prefs, String pkg) {
        try {
            String limitsJson = prefs.getString(FocusShieldPlugin.PREF_DAILY_LIMITS, "{}");
            org.json.JSONObject obj = new org.json.JSONObject(limitsJson);
            if (!obj.has(pkg)) return new int[]{0, 0, 0};

            int limitMins = obj.optInt(pkg, 0);
            if (limitMins <= 0) return new int[]{0, 0, 0};

            UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) return new int[]{0, 0, 0};

            java.util.Calendar c = java.util.Calendar.getInstance();
            long now = c.getTimeInMillis();
            c.set(java.util.Calendar.HOUR_OF_DAY, 0);
            c.set(java.util.Calendar.MINUTE, 0);
            c.set(java.util.Calendar.SECOND, 0);
            c.set(java.util.Calendar.MILLISECOND, 0);
            long startOfDay = c.getTimeInMillis();

            java.util.Map<String, UsageStats> map = usm.queryAndAggregateUsageStats(startOfDay, now);
            if (map != null && map.containsKey(pkg)) {
                UsageStats u = map.get(pkg);
                if (u != null) {
                    int usedMins = (int) (u.getTotalTimeInForeground() / 60000L);
                    if (usedMins >= limitMins) {
                        return new int[]{1, limitMins, usedMins};
                    }
                }
            }
        } catch (Exception ignored) {}
        return new int[]{0, 0, 0};
    }

    private boolean isAnyScheduleActive(SharedPreferences prefs) {
        try {
            String schedulesJson = prefs.getString(FocusShieldPlugin.PREF_SCHEDULES, "[]");
            org.json.JSONArray arr = new org.json.JSONArray(schedulesJson);
            if (arr.length() == 0) return false;

            java.util.Calendar c = java.util.Calendar.getInstance();
            int dayOfWeek = c.get(java.util.Calendar.DAY_OF_WEEK); // 1 = Sunday, 7 = Saturday
            int curMinutes = c.get(java.util.Calendar.HOUR_OF_DAY) * 60 + c.get(java.util.Calendar.MINUTE);

            for (int i = 0; i < arr.length(); i++) {
                org.json.JSONObject s = arr.getJSONObject(i);
                if (!s.optBoolean("enabled", true)) continue;

                org.json.JSONArray days = s.optJSONArray("days");
                boolean dayMatches = true;
                if (days != null && days.length() > 0) {
                    dayMatches = false;
                    for (int d = 0; d < days.length(); d++) {
                        if (days.getInt(d) == dayOfWeek) {
                            dayMatches = true;
                            break;
                        }
                    }
                }
                if (!dayMatches) continue;

                int startM = s.optInt("startHour", 0) * 60 + s.optInt("startMinute", 0);
                int endM = s.optInt("endHour", 0) * 60 + s.optInt("endMinute", 0);

                if (curMinutes >= startM && curMinutes < endM) {
                    return true;
                }
            }
        } catch (Exception ignored) {}
        return false;
    }

    private boolean isPackageBlockedBySchedule(SharedPreferences prefs, String pkg) {
        try {
            String schedulesJson = prefs.getString(FocusShieldPlugin.PREF_SCHEDULES, "[]");
            org.json.JSONArray arr = new org.json.JSONArray(schedulesJson);
            if (arr.length() == 0) return false;

            java.util.Calendar c = java.util.Calendar.getInstance();
            int dayOfWeek = c.get(java.util.Calendar.DAY_OF_WEEK);
            int curMinutes = c.get(java.util.Calendar.HOUR_OF_DAY) * 60 + c.get(java.util.Calendar.MINUTE);

            for (int i = 0; i < arr.length(); i++) {
                org.json.JSONObject s = arr.getJSONObject(i);
                if (!s.optBoolean("enabled", true)) continue;

                org.json.JSONArray days = s.optJSONArray("days");
                boolean dayMatches = true;
                if (days != null && days.length() > 0) {
                    dayMatches = false;
                    for (int d = 0; d < days.length(); d++) {
                        if (days.getInt(d) == dayOfWeek) {
                            dayMatches = true;
                            break;
                        }
                    }
                }
                if (!dayMatches) continue;

                int startM = s.optInt("startHour", 0) * 60 + s.optInt("startMinute", 0);
                int endM = s.optInt("endHour", 0) * 60 + s.optInt("endMinute", 0);

                if (curMinutes >= startM && curMinutes < endM) {
                    org.json.JSONArray pkgs = s.optJSONArray("blockedPackages");
                    if (pkgs != null && pkgs.length() > 0) {
                        for (int p = 0; p < pkgs.length(); p++) {
                            if (pkg.equals(pkgs.getString(p))) {
                                return true;
                            }
                        }
                    } else if (blockedPackages.contains(pkg)) {
                        return true;
                    }
                }
            }
        } catch (Exception ignored) {}
        return false;
    }

    private boolean hasConfiguredAppGroups(SharedPreferences prefs) {
        try {
            String groupsJson = prefs.getString(FocusShieldPlugin.PREF_APP_GROUPS, "[]");
            org.json.JSONArray arr = new org.json.JSONArray(groupsJson);
            for (int i = 0; i < arr.length(); i++) {
                org.json.JSONObject g = arr.getJSONObject(i);
                if (g.optBoolean("enabled", true)) {
                    return true;
                }
            }
        } catch (Exception ignored) {}
        return false;
    }

    private Object[] checkAppGroupBlocked(SharedPreferences prefs, String pkg) {
        try {
            String groupsJson = prefs.getString(FocusShieldPlugin.PREF_APP_GROUPS, "[]");
            org.json.JSONArray arr = new org.json.JSONArray(groupsJson);
            if (arr.length() == 0) return new Object[]{false, "", 0, 0, ""};

            UsageStatsManager usm = null;
            java.util.Map<String, UsageStats> usageMap = null;

            for (int i = 0; i < arr.length(); i++) {
                org.json.JSONObject g = arr.getJSONObject(i);
                if (!g.optBoolean("enabled", true)) continue;

                org.json.JSONArray packages = g.optJSONArray("packages");
                if (packages == null || packages.length() == 0) continue;

                boolean containsPkg = false;
                for (int p = 0; p < packages.length(); p++) {
                    if (pkg.equals(packages.getString(p))) {
                        containsPkg = true;
                        break;
                    }
                }
                if (!containsPkg) continue;

                String groupName = g.optString("name", "App Group");

                // Case A: 100% Group Block (Instant/Always Block)
                if (g.optBoolean("isBlocked", false) || "BLOCKED".equalsIgnoreCase(g.optString("blockMode"))) {
                    return new Object[]{true, "GROUP_BLOCKED", 0, 0, groupName};
                }

                // Case B: Shared Group Daily Limit
                int groupLimitMins = g.optInt("dailyLimitMinutes", 0);
                if (groupLimitMins > 0) {
                    if (usm == null) {
                        usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
                        if (usm != null) {
                            java.util.Calendar c = java.util.Calendar.getInstance();
                            long now = c.getTimeInMillis();
                            c.set(java.util.Calendar.HOUR_OF_DAY, 0);
                            c.set(java.util.Calendar.MINUTE, 0);
                            c.set(java.util.Calendar.SECOND, 0);
                            c.set(java.util.Calendar.MILLISECOND, 0);
                            long startOfDay = c.getTimeInMillis();
                            usageMap = usm.queryAndAggregateUsageStats(startOfDay, now);
                        }
                    }

                    if (usageMap != null) {
                        long totalGroupTimeMs = 0;
                        for (int p = 0; p < packages.length(); p++) {
                            String pName = packages.getString(p);
                            if (usageMap.containsKey(pName)) {
                                UsageStats u = usageMap.get(pName);
                                if (u != null) {
                                    totalGroupTimeMs += u.getTotalTimeInForeground();
                                }
                            }
                        }
                        int usedGroupMins = (int) (totalGroupTimeMs / 60000L);
                        if (usedGroupMins >= groupLimitMins) {
                            return new Object[]{true, "GROUP_LIMIT_EXCEEDED", groupLimitMins, usedGroupMins, groupName};
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
        return new Object[]{false, "", 0, 0, ""};
    }

    private void triggerAlertNotification(String packageName, String reason, int limitMins, int usedMins, String groupName) {
        try {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            String title = "Focus Shield: App Blocked";
            String content = "Padhai par dhyan do! Selection tumhara intazaar kar raha hai.";
            if ("DAILY_LIMIT_EXCEEDED".equals(reason)) {
                title = "Daily Limit Reached";
                content = "Aaj ka quota pura ho gaya (" + usedMins + "m used). Back to studies!";
            } else if ("SCHEDULE_ACTIVE".equals(reason)) {
                title = "Study Schedule Active";
                content = "Scheduled study slot chalu hai. Stay focused!";
            } else if ("GROUP_BLOCKED".equals(reason)) {
                title = (groupName.isEmpty() ? "App Group" : groupName) + " is Locked";
                content = "This app is in " + (groupName.isEmpty() ? "a restricted group" : groupName) + ". Focus on your study!";
            }

            Intent notificationIntent = new Intent(this, MainActivity.class);
            notificationIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            int pFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pFlags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getActivity(this, 1001, notificationIntent, pFlags);

            NotificationCompat.Builder alertBuilder = new NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title)
                    .setContentText(content)
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_ALARM)
                    .setContentIntent(pendingIntent)
                    .setAutoCancel(true)
                    .setVibrate(new long[]{0, 250, 150, 250});

            if (nm != null) {
                nm.notify(ALERT_NOTIFICATION_ID, alertBuilder.build());
            }
        } catch (Exception e) {
            Log.e(TAG, "Error posting alert notification: " + e.getMessage());
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "StudyRide Focus Session",
                        NotificationManager.IMPORTANCE_LOW
                );
                channel.setDescription("Shows active focus session status");
                manager.createNotificationChannel(channel);

                NotificationChannel alertChannel = new NotificationChannel(
                        ALERT_CHANNEL_ID,
                        "StudyRide Distraction Alerts",
                        NotificationManager.IMPORTANCE_HIGH
                );
                alertChannel.setDescription("Alerts and blocks distracting apps");
                alertChannel.enableVibration(true);
                alertChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                manager.createNotificationChannel(alertChannel);
            }
        }
    }

    private Notification buildNotification(String title, String content) {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(content)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopMonitoring();
    }
}
