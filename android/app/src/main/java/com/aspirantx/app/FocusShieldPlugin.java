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

import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

@CapacitorPlugin(name = "FocusShield")
public class FocusShieldPlugin extends Plugin {
    private static final String TAG = "FocusShieldPlugin";
    public static final String PREFS_NAME = "studyride_focus_shield_clean_prefs";
    public static final String PREF_ACTIVE = "shield_active";
    public static final String PREF_END_TIME = "end_timestamp";
    public static final String PREF_DAILY_LIMITS = "app_daily_limits";
    public static final String PREF_SCHEDULES = "study_schedules";
    public static final String PREF_EMERGENCY_PASSES = "emergency_passes";
    public static final String PREF_APP_GROUPS = "studyride_app_groups";

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

    public static boolean hasAccessibilityPermission(Context context) {
        try {
            android.view.accessibility.AccessibilityManager am =
                    (android.view.accessibility.AccessibilityManager) context.getSystemService(Context.ACCESSIBILITY_SERVICE);
            if (am != null) {
                java.util.List<android.accessibilityservice.AccessibilityServiceInfo> services =
                        am.getEnabledAccessibilityServiceList(android.accessibilityservice.AccessibilityServiceInfo.FEEDBACK_ALL_MASK);
                if (services != null) {
                    for (android.accessibilityservice.AccessibilityServiceInfo s : services) {
                        if (s.getId() != null && s.getId().contains(context.getPackageName())) {
                            return true;
                        }
                    }
                }
            }
        } catch (Exception ignored) {}

        try {
            int accessibilityEnabled = Settings.Secure.getInt(
                    context.getContentResolver(),
                    Settings.Secure.ACCESSIBILITY_ENABLED
            );
            if (accessibilityEnabled == 1) {
                String settingValue = Settings.Secure.getString(
                        context.getContentResolver(),
                        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
                );
                if (settingValue != null) {
                    return settingValue.contains("FocusShieldAccessibilityService");
                }
            }
        } catch (Exception ignored) {}
        return false;
    }

