package com.aspirantx.app;

import android.app.WallpaperInfo;
import android.app.WallpaperManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
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
            String examName = call.getString("examName", "Target Examination");
            String targetDate = call.getString("targetDate", "Date TBA");
            Long targetEpochMs = call.getLong("targetEpochMs", 0L);
            Integer daysRemaining = call.getInt("daysRemaining", 0);
            Integer syllabusPct = call.getInt("syllabusPercentage", 0);
            Integer currentStreak = call.getInt("currentStreak", 0);
            Integer completedDays = call.getInt("completedDays", 0);
            
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

            // Save authoritative data to SharedPreferences
            SharedPreferences prefs = getContext().getSharedPreferences(
                AspirantXWallpaperService.PREFS_NAME,
                Context.MODE_PRIVATE
            );
            prefs.edit()
                .putString("exam_name", examName)
                .putString("target_date", targetDate)
                .putLong("target_epoch_ms", targetEpochMs != null ? targetEpochMs : 0L)
                .putInt("days_remaining", daysRemaining != null ? daysRemaining : 0)
                .putInt("syllabus_percentage", syllabusPct != null ? syllabusPct : 0)
                .putInt("current_streak", currentStreak != null ? currentStreak : 0)
                .putInt("completed_days", completedDays != null ? completedDays : 0)
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
            Intent intent = new Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER);
            intent.putExtra(
                WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT,
                new ComponentName(context, AspirantXWallpaperService.class)
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            // Verify the intent can be resolved
            if (intent.resolveActivity(context.getPackageManager()) != null) {
                context.startActivity(intent);
            } else {
                // Fallback to general Live Wallpaper Chooser
                Intent fallback = new Intent(WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(fallback);
            }

            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "Failed to launch Live Wallpaper picker", e);
            call.reject("Could not open wallpaper picker: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isLiveWallpaperActive(PluginCall call) {
        try {
            WallpaperManager wm = WallpaperManager.getInstance(getContext());
            WallpaperInfo info = wm.getWallpaperInfo();
            boolean isActive = false;
            if (info != null) {
                String currentService = info.getServiceName();
                String targetService = AspirantXWallpaperService.class.getName();
                isActive = targetService.equals(currentService);
            }
            JSObject res = new JSObject();
            res.put("isActive", isActive);
            call.resolve(res);
        } catch (Exception e) {
            Log.e(TAG, "Error checking active wallpaper", e);
            JSObject res = new JSObject();
            res.put("isActive", false);
            call.resolve(res);
        }
    }
}
