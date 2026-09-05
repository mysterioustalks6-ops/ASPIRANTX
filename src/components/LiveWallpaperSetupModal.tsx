import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  Bell, 
  BatteryCharging, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  X, 
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  WallpaperStatusResult, 
  DeviceCapabilitiesResult,
  fetchWallpaperStatus,
  fetchDeviceCapabilities,
  requestSetLiveWallpaper,
  requestBatteryExemption,
  openOemSettings,
  markWallpaperSetupDismissed,
  addWallpaperResumeListener,
  isAndroidPlatform
} from '../lib/nativeWallpaperBridge';
import { UserProfile } from '../types';
import { WallpaperPersona } from '../lib/wallpaperPersonas';

interface LiveWallpaperSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  selectedExam?: string;
  persona?: WallpaperPersona;
}

export const LiveWallpaperSetupModal: React.FC<LiveWallpaperSetupModalProps> = ({
  isOpen,
  onClose,
  user,
  selectedExam,
  persona
}) => {
  const [wallpaperStatus, setWallpaperStatus] = useState<WallpaperStatusResult | null>(null);
  const [capabilities, setCapabilities] = useState<DeviceCapabilitiesResult | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [isApplyingWallpaper, setIsApplyingWallpaper] = useState<boolean>(false);
  const [showOemDetails, setShowOemDetails] = useState<boolean>(false);
  const [batteryMessage, setBatteryMessage] = useState<string | null>(null);

  const loadCurrentStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const [wpStatus, devCaps] = await Promise.all([
        fetchWallpaperStatus(),
        fetchDeviceCapabilities()
      ]);
      setWallpaperStatus(wpStatus);
      setCapabilities(devCaps);
    } catch (err) {
      console.warn('[SetupModal] Failed to load status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCurrentStatus();
      // Listen for app resume when user returns from Android system picker or settings
      const unsubscribe = addWallpaperResumeListener(() => {
        loadCurrentStatus();
      });
      return () => {
        unsubscribe();
      };
    }
  }, [isOpen, loadCurrentStatus]);

  if (!isOpen) return null;

  const isSupported = wallpaperStatus?.isSupported ?? isAndroidPlatform();
  const isActive = wallpaperStatus?.isActive ?? false;
  const oemBrand = capabilities?.oem?.toLowerCase() || wallpaperStatus?.oem?.toLowerCase() || 'android';

  const handleApplyWallpaper = async () => {
    setIsApplyingWallpaper(true);
    try {
      await requestSetLiveWallpaper(user.id, selectedExam, persona, user.name);
      // Wait slightly and refresh
      setTimeout(() => {
        loadCurrentStatus();
      }, 1200);
    } catch (err) {
      console.error('[SetupModal] Error applying wallpaper:', err);
    } finally {
      setIsApplyingWallpaper(false);
    }
  };

  const handleRequestBattery = async () => {
    try {
      const res = await requestBatteryExemption();
      if (res.alreadyExempt) {
        setBatteryMessage('Already exempt from battery restrictions.');
      } else if (res.success) {
        setBatteryMessage('Battery optimization exemption requested.');
      } else {
        setBatteryMessage('Could not request exemption automatically. Please check device settings.');
      }
      setTimeout(() => loadCurrentStatus(), 1500);
    } catch (err) {
      setBatteryMessage('Battery exemption action unavailable.');
    }
  };

  const handleOpenOemSettings = async () => {
    try {
      await openOemSettings();
    } catch (err) {
      console.warn('[SetupModal] Could not open OEM settings:', err);
    }
  };

  const handleDismiss = () => {
    markWallpaperSetupDismissed(72);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Ambient header glow */}
          <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-indigo-600/20 via-cyan-500/10 to-transparent pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-10 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8 space-y-6 relative z-10">
            {/* Title & Icon */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 p-0.5 flex-shrink-0 shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <div className="space-y-1 pr-6">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Native Android Live Service</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold">Universal Flow</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Make AspirantX Your Live Wallpaper
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Display your live exam countdown, daily study matrix, and habit streak directly on your Android Home &amp; Lock Screen.
                </p>
              </div>
            </div>

            {/* Authoritative Status Card */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Device Compatibility:</span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSupported ? 'Live Wallpaper Supported' : 'Not Supported'}</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                <span className="text-slate-400 font-medium">Active Status:</span>
                {isLoadingStatus ? (
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                    <span>Detecting OS state...</span>
                  </span>
                ) : isActive ? (
                  <span className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Active on Device</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 font-bold text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Not Currently Active</span>
                  </span>
                )}
              </div>
              {capabilities?.manufacturer && (
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800/60 text-slate-400">
                  <span>Detected Hardware:</span>
                  <span className="font-semibold text-slate-300">
                    {capabilities.manufacturer} {capabilities.model || ''} (Android {capabilities.androidVersion || '12+'})
                  </span>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <div>
              {isActive ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div className="text-xs text-emerald-200">
                      <p className="font-bold">AspirantX is your active Live Wallpaper!</p>
                      <p className="text-[11px] text-emerald-300/80 mt-0.5">
                        Your home screen wallpaper updates automatically when you complete habits or switch personas.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleApplyWallpaper}
                    disabled={isApplyingWallpaper}
                    className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>{isApplyingWallpaper ? 'Opening Android Preview...' : 'Reconfigure / Set on Lock Screen'}</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleApplyWallpaper}
                  disabled={isApplyingWallpaper || !isSupported}
                  id="btn-modal-set-live-wallpaper"
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  {isApplyingWallpaper ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Opening Official Android Preview...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-cyan-200 fill-cyan-200" />
                      <span>Set Live Wallpaper</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Optional Device Capabilities Section */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Optional Device Settings</span>
                <span className="text-[10px] text-slate-500 lowercase font-normal">(not required for wallpaper)</span>
              </div>

              {/* Study Notifications (Android 13+) */}
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">Study Notifications</div>
                    <div className="text-[10px] text-slate-400">Daily countdown reminders &amp; revision alerts</div>
                  </div>
                </div>
                <div>
                  {capabilities?.notificationsGranted ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Enabled
                    </span>
                  ) : (
                    <button
                      onClick={handleOpenOemSettings}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition-all cursor-pointer"
                    >
                      Enable
                    </button>
                  )}
                </div>
              </div>

              {/* Battery Optimization / Background Sync */}
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <BatteryCharging className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">Background Sync</div>
                    <div className="text-[10px] text-slate-400">Keeps widget &amp; alarms active on aggressive task killers</div>
                  </div>
                </div>
                <div>
                  {capabilities?.isIgnoringBatteryOptimizations ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Optimized
                    </span>
                  ) : (
                    <button
                      onClick={handleRequestBattery}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-[10px] font-bold border border-indigo-500/40 transition-all cursor-pointer"
                    >
                      Allow
                    </button>
                  )}
                </div>
              </div>
              {batteryMessage && (
                <p className="text-[10px] text-amber-300/90 pl-1">{batteryMessage}</p>
              )}

              {/* OEM-Specific Launcher Guide Toggle */}
              <div className="pt-1">
                <button
                  onClick={() => setShowOemDetails(!showOemDetails)}
                  className="w-full flex items-center justify-between py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <span>Device Specific Tips ({capabilities?.manufacturer || 'OEM'})</span>
                  </span>
                  {showOemDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                {showOemDetails && (
                  <div className="mt-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-300 space-y-2">
                    {oemBrand.includes('vivo') ? (
                      <p>
                        <strong>Vivo (Funtouch OS / OriginOS):</strong> If the live wallpaper picker does not show directly, long press your home screen &rarr; select <em>Wallpapers</em> &rarr; <em>Live Wallpapers</em> &rarr; choose <em>AspirantX</em>.
                      </p>
                    ) : oemBrand.includes('xiaomi') || oemBrand.includes('redmi') || oemBrand.includes('poco') ? (
                      <p>
                        <strong>Xiaomi (MIUI / HyperOS):</strong> Long press home screen &rarr; tap Wallpaper &rarr; Live Wallpapers &rarr; select AspirantX. Enable Autostart in Security app if you wish notifications to fire reliably.
                      </p>
                    ) : oemBrand.includes('samsung') ? (
                      <p>
                        <strong>Samsung (One UI):</strong> Long press home screen &rarr; <em>Wallpaper and style</em> &rarr; <em>Change wallpapers</em> &rarr; <em>Live Wallpapers</em> &rarr; choose <em>AspirantX</em>.
                      </p>
                    ) : oemBrand.includes('oppo') || oemBrand.includes('realme') || oemBrand.includes('oneplus') ? (
                      <p>
                        <strong>Oppo / Realme / OnePlus (ColorOS / OxygenOS):</strong> Long press home screen &rarr; Wallpapers &rarr; Live &rarr; select AspirantX.
                      </p>
                    ) : (
                      <p>
                        <strong>Stock Android / Pixel / Motorola:</strong> Long press home screen &rarr; Wallpaper &amp; style &rarr; Live Wallpapers &rarr; select AspirantX.
                      </p>
                    )}
                    <button
                      onClick={handleOpenOemSettings}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      <span>Open Device Settings</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Footer Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleDismiss}
                className="text-xs text-slate-400 hover:text-slate-200 font-semibold transition-all cursor-pointer py-1 px-2"
              >
                Maybe Later
              </button>
              <button
                onClick={onClose}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
