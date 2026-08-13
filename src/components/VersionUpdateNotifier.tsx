import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RotateCcw, ArrowRight } from 'lucide-react';

export const VersionUpdateNotifier: React.FC = () => {
  const [initialVersion, setInitialVersion] = useState<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);

  useEffect(() => {
    let unmounted = false;

    const checkVersion = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' }).catch(() => null);
        if (!res || !res.ok) return;
        const data = await res.json().catch(() => ({}));
        
        if (data && data.version) {
          if (!initialVersion) {
            setInitialVersion(data.version);
          } else if (data.version !== initialVersion && !unmounted) {
            setUpdateAvailable(true);
          }
        }
      } catch (e) {
        // Silent catch for network hiccups
      }
    };

    checkVersion();
    const interval = setInterval(checkVersion, 120000); // Check for updates every 2 minutes

    const onFocus = () => checkVersion();
    window.addEventListener('focus', onFocus);

    return () => {
      unmounted = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [initialVersion]);

  if (!updateAvailable) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg p-3 rounded-2xl bg-slate-900/95 border border-[#00FF94]/50 shadow-[0_0_30px_rgba(0,255,148,0.3)] backdrop-blur-xl flex items-center justify-between gap-3 text-slate-100"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-[#00FF94]/10 text-[#00FF94] border border-[#00FF94]/30 shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-white tracking-tight flex items-center gap-1.5">
              <span>New AspirantX Update Live!</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#00FF94]/20 text-[#00FF94] border border-[#00FF94]/40">v1.0.0+</span>
            </h4>
            <p className="text-[11px] text-slate-300 font-medium truncate">
              Click to load the latest features & datasets.
            </p>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-[#00FF94] hover:bg-[#00FF94]/90 text-slate-950 font-black text-xs transition-all shadow-md shadow-[#00FF94]/20 shrink-0 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Update Now</span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
