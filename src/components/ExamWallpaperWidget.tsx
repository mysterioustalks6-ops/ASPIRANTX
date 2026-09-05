import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  CheckCircle2, 
  Download, 
  Smartphone, 
  Sparkles, 
  ShieldCheck, 
  Info, 
  Zap, 
  Palette, 
  Eye, 
  Check, 
  Calendar, 
  TrendingUp, 
  Maximize2, 
  Minimize2, 
  X,
  AlertCircle
} from 'lucide-react';
import { UserProfile } from '../types';
import { useExam } from '../context/ExamContext';
import { normalizeExamId } from '../lib/examRegistry';
import { 
  getAuthoritativeWallpaperTelemetry, 
  WallpaperTelemetry, 
  DailyDateBox 
} from '../lib/dailyStudyTracker';
import { markDailyBoxCompleted, getLocalDeviceStore } from '../lib/packetSyncService';
import { awardXPAndCoins, getISTDateString } from '../lib/gamification';
import { WALLPAPER_PERSONAS, WallpaperPersona } from '../lib/wallpaperPersonas';
import { 
  requestSetLiveWallpaper, 
  checkIsLiveWallpaperActive, 
  syncAuthoritativeWallpaperToNative,
  addWallpaperResumeListener,
  isAndroidPlatform
} from '../lib/nativeWallpaperBridge';
import { Capacitor } from '@capacitor/core';

interface ExamWallpaperWidgetProps {
  user: UserProfile;
  selectedExam?: string;
  onNavigateToSyllabus?: () => void;
}

