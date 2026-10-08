import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { soundFx } from '../lib/soundEffects';
import { Check, Sparkles, Globe, ArrowRight, ShieldCheck } from 'lucide-react';

export const LanguagePickerModal: React.FC = () => {
  const { isPickerOpen, dismissPicker, language } = useLanguage();

  if (!isPickerOpen) return null;

  const handleSelectLanguage = (lang: 'hi' | 'en') => {
    soundFx.playSuccess();
    soundFx.triggerHaptic(15);
    dismissPicker(lang);
  };

  const handleSkip = () => {
    soundFx.playTap();
    dismissPicker(); // Will detect device language automatically
  };

  return (
    <AnimatePresence>
      <div 
        id="language-picker-modal"
        data-testid="language-picker-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl select-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full max-w-lg bg-slate-900/95 border-2 border-emerald-500/30 rounded-[32px] p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.8)] relative overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="text-center space-y-3 relative z-10 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5" /> StudyRide Localization
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              अपनी भाषा चुनें <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 font-extrabold text-xl sm:text-2xl">
                Choose Your Language
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
              StudyRide ko pure Hindi ya pure English mein customize karein. Header toggle se aap kabhi bhi bhasha badal sakte hain.
            </p>
          </div>

          {/* TWO LARGE LANGUAGE BUTTONS */}
          <div className="grid grid-cols-1 gap-4 relative z-10 mb-6">
            {/* 1. HINDI BUTTON */}
            <button
              type="button"
              id="lang-pick-hi"
              data-testid="pick-hindi-btn"
              onClick={() => handleSelectLanguage('hi')}
              className="group p-5 rounded-2xl bg-gradient-to-r from-slate-950/90 to-slate-900/90 hover:from-emerald-950/30 hover:to-slate-900 border-2 border-slate-800 hover:border-emerald-500/60 transition-all flex items-center justify-between text-left shadow-lg active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-emerald-500/20 border-2 border-amber-500/30 flex items-center justify-center text-2xl font-black text-amber-300 shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                  हि
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors">
                      हिन्दी
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black border border-emerald-500/30">
                      सम्पूर्ण हिन्दी
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    परीक्षा प्रश्न, पाठ्यक्रम, नोट्स और संपूर्ण ऐप हिन्दी में।
                  </p>
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 text-slate-400 flex items-center justify-center transition-all shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>

            {/* 2. ENGLISH BUTTON */}
            <button
              type="button"
              id="lang-pick-en"
              data-testid="pick-english-btn"
              onClick={() => handleSelectLanguage('en')}
              className="group p-5 rounded-2xl bg-gradient-to-r from-slate-950/90 to-slate-900/90 hover:from-cyan-950/30 hover:to-slate-900 border-2 border-slate-800 hover:border-cyan-500/60 transition-all flex items-center justify-between text-left shadow-lg active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-sky-500/20 to-indigo-500/20 border-2 border-cyan-500/30 flex items-center justify-center text-2xl font-black text-cyan-300 shrink-0 group-hover:scale-105 transition-transform shadow-inner">
                  EN
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-white group-hover:text-cyan-300 transition-colors">
                      English
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black border border-cyan-500/30">
                      Pure English
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Exam PYQs, syllabus roadmap, notes, and entire UI in English.
                  </p>
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-slate-800 group-hover:bg-cyan-500 group-hover:text-slate-950 text-slate-400 flex items-center justify-center transition-all shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Footer & Skip Option */}
          <div className="text-center relative z-10 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              id="lang-pick-skip"
              data-testid="pick-skip-btn"
              onClick={handleSkip}
              className="text-xs text-slate-400 hover:text-white font-bold transition-colors py-2 px-4 rounded-xl hover:bg-slate-800/50 cursor-pointer"
            >
              Skip & Continue with Device Default (डिवाइस भाषा से जारी रखें)
            </button>
            <p className="text-[10px] text-slate-400 mt-1">
              Never mix languages mode is strictly active. Tapping "हिं | EN" in the header switches instantly.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
