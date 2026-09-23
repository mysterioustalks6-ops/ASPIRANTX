package com.aspirantx.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.VpnService;
import android.os.Build;
import android.util.Log;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

import java.util.ArrayList;

@CapacitorPlugin(name = "FocusShield")
public class FocusShieldPlugin extends Plugin {
    private static final String TAG = "FocusShieldPlugin";

    @PluginMethod
    public void isVpnPrepared(PluginCall call) {
        Context context = getContext();
        Intent prepareIntent = VpnService.prepare(context);
        boolean prepared = (prepareIntent == null);

        JSObject res = new JSObject();
        res.put("prepared", prepared);
        res.put("isActive", FocusShieldVpnService.isShieldActive());
        call.resolve(res);
    }

    @PluginMethod
    public void prepareVpn(PluginCall call) {
        Context context = getContext();
        Intent prepareIntent = VpnService.prepare(context);

        if (prepareIntent == null) {
            // Already authorized by system
            JSObject res = new JSObject();
            res.put("success", true);
            res.put("alreadyPrepared", true);
            call.resolve(res);
            return;
        }

        // Launch system VPN dialog
        startActivityForResult(call, prepareIntent, "handleVpnPrepareResult");
    }

    @ActivityCallback
    private void handleVpnPrepareResult(PluginCall call, ActivityResult result) {
        if (call == null) return;

        boolean granted = (result.getResultCode() == Activity.RESULT_OK);
        JSObject res = new JSObject();
        res.put("success", granted);
        res.put("granted", granted);
        call.resolve(res);
    }

    @PluginMethod
    public void startShield(PluginCall call) {
        Context context = getContext();
        Intent prepareIntent = VpnService.prepare(context);

        if (prepareIntent != null) {
            call.reject("VPN permission not granted. Call prepareVpn() first.");
            return;
        }

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

        // Default to YouTube and Instagram if empty
        if (packages.isEmpty()) {
            packages.add("com.google.android.youtube");
            packages.add("com.instagram.android");
        }

        Intent serviceIntent = new Intent(context, FocusShieldVpnService.class);
        serviceIntent.setAction(FocusShieldVpnService.ACTION_START);
        serviceIntent.putStringArrayListExtra(FocusShieldVpnService.EXTRA_PACKAGES, packages);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }

        JSObject res = new JSObject();
        res.put("success", true);
        res.put("active", true);
        res.put("restrictedCount", packages.size());
        call.resolve(res);
    }

    @PluginMethod
    public void stopShield(PluginCall call) {
        Context context = getContext();
        Intent serviceIntent = new Intent(context, FocusShieldVpnService.class);
        serviceIntent.setAction(FocusShieldVpnService.ACTION_STOP);
        context.startService(serviceIntent);

        JSObject res = new JSObject();
        res.put("success", true);
        res.put("active", false);
        call.resolve(res);
    }

    @PluginMethod
    public void getShieldStatus(PluginCall call) {
        Context context = getContext();
        boolean prepared = (VpnService.prepare(context) == null);
        boolean active = FocusShieldVpnService.isShieldActive();

        JSObject res = new JSObject();
        res.put("isPrepared", prepared);
        res.put("isActive", active);
        call.resolve(res);
    }
}
