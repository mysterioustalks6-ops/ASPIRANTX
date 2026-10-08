import React from 'react';
import { ArrowLeft, Compass, Sparkles, Clock } from 'lucide-react';
import { TactileButton } from '../../design-system/TactileButton';

export interface MountainRidePageProps {
  onBack?: () => void;
}

export const MountainRidePage: React.FC<MountainRidePageProps> = ({ onBack }) => {
  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950/80 to-slate-950" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-4xl mx-auto px-4 pt-4 sm:pt-6 flex items-center justify-between">
        {onBack ? (
          <button
            onClick={onBack}
            aria-label="Go back"
            className="px-3.5 py-2 min-h-[44px] rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-slate-300 hover:text-white border border-slate-800 backdrop-blur-md flex items-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-400" />
            <span>Back</span>
          </button>
        ) : <div />}

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/80 text-[11px] font-bold text-slate-400 backdrop-blur-md">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Under development</span>
        </div>
      </header>

      {/* Main Coming Soon Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md mx-auto text-center flex flex-col items-center">
          {/* Animated Icon Container */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500/20 via-sky-500/15 to-emerald-500/20 border border-slate-700/60 backdrop-blur-xl flex items-center justify-center shadow-2xl relative z-10">
              <Compass className="w-10 h-10 text-sky-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/40 backdrop-blur-md flex items-center justify-center text-amber-400 shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500/10 to-teal-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-wider mb-4 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Coming Soon</span>
          </div>

          {/* Title & Description */}
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
            Coming Soon
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm mb-8">
            Yeh page abhi under development hai. Hum is jagah ek naya aur behtar feature jald hi layenge!
          </p>

          {/* Action Button */}
          {onBack && (
            <TactileButton
              variant="primary"
              size="lg"
              onClick={onBack}
              icon={<ArrowLeft className="w-4 h-4" />}
              className="px-6 py-3 min-h-[48px] text-sm font-bold shadow-xl shadow-indigo-500/10"
            >
              Back to Focus Timer
            </TactileButton>
          )}
        </div>
      </main>

      {/* Footer info */}
      <footer className="relative z-10 py-6 text-center text-xs text-slate-500">
        AspirantX • Study & Focus Hub
      </footer>
    </div>
  );
};
