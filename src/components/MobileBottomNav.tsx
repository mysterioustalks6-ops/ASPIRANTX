import React from 'react';
import { ActiveTab } from '../types';
import { Target, BookOpen, Award, BookMarked, Menu } from 'lucide-react';

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
  const isSyllabusActive = activeTab === 'syllabus';
  const isTestsActive = activeTab === 'cbt_exam' || activeTab === 'cbt';
  const isPyqActive = activeTab === 'pyq';
  const isMoreActive = !isHomeActive && !isSyllabusActive && !isTestsActive && !isPyqActive;

  return (
    <nav 
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 pb-safe md:hidden transition-all"
    >
      <div className="flex items-center justify-around px-2 py-1.5 h-16">
        {/* Home */}
        <button
          onClick={() => setActiveTab('student_dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[44px] ${
            isHomeActive
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${isHomeActive ? 'bg-indigo-500/15' : ''}`}>
            <Target className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        {/* Syllabus */}
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[44px] ${
            isSyllabusActive
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${isSyllabusActive ? 'bg-indigo-500/15' : ''}`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Syllabus</span>
        </button>

        {/* Mock Tests */}
        <button
          onClick={() => setActiveTab('cbt_exam')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[44px] ${
            isTestsActive
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${isTestsActive ? 'bg-indigo-500/15' : ''}`}>
            <Award className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">Tests</span>
        </button>

        {/* PYQs */}
        <button
          onClick={() => setActiveTab('pyq')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[44px] ${
            isPyqActive
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${isPyqActive ? 'bg-indigo-500/15' : ''}`}>
            <BookMarked className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">PYQs</span>
        </button>

        {/* More Drawer */}
        <button
          onClick={onOpenMore}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all min-h-[44px] ${
            isMoreActive
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${isMoreActive ? 'bg-indigo-500/15' : ''}`}>
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </div>
    </nav>
  );
};
