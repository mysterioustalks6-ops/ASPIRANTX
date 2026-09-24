package com.aspirantx.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.usage.UsageEvents;
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

import java.util.Collections;
import java.util.Set;

/**
 * FocusShieldMonitorService
 * 
 * Runs a lightweight foreground monitor during an active study session.
 * Uses UsageStatsManager to detect if a distracting app (e.g. YouTube, Instagram)
 * is opened, and immediately launches BlockOverlayActivity to preserve focus.
 * 
 * Does NOT require Accessibility Service. Works via simple 1-toggle "Usage Access" permission!
 */
public class FocusShieldMonitorService extends Service {
    private static final String TAG = "FocusShieldMonitor";
    public static final String ACTION_START = "com.aspirantx.app.START_MONITOR";
    public static final String ACTION_STOP = "com.aspirantx.app.STOP_MONITOR";
    public static final String CHANNEL_ID = "studyride_focus_monitor_channel";
    public static final int NOTIFICATION_ID = 9103;

    private static volatile boolean isRunning = false;
    private Handler monitorHandler;
    private Runnable monitorRunnable;
    private long lastBlockTriggerTime = 0;
    private String lastBlockedPackage = "";

    public static boolean isMonitorRunning() {
        return isRunning;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;

        String action = intent.getAction();
        if (ACTION_STOP.equals(action)) {
            stopMonitoring();
            stopSelf();
            return START_NOT_STICKY;
        }

        if (ACTION_START.equals(action)) {
            try {
                startForeground(NOTIFICATION_ID, buildNotification());
            } catch (Exception e) {
                Log.w(TAG, "Foreground notification start notice: " + e.getMessage());
            }
            startMonitoring();
        }

        return START_STICKY;
    }

    private void startMonitoring() {
        if (isRunning) return;
        isRunning = true;
        Log.i(TAG, "FocusShieldMonitorService started monitoring.");

        monitorHandler = new Handler(Looper.getMainLooper());
        monitorRunnable = new Runnable() {
            @Override
            public void run() {
                if (!isRunning) return;

                checkForegroundAndBlock();

                // Check every 650ms for low CPU and battery footprint
                if (monitorHandler != null && isRunning) {
                    monitorHandler.postDelayed(this, 650);
                }
            }
        };
        monitorHandler.post(monitorRunnable);
    }

    private void checkForegroundAndBlock() {
        SharedPreferences prefs = getSharedPreferences(FocusShieldAccessibilityService.PREFS_NAME, Context.MODE_PRIVATE);
        boolean isActive = prefs.getBoolean(FocusShieldAccessibilityService.PREF_SHIELD_ACTIVE, false);
        long endTimestamp = prefs.getLong(FocusShieldAccessibilityService.PREF_END_TIMESTAMP, 0);
        long now = System.currentTimeMillis();

        if (!isActive || now >= endTimestamp) {
            Log.i(TAG, "Session expired or inactive, stopping monitor service.");
            stopMonitoring();
            stopSelf();
            return;
        }

        Set<String> blockedSet = prefs.getStringSet(FocusShieldAccessibilityService.PREF_BLOCKED_APPS, Collections.emptySet());
        if (blockedSet == null || blockedSet.isEmpty()) return;

        String currentPackage = getForegroundPackage();
        if (currentPackage == null || currentPackage.isEmpty()) return;

        // Never intercept StudyRide itself, system UI, or phone launcher
        if (currentPackage.equals("com.aspirantx.app")
                || currentPackage.equals("com.android.systemui")
                || currentPackage.equals("android")
                || currentPackage.contains("launcher")
                || currentPackage.contains("home")) {
            return;
        }

        boolean isTargetBlocked = false;
        if (blockedSet.contains(currentPackage)) {
            isTargetBlocked = true;
        } else {
            for (String p : blockedSet) {
                if (currentPackage.equalsIgnoreCase(p)) {
                    isTargetBlocked = true;
                    break;
                }
            }
        }

        if (isTargetBlocked) {
            // Debounce rapid triggers within 800ms
            if (currentPackage.equals(lastBlockedPackage) && (now - lastBlockTriggerTime < 800)) {
                return;
            }
            lastBlockTriggerTime = now;
            lastBlockedPackage = currentPackage;

            Log.i(TAG, "UsageStats detected blocked app: " + currentPackage + " -> Launching BlockOverlayActivity");

            Intent overlayIntent = new Intent(this, BlockOverlayActivity.class);
            overlayIntent.putExtra(BlockOverlayActivity.EXTRA_BLOCKED_PACKAGE, currentPackage);
            overlayIntent.putExtra(BlockOverlayActivity.EXTRA_END_TIMESTAMP, endTimestamp);
            overlayIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_CLEAR_TOP
                    | Intent.FLAG_ACTIVITY_SINGLE_TOP
                    | Intent.FLAG_ACTIVITY_NO_ANIMATION);
            startActivity(overlayIntent);
        }
    }

    private String getForegroundPackage() {
        try {
            UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) return null;

            long time = System.currentTimeMillis();
            UsageEvents events = usm.queryEvents(time - 3500, time);
            if (events == null) return null;

            UsageEvents.Event event = new UsageEvents.Event();
            String topPackage = null;
            while (events.hasNextEvent()) {
                events.getNextEvent(event);
                if (event.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED) {
                    topPackage = event.getPackageName();
                }
            }
            return topPackage;
        } catch (Exception e) {
            return null;
        }
    }

    private void stopMonitoring() {
        isRunning = false;
        if (monitorHandler != null && monitorRunnable != null) {
            monitorHandler.removeCallbacks(monitorRunnable);
        }
    }

    @Override
    public void onDestroy() {
        stopMonitoring();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "StudyRide Focus Session",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows active study session status");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification buildNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("StudyRide Focus Session Active")
                .setContentText("Guarding your study discipline")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .build();
    }
}
