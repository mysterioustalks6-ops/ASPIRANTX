package com.aspirantx.app;

import android.app.WallpaperColors;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.os.Build;
import android.service.wallpaper.WallpaperService;
import android.util.Log;
import android.view.SurfaceHolder;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.concurrent.TimeUnit;

/**
 * AspirantX Real Android Live Wallpaper Engine
 * 
 * Renders dynamic exam preparation metrics directly to Android home/lockscreen:
 * - Selected Exam Name & Candidate Name
 * - Persona Styling & Dynamic Background Gradient
 * - Target Exam Date & Automatically calculated Days Left
 * - Real Syllabus Completion % & Progress Bar
 * - Active Study Streak with Verified Days Count
 * - Motivational Character Quote
 * - 28-Day Daily Habit Calendar Matrix
 * 
 * Battery & Performance Strategy:
 * - 0% idle CPU: Pauses completely when screen is off or app is fullscreen (onVisibilityChanged).
 * - Event-driven: Redraws only on data change, date transition, or surface resize.
 * - Zero minute-tick drain: NO ACTION_TIME_TICK loop.
 * - Zero network traffic: All metrics read locally from SharedPreferences.
 */
public class AspirantXWallpaperService extends WallpaperService {
    private static final String TAG = "AspirantXWallpaper";
    public static final String PREFS_NAME = "aspirantx_live_wallpaper_prefs";
    public static final String ACTION_UPDATE_WALLPAPER = "com.aspirantx.app.ACTION_UPDATE_WALLPAPER";

    @Override
    public Engine onCreateEngine() {
        Log.i(TAG, "AspirantXWallpaperService.onCreateEngine() instantiated");
        return new AspirantXEngine();
    }

    private class AspirantXEngine extends Engine {
        private boolean mVisible = false;
        private BroadcastReceiver mInternalReceiver;
        private BroadcastReceiver mSystemReceiver;
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
            Log.i(TAG, "AspirantXEngine.onCreate() surfaceHolder initialized");
            mPrefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

