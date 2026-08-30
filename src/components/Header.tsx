import React from 'react';
import { ActiveTab, UserProfile } from '../types';
import { EXAM_LIST } from '../lib/examList';
import { 
  Flame, 
  Sparkles, 
  Clock, 
  GraduationCap, 
  Sliders, 
  Search, 
  Maximize, 
  Minimize, 
  LayoutGrid, 
  Menu,
  Download 
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  activeTab: ActiveTab;
  user: UserProfile | null;
  selectedExam?: string;
  onExamChange?: (examId: string) => void;
  onOpenProfileModal?: () => void;
  onOpenCustomizerModal?: () => void;
  onOpenWorkspaceCustomizer?: () => void;
  onOpenSearch?: () => void;
  onRequireLogin?: () => void;
  onNavigate?: (tab: string) => void;
  onOpenMobileMenu?: () => void;
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
  onOpenWorkspaceCustomizer,
  onOpenSearch,
  onRequireLogin,
  onNavigate,
  onOpenMobileMenu,
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
      case 'cbt_exam':
      case 'cbt':
        return {
          title: 'CBT Mock Test Simulator',
          subtitle: 'Real-time online exam series with instant evaluation',
        };
      case 'pyq':
        return {
          title: 'PYQ Archive & Predictor',
          subtitle: '35+ years past exam papers with AI model solutions',
        };
      case 'question_bank':
        return {
          title: 'Question Bank Engine',
          subtitle: 'Topic-wise practice questions & smart filters',
        };
      case 'flashcards':
        return {
          title: 'Active Recall Flashcards',
          subtitle: 'Spaced repetition decks for rapid revision',
        };
      case 'library':
        return {
          title: 'Digital Resource Library',
          subtitle: 'NCERTs, standard books & curated toppers notes',
        };
      case 'timer':
        return {
          title: 'Focus Deep-Work Timer',
          subtitle: 'Pomodoro focus intervals with ambient soundscapes',
        };
      case 'tasks':
        return {
          title: 'Daily Study Tasks & Schedule',
          subtitle: 'Manage editorial reading, mock tests, and answer writing',
        };
      case 'chat':
        return {
          title: 'AI Study Mentor',
          subtitle: 'Instant answer structuring & syllabus doubt solver',
        };
      case 'community':
        return {
          title: 'Peer Study Community',
          subtitle: 'Collaborate with fellow serious aspirants',
        };
      case 'weakness':
        return {
          title: 'AI Weakness Detector',
          subtitle: 'Telemetry diagnostic & targeted revision roadmap',
        };
      case 'premium':
      case 'earn_premium':
        return {
          title: 'AspirantX PRO Access',
          subtitle: 'Unlock unlimited AI evaluation & mock test series',
        };
      default:
        return { title: 'Candidate Telemetry', subtitle: 'Live Study Dashboard & Metrics' };
    }
  };

  const { title, subtitle } = getTabTitle();

  return (
    <header className="w-full bg-slate-950/90 border-b border-slate-800/80 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4 backdrop-blur-md sticky top-0 z-20 pt-safe">
      {/* Left: Mobile Hamburger + Titles */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center justify-center shrink-0 transition-colors"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-100 tracking-tight truncate">
              {title}
            </h2>
            <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <Sparkles className="w-3 h-3" /> Live
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate hidden sm:block">{subtitle}</p>
        </div>
      </div>

      {/* Right: Controls & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Demo Mode Countdown */}
        {user?.isGuest && (
          <button
            onClick={onRequireLogin}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl font-semibold text-xs transition-all shadow-card ${
              isDemoExpired
                ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30 animate-pulse'
                : (demoSecondsRemaining !== undefined && demoSecondsRemaining < 60)
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">
              {isDemoExpired
                ? 'Demo Expired • Sign In'
                : demoTimeFormatted
                ? `Demo: ${demoTimeFormatted}`
                : 'Sign In'}
            </span>
            <span className="sm:hidden text-[11px]">Demo</span>
          </button>
        )}

        {/* Selected Exam Pill Selector */}
        <div
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors"
          title="Change Target Exam"
        >
          <GraduationCap className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
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
            className="bg-transparent font-bold text-indigo-300 max-w-[85px] sm:max-w-[140px] md:max-w-[180px] truncate focus:outline-none cursor-pointer border-none p-0 text-xs"
          >
            {EXAM_LIST.map((ex) => (
              <option key={ex.id} value={ex.id} className="bg-slate-900 text-slate-200 font-medium">
                {ex.label.split(/[–—]/)[0].trim()}
              </option>
            ))}
            <option value="__CREATE_CUSTOM__" className="bg-slate-900 text-amber-400 font-bold">
              + Custom...
            </option>
          </select>
        </div>

        {/* Workspace Customizer Launcher (Desktop/Tablet) */}
        {onOpenWorkspaceCustomizer && (
          <button
            onClick={onOpenWorkspaceCustomizer}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-xs font-semibold text-indigo-300 transition-colors shadow-sm"
            title="Personalize My Workspace"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline">Workspace</span>
          </button>
        )}

        {/* Streak Badge */}
        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
          <span className="font-semibold text-slate-200">{user?.streakDays ?? 1}d</span>
        </div>

        {/* Global Search Trigger */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="w-9 h-9 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors flex items-center justify-center gap-1.5 text-xs"
            title="Search Platform (Ctrl+K)"
            aria-label="Search"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="hidden lg:inline text-xs text-slate-400">Search</span>
          </button>
        )}

        {/* Download App direct button */}
        <a
          href="/aspirantx.apk"
          download="AspirantX.apk"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all shadow-sm"
          title="Download AspirantX Android APK"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Get App</span>
        </a>

        {/* Fullscreen Toggle (Desktop only) */}
        <button
          onClick={toggleFullscreen}
          className="hidden md:flex p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4 text-indigo-400" /> : <Maximize className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Notification Bell */}
        <NotificationCenter 
          onNavigate={onNavigate} 
          selectedExam={selectedExam || user?.exam || 'NEET_UG'} 
          userId={user?.id || user?.email || 'default_user'} 
          onOpenWorkspaceCustomizer={onOpenWorkspaceCustomizer}
        />

        {/* Profile Avatar */}
        <button
          id="header-profile-dashboard-btn"
          onClick={onOpenProfileModal}
          className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors flex items-center justify-center p-0.5"
          title="Open Profile"
          aria-label="Open Profile"
        >
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt="Profile"
            className="w-full h-full rounded-lg object-cover border border-slate-700"
          />
        </button>
      </div>
    </header>
  );
};

