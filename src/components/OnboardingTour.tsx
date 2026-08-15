import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface OnboardingTourProps {
  onNavigate: (tab: any) => void;
  onOpenProfileModal: () => void;
  onToggleSidebar?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  onNavigate,
  onOpenProfileModal,
  onToggleSidebar,
}) => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    return localStorage.getItem('aspirantx_onboarding_dismissed') === 'true';
  });

  const [steps, setSteps] = useState([
    {
      id: 1,
      title: '1. Target Exam Goal',
      desc: 'Set UPSC CSE, SSC CGL, or State PSC to customize syllabus topics and weightage.',
      completed: false,
      action: onOpenProfileModal,
      actionLabel: 'Set Exam Goal ⚙️',
    },
    {
      id: 2,
      title: '2. CBT Mock Tests',
      desc: 'Experience real exam timer, negative marking, and instant AI analytics.',
      completed: false,
      action: () => onNavigate('cbt'),
      actionLabel: 'Start Mock Test 📝',
    },
    {
      id: 3,
      title: '3. PYQ Bank (1991–2026)',
      desc: 'Master 35+ years of authentic solved previous year questions.',
      completed: false,
      action: () => onNavigate('pyq'),
      actionLabel: 'Browse PYQs 📚',
    },
    {
      id: 4,
      title: '4. Weakness Diagnostic',
      desc: 'Find your weak topics in 5 min with AI diagnostic analysis.',
      completed: false,
      action: () => onNavigate('weakness'),
      actionLabel: 'Diagnose Weakness 🎯',
    },
    {
      id: 5,
      title: '5. Revision Flashcards',
      desc: 'Master key concepts & formulas with spaced repetition revision decks.',
      completed: false,
      action: () => onNavigate('flashcards'),
      actionLabel: 'Study Flashcards 🎴',
    },
    {
      id: 6,
      title: '6. Pomodoro Focus History',
      desc: 'Track study sessions & view Day/Week/Month/Year focus stats.',
      completed: false,
      action: () => onNavigate('timer'),
      actionLabel: 'Focus Timer ⏱️',
    },
    {
      id: 7,
      title: '7. Community Wallet & Karma',
      desc: 'Earn reputation karma points, tip study tokens, and connect with rankers.',
      completed: false,
      action: () => onNavigate('community'),
      actionLabel: 'Karma & Wallet 💬',
    },
    {
      id: 8,
      title: '8. Sidebar Focus Toggle',
      desc: 'Collapse the sidebar anytime for a distraction-free full workspace.',
      completed: false,
      action: () => {
        if (onToggleSidebar) {
          onToggleSidebar();
        }
      },
      actionLabel: 'Toggle Sidebar ↔️',
    },
  ]);

  if (dismissed) return null;

  const handleCompleteStep = (id: number) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('aspirantx_onboarding_dismissed', 'true');
  };

  const completedCount = steps.filter(s => s.completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden mb-6"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">🚀 AspirantX Quickstart Checklist ({completedCount}/{steps.length} Completed)</h3>
            <p className="text-xs text-slate-400">Discover essential ranker tools & setup your optimal study workflow</p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title="Dismiss onboarding banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
              step.completed
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/40 text-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-cyan-400">Step {step.id}</span>
                <button
                  onClick={() => handleCompleteStep(step.id)}
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                    step.completed ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-950 border-slate-700 text-transparent'
                  }`}
                  title="Mark as completed"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
              <h4 className="text-xs font-bold text-white mb-1">{step.title}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{step.desc}</p>
            </div>

            <button
              onClick={step.action}
              className="w-full py-2 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
            >
              <span>{step.actionLabel}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
