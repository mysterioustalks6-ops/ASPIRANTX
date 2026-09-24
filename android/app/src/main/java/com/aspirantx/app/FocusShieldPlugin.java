package com.aspirantx.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.app.AppOpsManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import org.json.JSONException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@CapacitorPlugin(name = "FocusShield")
public class FocusShieldPlugin extends Plugin {
    private static final String TAG = "FocusShieldPlugin";

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

    public static boolean isAccessibilityServiceEnabled(Context context) {
        ComponentName expectedComponentName = new ComponentName(context, FocusShieldAccessibilityService.class);
        String enabledServicesSetting = Settings.Secure.getString(
                context.getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        );
        if (enabledServicesSetting == null) return false;

        TextUtils.SimpleStringSplitter colonSplitter = new TextUtils.SimpleStringSplitter(':');
        colonSplitter.setString(enabledServicesSetting);

        while (colonSplitter.hasNext()) {
            String componentNameString = colonSplitter.next();
            ComponentName enabledComponent = ComponentName.unflattenFromString(componentNameString);
            if (enabledComponent != null && enabledComponent.equals(expectedComponentName)) {
                return true;
            }
        }
        return false;
    }

    @PluginMethod
    public void checkBlockerPermissions(PluginCall call) {
        Context context = getContext();
        boolean hasUsage = hasUsageStatsPermission(context);
        boolean hasOverlay = hasOverlayPermission(context);
        boolean hasAccess = isAccessibilityServiceEnabled(context);
        boolean canBlock = hasUsage || hasAccess;

        JSObject res = new JSObject();
        res.put("hasUsageStats", hasUsage);
        res.put("hasOverlay", hasOverlay);
        res.put("hasAccessibility", hasAccess);
        res.put("canBlock", canBlock);
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
    public void isAccessibilityEnabled(PluginCall call) {
        boolean enabled = isAccessibilityServiceEnabled(getContext());
        JSObject res = new JSObject();
        res.put("enabled", enabled);
        res.put("connected", FocusShieldAccessibilityService.isServiceConnected());
        call.resolve(res);
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Could not open Accessibility Settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void startShield(PluginCall call) {
        Context context = getContext();

        JSArray appsArray = call.getArray("apps");
        ArrayList<String> packages = new ArrayList<>();

        if (appsArray != null) {
            for (int i = 0; i < appsArray.length(); i++) {
                try {
                    String pkg = appsArray.getString(i);
                    if (pkg != null && !pkg.trim().isEmpty()) {
                        packages.add(pkg.trim());
                    }
                } catch (JSONException ignored) {}
            }
        }

        // Default distraction packages if empty
        if (packages.isEmpty()) {
            packages.add("com.google.android.youtube");
            packages.add("com.instagram.android");
        }

        int durationMinutes = call.getInt("durationMinutes", 25);
        int durationSeconds = call.getInt("durationSeconds", durationMinutes * 60);
        long endTimestamp = System.currentTimeMillis() + (durationSeconds * 1000L);

        // Update state in SharedPreferences for both Accessibility & UsageStats monitor
        FocusShieldAccessibilityService.setShieldState(context, true, endTimestamp, packages);

        // Start UsageStats background monitor service if Usage Access permission is present
        if (hasUsageStatsPermission(context)) {
            try {
                Intent monitorIntent = new Intent(context, FocusShieldMonitorService.class);
                monitorIntent.setAction(FocusShieldMonitorService.ACTION_START);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(monitorIntent);
                } else {
                    context.startService(monitorIntent);
                }
                Log.i(TAG, "Started FocusShieldMonitorService for background distraction monitoring");
            } catch (Exception e) {
                Log.w(TAG, "Could not start FocusShieldMonitorService: " + e.getMessage());
            }
        }

        JSObject res = new JSObject();
        res.put("success", true);
        res.put("active", true);
        res.put("restrictedCount", packages.size());
        res.put("endTimestamp", endTimestamp);
        res.put("isAccessibilityEnabled", isAccessibilityServiceEnabled(context));
        res.put("hasUsageStats", hasUsageStatsPermission(context));
        call.resolve(res);
    }

    @PluginMethod
    public void stopShield(PluginCall call) {
        Context context = getContext();
        FocusShieldAccessibilityService.setShieldState(context, false, 0, null);

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
        SharedPreferences prefs = context.getSharedPreferences(
                FocusShieldAccessibilityService.PREFS_NAME,
                Context.MODE_PRIVATE
        );

        boolean active = prefs.getBoolean(FocusShieldAccessibilityService.PREF_SHIELD_ACTIVE, false);
        long endTimestamp = prefs.getLong(FocusShieldAccessibilityService.PREF_END_TIMESTAMP, 0);
        long now = System.currentTimeMillis();

        if (active && now >= endTimestamp) {
            active = false;
            prefs.edit().putBoolean(FocusShieldAccessibilityService.PREF_SHIELD_ACTIVE, false).apply();
        }

        long remainingSeconds = active ? Math.max(0, (endTimestamp - now) / 1000L) : 0;

        JSObject res = new JSObject();
        res.put("isActive", active);
        res.put("endTimestamp", endTimestamp);
        res.put("remainingSeconds", remainingSeconds);
        res.put("isAccessibilityEnabled", isAccessibilityServiceEnabled(context));
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

                // Don't include ourselves or duplicate entries
                if (pkg.equals(myPackage) || seenPackages.contains(pkg)) {
                    continue;
                }
                seenPackages.add(pkg);

                // Ignore basic system internal packages if found in launcher query
                if (pkg.equals("android") || pkg.equals("com.android.systemui") || pkg.equals("com.android.settings")) {
                    continue;
                }

                String label = "";
                try {
                    CharSequence cs = ri.loadLabel(pm);
                    if (cs != null) label = cs.toString().trim();
                } catch (Exception ignored) {}

                if (label.isEmpty()) {
                    label = pkg;
                }

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
            Log.e(TAG, "Error fetching installed apps: " + e.getMessage(), e);
            call.reject("Failed to list installed apps: " + e.getMessage());
        }
    }

