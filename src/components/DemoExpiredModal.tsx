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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center space-y-5 relative overflow-hidden"
      >
        {/* Subtle ambient accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-300 relative shadow-sm">
          <Clock className="w-7 h-7 text-amber-400" />
          <LockIcon className="w-3.5 h-3.5 text-white absolute -bottom-1 -right-1 bg-amber-600 rounded-full p-0.5" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20 tracking-wider">
            ⏱️ Demo Session Complete
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Ready to Save Your Progress?
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            Your preview period is complete. Sign in or create a free account to permanently save your study telemetry, syllabus coverage, and unlock the AI Study Mentor.
          </p>
        </div>

        {/* Sign In Options */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={handleGoogleAuth}
            className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-md shadow-sky-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onRequireLogin}
            className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Open Sign In / Register Modal</span>
          </button>

          {onResetDemoSession && (
            <button
              onClick={() => {
                startDemoSession();
                onResetDemoSession();
              }}
              className="w-full py-1.5 px-3 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
            >
              Extend Demo Session
            </button>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>100% Free Account • Your progress will be safely synced</span>
        </div>
      </motion.div>
    </div>
  );
};
