package com.aspirantx.app;

import android.accessibilityservice.AccessibilityService;
import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.Toast;

import java.util.List;

public class FocusShieldAccessibilityService extends AccessibilityService {
    private static final String TAG = "FocusShieldA11y";

    public static final String PREF_BLOCK_SHORTS = "block_shorts_active";
    public static final String PREF_BLOCK_REELS = "block_reels_active";
    public static final String PREF_YT_STUDY_MODE = "youtube_study_mode_active";

    private long lastTriggerTime = 0;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null) return;

        CharSequence pkgChar = event.getPackageName();
        if (pkgChar == null) return;
        String packageName = pkgChar.toString();

        SharedPreferences prefs = getSharedPreferences(FocusShieldPlugin.PREFS_NAME, Context.MODE_PRIVATE);
        boolean blockShorts = prefs.getBoolean(PREF_BLOCK_SHORTS, false);
        boolean blockReels = prefs.getBoolean(PREF_BLOCK_REELS, false);
        boolean ytStudyMode = prefs.getBoolean(PREF_YT_STUDY_MODE, false);

        long now = System.currentTimeMillis();
        if (now - lastTriggerTime < 1500) {
            return; // Debounce to prevent rapid firing
        }

        // 1. YouTube Shorts Inspection — only block if blockShorts is ON AND study mode is OFF
        if ("com.google.android.youtube".equals(packageName) && blockShorts && !ytStudyMode) {
            if (isYouTubeShortsPresent(event)) {
                lastTriggerTime = now;
                performGlobalAction(GLOBAL_ACTION_BACK);
                showToast("🚫 YouTube Shorts Blocked • Lectures Allowed 📚");
                return;
            }
        }

        // 2. Instagram Reels Inspection
        if ("com.instagram.android".equals(packageName) && blockReels) {
            if (isInstagramReelsPresent(event)) {
                lastTriggerTime = now;
                performGlobalAction(GLOBAL_ACTION_BACK);
                showToast("🚫 Instagram Reels Blocked • Stay Disciplined 🎯");
            }
        }
    }

    private boolean isYouTubeShortsPresent(AccessibilityEvent event) {
        try {
            // Check event class name
            CharSequence className = event.getClassName();
            if (className != null && className.toString().contains("ReelWatchActivity")) {
                return true;
            }

            AccessibilityNodeInfo root = getRootInActiveWindow();
            if (root == null) return false;

            // Direct check for YouTube Shorts player bar: reel_time_bar
            List<AccessibilityNodeInfo> timeBars = root.findAccessibilityNodeInfosByViewId("com.google.android.youtube:id/reel_time_bar");
            if (timeBars != null && !timeBars.isEmpty()) {
                recycleList(timeBars);
                root.recycle();
                return true;
            }

            // Check for shorts_container or reel_player_page
            List<AccessibilityNodeInfo> reelPages = root.findAccessibilityNodeInfosByViewId("com.google.android.youtube:id/reel_player_page");
            if (reelPages != null && !reelPages.isEmpty()) {
                recycleList(reelPages);
                root.recycle();
                return true;
            }

            List<AccessibilityNodeInfo> shortsContainers = root.findAccessibilityNodeInfosByViewId("com.google.android.youtube:id/shorts_container");
            if (shortsContainers != null && !shortsContainers.isEmpty()) {
                recycleList(shortsContainers);
                root.recycle();
                return true;
            }

            root.recycle();
        } catch (Exception e) {
            Log.e(TAG, "Error checking YouTube Shorts: " + e.getMessage());
        }
        return false;
    }

    private boolean isInstagramReelsPresent(AccessibilityEvent event) {
        try {
            AccessibilityNodeInfo root = getRootInActiveWindow();
            if (root == null) return false;

            // Check for Instagram Reel viewer or clips viewer
            List<AccessibilityNodeInfo> reelViewers = root.findAccessibilityNodeInfosByViewId("com.instagram.android:id/reel_viewer");
            if (reelViewers != null && !reelViewers.isEmpty()) {
                recycleList(reelViewers);
                root.recycle();
                return true;
            }

            List<AccessibilityNodeInfo> clipsViewers = root.findAccessibilityNodeInfosByViewId("com.instagram.android:id/clips_viewer");
            if (clipsViewers != null && !clipsViewers.isEmpty()) {
                recycleList(clipsViewers);
                root.recycle();
                return true;
            }

            root.recycle();
        } catch (Exception e) {
            Log.e(TAG, "Error checking Instagram Reels: " + e.getMessage());
        }
        return false;
    }

    private void recycleList(List<AccessibilityNodeInfo> list) {
        if (list == null) return;
        for (AccessibilityNodeInfo node : list) {
            if (node != null) {
                try {
                    node.recycle();
                } catch (Exception ignored) {}
            }
        }
    }

    private void showToast(final String message) {
        mainHandler.post(new Runnable() {
            @Override
            public void run() {
                try {
                    Toast.makeText(getApplicationContext(), message, Toast.LENGTH_SHORT).show();
                } catch (Exception ignored) {}
            }
        });
    }

    @Override
    public void onInterrupt() {
        Log.d(TAG, "FocusShieldAccessibilityService interrupted");
    }
}
