import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, ArrowRight, X } from 'lucide-react';
import { TrophyUnlock } from '../lib/rewards/rewardEngine';
import { usePrefersReducedMotion, triggerConfetti } from '../lib/animations';

interface AchievementUnlockModalProps {
  queue: TrophyUnlock[];
  onDismiss: (unlockedId: string) => void;
  onViewCollection?: () => void;
}

export const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
  queue,
  onDismiss,
  onViewCollection
}) => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const current = queue[0];

  useEffect(() => {
    if (current && !prefersReducedMotion) {
      triggerConfetti();
    }
  }, [current?.id, prefersReducedMotion]);

  if (!current) return null;

  const rarityColors = {
    LEGENDARY: {
      border: 'border-purple-500/50',
      glow: 'shadow-[0_0_50px_rgba(168,85,247,0.4)]',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      title: 'from-purple-400 via-pink-300 to-indigo-300'
    },
    EPIC: {
      border: 'border-amber-500/50',
      glow: 'shadow-[0_0_50px_rgba(245,158,11,0.35)]',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      title: 'from-amber-300 via-yellow-200 to-orange-300'
    },
    RARE: {
      border: 'border-cyan-500/50',
      glow: 'shadow-[0_0_40px_rgba(6,182,212,0.3)]',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      title: 'from-cyan-300 via-sky-200 to-teal-300'
    },
    COMMON: {
      border: 'border-slate-600/50',
      glow: 'shadow-[0_0_30px_rgba(148,163,184,0.2)]',
      badge: 'bg-slate-700/50 text-slate-300 border-slate-600',
      title: 'from-slate-200 via-slate-100 to-slate-300'
    }
  };

  const currentRarity = rarityColors[current.rarity as keyof typeof rarityColors] || rarityColors.COMMON;

  return (
    <AnimatePresence>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievement-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
      >
        <motion.div
          key={current.id}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 20 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-md p-6 bg-slate-900/95 border ${currentRarity.border} rounded-3xl ${currentRarity.glow} text-center overflow-hidden`}
        >
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close corner button */}
          <button
            onClick={() => onDismiss(current.id)}
            aria-label="Close achievement notification"
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Sparkle Header */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Achievement Unlocked</span>
          </div>

          {/* Icon & Aura */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-950 border border-slate-700/80 flex items-center justify-center text-5xl shadow-inner">
              <span>{current.icon || '🏆'}</span>
            </div>
          </div>

          {/* Name & Category */}
          <div className="space-y-1.5 mb-3">
            <div className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase border mb-1.5">
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${currentRarity.badge}`}>
                {current.rarity} • {current.category}
              </span>
            </div>
            <h3 
              id="achievement-modal-title"
              className={`text-2xl font-black bg-gradient-to-r ${currentRarity.title} bg-clip-text text-transparent`}
            >
              {current.name}
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed max-w-xs mx-auto">
              {current.description}
            </p>
          </div>

          {/* XP Reward Badge */}
          <div className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-sm mb-6">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>+{current.xpReward} XP Earned</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {onViewCollection && (
              <button
                onClick={() => {
                  onDismiss(current.id);
                  onViewCollection();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-all border border-slate-700/60"
              >
                View Collection
              </button>
            )}
            <button
              onClick={() => onDismiss(current.id)}
              className="flex-1 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-bold shadow-lg shadow-sky-500/25 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {queue.length > 1 && (
            <p className="text-[11px] text-slate-400 mt-3 font-medium">
              +{queue.length - 1} more unlocked in this session
            </p>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
