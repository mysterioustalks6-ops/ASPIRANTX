import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  Coins, 
  Sparkles, 
  Zap, 
  Crown, 
  CheckCircle2, 
  ShieldCheck, 
  Flame,
  X
} from 'lucide-react';
import { 
  loadUserProfile, 
  calculateLevelFromXP, 
  redeemCoinsForPremium, 
  isUserPremiumActive 
} from '../lib/gamification';
import { UserProfile } from '../types';

interface GamificationBarProps {
  onOpenPremiumTab?: () => void;
  onOpenReferralModal?: () => void;
}

export const GamificationBar: React.FC<GamificationBarProps> = ({ 
  onOpenPremiumTab,
  onOpenReferralModal 
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState<boolean>(false);
  const [redeemStatus, setRedeemStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);

  // Load profile and listen to live gamification update events
  const fetchProfile = async () => {
    const p = await loadUserProfile();
    setProfile(p);
  };

  useEffect(() => {
    fetchProfile();

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setProfile(e.detail);
      } else {
        fetchProfile();
      }
    };

    const handleStreakUpdated = (e: any) => {
      const { streakDays, lastActiveDate } = e.detail || {};
      if (typeof streakDays === 'number') {
        setProfile((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            streakDays,
            lastActiveDate: lastActiveDate || prev.lastActiveDate,
          };
        });
      }
    };

    window.addEventListener('aspirantx_gamification_updated', handleUpdate);
    window.addEventListener('aspirantx_streak_updated', handleStreakUpdated);
    return () => {
      window.removeEventListener('aspirantx_gamification_updated', handleUpdate);
      window.removeEventListener('aspirantx_streak_updated', handleStreakUpdated);
    };
  }, []);

  if (!profile) return null;

  const { level, xpInCurrentLevel, progressPercentage, xpNeededForNextLevel } = calculateLevelFromXP(profile.xp);
  const isPremiumActive = isUserPremiumActive(profile);

  const handleRedeem = async () => {
    setIsRedeeming(true);
    setRedeemStatus(null);

    const result = await redeemCoinsForPremium(profile.id);
    setIsRedeeming(false);

    setRedeemStatus({
      success: result.success,
      message: result.message,
    });

    if (result.success && result.updatedProfile) {
      setProfile(result.updatedProfile);
    }
  };

  return (
    <>
      {/* Gamification Bar Banner */}
      <div className="w-full bg-slate-900/90 border-b border-slate-800/80 px-3 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-2.5 text-xs backdrop-blur-md">
        {/* Level & XP Progress Section */}
        <div className="flex items-center gap-2 flex-1 max-w-md min-w-0">
          <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-300 shrink-0 font-extrabold text-[10px] sm:text-[11px]">
            <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
            <span>LVL {level}</span>
          </div>

          <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold">
              <span className="text-slate-300 truncate">
                {profile.xp} XP
              </span>
              <span className="text-slate-400 text-[9px] sm:text-[10px]">
                {xpNeededForNextLevel} to Lvl {level + 1}
              </span>
            </div>

            {/* Level Progress Bar */}
            <div className="w-full h-1 sm:h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Coins & Premium Redemption & Referral Section */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
          {/* Refer & Earn Quick Button */}
          {onOpenReferralModal && (
            <button
              onClick={onOpenReferralModal}
              className="px-2 sm:px-2.5 py-1 rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-purple-500/15 hover:from-amber-500/25 hover:to-purple-500/25 border border-amber-500/30 text-amber-300 font-extrabold text-[10px] sm:text-[11px] flex items-center gap-1 transition-all shadow-sm shrink-0"
              title="Refer Friends & Earn 150 Coins + Free PRO Access"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">Refer & Earn</span>
              <span className="sm:hidden">Refer</span>
            </button>
          )}

          {/* Coins Balance Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-extrabold text-[11px] shrink-0">
            <Coins className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{profile.coins}</span>
          </div>

          {/* PRO Access Pill / Redeem Button */}
          {isPremiumActive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] shrink-0">
              <Crown className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <span className="hidden sm:inline">1-Day PRO Unlocked</span>
              <span className="sm:hidden">PRO Active</span>
            </div>
          ) : (
            <button
              id="redeem-coins-modal-btn"
              onClick={() => {
                setRedeemStatus(null);
                setShowRedeemModal(true);
              }}
              className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-md shadow-amber-500/20 transition-all shrink-0"
            >
              <Zap className="w-3 h-3 fill-slate-950" /> Redeem PRO
            </button>
          )}
        </div>
      </div>

      {/* Redeem 1-Day Premium Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 relative overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Crown className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Redeem 1-Day Premium Access</h3>
                  <p className="text-[11px] text-slate-400">Exchange study coins for instant PRO features</p>
                </div>
              </div>

              <button
                onClick={() => setShowRedeemModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Balance Display */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Your Current Coins</p>
                <p className="text-lg font-black text-amber-400 flex items-center gap-1.5 mt-0.5">
                  <Coins className="w-5 h-5 fill-amber-400" /> {profile.coins} Coins
                </p>
              </div>

              <div className="text-right">
                <p className="text-[11px] text-slate-400">Required Coins</p>
                <p className="text-lg font-black text-white">100 Coins</p>
              </div>
            </div>

            {/* Perks List */}
            <div className="space-y-2 text-xs text-slate-300">
              <p className="font-bold text-slate-200">What you unlock for 24 Hours:</p>
              <div className="space-y-1.5 pl-1">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited AI Essay & Answer Evaluation</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Interactive PYQ Trend Predictor Engine</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full Mains Model Answer Generator</span>
                </div>
              </div>
            </div>

            {/* Feedback Message */}
            {redeemStatus && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold border ${
                  redeemStatus.success
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                }`}
              >
                {redeemStatus.message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRedeemModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleRedeem}
                disabled={isRedeeming || profile.coins < 100}
                className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-lg ${
                  profile.coins >= 100
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Zap className="w-4 h-4 fill-current" />
                {isRedeeming ? 'Redeeming...' : 'Confirm 100 Coins Redeem'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