            // 1. Internal App Update Receiver (Dispatched when React app syncs new telemetry/theme)
            mInternalReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    Log.i(TAG, "Received ACTION_UPDATE_WALLPAPER broadcast, mVisible=" + mVisible);
                    if (mVisible) {
                        drawFrame();
                    }
                }
            };

            IntentFilter internalFilter = new IntentFilter(ACTION_UPDATE_WALLPAPER);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(mInternalReceiver, internalFilter, Context.RECEIVER_NOT_EXPORTED);
            } else {
                registerReceiver(mInternalReceiver, internalFilter);
            }

            // 2. System Date/Time Receiver (No ACTION_TIME_TICK to preserve battery)
            mSystemReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    Log.i(TAG, "Received system date/time broadcast: " + intent.getAction() + ", mVisible=" + mVisible);
                    if (mVisible) {
                        drawFrame();
                    }
                }
            };

            IntentFilter systemFilter = new IntentFilter();
            systemFilter.addAction(Intent.ACTION_DATE_CHANGED);
            systemFilter.addAction(Intent.ACTION_TIMEZONE_CHANGED);
            systemFilter.addAction(Intent.ACTION_TIME_CHANGED);
            registerReceiver(mSystemReceiver, systemFilter);
        }

        @Override
        public void onDestroy() {
            super.onDestroy();
            Log.i(TAG, "AspirantXEngine.onDestroy() invoked");
            if (mInternalReceiver != null) {
                try {
                    unregisterReceiver(mInternalReceiver);
                } catch (Exception ignored) {}
                mInternalReceiver = null;
            }
            if (mSystemReceiver != null) {
                try {
                    unregisterReceiver(mSystemReceiver);
                } catch (Exception ignored) {}
                mSystemReceiver = null;
            }
        }

        @Override
        public void onVisibilityChanged(boolean visible) {
            mVisible = visible;
            Log.i(TAG, "AspirantXEngine.onVisibilityChanged: visible=" + visible);
            if (visible) {
                drawFrame();
            }
        }

        @Override
        public void onSurfaceCreated(SurfaceHolder holder) {
            super.onSurfaceCreated(holder);
            Log.i(TAG, "AspirantXEngine.onSurfaceCreated()");
            drawFrame();
        }

        @Override
        public void onSurfaceChanged(SurfaceHolder holder, int format, int width, int height) {
            super.onSurfaceChanged(holder, format, width, height);
            Log.i(TAG, "AspirantXEngine.onSurfaceChanged: " + width + "x" + height + " format=" + format);
            drawFrame();
        }

        @Override
        public void onSurfaceRedrawNeeded(SurfaceHolder holder) {
            super.onSurfaceRedrawNeeded(holder);
            Log.i(TAG, "AspirantXEngine.onSurfaceRedrawNeeded()");
            drawFrame();
        }

        @Override
        public WallpaperColors onComputeColors() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                try {
                    String accentHex = mPrefs != null ? mPrefs.getString("accent_color", "#38BDF8") : "#38BDF8";
                    int primary = Color.parseColor("#0F172A");
                    int accent = Color.parseColor(accentHex);
                    return new WallpaperColors(Color.valueOf(primary), Color.valueOf(accent), null);
                } catch (Exception ignored) {
                    return new WallpaperColors(Color.valueOf(Color.BLACK), Color.valueOf(Color.DKGRAY), null);
                }
            }
            return null;
        }

        @Override
        public void onSurfaceDestroyed(SurfaceHolder holder) {
            super.onSurfaceDestroyed(holder);
            Log.i(TAG, "AspirantXEngine.onSurfaceDestroyed()");
            mVisible = false;
        }

        private void drawFrame() {
            SurfaceHolder holder = getSurfaceHolder();
            if (holder == null || holder.getSurface() == null || !holder.getSurface().isValid()) {
                Log.d(TAG, "drawFrame skipped: surface not valid yet");
                return;
            }
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
            if (width <= 0 || height <= 0) return;

            // Read Local SharedPreferences Data
            String candidateName = mPrefs.getString("candidate_name", "Dedicated Aspirant");
            String examName = mPrefs.getString("exam_name", "UPSC CSE — Civil Services Examination");
            String targetDate = mPrefs.getString("target_date", "24 May 2026");
            long targetEpochMs = mPrefs.getLong("target_epoch_ms", 0);
            int savedDaysRemaining = mPrefs.getInt("days_remaining", 242);
            int syllabusPct = mPrefs.getInt("syllabus_percentage", 0);
            int streakDays = mPrefs.getInt("current_streak", 1);
            int completedDays = mPrefs.getInt("completed_days", 1);
            String personaTitle = mPrefs.getString("persona_title", "ASPIRANTX • LIVE PREPARATION HUB");
            String characterQuote = mPrefs.getString("character_quote", "Discipline is the bridge between goals and success.");
            String accentColorHex = mPrefs.getString("accent_color", "#38BDF8");
            String bgGradRaw = mPrefs.getString("bg_gradient_json", "[\"#030712\",\"#0f172a\",\"#1e1b4b\"]");
            String habitMatrixRaw = mPrefs.getString("habit_matrix_json", "[]");

            // Dynamic Accent Color
            int accentColor;
            try {
                accentColor = Color.parseColor(accentColorHex);
            } catch (Exception e) {
                accentColor = Color.parseColor("#38BDF8");
            }

            // 1. Dynamic Background Gradient based on Persona Theme
            int[] bgColors = new int[]{Color.parseColor("#040714"), Color.parseColor("#080E24"), Color.parseColor("#02040A")};
            try {
                JSONArray gradArray = new JSONArray(bgGradRaw);
                if (gradArray.length() >= 3) {
                    bgColors = new int[]{
                        Color.parseColor(gradArray.getString(0)),
                        Color.parseColor(gradArray.getString(1)),
                        Color.parseColor(gradArray.getString(2))
                    };
                }
            } catch (Exception ignored) {}

            LinearGradient bgShader = new LinearGradient(
                0, 0, 0, height,
                bgColors,
                new float[]{0f, 0.5f, 1f},
                Shader.TileMode.CLAMP
            );
            mBgPaint.setShader(bgShader);
            canvas.drawRect(0, 0, width, height, mBgPaint);

            // Recalculate days remaining dynamically based on real device clock
            int calculatedDaysLeft = savedDaysRemaining;
            if (targetEpochMs > 0) {
                long now = System.currentTimeMillis();
                long diff = targetEpochMs - now;
                calculatedDaysLeft = (int) Math.max(0, TimeUnit.MILLISECONDS.toDays(diff));
            }

            final float margin = width * 0.055f;
            final float contentWidth = width - (margin * 2);

            // Safe Zone Anchors:
            // Top Safe Anchor: starts below status bar (~4-5%) and At-A-Glance/date widget (~6-10%)
            // 0.138f of height guarantees complete clearance above "At A Glance" date/weather on all Android launchers.
            float currentY = height * 0.138f;
            final float itemGap = height * 0.008f;

            // 2. Header: Persona Eyebrow / System Badge
            mTextPaint.reset();
            mTextPaint.setAntiAlias(true);
            mTextPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            mTextPaint.setTextSize(width * 0.027f);
            mTextPaint.setColor(accentColor);
            mTextPaint.setTextAlign(Paint.Align.LEFT);
            canvas.drawText("⚡  " + personaTitle.toUpperCase() + "  ⚡", margin, currentY, mTextPaint);

            currentY += width * 0.046f;

            // 3. Candidate Name
            mTextPaint.setTextSize(width * 0.052f);
            mTextPaint.setColor(Color.WHITE);
            mTextPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            canvas.drawText(candidateName, margin, currentY, mTextPaint);

            currentY += width * 0.042f;

            // 4. Target Exam & Date (Combined compact subtitle)
            mTextPaint.setTextSize(width * 0.029f);
            mTextPaint.setColor(Color.parseColor("#94A3B8"));
            mTextPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.NORMAL));
            
            String cleanExamName = examName.replaceAll("[^\\x00-\\x7F]", "").trim();
            if (cleanExamName.isEmpty()) cleanExamName = examName;

            String combinedExamDate = cleanExamName + " • " + targetDate;
            if (mTextPaint.measureText(combinedExamDate) <= contentWidth) {
                canvas.drawText(combinedExamDate, margin, currentY, mTextPaint);
                currentY += width * 0.038f;
            } else {
                canvas.drawText(cleanExamName, margin, currentY, mTextPaint);
                currentY += width * 0.034f;
                canvas.drawText("Target: " + targetDate, margin, currentY, mTextPaint);
                currentY += width * 0.036f;
            }

            currentY += itemGap;

            // 5. Hero Countdown Pill Banner
            float pillHeight = width * 0.092f;
            RectF pillRect = new RectF(margin, currentY, margin + contentWidth, currentY + pillHeight);
            
            LinearGradient pillShader = new LinearGradient(
                pillRect.left, pillRect.top, pillRect.right, pillRect.bottom,
                new int[]{Color.parseColor("#4F46E5"), accentColor},
                null, Shader.TileMode.CLAMP
            );
            mPillPaint.reset();
            mPillPaint.setAntiAlias(true);
            mPillPaint.setShader(pillShader);
            canvas.drawRoundRect(pillRect, pillHeight / 2, pillHeight / 2, mPillPaint);

            // Pill Text
            mTextPaint.setColor(Color.WHITE);
            mTextPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            mTextPaint.setTextSize(width * 0.042f);
            mTextPaint.setTextAlign(Paint.Align.CENTER);
            String countdownText = calculatedDaysLeft > 0 
                ? calculatedDaysLeft + " DAYS REMAINING" 
                : "EXAM DAY HAS ARRIVED";
            canvas.drawText(countdownText, width / 2f, currentY + (pillHeight * 0.62f), mTextPaint);

            currentY += pillHeight + itemGap + (height * 0.003f);

            // 6. Two High-Yield Metric Cards (Syllabus % and Active Streak)
            float cardGap = width * 0.030f;
            float cardWidth = (contentWidth - cardGap) / 2f;
            float cardHeight = width * 0.170f;

            // Left Card: Syllabus %
            RectF leftCard = new RectF(margin, currentY, margin + cardWidth, currentY + cardHeight);
            drawMetricCard(canvas, leftCard, "SYLLABUS PROGRESS", syllabusPct + "%", accentColorHex);

            // Syllabus Progress Bar inside card
            float barMargin = cardWidth * 0.09f;
            float barHeight = width * 0.015f;
            float barY = leftCard.bottom - (cardHeight * 0.22f);
            RectF barBg = new RectF(leftCard.left + barMargin, barY, leftCard.right - barMargin, barY + barHeight);
            
            mProgressBgPaint.setColor(Color.parseColor("#1E293B"));
            canvas.drawRoundRect(barBg, barHeight / 2, barHeight / 2, mProgressBgPaint);

            float fillWidth = (barBg.width() * Math.min(100, Math.max(0, syllabusPct))) / 100f;
            if (fillWidth > 0) {
                RectF barFill = new RectF(barBg.left, barY, barBg.left + fillWidth, barY + barHeight);
                mProgressFillPaint.setColor(accentColor);
                canvas.drawRoundRect(barFill, barHeight / 2, barHeight / 2, mProgressFillPaint);
            }

            // Right Card: Active Streak
            RectF rightCard = new RectF(margin + cardWidth + cardGap, currentY, margin + contentWidth, currentY + cardHeight);
            drawMetricCard(canvas, rightCard, "ACTIVE STREAK", streakDays + " Days", "#F59E0B");

            // Subtitle inside right card
            mTextPaint.setTextAlign(Paint.Align.LEFT);
            mTextPaint.setTextSize(cardWidth * 0.075f);
            mTextPaint.setColor(Color.parseColor("#10B981"));
            mTextPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            canvas.drawText(completedDays + " Days Verified", rightCard.left + (cardWidth * 0.09f), rightCard.bottom - (cardHeight * 0.18f), mTextPaint);

            currentY += cardHeight + itemGap;

            // 7. Motivational Quote Card (Sleek minimalist quote card modeled on reference design)
            float quoteHeight = width * 0.092f;
            RectF quoteRect = new RectF(margin, currentY, margin + contentWidth, currentY + quoteHeight);
            mCardPaint.setColor(Color.parseColor("#0A0F1D"));
            canvas.drawRoundRect(quoteRect, 20, 20, mCardPaint);
            mCardBorderPaint.setStyle(Paint.Style.STROKE);
            mCardBorderPaint.setStrokeWidth(1.5f);
            mCardBorderPaint.setColor(Color.parseColor("#1E293B"));
            canvas.drawRoundRect(quoteRect, 20, 20, mCardBorderPaint);

            // Decorative quotation marks
            mTextPaint.setTextSize(quoteHeight * 0.65f);
            mTextPaint.setColor(Color.parseColor("#334155"));
            mTextPaint.setTypeface(Typeface.create(Typeface.SERIF, Typeface.BOLD));
            mTextPaint.setTextAlign(Paint.Align.LEFT);
            canvas.drawText("“", quoteRect.left + (width * 0.035f), quoteRect.top + (quoteHeight * 0.72f), mTextPaint);
            
            mTextPaint.setTextAlign(Paint.Align.RIGHT);
            canvas.drawText("”", quoteRect.right - (width * 0.035f), quoteRect.bottom - (quoteHeight * 0.15f), mTextPaint);

            // Centered Quote Text
            mTextPaint.setTextAlign(Paint.Align.CENTER);
            mTextPaint.setTextSize(width * 0.027f);
            mTextPaint.setColor(Color.parseColor("#F1F5F9"));
            mTextPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.ITALIC));

            String quoteDisplay = characterQuote.length() > 55 ? characterQuote.substring(0, 52) + "..." : characterQuote;
            canvas.drawText("\"" + quoteDisplay + "\"", width / 2f, currentY + (quoteHeight * 0.58f), mTextPaint);

            currentY += quoteHeight + itemGap;

            // 8. Daily Study Habit Calendar Card (28-Day Circular Matrix with Page Dots)
            drawHabitCalendarCard(canvas, margin, currentY, contentWidth, habitMatrixRaw, accentColor, width, height);

            Log.i(TAG, "renderWallpaper() successfully rendered frame: " + candidateName + " | " + examName + " | daysLeft=" + calculatedDaysLeft + " | syllabus=" + syllabusPct + "% | streak=" + streakDays + "d");
        }

        private void drawMetricCard(Canvas canvas, RectF rect, String label, String value, String accentColor) {
            // Background Card
            mCardPaint.setColor(Color.parseColor("#0F172A"));
            canvas.drawRoundRect(rect, 20, 20, mCardPaint);

            // Border
            mCardBorderPaint.setStyle(Paint.Style.STROKE);
            mCardBorderPaint.setStrokeWidth(1.8f);
            mCardBorderPaint.setColor(Color.parseColor("#1E293B"));
            canvas.drawRoundRect(rect, 20, 20, mCardBorderPaint);

            // Label
            mTextPaint.setTextAlign(Paint.Align.LEFT);
            mTextPaint.setTextSize(rect.width() * 0.070f);
            mTextPaint.setColor(Color.parseColor("#94A3B8"));
            mTextPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            canvas.drawText(label, rect.left + (rect.width() * 0.09f), rect.top + (rect.height() * 0.32f), mTextPaint);

            // Value
            mTextPaint.setTextSize(rect.width() * 0.145f);
            try {
                mTextPaint.setColor(Color.parseColor(accentColor));
            } catch (Exception e) {
                mTextPaint.setColor(Color.parseColor("#38BDF8"));
            }
            mTextPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            canvas.drawText(value, rect.left + (rect.width() * 0.09f), rect.top + (rect.height() * 0.64f), mTextPaint);
        }

        private void drawHabitCalendarCard(Canvas canvas, float startX, float startY, float totalWidth, String rawJson, int accentColor, int screenWidth, int screenHeight) {
            final int cols = 7;
            final int rows = 4;
            
            // Compact, elegant circular pills as seen in the reference design
            final float circleSize = screenWidth * 0.056f;
            final float gridInnerWidth = totalWidth - (screenWidth * 0.07f);
            final float gapX = (gridInnerWidth - (cols * circleSize)) / (cols - 1);
            final float gapY = screenWidth * 0.012f;
            
            final float gridHeight = (rows * circleSize) + ((rows - 1) * gapY);
            final float cardPaddingTop = screenWidth * 0.026f;
            final float headerHeight = screenWidth * 0.046f;
            final float pageDotsHeight = screenWidth * 0.030f;
            final float cardPaddingBottom = screenWidth * 0.018f;
            final float totalCardHeight = cardPaddingTop + headerHeight + gridHeight + pageDotsHeight + cardPaddingBottom;

            RectF cardRect = new RectF(startX, startY, startX + totalWidth, startY + totalCardHeight);
            
            // Card background & subtle border
            mCardPaint.setColor(Color.parseColor("#0A0F1D"));
            canvas.drawRoundRect(cardRect, 26, 26, mCardPaint);
            mCardBorderPaint.setStyle(Paint.Style.STROKE);
            mCardBorderPaint.setStrokeWidth(1.5f);
            mCardBorderPaint.setColor(Color.parseColor("#1E293B"));
            canvas.drawRoundRect(cardRect, 26, 26, mCardBorderPaint);

            // Card Header: Section Title
            mTextPaint.setTextAlign(Paint.Align.LEFT);
            mTextPaint.setTextSize(screenWidth * 0.026f);
            mTextPaint.setColor(Color.parseColor("#CBD5E1"));
            mTextPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));
            canvas.drawText("DAILY STUDY HABIT CALENDAR (28 DAYS)", cardRect.left + (screenWidth * 0.038f), cardRect.top + cardPaddingTop + (screenWidth * 0.024f), mTextPaint);

            float gridStartX = cardRect.left + (screenWidth * 0.035f);
            float gridStartY = cardRect.top + cardPaddingTop + headerHeight;

            JSONArray habitArray = null;
            try {
                habitArray = new JSONArray(rawJson);
            } catch (Exception ignored) {}

            Paint circlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            Paint borderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            borderPaint.setStyle(Paint.Style.STROKE);
            borderPaint.setStrokeWidth(1.8f);

            Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            textPaint.setTextAlign(Paint.Align.CENTER);
            textPaint.setTypeface(Typeface.create(Typeface.SANS_SERIF, Typeface.BOLD));

            for (int r = 0; r < rows; r++) {
                for (int c = 0; c < cols; c++) {
                    int index = (r * cols) + c;
                    float cx = gridStartX + (c * (circleSize + gapX)) + (circleSize / 2f);
                    float cy = gridStartY + (r * (circleSize + gapY)) + (circleSize / 2f);
                    float radius = circleSize / 2f;

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

                    if (isCompleted) {
                        // Completed day: emerald green circle with dark text & checkmark
                        circlePaint.setColor(Color.parseColor("#10B981"));
                        canvas.drawCircle(cx, cy, radius, circlePaint);
                        
                        textPaint.setTextSize(circleSize * 0.34f);
                        textPaint.setColor(Color.parseColor("#022C22"));
                        canvas.drawText(String.valueOf(dayNum), cx, cy - (circleSize * 0.06f), textPaint);

                        textPaint.setTextSize(circleSize * 0.30f);
                        canvas.drawText("✓", cx, cy + (circleSize * 0.28f), textPaint);
                    } else if (isToday) {
                        // Today: dark indigo with bright accent ring
                        circlePaint.setColor(Color.parseColor("#1E1B4B"));
                        borderPaint.setColor(accentColor);
                        borderPaint.setStrokeWidth(2.5f);
                        canvas.drawCircle(cx, cy, radius, circlePaint);
                        canvas.drawCircle(cx, cy, radius, borderPaint);

                        textPaint.setTextSize(circleSize * 0.36f);
                        textPaint.setColor(Color.WHITE);
                        canvas.drawText(String.valueOf(dayNum), cx, cy + (circleSize * 0.12f), textPaint);
                    } else if (isMissed) {
                        // Missed past day: subtle dark circle with dash
                        circlePaint.setColor(Color.parseColor("#0F172A"));
                        borderPaint.setColor(Color.parseColor("#1E293B"));
                        borderPaint.setStrokeWidth(1.5f);
                        canvas.drawCircle(cx, cy, radius, circlePaint);
                        canvas.drawCircle(cx, cy, radius, borderPaint);

                        textPaint.setTextSize(circleSize * 0.34f);
                        textPaint.setColor(Color.parseColor("#475569"));
                        canvas.drawText("—", cx, cy + (circleSize * 0.10f), textPaint);
                    } else {
                        // Future day: subtle dark circle with muted day number
                        circlePaint.setColor(Color.parseColor("#0F172A"));
                        borderPaint.setColor(Color.parseColor("#1E293B"));
                        borderPaint.setStrokeWidth(1.2f);
                        canvas.drawCircle(cx, cy, radius, circlePaint);
                        canvas.drawCircle(cx, cy, radius, borderPaint);

                        textPaint.setTextSize(circleSize * 0.32f);
                        textPaint.setColor(Color.parseColor("#475569"));
                        canvas.drawText(String.valueOf(dayNum), cx, cy + (circleSize * 0.12f), textPaint);
                    }
                }
            }

            // 3 Minimalist Page Indicator Dots underneath calendar (as seen in reference design)
            float dotsY = gridStartY + gridHeight + (screenWidth * 0.024f);
            float dotCenter = cardRect.centerX();
            float dotGap = screenWidth * 0.024f;
            float dotRadius = screenWidth * 0.007f;

            Paint dotPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            // Left dot (dim)
            dotPaint.setColor(Color.parseColor("#334155"));
            canvas.drawCircle(dotCenter - dotGap, dotsY, dotRadius, dotPaint);
            // Center dot (active)
            dotPaint.setColor(Color.WHITE);
            canvas.drawCircle(dotCenter, dotsY, dotRadius * 1.2f, dotPaint);
            // Right dot (dim)
            dotPaint.setColor(Color.parseColor("#334155"));
            canvas.drawCircle(dotCenter + dotGap, dotsY, dotRadius, dotPaint);
        }
    }
}
