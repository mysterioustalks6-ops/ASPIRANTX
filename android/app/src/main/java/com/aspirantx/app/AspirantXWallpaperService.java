package com.aspirantx.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.service.wallpaper.WallpaperService;
import android.util.Log;
import android.view.SurfaceHolder;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.concurrent.TimeUnit;

/**
 * AspirantX Real Android Live Wallpaper Engine
 * 
 * Renders dynamic exam preparation metrics directly to Android home/lockscreen:
 * - Selected Exam Name
 * - Target Exam Date & Automatically calculated Days Left
 * - Real Syllabus Completion % & Progress Bar
 * - Active Study Streak with Verified Days Count
 * - 28-Day Daily Habit Calendar Matrix
 * 
 * Battery & Performance Strategy:
 * - 0% idle CPU: pauses completely when screen is off or app is fullscreen (onVisibilityChanged).
 * - Event-driven: redraws only on data change, date change, or surface resize.
 * - Zero network traffic: all metrics read locally from SharedPreferences.
 */
public class AspirantXWallpaperService extends WallpaperService {
    private static final String TAG = "AspirantXWallpaper";
    public static final String PREFS_NAME = "aspirantx_live_wallpaper_prefs";
    public static final String ACTION_UPDATE_WALLPAPER = "com.aspirantx.app.ACTION_UPDATE_WALLPAPER";

    @Override
    public Engine onCreateEngine() {
        return new AspirantXEngine();
    }

    private class AspirantXEngine extends Engine {
        private final Handler mHandler = new Handler(Looper.getMainLooper());
        private boolean mVisible = false;
        private BroadcastReceiver mReceiver;
        private SharedPreferences mPrefs;

        // Visual Paints
        private final Paint mBgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint mTextPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint mCardPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint mCardBorderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint mPillPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint mProgressBgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint mProgressFillPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

        @Override
        public void onCreate(SurfaceHolder surfaceHolder) {
            super.onCreate(surfaceHolder);
            mPrefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

            // Register BroadcastReceiver for date changes and local wallpaper updates
            mReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    if (mVisible) {
                        drawFrame();
                    }
                }
            };

