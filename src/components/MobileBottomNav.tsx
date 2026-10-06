import React from 'react';
import { ActiveTab } from '../types';
import { Compass, Map, BookOpen, Trophy, User } from 'lucide-react';
import { soundFx } from '../lib/soundEffects';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenMore?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const isTodayActive = activeTab === 'student_dashboard' || activeTab === 'dashboard';
  const isMapActive = activeTab === 'syllabus';
  const isPracticeActive = activeTab === 'practice_hub' || activeTab === 'cbt' || activeTab === 'cbt_exam' || activeTab === 'pyq' || activeTab === 'question_bank';
  const isLeagueActive = activeTab === 'leaderboard' || activeTab === 'progress_hub' || activeTab === 'weakness';
  const isMeActive = activeTab === 'more_hub' || (!isTodayActive && !isMapActive && !isPracticeActive && !isLeagueActive);

  const handleTabSwitch = (tab: ActiveTab) => {
    soundFx.playTap();
    soundFx.triggerHaptic(12);
    setActiveTab(tab);
  };

  return (
    <nav 
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--sr-surface)] border-t-2 border-[var(--sr-line-strong)] pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:hidden select-none shadow-lg"
    >
      <div className="flex items-center justify-around px-2 py-1 h-16 max-w-md mx-auto">
        {/* 1. Today (Aaj ki Ride) */}
        <button
          onClick={() => handleTabSwitch('dashboard')}
          aria-label="Today Study Hub"
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 rounded-2xl min-h-[48px] touch-manipulation cursor-pointer transition-all active:scale-95 ${
            isTodayActive ? 'text-[var(--sr-primary)]' : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)]'
          }`}
        >
          <div 
            className={`p-1.5 rounded-xl transition-all ${
              isTodayActive 
                ? 'bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] font-black' 
                : ''
            }`}
          >
            <Compass className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className={`text-[10px] sm:text-xs mt-0.5 tracking-tight max-w-full px-0.5 truncate text-center ${isTodayActive ? 'font-black text-[var(--sr-primary)]' : 'font-bold'}`}>
            Today
          </span>
        </button>

        {/* 2. Map (Territory Syllabus) */}
        <button
          onClick={() => handleTabSwitch('syllabus')}
          aria-label="Curriculum Territory Map"
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 rounded-2xl min-h-[48px] touch-manipulation cursor-pointer transition-all active:scale-95 ${
            isMapActive ? 'text-[var(--sr-blue)]' : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)]'
          }`}
        >
          <div 
            className={`p-1.5 rounded-xl transition-all ${
              isMapActive 
                ? 'bg-[var(--sr-blue-subtle)] text-[var(--sr-blue)] font-black' 
                : ''
            }`}
          >
            <Map className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className={`text-[10px] sm:text-xs mt-0.5 tracking-tight max-w-full px-0.5 truncate text-center ${isMapActive ? 'font-black text-[var(--sr-blue)]' : 'font-bold'}`}>
            Map
          </span>
        </button>

        {/* 3. Practice (Drill / Mock / PYQ) */}
        <button
          onClick={() => handleTabSwitch('practice_hub')}
          aria-label="Practice Hub & Mock Tests"
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 rounded-2xl min-h-[48px] touch-manipulation cursor-pointer transition-all active:scale-95 ${
            isPracticeActive ? 'text-[var(--sr-purple)]' : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)]'
          }`}
        >
          <div 
            className={`p-1.5 rounded-xl transition-all ${
              isPracticeActive 
                ? 'bg-[var(--sr-purple-subtle)] text-[var(--sr-purple)] font-black' 
                : ''
            }`}
          >
            <BookOpen className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className={`text-[10px] sm:text-xs mt-0.5 tracking-tight max-w-full px-0.5 truncate text-center ${isPracticeActive ? 'font-black text-[var(--sr-purple)]' : 'font-bold'}`}>
            Practice
          </span>
        </button>

        {/* 4. League (Ranks & Predictions) */}
        <button
          onClick={() => handleTabSwitch('leaderboard')}
          aria-label="National Leagues & Ranks"
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 rounded-2xl min-h-[48px] touch-manipulation cursor-pointer transition-all active:scale-95 ${
            isLeagueActive ? 'text-[var(--sr-amber)]' : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)]'
          }`}
        >
          <div 
            className={`p-1.5 rounded-xl transition-all ${
              isLeagueActive 
                ? 'bg-[var(--sr-amber-subtle)] text-[var(--sr-amber)] font-black' 
                : ''
            }`}
          >
            <Trophy className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className={`text-[10px] sm:text-xs mt-0.5 tracking-tight max-w-full px-0.5 truncate text-center ${isLeagueActive ? 'font-black text-[var(--sr-amber)]' : 'font-bold'}`}>
            League
          </span>
        </button>

        {/* 5. Me (Profile, Tools, Settings) */}
        <button
          onClick={() => handleTabSwitch('more_hub')}
          aria-label="Candidate Profile and Tools"
          className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 rounded-2xl min-h-[48px] touch-manipulation cursor-pointer transition-all active:scale-95 ${
            isMeActive ? 'text-[var(--sr-primary)]' : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)]'
          }`}
        >
          <div 
            className={`p-1.5 rounded-xl transition-all ${
              isMeActive 
                ? 'bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] font-black' 
                : ''
            }`}
          >
            <User className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className={`text-[10px] sm:text-xs mt-0.5 tracking-tight max-w-full px-0.5 truncate text-center ${isMeActive ? 'font-black text-[var(--sr-primary)]' : 'font-bold'}`}>
            Me
          </span>
        </button>
      </div>
    </nav>
  );
};
