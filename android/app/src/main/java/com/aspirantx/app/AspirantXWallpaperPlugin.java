package com.aspirantx.app;

import android.app.WallpaperInfo;
import android.app.WallpaperManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AspirantXWallpaper")
public class AspirantXWallpaperPlugin extends Plugin {
    private static final String TAG = "AspirantXWallpaperPlg";

    @PluginMethod
    public void updateWallpaperData(PluginCall call) {
        try {
            String candidateName = call.getString("candidateName", "Dedicated Aspirant");
            String examName = call.getString("examName", "Target Examination");
            String targetDate = call.getString("targetDate", "Date TBA");
            Long targetEpochMs = call.getLong("targetEpochMs", 0L);
            Integer daysRemaining = call.getInt("daysRemaining", 0);
            Integer syllabusPct = call.getInt("syllabusPercentage", 0);
            Integer currentStreak = call.getInt("currentStreak", 0);
            Integer completedDays = call.getInt("completedDays", 0);
            String personaId = call.getString("personaId", "solo_shadow");
            String personaTitle = call.getString("personaTitle", "SUNG JIN-WOO • LEVEL UP");
            String characterQuote = call.getString("characterQuote", "I will conquer my weakness. Arise and achieve Rank 1.");
            String accentColor = call.getString("accentColor", "#38bdf8");

            // Background Gradient array (Top, Middle, Bottom)
            String bgGradientJson = "[\"#030712\",\"#0f172a\",\"#1e1b4b\"]";
            if (call.hasOption("bgGradient")) {
                JSArray gradArr = call.getArray("bgGradient");
                if (gradArr != null) {
                    bgGradientJson = gradArr.toString();
                } else {
                    bgGradientJson = call.getString("bgGradient", bgGradientJson);
                }
            }
            
            // Habit matrix can be JSArray or raw JSON String
            String habitMatrixJson = "[]";
            if (call.hasOption("habitMatrix")) {
                JSArray arr = call.getArray("habitMatrix");
                if (arr != null) {
                    habitMatrixJson = arr.toString();
                } else {
                    habitMatrixJson = call.getString("habitMatrix", "[]");
                }
            }

            // Save authoritative canonical data to SharedPreferences
            SharedPreferences prefs = getContext().getSharedPreferences(
                AspirantXWallpaperService.PREFS_NAME,
                Context.MODE_PRIVATE
            );
            prefs.edit()
                .putString("candidate_name", candidateName)
                .putString("exam_name", examName)
                .putString("target_date", targetDate)
                .putLong("target_epoch_ms", targetEpochMs != null ? targetEpochMs : 0L)
                .putInt("days_remaining", daysRemaining != null ? daysRemaining : 0)
                .putInt("syllabus_percentage", syllabusPct != null ? syllabusPct : 0)
                .putInt("current_streak", currentStreak != null ? currentStreak : 0)
                .putInt("completed_days", completedDays != null ? completedDays : 0)
                .putString("persona_id", personaId)
                .putString("persona_title", personaTitle)
                .putString("character_quote", characterQuote)
                .putString("accent_color", accentColor)
                .putString("bg_gradient_json", bgGradientJson)
                .putString("habit_matrix_json", habitMatrixJson)
                .apply();

            // Broadcast update to the live wallpaper engine
            Intent updateIntent = new Intent(AspirantXWallpaperService.ACTION_UPDATE_WALLPAPER);
            updateIntent.setPackage(getContext().getPackageName());
            getContext().sendBroadcast(updateIntent);

            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "Error updating wallpaper data", e);
            call.reject("Failed to update wallpaper data: " + e.getMessage());
        }
    }

    /**
     * Detects the device manufacturer/OEM for OEM-specific fallback handling.
     * Returns lowercase brand: "vivo", "xiaomi", "samsung", "oppo", "realme", etc.
     */
    private String getOemBrand() {
        return Build.BRAND != null ? Build.BRAND.toLowerCase() : "";
    }

    /**
     * Tries to start an Intent and returns true if it succeeded, false otherwise.
     * Wraps all exceptions to prevent crashes.
     */
    private boolean tryStartActivity(android.app.Activity activity, Context context, Intent intent) {
        try {
            if (activity != null && !activity.isFinishing()) {
                activity.startActivity(intent);
                return true;
            } else {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                return true;
            }
        } catch (Exception e) {
            Log.w(TAG, "startActivity failed for " + intent.getAction() + ": " + e.getMessage());
            return false;
        }
    }

    /**
     * Opens the live wallpaper picker using a 5-tier fallback strategy.
     * Returns:
     *   success=true, method="direct"    — ACTION_CHANGE_LIVE_WALLPAPER direct to our service
     *   success=true, method="chooser"   — ACTION_LIVE_WALLPAPER_CHOOSER generic picker
     *   success=true, method="settings"  — Android Settings wallpaper panel
     *   success=false, method="manual"   — All intents failed; user must set manually
     *   Also returns: oem, androidVersion, isVivoOrOEM for JS-side OEM guide display
     */
    @PluginMethod
    public void openLiveWallpaperPicker(PluginCall call) {
        try {
            Context context = getContext();
            android.app.Activity activity = getActivity();
            ComponentName serviceComponent = new ComponentName(context, AspirantXWallpaperService.class);
            String oem = getOemBrand();
            int sdkInt = Build.VERSION.SDK_INT;

            Log.i(TAG, "openLiveWallpaperPicker() oem=" + oem + " sdk=" + sdkInt);
            Log.i(TAG, "Target service: " + serviceComponent.flattenToString());

            String method = "none";
            boolean started = false;

            // ── TIER 1: Direct ACTION_CHANGE_LIVE_WALLPAPER with component ─────────
            if (!started) {
                Intent intent1 = new Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER);
                intent1.putExtra(WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT, serviceComponent);
                if (sdkInt >= 34) {
                    try {
                        android.app.ActivityOptions opts = android.app.ActivityOptions.makeBasic();
                        opts.setPendingIntentBackgroundActivityStartMode(
                            android.app.ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED);
                        android.os.Bundle optsBundle = opts.toBundle();
                        if (activity != null && !activity.isFinishing()) {
                            activity.startActivity(intent1, optsBundle);
                            started = true;
                            method = "direct";
                        } else {
                            intent1.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            context.startActivity(intent1, optsBundle);
                            started = true;
                            method = "direct";
                        }
                    } catch (Exception e34) {
                        started = tryStartActivity(activity, context, intent1);
                        if (started) method = "direct";
                    }
                } else {
                    started = tryStartActivity(activity, context, intent1);
                    if (started) method = "direct";
                }
            }

            // ── TIER 2: ACTION_LIVE_WALLPAPER_CHOOSER ──────────────────────────────
            if (!started) {
                Intent intent2 = new Intent(WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER);
                started = tryStartActivity(activity, context, intent2);
                if (started) method = "chooser";
            }

            // ── TIER 3: Android Settings display/wallpaper panel ──────────────────
            if (!started) {
                try {
                    Intent intent3 = new Intent(android.provider.Settings.ACTION_DISPLAY_SETTINGS);
                    started = tryStartActivity(activity, context, intent3);
                    if (started) method = "settings_display";
                } catch (Exception ignored) {}
            }

            // ── TIER 4: OEM-specific wallpaper app intents ────────────────────────
            if (!started) {
                String oemPkg = null;
                String oemCls = null;
                if (oem.contains("vivo") || oem.contains("iqoo")) {
                    oemPkg = "com.bbk.launcher2";
                    oemCls = "com.bbk.launcher2.wallpaper.WallpaperPickerActivity";
                } else if (oem.contains("xiaomi") || oem.contains("redmi") || oem.contains("poco")) {
                    oemPkg = "com.miui.home";
                    oemCls = "com.miui.home.launcher.gallery.PhotoWallpaperPickerActivity";
                } else if (oem.contains("oppo") || oem.contains("realme") || oem.contains("oneplus")) {
                    oemPkg = "com.coloros.wallpaperservice";
                    oemCls = "com.coloros.wallpaperservice.WallpaperPickerActivity";
                }
                if (oemPkg != null && oemCls != null) {
                    try {
                        Intent oemIntent = new Intent();
                        oemIntent.setClassName(oemPkg, oemCls);
                        started = tryStartActivity(activity, context, oemIntent);
                        if (started) method = "oem_" + oem;
                    } catch (Exception ignored) {}
                }
            }

            // ── TIER 5: General SET_WALLPAPER intent ──────────────────────────────
            if (!started) {
                Intent intent5 = new Intent(Intent.ACTION_SET_WALLPAPER);
                started = tryStartActivity(activity, context, intent5);
                if (started) method = "set_wallpaper_action";
                else method = "manual";
            }

            JSObject res = new JSObject();
            res.put("success", started);
            res.put("method", method);
            res.put("oem", oem);
            res.put("androidVersion", sdkInt);
            res.put("isVivoDevice", oem.contains("vivo") || oem.contains("iqoo"));
            res.put("isXiaomiDevice", oem.contains("xiaomi") || oem.contains("redmi") || oem.contains("poco"));
            res.put("isOEMRestricted", !started || method.equals("manual"));
            res.put("serviceComponent", serviceComponent.flattenToString());
            call.resolve(res);
        } catch (Exception e) {
            JSObject res = new JSObject();
            res.put("success", false);
            res.put("method", "error");
            res.put("error", e.getMessage());
            call.resolve(res);
        }
    }

    @PluginMethod
    public void getWallpaperStatus(PluginCall call) {
        try {
            Context context = getContext();
            WallpaperManager wm = WallpaperManager.getInstance(context);
            boolean isSupported = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                isSupported = wm.isWallpaperSupported();
            }

            if (!isSupported) {
                JSObject res = new JSObject();
                res.put("status", "NOT_SUPPORTED");
                res.put("isSupported", false);
                res.put("isActive", false);
                res.put("activePackage", null);
                res.put("activeComponent", null);
                res.put("oem", getOemBrand());
                res.put("manufacturer", Build.MANUFACTURER);
                res.put("model", Build.MODEL);
                res.put("androidVersion", Build.VERSION.RELEASE);
                res.put("sdkInt", Build.VERSION.SDK_INT);
                call.resolve(res);
                return;
            }

            WallpaperInfo info = wm.getWallpaperInfo();
            boolean isActive = false;
            String activePkg = null;
            String activeComponent = null;

            if (info != null) {
                activePkg = info.getPackageName();
                ComponentName targetComponent = new ComponentName(context, AspirantXWallpaperService.class);
                ComponentName currentComponent = info.getComponent();
                if (currentComponent != null) {
                    activeComponent = currentComponent.flattenToString();
                    if (targetComponent.equals(currentComponent)) {
                        isActive = true;
                    } else if (context.getPackageName().equals(activePkg) && 
                               info.getServiceName() != null && 
                               info.getServiceName().contains("AspirantXWallpaperService")) {
                        isActive = true;
                    }
                }
            }

            String status = isActive ? "ACTIVE" : "AVAILABLE_NOT_SET";

            JSObject res = new JSObject();
            res.put("status", status);
            res.put("isSupported", true);
            res.put("isActive", isActive);
            res.put("activePackage", activePkg);
            res.put("activeComponent", activeComponent);
            res.put("oem", getOemBrand());
            res.put("manufacturer", Build.MANUFACTURER);
            res.put("model", Build.MODEL);
            res.put("androidVersion", Build.VERSION.RELEASE);
            res.put("sdkInt", Build.VERSION.SDK_INT);
            call.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "Error checking wallpaper status", e);
            JSObject res = new JSObject();
            res.put("status", "ERROR");
            res.put("isSupported", true);
            res.put("isActive", false);
            res.put("error", e.getMessage());
            res.put("oem", getOemBrand());
            res.put("manufacturer", Build.MANUFACTURER);
            res.put("model", Build.MODEL);
            res.put("androidVersion", Build.VERSION.RELEASE);
            res.put("sdkInt", Build.VERSION.SDK_INT);
            call.resolve(res);
        }
    }

    @PluginMethod
    public void getDeviceCapabilities(PluginCall call) {
        try {
            Context context = getContext();
            String packageName = context.getPackageName();
            String oem = getOemBrand();

            boolean notificationsGranted = true;
            if (Build.VERSION.SDK_INT >= 33) {
                notificationsGranted = androidx.core.content.ContextCompat.checkSelfPermission(
                    context, 
                    android.Manifest.permission.POST_NOTIFICATIONS
                ) == android.content.pm.PackageManager.PERMISSION_GRANTED;
            }

            boolean isIgnoringBattery = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                android.os.PowerManager pm = (android.os.PowerManager) context.getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    isIgnoringBattery = pm.isIgnoringBatteryOptimizations(packageName);
                }
            }

            JSObject res = new JSObject();
            res.put("notificationsGranted", notificationsGranted);
            res.put("isIgnoringBatteryOptimizations", isIgnoringBattery);
            res.put("oem", oem);
            res.put("manufacturer", Build.MANUFACTURER);
            res.put("model", Build.MODEL);
            res.put("androidVersion", Build.VERSION.RELEASE);
            res.put("sdkInt", Build.VERSION.SDK_INT);
            call.resolve(res);
        } catch (Exception e) {
            JSObject res = new JSObject();
            res.put("notificationsGranted", true);
            res.put("isIgnoringBatteryOptimizations", false);
            res.put("error", e.getMessage());
            call.resolve(res);
        }
    }

    @PluginMethod
    public void requestBatteryOptimizationExemption(PluginCall call) {
        try {
            Context context = getContext();
            android.app.Activity activity = getActivity();
            String packageName = context.getPackageName();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                android.os.PowerManager pm = (android.os.PowerManager) context.getSystemService(Context.POWER_SERVICE);
                if (pm != null && !pm.isIgnoringBatteryOptimizations(packageName)) {
                    Intent intent = new Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(android.net.Uri.parse("package:" + packageName));
                    boolean started = tryStartActivity(activity, context, intent);
                    if (!started) {
                        Intent fallbackIntent = new Intent(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                        started = tryStartActivity(activity, context, fallbackIntent);
                    }
                    JSObject res = new JSObject();
                    res.put("success", started);
                    call.resolve(res);
                    return;
                }
            }

            JSObject res = new JSObject();
            res.put("success", true);
            res.put("alreadyExempt", true);
            call.resolve(res);
        } catch (Exception e) {
            JSObject res = new JSObject();
            res.put("success", false);
            res.put("error", e.getMessage());
            call.resolve(res);
        }
    }

    @PluginMethod
    public void openOemBatterySettings(PluginCall call) {
        try {
            Context context = getContext();
            android.app.Activity activity = getActivity();
            String oem = getOemBrand();
            boolean started = false;

            if (oem.contains("xiaomi") || oem.contains("redmi") || oem.contains("poco")) {
                Intent intent = new Intent();
                intent.setComponent(new ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"));
                started = tryStartActivity(activity, context, intent);
            } else if (oem.contains("vivo") || oem.contains("iqoo")) {
                Intent intent = new Intent();
                intent.setComponent(new ComponentName("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.BgStartUpManager"));
                started = tryStartActivity(activity, context, intent);
            } else if (oem.contains("oppo") || oem.contains("realme") || oem.contains("oneplus")) {
                Intent intent = new Intent();
                intent.setComponent(new ComponentName("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"));
                started = tryStartActivity(activity, context, intent);
            } else if (oem.contains("samsung")) {
                Intent intent = new Intent();
                intent.setComponent(new ComponentName("com.samsung.android.lool", "com.samsung.android.sm.ui.battery.BatteryActivity"));
                started = tryStartActivity(activity, context, intent);
            }

            if (!started) {
                Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(android.net.Uri.parse("package:" + context.getPackageName()));
                started = tryStartActivity(activity, context, intent);
            }

            JSObject res = new JSObject();
            res.put("success", started);
            res.put("oem", oem);
            call.resolve(res);
        } catch (Exception e) {
            JSObject res = new JSObject();
            res.put("success", false);
            res.put("error", e.getMessage());
            call.resolve(res);
        }
    }

    @PluginMethod
    public void isLiveWallpaperActive(PluginCall call) {
        try {
            WallpaperManager wm = WallpaperManager.getInstance(getContext());
            WallpaperInfo info = wm.getWallpaperInfo();
            boolean isActive = false;
            String activePkg = null;
            String activeSvc = null;

            if (info != null) {
                activePkg = info.getPackageName();
                activeSvc = info.getServiceName();
                ComponentName targetComponent = new ComponentName(getContext(), AspirantXWallpaperService.class);
                ComponentName currentComponent = info.getComponent();

                if (targetComponent.equals(currentComponent)) {
                    isActive = true;
                } else if (getContext().getPackageName().equals(activePkg) && 
                           activeSvc != null && activeSvc.contains("AspirantXWallpaperService")) {
                    isActive = true;
                }
            }

            JSObject res = new JSObject();
            res.put("isActive", isActive);
            res.put("activePackage", activePkg);
            res.put("activeService", activeSvc);
            res.put("oem", getOemBrand());
            call.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "Error checking active wallpaper", e);
            JSObject res = new JSObject();
            res.put("isActive", false);
            res.put("activePackage", null);
            res.put("activeService", null);
            res.put("oem", getOemBrand());
            call.resolve(res);
        }
    }
}