            IntentFilter filter = new IntentFilter();
            filter.addAction(ACTION_UPDATE_WALLPAPER);
            filter.addAction(Intent.ACTION_DATE_CHANGED);
            filter.addAction(Intent.ACTION_TIMEZONE_CHANGED);
            filter.addAction(Intent.ACTION_TIME_TICK); // Ensures date transition reflects immediately

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(mReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
            } else {
                registerReceiver(mReceiver, filter);
            }
        }

        @Override
        public void onDestroy() {
            super.onDestroy();
            if (mReceiver != null) {
                try {
                    unregisterReceiver(mReceiver);
                } catch (Exception ignored) {}
                mReceiver = null;
            }
        }

        @Override
        public void onVisibilityChanged(boolean visible) {
            mVisible = visible;
            if (visible) {
                drawFrame();
            }
        }

        @Override
        public void onSurfaceChanged(SurfaceHolder holder, int format, int width, int height) {
            super.onSurfaceChanged(holder, format, width, height);
            drawFrame();
        }

        @Override
        public void onSurfaceDestroyed(SurfaceHolder holder) {
            super.onSurfaceDestroyed(holder);
            mVisible = false;
        }

        private void drawFrame() {
            SurfaceHolder holder = getSurfaceHolder();
            Canvas canvas = null;
            try {
                canvas = holder.lockCanvas();
                if (canvas != null) {
                    renderWallpaper(canvas);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error drawing live wallpaper frame", e);
            } finally {
                if (canvas != null) {
                    try {
                        holder.unlockCanvasAndPost(canvas);
                    } catch (Exception ignored) {}
                }
            }
        }

        private void renderWallpaper(Canvas canvas) {
            final int width = canvas.getWidth();
            final int height = canvas.getHeight();

            // 1. Sleek Modern Deep-Space Gradient Background
            LinearGradient bgShader = new LinearGradient(
                0, 0, 0, height,
                new int[]{Color.parseColor("#040714"), Color.parseColor("#080E24"), Color.parseColor("#02040A")},
                new float[]{0f, 0.6f, 1f},
                Shader.TileMode.CLAMP
            );
            mBgPaint.setShader(bgShader);
            canvas.drawRect(0, 0, width, height, mBgPaint);

            // Read Local SharedPreferences Data
            String examName = mPrefs.getString("exam_name", "NEET (UG) Medical Entrance Test");
            String targetDate = mPrefs.getString("target_date", "3 May 2027");
            long targetEpochMs = mPrefs.getLong("target_epoch_ms", 0);
            int savedDaysRemaining = mPrefs.getInt("days_remaining", 242);
            int syllabusPct = mPrefs.getInt("syllabus_percentage", 0);
            int streakDays = mPrefs.getInt("current_streak", 1);
            int completedDays = mPrefs.getInt("completed_days", 1);
            String habitMatrixRaw = mPrefs.getString("habit_matrix_json", "[]");

            // Recalculate days remaining dynamically based on real device clock
            int calculatedDaysLeft = savedDaysRemaining;
            if (targetEpochMs > 0) {
                long now = System.currentTimeMillis();
                long diff = targetEpochMs - now;
                calculatedDaysLeft = (int) Math.max(0, TimeUnit.MILLISECONDS.toDays(diff));
            }

            final float margin = width * 0.06f;
            final float contentWidth = width - (margin * 2);
            float currentY = height * 0.12f;

            // 2. Header Branding: ASPIRANTX • LIVE PREPARATION HUB
            mTextPaint.reset();
            mTextPaint.setAntiAlias(true);
            mTextPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            mTextPaint.setTextSize(width * 0.032f);
            mTextPaint.setColor(Color.parseColor("#38BDF8"));
            mTextPaint.setTextAlign(Paint.Align.LEFT);
            canvas.drawText("ASPIRANTX  •  LIVE PREPARATION HUB", margin, currentY, mTextPaint);

            currentY += width * 0.06f;

            // 3. Exam Title (Wrapped to 2 lines if needed)
            mTextPaint.setTextSize(width * 0.068f);
            mTextPaint.setColor(Color.WHITE);
            mTextPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            
            // Clean emojis for Canvas rendering
            String cleanExamName = examName.replaceAll("[^\\x00-\\x7F]", "").trim();
            if (cleanExamName.isEmpty()) cleanExamName = examName;

            if (cleanExamName.length() > 24) {
                int splitIdx = cleanExamName.lastIndexOf(' ', 24);
                if (splitIdx == -1) splitIdx = 24;
                canvas.drawText(cleanExamName.substring(0, splitIdx), margin, currentY, mTextPaint);
                currentY += width * 0.08f;
                canvas.drawText(cleanExamName.substring(splitIdx).trim(), margin, currentY, mTextPaint);
            } else {
                canvas.drawText(cleanExamName, margin, currentY, mTextPaint);
            }

            currentY += width * 0.05f;

            // 4. Target Exam Date
            mTextPaint.setTextSize(width * 0.036f);
            mTextPaint.setColor(Color.parseColor("#94A3B8"));
            mTextPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL));
            canvas.drawText("Target Exam Date: " + targetDate, margin, currentY, mTextPaint);

            currentY += width * 0.06f;

            // 5. Countdown Pill Banner
            float pillHeight = width * 0.14f;
            RectF pillRect = new RectF(margin, currentY, margin + contentWidth, currentY + pillHeight);
            
            LinearGradient pillShader = new LinearGradient(
                pillRect.left, pillRect.top, pillRect.right, pillRect.bottom,
                new int[]{Color.parseColor("#4F46E5"), Color.parseColor("#06B6D4")},
                null, Shader.TileMode.CLAMP
            );
            mPillPaint.reset();
            mPillPaint.setAntiAlias(true);
            mPillPaint.setShader(pillShader);
            canvas.drawRoundRect(pillRect, pillHeight / 2, pillHeight / 2, mPillPaint);

            // Pill Text
            mTextPaint.setColor(Color.WHITE);
            mTextPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            mTextPaint.setTextSize(width * 0.052f);
            mTextPaint.setTextAlign(Paint.Align.CENTER);
            String countdownText = calculatedDaysLeft > 0 
                ? calculatedDaysLeft + " DAYS REMAINING" 
                : "EXAM DAY HAS ARRIVED";
            canvas.drawText(countdownText, width / 2f, currentY + (pillHeight * 0.62f), mTextPaint);

            currentY += pillHeight + (width * 0.05f);

            // 6. Two Metric Cards (Syllabus % and Active Streak)
            float cardWidth = (contentWidth - (width * 0.04f)) / 2f;
            float cardHeight = width * 0.28f;

            // Left Card: Syllabus %
            RectF leftCard = new RectF(margin, currentY, margin + cardWidth, currentY + cardHeight);
            drawMetricCard(canvas, leftCard, "SYLLABUS PROGRESS", syllabusPct + "%", "#38BDF8");

            // Syllabus Progress Bar inside card
            float barMargin = cardWidth * 0.1f;
            float barHeight = width * 0.02f;
            float barY = leftCard.bottom - (cardHeight * 0.22f);
            RectF barBg = new RectF(leftCard.left + barMargin, barY, leftCard.right - barMargin, barY + barHeight);
            
            mProgressBgPaint.setColor(Color.parseColor("#1E293B"));
            canvas.drawRoundRect(barBg, barHeight / 2, barHeight / 2, mProgressBgPaint);

            float fillWidth = (barBg.width() * Math.min(100, Math.max(0, syllabusPct))) / 100f;
            if (fillWidth > 0) {
                RectF barFill = new RectF(barBg.left, barY, barBg.left + fillWidth, barY + barHeight);
                mProgressFillPaint.setColor(Color.parseColor("#38BDF8"));
                canvas.drawRoundRect(barFill, barHeight / 2, barHeight / 2, mProgressFillPaint);
            }

            // Right Card: Active Streak
            RectF rightCard = new RectF(margin + cardWidth + (width * 0.04f), currentY, margin + contentWidth, currentY + cardHeight);
            drawMetricCard(canvas, rightCard, "ACTIVE STREAK", streakDays + " Days", "#F59E0B");

            // Subtitle inside right card
            mTextPaint.setTextAlign(Paint.Align.LEFT);
            mTextPaint.setTextSize(width * 0.030f);
            mTextPaint.setColor(Color.parseColor("#10B981"));
            mTextPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            canvas.drawText(completedDays + " Days Verified", rightCard.left + (cardWidth * 0.1f), rightCard.bottom - (cardHeight * 0.18f), mTextPaint);

            currentY += cardHeight + (width * 0.06f);

            // 7. Daily Study Habit Calendar (28-Day Matrix)
            drawHabitMatrix(canvas, margin, currentY, contentWidth, habitMatrixRaw);

            // 8. Footer Motto
            mTextPaint.setTextAlign(Paint.Align.CENTER);
            mTextPaint.setTextSize(width * 0.028f);
            mTextPaint.setColor(Color.parseColor("#64748B"));
            mTextPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL));
            canvas.drawText("DISCIPLINE IS THE BRIDGE BETWEEN GOALS AND SUCCESS", width / 2f, height * 0.94f, mTextPaint);
        }

        private void drawMetricCard(Canvas canvas, RectF rect, String label, String value, String accentColor) {
            // Background Card
            mCardPaint.setColor(Color.parseColor("#0F172A"));
            canvas.drawRoundRect(rect, 24, 24, mCardPaint);

            // Border
            mCardBorderPaint.setStyle(Paint.Style.STROKE);
            mCardBorderPaint.setStrokeWidth(2.5f);
            mCardBorderPaint.setColor(Color.parseColor("#1E293B"));
            canvas.drawRoundRect(rect, 24, 24, mCardBorderPaint);

            // Label
            mTextPaint.setTextAlign(Paint.Align.LEFT);
            mTextPaint.setTextSize(rect.width() * 0.075f);
            mTextPaint.setColor(Color.parseColor("#94A3B8"));
            mTextPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            canvas.drawText(label, rect.left + (rect.width() * 0.1f), rect.top + (rect.height() * 0.32f), mTextPaint);

            // Value
            mTextPaint.setTextSize(rect.width() * 0.17f);
            mTextPaint.setColor(Color.parseColor(accentColor));
            mTextPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            canvas.drawText(value, rect.left + (rect.width() * 0.1f), rect.top + (rect.height() * 0.65f), mTextPaint);
        }

        private void drawHabitMatrix(Canvas canvas, float startX, float startY, float totalWidth, String rawJson) {
            // Section Header
            mTextPaint.setTextAlign(Paint.Align.LEFT);
            mTextPaint.setTextSize(totalWidth * 0.038f);
            mTextPaint.setColor(Color.WHITE);
            mTextPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            canvas.drawText("DAILY STUDY HABIT CALENDAR (28 DAYS)", startX, startY, mTextPaint);

            startY += totalWidth * 0.04f;

            final int cols = 7;
            final int rows = 4;
            final float gap = totalWidth * 0.022f;
            final float boxSize = (totalWidth - (gap * (cols - 1))) / cols;

            JSONArray habitArray = null;
            try {
                habitArray = new JSONArray(rawJson);
            } catch (Exception ignored) {}

            Paint boxPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            Paint borderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            borderPaint.setStyle(Paint.Style.STROKE);
            borderPaint.setStrokeWidth(2f);

            Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            textPaint.setTextAlign(Paint.Align.CENTER);
            textPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));

            for (int r = 0; r < rows; r++) {
                for (int c = 0; c < cols; c++) {
                    int index = (r * cols) + c;
                    float bx = startX + (c * (boxSize + gap));
                    float by = startY + (r * (boxSize + gap));
                    RectF bRect = new RectF(bx, by, bx + boxSize, by + boxSize);

                    boolean isCompleted = false;
                    boolean isMissed = false;
                    boolean isToday = false;
                    int dayNum = index + 1;

                    if (habitArray != null && index < habitArray.length()) {
                        try {
                            JSONObject item = habitArray.getJSONObject(index);
                            isCompleted = item.optBoolean("isCompleted", false);
                            isMissed = item.optBoolean("isMissed", false);
                            isToday = item.optBoolean("isToday", false);
                            dayNum = item.optInt("dayNumber", dayNum);
                        } catch (Exception ignored) {}
                    }

                    // Render Box styling
                    if (isCompleted) {
                        boxPaint.setColor(Color.parseColor("#064E3B")); // Emerald dark
                        borderPaint.setColor(Color.parseColor("#10B981")); // Emerald bright
                        canvas.drawRoundRect(bRect, 14, 14, boxPaint);
                        canvas.drawRoundRect(bRect, 14, 14, borderPaint);

                        // Checkmark
                        textPaint.setTextSize(boxSize * 0.42f);
                        textPaint.setColor(Color.parseColor("#10B981"));
                        canvas.drawText("✓", bRect.centerX(), bRect.centerY() + (boxSize * 0.14f), textPaint);
                    } else if (isToday) {
                        boxPaint.setColor(Color.parseColor("#1E1B4B")); // Indigo dark
                        borderPaint.setColor(Color.parseColor("#818CF8")); // Indigo bright
                        canvas.drawRoundRect(bRect, 14, 14, boxPaint);
                        canvas.drawRoundRect(bRect, 14, 14, borderPaint);

                        // Date Number
                        textPaint.setTextSize(boxSize * 0.36f);
                        textPaint.setColor(Color.WHITE);
                        canvas.drawText(String.valueOf(dayNum), bRect.centerX(), bRect.centerY() + (boxSize * 0.12f), textPaint);
                    } else if (isMissed) {
                        boxPaint.setColor(Color.parseColor("#0B0F19"));
                        borderPaint.setColor(Color.parseColor("#1E293B"));
                        canvas.drawRoundRect(bRect, 14, 14, boxPaint);
                        canvas.drawRoundRect(bRect, 14, 14, borderPaint);

                        // Subtle dash
                        textPaint.setTextSize(boxSize * 0.36f);
                        textPaint.setColor(Color.parseColor("#475569"));
                        canvas.drawText("—", bRect.centerX(), bRect.centerY() + (boxSize * 0.10f), textPaint);
                    } else {
                        // Future or unstarted day
                        boxPaint.setColor(Color.parseColor("#0B0F19"));
                        borderPaint.setColor(Color.parseColor("#1E293B"));
                        canvas.drawRoundRect(bRect, 14, 14, boxPaint);
                        canvas.drawRoundRect(bRect, 14, 14, borderPaint);

                        textPaint.setTextSize(boxSize * 0.32f);
                        textPaint.setColor(Color.parseColor("#334155"));
                        canvas.drawText(String.valueOf(dayNum), bRect.centerX(), bRect.centerY() + (boxSize * 0.12f), textPaint);
                    }
                }
            }
        }
    }
}
