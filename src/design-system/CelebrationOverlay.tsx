import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { soundFx } from '../lib/soundEffects';
import { VeerMascot } from './VeerMascot';
import { TactileButton } from './TactileButton';
import { Trophy, Zap, Flame, X } from 'lucide-react';

export interface CelebrationOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  xpEarned?: number;
  streakDays?: number;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  isOpen,
  onClose,
  title = 'Aaj ki Ride Complete! 🎉',
  subtitle = 'Teeno stops successfully finish kar liye. Consistent effort hi rank banata hai!',
  xpEarned = 35,
  streakDays = 7,
}) => {
  useEffect(() => {
    if (isOpen) {
      soundFx.playVictory();
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([30, 60, 30]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] p-6 shadow-2xl text-center"
        >
          {/* Skip / Close Button */}
          <button
            onClick={onClose}
            aria-label="Skip celebration"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[var(--sr-surface-2)] text-[var(--sr-text-muted)] hover:text-[var(--sr-text)] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Veer Cheering */}
          <div className="flex justify-center mb-3">
            <VeerMascot state="cheering" size="lg" showClickTip={false} />
          </div>

          <h2 className="text-xl font-black text-[var(--sr-text)] tracking-tight mb-1.5">
            {title}
          </h2>
          <p className="text-xs font-medium text-[var(--sr-text-muted)] mb-5 px-2">
            {subtitle}
          </p>

          {/* Reward Badges */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--sr-blue-subtle)] border border-[var(--sr-blue)]/30">
              <div className="flex items-center gap-1 text-[var(--sr-blue)] font-black text-lg">
                <Zap className="w-5 h-5 fill-current" />
                <span>+{xpEarned} XP</span>
              </div>
              <span className="text-[11px] font-bold text-[var(--sr-text-subtle)] mt-0.5">
                Pace Reward
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[var(--sr-amber-subtle)] border border-[var(--sr-amber)]/30">
              <div className="flex items-center gap-1 text-[var(--sr-amber)] font-black text-lg">
                <Flame className="w-5 h-5 fill-current" />
                <span>{streakDays} Days</span>
              </div>
              <span className="text-[11px] font-bold text-[var(--sr-text-subtle)] mt-0.5">
                Active Streak
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <TactileButton
            variant="primary"
            size="lg"
            fullWidth
            onClick={onClose}
          >
            Aage Badhein 🚀
          </TactileButton>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
