import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence } from 'motion/react';
import { PageTransition } from './lib/animations';
import { UserProfile, ActiveTab } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { loadUserProfile, saveUserProfile } from './lib/gamification';
import { resolveUserAvatar, storeUserAvatar } from './lib/avatarStorage';
import { recordPerfMarker } from './lib/apiDeduplicator';
import { logAuthDiagnostic } from './lib/authDiagnostics';
import { EXAM_LIST } from './lib/examList';
import { ExamProvider, useExam } from './context/ExamContext';
import { normalizeExamId } from './lib/examNormalize';
import { academicService } from './lib/services';
import { Header } from './components/Header';
import { GamificationBar } from './components/GamificationBar';
import { DailyQuoteCard } from './components/DailyQuote';
import { BackgroundFX } from './components/BackgroundFX';
import { ErrorBoundary } from './components/ErrorBoundary';
import { reportFrontendError } from './lib/errorReporter';
import { loadCustomizerSettings, fetchServerCustomizerSettings, AppCustomizerSettings } from './lib/customizer';
import { getRemainingDemoSeconds, formatDemoTime, startDemoSession, fetchServerDemoDurationMinutes } from './lib/demoSession';
import { PremiumGate, FeatureFlagsMap } from './components/PremiumGate';
import { AdSenseBanner } from './components/AdSenseBanner';
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';
import { VersionUpdateNotifier } from './components/VersionUpdateNotifier';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileDrawer } from './components/MobileDrawer';
import { AppSplashScreen } from './components/AppSplashScreen';
import { shouldPromptWallpaperSetup, fetchWallpaperStatus, isAndroidPlatform } from './lib/nativeWallpaperBridge';
import { checkAndTriggerStudyReminder, getDailyStudySummary } from './lib/studyReminderService';
import { fetchServerWorkspaceConfig, recordFeatureUsage } from './lib/workspacePreferences';
import { contentPackageManager } from './lib/contentPackageManager';
import { syncWorker } from './lib/syncWorker';
import { Shield, KeyRound, X, Check, Lock as LockIcon, Sparkles, Sliders, XCircle, ShieldCheck, Smartphone } from 'lucide-react';

