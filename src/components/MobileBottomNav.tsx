import React from 'react';
import { ActiveTab } from '../types';
import { Target, BookOpen, Award, BarChart3, Menu } from 'lucide-react';
import { PressFeedback } from '../lib/animations';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMore: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMore,
}) => {
  const isHomeActive = activeTab === 'student_dashboard' || activeTab === 'dashboard';
  const isLearnActive = activeTab === 'syllabus' || activeTab === 'library' || activeTab === 'flashcards' || activeTab === 'podcasts' || activeTab === 'blog';
  const isPracticeActive = activeTab === 'cbt' || activeTab === 'cbt_exam' || activeTab === 'pyq' || activeTab === 'question_bank';
  const isProgressActive = activeTab === 'weakness' || activeTab === 'leaderboard' || activeTab === 'eligibility';
  const isMoreActive = !isHomeActive && !isLearnActive && !isPracticeActive && !isProgressActive;

  return (
    <nav 
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 pb-safe md:hidden transition-all shadow-[0_-4px_20px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-center justify-around px-2 py-1.5 h-16 max-w-md mx-auto">
        {/* 1. Home */}
        <PressFeedback className="flex-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            aria-label="Home Dashboard"
            className={`w-full flex flex-col items-center justify-center py-1 rounded-2xl transition-all min-h-[48px] touch-manipulation ${
              isHomeActive
                ? 'text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-200 ${isHomeActive ? 'bg-sky-500/20 shadow-[0_0_12px_rgba(2,132,199,0.35)]' : ''}`}>
              <Target className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Home</span>
          </button>
        </PressFeedback>

        {/* 2. Learn (Syllabus & Library) */}
        <PressFeedback className="flex-1">
          <button
            onClick={() => {
              if (activeTab === 'library') setActiveTab('library');
              else setActiveTab('syllabus');
            }}
            aria-label="Learn Content"
            className={`w-full flex flex-col items-center justify-center py-1 rounded-2xl transition-all min-h-[48px] touch-manipulation ${
              isLearnActive
                ? 'text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-200 ${isLearnActive ? 'bg-sky-500/20 shadow-[0_0_12px_rgba(2,132,199,0.35)]' : ''}`}>
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Learn</span>
          </button>
        </PressFeedback>

        {/* 3. Practice (CBT, PYQ, Question Bank) */}
        <PressFeedback className="flex-1">
          <button
            onClick={() => {
              if (activeTab === 'pyq') setActiveTab('pyq');
              else if (activeTab === 'question_bank') setActiveTab('question_bank');
              else setActiveTab('cbt');
            }}
            aria-label="Practice Engines"
            className={`w-full flex flex-col items-center justify-center py-1 rounded-2xl transition-all min-h-[48px] touch-manipulation ${
              isPracticeActive
                ? 'text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-200 ${isPracticeActive ? 'bg-sky-500/20 shadow-[0_0_12px_rgba(2,132,199,0.35)]' : ''}`}>
              <Award className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Practice</span>
          </button>
        </PressFeedback>

        {/* 4. Progress (Analytics & Rank) */}
        <PressFeedback className="flex-1">
          <button
            onClick={() => {
              if (activeTab === 'leaderboard') setActiveTab('leaderboard');
              else setActiveTab('weakness');
            }}
            aria-label="Progress and Accuracy"
            className={`w-full flex flex-col items-center justify-center py-1 rounded-2xl transition-all min-h-[48px] touch-manipulation ${
              isProgressActive
                ? 'text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-200 ${isProgressActive ? 'bg-sky-500/20 shadow-[0_0_12px_rgba(2,132,199,0.35)]' : ''}`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Progress</span>
          </button>
        </PressFeedback>

        {/* 5. More (Tools, AI Mentor, Community & Profile) */}
        <PressFeedback className="flex-1">
          <button
            onClick={onOpenMore}
            aria-label="Open More Features Drawer"
            className={`w-full flex flex-col items-center justify-center py-1 rounded-2xl transition-all min-h-[48px] touch-manipulation ${
              isMoreActive
                ? 'text-sky-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all duration-200 ${isMoreActive ? 'bg-sky-500/20 shadow-[0_0_12px_rgba(2,132,199,0.35)]' : ''}`}>
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">More</span>
          </button>
        </PressFeedback>
      </div>
    </nav>
  );
};
