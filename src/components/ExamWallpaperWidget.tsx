import React, { useState, useEffect, useRef } from 'react';
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
  Sliders,
  Palette,
  Eye,
  Check
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  getLocalDeviceStore, 
  markDailyBoxCompleted,
  LocalDeviceStudyStore 
} from '../lib/packetSyncService';
import { awardXPAndCoins } from '../lib/gamification';
import { WALLPAPER_PERSONAS, WallpaperPersona } from '../lib/wallpaperPersonas';

interface ExamWallpaperWidgetProps {
  user: UserProfile;
  selectedExam: string;
  onNavigateToSyllabus?: () => void;
}

export const ExamWallpaperWidget: React.FC<ExamWallpaperWidgetProps> = ({
  user,
  selectedExam,
  onNavigateToSyllabus,
}) => {
  const activeExam = selectedExam || user.exam || 'NEET_UG';
  const [store, setStore] = useState<LocalDeviceStudyStore>(() => 
    getLocalDeviceStore(user.id, activeExam)
  );

  const [hasPermission, setHasPermission] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aspirantx_wallpaper_permission') === 'granted';
    } catch {
      return false;
    }
  });

  const [selectedPersona, setSelectedPersona] = useState<WallpaperPersona>(() => {
    const saved = localStorage.getItem('aspirantx_wallpaper_persona_id');
    return WALLPAPER_PERSONAS.find(p => p.id === saved) || WALLPAPER_PERSONAS[0];
  });

  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [isGeneratingWallpaper, setIsGeneratingWallpaper] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [showPersonaSelector, setShowPersonaSelector] = useState<boolean>(false);

  // Sync state when exam or user changes
  useEffect(() => {
    setStore(getLocalDeviceStore(user.id, activeExam));
  }, [user.id, activeExam]);

  const handleSelectPersona = (p: WallpaperPersona) => {
    setSelectedPersona(p);
    localStorage.setItem('aspirantx_wallpaper_persona_id', p.id);
  };

  // Calculate days & boxes
  const todayDate = new Date();
  const todayKey = todayDate.toISOString().split('T')[0];

  const examTargetDate = new Date(store.examDate);
  const diffTime = examTargetDate.getTime() - todayDate.getTime();
  const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  const totalDays = Math.min(365, Math.max(90, daysRemaining + store.completedBoxKeys.length));
  const completedBoxesCount = store.completedBoxKeys.length;
  const isTodayCompleted = store.completedBoxKeys.includes(todayKey);

  const handleCompleteTodayBox = async () => {
    if (isTodayCompleted) return;

    markDailyBoxCompleted(user.id, activeExam, todayKey);
    const updatedStore = getLocalDeviceStore(user.id, activeExam);
    setStore(updatedStore);

    // Gamification XP
    await awardXPAndCoins(25, 5, 'Daily Box Completed', user.id);

    // Notify streak update
    window.dispatchEvent(
      new CustomEvent('aspirantx_streak_updated', {
        detail: { streakDays: (user.streakDays || 1) + 1 },
      })
    );
  };

  const handleGrantPermission = () => {
    try {
      localStorage.setItem('aspirantx_wallpaper_permission', 'granted');
      setHasPermission(true);
    } catch {}
  };

  // HD Dynamic Anime & Age-Persona Wallpaper Generator (1080 x 2400 Mobile Wallpaper)
  const generateAndDownloadWallpaper = async () => {
    setIsGeneratingWallpaper(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 2400;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Dynamic Background Gradient based on Persona
      const [c1, c2, c3] = selectedPersona.bgGradient;
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 2400);
      bgGrad.addColorStop(0, c1);
      bgGrad.addColorStop(0.5, c2);
      bgGrad.addColorStop(1, c3);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 2400);

      // 2. Ambient Aura Glow Circle
      const radialGlow = ctx.createRadialGradient(540, 520, 40, 540, 520, 600);
      radialGlow.addColorStop(0, selectedPersona.glowColor);
      radialGlow.addColorStop(0.6, 'rgba(0, 0, 0, 0.05)');
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, 1080, 1100);

      // 3. Top System / Persona Badge
      ctx.fillStyle = selectedPersona.accentColor;
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚡ ${selectedPersona.characterTitle} ⚡`, 540, 210);

      // 4. User Name & Target Exam
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText(user.name || 'Aspirant', 540, 290);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(`Target: ${activeExam.replace(/_/g, ' ')}`, 540, 345);

      // Universal safe rounded rect helper for Canvas
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

      // 5. Days Left Pill Badge
      ctx.fillStyle = '#0f172a';
      drawRoundRect(ctx, 320, 385, 440, 85, 42);
      ctx.fill();
      ctx.strokeStyle = selectedPersona.accentColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = selectedPersona.accentColor;
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText(`${daysRemaining} DAYS REMAINING`, 540, 445);

      // 6. Character Quote Banner
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      drawRoundRect(ctx, 100, 495, 880, 80, 20);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'italic bold 26px sans-serif';
      ctx.fillText(selectedPersona.characterQuote, 540, 545);

      // 7. Grid of Countdown Boxes (10 columns)
      const cols = 10;
      const boxSize = 64;
      const gap = 24;
      const gridWidth = cols * boxSize + (cols - 1) * gap;
      const startX = (1080 - gridWidth) / 2;
      const startY = 620;

      const totalRenderBoxes = Math.min(160, totalDays);

      for (let i = 0; i < totalRenderBoxes; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * (boxSize + gap);
        const y = startY + row * (boxSize + gap);

        const isCompleted = i < completedBoxesCount;
        const isToday = i === completedBoxesCount;

        if (isCompleted) {
          ctx.fillStyle = selectedPersona.accentColor;
          drawRoundRect(ctx, x, y, boxSize, boxSize, 14);
          ctx.fill();
          
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 32px sans-serif';
          ctx.fillText('✓', x + boxSize / 2, y + boxSize / 2 + 11);
        } else if (isToday) {
          ctx.fillStyle = '#6366f1';
          drawRoundRect(ctx, x, y, boxSize, boxSize, 14);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 4;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 26px sans-serif';
          ctx.fillText('NOW', x + boxSize / 2, y + boxSize / 2 + 9);
        } else {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
          drawRoundRect(ctx, x, y, boxSize, boxSize, 14);
          ctx.fill();
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.8)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Footer Tagline
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('ASPIRANTX DYNAMIC SYSTEM • PROVEN DISCIPLINE', 540, 2220);

      // Download Wallpaper Image
      const link = document.createElement('a');
      link.download = `AspirantX_${selectedPersona.id}_Wallpaper_${activeExam}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Wallpaper generation failed:', err);
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
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>Dynamic Anime & Age-Persona Wallpaper Hub</span>
          </div>
          <h2 className="text-base sm:text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <span>{selectedPersona.badgeEmoji}</span>
            <span>{selectedPersona.name}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedPersona.characterQuote}
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

          {/* Download Wallpaper */}
          <button
            onClick={generateAndDownloadWallpaper}
            disabled={isGeneratingWallpaper}
            className="flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isGeneratingWallpaper ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{downloadSuccess ? 'Downloaded HD!' : 'Generate Wallpaper'}</span>
          </button>

          {!isTodayCompleted && (
            <button
              onClick={handleCompleteTodayBox}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Today</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Persona & Character Theme Picker */}
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
                Select Persona (Anime Characters & Age Groups)
              </span>
              {/* Category Filter Tabs */}
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
            <span className="text-[11px] sm:text-xs">Lockscreen matrix automatically syncs with your daily progress box.</span>
          </div>
          <button
            onClick={handleGrantPermission}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] shrink-0 cursor-pointer"
          >
            Allow
          </button>
        </div>
      )}

      {/* Dynamic Progress Box Grid */}
      <div className="relative z-10 space-y-2">
        <div className="flex justify-between items-center text-[11px] sm:text-xs text-slate-400">
          <span>Daily Journey Matrix ({daysRemaining}d Left • {completedBoxesCount} Done)</span>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-emerald-500 inline-block" /> Done
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-indigo-500 animate-pulse inline-block" /> Today
            </span>
          </div>
        </div>

        <div className="p-3 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800 max-h-48 overflow-y-auto">
          <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-20 gap-1.5 sm:gap-2">
            {Array.from({ length: totalDays }).map((_, idx) => {
              const isCompleted = idx < completedBoxesCount;
              const isToday = idx === completedBoxesCount;

              return (
                <motion.div
                  key={idx}
                  whileHover={{ scale: 1.15 }}
                  className={`h-6 sm:h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                      : isToday
                      ? 'bg-indigo-600 border border-indigo-400 text-white animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.6)] cursor-pointer'
                      : 'bg-slate-900 border border-slate-800/80 text-slate-600'
                  }`}
                  onClick={() => {
                    if (isToday) handleCompleteTodayBox();
                  }}
                  title={isCompleted ? `Day ${idx + 1}: Completed` : isToday ? `Day ${idx + 1}: Today's Target` : `Day ${idx + 1}`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
