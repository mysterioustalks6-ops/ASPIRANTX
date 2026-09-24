package com.aspirantx.app;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "FocusShield")
public class FocusShieldPlugin extends Plugin {
    private static final String PREFS_NAME = "studyride_focus_shield_clean_prefs";
    private static final String PREF_ACTIVE = "shield_active";
    private static final String PREF_END_TIME = "end_timestamp";

    @PluginMethod
    public void checkBlockerPermissions(PluginCall call) {
        JSObject res = new JSObject();
        res.put("hasUsageStats", false);
        res.put("hasOverlay", false);
        res.put("hasAccessibility", false);
        res.put("canBlock", false);
        call.resolve(res);
    }

    @PluginMethod
    public void openUsageAccessSettings(PluginCall call) {
        JSObject res = new JSObject();
        res.put("success", true);
        call.resolve(res);
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        JSObject res = new JSObject();
        res.put("success", true);
        call.resolve(res);
    }

    @PluginMethod
    public void isAccessibilityEnabled(PluginCall call) {
        JSObject res = new JSObject();
        res.put("enabled", false);
        res.put("connected", false);
        call.resolve(res);
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        JSObject res = new JSObject();
        res.put("success", true);
        call.resolve(res);
    }

    @PluginMethod
    public void startShield(PluginCall call) {
        Context context = getContext();
        int durationMinutes = call.getInt("durationMinutes", 25);
        int durationSeconds = call.getInt("durationSeconds", durationMinutes * 60);
        long endTimestamp = System.currentTimeMillis() + (durationSeconds * 1000L);

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .putBoolean(PREF_ACTIVE, true)
                .putLong(PREF_END_TIME, endTimestamp)
                .apply();

        JSObject res = new JSObject();
        res.put("success", true);
        res.put("active", true);
        res.put("restrictedCount", 0);
        res.put("endTimestamp", endTimestamp);
        res.put("isAccessibilityEnabled", false);
        res.put("hasUsageStats", false);
        call.resolve(res);
    }

    @PluginMethod
    public void stopShield(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .putBoolean(PREF_ACTIVE, false)
                .putLong(PREF_END_TIME, 0)
                .apply();

        JSObject res = new JSObject();
        res.put("success", true);
        res.put("active", false);
        call.resolve(res);
    }

    @PluginMethod
    public void getShieldStatus(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        boolean active = prefs.getBoolean(PREF_ACTIVE, false);
        long endTimestamp = prefs.getLong(PREF_END_TIME, 0);
        long now = System.currentTimeMillis();

        if (active && now >= endTimestamp) {
            active = false;
            prefs.edit().putBoolean(PREF_ACTIVE, false).apply();
        }

        long remainingSeconds = active ? Math.max(0, (endTimestamp - now) / 1000L) : 0;

        JSObject res = new JSObject();
        res.put("isActive", active);
        res.put("endTimestamp", endTimestamp);
        res.put("remainingSeconds", remainingSeconds);
        res.put("isAccessibilityEnabled", false);
        call.resolve(res);
    }

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        JSArray appsArray = new JSArray();

        addApp(appsArray, "com.instagram.android", "Instagram", "Social", "📸", true);
        addApp(appsArray, "com.google.android.youtube", "YouTube", "Entertainment", "▶️", true);
        addApp(appsArray, "com.facebook.katana", "Facebook", "Social", "👥", true);
        addApp(appsArray, "com.snapchat.android", "Snapchat", "Social", "👻", true);
        addApp(appsArray, "in.startv.hotstar", "Disney+ Hotstar", "Entertainment", "⭐", true);
        addApp(appsArray, "in.mohalla.sharechat", "ShareChat", "Social", "💬", true);
        addApp(appsArray, "in.mohalla.video", "Moj Video", "Entertainment", "🎬", true);
        addApp(appsArray, "com.reddit.frontpage", "Reddit", "Social", "🤖", true);
        addApp(appsArray, "com.twitter.android", "X / Twitter", "Social", "🐦", true);
        addApp(appsArray, "com.spotify.music", "Spotify Music", "Entertainment", "🎵", false);
        addApp(appsArray, "com.flipkart.android", "Flipkart", "Shopping", "🛍️", false);
        addApp(appsArray, "in.amazon.mShop.android.shopping", "Amazon Shopping", "Shopping", "📦", false);
        addApp(appsArray, "in.swiggy.android", "Swiggy", "Shopping", "🍔", false);

        JSObject res = new JSObject();
        res.put("apps", appsArray);
        res.put("total", appsArray.length());
        call.resolve(res);
    }

    private void addApp(JSArray array, String pkg, String name, String category, String icon, boolean isDistraction) {
        JSObject obj = new JSObject();
        obj.put("id", pkg);
        obj.put("name", name);
        obj.put("package", pkg);
        obj.put("category", category);
        obj.put("icon", icon);
        obj.put("isDistraction", isDistraction);
        array.put(obj);
    }
}
