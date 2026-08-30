import React from 'react';
import { motion } from 'motion/react';
import { AppCustomizerSettings } from '../lib/customizer';

interface BackgroundFXProps {
  customizer: AppCustomizerSettings;
}

export const BackgroundFX: React.FC<BackgroundFXProps> = ({ customizer }) => {
  const { backgroundAnimation, showBackgroundParticles, themePalette } = customizer;

  if (backgroundAnimation === 'MINIMAL_CLEAN') {
    return <div className="fixed inset-0 bg-[#050508] pointer-events-none -z-10" />;
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#050508]">
      {/* 1. AURORA WAVE STYLE */}
      {backgroundAnimation === 'AURORA_WAVE' && (
        <>
          <motion.div
            animate={{
              x: [0, 40, -30, 0],
              y: [0, -50, 30, 0],
              scale: [1, 1.15, 0.95, 1],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px]"
          />
          <motion.div
            animate={{
              x: [0, -40, 50, 0],
              y: [0, 40, -30, 0],
              scale: [1, 0.9, 1.1, 1],
            }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/3 -right-20 w-[450px] h-[450px] bg-cyan-500/15 rounded-full blur-[150px]"
          />
          <motion.div
            animate={{
              x: [0, 30, -40, 0],
              y: [0, -30, 40, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[160px]"
          />
        </>
      )}

      {/* 2. NEON CYBER STYLE */}
      {backgroundAnimation === 'NEON_CYBER' && (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a15_1px,transparent_1px),linear-gradient(to_bottom,#0f172a15_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          <motion.div
            animate={{
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.08, 1],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-cyan-500/15 rounded-full blur-[130px]"
          />
          <motion.div
            animate={{
              opacity: [0.15, 0.35, 0.15],
            }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-0 right-10 w-[500px] h-[400px] bg-emerald-500/15 rounded-full blur-[140px]"
          />
        </>
      )}

      {/* 3. ACADEMIC SLATE / STARFIELD STYLE */}
      {backgroundAnimation === 'ACADEMIC_SLATE' && (
        <>
          <div className="absolute inset-0 bg-slate-950" />
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-slate-800/20 rounded-full blur-[120px]" />
        </>
      )}

      {/* 4. GOLDEN EMERALD STYLE */}
      {backgroundAnimation === 'GOLDEN_EMERALD' && (
        <>
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-20 left-10 w-[500px] h-[500px] bg-amber-500/15 rounded-full blur-[150px]"
          />
          <motion.div
            animate={{
              scale: [1, 0.9, 1],
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-10 right-10 w-[550px] h-[550px] bg-emerald-500/15 rounded-full blur-[160px]"
          />
        </>
      )}

      {/* FLOATING PARTICLES (IF ENABLED) */}
      {showBackgroundParticles && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-cyan-400/40 rounded-full"
              style={{
                left: `${(i * 8.5 + 5) % 95}%`,
                top: `${(i * 12 + 10) % 90}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                x: [-15, 15, -15],
                opacity: [0.2, 0.8, 0.2],
                scale: [0.8, 1.3, 0.8],
              }}
              transition={{
                duration: 6 + (i % 5) * 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.4,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
