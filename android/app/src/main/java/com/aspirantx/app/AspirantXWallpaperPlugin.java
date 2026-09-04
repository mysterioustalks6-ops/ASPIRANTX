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

    @PluginMethod
    public void openLiveWallpaperPicker(PluginCall call) {
        try {
            Context context = getContext();
            android.app.Activity activity = getActivity();
            ComponentName serviceComponent = new ComponentName(context, AspirantXWallpaperService.class);

            Log.i(TAG, "Initiating live wallpaper preview request for: " + serviceComponent.flattenToString());

            Intent intent = new Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER);
            intent.putExtra(WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT, serviceComponent);

            boolean started = false;
            try {
                android.os.Bundle activityOptionsBundle = null;
                if (Build.VERSION.SDK_INT >= 34) {
                    try {
                        android.app.ActivityOptions options = android.app.ActivityOptions.makeBasic();
                        options.setPendingIntentBackgroundActivityStartMode(android.app.ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED);
                        options.setPendingIntentCreatorBackgroundActivityStartMode(android.app.ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED);
                        activityOptionsBundle = options.toBundle();
                    } catch (Throwable ignored) {}
                }

                if (activity != null) {
                    if (activityOptionsBundle != null) {
                        activity.startActivity(intent, activityOptionsBundle);
                    } else {
                        activity.startActivity(intent);
                    }
                    started = true;
                    Log.i(TAG, "Launched ACTION_CHANGE_LIVE_WALLPAPER via Activity context");
                } else {
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    if (activityOptionsBundle != null) {
                        context.startActivity(intent, activityOptionsBundle);
                    } else {
                        context.startActivity(intent);
                    }
                    started = true;
                    Log.i(TAG, "Launched ACTION_CHANGE_LIVE_WALLPAPER via Application context with NEW_TASK");
                }
            } catch (Exception e1) {
                Log.w(TAG, "ACTION_CHANGE_LIVE_WALLPAPER failed, attempting fallback to chooser: " + e1.getMessage());
                try {
                    Intent fallback = new Intent(WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER);
                    if (activity != null) {
                        activity.startActivity(fallback);
                    } else {
                        fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        context.startActivity(fallback);
                    }
                    started = true;
                    Log.i(TAG, "Launched ACTION_LIVE_WALLPAPER_CHOOSER fallback");
                } catch (Exception e2) {
                    Log.e(TAG, "All live wallpaper intents failed", e2);
                }
            }

            JSObject res = new JSObject();
            res.put("success", started);
            call.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "Fatal error in openLiveWallpaperPicker", e);
            call.reject("Could not open wallpaper picker: " + e.getMessage());
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

                // Check ComponentName equality or matching package and service suffix
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
            call.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "Error checking active wallpaper", e);
            JSObject res = new JSObject();
            res.put("isActive", false);
            res.put("activePackage", null);
            res.put("activeService", null);
            call.resolve(res);
        }
    }
}
