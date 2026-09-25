import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface AppSplashScreenProps {
  onFinish?: () => void;
  minDuration?: number; // Milliseconds to display
  isReady?: boolean; // Condition to wait for before auto-dismissing
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({
  onFinish,
  minDuration = 1600,
  isReady = true,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(25);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  // Progressive loading simulation
  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) {
          return 92;
        }
        return prev + Math.floor(Math.random() * 12 + 8);
      });
    }, 150);

    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, minDuration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(minTimer);
    };
  }, [minDuration]);

  // When both minDuration has elapsed and backend/auth is ready, exit cleanly
  useEffect(() => {
    if (minTimeElapsed && isReady && isVisible) {
      setProgress(100);
      const exitTimer = setTimeout(() => {
        setIsVisible(false);
        if (onFinish) {
          setTimeout(onFinish, 420); // Allow exit opacity/scale animation to finish
        }
      }, 260);
      return () => clearTimeout(exitTimer);
    }
  }, [minTimeElapsed, isReady, isVisible, onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="app-splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => {
            setIsVisible(false);
            if (onFinish) onFinish();
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#030712] overflow-hidden select-none cursor-pointer"
        >
          {/* Radial Ambient Glow 1: Cyan Emerald Cyber Aura */}
          <motion.div
            animate={{
              scale: [1, 1.25, 1],
              opacity: [0.35, 0.55, 0.35],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-500/20 via-cyan-500/25 to-transparent blur-[120px] pointer-events-none"
          />

          {/* Radial Ambient Glow 2: Deep Turquoise Center Spot */}
          <div className="absolute w-[280px] h-[280px] rounded-full bg-emerald-400/15 blur-[80px] pointer-events-none" />

          {/* Main Logo Container with 3D Holographic Entrance */}
          <div className="relative flex flex-col items-center z-10">
            {/* Animated Speed Dashes (Matching Logo's Two Side Streaks) */}
            <motion.div
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: [0, 1, 0.8] }}
              transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -left-12 top-10 flex flex-col gap-2.5 pointer-events-none"
            >
              <div className="w-8 h-2.5 rounded-full bg-gradient-to-r from-transparent to-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
              <div className="w-5 h-2.5 rounded-full bg-gradient-to-r from-transparent to-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.8)] ml-2" />
            </motion.div>

            {/* Glowing Logo Frame */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                duration: 0.85,
              }}
              className="relative group"
            >
              {/* Pulsing Outer Glow Ring */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(16, 185, 129, 0.3), 0 0 60px rgba(6, 182, 212, 0.2)',
                    '0 0 50px rgba(16, 185, 129, 0.6), 0 0 90px rgba(6, 182, 212, 0.35)',
                    '0 0 30px rgba(16, 185, 129, 0.3), 0 0 60px rgba(6, 182, 212, 0.2)',
                  ],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-[2px] bg-gradient-to-tr from-emerald-500 via-cyan-400 to-teal-300 shadow-2xl relative"
              >
                {/* Inner Logo Image with Floating Micro-Movement */}
                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="w-full h-full rounded-[22px] overflow-hidden bg-[#060D17] relative flex items-center justify-center"
                >
                  <img
                    src="/logo.png"
                    alt="StudyRide Official Logo"
                    className="w-full h-full object-cover select-none"
                    draggable={false}
                  />

                  {/* Light Sweep Reflection Across Logo */}
                  <motion.div
                    initial={{ x: '-150%' }}
                    animate={{ x: '180%' }}
                    transition={{
                      repeat: Infinity,
                      repeatDelay: 2.5,
                      duration: 1.2,
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-25deg] pointer-events-none"
                  />
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Brand Title with Text Shimmer Entrance */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 text-center space-y-1.5"
            >
              <div className="flex items-center justify-center gap-1.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-[0.2em] uppercase font-sans">
                  STUDY<span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.7)]">RIDE</span>
                </h1>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PRO
                </span>
              </div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-xs sm:text-sm text-slate-400 font-medium tracking-wide flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Precision Exam Prep & Focus Shield</span>
              </motion.p>
            </motion.div>

            {/* Glowing Minimalist Loading Progress Indicator */}
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '160px' }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-8 h-1 rounded-full bg-slate-800/80 overflow-hidden relative shadow-inner"
            >
              <motion.div
                style={{ width: `${Math.min(progress, 100)}%` }}
                className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-300 shadow-[0_0_12px_rgba(16,185,129,0.8)] rounded-full transition-all duration-200"
              />
            </motion.div>

            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="text-[10px] text-slate-500 font-mono mt-2"
            >
              Tap to skip • v2.5.3
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
