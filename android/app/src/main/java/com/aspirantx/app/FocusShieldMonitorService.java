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

import java.util.HashSet;
import java.util.Set;

public class FocusShieldMonitorService extends Service {
    private static final String TAG = "FocusShieldMonitor";
    public static final String ACTION_START = "com.aspirantx.app.ACTION_START_FOCUS_MONITOR";
    public static final String ACTION_STOP = "com.aspirantx.app.ACTION_STOP_FOCUS_MONITOR";
    private static final String CHANNEL_ID = "studyride_focus_shield_channel";
    private static final int NOTIFICATION_ID = 9021;

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

        String currentPackage = getForegroundPackage();
        if (currentPackage != null && !currentPackage.isEmpty()) {
            if (blockedPackages.contains(currentPackage)) {
                long timeSinceLastTrigger = now - lastBlockTriggerTime;
                if (!currentPackage.equals(lastBlockedPackage) || timeSinceLastTrigger > 3000) {
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
            long begin = end - 3000;

            UsageEvents events = usm.queryEvents(begin, end);
            UsageEvents.Event event = new UsageEvents.Event();
            String latest = null;

            while (events.hasNextEvent()) {
                events.getNextEvent(event);
                if (event.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED) {
                    latest = event.getPackageName();
                }
            }
            return latest;
        } catch (Exception e) {
            return null;
        }
    }

    private void triggerBlock(String packageName) {
        try {
            // 1. Send HOME intent to immediately collapse the blocked app
            Intent homeIntent = new Intent(Intent.ACTION_MAIN);
            homeIntent.addCategory(Intent.CATEGORY_HOME);
            homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(homeIntent);

            // 2. Launch BlockOverlayActivity to display the study timer lock screen
            Intent blockIntent = new Intent(this, BlockOverlayActivity.class);
            blockIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            blockIntent.putExtra("blocked_package", packageName);
            startActivity(blockIntent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch block overlay: " + e.getMessage());
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "StudyRide Focus Shield",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows active focus session status");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
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
