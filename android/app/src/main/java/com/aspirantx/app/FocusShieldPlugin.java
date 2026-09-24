package com.aspirantx.app;

import android.app.AppOpsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@CapacitorPlugin(name = "FocusShield")
public class FocusShieldPlugin extends Plugin {
    private static final String TAG = "FocusShieldPlugin";
    public static final String PREFS_NAME = "studyride_focus_shield_clean_prefs";
    public static final String PREF_ACTIVE = "shield_active";
    public static final String PREF_END_TIME = "end_timestamp";

    public static boolean hasUsageStatsPermission(Context context) {
        try {
            AppOpsManager appOps = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(
                    AppOpsManager.OPSTR_GET_USAGE_STATS,
                    android.os.Process.myUid(),
                    context.getPackageName()
            );
            return mode == AppOpsManager.MODE_ALLOWED;
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean hasOverlayPermission(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(context);
        }
        return true;
    }

    @PluginMethod
    public void checkBlockerPermissions(PluginCall call) {
        Context context = getContext();
        boolean hasUsage = hasUsageStatsPermission(context);
        boolean hasOverlay = hasOverlayPermission(context);

        JSObject res = new JSObject();
        res.put("hasUsageStats", hasUsage);
        res.put("hasOverlay", hasOverlay);
        res.put("hasAccessibility", false);
        res.put("canBlock", hasUsage);
        call.resolve(res);
    }

    @PluginMethod
    public void openUsageAccessSettings(PluginCall call) {
        try {
            Context context = getContext();
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.setData(Uri.parse("package:" + context.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception fallback) {
            try {
                Intent generic = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
                generic.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(generic);
                JSObject res = new JSObject();
                res.put("success", true);
                call.resolve(res);
            } catch (Exception e) {
                call.reject("Could not open Usage Access Settings: " + e.getMessage());
            }
        }
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        try {
            Context context = getContext();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + context.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }
            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Could not open Overlay Settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openAppDetailsSettings(PluginCall call) {
        try {
            Context context = getContext();
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + context.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Could not open App Details: " + e.getMessage());
        }
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
        openUsageAccessSettings(call);
    }

    @PluginMethod
    public void startShield(PluginCall call) {
        Context context = getContext();

        JSArray appsArray = call.getArray("apps");
        Set<String> packageSet = new HashSet<>();

        if (appsArray != null) {
            for (int i = 0; i < appsArray.length(); i++) {
                try {
                    String pkg = appsArray.getString(i);
                    if (pkg != null && !pkg.trim().isEmpty()) {
                        packageSet.add(pkg.trim());
                    }
                } catch (JSONException ignored) {}
            }
        }

        if (packageSet.isEmpty()) {
            packageSet.add("com.google.android.youtube");
            packageSet.add("com.instagram.android");
            packageSet.add("com.facebook.katana");
            packageSet.add("com.snapchat.android");
        }

        int durationMinutes = call.getInt("durationMinutes", 25);
        int durationSeconds = call.getInt("durationSeconds", durationMinutes * 60);
        long endTimestamp = System.currentTimeMillis() + (durationSeconds * 1000L);

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .putBoolean(PREF_ACTIVE, true)
                .putLong(PREF_END_TIME, endTimestamp)
                .putStringSet("blocked_packages", packageSet)
                .apply();

        // Start background monitor service if Usage Access permission is present
        boolean hasUsage = hasUsageStatsPermission(context);
        if (hasUsage) {
            try {
                Intent serviceIntent = new Intent(context, FocusShieldMonitorService.class);
                serviceIntent.setAction(FocusShieldMonitorService.ACTION_START);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }
                Log.i(TAG, "Started FocusShieldMonitorService successfully");
            } catch (Exception e) {
                Log.w(TAG, "Could not start monitor service: " + e.getMessage());
            }
        }

        JSObject res = new JSObject();
        res.put("success", true);
        res.put("active", true);
        res.put("restrictedCount", packageSet.size());
        res.put("endTimestamp", endTimestamp);
        res.put("isAccessibilityEnabled", false);
        res.put("hasUsageStats", hasUsage);
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

        try {
            Intent stopIntent = new Intent(context, FocusShieldMonitorService.class);
            stopIntent.setAction(FocusShieldMonitorService.ACTION_STOP);
            context.stopService(stopIntent);
        } catch (Exception ignored) {}

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
        res.put("hasUsageStats", hasUsageStatsPermission(context));
        call.resolve(res);
    }

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        try {
            Context context = getContext();
            PackageManager pm = context.getPackageManager();
            Intent mainIntent = new Intent(Intent.ACTION_MAIN, null);
            mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);

            List<ResolveInfo> resolvedList = pm.queryIntentActivities(mainIntent, 0);
            JSArray appsArray = new JSArray();
            Set<String> seenPackages = new HashSet<>();
            String myPackage = context.getPackageName();

            for (ResolveInfo ri : resolvedList) {
                if (ri.activityInfo == null || ri.activityInfo.packageName == null) continue;
                String pkg = ri.activityInfo.packageName;

                if (pkg.equals(myPackage) || seenPackages.contains(pkg)) continue;
                seenPackages.add(pkg);

                if (pkg.equals("android") || pkg.equals("com.android.systemui") || pkg.equals("com.android.settings")) continue;

                String label = "";
                try {
                    CharSequence cs = ri.loadLabel(pm);
                    if (cs != null) label = cs.toString().trim();
                } catch (Exception ignored) {}
                if (label.isEmpty()) label = pkg;

                String category = categorizeApp(pkg, label);
                boolean isDistraction = isDistractionApp(pkg, label, category);

                JSObject appObj = new JSObject();
                appObj.put("id", pkg);
                appObj.put("name", label);
                appObj.put("package", pkg);
                appObj.put("category", category);
                appObj.put("isDistraction", isDistraction);
                appObj.put("icon", getAppEmoji(category, pkg));
                appsArray.put(appObj);
            }

            JSObject res = new JSObject();
            res.put("apps", appsArray);
            res.put("total", appsArray.length());
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to query apps: " + e.getMessage());
        }
    }

    private String categorizeApp(String pkg, String label) {
        String lowerPkg = pkg.toLowerCase(Locale.ROOT);
        if (lowerPkg.contains("instagram") || lowerPkg.contains("facebook") || lowerPkg.contains("katana")
                || lowerPkg.contains("snapchat") || lowerPkg.contains("reddit") || lowerPkg.contains("twitter")
                || lowerPkg.contains(".x.android") || lowerPkg.contains("sharechat") || lowerPkg.contains("threads")) {
            return "Social";
        }
        if (lowerPkg.contains("youtube") || lowerPkg.contains("netflix") || lowerPkg.contains("hotstar")
                || lowerPkg.contains("primevideo") || lowerPkg.contains("spotify") || lowerPkg.contains("jiocinema")
                || lowerPkg.contains("mohalla.video")) {
            return "Entertainment";
        }
        if (lowerPkg.contains("game") || lowerPkg.contains("play.games") || lowerPkg.contains("pubg")
                || lowerPkg.contains("freefire") || lowerPkg.contains("ludo")) {
            return "Gaming";
        }
        if (lowerPkg.contains("flipkart") || lowerPkg.contains("amazon.mshop") || lowerPkg.contains("myntra")
                || lowerPkg.contains("swiggy") || lowerPkg.contains("zomato")) {
            return "Shopping";
        }
        return "Other";
    }

    private boolean isDistractionApp(String pkg, String label, String category) {
        return "Social".equals(category) || "Entertainment".equals(category) || "Gaming".equals(category) || "Shopping".equals(category);
    }

    private String getAppEmoji(String category, String pkg) {
        String lowerPkg = pkg.toLowerCase(Locale.ROOT);
        if (lowerPkg.contains("youtube")) return "▶️";
        if (lowerPkg.contains("instagram")) return "📸";
        if (lowerPkg.contains("facebook")) return "👥";
        if (lowerPkg.contains("snapchat")) return "👻";
        if (lowerPkg.contains("reddit")) return "🤖";
        if (lowerPkg.contains("twitter")) return "🐦";
        if (lowerPkg.contains("hotstar")) return "⭐";
        if (lowerPkg.contains("spotify")) return "🎵";
        if (lowerPkg.contains("flipkart") || lowerPkg.contains("amazon")) return "🛍️";
        if (lowerPkg.contains("swiggy") || lowerPkg.contains("zomato")) return "🍔";

        switch (category) {
            case "Social": return "💬";
            case "Entertainment": return "🎬";
            case "Gaming": return "🎮";
            case "Shopping": return "🛍️";
            default: return "📱";
        }
    }
}