export const ExamWallpaperWidget: React.FC<ExamWallpaperWidgetProps> = ({
  user,
  selectedExam,
  onNavigateToSyllabus,
}) => {
  const { selectedExamId, examOption, examConfig } = useExam();
  const activeExam = normalizeExamId(selectedExam || selectedExamId || user.exam);

  const userTargetDate = (user as any)?.targetExamDate;

  const [telemetry, setTelemetry] = useState<WallpaperTelemetry>(() => 
    getAuthoritativeWallpaperTelemetry(user.id, activeExam, userTargetDate)
  );

  const [selectedPersona, setSelectedPersona] = useState<WallpaperPersona>(() => {
    try {
      const saved = localStorage.getItem('aspirantx_wallpaper_persona_id');
      return WALLPAPER_PERSONAS.find(p => p.id === saved) || WALLPAPER_PERSONAS[0];
    } catch {
      return WALLPAPER_PERSONAS[0];
    }
  });

  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [isGeneratingWallpaper, setIsGeneratingWallpaper] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [showPersonaSelector, setShowPersonaSelector] = useState<boolean>(false);
  const [showLiveCompanionModal, setShowLiveCompanionModal] = useState<boolean>(false);

  // Authoritative State Machine derived strictly from Android OS / WallpaperManager
  const [wallpaperStatus, setWallpaperStatus] = useState<
    'NOT_SUPPORTED' | 'READY' | 'PREVIEW_OPENED' | 'ACTIVE' | 'INACTIVE' | 'REPLACED'
  >(() => {
    if (!isAndroidPlatform()) {
      return 'NOT_SUPPORTED';
    }
    return 'READY';
  });

  const [isSettingLive, setIsSettingLive] = useState<boolean>(false);
  // OEM detection state — filled after first picker attempt
  const [oemInfo, setOemInfo] = useState<{
    oem: string;
    isVivoDevice: boolean;
    isXiaomiDevice: boolean;
    isOEMRestricted: boolean;
    method: string;
  } | null>(null);
  const [showManualGuide, setShowManualGuide] = useState<boolean>(false);

  // Authoritative re-verification against Android WallpaperManager
  const verifyActiveStatus = useCallback(async () => {
    if (!isAndroidPlatform()) {
      setWallpaperStatus('NOT_SUPPORTED');
      return;
    }
    try {
      const res = await checkIsLiveWallpaperActive();
      if (res.isActive) {
        setWallpaperStatus('ACTIVE');
      } else {
        setWallpaperStatus(prev => (prev === 'ACTIVE' || prev === 'PREVIEW_OPENED') ? 'INACTIVE' : 'READY');
      }
    } catch {
      setWallpaperStatus('READY');
    }
  }, []);

  useEffect(() => {
    verifyActiveStatus();

    // Register real lifecycle resume listener so returning from Android settings/preview re-checks state
    const unsubscribe = addWallpaperResumeListener(() => {
      verifyActiveStatus();
    });

    return () => {
      unsubscribe();
    };
  }, [verifyActiveStatus, activeExam]);

  // Refresh authoritative telemetry whenever activeExam, user, or storage events trigger
  const refreshTelemetry = useCallback(() => {
    const updated = getAuthoritativeWallpaperTelemetry(user.id, activeExam, userTargetDate);
    setTelemetry(updated);
  }, [user.id, activeExam, userTargetDate]);

  useEffect(() => {
    refreshTelemetry();
  }, [refreshTelemetry]);

  // Reactive listeners for external syllabus progress, timer sessions, CBT tests, streak changes
  useEffect(() => {
    const handleProgressChange = () => {
      refreshTelemetry();
      syncAuthoritativeWallpaperToNative(user.id, activeExam, selectedPersona, user.name).catch(() => {});
    };

    window.addEventListener('aspirantx_exam_changed', handleProgressChange);
    window.addEventListener('aspirantx_subtopic_progress_updated', handleProgressChange);
    window.addEventListener('aspirantx_study_session_saved', handleProgressChange);
    window.addEventListener('aspirantx_streak_updated', handleProgressChange);
    window.addEventListener('aspirantx_cbt_results_updated', handleProgressChange);
    window.addEventListener('aspirantx_local_store_updated', handleProgressChange);

    return () => {
      window.removeEventListener('aspirantx_exam_changed', handleProgressChange);
      window.removeEventListener('aspirantx_subtopic_progress_updated', handleProgressChange);
      window.removeEventListener('aspirantx_study_session_saved', handleProgressChange);
      window.removeEventListener('aspirantx_streak_updated', handleProgressChange);
      window.removeEventListener('aspirantx_cbt_results_updated', handleProgressChange);
      window.removeEventListener('aspirantx_local_store_updated', handleProgressChange);
    };
  }, [refreshTelemetry, user.id, activeExam, selectedPersona, user.name]);

  const handleSelectPersona = (p: WallpaperPersona) => {
    setSelectedPersona(p);
    try {
      localStorage.setItem('aspirantx_wallpaper_persona_id', p.id);
    } catch {}

    // Immediately push new theme and quote to native Android live wallpaper
    syncAuthoritativeWallpaperToNative(user.id, activeExam, p, user.name).catch(() => {});
  };

  const todayStr = getISTDateString(new Date());
  const todayBox = telemetry.dateBoxes.find(b => b.isToday);
  const isTodayCompleted = todayBox?.isCompleted || false;

  const handleSetLiveWallpaper = async () => {
    setIsSettingLive(true);
    setWallpaperStatus('PREVIEW_OPENED');
    try {
      const result = await requestSetLiveWallpaper(user.id, activeExam, selectedPersona, user.name);
      // Save OEM info for showing the right manual guide
      setOemInfo({
        oem: result.oem || '',
        isVivoDevice: !!result.isVivoDevice,
        isXiaomiDevice: !!result.isXiaomiDevice,
        isOEMRestricted: !!result.isOEMRestricted,
        method: result.method || 'unknown',
      });
      // If picker opened via Settings or needs manual action, show guide
      if (!result.success || result.method === 'manual' || result.method === 'settings_display') {
        setShowManualGuide(true);
        setWallpaperStatus('READY');
      }
    } catch (err) {
      console.error('Failed to open wallpaper preview:', err);
      setShowManualGuide(true);
      verifyActiveStatus();
    } finally {
      setIsSettingLive(false);
    }
  };

  const handleCompleteTodayBox = async () => {
    if (isTodayCompleted) return;

    markDailyBoxCompleted(user.id, activeExam, todayStr);
    refreshTelemetry();

    // Push updated telemetry to Native Live Wallpaper immediately (0 network calls)
    syncAuthoritativeWallpaperToNative(user.id, activeExam, selectedPersona, user.name).catch(() => {});

    // Award XP
    await awardXPAndCoins(25, 5, 'Daily Box Completed', user.id);

    // Notify streak update
    window.dispatchEvent(
      new CustomEvent('aspirantx_streak_updated', {
        detail: { streakDays: telemetry.currentStreak + 1 },
      })
    );
  };

  // ── Universal Rounded Rect Canvas Helper ────────────────────────────────────
  const drawRoundRect = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number
  ) => {
    if (typeof context.roundRect === 'function') {
      context.beginPath();
      context.roundRect(x, y, w, h, radius);
    } else {
      context.beginPath();
      context.moveTo(x + radius, y);
      context.lineTo(x + w - radius, y);
      context.quadraticCurveTo(x + w, y, x + w, y + radius);
      context.lineTo(x + w, y + h - radius);
      context.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      context.lineTo(x + radius, y + h);
      context.quadraticCurveTo(x, y + h, x, y + h - radius);
      context.lineTo(x, y + radius);
      context.quadraticCurveTo(x, y, x + radius, y);
      context.closePath();
    }
  };

  // ── HD Dynamic Wallpaper Generator (1080 x 2400 Mobile Screen) ──────────────
  const generateAndDownloadWallpaper = async () => {
    setIsGeneratingWallpaper(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 2400;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Dynamic Background Gradient based on Persona Theme
      const [c1, c2, c3] = selectedPersona.bgGradient;
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 2400);
      bgGrad.addColorStop(0, c1);
      bgGrad.addColorStop(0.5, c2);
      bgGrad.addColorStop(1, c3);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 2400);

      // 2. Ambient Aura Glow Circle
      const radialGlow = ctx.createRadialGradient(540, 420, 40, 540, 420, 600);
      radialGlow.addColorStop(0, selectedPersona.glowColor);
      radialGlow.addColorStop(0.6, 'rgba(0, 0, 0, 0.05)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, 1080, 1000);

      // Launcher-Safe Layout Geometry (W: 1080, H: 2400)
      const margin = 1080 * 0.055; // 59.4px
      const contentWidth = 1080 - (margin * 2); // 961.2px
      let currentY = 2400 * 0.138; // 331px (clears status bar & at-a-glance date/weather)
      const itemGap = 2400 * 0.008; // 19.2px

      // 3. Top Persona Eyebrow / System Badge
      ctx.fillStyle = selectedPersona.accentColor;
      ctx.font = 'bold 29px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`⚡  ${selectedPersona.characterTitle.toUpperCase()}  ⚡`, margin, currentY);
      currentY += 1080 * 0.046;

      // 4. Candidate Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px sans-serif';
      ctx.fillText(user.name || 'Dedicated Aspirant', margin, currentY);
      currentY += 1080 * 0.042;

      // 5. Target Exam & Date
      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 31px sans-serif';
      const cleanExamTitle = telemetry.examName || activeExam.replace(/_/g, ' ');
      const combinedExamDate = `${cleanExamTitle} • ${telemetry.schedule.formattedDate}`;
      ctx.fillText(combinedExamDate, margin, currentY);
      currentY += 1080 * 0.038 + itemGap;

      // 6. Hero Countdown Pill Banner
      const pillHeight = 1080 * 0.092; // 99px
      const pillGrad = ctx.createLinearGradient(margin, currentY, margin + contentWidth, currentY + pillHeight);
      pillGrad.addColorStop(0, '#4f46e5');
      pillGrad.addColorStop(1, selectedPersona.accentColor);
      ctx.fillStyle = pillGrad;
      drawRoundRect(ctx, margin, currentY, contentWidth, pillHeight, pillHeight / 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 45px sans-serif';
      ctx.textAlign = 'center';
      const countdownText = (telemetry.schedule.hasDate && telemetry.schedule.daysRemaining !== null)
        ? `${telemetry.schedule.daysRemaining} DAYS REMAINING`
        : 'EXAM: SCHEDULE PENDING';
      ctx.fillText(countdownText, 540, currentY + (pillHeight * 0.63));
      currentY += pillHeight + itemGap + 7;

      // 7. Two High-Yield Metric Cards (Syllabus % + Real Streak)
      const cardGap = 1080 * 0.030; // 32.4px
      const cardWidth = (contentWidth - cardGap) / 2; // 464.4px
      const cardHeight = 1080 * 0.170; // 183.6px

      // Left Card: Syllabus Progress
      ctx.fillStyle = '#0f172a';
      drawRoundRect(ctx, margin, currentY, cardWidth, cardHeight, 20);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('SYLLABUS PROGRESS', margin + (cardWidth * 0.09), currentY + (cardHeight * 0.32));

      ctx.fillStyle = selectedPersona.accentColor;
      ctx.font = 'bold 50px sans-serif';
      ctx.fillText(`${telemetry.syllabusPercentage}%`, margin + (cardWidth * 0.09), currentY + (cardHeight * 0.64));

      // Mini Progress bar
      const barMargin = cardWidth * 0.09;
      const barHeight = 1080 * 0.015;
      const barY = currentY + cardHeight - (cardHeight * 0.22);
      ctx.fillStyle = '#1e293b';
      drawRoundRect(ctx, margin + barMargin, barY, cardWidth - (barMargin * 2), barHeight, barHeight / 2);
      ctx.fill();

      ctx.fillStyle = selectedPersona.accentColor;
      const progFillWidth = Math.max(barHeight, ((cardWidth - (barMargin * 2)) * telemetry.syllabusPercentage) / 100);
      drawRoundRect(ctx, margin + barMargin, barY, progFillWidth, barHeight, barHeight / 2);
      ctx.fill();

      // Right Card: Active Streak
      const rightCardX = margin + cardWidth + cardGap;
      ctx.fillStyle = '#0f172a';
      drawRoundRect(ctx, rightCardX, currentY, cardWidth, cardHeight, 20);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('ACTIVE STREAK', rightCardX + (cardWidth * 0.09), currentY + (cardHeight * 0.32));

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 50px sans-serif';
      ctx.fillText(`${telemetry.currentStreak} Days`, rightCardX + (cardWidth * 0.09), currentY + (cardHeight * 0.64));

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`${telemetry.totalCompletedDays} Days Verified`, rightCardX + (cardWidth * 0.09), currentY + cardHeight - (cardHeight * 0.18));

      currentY += cardHeight + itemGap;

      // 8. Motivational Character Quote Card
      const quoteHeight = 1080 * 0.092; // 99px
      ctx.fillStyle = '#0a0f1d';
      drawRoundRect(ctx, margin, currentY, contentWidth, quoteHeight, 20);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Decorative quote marks
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 64px serif';
      ctx.textAlign = 'left';
      ctx.fillText('“', margin + 35, currentY + (quoteHeight * 0.72));
      ctx.textAlign = 'right';
      ctx.fillText('”', margin + contentWidth - 35, currentY + quoteHeight - (quoteHeight * 0.15));

      // Centered Quote Text
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'italic bold 26px sans-serif';
      ctx.textAlign = 'center';
      const quoteDisplay = selectedPersona.characterQuote.length > 55
        ? selectedPersona.characterQuote.substring(0, 52) + '...'
        : selectedPersona.characterQuote;
      ctx.fillText(`"${quoteDisplay}"`, 540, currentY + (quoteHeight * 0.58));

      currentY += quoteHeight + itemGap;

      // 9. Daily Study Habit Calendar Card (28-Day Circular Matrix with Page Dots)
      const cols = 7;
      const rows = 4;
      const circleSize = 1080 * 0.056;
      const gridInnerWidth = contentWidth - (1080 * 0.07);
      const gapX = (gridInnerWidth - (cols * circleSize)) / (cols - 1);
      const gapY = 1080 * 0.012;
      const gridHeight = (rows * circleSize) + ((rows - 1) * gapY);

      const cardPaddingTop = 1080 * 0.026;
      const headerHeight = 1080 * 0.046;
      const pageDotsHeight = 1080 * 0.030;
      const cardPaddingBottom = 1080 * 0.018;
      const totalCardHeight = cardPaddingTop + headerHeight + gridHeight + pageDotsHeight + cardPaddingBottom;

      ctx.fillStyle = '#0a0f1d';
      drawRoundRect(ctx, margin, currentY, contentWidth, totalCardHeight, 26);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Card Header
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('DAILY STUDY HABIT CALENDAR (28 DAYS)', margin + (1080 * 0.038), currentY + cardPaddingTop + (1080 * 0.024));

      const gridStartX = margin + (1080 * 0.035);
      const gridStartY = currentY + cardPaddingTop + headerHeight;

      telemetry.dateBoxes.slice(0, 28).forEach((box, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const cx = gridStartX + (c * (circleSize + gapX)) + (circleSize / 2);
        const cy = gridStartY + (r * (circleSize + gapY)) + (circleSize / 2);
        const radius = circleSize / 2;

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);

        if (box.isCompleted) {
          ctx.fillStyle = '#10b981';
          ctx.fill();

          ctx.fillStyle = '#022c22';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(box.dayNumber), cx, cy - (circleSize * 0.06));

          ctx.font = 'bold 20px sans-serif';
          ctx.fillText('✓', cx, cy + (circleSize * 0.28));
        } else if (box.isToday) {
          ctx.fillStyle = '#1e1b4b';
          ctx.fill();
          ctx.strokeStyle = selectedPersona.accentColor;
          ctx.lineWidth = 2.5;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 25px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(box.dayNumber), cx, cy + (circleSize * 0.12));
        } else if (box.isMissed) {
          ctx.fillStyle = '#0f172a';
          ctx.fill();
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#475569';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('—', cx, cy + (circleSize * 0.10));
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.fill();
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.fillStyle = '#475569';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(box.dayNumber), cx, cy + (circleSize * 0.12));
        }
      });

      // 3 Minimalist Page Indicator Dots
      const dotsY = gridStartY + gridHeight + (1080 * 0.024);
      const dotRadius = 1080 * 0.007;
      const dotGap = 1080 * 0.024;

      // Left dot
      ctx.beginPath();
      ctx.arc(540 - dotGap, dotsY, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#334155';
      ctx.fill();
      // Center active dot
      ctx.beginPath();
      ctx.arc(540, dotsY, dotRadius * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      // Right dot
      ctx.beginPath();
      ctx.arc(540 + dotGap, dotsY, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#334155';
      ctx.fill();

      const dataUrl = canvas.toDataURL('image/png');
      const filename = `AspirantX_${activeExam}_${selectedPersona.id}_Wallpaper.png`;

      // Check if running inside native Android Capacitor APK
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        try {
          const { Filesystem, Directory } = await import('@capacitor/filesystem');
          const { Share } = await import('@capacitor/share');

          const base64Data = dataUrl.split(',')[1];
          const savedFile = await Filesystem.writeFile({
            path: filename,
            data: base64Data,
            directory: Directory.Cache
          });

          // Open Android native Share dialog (allows user to select 'Use as wallpaper' / 'Photos' / 'Gallery')
          await Share.share({
            title: `Set ${cleanExamTitle} Wallpaper`,
            text: `AspirantX ${cleanExamTitle} countdown and progress wallpaper`,
            url: savedFile.uri,
            dialogTitle: 'Set as Lockscreen / Homescreen Wallpaper'
          });

          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 4000);
          return;
        } catch (nativeErr) {
          console.warn('Native wallpaper share fallback to standard download:', nativeErr);
        }
      }

      // Standard Browser / Web Download Link
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Wallpaper generation error:', err);
    } finally {
      setIsGeneratingWallpaper(false);
    }
  };

  const categories = ['All', 'Anime Power', 'Officer Aura', 'Zen Minimal', 'Cyberpunk Sci-Fi'];
  const filteredPersonas = filterCategory === 'All'
    ? WALLPAPER_PERSONAS
    : WALLPAPER_PERSONAS.filter(p => p.category === filterCategory);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl space-y-5">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>Dynamic Exam Progress Wallpaper Hub</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase">
              {activeExam.replace(/_/g, ' ')}
            </span>
          </div>
          <h2 className="text-base sm:text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <span>{selectedPersona.badgeEmoji}</span>
            <span>{telemetry.examName}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {telemetry.schedule.hasDate ? (
              <span>Target Exam Date: <strong className="text-indigo-300">{telemetry.schedule.formattedDate}</strong> ({telemetry.schedule.daysRemaining} days left)</span>
            ) : (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 inline" /> Exam Schedule: To Be Announced (No fake dates invented)
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Persona Switcher Button */}
          <button
            onClick={() => setShowPersonaSelector(!showPersonaSelector)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
            <span>Theme: {selectedPersona.name.split(' ')[0]}</span>
          </button>

          {/* Fullscreen Live Desk Stand Companion */}
          <button
            onClick={() => setShowLiveCompanionModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer"
            title="Open Fullscreen Study Stand Wallpaper Companion"
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Companion</span>
          </button>

          {/* REAL Android Live Wallpaper Button Group */}
          {wallpaperStatus === 'ACTIVE' ? (
            <div className="flex items-center gap-1.5 bg-emerald-950/70 p-1 rounded-xl border border-emerald-500/50">
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-300">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Wallpaper Active</span>
              </span>
              <button
                onClick={handleSetLiveWallpaper}
                disabled={isSettingLive}
                id="btn-manage-live-wallpaper"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                title="Change theme or reconfigure live wallpaper"
              >
                <span>Manage Wallpaper</span>
              </button>
            </div>
          ) : wallpaperStatus === 'PREVIEW_OPENED' ? (
            <button
              disabled
              id="btn-set-live-wallpaper"
              className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-indigo-900/60 text-indigo-300 border border-indigo-500/40 font-bold text-xs"
            >
              <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span>Confirm in Android Preview...</span>
            </button>
          ) : wallpaperStatus === 'REPLACED' || wallpaperStatus === 'INACTIVE' ? (
            <button
              onClick={handleSetLiveWallpaper}
              disabled={isSettingLive}
              id="btn-set-live-wallpaper"
              className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Re-activate Live Wallpaper</span>
            </button>
          ) : (
            <button
              onClick={handleSetLiveWallpaper}
              disabled={isSettingLive || wallpaperStatus === 'NOT_SUPPORTED'}
              id="btn-set-live-wallpaper"
              className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer ${
                wallpaperStatus === 'NOT_SUPPORTED'
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-cyan-600/30'
              }`}
              title={wallpaperStatus === 'NOT_SUPPORTED' ? 'Live wallpaper is a native Android feature. Export HD PNG below.' : 'Set real auto-updating Android home/lockscreen live wallpaper'}
            >
              {isSettingLive ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Smartphone className="w-3.5 h-3.5 text-cyan-200" />
              )}
              <span>{wallpaperStatus === 'NOT_SUPPORTED' ? 'Android Live Feature' : 'Set as Live Wallpaper'}</span>
            </button>
          )}

          {/* Generate HD Static Wallpaper */}
          <button
            onClick={generateAndDownloadWallpaper}
            disabled={isGeneratingWallpaper}
            id="btn-export-wallpaper-png"
            className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isGeneratingWallpaper ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{downloadSuccess ? 'Downloaded HD!' : 'Export Wallpaper (1080×2400)'}</span>
          </button>

          {!isTodayCompleted && (
            <button
              onClick={handleCompleteTodayBox}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              title="Manually verify and log today's study habit goal"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Today Complete</span>
            </button>
          )}
        </div>
      </div>

      {/* Real Authoritative Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-indigo-400" /> Days Left
          </div>
          <div className="text-lg font-black text-indigo-300 mt-1">
            {telemetry.schedule.daysRemaining !== null ? `${telemetry.schedule.daysRemaining} Days` : 'Date TBA'}
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 cursor-pointer hover:border-sky-500/40 transition-all" onClick={onNavigateToSyllabus}>
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-sky-400" /> Syllabus %
          </div>
          <div className="text-lg font-black text-sky-400 mt-1">
            {telemetry.syllabusPercentage}%
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" /> Active Streak
          </div>
          <div className="text-lg font-black text-amber-400 mt-1">
            {telemetry.currentStreak} Days 🔥
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Completed Days
          </div>
          <div className="text-lg font-black text-emerald-400 mt-1">
            {telemetry.totalCompletedDays} Days Done
          </div>
        </div>
      </div>

      {/* Expandable Persona Theme Picker */}
      <AnimatePresence>
        {showPersonaSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 p-4 rounded-2xl bg-slate-950/90 border border-indigo-500/30 space-y-3"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Select Persona Style
              </span>
              <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all ${
                      filterCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {filteredPersonas.map((p) => {
                const isSelected = selectedPersona.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPersona(p)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? `${p.cardBorder} bg-indigo-950/40 shadow-md ring-1 ring-indigo-500`
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xl">{p.badgeEmoji}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase px-1.5 py-0.5 rounded bg-slate-800">
                        {p.ageGroupLabel.split(' ')[0]}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">{p.characterQuote}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Informational banner */}
      {wallpaperStatus !== 'ACTIVE' && (
        <div className="relative z-10 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-2 text-xs text-slate-300">
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-[11px] sm:text-xs">Dynamic lockscreen wallpaper syncs with your real daily habit activity and exam countdown.</span>
        </div>
      )}

      {/* Deterministic Daily Progress / Streak Calendar Matrix */}
      <div className="relative z-10 space-y-2">
        <div className="flex justify-between items-center text-[11px] sm:text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Daily Study Habit Calendar ({telemetry.totalCompletedDays} Verified / 28d)</span>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Completed
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-red-500/30 inline-block" /> Missed
            </span>
            <span className="flex items-center gap-1 text-indigo-400 font-bold">
              <span className="w-2.5 h-2.5 rounded bg-indigo-600 animate-pulse inline-block" /> Today
            </span>
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
            {telemetry.dateBoxes.map((box) => {
              return (
                <div
                  key={box.dateKey}
                  className={`h-12 rounded-xl flex flex-col items-center justify-center text-[10px] font-bold transition-all relative ${
                    box.isCompleted
                      ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                      : box.isToday
                      ? 'bg-indigo-600 border border-indigo-300 text-white animate-pulse shadow-[0_0_12px_rgba(99,102,241,0.6)] cursor-pointer'
                      : box.isMissed
                      ? 'bg-slate-900/80 border border-red-500/20 text-slate-500'
                      : 'bg-slate-900/40 border border-slate-800/60 text-slate-600'
                  }`}
                  onClick={() => {
                    if (box.isToday) handleCompleteTodayBox();
                  }}
                  title={`${box.dayNumber} ${box.shortMonth} (${box.dateKey}): ${box.activityLabel}`}
                >
                  <span className="text-[9px] opacity-70 leading-none">{box.dayNumber}</span>
                  <span className="text-xs font-black mt-0.5">
                    {box.isCompleted ? '✓' : box.isToday ? 'NOW' : box.isMissed ? '—' : '○'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── FULLSCREEN IN-APP LIVE WALLPAPER / STUDY STAND COMPANION MODAL ── */}
      <AnimatePresence>
        {showLiveCompanionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-6 sm:p-10 backdrop-blur-3xl overflow-y-auto"
          >
            {/* Top Close bar */}
            <div className="w-full max-w-md flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Live Companion Mode</span>
              </div>
              <button
                onClick={() => setShowLiveCompanionModal(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Wallpaper Preview Frame */}
            <div className="w-full max-w-sm rounded-[36px] border-4 border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 shadow-2xl space-y-6 text-center my-6 relative overflow-hidden">
              <div className="text-amber-400 font-extrabold text-xs uppercase tracking-widest">
                ⚡ {selectedPersona.characterTitle} ⚡
              </div>

              <div>
                <h1 className="text-2xl font-black text-white">{user.name || 'Candidate'}</h1>
                <p className="text-sm font-bold text-slate-300 mt-1">{telemetry.examName}</p>
              </div>

              {/* Days left pill */}
              <div className="py-2.5 px-4 rounded-full bg-indigo-950/80 border border-indigo-500/60 inline-block shadow-lg">
                <span className="text-sm font-black text-indigo-300">
                  {telemetry.schedule.daysRemaining !== null ? `${telemetry.schedule.daysRemaining} DAYS REMAINING` : 'SCHEDULE PENDING'}
                </span>
              </div>

              <div className="text-xs text-slate-400 font-medium">
                {telemetry.schedule.formattedDate}
              </div>

              {/* Progress & Streak row */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Syllabus</div>
                  <div className="text-xl font-black text-sky-400">{telemetry.syllabusPercentage}%</div>
                </div>
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Streak</div>
                  <div className="text-xl font-black text-amber-400">{telemetry.currentStreak}d 🔥</div>
                </div>
              </div>

              {/* Quote */}
              <p className="text-xs text-slate-300 italic font-medium px-2">
                "{selectedPersona.characterQuote}"
              </p>

              {/* Calendar Grid Preview */}
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 font-bold uppercase text-left">Habit History</div>
                <div className="grid grid-cols-7 gap-1.5 p-2.5 rounded-xl bg-black/40 border border-white/5">
                  {telemetry.dateBoxes.slice(0, 14).map(b => (
                    <div key={b.dateKey} className={`h-7 rounded-md flex items-center justify-center text-[9px] font-bold ${
                      b.isCompleted ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' :
                      b.isToday ? 'bg-indigo-600 text-white font-black' :
                      b.isMissed ? 'bg-slate-900 text-slate-600' : 'bg-slate-900/40 text-slate-700'
                    }`}>
                      {b.isCompleted ? '✓' : b.dayNumber}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Download CTA */}
            <div className="w-full max-w-md flex flex-col items-center gap-2">
              <button
                onClick={generateAndDownloadWallpaper}
                disabled={isGeneratingWallpaper}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export 1080×2400 High-Res Wallpaper</span>
              </button>
              <p className="text-[11px] text-slate-400">
                Compatible with all Android home &amp; lock screens
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── OEM Manual Setup Guide Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {showManualGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm px-3 pb-4 sm:pb-0"
            onClick={(e) => { if (e.target === e.currentTarget) setShowManualGuide(false); }}
          >
            <motion.div
              initial={{ y: 60, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 60, scale: 0.97 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/70 rounded-3xl shadow-2xl p-5 relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowManualGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/40 flex-shrink-0">
                  <Smartphone className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Live Wallpaper Setup</h3>
                  <p className="text-[11px] text-slate-400">
                    {oemInfo?.isVivoDevice
                      ? '📱 Vivo — Manual Steps Required'
                      : oemInfo?.isXiaomiDevice
                      ? '📱 Xiaomi/MIUI — Manual Steps Required'
                      : '📱 Manual Setup Required'}
                  </p>
                </div>
              </div>

              {/* OEM Notice */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 mb-4">
                <p className="text-[11px] text-amber-200 font-medium leading-relaxed">
                  {oemInfo?.isVivoDevice
                    ? 'Vivo (Funtouch OS) ne standard live wallpaper picker ko block kar diya hai. Neeche diye steps follow karein:'
                    : oemInfo?.isXiaomiDevice
                    ? 'MIUI/HyperOS ne direct live wallpaper picker ko restrict kar diya hai. Neeche diye steps follow karein:'
                    : 'Aapke phone ka launcher direct live wallpaper setting ko support nahi karta. Neeche diye steps follow karein:'}
                </p>
              </div>

              {/* Step-by-step Guide */}
              <div className="space-y-2.5 mb-4">
                {(oemInfo?.isVivoDevice ? [
                  { step: 1, icon: '🏠', title: 'Home Screen pe jayen', desc: 'App band karein aur home screen pe ayen' },
                  { step: 2, icon: '👆', title: 'Long Press Karen', desc: 'Home screen pe empty jagah pe 2 sec hold karein' },
                  { step: 3, icon: '🖼️', title: '"Wallpaper" Option Select Karein', desc: 'Menu mein "Wallpapers" ya "Wallpaper & Style" pe tap karein' },
                  { step: 4, icon: '🎬', title: '"Live Wallpapers" Tab Open Karein', desc: 'Static wallpapers wali screen mein "Live" ya "Animated" tab pe tap karein' },
                  { step: 5, icon: '⚡', title: 'AspirantX Select Karein', desc: 'List mein "AspirantX" dhundhein aur select karein, phir "Set Wallpaper" tap karein' },
                ] : oemInfo?.isXiaomiDevice ? [
                  { step: 1, icon: '🏠', title: 'Home Screen pe jayen', desc: 'App close karein' },
                  { step: 2, icon: '👆', title: 'Home Screen Long Press', desc: 'Empty area pe 2 second hold karein' },
                  { step: 3, icon: '🖼️', title: '"Wallpaper" Pe Tap Karein', desc: 'Bottom menu se "Wallpaper" select karein' },
                  { step: 4, icon: '🎬', title: '"Live Wallpapers" Category Chunein', desc: '"Live Wallpapers" section dhundhein' },
                  { step: 5, icon: '⚡', title: 'AspirantX Select Karein', desc: 'AspirantX wallpaper pe tap karein aur "Apply" karein' },
                ] : [
                  { step: 1, icon: '⚙️', title: 'Settings Open Karein', desc: 'Phone Settings app open karein' },
                  { step: 2, icon: '🖼️', title: 'Wallpaper Setting Dhundhein', desc: '"Wallpaper" ya "Display > Wallpaper" option dhundhein' },
                  { step: 3, icon: '🎬', title: 'Live Wallpapers Select Karein', desc: '"Live Wallpapers" ya "Animated Wallpapers" pe tap karein' },
                  { step: 4, icon: '⚡', title: 'AspirantX Chunein', desc: 'List mein AspirantX dhundhein aur "Set Wallpaper" karein' },
                ]).map(({ step, icon, title, desc }) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center flex-shrink-0 text-xs font-black text-indigo-300">
                      {step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white">{icon} {title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tip */}
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-2.5 mb-4">
                <p className="text-[11px] text-indigo-300 font-medium">
                  💡 <strong>Tip:</strong> AspirantX live wallpaper already install hai aur ready hai — sirf system picker se select karna hai.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowManualGuide(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
                >
                  Samajh Gaya
                </button>
                <button
                  onClick={() => {
                    setShowManualGuide(false);
                    handleSetLiveWallpaper();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition-all"
                >
                  Dobara Try Karein
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

