package com.aspirantx.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;

import java.util.Locale;

public class BlockOverlayActivity extends Activity {
    private TextView tvAppName;
    private TextView tvTimer;
    private TextView tvQuote;
    private Button btnReturn;
    private Handler timerHandler;
    private Runnable timerRunnable;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_FULLSCREEN |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        );

        setContentView(R.layout.activity_block_overlay);

        tvAppName = findViewById(R.id.tvBlockedApp);
        tvTimer = findViewById(R.id.tvRemainingTime);
        tvQuote = findViewById(R.id.tvMotivationalQuote);
        btnReturn = findViewById(R.id.btnReturnToApp);

        String blockedPackage = getIntent().getStringExtra("blocked_package");
        if (blockedPackage == null) blockedPackage = "Distracting App";

        String appLabel = getFriendlyName(blockedPackage);
        if (tvAppName != null) {
            tvAppName.setText(appLabel + " is Blocked");
        }

        if (btnReturn != null) {
            btnReturn.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    returnToStudyRide();
                }
            });
        }

        timerHandler = new Handler(Looper.getMainLooper());
        timerRunnable = new Runnable() {
            @Override
            public void run() {
                updateTimer();
                timerHandler.postDelayed(this, 1000);
            }
        };
        timerHandler.post(timerRunnable);
    }

    private void updateTimer() {
        SharedPreferences prefs = getSharedPreferences(FocusShieldPlugin.PREFS_NAME, Context.MODE_PRIVATE);
        boolean active = prefs.getBoolean(FocusShieldPlugin.PREF_ACTIVE, false);
        long endTimestamp = prefs.getLong(FocusShieldPlugin.PREF_END_TIME, 0);
        long now = System.currentTimeMillis();

        if (!active || now >= endTimestamp) {
            finish();
            return;
        }

        long remainingSec = (endTimestamp - now) / 1000;
        long mins = remainingSec / 60;
        long secs = remainingSec % 60;

        if (tvTimer != null) {
            tvTimer.setText(String.format(Locale.getDefault(), "%02d:%02d", mins, secs));
        }
    }

    private void returnToStudyRide() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        startActivity(intent);
        finish();
    }

    @Override
    public void onBackPressed() {
        returnToStudyRide();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (timerHandler != null && timerRunnable != null) {
            timerHandler.removeCallbacks(timerRunnable);
        }
    }

    private String getFriendlyName(String pkg) {
        if (pkg.contains("youtube")) return "YouTube";
        if (pkg.contains("instagram")) return "Instagram";
        if (pkg.contains("facebook") || pkg.contains("katana")) return "Facebook";
        if (pkg.contains("snapchat")) return "Snapchat";
        if (pkg.contains("hotstar")) return "Disney+ Hotstar";
        if (pkg.contains("sharechat")) return "ShareChat";
        if (pkg.contains("video") || pkg.contains("mohalla")) return "Moj Video";
        if (pkg.contains("reddit")) return "Reddit";
        if (pkg.contains("twitter")) return "Twitter / X";
        if (pkg.contains("flipkart")) return "Flipkart";
        if (pkg.contains("amazon")) return "Amazon";
        return "Distraction App";
    }
}
