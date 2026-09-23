package com.aspirantx.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import java.util.Locale;

public class BlockOverlayActivity extends Activity {
    public static final String EXTRA_BLOCKED_PACKAGE = "extra_blocked_package";
    public static final String EXTRA_END_TIMESTAMP = "extra_end_timestamp";
    public static final String PREFS_NAME = "protrack_focus_shield_prefs";

    private TextView tvBlockedAppName;
    private TextView tvRemainingTimer;
    private TextView tvTimerSubtitle;
    private Button btnReturnProTrack;
    private Button btnGoHome;

    private String blockedPackage = "";
    private long endTimestamp = 0;
    private Handler timerHandler;
    private Runnable timerRunnable;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Immersive full-screen window configuration
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN
                | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        setContentView(R.layout.activity_block_overlay);

        tvBlockedAppName = findViewById(R.id.tvBlockedAppName);
        tvRemainingTimer = findViewById(R.id.tvRemainingTimer);
        tvTimerSubtitle = findViewById(R.id.tvTimerSubtitle);
        btnReturnProTrack = findViewById(R.id.btnReturnProTrack);
        btnGoHome = findViewById(R.id.btnGoHome);

        // Read intent extras or fallback to SharedPreferences
        blockedPackage = getIntent().getStringExtra(EXTRA_BLOCKED_PACKAGE);
        endTimestamp = getIntent().getLongExtra(EXTRA_END_TIMESTAMP, 0);

        if (endTimestamp <= 0) {
            SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            endTimestamp = prefs.getLong("shield_end_timestamp", 0);
        }

        // Set human readable app name
        String appName = resolveAppName(blockedPackage);
        tvBlockedAppName.setText(appName + " is Locked");

        // Set up live countdown
        setupLiveCountdown();

        // Return to ProTrack
        btnReturnProTrack.setOnClickListener(v -> {
            Intent mainIntent = new Intent(this, MainActivity.class);
            mainIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(mainIntent);
            finish();
        });

        // Exit to Home Screen
        btnGoHome.setOnClickListener(v -> sendUserToHome());

        // Handle Android 13+ Predictive / Gesture Back navigation
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,
                    this::sendUserToHome
            );
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        String newPkg = intent.getStringExtra(EXTRA_BLOCKED_PACKAGE);
        if (newPkg != null && !newPkg.isEmpty()) {
            blockedPackage = newPkg;
            tvBlockedAppName.setText(resolveAppName(blockedPackage) + " is Locked");
        }
        long newEnd = intent.getLongExtra(EXTRA_END_TIMESTAMP, 0);
        if (newEnd > 0) {
            endTimestamp = newEnd;
        }
    }

    private String resolveAppName(String packageName) {
        if (packageName == null || packageName.isEmpty()) {
            return "Distraction App";
        }
        if (packageName.contains("youtube")) return "YouTube";
        if (packageName.contains("instagram")) return "Instagram";
        if (packageName.contains("facebook") || packageName.contains("katana")) return "Facebook";
        if (packageName.contains("snapchat")) return "Snapchat";
        if (packageName.contains("reddit")) return "Reddit";
        if (packageName.contains("twitter") || packageName.contains(".x.android")) return "X / Twitter";
        if (packageName.contains("netflix")) return "Netflix";
        if (packageName.contains("tiktok") || packageName.contains("musically")) return "TikTok";
        if (packageName.contains("primevideo")) return "Prime Video";
        if (packageName.contains("hotstar") || packageName.contains("disney")) return "Disney+ Hotstar";

        try {
            PackageManager pm = getPackageManager();
            ApplicationInfo info = pm.getApplicationInfo(packageName, 0);
            CharSequence label = pm.getApplicationLabel(info);
            if (label != null && label.length() > 0) {
                return label.toString();
            }
        } catch (Exception ignored) {}

        return "Distraction App";
    }

    private void setupLiveCountdown() {
        timerHandler = new Handler(Looper.getMainLooper());
        timerRunnable = new Runnable() {
            @Override
            public void run() {
                long now = System.currentTimeMillis();
                long remainingMs = endTimestamp - now;

                if (remainingMs <= 0) {
                    tvRemainingTimer.setText("00:00");
                    tvTimerSubtitle.setText("Focus Session Completed!");
                    // Auto-finish after session completes
                    timerHandler.postDelayed(() -> finish(), 1500);
                    return;
                }

                long totalSeconds = remainingMs / 1000;
                long minutes = totalSeconds / 60;
                long seconds = totalSeconds % 60;

                String formatted;
                if (minutes >= 60) {
                    long hours = minutes / 60;
                    long remMins = minutes % 60;
                    formatted = String.format(Locale.getDefault(), "%02d:%02d:%02d", hours, remMins, seconds);
                } else {
                    formatted = String.format(Locale.getDefault(), "%02d:%02d", minutes, seconds);
                }

                tvRemainingTimer.setText(formatted);
                timerHandler.postDelayed(this, 1000);
            }
        };

        timerHandler.post(timerRunnable);
    }

    private void sendUserToHome() {
        Intent homeIntent = new Intent(Intent.ACTION_MAIN);
        homeIntent.addCategory(Intent.CATEGORY_HOME);
        homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(homeIntent);
        finish();
    }

    @Override
    public void onBackPressed() {
        // Prevent bypassing lock by pressing hardware back button; send to Home
        sendUserToHome();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (timerHandler != null && timerRunnable != null) {
            timerHandler.removeCallbacks(timerRunnable);
        }
    }
}