// Lazy Loaded Enterprise Modules for Optimal Bundle Performance
const StudentDashboard = lazy(() => import('./components/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const CommunityPlatform = lazy(() => import('./components/CommunityPlatform').then(m => ({ default: m.CommunityPlatform })));
const LeaderboardView = lazy(() => import('./components/LeaderboardView').then(m => ({ default: m.LeaderboardView })));
const CbtExamEngine = lazy(() => import('./components/CbtExamEngine').then(m => ({ default: m.CbtExamEngine })));
const AdminPanel = lazy(() => import('./components/AdminPanel').then(m => ({ default: m.AdminPanel })));
const PremiumPlans = lazy(() => import('./components/PremiumPlans').then(m => ({ default: m.PremiumPlans })));
const EarnPremium = lazy(() => import('./components/EarnPremium').then(m => ({ default: m.EarnPremium })));
const StudyBuddy = lazy(() => import('./components/StudyBuddy').then(m => ({ default: m.StudyBuddy })));
const RewardMilestones = lazy(() => import('./components/RewardMilestones').then(m => ({ default: m.RewardMilestones })));
const SponsorshipCollaboration = lazy(() => import('./components/SponsorshipCollaboration').then(m => ({ default: m.SponsorshipCollaboration })));
const LibraryEngine = lazy(() => import('./components/LibraryEngine').then(m => ({ default: m.LibraryEngine })));
const FlashcardEngine = lazy(() => import('./components/FlashcardEngine').then(m => ({ default: m.FlashcardEngine })));
const WeaknessDetector = lazy(() => import('./components/WeaknessDetector').then(m => ({ default: m.WeaknessDetector })));
const TeacherPortal = lazy(() => import('./components/TeacherPortal').then(m => ({ default: m.TeacherPortal })));
const PodcastSeries = lazy(() => import('./components/PodcastSeries').then(m => ({ default: m.PodcastSeries })));
const EligibilityChecker = lazy(() => import('./components/EligibilityChecker').then(m => ({ default: m.EligibilityChecker })));
const SecurityWrapper = lazy(() => import('./components/SecurityWrapper').then(m => ({ default: m.SecurityWrapper })));
const FeedbackEngine = lazy(() => import('./components/FeedbackEngine').then(m => ({ default: m.FeedbackEngine })));
const BlogView = lazy(() => import('./components/BlogView').then(m => ({ default: m.BlogView })));
const TeacherBlogSubmit = lazy(() => import('./components/TeacherBlogSubmit').then(m => ({ default: m.TeacherBlogSubmit })));
const RewardsHub = lazy(() => import('./components/RewardsHub').then(m => ({ default: m.RewardsHub })));
const FocusShieldView = lazy(() => import('./components/FocusShieldView').then(m => ({ default: m.FocusShieldView })));
const DownloadPage = lazy(() => import('./components/DownloadPage').then(m => ({ default: m.DownloadPage })));
const GalaxyDebugScreen = lazy(() => import('./features/focus/screens/GalaxyDebugScreen').then(m => ({ default: m.GalaxyDebugScreen })));
const DesignSystemShowcase = lazy(() => import('./components/DesignSystemShowcase').then(m => ({ default: m.DesignSystemShowcase })));
const SyllabusTracker = lazy(() => import('./components/SyllabusTracker').then(m => ({ default: m.SyllabusTracker })));
const PyqEngine = lazy(() => import('./components/PyqEngine').then(m => ({ default: m.PyqEngine })));
const QuestionBankEngine = lazy(() => import('./components/QuestionBankEngine').then(m => ({ default: m.QuestionBankEngine })));
const HighwayFocusTimer = lazy(() => import('./features/focus/bike/HighwayFocusTimer').then(m => ({ default: m.HighwayFocusTimer })));
const GarageScreen = lazy(() => import('./features/focus/bike/GarageScreen').then(m => ({ default: m.GarageScreen })));
const MyRidesScreen = lazy(() => import('./features/focus/bike/MyRidesScreen').then(m => ({ default: m.MyRidesScreen })));
const MountainRidePage = lazy(() => import('./features/mountain-ride/MountainRidePage').then(m => ({ default: m.MountainRidePage })));
const AssetCheckScreen = import.meta.env.DEV
  ? lazy(() => import('./features/focus/bike/AssetCheckScreen').then(m => ({ default: m.AssetCheckScreen })))
  : (() => null) as unknown as React.ComponentType<{ onBack?: () => void }>;
const FocusGalaxyScreen = lazy(() => import('./features/focus/galaxy/FocusGalaxyScreen').then(m => ({ default: m.FocusGalaxyScreen })));
const TaskManager = lazy(() => import('./components/TaskManager').then(m => ({ default: m.TaskManager })));
const AiStudyChat = lazy(() => import('./components/AiStudyChat').then(m => ({ default: m.AiStudyChat })));
const FigmaRedesignPreview = lazy(() => import('./components/FigmaRedesignPreview').then(m => ({ default: m.FigmaRedesignPreview })));
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const PracticeHub = lazy(() => import('./components/PracticeHub').then(m => ({ default: m.PracticeHub })));
const UserProfileModal = lazy(() => import('./components/UserProfileModal').then(m => ({ default: m.UserProfileModal })));
const ExamWallpaperWidget = lazy(() => import('./components/ExamWallpaperWidget').then(m => ({ default: m.ExamWallpaperWidget })));
const MapJourneyView = lazy(() => import('./components/MapJourneyView').then(m => ({ default: m.MapJourneyView })));
const Sidebar = lazy(() => import('./components/Sidebar').then(m => ({ default: m.Sidebar })));
const ProgressHub = lazy(() => import('./components/ProgressHub').then(m => ({ default: m.ProgressHub })));
const MoreHub = lazy(() => import('./components/MoreHub').then(m => ({ default: m.MoreHub })));
const AppCustomizerModal = lazy(() => import('./components/AppCustomizerModal').then(m => ({ default: m.AppCustomizerModal })));
const WorkspaceCustomizer = lazy(() => import('./components/WorkspaceCustomizer').then(m => ({ default: m.WorkspaceCustomizer })));
const ReferralModal = lazy(() => import('./components/ReferralModal').then(m => ({ default: m.ReferralModal })));
const DemoExpiredModal = lazy(() => import('./components/DemoExpiredModal').then(m => ({ default: m.DemoExpiredModal })));
const GlobalSearchModal = lazy(() => import('./components/GlobalSearchModal').then(m => ({ default: m.GlobalSearchModal })));
const ReminderSettingsModal = lazy(() => import('./components/ReminderSettingsModal').then(m => ({ default: m.ReminderSettingsModal })));
const LiveWallpaperSetupModal = lazy(() => import('./components/LiveWallpaperSetupModal').then(m => ({ default: m.LiveWallpaperSetupModal })));
const OnboardingWizard = lazy(() => import('./components/OnboardingWizard').then(m => ({ default: m.OnboardingWizard })));
import { AchievementUnlockModal } from './components/AchievementUnlockModal';
import { TrophyUnlock } from './lib/rewards/rewardEngine';

const EXAMS = EXAM_LIST;

const SuspenseFallback = () => (
  <div className="p-12 text-center text-slate-400 space-y-3">
    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
    <div className="text-xs font-semibold tracking-wide uppercase text-indigo-400">Loading Enterprise View...</div>
  </div>
);

export const DESIGNATED_ADMIN_EMAIL = 'ambujyadav0010@gmail.com';

function AppContent() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = typeof window !== 'undefined' ? (localStorage.getItem('studyride_user') || localStorage.getItem('aspirantx_auth_user') || localStorage.getItem('aspirantx_user_profile')) : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('aspirantx_sidebar_collapsed') === 'true';
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('aspirantx_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Authoritative selectedExam from central ExamContext (user.exam always takes priority when user is present)
  const { selectedExamId, setSelectedExamId } = useExam();
  const selectedExam = (user?.exam ? normalizeExamId(user.exam) : null) || selectedExamId;

  // Sync profile exam with ExamContext whenever user profile loads
  useEffect(() => {
    if (user?.exam) {
      const norm = normalizeExamId(user.exam);
      if (norm !== selectedExamId) {
        setSelectedExamId(norm, { persist: true, syncUser: false, userId: user?.id });
      }
    }
  }, [user?.exam, selectedExamId, setSelectedExamId, user?.id]);

  // Global Frontend Error Listeners for Uncaught Exceptions & Promise Rejections
  useEffect(() => {
    const handleUncaughtError = (event: ErrorEvent) => {
      reportFrontendError({
        message: event.message || 'Uncaught Error',
        stack: event.error?.stack || null,
        context: { filename: event.filename, lineno: event.lineno, colno: event.colno, url: window.location.href },
        severity: 'error'
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = typeof reason === 'string' ? reason : (reason?.message || 'Unhandled Promise Rejection');
      const stack = reason?.stack || null;
      reportFrontendError({
        message,
        stack,
        context: { reason: String(reason || ''), url: window.location.href },
        severity: 'error'
      });
    };

    window.addEventListener('error', handleUncaughtError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUncaughtError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Initialize Local-First Offline Database and Background Sync Engine
  useEffect(() => {
    contentPackageManager.seedBundledContentIfEmpty().catch((err) => {
      console.warn('Local content package auto-seed notice:', err);
    });
    syncWorker.init();
  }, []);

  // Handler: called when profile updates user exam
  const handleExamChange = (examId: string) => {
    const norm = normalizeExamId(examId);
    setSelectedExamId(norm, { persist: true, syncUser: true, userId: user?.id });
    setUser((prev) => (prev ? { ...prev, exam: norm } : prev));

    if (user?.id) {
      try {
        const cacheKey = `aspirantx_profile_cache_${user.id}`;
        const existingRaw = localStorage.getItem(cacheKey);
        const existing = existingRaw ? JSON.parse(existingRaw) : {};
        const localAv = localStorage.getItem(`aspirantx_avatar_${user.id}`);
        localStorage.setItem(cacheKey, JSON.stringify({
          ...existing,
          userId: user.id,
          targetExam: norm,
          exam: norm,
          avatar_url: resolveUserAvatar(user.avatar_url, user.id, user.email),
          profileComplete: true,
          updatedAt: new Date().toISOString(),
        }));
      } catch (err) {
        logAuthDiagnostic('EXAM_CHANGE', 'failed to update fast profile cache', { error: String(err) });
      }
    }

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch('/api/user/set-exam', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ exam: norm, email: user?.email }),
        });
      } catch (err) {
        logAuthDiagnostic('EXAM_CHANGE', 'failed to persist exam change to backend', { error: String(err) });
      }
    })();
  };
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined' && (window.location.pathname === '/download' || window.location.pathname === '/debug-galaxy' || window.location.pathname === '/debug/galaxy' || (import.meta.env.DEV && window.location.pathname === '/design-system'))) {
      if (window.location.pathname.startsWith('/debug')) return 'debug_galaxy';
      if (import.meta.env.DEV && window.location.pathname === '/design-system') return 'design_system';
      return 'download';
    }
    const hash = window.location.hash.replace('#', '');
    if (hash === 'mountain-ride' || hash === 'mountain_ride') return 'mountain_ride';
    if (hash.startsWith('blog-submit')) return 'blog_submit';
    if (hash.startsWith('blog')) return 'blog';
    if (hash === 'debug-galaxy' || hash === 'debug/galaxy' || hash === 'galaxy-debug') return 'debug_galaxy';
    if (import.meta.env.DEV && (hash === 'design-system' || hash === 'design_system')) return 'design_system';
    const validTabs = ['syllabus','pyq','question_bank','timer','garage','my_rides','mountain_ride','tasks','chat',
      'dashboard','cbt','leaderboard','community','premium','earn_premium','admin',
      'library', 'flashcards', 'weakness', 'teachers', 'podcasts', 'eligibility', 'feedback', 'blog', 'blog_submit', 'wallpaper',
      'rewards', 'reward_milestones', 'focus_shield', 'download', 'practice_hub', 'progress_hub', 'more_hub', 'debug_galaxy', ...(import.meta.env.DEV ? ['design_system'] : [])];
    return (validTabs.includes(hash) ? hash : 'dashboard') as ActiveTab;
  });
  const [trophyQueue, setTrophyQueue] = useState<TrophyUnlock[]>([]);
  const [isFocusTimerRunning, setIsFocusTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    if (window.location.hash.includes('access_token=') || window.location.hash.includes('error=') || window.location.hash.includes('refresh_token=')) {
      return;
    }
    if (activeTab === 'blog_submit') {
      // Preserve token in hash if already present
      if (!window.location.hash.includes('blog-submit/')) {
        window.location.hash = activeTab;
      }
    } else {
      window.location.hash = activeTab;
    }
  }, [activeTab]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('blog-submit') || hash === 'blog_submit') {
        setActiveTab('blog_submit');
      } else if (hash === 'blog' || hash.startsWith('blog/')) {
        setActiveTab('blog');
      } else if (hash === 'debug-galaxy' || hash === 'debug/galaxy' || hash === 'galaxy-debug') {
        setActiveTab('debug_galaxy');
      } else if (hash) {
        setActiveTab(hash as ActiveTab);
      }
    };
    const onNavigateTab = (e: any) => {
      const target = typeof e.detail === 'string' ? e.detail : e.detail?.tab;
      if (target) {
        setActiveTab(target as ActiveTab);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('aspirantx_navigate_tab', onNavigateTab);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('aspirantx_navigate_tab', onNavigateTab);
    };
  }, []);
  const [initializing, setInitializing] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && (localStorage.getItem('studyride_user') || localStorage.getItem('aspirantx_auth_user') || localStorage.getItem('studyride_skip_splash') === 'true')) {
      return false;
    }
    return true;
  });
  const [splashFinished, setSplashFinished] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && (window.location.search.includes('no_splash') || localStorage.getItem('studyride_skip_splash') === 'true')) {
      return true;
    }
    return false;
  });
  const [bannedMessage, setBannedMessage] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [profileModalInitialTab, setProfileModalInitialTab] = useState<'overview' | 'badges' | 'awards' | 'edit'>('overview');
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);
  const [showCustomizerModal, setShowCustomizerModal] = useState<boolean>(false);
  const [showWorkspaceCustomizer, setShowWorkspaceCustomizer] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [showCompanionWidget, setShowCompanionWidget] = useState<boolean>(true);
  const [isCompanionMinimized, setIsCompanionMinimized] = useState<boolean>(true);
  const [showReminderSettingsModal, setShowReminderSettingsModal] = useState<boolean>(false);
  const [showWallpaperSetupModal, setShowWallpaperSetupModal] = useState<boolean>(false);
  const [customizer, setCustomizer] = useState<AppCustomizerSettings>(loadCustomizerSettings());

  // Non-intrusive: Wallpaper setup is only opened on explicit user action (e.g. from Wallpaper tab)
  // Auto-popup removed so students can study immediately without setup interruptions

  // Global listener for opening wallpaper setup modal
  useEffect(() => {
    const handleOpenWallpaperSetup = () => setShowWallpaperSetupModal(true);
    window.addEventListener('aspirantx_open_wallpaper_setup', handleOpenWallpaperSetup);
    return () => window.removeEventListener('aspirantx_open_wallpaper_setup', handleOpenWallpaperSetup);
  }, []);

  // Background check for daily study reminder trigger (1 per day, non-intrusive)
  useEffect(() => {
    if (!user) return;
    const runReminderCheck = () => {
      checkAndTriggerStudyReminder(user, selectedExam || user.exam);
    };
    runReminderCheck();
    const interval = setInterval(runReminderCheck, 60000);
    return () => clearInterval(interval);
  }, [user, selectedExam]);

  // Global listener for opening study reminder settings from anywhere in the app
  useEffect(() => {
    const handleOpenReminderSettings = () => setShowReminderSettingsModal(true);
    window.addEventListener('aspirantx_open_reminder_settings', handleOpenReminderSettings);
    return () => window.removeEventListener('aspirantx_open_reminder_settings', handleOpenReminderSettings);
  }, []);

  // Fetch and cache user workspace preferences from server asynchronously
  useEffect(() => {
    if (user?.id) {
      fetchServerWorkspaceConfig(user.id);
    }
  }, [user?.id]);

  // Keyboard shortcut listener for Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    const handleOpenSearch = () => setShowSearchModal(true);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('studyride:open-search', handleOpenSearch);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('studyride:open-search', handleOpenSearch);
    };
  }, []);


  // User Presence Heartbeat (with 10s AbortController timeout & visibilitychange pause)
  useEffect(() => {
    let intervalId: any = null;
    let abortController: AbortController | null = null;

    const ping = () => {
      if (document.visibilityState === 'hidden') return;
      if (abortController) {
        abortController.abort();
      }
      abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController?.abort();
      }, 10000);

      fetch('/api/user/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortController.signal,
        body: JSON.stringify({
          userId: user?.id || 'guest_' + Math.random().toString(36).substring(2, 8),
          email: user?.email || 'guest@studyride.in',
          name: user?.name || 'Guest User',
          exam: user?.exam || 'UPSC CSE'
        })
      })
        .catch(() => {})
        .finally(() => clearTimeout(timeoutId));
    };

    const startInterval = () => {
      if (!intervalId) {
        intervalId = setInterval(ping, 75000);
      }
    };

    const stopInterval = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        ping();
        startInterval();
      } else {
        stopInterval();
        if (abortController) {
          abortController.abort();
        }
      }
    };

    if (document.visibilityState === 'visible') {
      ping();
      startInterval();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopInterval();
      if (abortController) {
        abortController.abort();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Dynamic SEO Controller: updates document.title, description, and keywords based on context
  useEffect(() => {
    if (!user) return;
    
    const activeExam = (user.exam ? normalizeExamId(user.exam) : null) || selectedExamId || 'NEET_UG';
    const examLabel = activeExam.replace(/_/g, ' ');
    let title = `StudyRide - Prep Suite for ${examLabel}`;
    let description = `Prepare for ${examLabel} on StudyRide. Practice custom CBT test series, mock exams, previous year question papers (PYQs), track syllabus, and study with an interactive AI Mentor.`;
    
    switch (activeTab) {
      case 'syllabus':
        title = `Syllabus Tracker & Progress Chart for ${examLabel} - StudyRide`;
        description = `Track your ${examLabel} syllabus topics, subtopics, and preparation logs in real-time. Optimize your speed and accuracy.`;
        break;
      case 'pyq':
        title = `${examLabel} Previous Year Questions (PYQs) Engine - StudyRide`;
        description = `Browse, filter, and practice past year questions (PYQ papers) for ${examLabel} with deep explanation solutions.`;
        break;
      case 'cbt':
      case 'cbt_exam':
        title = `CBT Mock Exams & Practice Tests for ${examLabel} - StudyRide`;
        description = `Attempt online computer-based test series, full mocks, and section-wise papers for ${examLabel} in a simulated CBT interface.`;
        break;
      case 'leaderboard':
        title = `${examLabel} Student Leaderboard & Ranks - StudyRide`;
        description = `See where you stand in the state and national rankings for ${examLabel} preparation. Earn badges, coins, and levels.`;
        break;
      case 'chat':
      case 'study_buddy':
        title = `AI Study Buddy & Mentor for ${examLabel} - StudyRide`;
        description = `Resolve doubts instantly, generate tailored quizzes, and analyze difficult syllabus topics for ${examLabel} with our AI study buddy.`;
        break;
      default:
        title = `${examLabel} Prep Dashboard & Curriculum - StudyRide`;
        break;
    }
    
    // Update browser title
    document.title = title;
    
    // Update meta description
    const descEl = document.querySelector('meta[name="description"]');
    if (descEl) {
      descEl.setAttribute('content', description);
    }
    
    // Update OpenGraph title & description
    const ogTitleEl = document.querySelector('meta[property="og:title"]');
    if (ogTitleEl) ogTitleEl.setAttribute('content', title);
    
    const ogDescEl = document.querySelector('meta[property="og:description"]');
    if (ogDescEl) ogDescEl.setAttribute('content', description);
  }, [activeTab, user?.exam, selectedExamId]);

  // Demo Session Live Countdown State
  const [demoSecondsRemaining, setDemoSecondsRemaining] = useState<number>(() => getRemainingDemoSeconds());
  const [isDemoExpired, setIsDemoExpired] = useState<boolean>(false);

  // Live timer effect for Demo Mode
  useEffect(() => {
    if (!user?.isGuest) {
      setIsDemoExpired(false);
      return;
    }

    const checkDemoTimer = () => {
      const remaining = getRemainingDemoSeconds();
      setDemoSecondsRemaining(remaining);
      if (remaining <= 0) {
        setIsDemoExpired(true);
      } else {
        setIsDemoExpired(false);
      }
    };

    checkDemoTimer();
    const timerInterval = setInterval(checkDemoTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [user?.isGuest]);

  // Listen to customizer & demo updates across the app
  useEffect(() => {
    // Initial fetch from server Admin Database
    fetchServerCustomizerSettings().then((res) => {
      setCustomizer(res);
    });
    fetchServerDemoDurationMinutes();

    const handleCustomizerUpdate = () => {
      setCustomizer(loadCustomizerSettings());
    };
    window.addEventListener('aspirantx_customizer_updated', handleCustomizerUpdate);
    return () => window.removeEventListener('aspirantx_customizer_updated', handleCustomizerUpdate);
  }, []);

  // Hidden Admin Panel & Secret Trigger State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Realtime Feature Flags Map ({ [feature_name]: boolean })
  const [featureFlagsMap, setFeatureFlagsMap] = useState<FeatureFlagsMap>({});

  const isAdmin = isAdminUnlocked || user?.role === 'ADMIN' || user?.email === DESIGNATED_ADMIN_EMAIL;

  // Background hook that periodically fetches the latest syllabus completion stats from the server for all exams assigned to the user profile
  const useSyllabusCompletionStats = (currentUser: UserProfile | null) => {
    const [completionStats, setCompletionStats] = useState<Record<string, { total: number; completed: number; percentage: number }>>({});
    const [loadingStats, setLoadingStats] = useState<boolean>(false);

    const userId = currentUser?.id;
    const userExam = currentUser?.exam || 'NEET_UG';

    useEffect(() => {
      if (!userId) return;

      const exams: string[] = [
        userExam,
        ...(Array.isArray((currentUser as any)?.targetExams) ? (currentUser as any).targetExams : [])
      ];
      const uniqueExams = Array.from(new Set(exams));

      const fetchStats = async () => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          return; // Skip background polling when tab is not visible
        }
        setLoadingStats(true);
        const statsMap: Record<string, { total: number; completed: number; percentage: number }> = {};
        try {
          for (const exam of uniqueExams) {
            let completedIds: string[] = [];
            try {
              const saved = localStorage.getItem(`aspirantx_completed_subtopics_${exam}`);
              if (saved) completedIds = JSON.parse(saved);
            } catch (e) {}

            try {
              const data = await academicService.getSyllabusStats(exam);
              if (data && data.success) {
                const total = data.total || 0;
                const completed = Math.max(data.completed || 0, completedIds.length);
                const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
                statsMap[exam] = { total, completed, percentage };
              }
            } catch (fetchErr) {
              // Graceful fallback to local count if network error
              const localTotal = 50;
              const completed = completedIds.length;
              statsMap[exam] = { total: localTotal, completed, percentage: Math.round((completed / localTotal) * 100) };
            }
          }
          setCompletionStats((prev) => {
            if (JSON.stringify(prev) === JSON.stringify(statsMap)) return prev;
            return statsMap;
          });
        } catch (e) {
          console.warn('Background syllabus completion stats fetch warning:', e);
        } finally {
          setLoadingStats(false);
        }
      };

      fetchStats();
      const intervalId = setInterval(fetchStats, 120000); // Efficient 2-minute interval

      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          fetchStats();
        }
      };
      document.addEventListener('visibilitychange', onVisibilityChange);

      return () => {
        clearInterval(intervalId);
        document.removeEventListener('visibilitychange', onVisibilityChange);
      };
    }, [userId, userExam]);

    return { completionStats, loadingStats };
  };

  const { completionStats, loadingStats } = useSyllabusCompletionStats(user);

  // Android hardware back button handler for top-level modals and navigation stack
  useEffect(() => {
    const handleBackPressed = (e: Event) => {
      if (showSearchModal) {
        e.preventDefault();
        setShowSearchModal(false);
        return;
      }
      if (showProfileModal) {
        e.preventDefault();
        setShowProfileModal(false);
        return;
      }
      if (showReferralModal) {
        e.preventDefault();
        setShowReferralModal(false);
        return;
      }
      if (showCustomizerModal) {
        e.preventDefault();
        setShowCustomizerModal(false);
        return;
      }
      if (showWorkspaceCustomizer) {
        e.preventDefault();
        setShowWorkspaceCustomizer(false);
        return;
      }
      if (showReminderSettingsModal) {
        e.preventDefault();
        setShowReminderSettingsModal(false);
        return;
      }
      if (showWallpaperSetupModal) {
        e.preventDefault();
        setShowWallpaperSetupModal(false);
        return;
      }
      if (showPasscodeModal) {
        e.preventDefault();
        setShowPasscodeModal(false);
        return;
      }
      // If on a sub-view on mobile and not in CBT test, return to dashboard
      if (activeTab !== 'dashboard' && activeTab !== 'student_dashboard' && activeTab !== 'cbt' && activeTab !== 'cbt_exam') {
        e.preventDefault();
        setActiveTab('dashboard');
        return;
      }
    };
    window.addEventListener('studyride_back_pressed', handleBackPressed);
    return () => window.removeEventListener('studyride_back_pressed', handleBackPressed);
  }, [
    showSearchModal,
    showProfileModal,
    showReferralModal,
    showCustomizerModal,
    showWorkspaceCustomizer,
    showReminderSettingsModal,
    showWallpaperSetupModal,
    showPasscodeModal,
    activeTab
  ]);

  const fetchFeatureFlags = async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1000);
      const res = await fetch('/api/feature-flags', { 
        cache: 'no-store',
        signal: controller.signal
      }).catch(() => null);
      clearTimeout(timer);

      if (!res || !res.ok) return;
      const data = await res.json().catch(() => ({}));
      if (data && Array.isArray(data.flags)) {
        const map: FeatureFlagsMap = {};
        data.flags.forEach((f: { feature_name: string; is_premium: boolean }) => {
          map[f.feature_name] = f.is_premium;
        });
        setFeatureFlagsMap(map);
      }
    } catch (e) {
      console.warn('Feature flags load warning:', e instanceof Error ? e.message : e);
    }
  };

  useEffect(() => {
    fetchFeatureFlags();

    const handleGamificationUpdated = (e: any) => {
      const updatedProfile = e.detail;
      if (updatedProfile) {
        setUser((prev) => {
          if (!prev) return updatedProfile;
          return {
            ...prev,
            xp: typeof updatedProfile.xp === 'number' ? updatedProfile.xp : prev.xp,
            coins: typeof updatedProfile.coins === 'number' ? updatedProfile.coins : prev.coins,
            level: typeof updatedProfile.level === 'number' ? updatedProfile.level : prev.level,
            streakDays: typeof updatedProfile.streakDays === 'number' ? updatedProfile.streakDays : prev.streakDays,
            lastActiveDate: updatedProfile.lastActiveDate || prev.lastActiveDate,
            premiumUntil: updatedProfile.premiumUntil || prev.premiumUntil,
            isPremium: updatedProfile.isPremium !== undefined ? updatedProfile.isPremium : prev.isPremium,
          };
        });
      }
    };

    const handleStreakUpdated = (e: any) => {
      const { streakDays, lastActiveDate } = e.detail || {};
      if (typeof streakDays === 'number') {
        setUser((prev) => {
          if (!prev) return prev;
          const updated = {
            ...prev,
            streakDays,
            lastActiveDate: lastActiveDate || prev.lastActiveDate,
          };
          try {
            const key = `aspirantx_user_profile_v3_${prev.id || 'guest'}`;
            localStorage.setItem(key, JSON.stringify(updated));
          } catch (err) {}
          return updated;
        });
      }
    };

    window.addEventListener('aspirantx_gamification_updated', handleGamificationUpdated);
    window.addEventListener('aspirantx_streak_updated', handleStreakUpdated);
    return () => {
      window.removeEventListener('aspirantx_gamification_updated', handleGamificationUpdated);
      window.removeEventListener('aspirantx_streak_updated', handleStreakUpdated);
    };
  }, []);

  // Check Supabase Auth session on load
  useEffect(() => {
    let unmounted = false;
    recordPerfMarker('authStart');
    logAuthDiagnostic('AUTH', 'checkAuthSession started');

    // Guaranteed Failsafe: Never allow initial loading screen to hang for more than 600ms
    const failsafeTimer = setTimeout(() => {
      if (!unmounted) {
        recordPerfMarker('appShellRendered');
        setInitializing(false);
      }
    }, 600);

    async function checkAuthSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        recordPerfMarker('authResolved');
        const session = data?.session;

        logAuthDiagnostic('AUTH', 'session existence', {
          hasSession: Boolean(session),
          userId: session?.user?.id || null,
          email: session?.user?.email || null,
          tokenAvailable: Boolean(session?.access_token),
          error: error?.message || null,
        });

        if (session?.user && !unmounted) {
          recordPerfMarker('profileStart');
          logAuthDiagnostic('PROFILE', 'profile request started', { userId: session.user.id });

          const email = session.user.email || '';
          const isDesignatedAdmin = email.toLowerCase() === DESIGNATED_ADMIN_EMAIL.toLowerCase();

          // 1. FAST PER-USER CACHE CHECK FOR IMMEDIATE APP SHELL RESOLUTION
          const cacheKey = `aspirantx_profile_cache_${session.user.id}`;
          const cachedRaw = localStorage.getItem(cacheKey);
          let cachedProfile: any = null;
          if (cachedRaw) {
            try { cachedProfile = JSON.parse(cachedRaw); } catch (e) {}
          }

          const hasValidCache = cachedProfile && cachedProfile.userId === session.user.id && (cachedProfile.profileComplete || cachedProfile.targetExam);
          const cachedExam = (cachedProfile?.targetExam || cachedProfile?.exam || localStorage.getItem('aspirantx_global_selected_exam') || 'NEET_UG');

          if (hasValidCache) {
            const cachedAvatar = resolveUserAvatar(
              cachedProfile.avatar_url,
              session.user.id,
              email
            );

            const immediateUser: UserProfile = {
              id: session.user.id,
              name: cachedProfile.name || email.split('@')[0] || 'Aspirant',
              email,
              avatar_url: cachedAvatar,
              exam: cachedExam,
              targetYear: cachedProfile.targetYear || 2026,
              streakDays: 1,
              isPremium: false,
              studyHoursToday: 0,
              xp: 0,
              coins: 0,
              level: 1,
              isProfileComplete: true,
              role: isDesignatedAdmin ? 'ADMIN' : 'USER',
            };
            setSelectedExamId(cachedExam, { persist: false, syncUser: false, userId: immediateUser.id });
            setUser(immediateUser);
            if (isDesignatedAdmin) setIsAdminUnlocked(true);
            setInitializing(false);
          }

          // Exchange Supabase Access Token with Server to obtain verified Application JWT
          if (session.access_token) {
            try {
              if (!localStorage.getItem('aspirantx_auth_token')) {
                localStorage.setItem('aspirantx_auth_token', session.access_token);
              }
              const controller = new AbortController();
              const fetchTimer = setTimeout(() => controller.abort(), 8000);
              const res = await fetch('/api/auth/token', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
                signal: controller.signal
              }).catch(() => null);
              clearTimeout(fetchTimer);

              logAuthDiagnostic('AUTH', 'token exchange status', { status: res?.status || 'failed' });

              if (res && res.status === 403) {
                const errData = await res.json().catch(() => ({}));
                if (errData.error === 'ACCOUNT_BANNED') {
                  try {
                    await supabase.auth.signOut();
                  } catch (e) {}
                  localStorage.removeItem('aspirantx_auth_token');
                  setBannedMessage(errData.message || 'Your account has been suspended for violating community guidelines.');
                  setInitializing(false);
                  return;
                }
              }
              if (res && res.ok) {
                const tokenData = await res.json().catch(() => ({}));
                if (tokenData.token) {
                  localStorage.setItem('aspirantx_auth_token', tokenData.token);
                }
              }
            } catch (authExErr) {
              console.warn('Failed to exchange Supabase token for internal JWT:', authExErr);
            }
          }

          // Load user-scoped profile stats (background resolution, non-blocking if cached)
          try {
            const profile = await loadUserProfile(session.user.id);
            recordPerfMarker('profileResolved');
            logAuthDiagnostic('PROFILE', 'profile resolved', {
              exam: profile.exam,
              isComplete: profile.isProfileComplete,
            });

            if (!unmounted) {
              const isComp = Boolean(profile.isProfileComplete || (profile.exam && profile.exam.trim() !== '') || hasValidCache);
              const u: UserProfile = {
                ...profile,
                id: session.user.id,
                name: profile.name || session.user.user_metadata?.full_name || email.split('@')[0] || 'Aspirant',
                email,
                avatar_url: resolveUserAvatar(profile.avatar_url, session.user.id, email),
                role: isDesignatedAdmin ? 'ADMIN' : (profile.role || 'USER'),
                isProfileComplete: isComp,
              };

              // AUTHORITATIVE EXAM RESOLUTION BEFORE SHELL RENDER
              const resolvedExam = normalizeExamId(u.exam || cachedExam || 'NEET_UG');
              u.exam = resolvedExam;
              setSelectedExamId(resolvedExam, { persist: true, syncUser: false, userId: u.id });
              recordPerfMarker('examResolved');
              logAuthDiagnostic('PROFILE', 'target exam resolved', { exam: resolvedExam });

              setUser(u);
              if (isDesignatedAdmin) {
                setIsAdminUnlocked(true);
              }
            }
          } catch (profileErr) {
            console.warn('Profile background fetch error, keeping existing state:', profileErr);
          }
        } else if (!session?.user) {
          logAuthDiagnostic('NAVIGATION', 'Redirecting to /signin', { reason: 'No active session found on initial session check' });
        }
      } catch (err) {
        console.warn('Session check warning:', err);
      } finally {
        clearTimeout(failsafeTimer);
        if (!unmounted) {
          recordPerfMarker('appShellRendered');
          setInitializing(false);
          logAuthDiagnostic('NAVIGATION', 'Initialization finished', { ready: true });
        }
      }
    }

    checkAuthSession();
    return () => { unmounted = true; clearTimeout(failsafeTimer); };
  }, []);

  useEffect(() => {
    if (supabase?.auth?.onAuthStateChange) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
        logAuthDiagnostic('AUTH', `auth state event: ${event}`, {
          hasSession: Boolean(session?.user),
          userId: session?.user?.id || null,
        });

        if (event === 'SIGNED_OUT') {
          logAuthDiagnostic('NAVIGATION', 'Redirecting to /signin', { reason: 'SIGNED_OUT auth event received' });
          if (user?.id) {
            localStorage.removeItem(`aspirantx_profile_cache_${user.id}`);
            try {
              const keysToRemove: string[] = [];
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (
                  k &&
                  (k.includes(user.id) ||
                    k.startsWith('aspirantx_kanban_') ||
                    k.startsWith('aspirantx_subtopic_progress_') ||
                    k.startsWith('aspirantx_local_store_') ||
                    k.startsWith('aspirantx_cbt_results_'))
                ) {
                  keysToRemove.push(k);
                }
              }
              keysToRemove.forEach((k) => localStorage.removeItem(k));
            } catch (cleanErr) {}
          }
          localStorage.removeItem('aspirantx_global_selected_exam');
          localStorage.removeItem('aspirantx_cbt_results_cache');
          setUser(null);
          setIsAdminUnlocked(false);
          localStorage.removeItem('aspirantx_auth_token');
          return;
        }

        if (event === 'TOKEN_REFRESHED') {
          // Only refresh the internal JWT exchange, don't touch user/profile state
          if (session?.access_token) {
            try {
              const res = await fetch('/api/auth/token', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
              });
              if (res.status === 403) {
                const errData = await res.json().catch(() => ({}));
                if (errData.error === 'ACCOUNT_BANNED') {
                  try {
                    await supabase.auth.signOut();
                  } catch (e) {}
                  localStorage.removeItem('aspirantx_auth_token');
                  setBannedMessage(errData.message || 'Your account has been suspended for violating community guidelines.');
                  return;
                }
              }
              if (res.ok) {
                const tokenData = await res.json().catch(() => ({}));
                if (tokenData.token) {
                  localStorage.setItem('aspirantx_auth_token', tokenData.token);
                }
              }
            } catch (e) {
              console.error('Token refresh exchange failed:', e);
            }
          }
          return; // IMPORTANT: skip profile refetch + setUser/setSelectedExam below
        }

        // Do NOT wipe user state on non-signout auth events (e.g. USER_UPDATED, SIGNED_IN)
        if (session?.user) {
          const email = session.user.email || '';
          const isDesignatedAdmin = email.toLowerCase() === DESIGNATED_ADMIN_EMAIL.toLowerCase();

          if (session.access_token) {
            try {
              const res = await fetch('/api/auth/token', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
              });
              if (res.status === 403) {
                const errData = await res.json().catch(() => ({}));
                if (errData.error === 'ACCOUNT_BANNED') {
                  try {
                    await supabase.auth.signOut();
                  } catch (e) {}
                  localStorage.removeItem('aspirantx_auth_token');
                  setBannedMessage(errData.message || 'Your account has been suspended for violating community guidelines.');
                  return;
                }
              }
              if (res.ok) {
                const tokenData = await res.json().catch(() => ({}));
                if (tokenData.token) {
                  localStorage.setItem('aspirantx_auth_token', tokenData.token);
                }
              }
            } catch (authExErr) {
              console.error('Failed to exchange Supabase token for internal JWT on auth state change:', authExErr);
            }
          }

          logAuthDiagnostic('PROFILE', 'onAuthStateChange loading profile', { userId: session.user.id });
          try {
            const profile = await loadUserProfile(session.user.id);
            const resolvedExam = profile.exam || selectedExam || 'NEET_UG';
            setSelectedExamId(resolvedExam, { persist: true, syncUser: false, userId: session.user.id });
            localStorage.setItem('aspirantx_global_selected_exam', resolvedExam);

            setUser((prev) => {
              const isComp = Boolean(profile.isProfileComplete || (profile.exam && profile.exam.trim() !== '') || prev?.isProfileComplete);
              const resolvedAvatar = resolveUserAvatar(profile.avatar_url || prev?.avatar_url, session.user.id, email);
              const next: UserProfile = {
                ...prev,
                ...profile,
                id: session.user.id,
                name: profile.name || prev?.name || session.user.user_metadata?.full_name || email.split('@')[0] || 'Aspirant',
                email,
                avatar_url: resolvedAvatar,
                role: isDesignatedAdmin ? 'ADMIN' : (profile.role || 'USER'),
                isProfileComplete: isComp,
              };
              const changed = !prev || JSON.stringify(next) !== JSON.stringify(prev);
              return changed ? next : prev;
            });
            if (isDesignatedAdmin) {
              setIsAdminUnlocked(true);
            }
          } catch (e) {
            console.warn('onAuthStateChange profile refresh warning:', e);
          }
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Sync user state with document cookies for edge middleware & server auth
  useEffect(() => {
    if (user) {
      document.cookie = `user_email=${encodeURIComponent(user.email)}; path=/; max-age=86400; SameSite=Strict; Secure`;
      document.cookie = `user_role=${encodeURIComponent(user.role || 'USER')}; path=/; max-age=86400; SameSite=Strict; Secure`;

      // Verify premium status strictly against backend database
      fetch(`/api/user/subscription?email=${encodeURIComponent(user.email)}`, { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => {
          const isVerified = Boolean(data.isPremium);
          const source = data.premiumSource || null;
          if (user.isPremium !== isVerified || user.premiumSource !== source) {
            setUser((prev) => (prev ? { ...prev, isPremium: isVerified, premiumSource: source } : prev));
          }
        })
        .catch(() => {});
    } else {
      document.cookie = `user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; Secure`;
      document.cookie = `user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; Secure`;
    }
  }, [user?.email]);

  // Secret Double-Tap Logo Trigger Handler for Admin Mode
  const handleTriggerAdminSecret = () => {
    const isAuthorized =
      user?.email?.trim().toLowerCase() === DESIGNATED_ADMIN_EMAIL.toLowerCase() ||
      user?.email?.trim().toLowerCase() === (process.env.ADMIN_EMAIL || 'ambujyadav0010@gmail.com').toLowerCase() ||
      user?.role === 'ADMIN';

    if (isAuthorized || isAdminUnlocked) {
      setIsAdminUnlocked(true);
      setActiveTab('admin');
      setToastMessage('👑 Admin Panel Unlocked!');
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      setShowPasscodeModal(true);
    }
  };

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setPasscodeError('Please sign in with an Administrator account.');
      return;
    }
    const isAuthorized =
      user.role === 'ADMIN' ||
      user.email?.trim().toLowerCase() === DESIGNATED_ADMIN_EMAIL.toLowerCase();

    if (isAuthorized) {
      setIsAdminUnlocked(true);
      setActiveTab('admin');
      setShowPasscodeModal(false);
      setPasscodeInput('');
      setPasscodeError(null);
      setToastMessage('👑 Administrator Access Confirmed!');
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      setPasscodeError('Access Denied: Account lacks verified ADMIN privileges.');
    }
  };

  const handleSelectTab = (tab: ActiveTab) => {
    if (tab === 'admin') {
      const isAuthorized =
        user?.email?.trim().toLowerCase() === DESIGNATED_ADMIN_EMAIL.toLowerCase() ||
        user?.email?.trim().toLowerCase() === (process.env.ADMIN_EMAIL || 'ambujyadav0010@gmail.com').toLowerCase() ||
        user?.role === 'ADMIN' ||
        isAdminUnlocked;

      if (!isAuthorized) {
        setActiveTab('syllabus');
        return;
      }
    }
    recordFeatureUsage(tab, user?.id);
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    logAuthDiagnostic('NAVIGATION', 'Redirecting to /signin', { reason: 'User clicked Logout button' });
    if (supabase?.auth?.signOut) {
      await supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem('aspirantx_auth_token');
    setUser(null);
    setIsAdminUnlocked(false);
  };

  if (bannedMessage) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8 text-center shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <XCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">Account Suspended</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              {bannedMessage}
            </p>
          </div>
          <button
            onClick={() => {
              setBannedMessage(null);
              window.location.reload();
            }}
            className="w-full py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-cyan-500/20"
          >
            Return to Login / Refresh
          </button>
        </div>
      </div>
    );
  }

  if (!splashFinished || initializing) {
    return (
      <AppSplashScreen
        minDuration={1600}
        isReady={!initializing}
        onFinish={() => setSplashFinished(true)}
      />
    );
  }

  if (import.meta.env.DEV && activeTab === 'design_system') {
    return <DesignSystemShowcase />;
  }

  if (!user) {
    logAuthDiagnostic('NAVIGATION', 'Rendering Sign In page (LandingPage)', { reason: 'No active user in app state' });
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <LandingPage
          onLoginSuccess={(u) => {
            logAuthDiagnostic('AUTH', 'onLoginSuccess triggered', { userId: u.id, email: u.email });
            
            const storedExam = u.exam || localStorage.getItem('aspirantx_global_selected_exam') || 'NEET_UG';
            setSelectedExamId(storedExam, { persist: true, syncUser: false, userId: u.id });
            localStorage.setItem('aspirantx_global_selected_exam', storedExam);

            const immediateUser: UserProfile = {
              ...u,
              avatar_url: resolveUserAvatar(u.avatar_url, u.id, u.email),
              exam: storedExam,
              isProfileComplete: true,
              role: (u.email?.toLowerCase() === DESIGNATED_ADMIN_EMAIL.toLowerCase()) ? 'ADMIN' : (u.role || 'USER'),
            };

            // INSTANT SYNCHRONOUS TRANSITION TO APP SHELL
            localStorage.setItem('studyride_user', JSON.stringify(immediateUser));
            localStorage.setItem('aspirantx_auth_user', JSON.stringify(immediateUser));
            setUser(immediateUser);
            if (u.email?.toLowerCase() === DESIGNATED_ADMIN_EMAIL.toLowerCase()) {
              setIsAdminUnlocked(true);
            }

            // Background Profile Enrichment (Non-blocking)
            (async () => {
              try {
                const profile = await loadUserProfile(u.id);
                const resolvedExam = profile.exam || storedExam;
                setSelectedExamId(resolvedExam, { persist: true, syncUser: false, userId: u.id });
                localStorage.setItem('aspirantx_global_selected_exam', resolvedExam);

                setUser((prev) => {
                  if (!prev) return prev;
                  return {
                    ...profile,
                    ...prev,
                    exam: resolvedExam,
                    isProfileComplete: true,
                  };
                });
              } catch (err) {
                console.warn('Background profile enrichment warning:', err);
              }
            })();
          }}
        />
      </Suspense>
    );
  }

  if (user && user.isProfileComplete === false && !user.exam) {
    return (
      <Suspense fallback={<SuspenseFallback />}>
        <OnboardingWizard
          user={user}
          onComplete={async (updatedProfile) => {
            const finalProfile: UserProfile = { ...updatedProfile, isProfileComplete: true };
            await saveUserProfile(finalProfile);
            if (finalProfile.exam) {
              handleExamChange(finalProfile.exam);
            }
            setUser(finalProfile);
          }}
        />
      </Suspense>
    );
  }

  return (
    <ErrorBoundary>
      <VersionUpdateNotifier />
      <SecurityWrapper user={user!} enabled={user?.role !== 'ADMIN' && user?.role !== 'DEVELOPER'}>
      <div className="min-h-screen bg-[var(--bg,#12161F)] text-[var(--sr-text,#F8FAFC)] flex flex-col md:flex-row font-sans selection:bg-[var(--sr-primary)] selection:text-[var(--sr-on-primary)] relative">
      {/* Background Animated Canvas FX & Particles */}
      <BackgroundFX customizer={customizer} />

      {/* Secret Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-2xl bg-[#00FF94] text-slate-950 font-bold text-xs shadow-[0_0_25px_rgba(0,255,148,0.5)] flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Secret Admin Passcode Modal */}
      {showPasscodeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Secret Admin Panel Unlock</h3>
                  <p className="text-[11px] text-slate-400">Enter Admin Passcode or Admin Email</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPasscodeModal(false);
                  setPasscodeError(null);
                  setPasscodeInput('');
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyPasscode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Passcode / Key
                </label>
                <input
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Enter secret key or admin email..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
                {passcodeError && (
                  <p className="text-[11px] text-rose-400 font-medium mt-1.5">{passcodeError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasscodeModal(false);
                    setPasscodeError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/20"
                >
                  Unlock Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      {activeTab !== 'mountain_ride' && (
        <Suspense fallback={null}>
          <Sidebar
            activeTab={activeTab}
            setActiveTab={handleSelectTab}
            user={user}
            onLogout={handleLogout}
            isAdminUnlocked={isAdminUnlocked}
            onTriggerAdminSecret={handleTriggerAdminSecret}
            onOpenProfileModal={() => setShowProfileModal(true)}
            onOpenReferralModal={() => setShowReferralModal(true)}
            onOpenCustomizerModal={isAdmin ? () => setShowCustomizerModal(true) : undefined}
            onOpenWorkspaceCustomizer={() => setShowWorkspaceCustomizer(true)}
            customizer={customizer}
            selectedExam={selectedExam}
            onExamChange={handleExamChange}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebarCollapse}
          />
        </Suspense>
      )}

      {/* Main Content Dashboard Area with Full-Width Screen Workspace */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Slim Header: Visible across mobile and desktop except full-screen focus modes */}
        {!['focus_shield', 'timer', 'mountain_ride'].includes(activeTab) && (
          <Header
            activeTab={activeTab}
            user={user}
            selectedExam={selectedExam}
            onExamChange={handleExamChange}
            onOpenProfileModal={() => setShowProfileModal(true)}
            onOpenCustomizerModal={isAdmin ? () => setShowCustomizerModal(true) : undefined}
            onOpenWorkspaceCustomizer={() => setShowWorkspaceCustomizer(true)}
            onOpenSearch={() => setShowSearchModal(true)}
            onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
            onRequireLogin={() => setUser(null)}
            onNavigate={(t) => setActiveTab(t as ActiveTab)}
            demoTimeFormatted={formatDemoTime(demoSecondsRemaining)}
            demoSecondsRemaining={demoSecondsRemaining}
            isDemoExpired={isDemoExpired}
          />
        )}

        {/* Gamification Bar: Relocated from global header to dedicated Rewards & Milestones experience to eliminate cognitive clutter */}
        {activeTab === 'reward_milestones' && (
          <GamificationBar 
            onOpenPremiumTab={() => setActiveTab('premium')} 
            onOpenReferralModal={() => setShowReferralModal(true)}
          />
        )}

        {/* Dashboard Main Scroll Workspace */}
        <main className={`flex-1 w-full mx-auto transition-all duration-200 ${
          activeTab === 'focus_shield'
            ? 'p-0 space-y-0 pb-32 md:pb-8 min-h-screen overflow-y-auto'
            : activeTab === 'timer' || activeTab === 'mountain_ride'
            ? 'p-0 space-y-0 pb-0 min-h-screen'
            : `p-3 sm:p-5 md:p-8 space-y-6 md:space-y-8 pb-32 md:pb-8 min-h-screen overflow-y-auto ${
                isSidebarCollapsed ? 'max-w-[1600px]' : 'max-w-7xl'
              }`
        }`}>
          {(activeTab === 'dashboard' || activeTab === 'student_dashboard') && (
            <>
              {/* Top Announcement Ticker (Desktop only to prevent mobile clutter) */}
              {customizer.showAnnouncementTicker && (
                <div className="hidden md:flex w-full px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 border border-amber-500/30 items-center justify-between gap-3 text-xs shadow-md">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] uppercase shrink-0">
                      Announcement
                    </span>
                    <p className="text-amber-800 dark:text-amber-200 font-bold truncate">
                      {customizer.announcementText}
                    </p>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => setShowCustomizerModal(true)}
                      className="text-[11px] font-extrabold text-cyan-600 dark:text-cyan-400 hover:underline shrink-0 hidden sm:inline"
                    >
                      Customize Ticker →
                    </button>
                  )}
                </div>
              )}

              {/* Photo Hero Banner (Desktop only to prevent mobile clutter) */}
              {customizer.showHeroBanner && (
                <div className="hidden md:block relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group bg-slate-950">
                  {/* Background Photo Image with Overlay */}
                  <div className="absolute inset-0 z-0">
                    {customizer.heroBannerImageUrl && (
                      <img
                        src={customizer.heroBannerImageUrl}
                        alt="Custom Hero Banner"
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/60" />
                  </div>

                  {/* Banner Content */}
                  <div className="relative z-10 p-6 md:p-8 max-w-2xl space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-black uppercase tracking-wider backdrop-blur-md">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Custom Prep Suite Banner
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                      {customizer.heroBannerTitle}
                    </h2>

                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
                      {customizer.heroBannerSubtitle}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setActiveTab('syllabus')}
                        className="px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-cyan-500/20"
                      >
                        {customizer.heroBannerCtaText || 'Explore Syllabus Tracker'}
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => setShowCustomizerModal(true)}
                          className="px-4 py-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 backdrop-blur-md transition-all"
                        >
                          <Sliders className="w-3.5 h-3.5 text-purple-400" /> Customize Banner Photo & Text
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Google AdSense Header Slot (Desktop only to prevent mobile clutter) */}
              <div className="hidden md:block">
                <AdSenseBanner slotType="header" isPremium={user?.isPremium} />
              </div>

              {/* Daily Motivational Quote (Featured on desktop dashboard) */}
              <div className="hidden md:block">
                <DailyQuoteCard />
              </div>
            </>
          )}

          {/* Active Tab View with PremiumGate Locks & Smooth Connected Transitions */}
          <section className="mt-6">
            <AnimatePresence initial={false}>
              <PageTransition key={activeTab}>
                <Suspense fallback={<SuspenseFallback />}>
                {activeTab === 'syllabus' && (
                  <div data-screen="syllabus" className="w-full">
                    <MapJourneyView
                      user={{...user, exam: selectedExam}}
                      selectedExam={selectedExam}
                      isAdmin={isAdmin}
                      featureFlagsMap={featureFlagsMap}
                      onNavigate={(t) => setActiveTab(t)}
                      onExamChange={handleExamChange}
                      onOpenPremium={() => setActiveTab('premium')}
                      onRequireLogin={() => setUser(null)}
                    />
                  </div>
                )}

            {activeTab === 'pyq' && (
              <div data-screen="pyq" className="w-full">
                <PremiumGate
                  featureName="pyq"
                  featureTitle="Enterprise PYQ Archive (1991–2026)"
                  isUserPremium={user.isPremium || isAdmin}
                  isAdmin={isAdmin}
                  isGuest={user.isGuest}
                  featureFlags={featureFlagsMap}
                  onOpenPremium={() => setActiveTab('premium')}
                  onRequireLogin={() => setUser(null)}
                >
                  <PyqEngine isAdmin={user.role === 'ADMIN' || user.role === 'CO_ADMIN' || user.role === 'DEVELOPER'} initialExam={selectedExam} />
                </PremiumGate>
              </div>
            )}

            {activeTab === 'question_bank' && (
              <div data-screen="question_bank" className="w-full">
                <PremiumGate
                  featureName="question_bank"
                  featureTitle="Question Bank & Practice Engine"
                  isUserPremium={user.isPremium || isAdmin}
                  isAdmin={isAdmin}
                  isGuest={user.isGuest}
                  featureFlags={featureFlagsMap}
                  onOpenPremium={() => setActiveTab('premium')}
                  onRequireLogin={() => setUser(null)}
                >
                  <QuestionBankEngine isAdmin={user.role === 'ADMIN' || user.role === 'CO_ADMIN' || user.role === 'DEVELOPER'} initialExam={selectedExam} />
                </PremiumGate>
              </div>
            )}

            {activeTab === 'timer' && (
              <div data-screen="timer" className="w-full">
                <PremiumGate
                  featureName="timer"
                  featureTitle="Pomodoro Group Timer & Study Engine"
                  isUserPremium={user.isPremium || isAdmin}
                  isAdmin={isAdmin}
                  isGuest={user.isGuest}
                  featureFlags={featureFlagsMap}
                  onOpenPremium={() => setActiveTab('premium')}
                  onRequireLogin={() => setUser(null)}
                >
                  <HighwayFocusTimer 
                    userId={user.id} 
                    selectedExam={selectedExam} 
                    onOpenGarage={() => setActiveTab('garage')}
                    onNavigateToMyRides={() => setActiveTab('my_rides')}
                    onNavigateToMountainRide={() => setActiveTab('mountain_ride')}
                    onBack={() => setActiveTab('dashboard')}
                    onTimerRunningChange={(running) => setIsFocusTimerRunning(running)}
                  />
                </PremiumGate>
              </div>
            )}

            {activeTab === 'mountain_ride' && (
              <div data-screen="mountain_ride" className="w-full h-screen fixed inset-0 z-50">
                <Suspense fallback={<SuspenseFallback />}>
                  <MountainRidePage onBack={() => setActiveTab('timer')} />
                </Suspense>
              </div>
            )}

            {activeTab === 'garage' && (
              <div data-screen="garage" className="w-full">
                <Suspense fallback={<SuspenseFallback />}>
                  <GarageScreen 
                    userId={user.id} 
                    onBack={() => setActiveTab('timer')}
                    onNavigateToMyRides={() => setActiveTab('my_rides')}
                    onNavigateToAssetCheck={() => setActiveTab('asset_check')}
                    onStartRide={() => setActiveTab('timer')}
                  />
                </Suspense>
              </div>
            )}

            {activeTab === 'my_rides' && (
              <div data-screen="my_rides" className="w-full">
                <Suspense fallback={<SuspenseFallback />}>
                  <MyRidesScreen
                    userId={user.id}
                    onBack={() => setActiveTab('timer')}
                    onStartRide={() => setActiveTab('timer')}
                  />
                </Suspense>
              </div>
            )}

            {activeTab === 'asset_check' && (
              import.meta.env.DEV ? (
                <div data-screen="asset_check" className="w-full">
                  <Suspense fallback={<SuspenseFallback />}>
                    <AssetCheckScreen
                      onBack={() => setActiveTab('garage')}
                    />
                  </Suspense>
                </div>
              ) : (
                <div data-screen="asset_check" className="p-8 text-center text-slate-400 font-bold">
                  Developer Asset Check Module (Unavailable in Production)
                </div>
              )
            )}

            {activeTab === 'debug_galaxy' && (
              import.meta.env.DEV ? (
                <div data-screen="debug_galaxy" className="w-full">
                  <Suspense fallback={<SuspenseFallback />}>
                    <GalaxyDebugScreen
                      onBack={() => setActiveTab('timer')}
                      onOpenGalaxy={() => setActiveTab('timer')}
                    />
                  </Suspense>
                </div>
              ) : (
                <div data-screen="debug_galaxy" className="p-8 text-center text-slate-400 font-bold">
                  Developer Debug Module (Unavailable in Production)
                </div>
              )
            )}

            {activeTab === 'tasks' && (
              <div data-screen="tasks" className="w-full">
                <PremiumGate
                  featureName="task"
                  featureTitle="Daily Study Planner & Task Manager"
                  isUserPremium={user.isPremium || isAdmin}
                  isAdmin={isAdmin}
                  isGuest={user.isGuest}
                  featureFlags={featureFlagsMap}
                  onOpenPremium={() => setActiveTab('premium')}
                  onRequireLogin={() => setUser(null)}
                >
                  <TaskManager userId={user.id} selectedExam={selectedExam} />
                </PremiumGate>
              </div>
            )}

            {activeTab === 'chat' && (
              <div data-screen="chat" className="w-full">
                <PremiumGate
                  featureName="chat"
                  featureTitle="1-on-1 AI Study Mentor & Answer Evaluator"
                  isUserPremium={user.isPremium || isAdmin}
                  isAdmin={isAdmin}
                  isGuest={user.isGuest}
                  featureFlags={featureFlagsMap}
                  onOpenPremium={() => setActiveTab('premium')}
                  onRequireLogin={() => setUser(null)}
                >
                  <AiStudyChat exam={selectedExam} userId={user.id} userEmail={user.email} />
                </PremiumGate>
              </div>
            )}

            {(activeTab === 'dashboard' || activeTab === 'student_dashboard') && (
              <div data-screen={activeTab} className="w-full">
                <StudentDashboard 
                  userProfile={{...user, exam: selectedExam}} 
                  selectedExam={selectedExam} 
                  onExamChange={handleExamChange} 
                  onNavigate={(t) => setActiveTab(t)} 
                  onOpenProfileModal={() => setShowProfileModal(true)} 
                  onOpenWorkspaceCustomizer={() => setShowWorkspaceCustomizer(true)} 
                  onOpenReminderSettings={() => setShowReminderSettingsModal(true)} 
                />
              </div>
            )}

            {activeTab === 'cbt' && (
              <div data-screen="cbt" className="w-full">
                <PremiumGate
                  featureName="cbt"
                  featureTitle="StudyRide All-India Mock Test & CBT Simulator"
                  isUserPremium={user.isPremium || isAdmin}
                  isAdmin={isAdmin}
                  isGuest={user.isGuest}
                  featureFlags={featureFlagsMap}
                  onOpenPremium={() => setActiveTab('premium')}
                  onRequireLogin={() => setUser(null)}
                >
                  <CbtExamEngine userProfile={{...user, exam: selectedExam}} selectedExam={selectedExam} />
                </PremiumGate>
              </div>
            )}

            {activeTab === 'cbt_exam' && (
              <div data-screen="cbt_exam" className="w-full">
                <PremiumGate
                  featureName="cbt"
                  featureTitle="Computer Based Test (CBT) Live Simulator"
                  isUserPremium={user.isPremium || isAdmin}
                  isAdmin={isAdmin}
                  isGuest={user.isGuest}
                  featureFlags={featureFlagsMap}
                  onOpenPremium={() => setActiveTab('premium')}
                  onRequireLogin={() => setUser(null)}
                >
                  <CbtExamEngine userProfile={{...user, exam: selectedExam}} selectedExam={selectedExam} />
                </PremiumGate>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div data-screen="leaderboard" className="w-full">
                <LeaderboardView userProfile={{...user, exam: selectedExam}} />
              </div>
            )}

            {activeTab === 'community' && (
              <div data-screen="community" className="w-full">
                <CommunityPlatform userProfile={{...user, exam: selectedExam}} selectedExam={selectedExam} />
              </div>
            )}

            {activeTab === 'study_buddy' && (
              <div data-screen="study_buddy" className="w-full">
                <StudyBuddy user={{...user, exam: selectedExam}} onNavigate={(t) => setActiveTab(t as ActiveTab)} />
              </div>
            )}

            {activeTab === 'premium' && (
              <div data-screen="premium" className="w-full">
                <PremiumPlans
                  user={{...user, exam: selectedExam}}
                  onUnlockPremium={() => setUser((prev) => (prev ? { ...prev, isPremium: true } : null))}
                />
              </div>
            )}

            {activeTab === 'earn_premium' && (
              <div data-screen="earn_premium" className="w-full">
                <EarnPremium user={{...user, exam: selectedExam}} onNavigate={(t) => setActiveTab(t)} />
              </div>
            )}

            {activeTab === 'rewards' && (
              <div data-screen="rewards" className="w-full">
                <Suspense fallback={<SuspenseFallback />}>
                  <RewardsHub 
                    user={{...user, exam: selectedExam}} 
                    onOpenFocusShield={() => setActiveTab('focus_shield')}
                    onOpenPractice={() => setActiveTab('practice_hub')}
                    onOpenSyllabus={() => setActiveTab('syllabus')}
                  />
                </Suspense>
              </div>
            )}

            {activeTab === 'reward_milestones' && (
              <div data-screen="reward_milestones" className="w-full">
                <Suspense fallback={<SuspenseFallback />}>
                  <RewardMilestones 
                    user={{...user, exam: selectedExam}} 
                    onOpenPremium={() => setActiveTab('premium')}
                  />
                </Suspense>
              </div>
            )}

            {activeTab === 'focus_shield' && (
              <div data-screen="focus_shield" className="w-full">
                <Suspense fallback={<SuspenseFallback />}>
                  <FocusShieldView 
                    user={{...user, exam: selectedExam}} 
                    onTrophyUnlock={(unlocked) => setTrophyQueue(prev => [...prev, unlocked])}
                  />
                </Suspense>
              </div>
            )}

            {activeTab === 'download' && (
              <div data-screen="download" className="w-full">
                <Suspense fallback={<SuspenseFallback />}>
                  <DownloadPage onOpenApp={() => setActiveTab('syllabus')} />
                </Suspense>
              </div>
            )}

            {activeTab === 'collaboration' && (
              <div data-screen="collaboration" className="w-full">
                <SponsorshipCollaboration user={{...user, exam: selectedExam}} />
              </div>
            )}

            {activeTab === 'library' && (
              <div data-screen="library" className="w-full">
                <PremiumGate
                  featureName="library"
                  featureTitle="Aspirants Reference Library & NCERT Notes"
                  isUserPremium={user.isPremium || isAdmin}
                  isAdmin={isAdmin}
                  isGuest={user.isGuest}
                  featureFlags={featureFlagsMap}
                  onOpenPremium={() => setActiveTab('premium')}
                  onRequireLogin={() => setUser(null)}
                >
                  <LibraryEngine user={{...user, exam: selectedExam}} onNavigate={(t) => setActiveTab(t as ActiveTab)} />
                </PremiumGate>
              </div>
            )}

            {activeTab === 'flashcards' && (
              <div data-screen="flashcards" className="w-full">
                <FlashcardEngine selectedExam={selectedExam} />
              </div>
            )}

            {activeTab === 'weakness' && (
              <div data-screen="weakness" className="w-full">
                <WeaknessDetector selectedExam={selectedExam} />
              </div>
            )}

            {activeTab === 'teachers' && (
              <div data-screen="teachers" className="w-full">
                {user.role === 'TEACHER' || user.role === 'ADMIN' || user.role === 'CO_ADMIN' || user.role === 'DEVELOPER' || user.email === DESIGNATED_ADMIN_EMAIL ? (
                  <TeacherPortal user={{...user, exam: selectedExam}} onNavigate={(t) => setActiveTab(t as ActiveTab)} />
                ) : (
                  <div className="p-8 max-w-2xl mx-auto text-center my-12 bg-slate-900 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
                    <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-white">This area is for teachers only</h2>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      The Teacher Portal is restricted to verified educators and faculty members. If you are an educator, please contact an administrator to upgrade your account access.
                    </p>
                    <div className="pt-2 flex justify-center gap-3">
                      <button
                        onClick={() => setActiveTab('syllabus')}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/20"
                      >
                        Return to Dashboard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'podcasts' && (
              <div data-screen="podcasts" className="w-full">
                <PodcastSeries />
              </div>
            )}

            {activeTab === 'eligibility' && (
              <div data-screen="eligibility" className="w-full">
                <EligibilityChecker />
              </div>
            )}

            {activeTab === 'feedback' && (
              <div data-screen="feedback" className="w-full">
                <FeedbackEngine userEmail={user?.email || 'guest@example.com'} />
              </div>
            )}

            {activeTab === 'blog' && (
              <div data-screen="blog" className="w-full">
                <BlogView user={{...user, exam: selectedExam}} />
              </div>
            )}

            {activeTab === 'wallpaper' && (
              <div data-screen="wallpaper" className="max-w-4xl mx-auto space-y-6 w-full">
                <div className="flex items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white">Daily Habit Lockscreen Wallpaper</h2>
                      <p className="text-xs text-slate-400">Export high-resolution dynamic mobile wallpapers customized to your exam countdown</p>
                    </div>
                  </div>
                </div>
                <ExamWallpaperWidget 
                  user={{...user, exam: selectedExam}} 
                  selectedExam={selectedExam} 
                  onNavigateToSyllabus={() => setActiveTab('syllabus')} 
                />
              </div>
            )}

            {activeTab === 'blog_submit' && (
              <div data-screen="blog_submit" className="w-full">
                <TeacherBlogSubmit onNavigateHome={() => setActiveTab('blog')} />
              </div>
            )}

            {activeTab === 'admin' && (
              <div data-screen="admin" className="w-full">
                {isAdminUnlocked || user?.email?.toLowerCase() === DESIGNATED_ADMIN_EMAIL.toLowerCase() || user?.role === 'ADMIN' ? (
                  <AdminPanel
                    user={user}
                    onUpdateRole={(role) => setUser((prev) => (prev ? { ...prev, role } : null))}
                    onFlagsUpdated={fetchFeatureFlags}
                    onOpenCustomizerModal={isAdmin ? () => setShowCustomizerModal(true) : undefined}
                  />
                ) : (
                  <div className="p-8 text-center text-rose-400 font-bold text-sm bg-rose-950/20 rounded-2xl border border-rose-500/30">
                    Access Denied: Admin authorization required. Redirecting to dashboard...
                  </div>
                )}
              </div>
            )}

            {activeTab === 'practice_hub' && (
              <div data-screen="practice_hub" className="w-full">
                <PracticeHub
                  userProfile={{...user, exam: selectedExam}}
                  selectedExam={selectedExam}
                  isAdmin={isAdmin}
                  onNavigate={(t) => setActiveTab(t)}
                />
              </div>
            )}

            {activeTab === 'progress_hub' && (
              <div data-screen="progress_hub" className="w-full">
                <ProgressHub
                  userProfile={{...user, exam: selectedExam}}
                  selectedExam={selectedExam}
                  onNavigate={(t) => setActiveTab(t)}
                />
              </div>
            )}

            {activeTab === 'more_hub' && (
              <div data-screen="more_hub" className="w-full">
                <MoreHub
                  user={{...user, exam: selectedExam}}
                  selectedExam={selectedExam}
                  onNavigate={(t) => setActiveTab(t)}
                  onOpenProfileModal={(tab) => {
                    setProfileModalInitialTab(tab || 'overview');
                    setShowProfileModal(true);
                  }}
                  onOpenReferralModal={() => setShowReferralModal(true)}
                  onOpenWorkspaceCustomizer={() => setShowWorkspaceCustomizer(true)}
                  onOpenReminderSettings={() => setShowReminderSettingsModal(true)}
                  onLogout={handleLogout}
                  isAdminUnlocked={isAdminUnlocked}
                />
              </div>
            )}

            {activeTab === 'figma_preview' && (
              import.meta.env.DEV ? (
                <div data-screen="figma_preview" className="w-full">
                  <FigmaRedesignPreview
                    onClose={() => setActiveTab('dashboard')}
                    onNavigateTab={(t) => setActiveTab(t as ActiveTab)}
                  />
                </div>
              ) : (
                <div data-screen="figma_preview" className="p-8 text-center text-slate-400 font-bold">
                  Developer Design Preview (Unavailable in Production)
                </div>
              )
            )}
              </Suspense>
            </PageTransition>
          </AnimatePresence>
          </section>

          {/* Google AdSense Footer Slot */}
          <AdSenseBanner slotType="footer" isPremium={user?.isPremium} />
        </main>
      </div>

      {/* Student Profile Dashboard Modal */}
      {user && (
        <Suspense fallback={null}>
          <UserProfileModal
            user={user}
            isOpen={showProfileModal}
            initialTab={profileModalInitialTab}
            onLogout={handleLogout}
            onClose={() => {
              setShowProfileModal(false);
              setProfileModalInitialTab('overview');
            }}
            onProfileUpdated={(updated) => {
              setUser(updated);
              if (updated.exam) {
                handleExamChange(updated.exam);
              }
            }}
            onOpenReferralModal={() => {
              setShowProfileModal(false);
              setShowReferralModal(true);
            }}
            onNavigateToRewards={() => {
              setShowProfileModal(false);
              setActiveTab('reward_milestones');
            }}
            onOpenCustomizerModal={isAdmin ? () => {
              setShowProfileModal(false);
              setShowCustomizerModal(true);
            } : undefined}
          />
        </Suspense>
      )}

      {/* Global Achievement Unlock Celebration Modal */}
      <AchievementUnlockModal
        queue={trophyQueue}
        onDismiss={(id) => setTrophyQueue(prev => prev.filter(t => t.id !== id))}
        onViewCollection={() => setActiveTab('rewards')}
      />

      {/* Lazy Loaded Secondary Dialogs and Modals */}
      <Suspense fallback={null}>
        {/* Refer & Earn Program Modal */}
        {user && (
          <ReferralModal
            user={user}
            isOpen={showReferralModal}
            onClose={() => setShowReferralModal(false)}
            onUserUpdated={(updated) => setUser(updated)}
          />
        )}

        {/* Live App Customizer Studio Modal */}
        <AppCustomizerModal
          isOpen={showCustomizerModal}
          onClose={() => setShowCustomizerModal(false)}
          onSettingsSaved={(updated) => setCustomizer(updated)}
        />

        {/* Workspace Personalization & Reordering Modal */}
        <WorkspaceCustomizer
          isOpen={showWorkspaceCustomizer}
          onClose={() => setShowWorkspaceCustomizer(false)}
          userId={user?.id}
        />

        {/* Demo Session Expired Modal */}
        <DemoExpiredModal
          isOpen={Boolean(user?.isGuest && isDemoExpired)}
          onRequireLogin={() => setUser(null)}
          onResetDemoSession={() => {
            startDemoSession();
            setIsDemoExpired(false);
            setDemoSecondsRemaining(getRemainingDemoSeconds());
          }}
        />

        {/* Global Search Engine Modal */}
        <GlobalSearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          onNavigate={(tab) => setActiveTab(tab as ActiveTab)}
        />

        {/* Reminder Preferences & Schedule Modal */}
        {user && (
          <ReminderSettingsModal
            isOpen={showReminderSettingsModal}
            onClose={() => setShowReminderSettingsModal(false)}
            user={user}
            selectedExam={selectedExam}
            onNavigate={(tab) => setActiveTab(tab as ActiveTab)}
          />
        )}
      </Suspense>



      {/* Network Status & Offline Indicator Toast */}
      <NetworkStatusIndicator />

      {/* Mobile Navigation Drawer (Phone Slide-up sheet) */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        user={user}
        onLogout={handleLogout}
        isAdminUnlocked={isAdminUnlocked}
        onOpenProfileModal={() => setShowProfileModal(true)}
        onOpenReferralModal={() => setShowReferralModal(true)}
        onOpenWorkspaceCustomizer={() => setShowWorkspaceCustomizer(true)}
        customizer={customizer}
        selectedExam={selectedExam}
        onExamChange={handleExamChange}
      />

      {/* Mobile Sticky Bottom Navigation (Hidden during active focus ride or mountain ride) */}
      {!( (activeTab === 'timer' && isFocusTimerRunning) || activeTab === 'mountain_ride' ) && (
        <MobileBottomNav
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          onOpenMore={() => setIsMobileDrawerOpen(true)}
        />
      )}

      {/* Universal Android Live Wallpaper Setup Modal */}
      {user && (
        <Suspense fallback={null}>
          <LiveWallpaperSetupModal
            isOpen={showWallpaperSetupModal}
            onClose={() => setShowWallpaperSetupModal(false)}
            user={user}
            selectedExam={selectedExam}
          />
        </Suspense>
      )}
    </div>
      </SecurityWrapper>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ExamProvider>
      <AppContent />
    </ExamProvider>
  );
}
