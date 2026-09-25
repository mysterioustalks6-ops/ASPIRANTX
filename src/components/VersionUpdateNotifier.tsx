import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Download, RotateCcw, X, ArrowUpCircle, CheckCircle2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { CANONICAL_APP_RELEASE } from '../config/appRelease';

interface VersionResponse {
  version: string;
  versionCode?: number;
  apkDownloadUrl?: string;
  directApkUrl?: string;
  releaseDate?: string;
  releaseNotes?: string;
}

function compareSemver(v1: string, v2: string): number {
  const parts1 = v1.replace(/^v/i, '').split('.').map(p => parseInt(p, 10) || 0);
  const parts2 = v2.replace(/^v/i, '').split('.').map(p => parseInt(p, 10) || 0);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

export const VersionUpdateNotifier: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [remoteInfo, setRemoteInfo] = useState<VersionResponse | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>(CANONICAL_APP_RELEASE.version);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  const isNative = Capacitor.isNativePlatform();

  const checkForUpdate = useCallback(async (manual = false) => {
    try {
      let localVer = CANONICAL_APP_RELEASE.version;
      let localCode = CANONICAL_APP_RELEASE.versionCode;

      if (isNative) {
        try {
          const appInfo = await CapApp.getInfo();
          if (appInfo) {
            localVer = appInfo.version || localVer;
            const parsedCode = parseInt(appInfo.build, 10);
            if (!isNaN(parsedCode)) localCode = parsedCode;
          }
        } catch {
          // fallback to canonical
        }
      }
      setCurrentVersion(localVer);

      // Fetch latest version from authoritative production API
      const timestamp = Date.now();
      const apiUrl = isNative 
        ? `https://aspirantx.vercel.app/api/version?t=${timestamp}` 
        : `/api/version?t=${timestamp}`;

      const res = await fetch(apiUrl, { cache: 'no-store' }).catch(() => null);
      if (!res || !res.ok) return;

      const data: VersionResponse = await res.json().catch(() => null);
      if (!data || !data.version) return;

      const remoteCode = data.versionCode || 0;
      const isNewerCode = remoteCode > localCode;
      const isNewerSemver = compareSemver(data.version, localVer) > 0;

      if (isNewerCode || isNewerSemver) {
        setRemoteInfo(data);
        const dismissedVer = localStorage.getItem('studyride_dismissed_version');
        const dismissedAt = parseInt(localStorage.getItem('studyride_dismissed_time') || '0', 10);
        const hoursSinceDismiss = (Date.now() - dismissedAt) / (1000 * 60 * 60);

        if (manual || dismissedVer !== data.version || hoursSinceDismiss >= 3) {
          setUpdateAvailable(true);
          setIsDismissed(false);
        }
      }
    } catch {
      // Silent error handler
    }
  }, [isNative]);

  useEffect(() => {
    checkForUpdate(false);
    // Poll for new updates every 3 minutes
    const interval = setInterval(() => checkForUpdate(false), 180000);

    const handleFocus = () => checkForUpdate(false);
    window.addEventListener('focus', handleFocus);

    // Allow other components to trigger update check via custom event
    const handleManualTrigger = () => checkForUpdate(true);
    window.addEventListener('studyride:check-update', handleManualTrigger);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('studyride:check-update', handleManualTrigger);
    };
  }, [checkForUpdate]);

  const handleUpdateClick = async () => {
    if (isNative) {
      setIsDownloading(true);
      const apkUrl = remoteInfo?.directApkUrl || 'https://aspirantx.vercel.app/studyride.apk';
      try {
        await Browser.open({ url: apkUrl });
      } catch {
        window.open(apkUrl, '_system');
      }
      setTimeout(() => setIsDownloading(false), 5000);
    } else {
      // On Web/PWA, hard reload to fetch fresh cache and service worker
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    if (remoteInfo?.version) {
      localStorage.setItem('studyride_dismissed_version', remoteInfo.version);
      localStorage.setItem('studyride_dismissed_time', Date.now().toString());
    }
    setIsDismissed(true);
    setUpdateAvailable(false);
  };

  if (!updateAvailable || isDismissed || !remoteInfo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -60, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[94%] max-w-lg p-4 rounded-3xl bg-slate-950/95 border border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.35)] backdrop-blur-2xl text-slate-100"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              <ArrowUpCircle className="w-5 h-5 animate-bounce" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-black text-white tracking-tight">
                  New Update Available!
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  v{remoteInfo.version}
                </span>
                <span className="text-[10px] text-slate-400">
                  (Current: v{currentVersion})
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {remoteInfo.releaseNotes || 'New official glowing emblem logo, Focus Shield Pro, and speed optimizations are live.'}
              </p>

              {isNative && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium mt-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Direct APK download • Tap Install when finished</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
            title="Dismiss for now"
            aria-label="Close update alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-3.5 pt-3 border-t border-slate-800/80">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Remind Later
          </button>

          <button
            onClick={handleUpdateClick}
            disabled={isDownloading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            {isNative ? (
              <>
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>{isDownloading ? 'Downloading APK...' : 'Update App (.APK)'}</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>Update Now</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
