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
  syncAuthoritativeWallpaperToNative 
} from '../lib/nativeWallpaperBridge';

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

  const [hasPermission, setHasPermission] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aspirantx_wallpaper_permission') === 'granted';
    } catch {
      return false;
    }
  });

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
    const handleProgressChange = () => refreshTelemetry();

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
  }, [refreshTelemetry]);

  const handleSelectPersona = (p: WallpaperPersona) => {
    setSelectedPersona(p);
    try {
      localStorage.setItem('aspirantx_wallpaper_persona_id', p.id);
    } catch {}
  };

  const todayStr = getISTDateString(new Date());
  const todayBox = telemetry.dateBoxes.find(b => b.isToday);
  const isTodayCompleted = todayBox?.isCompleted || false;

  const [isLiveActive, setIsLiveActive] = useState<boolean>(false);
  const [isSettingLive, setIsSettingLive] = useState<boolean>(false);

  useEffect(() => {
    checkIsLiveWallpaperActive().then(setIsLiveActive).catch(() => {});
  }, [activeExam]);

  const handleSetLiveWallpaper = async () => {
    setIsSettingLive(true);
    try {
      await requestSetLiveWallpaper(user.id, activeExam);
      setTimeout(() => {
        checkIsLiveWallpaperActive().then(setIsLiveActive).catch(() => {});
      }, 1500);
    } finally {
      setIsSettingLive(false);
    }
  };

  const handleCompleteTodayBox = async () => {
    if (isTodayCompleted) return;

    markDailyBoxCompleted(user.id, activeExam, todayStr);
    refreshTelemetry();

    // Push updated telemetry to Native Live Wallpaper immediately (0 network calls)
    syncAuthoritativeWallpaperToNative(user.id, activeExam).catch(() => {});

    // Award XP
    await awardXPAndCoins(25, 5, 'Daily Box Completed', user.id);

    // Notify streak update
    window.dispatchEvent(
      new CustomEvent('aspirantx_streak_updated', {
        detail: { streakDays: telemetry.currentStreak + 1 },
      })
    );
  };

  const handleGrantPermission = () => {
    try {
      localStorage.setItem('aspirantx_wallpaper_permission', 'granted');
      setHasPermission(true);
    } catch {}
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
      const radialGlow = ctx.createRadialGradient(540, 480, 40, 540, 480, 600);
      radialGlow.addColorStop(0, selectedPersona.glowColor);
      radialGlow.addColorStop(0.6, 'rgba(0, 0, 0, 0.05)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, 1080, 1000);

      // 3. Top System / Persona Badge
      ctx.fillStyle = selectedPersona.accentColor;
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚡ ${selectedPersona.characterTitle.toUpperCase()} ⚡`, 540, 190);

      // 4. Candidate Name & Target Exam Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 60px sans-serif';
      ctx.fillText(user.name || 'Dedicated Aspirant', 540, 265);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 36px sans-serif';
      const cleanExamTitle = telemetry.examName || activeExam.replace(/_/g, ' ');
      ctx.fillText(cleanExamTitle, 540, 320);

      // 5. Hero Days Remaining Pill
      ctx.fillStyle = '#0f172a';
      drawRoundRect(ctx, 280, 355, 520, 80, 40);
      ctx.fill();
      ctx.strokeStyle = selectedPersona.accentColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = selectedPersona.accentColor;
      ctx.font = 'bold 36px sans-serif';
      if (telemetry.schedule.hasDate && telemetry.schedule.daysRemaining !== null) {
        ctx.fillText(`${telemetry.schedule.daysRemaining} DAYS REMAINING`, 540, 408);
      } else {
        ctx.fillText(`EXAM: SCHEDULE PENDING`, 540, 408);
      }

      // Date subtitle below pill
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(telemetry.schedule.formattedDate, 540, 470);

      // 6. Two High-Yield Metric Cards (Syllabus % + Real Streak)
      // Left Card: Syllabus %
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      drawRoundRect(ctx, 80, 505, 430, 150, 24);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('SYLLABUS PROGRESS', 110, 545);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText(`${telemetry.syllabusPercentage}%`, 110, 600);

      // Mini Progress bar
      ctx.fillStyle = '#1e293b';
      drawRoundRect(ctx, 110, 620, 370, 16, 8);
      ctx.fill();

      ctx.fillStyle = '#38bdf8';
      const progWidth = Math.max(16, (370 * telemetry.syllabusPercentage) / 100);
      drawRoundRect(ctx, 110, 620, progWidth, 16, 8);
      ctx.fill();

      // Right Card: Verified Streak
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      drawRoundRect(ctx, 570, 505, 430, 150, 24);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('ACTIVE STREAK', 600, 545);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText(`${telemetry.currentStreak} DAYS 🔥`, 600, 600);

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(`${telemetry.totalCompletedDays} verified study days logged`, 600, 634);

      // 7. Motivational Character Quote Banner
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      drawRoundRect(ctx, 80, 685, 920, 75, 20);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'italic bold 24px sans-serif';
      ctx.fillText(`"${selectedPersona.characterQuote}"`, 540, 732);

      // 8. Daily Study Habit Calendar Grid (4 rows x 7 cols = 28 days)
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('DAILY STUDY HABIT CALENDAR • REAL VERIFIED ACTIVITY', 540, 800);

      const cols = 7;
      const boxSize = 105;
      const gapX = 22;
      const gapY = 22;
      const gridWidth = cols * boxSize + (cols - 1) * gapX;
      const startX = (1080 - gridWidth) / 2;
      const startY = 835;

      telemetry.dateBoxes.slice(0, 28).forEach((box, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (boxSize + gapX);
        const y = startY + row * (boxSize + gapY);

        if (box.isCompleted) {
          // Completed Study Day: Glowing accent box with green check
          ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
          drawRoundRect(ctx, x, y, boxSize, boxSize, 18);
          ctx.fill();
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Date number top left
          ctx.fillStyle = '#a7f3d0';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(box.dayNumber, x + boxSize / 2, y + 36);

          // Big bold checkmark
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 44px sans-serif';
          ctx.fillText('✓', x + boxSize / 2, y + 84);
        } else if (box.isToday) {
          // Today (active, awaiting completion or active)
          ctx.fillStyle = '#4f46e5';
          drawRoundRect(ctx, x, y, boxSize, boxSize, 18);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(box.dayNumber, x + boxSize / 2, y + 42);

          ctx.font = 'bold 26px sans-serif';
          ctx.fillText('NOW', x + boxSize / 2, y + 80);
        } else if (box.isMissed) {
          // Missed Past Day: Dark subtle box with day number, NO check
          ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
          drawRoundRect(ctx, x, y, boxSize, boxSize, 18);
          ctx.fill();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#64748b';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(box.dayNumber, x + boxSize / 2, y + 48);

          ctx.font = 'bold 16px sans-serif';
          ctx.fillStyle = '#ef4444';
          ctx.fillText('—', x + boxSize / 2, y + 78);
        } else {
          // Future Scheduled Day
          ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
          drawRoundRect(ctx, x, y, boxSize, boxSize, 18);
          ctx.fill();
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.fillStyle = '#475569';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(box.dayNumber, x + boxSize / 2, y + 62);
        }
      });

      // 9. Bottom Footer & Live Timestamp
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      const istFormatted = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      ctx.fillText(`ASPIRANTX DYNAMIC SYSTEM • SYNCED ${istFormatted.toUpperCase()}`, 540, 2260);

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

          {/* REAL Android Live Wallpaper Button */}
          <button
            onClick={handleSetLiveWallpaper}
            disabled={isSettingLive}
            id="btn-set-live-wallpaper"
            className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer ${
              isLiveActive
                ? 'bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-500/50 shadow-emerald-700/30'
                : 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white shadow-cyan-600/30 animate-pulse'
            }`}
            title="Set real auto-updating Android home/lockscreen live wallpaper"
          >
            {isSettingLive ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLiveActive ? (
              <Check className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <Smartphone className="w-3.5 h-3.5 text-cyan-200" />
            )}
            <span>{isLiveActive ? 'Live Wallpaper Active' : 'Set as Live Wallpaper'}</span>
          </button>

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

      {/* Permission banner */}
      {!hasPermission && (
        <div className="relative z-10 p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="text-[11px] sm:text-xs">Dynamic lockscreen wallpaper syncs with your real daily habit activity.</span>
          </div>
          <button
            onClick={handleGrantPermission}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shrink-0 cursor-pointer"
          >
            Acknowledge
          </button>
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
                Compatible with all Android home & lock screens
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
