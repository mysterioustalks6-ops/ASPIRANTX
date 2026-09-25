import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Sparkles, CheckCircle2, ChevronRight, ExternalLink, X, 
  Lock, Smartphone, Play, Pause, RotateCcw, Check, Fingerprint, Info
} from 'lucide-react';

interface AccessibilityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
  featureName?: string;
}

export const AccessibilityGuideModal: React.FC<AccessibilityGuideModalProps> = ({
  isOpen,
  onClose,
  onPermissionGranted,
  featureName = 'Shorts & Reels Shield'
}) => {
  // Video simulation states
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0); // 0 to 100%
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const animRef = useRef<number | null>(null);

  // Auto-verify when user returns to app from settings or enables service
  useEffect(() => {
    if (!isOpen) return;

    const checkService = async () => {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
        try {
          const { Plugins } = (window as any).Capacitor;
          const FocusShield = Plugins?.FocusShield;
          if (FocusShield) {
            const res = await FocusShield.checkBlockerPermissions();
            if (res?.hasAccessibility) {
              onPermissionGranted();
              onClose();
            }
          }
        } catch (e) {
          console.error('Error verifying accessibility', e);
        }
      }
    };

    // Check immediately and on interval
    checkService();
    const interval = setInterval(checkService, 1500);

    const handleFocus = () => {
      checkService();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isOpen, onPermissionGranted, onClose]);

  // Video looping playback logic (7 seconds total cycle like Regain's Lottie/Video)
  useEffect(() => {
    if (!isOpen) return;

    let startTime = Date.now();
    const duration = 7500; // 7.5 seconds loop

    const loop = () => {
      if (!isPlaying) return;
      const elapsed = (Date.now() - startTime) % duration;
      const pct = (elapsed / duration) * 100;
      setProgress(pct);

      if (pct < 32) {
        setCurrentStep(1);
      } else if (pct < 65) {
        setCurrentStep(2);
      } else {
        setCurrentStep(3);
      }

      animRef.current = requestAnimationFrame(loop);
    };

    if (isPlaying) {
      animRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isOpen, isPlaying]);

  if (!isOpen) return null;

  const handleOpenSettings = async () => {
    setIsVerifying(true);
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
      try {
        const { Plugins } = (window as any).Capacitor;
        const FocusShield = Plugins?.FocusShield;
        if (FocusShield) {
          await FocusShield.openAccessibilitySettings();
        }
      } catch (e) {
        console.error('Failed to open accessibility settings', e);
      }
    }
  };

  const jumpToStep = (step: 1 | 2 | 3) => {
    setCurrentStep(step);
    if (step === 1) setProgress(5);
    if (step === 2) setProgress(38);
    if (step === 3) setProgress(72);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="max-w-md w-full rounded-3xl bg-[#090D16] border border-[#1E2520] p-5 space-y-4 shadow-2xl relative overflow-hidden my-auto">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Enable {featureName}
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-[11px] text-slate-400">Step-by-step Setup • Samsung / Android</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video Demo Player Container (Regain Style) */}
        <div className="rounded-2xl bg-[#060807] border border-[#1E2520] overflow-hidden relative shadow-inner">
          {/* Top Video Player Bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#0E1310] border-b border-[#1E2520] text-[11px]">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Instruction Video Demo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono">
                {Math.floor((progress / 100) * 7.5)}s / 7.5s
              </span>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                title={isPlaying ? 'Pause Demo' : 'Play Demo'}
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
              </button>
              <button
                onClick={() => {
                  setProgress(0);
                  setCurrentStep(1);
                  setIsPlaying(true);
                }}
                className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                title="Restart Video Demo"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Animated Video Progress Bar */}
          <div className="w-full h-1 bg-slate-800 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Video Mockup Screen Canvas */}
          <div className="p-3 relative min-h-[175px] flex flex-col justify-between">
            {/* STAGE 1: Settings Screen */}
            {currentStep === 1 && (
              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800/80">
                  <span className="font-semibold text-slate-300">⚙️ Samsung Settings</span>
                  <span className="text-amber-400 font-bold">Step 1: Find Accessibility</span>
                </div>
                
                <div className="space-y-1.5 text-xs">
                  <div className="py-1 px-2.5 rounded-lg bg-slate-900/60 text-slate-400 text-[11px] flex items-center justify-between opacity-50">
                    <span>Connections & Wi-Fi</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                  <div className="py-1 px-2.5 rounded-lg bg-slate-900/60 text-slate-400 text-[11px] flex items-center justify-between opacity-50">
                    <span>Display & Brightness</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                  {/* Highlighted Accessibility Target */}
                  <div className="relative py-2 px-2.5 rounded-xl bg-emerald-950/70 border-2 border-emerald-400 text-white font-semibold flex items-center justify-between shadow-lg shadow-emerald-500/20">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-emerald-500/30 text-emerald-300 flex items-center justify-center text-xs">
                        ♿
                      </span>
                      <span>Accessibility</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded-full animate-bounce">
                      TAP HERE
                    </span>
                    {/* Animated Hand/Finger Touch Ripple */}
                    <div className="absolute right-7 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-emerald-400/30 animate-ping pointer-events-none" />
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 2: Accessibility Menu */}
            {currentStep === 2 && (
              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800/80">
                  <span className="font-semibold text-slate-300">♿ Accessibility Menu</span>
                  <span className="text-amber-400 font-bold">Step 2: Installed Apps</span>
                </div>
                
                <div className="space-y-1.5 text-xs">
                  <div className="py-1 px-2.5 rounded-lg bg-slate-900/60 text-slate-400 text-[11px] flex items-center justify-between opacity-50">
                    <span>Vision enhancements</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                  {/* Highlighted Installed Apps Target */}
                  <div className="relative py-2 px-2.5 rounded-xl bg-amber-950/70 border-2 border-amber-400 text-white font-semibold flex items-center justify-between shadow-lg shadow-amber-500/20">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-amber-500/30 text-amber-300 flex items-center justify-center text-xs">
                        📱
                      </span>
                      <span>Installed apps</span>
                    </div>
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-2 py-0.5 rounded-full animate-bounce">
                      TAP HERE
                    </span>
                    {/* Animated Ripple */}
                    <div className="absolute right-7 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-400/30 animate-ping pointer-events-none" />
                  </div>
                  <div className="py-1 px-2.5 rounded-lg bg-slate-900/60 text-slate-400 text-[11px] flex items-center justify-between opacity-50">
                    <span>Advanced settings</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 3: Turn On Service & Allow */}
            {currentStep === 3 && (
              <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800/80">
                  <span className="font-semibold text-slate-300">🛡️ Installed Apps</span>
                  <span className="text-emerald-400 font-bold">Step 3: Turn ON & Allow</span>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="py-2 px-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/60 text-white flex items-center justify-between shadow">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-bold text-xs">StudyRide Focus Shield</div>
                        <div className="text-[9px] text-emerald-300">Active Protection</div>
                      </div>
                    </div>
                    {/* Animated switch turning ON */}
                    <div className="w-10 h-5 rounded-full bg-emerald-500 flex items-center justify-end px-0.5 transition-all">
                      <div className="w-4 h-4 rounded-full bg-white shadow-md animate-pulse" />
                    </div>
                  </div>

                  {/* Simulated "Allow" Dialog */}
                  <div className="py-1.5 px-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-between text-[10px]">
                    <span className="text-slate-300">Allow full control?</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-bold shadow animate-pulse">
                      ✓ Allow
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Video Subtitle / Instruction Banner */}
            <div className="mt-2 py-1.5 px-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-[11px] text-slate-300">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px] shrink-0">
                {currentStep}
              </span>
              <p className="truncate">
                {currentStep === 1 && 'Open Settings ➔ Scroll down and tap Accessibility'}
                {currentStep === 2 && 'In Accessibility ➔ Tap on Installed apps'}
                {currentStep === 3 && 'Tap StudyRide Focus Shield ➔ Turn switch ON ➔ Tap Allow'}
              </p>
            </div>
          </div>

          {/* Interactive Scrub Step Selector (Like YouTube/Reels Chapters) */}
          <div className="grid grid-cols-3 gap-1 p-1.5 bg-[#0A0D0B] border-t border-[#1E2520]">
            <button
              onClick={() => jumpToStep(1)}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${
                currentStep === 1 
                  ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-400' 
                  : 'bg-slate-900/40 text-slate-400 hover:text-white'
              }`}
            >
              1. Accessibility
            </button>
            <button
              onClick={() => jumpToStep(2)}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${
                currentStep === 2 
                  ? 'bg-amber-500/20 border border-amber-500/60 text-amber-400' 
                  : 'bg-slate-900/40 text-slate-400 hover:text-white'
              }`}
            >
              2. Installed Apps
            </button>
            <button
              onClick={() => jumpToStep(3)}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer ${
                currentStep === 3 
                  ? 'bg-teal-500/20 border border-teal-500/60 text-teal-300' 
                  : 'bg-slate-900/40 text-slate-400 hover:text-white'
              }`}
            >
              3. Turn ON
            </button>
          </div>
        </div>

        {/* Privacy First Prominent In-App Disclosure (Google Play Compliant) */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1 relative z-10">
          <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Private & Device Local</span>
          </div>
          <p className="leading-relaxed text-[10.5px]">
            StudyRide uses this permission <strong>only to detect Shorts & Reels</strong> so you can watch full lectures uninterrupted. We <strong>never</strong> record, transmit, or read personal texts or passwords.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 relative z-10">
          <button
            onClick={handleOpenSettings}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Open Android Settings</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-center text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};
