import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Download, Globe, X, Share, PlusSquare, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export const AppDownloadModal: React.FC = () => {
  const {
    showPrompt,
    isIOS,
    showIOSInstructions,
    handleInstall,
    handleDismiss,
    closeIOSInstructions,
  } = useInstallPrompt();

  return (
    <AnimatePresence>
      {/* 1. Main Install App Banner / Dialog */}
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-slate-900/95 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden backdrop-blur-2xl"
          >
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close / Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-[1px] shadow-[0_0_20px_rgba(99,102,241,0.4)] shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center text-indigo-400">
                  <Smartphone className="w-6 h-6" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ASPIRANTX APP</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-100">
                  Install AspirantX as an app?
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-5">
              Install AspirantX on your device for instant 0ms zero-lag response, full offline study data, and live exam countdown widgets.
            </p>

            {/* Key Perks */}
            <div className="grid grid-cols-2 gap-2 mb-5 text-[11px] text-slate-300 font-semibold">
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>0ms Instant Launch</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>100% Offline Mode</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Install Button */}
              <button
                onClick={handleInstall}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Install</span>
              </button>

              {/* Continue on Web Button */}
              <button
                onClick={handleDismiss}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <Globe className="w-4 h-4 text-slate-400" />
                <span>Continue on Web</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 2. iOS Safari Step-by-Step Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="relative w-full max-w-md bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl text-slate-100"
          >
            <button
              onClick={closeIOSInstructions}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base">Install on iOS / Safari</h3>
                <p className="text-xs text-slate-400">Follow these 2 simple steps:</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 mb-6">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block mb-0.5">1. Tap the Share icon</span>
                  <span>Tap the Share button (square with arrow pointing up) in Safari's bottom toolbar.</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white block mb-0.5">2. Tap "Add to Home Screen"</span>
                  <span>Scroll down and select <strong>"Add to Home Screen"</strong> to install AspirantX on your iPhone.</span>
                </div>
              </div>
            </div>

            <button
              onClick={closeIOSInstructions}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all"
            >
              Got It!
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