    @PluginMethod
    public void checkBlockerPermissions(PluginCall call) {
        Context context = getContext();
        boolean hasUsage = hasUsageStatsPermission(context);
        boolean hasOverlay = hasOverlayPermission(context);
        boolean hasAccessibility = hasAccessibilityPermission(context);

        JSObject res = new JSObject();
        res.put("hasUsageStats", hasUsage);
        res.put("hasOverlay", hasOverlay);
        res.put("hasAccessibility", hasAccessibility);
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
                try {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                            Uri.parse("package:" + context.getPackageName()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);
                } catch (Exception fallback) {
                    Intent generic = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                    generic.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(generic);
                }
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
        boolean enabled = hasAccessibilityPermission(getContext());
        JSObject res = new JSObject();
        res.put("enabled", enabled);
        res.put("connected", enabled);
        call.resolve(res);
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        try {
            Context context = getContext();
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Could not open Accessibility Settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setGranularBlockRules(PluginCall call) {
        boolean blockShorts = call.getBoolean("blockShorts", false);
        boolean blockReels = call.getBoolean("blockReels", false);
        boolean youtubeStudyMode = call.getBoolean("youtubeStudyMode", false);

        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        Set<String> currentBlocked = prefs.getStringSet("blocked_packages", new HashSet<>());
        Set<String> updated = new HashSet<>(currentBlocked);

        // Add or REMOVE packages based on toggle state
        if (blockReels) {
            updated.add("com.instagram.android");
        } else {
            updated.remove("com.instagram.android"); // Remove when toggle OFF
        }
        if (blockShorts && !youtubeStudyMode) {
            updated.add("com.google.android.youtube");
        } else if (!blockShorts || youtubeStudyMode) {
            // Only remove YouTube from blocked list if no active focus session
            boolean manualActive = prefs.getBoolean(FocusShieldPlugin.PREF_ACTIVE, false);
            if (!manualActive) {
                updated.remove("com.google.android.youtube"); // Remove when toggle OFF
            }
        }

        prefs.edit()
                .putBoolean(FocusShieldAccessibilityService.PREF_BLOCK_SHORTS, blockShorts)
                .putBoolean(FocusShieldAccessibilityService.PREF_BLOCK_REELS, blockReels)
                .putBoolean(FocusShieldAccessibilityService.PREF_YT_STUDY_MODE, youtubeStudyMode)
                .putStringSet("blocked_packages", updated)
                .apply();

        // Start monitor if either reels or shorts blocking is enabled
        if ((blockReels || blockShorts) && hasUsageStatsPermission(context)) {
            try {
                Intent serviceIntent = new Intent(context, FocusShieldMonitorService.class);
                serviceIntent.setAction(FocusShieldMonitorService.ACTION_START);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }
            } catch (Exception ignored) {}
        }

        JSObject res = new JSObject();
        res.put("success", true);
        call.resolve(res);
    }

    @PluginMethod
    public void getGranularBlockRules(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        // Default false = toggles start OFF on fresh install (user must explicitly enable)
        boolean blockShorts = prefs.getBoolean(FocusShieldAccessibilityService.PREF_BLOCK_SHORTS, false);
        boolean blockReels = prefs.getBoolean(FocusShieldAccessibilityService.PREF_BLOCK_REELS, false);
        boolean youtubeStudyMode = prefs.getBoolean(FocusShieldAccessibilityService.PREF_YT_STUDY_MODE, false);

        JSObject res = new JSObject();
        res.put("blockShorts", blockShorts);
        res.put("blockReels", blockReels);
        res.put("youtubeStudyMode", youtubeStudyMode);
        call.resolve(res);
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
            JSArray appsArray = new JSArray();
            Set<String> seenPackages = new HashSet<>();
            String myPackage = context.getPackageName();

            Intent mainIntent = new Intent(Intent.ACTION_MAIN, null);
            mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);

            List<ResolveInfo> resolvedList = pm.queryIntentActivities(mainIntent, 0);
            if (resolvedList != null) {
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
            }

            // Fallback for Android 11+ OEM devices: also check getInstalledApplications
            try {
                List<android.content.pm.ApplicationInfo> appList = pm.getInstalledApplications(0);
                if (appList != null) {
                    for (android.content.pm.ApplicationInfo ai : appList) {
                        String pkg = ai.packageName;
                        if (pkg == null || pkg.equals(myPackage) || seenPackages.contains(pkg)) continue;
                        
                        boolean isSystem = (ai.flags & android.content.pm.ApplicationInfo.FLAG_SYSTEM) != 0;
                        Intent launchIntent = pm.getLaunchIntentForPackage(pkg);
                        if (launchIntent != null || !isSystem) {
                            seenPackages.add(pkg);
                            String label = "";
                            try {
                                CharSequence cs = ai.loadLabel(pm);
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
                    }
                }
            } catch (Exception ignored) {}

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

    @PluginMethod
    public void getDailyUsageStats(PluginCall call) {
        try {
            Context context = getContext();
            if (!hasUsageStatsPermission(context)) {
                JSObject err = new JSObject();
                err.put("hasPermission", false);
                err.put("apps", new JSArray());
                err.put("totalScreenTimeMinutes", 0);
                call.resolve(err);
                return;
            }

            UsageStatsManager usm = (UsageStatsManager) context.getSystemService(Context.USAGE_STATS_SERVICE);
            if (usm == null) {
                call.reject("UsageStatsManager not available");
                return;
            }

            Calendar c = Calendar.getInstance();
            long now = c.getTimeInMillis();
            c.set(Calendar.HOUR_OF_DAY, 0);
            c.set(Calendar.MINUTE, 0);
            c.set(Calendar.SECOND, 0);
            c.set(Calendar.MILLISECOND, 0);
            long startOfDay = c.getTimeInMillis();

            Map<String, UsageStats> aggregated = usm.queryAndAggregateUsageStats(startOfDay, now);
            PackageManager pm = context.getPackageManager();

            Intent mainIntent = new Intent(Intent.ACTION_MAIN, null);
            mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);
            List<ResolveInfo> resolvedList = pm.queryIntentActivities(mainIntent, 0);

            JSArray appsArray = new JSArray();
            Set<String> seen = new HashSet<>();
            String myPkg = context.getPackageName();

            long totalTimeMs = 0;
            long productiveTimeMs = 0;
            long distractionTimeMs = 0;

            for (ResolveInfo ri : resolvedList) {
                if (ri.activityInfo == null || ri.activityInfo.packageName == null) continue;
                String pkg = ri.activityInfo.packageName;
                if (pkg.equals(myPkg) || seen.contains(pkg)) continue;
                seen.add(pkg);

                if (pkg.equals("android") || pkg.equals("com.android.systemui") || pkg.equals("com.android.settings")) continue;

                long usageMs = 0;
                long lastUsed = 0;
                if (aggregated != null && aggregated.containsKey(pkg)) {
                    UsageStats u = aggregated.get(pkg);
                    if (u != null) {
                        usageMs = u.getTotalTimeInForeground();
                        lastUsed = u.getLastTimeUsed();
                    }
                }

                String label = "";
                try {
                    CharSequence cs = ri.loadLabel(pm);
                    if (cs != null) label = cs.toString().trim();
                } catch (Exception ignored) {}
                if (label.isEmpty()) label = pkg;

                String category = categorizeApp(pkg, label);
                boolean isDistraction = isDistractionApp(pkg, label, category);

                if (usageMs > 0) {
                    totalTimeMs += usageMs;
                    if (isDistraction) {
                        distractionTimeMs += usageMs;
                    } else {
                        productiveTimeMs += usageMs;
                    }
                }

                JSObject item = new JSObject();
                item.put("package", pkg);
                item.put("name", label);
                item.put("category", category);
                item.put("isDistraction", isDistraction);
                item.put("icon", getAppEmoji(category, pkg));
                item.put("usageMinutes", (int) (usageMs / 60000L));
                item.put("usageSeconds", (int) (usageMs / 1000L));
                item.put("lastUsed", lastUsed);
                appsArray.put(item);
            }

            JSObject res = new JSObject();
            res.put("hasPermission", true);
            res.put("totalScreenTimeMinutes", (int) (totalTimeMs / 60000L));
            res.put("productiveMinutes", (int) (productiveTimeMs / 60000L));
            res.put("distractionMinutes", (int) (distractionTimeMs / 60000L));
            res.put("apps", appsArray);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to query daily usage: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setAppDailyLimits(PluginCall call) {
        try {
            Context context = getContext();
            JSObject limitsObj = call.getObject("limits");
            String limitsJson = limitsObj != null ? limitsObj.toString() : "{}";

            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(PREF_DAILY_LIMITS, limitsJson).apply();

            ensureProtectionService();

            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to set app daily limits: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getAppDailyLimits(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String limitsJson = prefs.getString(PREF_DAILY_LIMITS, "{}");

            JSObject res = new JSObject();
            res.put("limits", new JSObject(limitsJson));
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to get app daily limits: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setStudySchedules(PluginCall call) {
        try {
            Context context = getContext();
            JSArray schedulesArr = call.getArray("schedules");
            String schedulesJson = schedulesArr != null ? schedulesArr.toString() : "[]";

            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(PREF_SCHEDULES, schedulesJson).apply();

            ensureProtectionService();

            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to set study schedules: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getStudySchedules(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String schedulesJson = prefs.getString(PREF_SCHEDULES, "[]");

            JSObject res = new JSObject();
            res.put("schedules", new JSArray(schedulesJson));
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to get study schedules: " + e.getMessage());
        }
    }

    @PluginMethod
    public void grantEmergencyPass(PluginCall call) {
        try {
            String pkg = call.getString("package");
            int passMinutes = call.getInt("minutes", 5);
            if (pkg == null || pkg.isEmpty()) {
                call.reject("Package name required");
                return;
            }

            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            long expiry = System.currentTimeMillis() + (passMinutes * 60000L);

            String currentPassesJson = prefs.getString(PREF_EMERGENCY_PASSES, "{}");
            JSObject passesObj = new JSObject(currentPassesJson);
            passesObj.put(pkg, expiry);

            prefs.edit().putString(PREF_EMERGENCY_PASSES, passesObj.toString()).apply();

            JSObject res = new JSObject();
            res.put("success", true);
            res.put("package", pkg);
            res.put("expiry", expiry);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to grant emergency pass: " + e.getMessage());
        }
    }

    @PluginMethod
    public void setAppGroups(PluginCall call) {
        try {
            Context context = getContext();
            JSArray groupsArr = call.getArray("groups");
            String groupsJson = groupsArr != null ? groupsArr.toString() : "[]";

            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(PREF_APP_GROUPS, groupsJson).apply();

            ensureProtectionService();

            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to set app groups: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getAppGroups(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String groupsJson = prefs.getString(PREF_APP_GROUPS, "[]");

            JSObject res = new JSObject();
            res.put("groups", new JSArray(groupsJson));
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to get app groups: " + e.getMessage());
        }
    }

    private void ensureProtectionService() {
        try {
            Context context = getContext();
            if (hasUsageStatsPermission(context)) {
                Intent serviceIntent = new Intent(context, FocusShieldMonitorService.class);
                serviceIntent.setAction(FocusShieldMonitorService.ACTION_START);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent);
                } else {
                    context.startService(serviceIntent);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "ensureProtectionService: " + e.getMessage());
        }
    }
}
