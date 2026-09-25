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
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

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
    private Set<String> blockedPackages = new HashSet<>();
    private String lastBlockedPackage = "";
    private long lastBlockTriggerTime = 0;

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

        startForeground(NOTIFICATION_ID, buildNotification("Focus Shield Active", "Protecting your study session"));
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
        if (blockedPackages.isEmpty()) {
            blockedPackages.add("com.google.android.youtube");
            blockedPackages.add("com.instagram.android");
            blockedPackages.add("com.facebook.katana");
            blockedPackages.add("com.snapchat.android");
        }
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
                monitorHandler.postDelayed(this, 1000);
            }
        };
        monitorHandler.post(monitorRunnable);
    }

    private void stopMonitoring() {
        if (monitorHandler != null && monitorRunnable != null) {
            monitorHandler.removeCallbacks(monitorRunnable);
        }
        stopForeground(true);
    }

    private void checkForegroundApp() {
        SharedPreferences prefs = getSharedPreferences(FocusShieldPlugin.PREFS_NAME, Context.MODE_PRIVATE);
        boolean manualActive = prefs.getBoolean(FocusShieldPlugin.PREF_ACTIVE, false);
        long endTimestamp = prefs.getLong(FocusShieldPlugin.PREF_END_TIME, 0);
        long now = System.currentTimeMillis();

        boolean hasActiveSchedule = isAnyScheduleActive(prefs);
        boolean hasDailyLimits = hasConfiguredDailyLimits(prefs);
        boolean hasAppGroups = hasConfiguredAppGroups(prefs);

        // If nothing is active and no limits configured, shut down monitor
        if (!manualActive && !hasActiveSchedule && !hasDailyLimits && !hasAppGroups) {
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
            // Do not block StudyRide or Android launcher/system UI/settings
            String myPkg = getPackageName();
            if (currentPackage.equals(myPkg) || currentPackage.equals("com.android.systemui") 
                    || currentPackage.equals("android") || currentPackage.equals("com.android.settings")) {
                return;
            }

            // Check emergency grace pass
            if (isEmergencyPassActive(prefs, currentPackage, now)) {
                return;
            }

            boolean shouldBlock = false;
            String blockReason = "FOCUS_SESSION";
            String groupName = "";
            int limitMins = 0;
            int usedMins = 0;

            // Priority 1: Manual Focus Session Active
            if (manualActive && now < endTimestamp && blockedPackages.contains(currentPackage)) {
                boolean ytStudyMode = prefs.getBoolean(FocusShieldAccessibilityService.PREF_YT_STUDY_MODE, false);
                if (currentPackage.equals("com.google.android.youtube") && ytStudyMode) {
                    // Allow YouTube only when student explicitly enables Lecture Mode
                    shouldBlock = false;
                } else {
                    shouldBlock = true;
                    blockReason = "FOCUS_SESSION";
                }
            }

            // Priority 2: Automated Study Schedule Active
            if (!shouldBlock && isPackageBlockedBySchedule(prefs, currentPackage)) {
                boolean ytStudyMode = prefs.getBoolean(FocusShieldAccessibilityService.PREF_YT_STUDY_MODE, false);
                if (currentPackage.equals("com.google.android.youtube") && ytStudyMode) {
                    shouldBlock = false;
                } else {
                    shouldBlock = true;
                    blockReason = "SCHEDULE_ACTIVE";
                }
            }

            // Priority 3: Daily Quota Limit Reached (Individual App)
            if (!shouldBlock) {
                int[] quotaCheck = checkDailyLimitExceeded(prefs, currentPackage);
                if (quotaCheck[0] == 1) {
                    shouldBlock = true;
                    blockReason = "DAILY_LIMIT_EXCEEDED";
                    limitMins = quotaCheck[1];
                    usedMins = quotaCheck[2];
                }
            }

            // Priority 4: Regain-Style App Group Lock or Shared Limit
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
                long timeSinceLastTrigger = now - lastBlockTriggerTime;
                if (!currentPackage.equals(lastBlockedPackage) || timeSinceLastTrigger > 2500) {
                    lastBlockedPackage = currentPackage;
                    lastBlockTriggerTime = now;
                    triggerBlock(currentPackage, blockReason, limitMins, usedMins, groupName);
                }
            }
        }
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

    private String getForegroundPackage() {
        try {
            UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) return null;

            long end = System.currentTimeMillis();
            long begin = end - 10000; // 10-second inspection window

            UsageEvents events = usm.queryEvents(begin, end);
            String latest = null;

            if (events != null) {
                UsageEvents.Event event = new UsageEvents.Event();
                while (events.hasNextEvent()) {
                    events.getNextEvent(event);
                    int type = event.getEventType();
                    if (type == UsageEvents.Event.ACTIVITY_RESUMED || type == 1) {
                        latest = event.getPackageName();
                    }
                }
            }

            if (latest != null && !latest.isEmpty()) {
                return latest;
            }

            // Fallback: queryUsageStats for devices that debounce or delay usage events
            List<UsageStats> statsList = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, end - 30000, end);
            if (statsList != null && !statsList.isEmpty()) {
                UsageStats mostRecent = null;
                for (UsageStats u : statsList) {
                    if (mostRecent == null || u.getLastTimeUsed() > mostRecent.getLastTimeUsed()) {
                        mostRecent = u;
                    }
                }
                if (mostRecent != null && (end - mostRecent.getLastTimeUsed() < 5000)) {
                    return mostRecent.getPackageName();
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking foreground package: " + e.getMessage());
        }
        return null;
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

                        int totalGroupUsedMins = (int) (totalGroupTimeMs / 60000L);
                        if (totalGroupUsedMins >= groupLimitMins) {
                            return new Object[]{true, "GROUP_LIMIT_EXCEEDED", groupLimitMins, totalGroupUsedMins, groupName};
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
        return new Object[]{false, "", 0, 0, ""};
    }

    private void triggerBlock(String packageName, String reason, int limitMins, int usedMins, String groupName) {
        try {
            // 1. Prepare intent for BlockOverlayActivity
            Intent blockIntent = new Intent(this, BlockOverlayActivity.class);
            blockIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            blockIntent.putExtra("blocked_package", packageName);
            blockIntent.putExtra("block_reason", reason);
            blockIntent.putExtra("limit_mins", limitMins);
            blockIntent.putExtra("used_mins", usedMins);
            blockIntent.putExtra("group_name", groupName);

            int pFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pFlags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(this, 1001, blockIntent, pFlags);

            // 2. Post heads-up high-priority full-screen intent notification
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
            } else if ("GROUP_LIMIT_EXCEEDED".equals(reason)) {
                title = (groupName.isEmpty() ? "Group" : groupName) + " Limit Reached";
                content = "Aaj ka " + groupName + " quota pura ho gaya (" + usedMins + "m / " + limitMins + "m). Back to studies!";
            }

            NotificationCompat.Builder alertBuilder = new NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title)
                    .setContentText(content)
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_ALARM)
                    .setFullScreenIntent(fullScreenPendingIntent, true)
                    .setAutoCancel(true)
                    .setVibrate(new long[]{0, 250, 150, 250});

            if (nm != null) {
                nm.notify(ALERT_NOTIFICATION_ID, alertBuilder.build());
            }

            // 3. Immediately send HOME intent to collapse the blocked app
            try {
                Intent homeIntent = new Intent(Intent.ACTION_MAIN);
                homeIntent.addCategory(Intent.CATEGORY_HOME);
                homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(homeIntent);
            } catch (Exception ignored) {}

            // 4. Also launch BlockOverlayActivity directly
            try {
                startActivity(blockIntent);
            } catch (Exception ignored) {}

        } catch (Exception e) {
            Log.e(TAG, "Error triggering block overlay: " + e.getMessage());
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
