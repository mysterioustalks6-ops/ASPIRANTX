import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, Activity } from 'lucide-react';

const PING_INTERVAL_GOOD_MS = 30000;      // 30s when connection is good
const PING_INTERVAL_DEGRADED_MS = 8000;   // 8s when connection is slow/lagging
const PING_TIMEOUT_MS = 5000;             // 5s timeout
const MAX_PING_HISTORY = 5;

type QualityStatus = 'good' | 'slow' | 'lagging' | 'offline' | 'checking';

export const NetworkStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showRestoredBanner, setShowRestoredBanner] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const [pingHistory, setPingHistory] = useState<number[]>([]);
  const [currentLatency, setCurrentLatency] = useState<number | null>(null);
  const [lastPingError, setLastPingError] = useState<boolean>(false);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // Perform a single latency measurement ping
  const performPing = useCallback(async () => {
    if (!navigator.onLine) {
      setIsOnline(false);
      return;
    }

    setIsPinging(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/ping?t=' + Date.now(), {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const endTime = Date.now();

      if (response.ok) {
        const rtt = Math.max(1, endTime - startTime);
        setLastPingError(false);
        setCurrentLatency(rtt);
        setIsOnline(true);
        setPingHistory((prev) => {
          const updated = [...prev, rtt];
          return updated.slice(-MAX_PING_HISTORY);
        });
      } else {
        setLastPingError(true);
      }
    } catch {
      clearTimeout(timeoutId);
      setLastPingError(true);
    } finally {
      setIsPinging(false);
    }
  }, []);

  const handleManualRetry = async () => {
    setIsRetrying(true);
    setIsOnline(navigator.onLine);
    await performPing();
    setIsRetrying(false);
  };

  // Rolling average latency calculation
  const averageLatency = useMemo(() => {
    if (pingHistory.length === 0) return currentLatency;
    const sum = pingHistory.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / pingHistory.length);
  }, [pingHistory, currentLatency]);

  // Determine overall quality status based on exact boundaries
  // Note: 'checking' is used on initial load before first ping resolves (averageLatency === null && !lastPingError)
  const qualityStatus: QualityStatus = useMemo(() => {
    if (!isOnline) return 'offline';
    if (averageLatency === null && !lastPingError) return 'checking';
    if (lastPingError || (averageLatency !== null && averageLatency > 800)) return 'lagging';
    if (averageLatency !== null && averageLatency >= 300 && averageLatency <= 800) return 'slow';
    return 'good';
  }, [isOnline, lastPingError, averageLatency]);

  // Detect status transition from a real degraded state ('slow', 'lagging', 'offline') to 'good'
  // to trigger brief 3.5s "Connection restored" confirmation banner. (Ignores initial 'checking' -> 'good')
  const prevStatusRef = useRef<QualityStatus>(qualityStatus);
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    if (
      (prevStatus === 'slow' || prevStatus === 'lagging' || prevStatus === 'offline') &&
      qualityStatus === 'good'
    ) {
      setShowRestoredBanner(true);
      const timer = setTimeout(() => {
        setShowRestoredBanner(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = qualityStatus;
  }, [qualityStatus]);

  // Global browser online/offline & visibility change listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      performPing();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestoredBanner(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        performPing();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial ping
    performPing();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [performPing]);

  // Adaptive polling interval: 30s for 'good'/'checking', 8s for 'slow'/'lagging'
  useEffect(() => {
    if (!navigator.onLine) return;

    const intervalTime =
      qualityStatus === 'slow' || qualityStatus === 'lagging'
        ? PING_INTERVAL_DEGRADED_MS
        : PING_INTERVAL_GOOD_MS;

    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        performPing();
      }
    }, intervalTime);

    return () => clearInterval(intervalId);
  }, [qualityStatus, performPing]);

  // Plain-language status configuration details
  const statusConfig = useMemo(() => {
    switch (qualityStatus) {
      case 'offline':
        return {
          label: 'Offline',
          message: 'Offline / Connection Lost',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          dotBg: 'bg-rose-500',
          textClass: 'text-rose-300',
        };
      case 'lagging':
        return {
          label: 'Lagging',
          message: 'Weak connection detected — please check your internet.',
          badgeBg: 'bg-red-950/90 text-red-200 border-red-500/40',
          dotBg: 'bg-red-500',
          textClass: 'text-red-300',
        };
      case 'slow':
        return {
          label: 'Slow',
          message: 'Connection is slow — some features may take longer to load.',
          badgeBg: 'bg-amber-950/90 text-amber-200 border-amber-500/40',
          dotBg: 'bg-amber-400',
          textClass: 'text-amber-300',
        };
      case 'checking':
      default:
        return {
          label: 'Good',
          message: 'Connection restored — back to normal.',
          badgeBg: 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40',
          dotBg: 'bg-emerald-400',
          textClass: 'text-emerald-300',
        };
    }
  }, [qualityStatus]);

  // Only show banner when truly offline (navigator.onLine === false) or brief restored confirmation
  const shouldShowWidget = !isOnline || (showRestoredBanner && isOnline);

  if (!shouldShowWidget) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] max-w-sm w-auto transition-all duration-300 ease-in-out pointer-events-auto flex flex-col items-end gap-2"
      id="network-status-toast"
    >
      {/* 1. Offline Banner */}
      {!isOnline && (
        <div className="flex items-center gap-3 bg-amber-950/95 text-amber-200 border border-amber-500/40 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md text-sm animate-in fade-in slide-in-from-bottom-2">
          <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 shrink-0">
            <WifiOff className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-100 text-xs">Offline / Connection Lost</p>
            <p className="text-[11px] text-amber-300/80">Using cached offline study data.</p>
          </div>
          <button
            onClick={handleManualRetry}
            disabled={isRetrying || isPinging}
            className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 text-amber-200 rounded-lg text-xs font-medium transition flex items-center gap-1.5 shrink-0 border border-amber-500/30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying || isPinging ? 'animate-spin' : ''}`} />
            {isRetrying || isPinging ? 'Reconnecting...' : 'Retry'}
          </button>
        </div>
      )}

      {/* 2. Connection Restored / Back to Normal Banner (brief 3.5s toast when returning to good state) */}
      {isOnline && showRestoredBanner && qualityStatus === 'good' && (
        <div className="flex items-center gap-2.5 bg-emerald-950/95 text-emerald-200 border border-emerald-500/40 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Connection restored — back to normal.</span>
        </div>
      )}

      {/* 3. Degraded Quality (Slow / Lagging) Pill Badge */}
      {isOnline && (qualityStatus === 'slow' || qualityStatus === 'lagging') && (
        <div className="relative flex flex-col items-end">
          {/* Detailed Info Card Popover (shows numerical latency, 5-ping average, & history on click) */}
          {showDetails && (
            <div className="mb-2 p-3 bg-slate-900/95 border border-slate-800 rounded-xl shadow-2xl backdrop-blur-md text-xs text-slate-300 w-64 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" /> Network Latency Stats
                </span>
                <button
                  onClick={handleManualRetry}
                  disabled={isPinging}
                  title="Ping Now"
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
                >
                  <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Status:</span>
                  <span className={`font-semibold ${statusConfig.textClass}`}>
                    {statusConfig.label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">5-Ping Avg:</span>
                  <span className="font-mono text-slate-200">
                    {averageLatency !== null ? `${averageLatency} ms` : 'Measuring...'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Latest Ping:</span>
                  <span className="font-mono text-slate-200">
                    {currentLatency !== null ? `${currentLatency} ms` : 'N/A'}
                  </span>
                </div>

                {pingHistory.length > 0 && (
                  <div className="pt-1.5 mt-1.5 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block mb-1">Recent Pings (RTT):</span>
                    <div className="flex items-center gap-1">
                      {pingHistory.map((val, idx) => (
                        <span
                          key={idx}
                          className={`px-1 py-0.5 rounded text-[10px] font-mono ${
                            val < 300
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : val <= 800
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {val}m
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Problem Badge Pill */}
          <div
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border shadow-2xl backdrop-blur-md text-xs font-medium ${statusConfig.badgeBg} animate-in fade-in slide-in-from-bottom-2`}
          >
            <button
              onClick={() => setShowDetails((prev) => !prev)}
              className="flex items-center gap-2 text-left hover:opacity-90 transition"
              title="Click to toggle network latency stats"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusConfig.dotBg}`}
                />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.dotBg}`} />
              </span>
              <span className="leading-snug">{statusConfig.message}</span>
            </button>

            {/* Check Again button for Lagging state */}
            {qualityStatus === 'lagging' && (
              <button
                onClick={handleManualRetry}
                disabled={isRetrying || isPinging}
                className="ml-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 active:scale-95 text-red-200 rounded-lg text-[11px] font-medium transition flex items-center gap-1 shrink-0 border border-red-500/30"
              >
                <RefreshCw className={`w-3 h-3 ${isRetrying || isPinging ? 'animate-spin' : ''}`} />
                {isRetrying || isPinging ? 'Checking...' : 'Check Again'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
