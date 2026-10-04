import React from 'react';
import { motion } from 'motion/react';
import { ActiveTab } from '../types';
import { Target, BookOpen, Award, BarChart3, Menu, Compass, Zap } from 'lucide-react';
import { soundFx } from '../lib/soundEffects';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMore: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const isHomeActive = activeTab === 'student_dashboard' || activeTab === 'dashboard';
  const isLearnActive = activeTab === 'syllabus' || activeTab === 'library' || activeTab === 'flashcards' || activeTab === 'podcasts';
  const isPracticeActive = activeTab === 'practice_hub' || activeTab === 'cbt' || activeTab === 'cbt_exam' || activeTab === 'pyq' || activeTab === 'question_bank';
  const isProgressActive = activeTab === 'progress_hub' || activeTab === 'weakness' || activeTab === 'leaderboard';
  const isMoreActive = activeTab === 'more_hub' || (!isHomeActive && !isLearnActive && !isPracticeActive && !isProgressActive);

  const handleTabSwitch = (tab: ActiveTab) => {
    soundFx.playTap();
    setActiveTab(tab);
  };

  return (
    <nav 
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F1115]/95 backdrop-blur-2xl border-t border-[#2A2F3A] pb-[max(0.65rem,env(safe-area-inset-bottom,0px))] md:hidden transition-all shadow-[0_-4px_24px_rgba(0,0,0,0.7)]"
    >
      <div className="flex items-center justify-around px-2 py-1.5 h-16 max-w-md mx-auto">
        {/* 1. Home / Path */}
        <button
          onClick={() => handleTabSwitch('dashboard')}
          aria-label="Home Learning Path"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all min-h-[48px] touch-manipulation cursor-pointer select-none active:scale-95 ${
            isHomeActive
              ? 'text-[#58CC02] font-black'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <motion.div 
            whileTap={{ scale: 0.85 }}
            className={`p-1.5 rounded-xl transition-all duration-200 ${
              isHomeActive 
                ? 'bg-[#58CC02]/20 text-[#58CC02] border-2 border-[#58CC02] shadow-[0_0_16px_rgba(88,204,2,0.35)] scale-110' 
                : 'hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-5 h-5 stroke-[2.4]" />
          </motion.div>
          <span className={`text-[10px] mt-0.5 tracking-tight ${isHomeActive ? 'font-black text-[#58CC02]' : 'font-semibold'}`}>
            Path
          </span>
        </button>

        {/* 2. Study (Syllabus & Curriculum) */}
        <button
          onClick={() => handleTabSwitch('syllabus')}
          aria-label="Study Curriculum & Syllabus"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all min-h-[48px] touch-manipulation cursor-pointer select-none active:scale-95 ${
            isLearnActive
              ? 'text-[#1CB0F6] font-black'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <motion.div 
            whileTap={{ scale: 0.85 }}
            className={`p-1.5 rounded-xl transition-all duration-200 ${
              isLearnActive 
                ? 'bg-[#1CB0F6]/20 text-[#1CB0F6] border-2 border-[#1CB0F6] shadow-[0_0_16px_rgba(28,176,246,0.35)] scale-110' 
                : 'hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-5 h-5 stroke-[2.4]" />
          </motion.div>
          <span className={`text-[10px] mt-0.5 tracking-tight ${isLearnActive ? 'font-black text-[#1CB0F6]' : 'font-semibold'}`}>
            Syllabus
          </span>
        </button>

        {/* 3. Practice (PYQ, Question Bank, CBT Mocks) */}
        <button
          onClick={() => handleTabSwitch('practice_hub')}
          aria-label="Practice Mock Tests & PYQs"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all min-h-[48px] touch-manipulation cursor-pointer select-none active:scale-95 ${
            isPracticeActive
              ? 'text-[#FF9600] font-black'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <motion.div 
            whileTap={{ scale: 0.85 }}
            className={`p-1.5 rounded-xl transition-all duration-200 ${
              isPracticeActive 
                ? 'bg-[#FF9600]/20 text-[#FF9600] border-2 border-[#FF9600] shadow-[0_0_16px_rgba(255,150,0,0.35)] scale-110' 
                : 'hover:bg-slate-800/60'
            }`}
          >
            <Award className="w-5 h-5 stroke-[2.4]" />
          </motion.div>
          <span className={`text-[10px] mt-0.5 tracking-tight ${isPracticeActive ? 'font-black text-[#FF9600]' : 'font-semibold'}`}>
            Practice
          </span>
        </button>

        {/* 4. Progress (Readiness, Accuracy & Leaderboard) */}
        <button
          onClick={() => handleTabSwitch('progress_hub')}
          aria-label="Readiness & Analytics"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all min-h-[48px] touch-manipulation cursor-pointer select-none active:scale-95 ${
            isProgressActive
              ? 'text-[#CE82FF] font-black'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <motion.div 
            whileTap={{ scale: 0.85 }}
            className={`p-1.5 rounded-xl transition-all duration-200 ${
              isProgressActive 
                ? 'bg-[#CE82FF]/20 text-[#CE82FF] border-2 border-[#CE82FF] shadow-[0_0_16px_rgba(206,130,255,0.35)] scale-110' 
                : 'hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-5 h-5 stroke-[2.4]" />
          </motion.div>
          <span className={`text-[10px] mt-0.5 tracking-tight ${isProgressActive ? 'font-black text-[#CE82FF]' : 'font-semibold'}`}>
            Rank
          </span>
        </button>

        {/* 5. More (Tools, Productivity, Community & Settings) */}
        <button
          onClick={() => handleTabSwitch('more_hub')}
          aria-label="Open More Features & Tools"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all min-h-[48px] touch-manipulation cursor-pointer select-none active:scale-95 ${
            isMoreActive
              ? 'text-[#58CC02] font-black'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <motion.div 
            whileTap={{ scale: 0.85 }}
            className={`p-1.5 rounded-xl transition-all duration-200 ${
              isMoreActive 
                ? 'bg-[#58CC02]/20 text-[#58CC02] border-2 border-[#58CC02] shadow-[0_0_16px_rgba(88,204,2,0.35)] scale-110' 
                : 'hover:bg-slate-800/60'
            }`}
          >
            <Menu className="w-5 h-5 stroke-[2.4]" />
          </motion.div>
          <span className={`text-[10px] mt-0.5 tracking-tight ${isMoreActive ? 'font-black text-[#58CC02]' : 'font-semibold'}`}>
            More
          </span>
        </button>
      </div>
    </nav>
  );
};
