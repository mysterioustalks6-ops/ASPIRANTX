import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Flame, 
  Orbit, 
  ChevronRight, 
  Zap, 
  Award, 
  CheckCircle2, 
  ArrowUpRight,
  TrendingUp,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { 
  RewardCalculation, 
  LevelProgression, 
  MilestoneEntity, 
  getMilestoneEntity 
} from './progressionEngine';
import { FocusSessionRewardResult } from './useFocusProgression';
import { PlanetarySystem } from '../galaxy/PlanetarySystem';
import { cosmicAudio } from '../services/cosmicAudio';
import { ShareCosmicCardButton } from '../components/ShareCosmicCard';

export interface SessionCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: FocusSessionRewardResult | null;
  subject?: string;
  topic?: string;
  onClaim?: () => void;
}

export const SessionCompleteModal: React.FC<SessionCompleteModalProps> = ({
  isOpen,
  onClose,
  reward,
  subject,
  topic,
  onClaim
}) => {
  const [animatedDust, setAnimatedDust] = useState<number>(0);
  const [showLevelUpBadge, setShowLevelUpBadge] = useState<boolean>(false);
  const hasTriggeredAudio = useRef<boolean>(false);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const milestone = useMemo(() => {
    if (!reward) return getMilestoneEntity(1);
    return getMilestoneEntity(reward.newLevel);
  }, [reward]);

  // Smooth Count-Up Animation for Cosmic Dust
  useEffect(() => {
    if (!isOpen || !reward) {
      setAnimatedDust(0);
      setShowLevelUpBadge(false);
      hasTriggeredAudio.current = false;
      return;
    }

    // Trigger celestial sound and mobile vibration once per modal presentation
    if (!hasTriggeredAudio.current) {
      hasTriggeredAudio.current = true;
      if (reward.leveledUp) {
        cosmicAudio.playLevelUp();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([30, 60, 40, 60, 80]);
        }
      } else {
        cosmicAudio.playDustChime();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([30, 50, 40]);
        }
      }
    }

    if (prefersReducedMotion) {
      setAnimatedDust(reward.totalDust);
      if (reward.leveledUp) setShowLevelUpBadge(true);
      return;
    }

    const duration = 1200; // ms
    const startTime = performance.now();
    const targetDust = reward.totalDust;

    let animId: number;
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out quint curve: 1 - Math.pow(1 - progress, 5)
      const easeProgress = 1 - Math.pow(1 - progress, 5);
      const currentVal = Math.round(easeProgress * targetDust);
      setAnimatedDust(currentVal);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        if (reward.leveledUp) {
          setShowLevelUpBadge(true);
        }
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, reward, prefersReducedMotion]);

  if (!isOpen || !reward) return null;

  const handleClaim = () => {
    if (onClaim) onClaim();
    onClose();
  };

  const oldProgressPct = Math.round(reward.oldProgress * 100);
  const newProgressPct = Math.round(reward.newProgress * 100);

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-complete-title"
      >
        {/* 1. Backdrop Dimming with Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl"
          onClick={handleClaim}
        />

        {/* 2. Modal Card Container */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.88, y: 20 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700/80 bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-[#03060c] p-6 sm:p-8 shadow-2xl text-white shadow-sky-950/40 z-10"
        >
          {/* Subtle Ambient Radial Glow */}
          <div 
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl opacity-30"
            style={{ backgroundColor: milestone.accentColor }}
          />

          {/* Top Header Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center gap-1.5">
                <Orbit className="w-3 h-3 animate-spin text-sky-400" style={{ animationDuration: '8s' }} />
                <span>Focus Completed</span>
              </span>
              {reward.streakDays > 1 && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>{reward.streakDays} Day Streak</span>
                </span>
              )}
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              +{reward.durationMinutes} min
            </span>
          </div>

          {/* Subject & Topic if present */}
          {(subject || topic) && (
            <div className="mb-4 pb-3 border-b border-slate-800/80">
              <h2 id="session-complete-title" className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>{subject || 'Study Session'}</span>
              </h2>
              {topic && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">{topic}</p>
              )}
            </div>
          )}

          {/* 3. Center Celestial Planet & Cosmic Dust Reward Display */}
          <div className="flex flex-col items-center text-center my-4">
            {/* Embedded 3D Procedural Planetary System with Comet Delivery */}
            <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden border-2 border-slate-700/80 shadow-2xl shadow-sky-500/20 bg-slate-950 mb-3 group">
              <PlanetarySystem
                level={reward.newLevel}
                streakDays={reward.streakDays}
                isDeliveringReward={true}
                type={milestone.category}
                seed={reward.newLevel * 37 + reward.totalDust}
                autoRotate={true}
                showStarfield={false}
                className="w-full h-full scale-110"
              />
              <div className="absolute inset-0 rounded-full pointer-events-none ring-1 ring-inset ring-white/10" />
            </div>

            {/* Entity Name & Tier */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-1">
              <span>{milestone.icon}</span>
              <span>{milestone.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {milestone.levelRange}
              </span>
            </div>

            {/* "+X Cosmic Dust" Animated Counter */}
            <motion.div 
              className="flex items-center gap-2 mt-1"
              animate={reward.leveledUp ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2.5 }}
            >
              <Sparkles className="w-6 h-6 text-sky-400 animate-pulse" />
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-sky-100 to-amber-200 drop-shadow-md">
                +{animatedDust.toLocaleString()}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400/90 self-end mb-2">
                Dust
              </span>
            </motion.div>

            {/* Reward breakdown chips */}
            <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-400">
              <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800">
                Base: {reward.baseDust}
              </span>
              {reward.bonusDust > 0 && (
                <span className="px-2 py-0.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-300 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Bonus: +{reward.bonusDust} ({reward.multiplier}x)
                </span>
              )}
            </div>
          </div>

          {/* 4. Level-Up Celebration Banner (Pop Animation) */}
          {reward.leveledUp && (
            <motion.div
              initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
              className="my-4 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-sky-500/20 to-purple-500/20 border border-amber-400/50 flex items-center justify-between shadow-lg shadow-amber-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-md shadow-amber-500/30">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-amber-300 uppercase tracking-widest animate-pulse">
                      LEVEL UP!
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      Lv. {reward.oldLevel} → Lv. {reward.newLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {reward.milestoneChanged 
                      ? `Evolution Achieved: ${milestone.name}!` 
                      : 'Celestial gravity strengthened.'}
                  </p>
                </div>
              </div>
              <span className="text-lg">🎉</span>
            </motion.div>
          )}

          {/* 5. Level Progress Bar Filling with Metallic/Cosmic Glow */}
          <div className="my-5 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                <span>Level {reward.newLevel}</span>
              </span>
              <span className="font-mono text-slate-400 text-[11px]">
                {newProgressPct}% to Lv. {Math.min(1000, reward.newLevel + 1)}
              </span>
            </div>

            {/* Glowing Progress Track */}
            <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <motion.div
                initial={{ width: `${reward.leveledUp ? 0 : oldProgressPct}%` }}
                animate={{ width: `${newProgressPct}%` }}
                transition={{ duration: 1.0, ease: 'easeOut', delay: 0.2 }}
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-400 to-amber-300 relative"
                style={{
                  boxShadow: '0 0 12px rgba(56, 189, 248, 0.6)'
                }}
              >
                {/* Shimmer line */}
                <div className="absolute inset-0 bg-white/25 animate-pulse" />
              </motion.div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>{milestone.badge}</span>
              <span>Universe Cap: Lv. 1000</span>
            </div>
          </div>

          {/* 6. Action Row: Share Story Card & Claim to Orbit */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
            <ShareCosmicCardButton
              durationMinutes={reward.durationMinutes}
              streakDays={reward.streakDays}
              earnedDust={reward.totalDust}
              level={reward.newLevel}
              subject={subject}
              topic={topic}
              className="w-full sm:w-auto flex-1 py-3.5"
            />

            <button
              onClick={handleClaim}
              className="w-full sm:w-auto flex-1 py-3.5 px-6 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500 text-slate-950 hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
              <span>Claim to Orbit</span>
              <ChevronRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
