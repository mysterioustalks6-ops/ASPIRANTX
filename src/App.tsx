import React, { useState, useEffect, Suspense, lazy } from 'react';
import { UserProfile, ActiveTab } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { loadUserProfile, saveUserProfile } from './lib/gamification';
import { recordPerfMarker } from './lib/apiDeduplicator';
import { logAuthDiagnostic } from './lib/authDiagnostics';
import { EXAM_LIST } from './lib/examList';
import { LandingPage } from './components/LandingPage';
import { OnboardingWizard } from './components/OnboardingWizard';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { GamificationBar } from './components/GamificationBar';
import { DailyQuoteCard } from './components/DailyQuote';
import { SyllabusTracker } from './components/SyllabusTracker';
import { PyqEngine } from './components/PyqEngine';
import { QuestionBankEngine } from './components/QuestionBankEngine';
import { PomodoroTimer } from './components/PomodoroTimer';
import { TaskManager } from './components/TaskManager';
import { AiStudyChat } from './components/AiStudyChat';
import { CommunityChat } from './components/CommunityChat';
import { UserProfileModal } from './components/UserProfileModal';
import { ReferralModal } from './components/ReferralModal';
import { AppCustomizerModal } from './components/AppCustomizerModal';
import { BackgroundFX } from './components/BackgroundFX';
import { ErrorBoundary } from './components/ErrorBoundary';
import { reportFrontendError } from './lib/errorReporter';
import { loadCustomizerSettings, fetchServerCustomizerSettings, AppCustomizerSettings } from './lib/customizer';
import { getRemainingDemoSeconds, formatDemoTime, startDemoSession, fetchServerDemoDurationMinutes } from './lib/demoSession';
import { DemoExpiredModal } from './components/DemoExpiredModal';
import { PremiumGate, FeatureFlagsMap } from './components/PremiumGate';
import { AdSenseBanner } from './components/AdSenseBanner';
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { VersionUpdateNotifier } from './components/VersionUpdateNotifier';
import { WorkspaceCustomizer } from './components/WorkspaceCustomizer';
import { OnboardingTour } from './components/OnboardingTour';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileDrawer } from './components/MobileDrawer';
import { ReminderSettingsModal } from './components/ReminderSettingsModal';
import { AppDownloadModal } from './components/AppDownloadModal';
import { checkAndTriggerStudyReminder, getDailyStudySummary } from './lib/studyReminderService';
import { fetchServerWorkspaceConfig, recordFeatureUsage } from './lib/workspacePreferences';
import { Shield, KeyRound, X, Check, Lock as LockIcon, Sparkles, Sliders, XCircle, ShieldCheck } from 'lucide-react';

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

const EXAMS = EXAM_LIST;

const SuspenseFallback = () => (
  <div className="p-12 text-center text-slate-400 space-y-3">
    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
    <div className="text-xs font-semibold tracking-wide uppercase text-indigo-400">Loading Enterprise View...</div>
  </div>
);

