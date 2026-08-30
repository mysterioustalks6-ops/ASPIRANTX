import React from 'react';
import { ActiveTab } from '../types';
import { Target, BookOpen, Award, BookMarked, Smartphone, Menu } from 'lucide-react';

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
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/90 pb-safe md:hidden transition-all shadow-[0_-4px_20px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-center justify-around px-2 py-1.5 h-16 max-w-md mx-auto">
        {/* Home */}
        <button
          onClick={() => setActiveTab('student_dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all min-h-[48px] touch-manipulation active:scale-90 ${
            isHomeActive
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-200 ${isHomeActive ? 'bg-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : ''}`}>
            <Target className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Home</span>
        </button>

        {/* Syllabus */}
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all min-h-[48px] touch-manipulation active:scale-90 ${
            isSyllabusActive
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-200 ${isSyllabusActive ? 'bg-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : ''}`}>
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Syllabus</span>
        </button>

        {/* Mock Tests */}
        <button
          onClick={() => setActiveTab('cbt_exam')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all min-h-[48px] touch-manipulation active:scale-90 ${
            isTestsActive
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-200 ${isTestsActive ? 'bg-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : ''}`}>
            <Award className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">Tests</span>
        </button>

        {/* PYQs */}
        <button
          onClick={() => setActiveTab('pyq')}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all min-h-[48px] touch-manipulation active:scale-90 ${
            isPyqActive
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-200 ${isPyqActive ? 'bg-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : ''}`}>
            <BookMarked className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">PYQs</span>
        </button>

        {/* More Drawer */}
        <button
          onClick={onOpenMore}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-2xl transition-all min-h-[48px] touch-manipulation active:scale-90 ${
            isMoreActive
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all duration-200 ${isMoreActive ? 'bg-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.4)]' : ''}`}>
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight font-medium">More</span>
        </button>
      </div>
    </nav>
  );
};
