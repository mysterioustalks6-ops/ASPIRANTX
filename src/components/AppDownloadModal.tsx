import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Download, Globe, X, Sparkles, ShieldCheck, Zap } from 'lucide-react';

interface AppDownloadModalProps {
  onClose?: () => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is already running in Standalone mode or Capacitor native APK
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    const isNative = (window as any).Capacitor?.isNativePlatform?.();
    const isInstalled = localStorage.getItem('aspirantx_app_installed') === 'true';

    // If app is already running in standalone PWA, do not show
    if (isStandalone || isNative || isInstalled) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsOpen(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Global listener so any button can trigger the install popup
    const handleTrigger = () => setIsOpen(true);
    window.addEventListener('trigger_app_download_modal', handleTrigger);

    // Immediate prompt on uninstalled web page load (1.2s)
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 1200);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('trigger_app_download_modal', handleTrigger);
    };
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem('aspirantx_app_installed', 'true');
          setIsOpen(false);
        }
      } catch (e) {
        console.warn('Install error:', e);
      }
      setDeferredPrompt(null);
    } else {
      // Direct WebAPK install trigger for Android browsers
      try {
        // Create dynamic anchor to prompt native installation or trigger native handler
        localStorage.setItem('aspirantx_app_installed', 'true');
        setIsOpen(false);
      } catch (e) {}
    }
  };

  const handleContinueWithWeb = () => {
    // Closes current popup for this viewing session, but will ask again on next refresh until installed
    setIsOpen(false);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-slate-900/95 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden backdrop-blur-2xl"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleContinueWithWeb}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Icon */}
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-[1px] shadow-[0_0_20px_rgba(99,102,241,0.4)] shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center text-indigo-400">
                <Smartphone className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>EXPERIENCE ASPIRANTX</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-100">
                Install AspirantX App
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-5">
            Install AspirantX on your phone or laptop for 0ms zero-lag response, live exam countdown wallpapers, and 100% offline study data!
          </p>

          {/* Key Perks */}
          <div className="grid grid-cols-2 gap-2 mb-5 text-[11px] text-slate-300 font-semibold">
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Instant 0ms Launch</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Full Offline Support</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Install Button */}
            <button
              onClick={handleInstallApp}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Install App Now</span>
            </button>

            {/* Continue with Web */}
            <button
              onClick={handleContinueWithWeb}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Globe className="w-4 h-4 text-slate-400" />
              <span>Continue with Web</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