export const DESIGNATED_ADMIN_EMAIL = 'ambujyadav0010@gmail.com';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
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

  // selectedExam: persist in localStorage so exam choice survives page refresh
  const [selectedExam, setSelectedExam] = useState<string>(() => {
    return localStorage.getItem('aspirantx_global_selected_exam') || 'NEET_UG';
  });

  // PROFILE IS AUTHORITATIVE SINGLE SOURCE OF TRUTH FOR ACTIVE EXAM CONTEXT
  useEffect(() => {
    if (user?.exam && user.exam !== selectedExam) {
      setSelectedExam(user.exam);
      localStorage.setItem('aspirantx_global_selected_exam', user.exam);
    }
  }, [user?.exam, selectedExam]);

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

  // Handler: called when profile updates user exam
  const handleExamChange = (examId: string) => {
    setSelectedExam(examId);
    localStorage.setItem('aspirantx_global_selected_exam', examId);
    setUser((prev) => (prev ? { ...prev, exam: examId } : prev));

    // Keep the fast-path profile cache in sync too — checkAuthSession()
    // reads THIS key first on every page load, before any network call.
    // If it's not updated here, refresh will flash/revert to the old
    // exam until (if ever) the background Supabase fetch corrects it.
    if (user?.id) {
      try {
        const cacheKey = `aspirantx_profile_cache_${user.id}`;
        const existingRaw = localStorage.getItem(cacheKey);
        const existing = existingRaw ? JSON.parse(existingRaw) : {};
        localStorage.setItem(cacheKey, JSON.stringify({
          ...existing,
          userId: user.id,
          targetExam: examId,
          exam: examId,
          profileComplete: true,
          updatedAt: new Date().toISOString(),
        }));
      } catch (err) {
        logAuthDiagnostic('EXAM_CHANGE', 'failed to update fast profile cache', { error: String(err) });
      }
    }

    // Persist to backend so it survives a refresh — otherwise the
    // profile-authoritative useEffect above reverts it to the stale
    // DB value on next load.
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch('/api/user/set-exam', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ exam: examId, email: user?.email }),
        });
      } catch (err) {
        logAuthDiagnostic('EXAM_CHANGE', 'failed to persist exam change to backend', { error: String(err) });
      }
    })();
  };
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash.startsWith('blog-submit')) return 'blog_submit';
    if (hash.startsWith('blog')) return 'blog';
    const validTabs = ['syllabus','pyq','question_bank','timer','tasks','chat',
      'dashboard','cbt','leaderboard','community','premium','earn_premium','admin',
      'library', 'flashcards', 'weakness', 'teachers', 'podcasts', 'eligibility', 'feedback', 'blog', 'blog_submit'];
    return (validTabs.includes(hash) ? hash : 'syllabus') as ActiveTab;
  });

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
      if (hash.startsWith('blog-submit')) {
        setActiveTab('blog_submit');
      } else if (hash.startsWith('blog')) {
        setActiveTab('blog');
      } else if (hash) {
        setActiveTab(hash as ActiveTab);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  const [initializing, setInitializing] = useState<boolean>(true);
  const [bannedMessage, setBannedMessage] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);
  const [showCustomizerModal, setShowCustomizerModal] = useState<boolean>(false);
  const [showWorkspaceCustomizer, setShowWorkspaceCustomizer] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [showCompanionWidget, setShowCompanionWidget] = useState<boolean>(true);
  const [isCompanionMinimized, setIsCompanionMinimized] = useState<boolean>(false);
  const [showReminderSettingsModal, setShowReminderSettingsModal] = useState<boolean>(false);
  const [customizer, setCustomizer] = useState<AppCustomizerSettings>(loadCustomizerSettings());

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
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
          email: user?.email || 'guest@aspirantx.app',
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
    
    const examLabel = user.exam || 'Competitive Exams';
    let title = `AspirantX - Prep Suite for ${examLabel}`;
    let description = `Prepare for ${examLabel} on AspirantX. Practice custom CBT test series, mock exams, previous year question papers (PYQs), track syllabus, and study with an interactive AI Mentor.`;
    
    switch (activeTab) {
      case 'syllabus':
        title = `Syllabus Tracker & Progress Chart for ${examLabel} - AspirantX`;
        description = `Track your ${examLabel} syllabus topics, subtopics, and preparation logs in real-time. Optimize your speed and accuracy.`;
        break;
      case 'pyq':
        title = `${examLabel} Previous Year Questions (PYQs) Engine - AspirantX`;
        description = `Browse, filter, and practice past year questions (PYQ papers) for ${examLabel} with deep explanation solutions.`;
        break;
      case 'cbt':
      case 'cbt_exam':
        title = `CBT Mock Exams & Practice Tests for ${examLabel} - AspirantX`;
        description = `Attempt online computer-based test series, full mocks, and section-wise papers for ${examLabel} in a simulated CBT interface.`;
        break;
      case 'leaderboard':
        title = `${examLabel} Student Leaderboard & Ranks - AspirantX`;
        description = `See where you stand in the state and national rankings for ${examLabel} preparation. Earn badges, coins, and levels.`;
        break;
      case 'chat':
      case 'study_buddy':
        title = `AI Study Buddy & Mentor for ${examLabel} - AspirantX`;
        description = `Resolve doubts instantly, generate tailored quizzes, and analyze difficult syllabus topics for ${examLabel} with our AI study buddy.`;
        break;
      default:
        title = `${examLabel} Prep Dashboard & Curriculum - AspirantX`;
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
  }, [activeTab, user?.exam]);

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
        setLoadingStats(true);
        const statsMap: Record<string, { total: number; completed: number; percentage: number }> = {};
        try {
          for (const exam of uniqueExams) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 1500);
            const res = await fetch(`/api/academic/syllabus?exam=${encodeURIComponent(exam)}`, { 
              cache: 'no-store',
              signal: controller.signal
            }).catch(() => null);
            clearTimeout(timer);

            if (res && res.ok) {
              const data = await res.json().catch(() => ({}));
              const nodes = data.syllabus || [];
              const total = nodes.length;
              let completedIds: string[] = [];
              try {
                const saved = localStorage.getItem(`aspirantx_completed_subtopics_${exam}`);
                if (saved) completedIds = JSON.parse(saved);
              } catch (e) {}
              const completed = nodes.filter((n: any) => completedIds.includes(n.id) || n.completed).length;
              const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
              statsMap[exam] = { total, completed, percentage };
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
      const intervalId = setInterval(fetchStats, 60000); // Periodic background sync every 60 seconds
      return () => clearInterval(intervalId);
    }, [userId, userExam]);

    return { completionStats, loadingStats };
  };

  const { completionStats, loadingStats } = useSyllabusCompletionStats(user);

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
      if (!isSupabaseConfigured) {
        logAuthDiagnostic('AUTH', 'Supabase not configured, skipping auth restore');
        recordPerfMarker('authResolved');
        recordPerfMarker('appShellRendered');
        setInitializing(false);
        return;
      }

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
            const immediateUser: UserProfile = {
              id: session.user.id,
              name: cachedProfile.name || email.split('@')[0] || 'Aspirant',
              email,
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
            setSelectedExam(cachedExam);
            localStorage.setItem('aspirantx_global_selected_exam', cachedExam);
            setUser(immediateUser);
            if (isDesignatedAdmin) setIsAdminUnlocked(true);
            setInitializing(false);
          }

          // Exchange Supabase Access Token with Server to obtain verified Application JWT
          if (session.access_token) {
            try {
              const controller = new AbortController();
              const fetchTimer = setTimeout(() => controller.abort(), 1000);
              const res = await fetch('/api/auth/token', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
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
                avatar_url: session.user.user_metadata?.avatar_url || profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                role: isDesignatedAdmin ? 'ADMIN' : (profile.role || 'USER'),
                isProfileComplete: isComp,
              };

              // AUTHORITATIVE EXAM RESOLUTION BEFORE SHELL RENDER
              const resolvedExam = u.exam || cachedExam || 'NEET_UG';
              setSelectedExam(resolvedExam);
              localStorage.setItem('aspirantx_global_selected_exam', resolvedExam);
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
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        logAuthDiagnostic('AUTH', `auth state event: ${event}`, {
          hasSession: Boolean(session?.user),
          userId: session?.user?.id || null,
        });

        if (event === 'SIGNED_OUT') {
          logAuthDiagnostic('NAVIGATION', 'Redirecting to /signin', { reason: 'SIGNED_OUT auth event received' });
          if (user?.id) {
            localStorage.removeItem(`aspirantx_profile_cache_${user.id}`);
          }
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
            setSelectedExam((prev) => (prev === resolvedExam ? prev : resolvedExam));
            localStorage.setItem('aspirantx_global_selected_exam', resolvedExam);

            setUser((prev) => {
              const isComp = Boolean(profile.isProfileComplete || (profile.exam && profile.exam.trim() !== '') || prev?.isProfileComplete);
              const next: UserProfile = {
                ...profile,
                ...prev,
                id: session.user.id,
                name: profile.name || prev?.name || session.user.user_metadata?.full_name || email.split('@')[0] || 'Aspirant',
                email,
                avatar_url: session.user.user_metadata?.avatar_url || profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
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
    if (isSupabaseConfigured) {
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

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-[#00FF94]/10 border border-[#00FF94]/30 flex items-center justify-center font-black text-[#00FF94] animate-pulse text-lg mb-4 shadow-[0_0_20px_rgba(0,255,148,0.3)]">
          AX
        </div>
        <p className="text-xs text-slate-400 font-medium">Initializing AspirantX Platform...</p>
      </div>
    );
  }

  if (!user) {
    logAuthDiagnostic('NAVIGATION', 'Rendering Sign In page (LandingPage)', { reason: 'No active user in app state' });
    return (
      <LandingPage
        onLoginSuccess={(u) => {
          logAuthDiagnostic('AUTH', 'onLoginSuccess triggered', { userId: u.id, email: u.email });
          
          const storedExam = localStorage.getItem('aspirantx_global_selected_exam') || u.exam || 'NEET_UG';
          setSelectedExam(storedExam);
          localStorage.setItem('aspirantx_global_selected_exam', storedExam);

          const immediateUser: UserProfile = {
            ...u,
            exam: storedExam,
            isProfileComplete: true,
            role: (u.email?.toLowerCase() === DESIGNATED_ADMIN_EMAIL.toLowerCase()) ? 'ADMIN' : (u.role || 'USER'),
          };

          // INSTANT SYNCHRONOUS TRANSITION TO APP SHELL
          setUser(immediateUser);
          if (u.email?.toLowerCase() === DESIGNATED_ADMIN_EMAIL.toLowerCase()) {
            setIsAdminUnlocked(true);
          }

          // Background Profile Enrichment (Non-blocking)
          (async () => {
            try {
              const profile = await loadUserProfile(u.id);
              const resolvedExam = profile.exam || storedExam;
              setSelectedExam(resolvedExam);
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
    );
  }

  if (user && user.isProfileComplete === false && !user.exam) {
    return (
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
    );
  }

  return (
    <ErrorBoundary>
      <VersionUpdateNotifier />
      <SecurityWrapper user={user!} enabled={user?.role !== 'ADMIN' && user?.role !== 'DEVELOPER'}>
      <div className="min-h-screen bg-[#050505] text-slate-100 flex flex-col md:flex-row font-sans selection:bg-[#00FF94] selection:text-black relative">
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

      {/* Sidebar Navigation */}
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

      {/* Main Content Dashboard Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Sticky Header */}
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

        {/* Gamification Level & Reward Redemption Bar */}
        <GamificationBar 
          onOpenPremiumTab={() => setActiveTab('premium')} 
          onOpenReferralModal={() => setShowReferralModal(true)}
        />

        {/* Dashboard Main Scroll Workspace */}
        <main className={`flex-1 p-3 sm:p-5 md:p-8 space-y-6 md:space-y-8 pb-24 md:pb-8 w-full mx-auto transition-all duration-200 ${
          isSidebarCollapsed ? 'max-w-[1600px]' : 'max-w-7xl'
        }`}>
          {/* Onboarding Tour (Global across all tabs until dismissed) */}
          <OnboardingTour
            onNavigate={(t) => setActiveTab(t as ActiveTab)}
            onOpenProfileModal={() => setShowProfileModal(true)}
            onToggleSidebar={handleToggleSidebarCollapse}
          />

          {activeTab === 'dashboard' && (
            <>
              {/* Top Announcement Ticker (Customizable) */}
              {customizer.showAnnouncementTicker && (
                <div className="w-full px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs shadow-md">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] uppercase shrink-0">
                      Announcement
                    </span>
                    <p className="text-amber-200 font-bold truncate">
                      {customizer.announcementText}
                    </p>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => setShowCustomizerModal(true)}
                      className="text-[11px] font-extrabold text-cyan-400 hover:underline shrink-0 hidden sm:inline"
                    >
                      Customize Ticker →
                    </button>
                  )}
                </div>
              )}

              {/* Photo Hero Banner (Customizable Image, Headline, Subtitle) */}
              {customizer.showHeroBanner && (
                <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group">
                  {/* Background Photo Image with Overlay */}
                  <div className="absolute inset-0 z-0">
                    <img
                      src={customizer.heroBannerImageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80'}
                      alt="Custom Hero Banner"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
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

              {/* Google AdSense Header Slot (Only renders when enabled by Admin) */}
              <AdSenseBanner slotType="header" isPremium={user?.isPremium} />

              {/* Daily Motivational Quote (Always Featured at top of Dashboard) */}
              <DailyQuoteCard />
            </>
          )}

          {/* Active Tab View with PremiumGate Locks */}
          <section className="mt-6">
            {activeTab === 'syllabus' && (
              <PremiumGate
                featureName="syllabus"
                featureTitle="Interactive Syllabus Tracker"
                isUserPremium={user.isPremium}
                isGuest={user.isGuest}
                featureFlags={featureFlagsMap}
                onOpenPremium={() => setActiveTab('premium')}
                onRequireLogin={() => setUser(null)}
              >
                <SyllabusTracker 
                  exam={selectedExam} 
                  userId={user.id} 
                  isGuest={user.isGuest}
                  isUserPremium={user.isPremium}
                  featureFlags={featureFlagsMap}
                  onOpenPremium={() => setActiveTab('premium')}
                  onRequireLogin={() => setUser(null)}
                />
              </PremiumGate>
            )}

            {activeTab === 'pyq' && (
              <PremiumGate
                featureName="pyq"
                featureTitle="Enterprise PYQ Archive (1991–2026)"
                isUserPremium={user.isPremium}
                isGuest={user.isGuest}
                featureFlags={featureFlagsMap}
                onOpenPremium={() => setActiveTab('premium')}
                onRequireLogin={() => setUser(null)}
              >
                <PyqEngine isAdmin={user.role === 'ADMIN' || user.role === 'CO_ADMIN' || user.role === 'DEVELOPER'} initialExam={selectedExam} />
              </PremiumGate>
            )}

            {activeTab === 'question_bank' && (
              <PremiumGate
                featureName="question_bank"
                featureTitle="Question Bank & Practice Engine"
                isUserPremium={user.isPremium}
                isGuest={user.isGuest}
                featureFlags={featureFlagsMap}
                onOpenPremium={() => setActiveTab('premium')}
                onRequireLogin={() => setUser(null)}
              >
                <QuestionBankEngine isAdmin={user.role === 'ADMIN' || user.role === 'CO_ADMIN' || user.role === 'DEVELOPER'} initialExam={selectedExam} />
              </PremiumGate>
            )}

            {activeTab === 'timer' && (
              <PremiumGate
                featureName="timer"
                featureTitle="Pomodoro Group Timer & Study Engine"
                isUserPremium={user.isPremium}
                isGuest={user.isGuest}
                featureFlags={featureFlagsMap}
                onOpenPremium={() => setActiveTab('premium')}
                onRequireLogin={() => setUser(null)}
              >
                <PomodoroTimer userId={user.id} selectedExam={selectedExam} />
              </PremiumGate>
            )}

            {activeTab === 'tasks' && (
              <PremiumGate
                featureName="task"
                featureTitle="Daily Study Planner & Task Manager"
                isUserPremium={user.isPremium}
                isGuest={user.isGuest}
                featureFlags={featureFlagsMap}
                onOpenPremium={() => setActiveTab('premium')}
                onRequireLogin={() => setUser(null)}
              >
                <TaskManager userId={user.id} selectedExam={selectedExam} />
              </PremiumGate>
            )}

            {activeTab === 'chat' && (
              <PremiumGate
                featureName="chat"
                featureTitle="1-on-1 AI Study Mentor & Answer Evaluator"
                isUserPremium={user.isPremium}
                isGuest={user.isGuest}
                featureFlags={featureFlagsMap}
                onOpenPremium={() => setActiveTab('premium')}
                onRequireLogin={() => setUser(null)}
              >
                <AiStudyChat exam={selectedExam} userId={user.id} userEmail={user.email} />
              </PremiumGate>
            )}

            <Suspense fallback={<SuspenseFallback />}>
              {(activeTab === 'dashboard' || activeTab === 'student_dashboard') && (
                <StudentDashboard 
                  userProfile={{...user, exam: selectedExam}} 
                  selectedExam={selectedExam}
                  onExamChange={handleExamChange}
                  onNavigate={(t) => setActiveTab(t)} 
                  onOpenProfileModal={() => setShowProfileModal(true)} 
                  onOpenWorkspaceCustomizer={() => setShowWorkspaceCustomizer(true)}
                  onOpenReminderSettings={() => setShowReminderSettingsModal(true)}
                />
              )}

              {(activeTab === 'cbt' || activeTab === 'cbt_exam') && (
                <PremiumGate
                  featureName="cbt"
                  featureTitle="AspirantX All-India Mock Test & CBT Simulator"
                  isUserPremium={user.isPremium}
                  isGuest={user.isGuest}
                  featureFlags={featureFlagsMap}
                  onOpenPremium={() => setActiveTab('premium')}
                  onRequireLogin={() => setUser(null)}
                >
                  <CbtExamEngine userProfile={{...user, exam: selectedExam}} selectedExam={selectedExam} />
                </PremiumGate>
              )}

              {activeTab === 'leaderboard' && (
                <LeaderboardView userProfile={{...user, exam: selectedExam}} />
              )}

              {activeTab === 'community' && (
                <CommunityPlatform userProfile={{...user, exam: selectedExam}} selectedExam={selectedExam} />
              )}

              {activeTab === 'study_buddy' && (
                <StudyBuddy user={{...user, exam: selectedExam}} onNavigate={(t) => setActiveTab(t as ActiveTab)} />
              )}

              {activeTab === 'premium' && (
                <PremiumPlans
                  user={{...user, exam: selectedExam}}
                  onUnlockPremium={() => setUser((prev) => (prev ? { ...prev, isPremium: true } : null))}
                />
              )}

              {activeTab === 'earn_premium' && (
                <EarnPremium user={{...user, exam: selectedExam}} onNavigate={(t) => setActiveTab(t)} />
              )}

              {activeTab === 'reward_milestones' && (
                <RewardMilestones user={{...user, exam: selectedExam}} featureFlags={featureFlagsMap} onOpenPremium={() => setActiveTab('premium')} />
              )}

              {activeTab === 'collaboration' && (
                <SponsorshipCollaboration user={{...user, exam: selectedExam}} />
              )}

              {activeTab === 'library' && (
                <PremiumGate
                  featureName="library"
                  featureTitle="Aspirants Reference Library & NCERT Notes"
                  isUserPremium={user.isPremium}
                  isGuest={user.isGuest}
                  featureFlags={featureFlagsMap}
                  onOpenPremium={() => setActiveTab('premium')}
                  onRequireLogin={() => setUser(null)}
                >
                  <LibraryEngine user={{...user, exam: selectedExam}} onNavigate={(t) => setActiveTab(t as ActiveTab)} />
                </PremiumGate>
              )}

              {activeTab === 'flashcards' && (
                <FlashcardEngine selectedExam={selectedExam} />
              )}

              {activeTab === 'weakness' && (
                <WeaknessDetector selectedExam={selectedExam} />
              )}

              {activeTab === 'teachers' && (
                user.role === 'TEACHER' || user.role === 'ADMIN' || user.role === 'CO_ADMIN' || user.role === 'DEVELOPER' || user.email === DESIGNATED_ADMIN_EMAIL ? (
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
                )
              )}

              {activeTab === 'podcasts' && (
                <PodcastSeries />
              )}

              {activeTab === 'eligibility' && (
                <EligibilityChecker />
              )}

              {activeTab === 'feedback' && (
                <FeedbackEngine userEmail={user?.email || 'guest@example.com'} />
              )}

              {activeTab === 'blog' && (
                <BlogView />
              )}

              {activeTab === 'blog_submit' && (
                <TeacherBlogSubmit onNavigateHome={() => setActiveTab('blog')} />
              )}

              {activeTab === 'admin' && (
                isAdminUnlocked || user.email === DESIGNATED_ADMIN_EMAIL || user.role === 'ADMIN' ? (
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
                )
              )}
            </Suspense>
          </section>

          {/* Google AdSense Footer Slot */}
          <AdSenseBanner slotType="footer" isPremium={user?.isPremium} />
        </main>
      </div>

      {/* Student Profile Dashboard Modal */}
      {user && (
        <UserProfileModal
          user={user}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
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
      )}

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

      {/* Friendly Study Companion Widget (Research-tested calm nudge) */}
      {user && showCompanionWidget && (
        <div className="fixed bottom-16 right-4 z-40 group transition-all">
          {isCompanionMinimized ? (
            <button
              onClick={() => setIsCompanionMinimized(false)}
              className="p-2.5 rounded-full bg-[#090b11] border border-emerald-500/40 text-emerald-400 shadow-2xl flex items-center gap-1.5 hover:scale-110 transition-all cursor-pointer"
              title="Expand AX Study Companion"
            >
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              <span className="text-sm">🤖</span>
              <span className="text-[10px] font-extrabold text-emerald-300 pr-1">AX Companion</span>
            </button>
          ) : (() => {
            const summary = getDailyStudySummary(user, selectedExam || user.exam);
            return (
              <div className="max-w-xs p-3.5 rounded-2xl bg-[#090b11] border border-emerald-500/30 text-xs text-slate-100 shadow-2xl flex items-start gap-3 relative pr-8">
                {/* Close & Minimize Action Buttons */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    onClick={() => setIsCompanionMinimized(true)}
                    className="w-4 h-4 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-[10px] transition-all cursor-pointer"
                    title="Minimize widget to side"
                  >
                    −
                  </button>
                  <button
                    onClick={() => setShowCompanionWidget(false)}
                    className="w-4 h-4 rounded-full bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 flex items-center justify-center text-[10px] transition-all cursor-pointer"
                    title="Dismiss widget"
                  >
                    ✕
                  </button>
                </div>

                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 relative mt-0.5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full absolute top-0 right-0 animate-ping" />
                  🤖
                </div>
                <div className="text-left space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-[10px] text-emerald-400 uppercase tracking-wide">
                      {summary.headlineCopy}
                    </div>
                  </div>
                  {summary.pendingTopics.length > 0 ? (
                    <div className="text-[10px] text-slate-300 space-y-0.5">
                      {summary.pendingTopics.map((pt) => (
                        <div key={pt.id} className="flex items-center gap-1 text-slate-300 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                          <span className="truncate">{pt.title}</span>
                        </div>
                      ))}
                      <div className="text-[10px] text-emerald-400 font-semibold pt-0.5">
                        {summary.streakCopy}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-200 font-medium leading-snug">
                      {summary.streakCopy}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    {!summary.isCompletedForToday && (
                      <button
                        onClick={() => setActiveTab('tasks')}
                        className="text-[10px] font-bold text-emerald-400 hover:underline"
                      >
                        View Tasks →
                      </button>
                    )}
                    <button
                      onClick={() => setShowReminderSettingsModal(true)}
                      className="text-[10px] text-slate-400 hover:text-slate-200 hover:underline"
                    >
                      Settings ⚙️
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

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

      {/* Mobile Sticky Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        onOpenMore={() => setIsMobileDrawerOpen(true)}
      />
      {/* Optional App Download vs Web Continuation Modal */}
      <AppDownloadModal />
    </div>
      </SecurityWrapper>
    </ErrorBoundary>
  );
}
