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
