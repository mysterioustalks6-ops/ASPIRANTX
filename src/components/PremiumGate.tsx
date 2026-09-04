import React from 'react';
import { motion } from 'motion/react';
import { Lock as LockIcon, Sparkles, Crown, Zap } from 'lucide-react';

export interface FeatureFlagsMap {
  [featureName: string]: boolean; // true if feature is premium locked for free users
}

interface PremiumGateProps {
  featureName: string;
  featureTitle?: string;
  isUserPremium?: boolean;
  isGuest?: boolean;
  featureFlags?: FeatureFlagsMap;
  onOpenPremium?: () => void;
  onRequireLogin?: () => void;
  children: React.ReactNode;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({
  featureName,
  featureTitle,
  isUserPremium = false,
  isGuest = false,
  featureFlags = {},
  onOpenPremium,
  onRequireLogin,
  children,
}) => {
  // Check Guest Strict Lock setting (default false so demo users get full access during session timer)
  const isGuestStrictLock = isGuest && localStorage.getItem('aspirantx_guest_strict_lock') === 'true';

  // Check if this feature is marked as is_premium by the Admin
  const isFeaturePremiumLocked = Boolean(featureFlags[featureName]);

  // If user is guest and strict guest lock applies:
  if (isGuestStrictLock) {
    return (
      <div className="relative w-full h-full min-h-[350px] overflow-hidden rounded-2xl group">
        <div className="w-full h-full pointer-events-none blur-md opacity-30 select-none transition-all duration-500">
          {children}
        </div>

        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#0b0e17]/90 border border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.25)] text-center space-y-4 relative overflow-hidden"
          >
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/50 flex items-center justify-center mx-auto text-purple-300 shadow-[0_0_25px_rgba(168,85,247,0.3)] relative">
              <LockIcon className="w-8 h-8" />
              <Sparkles className="w-4 h-4 text-purple-300 absolute -top-1 -right-1 animate-pulse" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 tracking-wider mb-2">
                🔒 Demo Mode Lock
              </div>
              <h3 className="text-xl font-extrabold text-white">
                {featureTitle || `${featureName.toUpperCase()} Locked in Demo Mode`}
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                You are currently exploring in <strong className="text-purple-300">Demo Mode</strong>. Sign in with Google or Email to save your study streak, send AI messages, and access all tools.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={onRequireLogin || onOpenPremium}
                className="w-full py-3.5 rounded-2xl font-black text-xs bg-gradient-to-r from-purple-500 via-cyan-400 to-blue-500 text-slate-950 hover:brightness-110 shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Sign In / Register to Unlock
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // If feature is NOT premium locked OR user is already premium OR demo user in active session, render children normally
  if (!isFeaturePremiumLocked || isUserPremium || (isGuest && !isGuestStrictLock)) {
    return <>{children}</>;
  }

  // Otherwise, render access lock card and WITHHOLD protected children from DOM
  return (
    <div className="relative w-full h-full min-h-[350px] overflow-hidden rounded-2xl group">
      {/* Non-sensitive Withheld Content Placeholder (Prevents DOM Inspection Leaks) */}
      <div className="w-full h-full min-h-[350px] bg-slate-950/90 rounded-2xl flex items-center justify-center select-none" aria-hidden="true" />

      {/* Overlay Glowing Aesthetic Lock Card */}
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#0b0e17]/90 border border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-center space-y-4 relative overflow-hidden"
        >
          {/* Ambient background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Animated Lock Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/50 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)] relative">
            <LockIcon className="w-8 h-8" />
            <Sparkles className="w-4 h-4 text-amber-300 absolute -top-1 -right-1 animate-pulse" />
          </div>

          <div className="text-[10px] font-black uppercase text-amber-400 tracking-widest bg-amber-500/10 border border-amber-500/20 px-3 py-0.5 rounded-full inline-block">
            AspirantX Enterprise Platform
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-wider mb-2">
              <Crown className="w-3.5 h-3.5 text-amber-400" /> Premium Locked Feature
            </div>
            <h3 className="text-xl font-extrabold text-white">
              {featureTitle || `${featureName.toUpperCase()} Access Restricted`}
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
              This feature has been designated as a <strong className="text-amber-300">PRO Pass</strong> feature by the AspirantX Administrator.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenPremium}
              className="w-full py-3.5 rounded-2xl font-black text-xs bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
            >
              <Zap className="w-4 h-4 fill-slate-950" /> Unlock Premium to Access
            </button>
            <p className="text-[11px] text-slate-400 mt-2">
              Instant activation via Razorpay or watch a free 15s sponsored ad.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
