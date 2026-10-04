import React, { useState, useMemo } from 'react';
import { ActiveTab, UserProfile } from '../types';
import { EXAM_LIST } from '../lib/examList';
import { 
  Flame, 
  Sparkles, 
  Clock, 
  GraduationCap, 
  Search, 
  Maximize, 
  Minimize, 
  LayoutGrid, 
  Menu,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { resolveUserAvatar } from '../lib/avatarStorage';
import { ExamSelectModal } from './ExamSelectModal';
import { CANONICAL_APP_RELEASE } from '../config/appRelease';

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
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);

  const currentExamId = selectedExam || user?.exam || 'NEET_UG';
  const currentExamLabel = useMemo(() => {
    const found = EXAM_LIST.find(e => e.id === currentExamId);
    if (found) return found.label.split(/[–—]/)[0].trim();
    return currentExamId;
  }, [currentExamId]);

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
          subtitle: 'Daily focus, targets, and exam countdown',
        };
      case 'syllabus':
        return {
          title: 'Syllabus Tracker',
          subtitle: 'Curriculum checklist and completion rate',
        };
      case 'wallpaper':
        return {
          title: 'Habit Wallpaper',
          subtitle: 'Lockscreen countdown generator',
        };
      case 'focus_shield':
        return {
          title: 'Focus Shield',
          subtitle: 'Distraction and app blocking control',
        };
      case 'cbt_exam':
      case 'cbt':
        return {
          title: 'CBT Simulator',
          subtitle: 'Timed All-India mock examinations',
        };
      case 'pyq':
        return {
          title: 'PYQ Archive',
          subtitle: '35-year past papers and solutions',
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
          subtitle: 'NCERT textbooks and study notes',
        };
      case 'timer':
        return {
          title: 'Focus Galaxy',
          subtitle: 'Deep-work scientific study intervals',
        };
      case 'tasks':
        return {
          title: 'Daily Tasks',
          subtitle: 'Study schedule and timetable checklist',
        };
      case 'chat':
        return {
          title: 'AI Study Mentor',
          subtitle: 'Instant doubts and answer evaluation',
        };
      case 'community':
        return {
          title: 'Community Feed',
          subtitle: 'Peer discussions and preparation tips',
        };
      case 'study_buddy':
        return {
          title: 'Study Buddy',
          subtitle: 'Accountability partner and co-study',
        };
      case 'weakness':
        return {
          title: 'Weakness Detector',
          subtitle: 'Diagnostic score booster',
        };
      case 'leaderboard':
        return {
          title: 'Leaderboard',
          subtitle: 'All-India study consistency rankings',
        };
      case 'eligibility':
        return {
          title: 'Eligibility Checker',
          subtitle: 'Age limits and attempt verification',
        };
      case 'premium':
      case 'earn_premium':
        return {
          title: 'PRO Membership',
          subtitle: 'Unlimited AI mentor and full mocks',
        };
      case 'reward_milestones':
      case 'rewards':
        return {
          title: 'Rewards & Milestones',
          subtitle: 'Study consistency perks and trophies',
        };
      case 'teachers':
        return {
          title: 'Teacher Portal',
          subtitle: 'Educator console and test series',
        };
      case 'collaboration':
        return {
          title: 'Collaboration',
          subtitle: 'Ambassador perks and student outreach',
        };
      case 'blog':
        return {
          title: 'Editorial & Articles',
          subtitle: 'Subject deep-dives and exam guidance',
        };
      case 'blog_submit':
        return {
          title: 'Submit Article',
          subtitle: 'Share study notes with aspirants',
        };
      case 'feedback':
        return {
          title: 'Feedback',
          subtitle: 'Suggestions and support requests',
        };
      case 'podcasts':
        return {
          title: 'Topper Podcasts',
          subtitle: 'Audio lessons and topper strategy',
        };
      case 'admin':
        return {
          title: 'Admin Panel',
          subtitle: 'System control and configuration',
        };
      case 'practice_hub':
        return {
          title: 'Practice Hub',
          subtitle: 'PYQ archives, question drills & CBT mocks',
        };
      case 'progress_hub':
        return {
          title: 'Progress & Telemetry',
          subtitle: 'Readiness radar and velocity forecast',
        };
      case 'more_hub':
        return {
          title: 'More Features & Tools',
          subtitle: 'Productivity engines, community & settings',
        };
      default:
        return {
          title: 'StudyRide Workspace',
          subtitle: 'Precision national exam preparation',
        };
    }
  };

  const { title, subtitle } = getTabTitle();

  return (
    <header className="w-full bg-[#0F1115]/95 border-b border-[#2A2F3A] px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 backdrop-blur-md sticky top-0 z-20 pt-safe">
      {/* Left: Mobile Hamburger + Clean App Branding & Page Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden w-10 h-10 rounded-xl bg-[#1A1D24] hover:bg-[#222732] border border-[#2A2F3A] text-[#9CA3AF] hover:text-[#F3F4F6] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <img 
          src="/logo.png" 
          alt="StudyRide Logo" 
          className="md:hidden w-8 h-8 rounded-xl object-cover border border-[#2A2F3A] shadow-sm shrink-0" 
        />

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base md:text-lg font-black text-[#F3F4F6] tracking-tight truncate">
              {title}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#1CB0F6]/15 border border-[#1CB0F6]/30 text-[#1CB0F6] shrink-0">
              v{CANONICAL_APP_RELEASE.version}
            </span>
            <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#58CC02]/15 text-[#58CC02] border border-[#58CC02]/30 shrink-0">
              <Sparkles className="w-3 h-3" /> Live
            </span>
          </div>
          <p className="text-[11px] text-[#9CA3AF] truncate hidden sm:block font-medium">{subtitle}</p>
        </div>
      </div>

      {/* Right: Tactile Scannable Status Bar & Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Guest Demo Mode Countdown */}
        {user?.isGuest && (
          <button
            onClick={onRequireLogin}
            className={`flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              isDemoExpired
                ? 'bg-[#FF4B4B]/15 text-[#FF6B6B] border border-[#FF4B4B]/40 animate-pulse'
                : (demoSecondsRemaining !== undefined && demoSecondsRemaining < 60)
                ? 'bg-[#FF9600]/15 text-[#FFA726] border border-[#FF9600]/40 animate-pulse'
                : 'bg-[#58CC02] hover:bg-[#5FDB02] text-[#0B2300] border-b-2 border-[#46A302] active:border-b-0 active:translate-y-0.5 shadow-sm'
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

        {/* Selected Exam Tactile Pill Selector */}
        <button
          onClick={() => setIsExamModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1A1D24] hover:bg-[#222732] border border-[#2A2F3A] border-b-2 hover:border-[#383F4E] active:border-b-0 active:translate-y-0.5 text-xs font-bold text-[#F3F4F6] transition-all cursor-pointer shadow-sm group select-none"
          title="Search & Change Target Exam"
          aria-label={`Target Exam: ${currentExamLabel}. Click to change.`}
        >
          <GraduationCap className="w-3.5 h-3.5 text-[#1CB0F6] shrink-0" />
          <span className="font-bold text-[#1CB0F6] max-w-[80px] sm:max-w-[130px] md:max-w-[170px] truncate text-xs">
            {currentExamLabel}
          </span>
          <Search className="w-3 h-3 text-[#9CA3AF] group-hover:text-[#1CB0F6] shrink-0 ml-0.5" />
        </button>

        {/* Exam Select Modal */}
        <ExamSelectModal
          isOpen={isExamModalOpen}
          onClose={() => setIsExamModalOpen(false)}
          selectedExam={currentExamId}
          onExamChange={(val) => {
            if (onExamChange) onExamChange(val);
          }}
          onOpenCustomModal={onOpenProfileModal}
        />

        {/* Scannable Streak Indicator */}
        <div 
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FF9600]/15 text-[#FFA726] border border-[#FF9600]/30 text-xs font-black select-none"
          title={`${user?.streakDays ?? 1} Days Active Study Streak`}
        >
          <Flame className="w-3.5 h-3.5 text-[#FF9600] fill-[#FF9600]" />
          <span>{user?.streakDays ?? 1}d</span>
        </div>

        {/* Scannable XP / Level Pill */}
        {user && (user.xp !== undefined || user.level !== undefined) && (
          <div 
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#1CB0F6]/15 text-[#38BDF8] border border-[#1CB0F6]/30 text-xs font-black select-none"
            title={`Level ${user.level || 1} • ${user.xp || 0} XP`}
          >
            <Zap className="w-3.5 h-3.5 text-[#1CB0F6] fill-[#1CB0F6]" />
            <span>{user.xp || 0} XP</span>
          </div>
        )}

        {/* Workspace Customizer Launcher (Desktop) */}
        {onOpenWorkspaceCustomizer && (
          <button
            onClick={onOpenWorkspaceCustomizer}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#1A1D24] hover:bg-[#222732] border border-[#2A2F3A] text-xs font-bold text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors cursor-pointer"
            title="Personalize My Workspace"
            aria-label="Personalize My Workspace"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-[#1CB0F6]" />
            <span className="hidden lg:inline">Workspace</span>
          </button>
        )}

        {/* Global Search Trigger (Ctrl+K) */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="w-9 h-9 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-xl bg-[#1A1D24] hover:bg-[#222732] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#2A2F3A] transition-colors flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Search Platform (Ctrl+K)"
            aria-label="Search Platform"
          >
            <Search className="w-4 h-4 text-[#9CA3AF]" />
            <span className="hidden lg:inline text-xs text-[#9CA3AF]">Search</span>
          </button>
        )}

        {/* Fullscreen Toggle (Desktop only) */}
        <button
          onClick={toggleFullscreen}
          className="hidden md:flex p-2 rounded-xl bg-[#1A1D24] hover:bg-[#222732] text-[#9CA3AF] hover:text-[#F3F4F6] border border-[#2A2F3A] transition-colors cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4 text-[#1CB0F6]" /> : <Maximize className="w-4 h-4" />}
        </button>

        {/* Focus Shield Shortcut */}
        {onNavigate && (
          <button
            onClick={() => onNavigate('focus_shield')}
            className={`w-9 h-9 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-xl border transition-all flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer ${
              activeTab === 'focus_shield'
                ? 'bg-[#58CC02]/20 text-[#58CC02] border-[#58CC02]/50 shadow-[0_0_12px_rgba(88,204,2,0.25)]'
                : 'bg-[#1A1D24] hover:bg-[#222732] text-[#9CA3AF] hover:text-[#58CC02] border-[#2A2F3A]'
            }`}
            title="Focus Shield Distraction Blocker"
            aria-label="Focus Shield Pro"
          >
            <ShieldCheck className="w-4 h-4 text-[#58CC02]" />
            <span className="hidden sm:inline">Focus</span>
            <span className="hidden sm:inline-block px-1 py-0.2 rounded text-[9px] font-black bg-[#58CC02]/20 text-[#58CC02] border border-[#58CC02]/30">
              PRO
            </span>
          </button>
        )}

        {/* Notification Bell Drawer */}
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
          className="w-9 h-9 rounded-xl bg-[#1A1D24] hover:bg-[#222732] border border-[#2A2F3A] hover:border-[#383F4E] transition-colors flex items-center justify-center p-0.5 cursor-pointer"
          title="Open Student Profile"
          aria-label="Open Student Profile"
        >
          <img
            src={resolveUserAvatar(user?.avatar_url, user?.id, user?.email)}
            alt="Profile Avatar"
            className="w-full h-full rounded-lg object-cover"
          />
        </button>
      </div>
    </header>
  );
};
