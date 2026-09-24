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
        boolean active = prefs.getBoolean(FocusShieldPlugin.PREF_ACTIVE, false);
        long endTimestamp = prefs.getLong(FocusShieldPlugin.PREF_END_TIME, 0);
        long now = System.currentTimeMillis();

        if (!active || now >= endTimestamp) {
            stopMonitoring();
            stopSelf();
            return;
        }

        loadBlockedPackages(); // Keep synced with dynamic UI selection

        String currentPackage = getForegroundPackage();
        if (currentPackage != null && !currentPackage.isEmpty()) {
            // Do not block StudyRide or Android launcher/system UI
            String myPkg = getPackageName();
            if (currentPackage.equals(myPkg) || currentPackage.equals("com.android.systemui") || currentPackage.equals("android")) {
                return;
            }

            if (blockedPackages.contains(currentPackage)) {
                long timeSinceLastTrigger = now - lastBlockTriggerTime;
                if (!currentPackage.equals(lastBlockedPackage) || timeSinceLastTrigger > 2500) {
                    lastBlockedPackage = currentPackage;
                    lastBlockTriggerTime = now;
                    triggerBlock(currentPackage);
                }
            }
        }
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

    private void triggerBlock(String packageName) {
        try {
            // 1. Prepare intent for BlockOverlayActivity
            Intent blockIntent = new Intent(this, BlockOverlayActivity.class);
            blockIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            blockIntent.putExtra("blocked_package", packageName);

            int pFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                pFlags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(this, 1001, blockIntent, pFlags);

            // 2. Post heads-up high-priority full-screen intent notification
            // Bypasses Android 10+ background activity restrictions across Samsung, Vivo, Xiaomi, Oppo, etc.
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            NotificationCompat.Builder alertBuilder = new NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle("StudyRide Focus Shield")
                    .setContentText("Distracting app blocked! Return to your study session.")
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

            // 4. Also launch BlockOverlayActivity directly (succeeds whenever overlay or task focus is granted)
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