    private String categorizeApp(String pkg, String label) {
        String lowerPkg = pkg.toLowerCase(Locale.ROOT);
        String lowerLabel = label.toLowerCase(Locale.ROOT);

        // Social
        if (lowerPkg.contains("instagram") || lowerPkg.contains("facebook") || lowerPkg.contains("katana")
                || lowerPkg.contains("snapchat") || lowerPkg.contains("reddit") || lowerPkg.contains("twitter")
                || lowerPkg.contains(".x.android") || lowerPkg.contains("pinterest") || lowerPkg.contains("sharechat")
                || lowerPkg.contains("telegram") || lowerPkg.contains("discord") || lowerPkg.contains("threads")
                || lowerPkg.contains("tinder") || lowerPkg.contains("bumble") || lowerPkg.contains("linkedin")
                || lowerPkg.contains("whatsapp") || lowerLabel.contains("social") || lowerLabel.contains("chat")) {
            return "Social";
        }

        // Video & Entertainment & Music
        if (lowerPkg.contains("youtube") || lowerPkg.contains("netflix") || lowerPkg.contains("hotstar")
                || lowerPkg.contains("primevideo") || lowerPkg.contains("spotify") || lowerPkg.contains("jiocinema")
                || lowerPkg.contains("zee5") || lowerPkg.contains("sonyliv") || lowerPkg.contains("twitch")
                || lowerPkg.contains("cardfeed") || lowerPkg.contains("eterno") || lowerPkg.contains("video")
                || lowerPkg.contains("pvr") || lowerPkg.contains("wynk") || lowerPkg.contains("gaana")
                || lowerPkg.contains("mohalla.video") || lowerLabel.contains("video") || lowerLabel.contains("music")
                || lowerLabel.contains("tv") || lowerLabel.contains("movie") || lowerLabel.contains("cinema")) {
            return "Entertainment";
        }

        // Gaming
        if (lowerPkg.contains("game") || lowerPkg.contains("play.games") || lowerPkg.contains("pubg")
                || lowerPkg.contains("bgmi") || lowerPkg.contains("freefire") || lowerPkg.contains("ludo")
                || lowerPkg.contains("candy") || lowerPkg.contains("subway") || lowerPkg.contains("clash")
                || lowerPkg.contains("roblox") || lowerPkg.contains("minecraft") || lowerLabel.contains("game")) {
            return "Gaming";
        }

        // Shopping & Food
        if (lowerPkg.contains("flipkart") || lowerPkg.contains("amazon.mshop") || lowerPkg.contains("myntra")
                || lowerPkg.contains("swiggy") || lowerPkg.contains("zomato") || lowerPkg.contains("meesho")
                || lowerPkg.contains("ajio") || lowerPkg.contains("blinkit") || lowerPkg.contains("zepto")
                || lowerPkg.contains("magicpin") || lowerPkg.contains("olx") || lowerPkg.contains("lenskart")
                || lowerLabel.contains("shop") || lowerLabel.contains("store") || lowerLabel.contains("food")) {
            return "Shopping";
        }

        return "Other";
    }

    private boolean isDistractionApp(String pkg, String label, String category) {
        if ("Social".equals(category) || "Entertainment".equals(category) || "Gaming".equals(category)) {
            return true;
        }
        if ("Shopping".equals(category)) {
            return true;
        }
        String lowerPkg = pkg.toLowerCase(Locale.ROOT);
        return lowerPkg.contains("browser") || lowerPkg.contains("chrome") || lowerPkg.contains("brave");
    }

    private String getAppEmoji(String category, String pkg) {
        String lowerPkg = pkg.toLowerCase(Locale.ROOT);
        if (lowerPkg.contains("youtube")) return "▶️";
        if (lowerPkg.contains("instagram")) return "📸";
        if (lowerPkg.contains("facebook") || lowerPkg.contains("katana")) return "👥";
        if (lowerPkg.contains("snapchat")) return "👻";
        if (lowerPkg.contains("reddit")) return "🤖";
        if (lowerPkg.contains("twitter") || lowerPkg.contains(".x.android")) return "🐦";
        if (lowerPkg.contains("hotstar")) return "⭐";
        if (lowerPkg.contains("spotify")) return "🎵";
        if (lowerPkg.contains("sharechat")) return "💬";
        if (lowerPkg.contains("swiggy") || lowerPkg.contains("zomato")) return "🍔";
        if (lowerPkg.contains("flipkart") || lowerPkg.contains("amazon")) return "🛍️";
        if (lowerPkg.contains("whatsapp")) return "🟢";
        if (lowerPkg.contains("telegram")) return "✈️";

        switch (category) {
            case "Social": return "💬";
            case "Entertainment": return "🎬";
            case "Gaming": return "🎮";
            case "Shopping": return "🛍️";
            default: return "📱";
        }
    }
}
