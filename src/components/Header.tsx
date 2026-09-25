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
  ShieldCheck
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
      case 'dashboard':
      case 'student_dashboard':
        return {
          title: 'Study Dashboard',
          subtitle: 'Daily focus, progress, and exam countdown',
        };
      case 'syllabus':
        return {
          title: 'Syllabus Tracker',
          subtitle: 'Chapter-by-chapter curriculum checklist',
        };
      case 'wallpaper':
        return {
          title: 'Habit Wallpaper',
          subtitle: 'Lockscreen countdown generator',
        };
      case 'focus_shield':
        return {
          title: 'Focus Shield',
          subtitle: 'On-device app lock & distraction control',
        };
      case 'cbt_exam':
      case 'cbt':
        return {
          title: 'CBT Simulator',
          subtitle: 'Timed online mock examinations',
        };
      case 'pyq':
        return {
          title: 'PYQ Archive',
          subtitle: '35-year past exam papers & solutions',
        };
      case 'question_bank':
        return {
          title: 'Question Bank',
          subtitle: 'Topic-wise practice questions',
        };
      case 'flashcards':
        return {
          title: 'Flashcards',
          subtitle: 'Active recall spaced repetition decks',
        };
      case 'library':
        return {
          title: 'Digital Library',
          subtitle: 'NCERT textbooks & reference notes',
        };
      case 'timer':
        return {
          title: 'Focus Timer',
          subtitle: 'Deep-work Pomodoro intervals',
        };
      case 'tasks':
        return {
          title: 'Daily Tasks',
          subtitle: 'Study schedule & target checklist',
        };
      case 'chat':
        return {
          title: 'AI Study Mentor',
          subtitle: 'Instant concept doubts & evaluations',
        };
      case 'community':
        return {
          title: 'Community Feed',
          subtitle: 'Peer discussions & preparation tips',
        };
      case 'study_buddy':
        return {
          title: 'Study Buddy',
          subtitle: 'Accountability partner & co-study',
        };
      case 'weakness':
        return {
          title: 'Weakness Detector',
          subtitle: 'Diagnostic analysis & score booster',
        };
      case 'leaderboard':
        return {
          title: 'Leaderboard',
          subtitle: 'National study consistency rankings',
        };
      case 'eligibility':
        return {
          title: 'Eligibility Checker',
          subtitle: 'Age limits & attempt verification',
        };
      case 'premium':
      case 'earn_premium':
        return {
          title: 'PRO Membership',
          subtitle: 'Unlimited AI evaluations & mock tests',
        };
      case 'reward_milestones':
        return {
          title: 'Rewards & Milestones',
          subtitle: 'Study consistency perks & badges',
        };
      case 'teachers':
        return {
          title: 'Teacher Portal',
          subtitle: 'Educator console & test series',
        };
      case 'collaboration':
        return {
          title: 'Collaboration',
          subtitle: 'Student partnerships & ambassador perks',
        };
      case 'blog':
        return {
          title: 'Editorial & Articles',
          subtitle: 'Subject deep-dives & exam updates',
        };
      case 'blog_submit':
        return {
          title: 'Submit Article',
          subtitle: 'Share study notes with aspirants',
        };
      case 'feedback':
        return {
          title: 'Feedback',
          subtitle: 'Suggestions & support requests',
        };
      case 'podcasts':
        return {
          title: 'Topper Podcasts',
          subtitle: 'Audio lessons & topper revision advice',
        };
      case 'admin':
        return {
          title: 'Admin Panel',
          subtitle: 'System control & configuration',
        };
      default:
        return {
          title: 'Workspace',
          subtitle: 'Precision exam preparation',
        };
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
            <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
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
                : 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/25'
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
          <GraduationCap className="w-3.5 h-3.5 text-sky-400 shrink-0" />
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
            className="bg-transparent font-bold text-sky-300 max-w-[85px] sm:max-w-[140px] md:max-w-[180px] truncate focus:outline-none cursor-pointer border-none p-0 text-xs"
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
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-300 hover:text-white transition-colors shadow-sm"
            title="Personalize My Workspace"
            aria-label="Personalize My Workspace"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
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

        {/* Fullscreen Toggle (Desktop only) */}
        <button
          onClick={toggleFullscreen}
          className="hidden md:flex p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4 text-sky-400" /> : <Maximize className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Quick Focus Shield Access */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('focus_shield')}
            className={`w-9 h-9 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-xl border transition-all flex items-center justify-center gap-1.5 text-xs font-semibold ${
              activeTab === 'focus_shield'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border-slate-800'
            }`}
            title="Focus Shield & App Lock (PRO)"
            aria-label="Focus Shield Pro"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Focus</span>
            <span className="hidden sm:inline-block px-1 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              PRO
            </span>
          </button>
        )}

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

