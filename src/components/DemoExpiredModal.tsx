import React from 'react';
import { motion } from 'motion/react';
import { Lock as LockIcon, Sparkles, LogIn, ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { signInWithGoogle, isSupabaseConfigured } from '../lib/supabase';
import { startDemoSession } from '../lib/demoSession';

interface DemoExpiredModalProps {
  isOpen: boolean;
  onRequireLogin: () => void;
  onResetDemoSession?: () => void;
}

export const DemoExpiredModal: React.FC<DemoExpiredModalProps> = ({
  isOpen,
  onRequireLogin,
  onResetDemoSession,
}) => {
  if (!isOpen) return null;

  const handleGoogleAuth = async () => {
    if (isSupabaseConfigured) {
      await signInWithGoogle();
    } else {
      onRequireLogin();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#0d111c] border border-rose-500/40 shadow-[0_0_60px_rgba(244,63,94,0.25)] text-center space-y-5 relative overflow-hidden"
      >
        {/* Glow ambient accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.3)] relative">
          <Clock className="w-8 h-8 animate-pulse text-rose-400" />
          <LockIcon className="w-4 h-4 text-white absolute -bottom-1 -right-1 bg-rose-600 rounded-full p-0.5" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40 tracking-wider">
            ⏱️ Demo Time Limit Reached
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Demo Session Expired
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            Your free demo period has completed. Sign in or register to save your study stats, syllabus progress, and access unlimited AI mentoring!
          </p>
        </div>

        {/* Sign In Options */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleGoogleAuth}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-500 to-cyan-400 hover:from-purple-400 hover:to-cyan-300 text-slate-950 font-black text-sm transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In with Google / Email</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onRequireLogin}
            className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Go to Login / Register Portal</span>
          </button>

          {onResetDemoSession && (
            <button
              onClick={() => {
                startDemoSession();
                onResetDemoSession();
              }}
              className="w-full py-2 px-3 text-[11px] font-semibold text-slate-400 hover:text-slate-200 underline transition-all cursor-pointer"
            >
              Extend / Restart Demo Session (Admin / Tester)
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Free Account • Your progress will be safely synced</span>
        </div>
      </motion.div>
    </div>
  );
};
