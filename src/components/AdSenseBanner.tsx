import React, { useEffect, useState, useRef } from 'react';
import { Radio, Sparkles, ChevronRight, Lock, BookOpen, Clock } from 'lucide-react';

const DEFAULT_ADSENSE_CONFIG: AdSenseConfig = {
  enabled: true,
  publisherId: 'ca-pub-8740054860974100',
  headerSlot: '7137181575',
  sidebarSlot: '5647382910',
  inFeedSlot: '9988776655',
  footerSlot: '4433221100',
  headerSlotEnabled: true,
  sidebarSlotEnabled: true,
  footerSlotEnabled: true,
  inFeedSlotEnabled: true,
  autoAdsEnabled: false,
  mockMode: false,
};

export interface AdSenseConfig {
  enabled: boolean;
  publisherId: string;
  headerSlot: string;
  sidebarSlot: string;
  inFeedSlot: string;
  footerSlot?: string;
  headerSlotEnabled?: boolean;
  sidebarSlotEnabled?: boolean;
  footerSlotEnabled?: boolean;
  inFeedSlotEnabled?: boolean;
  autoAdsEnabled: boolean;
  mockMode?: boolean; // Toggled by admin to force mock campaign mode
}

interface AdSenseBannerProps {
  slotType?: 'header' | 'sidebar' | 'inFeed' | 'footer';
  className?: string;
  config?: AdSenseConfig | null;
  isPremium?: boolean;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({
  slotType = 'header',
  className = '',
  config: propConfig,
  isPremium = false,
}) => {
  // --- ALL HOOKS MUST BE DECLARED AT TOP LEVEL (RULES OF HOOKS) ---
  const [isDismissed, setIsDismissed] = useState(false);
  const [config, setConfig] = useState<AdSenseConfig>(propConfig || DEFAULT_ADSENSE_CONFIG);
  const [adFillStatus, setAdFillStatus] = useState<'pending' | 'filled' | 'unfilled'>('pending');
  const pushedRef = useRef(false);
  const insRef = useRef<HTMLModElement>(null);

  // Reset ad fill status and pushed ref when slot or publisher ID changes
  useEffect(() => {
    setAdFillStatus('pending');
    pushedRef.current = false;
  }, [slotType, config.publisherId]);

  // Hook 2: Fetch AdSense configuration from server / localStorage
  useEffect(() => {
    if (isPremium || isDismissed) return;
    if (propConfig) {
      setConfig(propConfig);
      return;
    }
    const loadAdsense = () => {
      // 1. Try local storage first for instant load
      try {
        const saved = localStorage.getItem('aspirantx_adsense_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setConfig((prev) => ({ ...DEFAULT_ADSENSE_CONFIG, ...parsed }));
          }
        }
      } catch (e) {}

      // 2. Fetch latest from server
      fetch('/api/public/adsense-config', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          if (data?.adsense) {
            setConfig((prev) => ({ ...prev, ...data.adsense }));
            try {
              localStorage.setItem('aspirantx_adsense_config', JSON.stringify(data.adsense));
            } catch (e) {}
          }
        })
        .catch(() => {});
    };

    loadAdsense();

    const handleAdsenseEvent = () => {
      loadAdsense();
    };
    window.addEventListener('aspirantx_adsense_updated', handleAdsenseEvent);
    return () => {
      window.removeEventListener('aspirantx_adsense_updated', handleAdsenseEvent);
    };
  }, [propConfig, isPremium, isDismissed]);

  // Hook 3: Inject Google AdSense master script into document head if enabled & not mock mode
  useEffect(() => {
    if (isPremium || isDismissed || !config.enabled || !config.publisherId || config.mockMode) return;

    let pubId = config.publisherId.trim();
    if (pubId && !pubId.startsWith('ca-pub-') && !pubId.startsWith('pub-')) {
       pubId = 'ca-pub-' + pubId;
    } else if (pubId.startsWith('pub-')) {
       pubId = 'ca-pub-' + pubId.substring(4);
    }

    const scriptId = 'google-adsense-script';
    if (!document.getElementById(scriptId) && !document.querySelector('script[src*="adsbygoogle.js"]')) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  }, [config.enabled, config.publisherId, config.mockMode, isPremium, isDismissed]);

  // Hook 4: Trigger adsbygoogle push when script is active and element is ready
  useEffect(() => {
    if (isPremium || isDismissed) return;
    if (config.enabled && config.publisherId && !config.mockMode && insRef.current) {
      const el = insRef.current;
      const isAlreadyPushed = Boolean(
        el.getAttribute('data-adsbygoogle-status') ||
        el.dataset.adsbygoogleInitialized === 'true' ||
        pushedRef.current
      );

      if (!isAlreadyPushed) {
        try {
          pushedRef.current = true;
          el.dataset.adsbygoogleInitialized = 'true';
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
          console.warn('AdSense push handled:', e);
        }
      }
    }
  }, [config.enabled, config.publisherId, config.mockMode, slotType, isPremium, isDismissed]);

  // Hook 5: Monitor <ins> tag data-ad-status attribute and timeout fallback
  useEffect(() => {
    if (isPremium || isDismissed) return;
    if (!(config.enabled && config.publisherId && !config.mockMode && insRef.current)) return;

    const el = insRef.current;
    const checkStatus = () => {
      const status = el.getAttribute('data-ad-status');
      if (status === 'filled') {
        setAdFillStatus('filled');
      } else if (status === 'unfilled') {
        setAdFillStatus('unfilled');
      }
    };

    checkStatus(); // in case it's already resolved

    const observer = new MutationObserver(checkStatus);
    observer.observe(el, { attributes: true, attributeFilter: ['data-ad-status'] });

    // Fallback timer: if Google AdSense doesn't fill within 3.5 seconds (e.g. preview domain or ad blocker)
    const timeoutTimer = setTimeout(() => {
      if (el.getAttribute('data-ad-status') !== 'filled') {
        setAdFillStatus('unfilled');
      }
    }, 3500);

    return () => {
      observer.disconnect();
      clearTimeout(timeoutTimer);
    };
  }, [config.enabled, config.publisherId, config.mockMode, isPremium, isDismissed, slotType]);

  // --- EARLY RETURNS ---
  if (isPremium || isDismissed) {
    return null;
  }

  // Check if slot specific toggle is enabled
  const isSlotEnabled = config
    ? slotType === 'header'
      ? config.headerSlotEnabled ?? true
      : slotType === 'sidebar'
      ? config.sidebarSlotEnabled ?? true
      : slotType === 'footer'
      ? config.footerSlotEnabled ?? true
      : config.inFeedSlotEnabled ?? true
    : true;

  if (!isSlotEnabled) {
    return null;
  }

  const slotId = config
    ? slotType === 'header'
      ? config.headerSlot
      : slotType === 'sidebar'
      ? config.sidebarSlot
      : slotType === 'footer'
      ? config.footerSlot || config.inFeedSlot
      : config.inFeedSlot
    : '';

  // Render Real AdSense tag if publisher ID exists & config is enabled & mockMode is false
  const isValidPublisher = config.enabled && config.publisherId && !config.mockMode && 
    (config.publisherId.includes('pub-') || config.publisherId.length > 5);

  if (isValidPublisher && adFillStatus !== 'unfilled') {
    let adClient = config.publisherId.trim();
    if (adClient && !adClient.startsWith('ca-pub-') && !adClient.startsWith('pub-')) {
       adClient = 'ca-pub-' + adClient;
    } else if (adClient.startsWith('pub-')) {
       adClient = 'ca-pub-' + adClient.substring(4);
    }

    const isVertical = slotType === 'sidebar';
    const minHeightClass = isVertical ? 'min-h-[250px]' : 'min-h-[90px]';
    const minHeightPx = isVertical ? '250px' : '90px';
    const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.includes('run.app'));

    return (
      <div className={`my-4 relative group overflow-hidden text-center rounded-xl bg-slate-900/40 p-2 border border-slate-800/60 w-full flex flex-col justify-center items-center ${minHeightClass} ${className}`}>
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-black/60 hover:bg-black text-slate-400 hover:text-white flex items-center justify-center text-[10px] border border-white/10 transition-all opacity-60 hover:opacity-100"
          title="Dismiss ad"
        >
          ✕
        </button>

        {/* Ad Label */}
        <div className="w-full flex items-center justify-between px-2 pb-1 text-[9px] text-slate-500 uppercase tracking-widest font-mono">
          <span>Advertisement</span>
          {isDev && <span className="text-amber-400/80">Connecting AdSense...</span>}
        </div>

        <ins
          ref={insRef}
          className="adsbygoogle block w-full"
          data-ad-client={adClient}
          data-ad-slot={slotId || '7137181575'}
          data-ad-format="auto"
          data-full-width-responsive="true"
          style={{ display: 'block', minWidth: '250px', minHeight: minHeightPx }}
        />
      </div>
    );
  }

  // ── HIGH-FIDELITY INTERACTIVE MOCK AD CAMPAIGN ──
  // Renders a beautiful internal promotion banner if AdSense setup is mock or unconfigured
  // This keeps the UI beautiful and monetizes the site via upsells
  const renderMockCampaign = () => {
    switch (slotType) {
      case 'header':
        return (
          <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900/60 to-purple-950/60 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#7000FF]/5 rounded-full blur-xl" />
            
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left space-y-0.5">
                <h4 className="font-extrabold text-white text-xs sm:text-sm flex items-center gap-2">
                  Upgrade to AspirantX Premium Pass
                  <span className="text-[9px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-black tracking-wide">20% OFF</span>
                </h4>
                <p className="text-[10px] sm:text-xs text-slate-400">
                  Ad-free study experience, detailed mock answers, and unlimited syllabus pdf downloads.
                </p>
              </div>
            </div>

            <a 
              href="#premium" 
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-[11px] rounded-xl transition-all shadow-lg shrink-0 flex items-center gap-1"
            >
              <span>Unlock Premium</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        );

      case 'sidebar':
        return (
          <div className="bg-gradient-to-b from-[#0b0e17] to-slate-950 border border-white/10 rounded-2xl p-4 space-y-4 shadow-lg text-left relative overflow-hidden">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">NCERT Study Guide</span>
            </div>
            
            <div className="space-y-1">
              <h4 className="font-bold text-white text-xs">Complete NCERT Notes Bundle</h4>
              <p className="text-[10px] text-slate-400 leading-normal">
                Class 6-12 concise summary cards for Polity, History & Economy. Pre-mapped to syllabus tracker.
              </p>
            </div>

            <a 
              href="#library"
              className="w-full py-2 bg-slate-900 border border-white/10 hover:border-emerald-500/30 text-white font-extrabold text-[10px] rounded-lg transition-all flex items-center justify-center gap-1.5"
            >
              <span>Browse Library</span>
              <ChevronRight className="w-3 h-3 text-emerald-400" />
            </a>
          </div>
        );

      case 'footer':
        return (
          <div className="bg-gradient-to-r from-slate-950 via-indigo-950/20 to-slate-950 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-white text-xs">Stay Focused with Pomodoro Rooms</h5>
                <p className="text-[10px] text-slate-500">Join other civil service aspirants study together live.</p>
              </div>
            </div>
            <a 
              href="#timer" 
              className="text-[10px] text-cyan-400 font-bold hover:underline shrink-0"
            >
              Start Timer →
            </a>
          </div>
        );

      default: // inFeed
        return (
          <div className="bg-gradient-to-r from-[#0b0e17] via-slate-900 to-[#0b0e17] border border-white/5 rounded-xl p-3 flex items-center justify-between text-xs my-2">
            <div className="flex items-center gap-2">
              <div className="px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 text-[9px] font-bold">PRO Tip</div>
              <p className="text-slate-400 text-[11px]">Keep your daily streak going to earn free Premium days!</p>
            </div>
            <a href="#reward_milestones" className="text-[10px] text-cyan-400 font-bold hover:underline shrink-0">
              Claim Perks →
            </a>
          </div>
        );
    }
  };

  return (
    <div className={`my-4 relative group ${className}`}>
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-black/60 hover:bg-black text-slate-400 hover:text-white flex items-center justify-center text-[10px] border border-white/10 transition-all opacity-60 hover:opacity-100"
        title="Dismiss banner"
      >
        ✕
      </button>
      {renderMockCampaign()}
    </div>
  );
};
