import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, ChevronRight, Check } from 'lucide-react';

export interface TourStep {
  title: string;
  description: string;
  badge?: string;
}

interface ContextualTourProps {
  featureKey: string;
  steps: TourStep[];
  onComplete?: () => void;
}

export const ContextualTour: React.FC<ContextualTourProps> = ({
  featureKey,
  steps,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const storageKey = `aspirantx_tour_${featureKey}`;

  useEffect(() => {
    try {
      const seen = localStorage.getItem(storageKey);
      if (!seen && steps.length > 0) {
        // Small delay to let initial page content render comfortably
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, [storageKey, steps.length]);

  const dismissPermanently = () => {
    try {
      localStorage.setItem(storageKey, 'seen');
    } catch {}
    setIsVisible(false);
    if (onComplete) onComplete();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      dismissPermanently();
    }
  };

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed bottom-20 right-4 z-40 max-w-xs w-full p-4 rounded-2xl bg-[#0c1017] border border-sky-500/30 shadow-2xl text-slate-100 font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-sky-500/10 flex items-center justify-center text-sky-400">
                <Sparkles className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                Quick Guide • {currentStep + 1}/{steps.length}
              </span>
            </div>

            <button
              type="button"
              onClick={dismissPermanently}
              className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] transition-colors"
              title="Skip guide"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="py-2.5 space-y-1">
            <h4 className="text-xs font-bold text-white leading-snug">{step.title}</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-normal">{step.description}</p>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={dismissPermanently}
              className="text-[10px] font-semibold text-slate-500 hover:text-slate-300 transition-colors"
            >
              Skip
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors shadow-sm"
            >
              <span>{currentStep === steps.length - 1 ? 'Got it' : 'Next'}</span>
              {currentStep === steps.length - 1 ? (
                <Check className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
