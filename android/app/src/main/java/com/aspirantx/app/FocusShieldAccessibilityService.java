package com.aspirantx.app;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class FocusShieldAccessibilityService extends AccessibilityService {
    private static final String TAG = "FocusShieldAccessService";
    public static final String PREFS_NAME = "protrack_focus_shield_prefs";
    public static final String PREF_SHIELD_ACTIVE = "shield_is_active";
    public static final String PREF_END_TIMESTAMP = "shield_end_timestamp";
    public static final String PREF_BLOCKED_APPS = "shield_blocked_apps";

    private static volatile boolean isConnected = false;
    private long lastBlockTriggerTime = 0;
    private String lastBlockedPackage = "";

    public static boolean isServiceConnected() {
        return isConnected;
    }

    public static void setShieldState(Context context, boolean active, long endTimestamp, List<String> blockedPackages) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putBoolean(PREF_SHIELD_ACTIVE, active);
        editor.putLong(PREF_END_TIMESTAMP, endTimestamp);
        if (blockedPackages != null) {
            editor.putStringSet(PREF_BLOCKED_APPS, new HashSet<>(blockedPackages));
        }
        editor.commit();
        Log.i(TAG, "Shield state updated: active=" + active + ", ends=" + endTimestamp + ", packages=" + blockedPackages);
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        isConnected = true;
        Log.i(TAG, "FocusShieldAccessibilityService connected successfully.");

        AccessibilityServiceInfo info = new AccessibilityServiceInfo();
        info.eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED | AccessibilityEvent.TYPE_WINDOWS_CHANGED;
        info.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC;
        info.flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS;
        info.notificationTimeout = 50;
        setServiceInfo(info);
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null || event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            return;
        }

        CharSequence pkgChar = event.getPackageName();
        if (pkgChar == null) return;
        String currentPackage = pkgChar.toString();

        // Never intercept ProTrack itself or system UI / home launcher
        if (currentPackage.equals("com.aspirantx.app")
                || currentPackage.equals("com.android.systemui")
                || currentPackage.equals("android")
                || currentPackage.contains("launcher")
                || currentPackage.contains("home")) {
            return;
        }

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean isActive = prefs.getBoolean(PREF_SHIELD_ACTIVE, false);
        if (!isActive) return;

        long endTimestamp = prefs.getLong(PREF_END_TIMESTAMP, 0);
        long now = System.currentTimeMillis();

        // Auto-expire if timer elapsed
        if (now >= endTimestamp) {
            prefs.edit().putBoolean(PREF_SHIELD_ACTIVE, false).commit();
            return;
        }

        Set<String> blockedSet = prefs.getStringSet(PREF_BLOCKED_APPS, Collections.emptySet());
        boolean isTargetBlocked = false;
        if (blockedSet != null && !blockedSet.isEmpty()) {
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
        }

        if (isTargetBlocked) {
            // Debounce rapid window changes for same package within 400ms
            if (currentPackage.equals(lastBlockedPackage) && (now - lastBlockTriggerTime < 400)) {
                return;
            }
            lastBlockTriggerTime = now;
            lastBlockedPackage = currentPackage;

            Log.i(TAG, "Intercepted distraction app launch: " + currentPackage + " -> launching ProTrack Block Overlay");

            // Launch full-screen ProTrack blocking overlay immediately covering the distracting app
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

    @Override
    public void onInterrupt() {
        Log.w(TAG, "FocusShieldAccessibilityService interrupted.");
    }

    @Override
    public boolean onUnbind(Intent intent) {
        isConnected = false;
        return super.onUnbind(intent);
    }
}
