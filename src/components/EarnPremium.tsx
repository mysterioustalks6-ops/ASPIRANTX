import React, { useEffect, useState } from 'react';
import { Play, Sparkles, CheckCircle2, Clock, Tv, Award, ShieldCheck, Flame } from 'lucide-react';
import { UserProfile, ActiveTab } from '../types';
import { AdSenseBanner } from './AdSenseBanner';

interface EarnPremiumProps {
  user?: UserProfile | null;
  onNavigate?: (tab: ActiveTab) => void;
}

export const EarnPremium: React.FC<EarnPremiumProps> = ({ user, onNavigate }) => {
  const [viewsToday, setViewsToday] = useState(0);
  const [viewsNeeded, setViewsNeeded] = useState(5);
  const [rewardActive, setRewardActive] = useState(false);
  const [rewardPremiumUntil, setRewardPremiumUntil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchingAd, setWatchingAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(15);
  const [justUnlockedModal, setJustUnlockedModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/rewards/status', { headers });
      const data = await res.json();
      if (data && data.viewsToday !== undefined) {
        setViewsToday(data.viewsToday);
        setViewsNeeded(data.viewsNeeded || 5);
        setRewardActive(Boolean(data.rewardActive));
        setRewardPremiumUntil(data.rewardPremiumUntil || null);
      }
    } catch (e) {
      setErrorMsg('Failed to load reward status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Ad Watch Simulation Timer
  useEffect(() => {
    let timer: any = null;
    if (watchingAd && adCountdown > 0) {
      timer = setInterval(() => {
        setAdCountdown((prev) => prev - 1);
      }, 1000);
    } else if (watchingAd && adCountdown === 0) {
      // Ad finished! Call complete handler
      onAdWatchComplete();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [watchingAd, adCountdown]);

  const handleStartWatchAd = () => {
    setAdCountdown(15);
    setWatchingAd(true);
  };

  const onAdWatchComplete = async () => {
    setWatchingAd(false);
    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/rewards/watch-ad', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: user?.email }),
      });
      const data = await res.json();
      if (data && data.viewsToday !== undefined) {
        setViewsToday(data.viewsToday);
        setRewardActive(Boolean(data.rewardActive));
        setRewardPremiumUntil(data.rewardPremiumUntil || null);
        if (data.justUnlocked) {
          setJustUnlockedModal(true);
        }
      }
    } catch (e) {
      setErrorMsg('Failed to record ad view.');
    }
  };

  const percent = Math.min(100, Math.round((viewsToday / viewsNeeded) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 border border-amber-500/20 p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-3 z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/30">
            <Sparkles className="w-4 h-4" />
            <span>REWARDED STUDY ADS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Earn Free 2 Days PRO Pass
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Watch 5 short sponsored study videos today to instantly unlock full PRO access across all UPSC & SSC practice tools, AI Mentor, CBT exams, and analytics!
          </p>
        </div>
        <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-xl shadow-amber-500/10">
          <Tv className="w-10 h-10" />
        </div>
      </div>

      {/* Official Google AdSense Placement for Earn Free PRO */}
      <AdSenseBanner slotType="inFeed" isPremium={user?.isPremium} />

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold">
          {errorMsg}
        </div>
      )}

      {/* Main Status & Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progress Card */}
        <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Daily Ad Watch Progress</h2>
              <p className="text-xs text-slate-400">Complete 5 ad views today to claim your 48-hour PRO Pass.</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-400">{viewsToday}</span>
              <span className="text-sm font-bold text-slate-500"> / {viewsNeeded} Videos</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500 rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-slate-400">
              <span>0 watched</span>
              <span>{percent}% Completed</span>
              <span>5 required</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verified Safe Educational Sponsor Content</span>
            </div>
            <button
              onClick={handleStartWatchAd}
              disabled={watchingAd}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Watch Study Ad (15s)</span>
            </button>
          </div>
        </div>

        {/* Reward Status Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>PRO Access Status</span>
            </div>
            {rewardActive ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Free PRO Pass is Active!</span>
                </div>
                {rewardPremiumUntil && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Expires: {new Date(rewardPremiumUntil).toLocaleString()}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-medium">
                  No active reward pass right now. Complete 5 ad views to activate 2 days of free PRO features.
                </div>
              </div>
            )}
          </div>

          {rewardActive && onNavigate && (
            <button
              onClick={() => onNavigate('syllabus')}
              className="w-full py-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <span>Explore PRO Features</span>
            </button>
          )}
        </div>
      </div>

      {/* Ad Watch Simulation Modal / Overlay */}
      {watchingAd && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-amber-500/40 rounded-3xl p-8 text-center shadow-2xl space-y-6 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
              <Tv className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Rewarded Ad Placeholder
              </span>
              <h3 className="text-xl font-black text-white">UPSC/SSC Topper Study Tips & PYQ Masterclass</h3>
              <p className="text-xs text-slate-400">
                Please watch this sponsored educational message. Your reward will be credited automatically when the timer reaches zero.
              </p>
            </div>

            <div className="py-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <div className="text-4xl font-black font-mono text-amber-400">{adCountdown}s</div>
              <div className="text-[11px] text-slate-500">Ad completing in {adCountdown} seconds...</div>
            </div>

            <div className="text-[11px] text-slate-500 italic">
              Note: This is a placeholder for a rewarded video ad network.
            </div>
          </div>
        </div>
      )}

      {/* Just Unlocked Celebration Modal */}
      {justUnlockedModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-emerald-500/40 rounded-3xl p-8 text-center shadow-2xl space-y-6 animate-scaleUp">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20">
              <Sparkles className="w-10 h-10 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">2 Days Premium Unlocked!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Congratulations! You have successfully watched 5 study ad videos today. Your 48-hour Free PRO Pass is now active across all features.
              </p>
            </div>
            <button
              onClick={() => {
                setJustUnlockedModal(false);
                fetchStatus();
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20"
            >
              Start Studying with PRO Access
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
