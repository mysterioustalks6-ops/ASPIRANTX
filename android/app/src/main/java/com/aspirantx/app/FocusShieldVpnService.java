package com.aspirantx.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.VpnService;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;

/**
 * FocusShieldVpnService
 * 
 * Local-only, on-device network restriction engine.
 * Routes traffic from *only* selected distracting apps (e.g. YouTube, Instagram)
 * through a local black-hole TUN descriptor, effectively cutting off their network.
 * 
 * All other apps (including ProTrack, browsers, messaging) bypass the VPN
 * and retain normal, high-speed internet connectivity.
 * Zero user traffic is forwarded to any external server.
 */
public class FocusShieldVpnService extends VpnService implements Runnable {
    private static final String TAG = "FocusShieldVpnService";
    public static final String ACTION_START = "com.aspirantx.app.START_FOCUS_SHIELD";
    public static final String ACTION_STOP = "com.aspirantx.app.STOP_FOCUS_SHIELD";
    public static final String EXTRA_PACKAGES = "extra_packages";

    private static final String CHANNEL_ID = "protrack_focus_shield_channel";
    private static final int NOTIFICATION_ID = 9102;

    private static volatile boolean isRunning = false;
    private Thread workerThread;
    private ParcelFileDescriptor vpnInterface;

    public static boolean isShieldActive() {
        return isRunning;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            return START_NOT_STICKY;
        }

        String action = intent.getAction();
        if (ACTION_STOP.equals(action)) {
            stopVpn();
            stopSelf();
            return START_NOT_STICKY;
        }

        if (ACTION_START.equals(action)) {
            ArrayList<String> packages = intent.getStringArrayListExtra(EXTRA_PACKAGES);
            if (packages == null) {
                packages = new ArrayList<>();
            }
            startVpn(packages);
        }

        return START_STICKY;
    }

    private synchronized void startVpn(ArrayList<String> packages) {
        if (isRunning) {
            Log.w(TAG, "VPN is already running.");
            return;
        }

        createNotificationChannel();
        Notification notification = createNotification();
        startForeground(NOTIFICATION_ID, notification);

        try {
            Builder builder = new Builder();
            builder.setSession("ProTrack Focus Shield");
            
            // IPv4 Local Black-hole
            builder.addAddress("10.254.1.1", 32);
            builder.addRoute("0.0.0.0", 0);

            // IPv6 Local Black-hole (prevents bypass on Jio/Airtel 5G & IPv6 networks)
            try {
                builder.addAddress("fd00::1", 128);
                builder.addRoute("::", 0);
            } catch (Exception e) {
                Log.w(TAG, "IPv6 configuration notice: " + e.getMessage());
            }

            // DNS Local Black-hole for restricted applications
            try {
                builder.addDnsServer("10.254.1.1");
                builder.addDnsServer("fd00::1");
            } catch (Exception e) {
                Log.w(TAG, "DNS configuration notice: " + e.getMessage());
            }

            PackageManager pm = getPackageManager();
            int allowedCount = 0;

            for (String pkg : packages) {
                try {
                    // Verify that the application is installed before adding
                    pm.getPackageInfo(pkg, 0);
                    builder.addAllowedApplication(pkg);
                    allowedCount++;
                    Log.i(TAG, "Added blocked app to local VPN: " + pkg);
                } catch (PackageManager.NameNotFoundException ignored) {
                    // App not installed on this specific device, ignore safely
                } catch (Exception e) {
                    Log.w(TAG, "Could not add allowed application: " + pkg + ": " + e.getMessage());
                }
            }

            builder.setBlocking(true);
            vpnInterface = builder.establish();

            if (vpnInterface == null) {
                Log.e(TAG, "Failed to establish VPN interface. (builder.establish() returned null)");
                stopSelf();
                return;
            }

            isRunning = true;
            workerThread = new Thread(this, "FocusShieldWorker");
            workerThread.start();
            Log.i(TAG, "Focus Shield VPN established successfully with " + allowedCount + " restricted apps.");
        } catch (Exception e) {
            Log.e(TAG, "Exception establishing Focus Shield VPN: " + e.getMessage(), e);
            stopSelf();
        }
    }

    private synchronized void stopVpn() {
        isRunning = false;
        if (workerThread != null) {
            workerThread.interrupt();
            workerThread = null;
        }

        if (vpnInterface != null) {
            try {
                vpnInterface.close();
            } catch (IOException ignored) {}
            vpnInterface = null;
        }

        stopForeground(true);
        Log.i(TAG, "Focus Shield VPN stopped cleanly.");
    }

    @Override
    public void onDestroy() {
        stopVpn();
        super.onDestroy();
    }

    @Override
    public void onRevoke() {
        Log.w(TAG, "Focus Shield VPN permission revoked by system or user.");
        stopVpn();
        super.onRevoke();
    }

    @Override
    public void run() {
        // Discard incoming packets from allowed (blocked) apps
        byte[] buffer = new byte[32767];
        FileInputStream in = new FileInputStream(vpnInterface.getFileDescriptor());

        try {
            while (isRunning && !Thread.currentThread().isInterrupted()) {
                int length = in.read(buffer);
                if (length < 0) {
                    break;
                }
                // Intentionally black-hole packets without forwarding
            }
        } catch (Exception e) {
            if (isRunning) {
                Log.d(TAG, "Worker thread packet read interrupted: " + e.getMessage());
            }
        } finally {
            try {
                in.close();
            } catch (Exception ignored) {}
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "ProTrack Focus Shield",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows active distraction-blocking status during focus sessions");
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("🛡️ Focus Shield Active")
            .setContentText("Distracting apps are restricted. Stay focused on your study goals.")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }
}
