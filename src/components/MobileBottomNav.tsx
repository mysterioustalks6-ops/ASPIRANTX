import React from 'react';
import { ActiveTab } from '../types';
import { Target, BookOpen, Award, BarChart3, Menu } from 'lucide-react';

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

  return (
    <nav 
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0F1115]/95 backdrop-blur-2xl border-t border-[#2A2F3A] pb-[max(0.65rem,env(safe-area-inset-bottom,0px))] md:hidden transition-all shadow-[0_-4px_24px_rgba(0,0,0,0.7)]"
    >
      <div className="flex items-center justify-around px-2 py-1.5 h-16 max-w-md mx-auto">
        {/* 1. Home */}
        <button
          onClick={() => setActiveTab('dashboard')}
          aria-label="Home Dashboard"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-150 min-h-[48px] touch-manipulation cursor-pointer select-none active:translate-y-0.5 ${
            isHomeActive
              ? 'text-[#58CC02] font-black'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-150 ${isHomeActive ? 'bg-[#58CC02]/15 text-[#58CC02] border border-[#58CC02]/30 shadow-[0_0_12px_rgba(88,204,2,0.2)]' : ''}`}>
            <Target className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">Home</span>
        </button>

        {/* 2. Study (Syllabus & Curriculum) */}
        <button
          onClick={() => setActiveTab('syllabus')}
          aria-label="Study Curriculum & Syllabus"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-150 min-h-[48px] touch-manipulation cursor-pointer select-none active:translate-y-0.5 ${
            isLearnActive
              ? 'text-[#58CC02] font-black'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-150 ${isLearnActive ? 'bg-[#58CC02]/15 text-[#58CC02] border border-[#58CC02]/30 shadow-[0_0_12px_rgba(88,204,2,0.2)]' : ''}`}>
            <BookOpen className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">Study</span>
        </button>

        {/* 3. Practice (PYQ, Question Bank, CBT Mocks) */}
        <button
          onClick={() => setActiveTab('practice_hub')}
          aria-label="Practice Mock Tests & PYQs"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-150 min-h-[48px] touch-manipulation cursor-pointer select-none active:translate-y-0.5 ${
            isPracticeActive
              ? 'text-[#58CC02] font-black'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-150 ${isPracticeActive ? 'bg-[#58CC02]/15 text-[#58CC02] border border-[#58CC02]/30 shadow-[0_0_12px_rgba(88,204,2,0.2)]' : ''}`}>
            <Award className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">Practice</span>
        </button>

        {/* 4. Progress (Readiness, Accuracy & Leaderboard) */}
        <button
          onClick={() => setActiveTab('progress_hub')}
          aria-label="Readiness & Analytics"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-150 min-h-[48px] touch-manipulation cursor-pointer select-none active:translate-y-0.5 ${
            isProgressActive
              ? 'text-[#58CC02] font-black'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-150 ${isProgressActive ? 'bg-[#58CC02]/15 text-[#58CC02] border border-[#58CC02]/30 shadow-[0_0_12px_rgba(88,204,2,0.2)]' : ''}`}>
            <BarChart3 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">Progress</span>
        </button>

        {/* 5. More (Tools, Productivity, Community & Settings) */}
        <button
          onClick={() => setActiveTab('more_hub')}
          aria-label="Open More Features & Tools"
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-150 min-h-[48px] touch-manipulation cursor-pointer select-none active:translate-y-0.5 ${
            isMoreActive
              ? 'text-[#58CC02] font-black'
              : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-150 ${isMoreActive ? 'bg-[#58CC02]/15 text-[#58CC02] border border-[#58CC02]/30 shadow-[0_0_12px_rgba(88,204,2,0.2)]' : ''}`}>
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-bold">More</span>
        </button>
      </div>
    </nav>
  );
};
