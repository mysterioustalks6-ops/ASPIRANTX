import React from 'react';
import { ActiveTab, UserProfile } from '../types';
import { EXAM_LIST } from '../lib/examList';
import { Flame, Sparkles, Clock, GraduationCap, Sliders, Search, Maximize, Minimize } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  activeTab: ActiveTab;
  user: UserProfile | null;
  selectedExam?: string;
  onExamChange?: (examId: string) => void;
  onOpenProfileModal?: () => void;
  onOpenCustomizerModal?: () => void;
  onOpenSearch?: () => void;
  onRequireLogin?: () => void;
  onNavigate?: (tab: string) => void;
  demoTimeFormatted?: string;
  demoSecondsRemaining?: number;
  isDemoExpired?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeTab, 
  user, 
  selectedExam,
  onExamChange,
  onOpenProfileModal,
  onOpenCustomizerModal,
  onOpenSearch,
  onRequireLogin,
  onNavigate,
  demoTimeFormatted,
  demoSecondsRemaining,
  isDemoExpired
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'syllabus':
        return {
          title: 'Syllabus Command Center',
          subtitle: 'Track GS, CSAT, Optional, and Tier-1/2 exam topics',
        };
      case 'timer':
        return {
          title: 'Focus Deep-Work Timer',
          subtitle: 'Pomodoro focus intervals with ambient soundscapes',
        };
      case 'tasks':
        return {
          title: 'Daily Study Tasks & PYQs',
          subtitle: 'Manage editorial reading, mock tests, and answer writing',
        };
      case 'chat':
        return {
          title: 'AI Study Mentor',
          subtitle: 'Instant answer structuring & syllabus doubt solver',
        };
      case 'premium':
        return {
          title: 'AspirantX PRO Access',
          subtitle: 'Unlock unlimited AI evaluation & mock test series',
        };
      default:
        return { title: 'Dashboard', subtitle: 'Overview' };
    }
  };

  const { title, subtitle } = getTabTitle();

  return (
    <header className="w-full bg-slate-950/80 border-b border-slate-800/80 px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md sticky top-0 z-20">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-100 tracking-tight">{title}</h2>
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="w-3 h-3" /> Active Session
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        {/* Demo Mode Countdown */}
        {user?.isGuest && (
          <button
            onClick={onRequireLogin}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all shadow-card ${
              isDemoExpired
                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30 animate-pulse'
                : (demoSecondsRemaining !== undefined && demoSecondsRemaining < 60)
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {isDemoExpired
                ? 'Demo Expired • Sign In'
                : demoTimeFormatted
                ? `Demo: ${demoTimeFormatted}`
                : 'Sign In'}
            </span>
          </button>
        )}

        {/* Selected Exam Pill Selector */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors"
          title="Change Target Exam"
        >
          <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="hidden sm:inline text-slate-400">Exam:</span>
          <select
            value={selectedExam || user?.exam || 'NEET_UG'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '__CREATE_CUSTOM__' && onOpenProfileModal) {
                onOpenProfileModal();
              } else if (onExamChange) {
                onExamChange(val);
              }
            }}
            className="bg-transparent font-bold text-slate-100 max-w-[130px] sm:max-w-[170px] truncate focus:outline-none cursor-pointer border-none p-0 text-xs"
          >
            {EXAM_LIST.map((ex) => (
              <option key={ex.id} value={ex.id} className="bg-slate-900 text-slate-200 font-medium">
                {ex.label.split(/[–—]/)[0].trim()}
              </option>
            ))}
            <option value="__CREATE_CUSTOM__" className="bg-slate-900 text-amber-400 font-bold">
              + Custom Exam...
            </option>
          </select>
        </div>

        {/* Customizer Launcher */}
        {onOpenCustomizerModal && (
          <button
            onClick={onOpenCustomizerModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
            title="App Customizer"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Studio</span>
          </button>
        )}

        {/* Streak Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
          <span className="font-semibold text-slate-200">{user?.streakDays ?? 1}d</span>
        </div>

        {/* Global Search Trigger */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors flex items-center gap-1 text-xs"
            title="Search Platform (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="hidden lg:inline text-xs text-slate-400">Search</span>
          </button>
        )}

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4 text-indigo-400" /> : <Maximize className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Notification Bell with Merged Announcements */}
        <NotificationCenter 
          onNavigate={onNavigate} 
          selectedExam={selectedExam || user?.exam || 'NEET_UG'} 
          userId={user?.id || user?.email || 'default_user'} 
        />

        {/* Profile Avatar */}
        <button
          id="header-profile-dashboard-btn"
          onClick={onOpenProfileModal}
          className="p-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors flex items-center gap-2 pr-2"
          title="Open Profile"
        >
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt="Profile"
            className="w-7 h-7 rounded-lg object-cover border border-slate-700"
          />
        </button>
      </div>
    </header>
  );
};

