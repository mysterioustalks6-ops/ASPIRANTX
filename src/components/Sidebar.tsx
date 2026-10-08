import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab, UserProfile } from '../types';
import { resolveUserAvatar } from '../lib/avatarStorage';
import { EXAM_LIST } from '../lib/examList';
import { loadSessions, computeStreakDays } from '../lib/focus/sessionStore';
import { 
  BookOpen, 
  Timer, 
  CheckSquare, 
  MessageSquare, 
  Crown, 
  Flame, 
  Target,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Users,
  Gift,
  Wrench,
  BookMarked,
  HelpCircle,
  Award,
  Handshake,
  Mic,
  BarChart3,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Sliders,
  GripVertical,
  X,
  ArrowDownRight,
  Smartphone,
  Shield,
  Trophy,
  Download,
  RotateCcw,
  LayoutGrid,
  Search,
  Compass
} from 'lucide-react';

import { AppCustomizerSettings } from '../lib/customizer';
import { CANONICAL_APP_RELEASE } from '../config/appRelease';
import { getCustomExamsFromStorage } from '../lib/customExamStore';
import { ExamSelectModal } from './ExamSelectModal';
import { AdSenseBanner } from './AdSenseBanner';
import { 
  ALL_WORKSPACE_FEATURES, 
  WorkspaceConfig, 
  loadWorkspaceConfig, 
  activateFeatureInWorkspace,
  saveWorkspaceConfig 
} from '../lib/workspacePreferences';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { getLocalizedExamName } from '../lib/subjectUtils';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  user: UserProfile | null;
  onLogout: () => void;
  isAdminUnlocked?: boolean;
  onTriggerAdminSecret?: () => void;
  onOpenProfileModal?: () => void;
  onOpenReferralModal?: () => void;
  onOpenCustomizerModal?: () => void;
  onOpenWorkspaceCustomizer?: () => void;
  customizer?: AppCustomizerSettings;
  selectedExam?: string;
  onExamChange?: (examId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ICON_MAP: Record<string, any> = {
  Target,
  BookOpen,
  CheckSquare,
  Timer,
  Award,
  BookMarked,
  HelpCircle,
  Sparkles,
  MessageSquare,
  Users,
  Mic,
  BarChart3,
  Flame,
  ShieldCheck,
  Gift,
  Crown,
  Handshake,
  Smartphone,
  Shield,
  Trophy,
  Download,
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  isAdminUnlocked = false,
  onTriggerAdminSecret,
  onOpenProfileModal,
  onOpenReferralModal,
  onOpenCustomizerModal,
  onOpenWorkspaceCustomizer,
  customizer,
  selectedExam,
  onExamChange,
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
}) => {
  const { currentLanguage, isHindi: ctxIsHindi } = useLanguage();
  const isHindi = Boolean(ctxIsHindi || currentLanguage === 'hi');
  const [clickCount, setClickCount] = React.useState<number>(0);
  const [isMoreFeaturesOpen, setIsMoreFeaturesOpen] = React.useState<boolean>(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState<boolean>(false);
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig>(() =>
    loadWorkspaceConfig(user?.id)
  );

  const liveStreak = user ? computeStreakDays(loadSessions(user.id)) : 0;

  const [showCustomizeHint, setShowCustomizeHint] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aspirantx_seen_customize_hint') !== 'true';
    } catch {
      return false;
    }
  });

  const dismissCustomizeHint = () => {
    try {
      localStorage.setItem('aspirantx_seen_customize_hint', 'true');
    } catch {}
    setShowCustomizeHint(false);
  };

  // Auto-dismiss the first-time customize hint after ~6 seconds or on window interactions
  useEffect(() => {
    if (!showCustomizeHint) return;

    const timer = setTimeout(() => {
      dismissCustomizeHint();
    }, 6000);

    const handleAnyInteraction = () => {
      dismissCustomizeHint();
    };

    window.addEventListener('click', handleAnyInteraction, { once: true });
    window.addEventListener('keydown', handleAnyInteraction, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleAnyInteraction);
      window.removeEventListener('keydown', handleAnyInteraction);
    };
  }, [showCustomizeHint]);

  const [localCollapsed, setLocalCollapsed] = React.useState<boolean>(() => {
    return localStorage.getItem('aspirantx_sidebar_collapsed') === 'true';
  });

  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : localCollapsed;

  // Listen to workspace config updates from customizer modal, nudges, or other components
  useEffect(() => {
    const handleWorkspaceUpdate = (e: any) => {
      if (e.detail) {
        setWorkspaceConfig(e.detail);
      } else {
        setWorkspaceConfig(loadWorkspaceConfig(user?.id));
      }
    };

    window.addEventListener('aspirantx_workspace_updated', handleWorkspaceUpdate);
    return () => {
      window.removeEventListener('aspirantx_workspace_updated', handleWorkspaceUpdate);
    };
  }, [user?.id]);

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setLocalCollapsed((prev) => {
        const next = !prev;
        localStorage.setItem('aspirantx_sidebar_collapsed', String(next));
        return next;
      });
    }
  };

  const handleLogoSecretClick = () => {
    setClickCount((prev) => prev + 1);
    if (onTriggerAdminSecret) {
      onTriggerAdminSecret();
    }
  };

  const metaMap = new Map();
  ALL_WORKSPACE_FEATURES.forEach((m) => metaMap.set(m.id, m));

  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN' || user?.role === 'CO_ADMIN' || user?.role === 'DEVELOPER';

  // Active features sorted by user's custom sortOrder
  const activePreferences = workspaceConfig.preferences
    .filter((p) => p.isActive)
    .filter((p) => isTeacherOrAdmin || p.featureId !== 'teachers')
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Inactive features for "+ More Features" drawer
  const inactivePreferences = workspaceConfig.preferences
    .filter((p) => !p.isActive)
    .filter((p) => isTeacherOrAdmin || p.featureId !== 'teachers');

  const adminItem = {
    id: 'admin' as ActiveTab,
    label: isHindi ? 'व्यवस्थापक पैनल' : 'Admin Panel',
    icon: ShieldCheck,
    badge: isHindi ? 'व्यवस्थापक' : 'Admin'
  };

  const showAdmin = isAdminUnlocked || activeTab === 'admin' || user?.role === 'ADMIN';

  const handleQuickAddFeature = (e: React.MouseEvent, featureId: ActiveTab) => {
    e.stopPropagation();
    const updated = activateFeatureInWorkspace(featureId, undefined, user?.id);
    setWorkspaceConfig(updated);
    setActiveTab(featureId);
  };

  const renderNavItem = (
    item: { id: ActiveTab; label: string; icon: any; badge: string; defaultLabel?: string },
    isAdmin: boolean = false
  ) => {
    const Icon = item.icon || Target;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        id={`sidebar-nav-${item.id}`}
        onClick={() => setActiveTab(item.id)}
        title={item.label}
        className={`w-full flex items-center ${
          isCollapsed ? 'justify-center px-2' : 'justify-between px-3'
        } py-2.5 rounded-xl text-xs font-bold transition-all duration-150 group relative cursor-pointer ${
          isActive
            ? 'bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] border-2 border-[var(--sr-primary)]/40 shadow-sm'
            : isAdmin
            ? 'text-[var(--sr-coral)] hover:bg-[var(--sr-coral-subtle)]'
            : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)] hover:bg-[var(--sr-surface-2)]'
        }`}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} truncate`}>
          <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
            isActive ? 'text-[var(--sr-primary)]' : isAdmin ? 'text-[var(--sr-coral)]' : 'text-[var(--sr-text-muted)] group-hover:text-[var(--sr-text)]'
          }`} />
          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </div>

        {!isCollapsed && item.badge && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                isActive
                  ? 'bg-[var(--sr-primary)] text-[var(--sr-on-primary)]'
                  : 'bg-[var(--sr-surface-2)] text-[var(--sr-text-subtle)] border border-[var(--sr-line)]'
              }`}
            >
              {item.badge}
            </span>
          </div>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`hidden md:flex ${
        isCollapsed ? 'md:w-16 lg:w-16 p-2' : 'md:w-64 lg:w-72 p-4'
      } bg-[var(--sr-surface)] border-r-2 border-[var(--sr-line-strong)] text-[var(--sr-text)] flex-col justify-between shrink-0 z-30 sticky top-0 h-screen overflow-y-auto transition-all duration-200 select-none`}
    >
      <div className="space-y-4">
        {/* Logo & Brand Header */}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 pb-3 border-b border-slate-800/80">
            <div
              onDoubleClick={handleLogoSecretClick}
              title={`${customizer?.brandName || 'StudyRide'} - Double-tap logo for secret Admin Mode`}
              className="cursor-pointer select-none group"
            >
              <img 
                src={customizer?.logoUrl || '/logo.png'} 
                alt="Brand Logo" 
                className="w-9 h-9 rounded-xl object-cover border border-slate-800 shadow-sm group-hover:scale-105 transition-transform" 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
              />
            </div>

            {onOpenWorkspaceCustomizer && (
              <button
                onClick={onOpenWorkspaceCustomizer}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
                title="Customize Workspace Features & Layout"
                aria-label="Customize Workspace"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 px-1">
            <div
              onDoubleClick={handleLogoSecretClick}
              title="Double-tap logo for secret Admin Mode"
              className="flex items-center gap-3 cursor-pointer select-none group flex-1 min-w-0"
            >
              <img 
                src={customizer?.logoUrl || '/logo.png'} 
                alt="Brand Logo" 
                className="w-9 h-9 rounded-xl object-cover border border-slate-800 shadow-sm group-hover:scale-105 transition-transform shrink-0" 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.png'; }}
              />
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-slate-100 tracking-wide text-sm truncate">
                    {customizer?.brandName || 'StudyRide'}
                  </h1>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-md uppercase shrink-0">
                    {customizer?.brandBadge || 'PRO'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium line-clamp-1">
                  {isHindi ? 'सटीक परीक्षा तैयारी मंच' : (customizer?.brandTagline || 'Precision Exam Prep')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-1">
              {onOpenWorkspaceCustomizer && (
                <button
                  onClick={onOpenWorkspaceCustomizer}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors shrink-0 shadow-sm"
                  title="Personalize My Workspace (Drag & Drop, Rename & Select Features)"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              )}

              {onOpenCustomizerModal && (
                <button
                  onClick={onOpenCustomizerModal}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
                  title="App Design Settings"
                >
                  <Wrench className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={toggleCollapse}
                className="hidden md:flex p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
                title="Collapse Sidebar"
                aria-label="Collapse Sidebar"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Global Active Exam Card - Hidden when collapsed */}
        {!isCollapsed && (
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <Target className="w-3.5 h-3.5 text-sky-400" /> {isHindi ? 'लक्ष्य परीक्षा' : 'Target Exam'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400/30" />
                {liveStreak}{isHindi ? ' दिन' : 'd Streak'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsExamModalOpen(true)}
              className="w-full relative flex items-center justify-between bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-xl px-3 py-2 transition-all cursor-pointer text-left group"
              title={isHindi ? 'लक्ष्य परीक्षा खोजें व बदलें' : 'Search & Change Target Exam'}
            >
              <div className="truncate flex-1 pr-2">
                <span className="text-xs font-semibold text-slate-100 group-hover:text-white truncate block">
                  {getLocalizedExamName(
                    EXAM_LIST.find(e => e.id === (selectedExam || user?.exam))?.label.split(/[–—]/)[0].trim() || (selectedExam || user?.exam || 'NEET (UG)'),
                    isHindi
                  )}
                </span>
                <span className="text-[10px] text-slate-500 group-hover:text-sky-400 flex items-center gap-1 mt-0.5">
                  <Search className="w-2.5 h-2.5" /> {isHindi ? 'सभी परीक्षाएं खोजें' : 'Search all exams'}
                </span>
              </div>
              <span className="text-[10px] text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20 font-bold shrink-0">
                {isHindi ? 'बदलें' : 'Change'}
              </span>
            </button>

            <ExamSelectModal
              isOpen={isExamModalOpen}
              onClose={() => setIsExamModalOpen(false)}
              selectedExam={selectedExam || user?.exam || 'NEET_UG'}
              onExamChange={(val) => {
                if (onExamChange) onExamChange(val);
              }}
              onOpenCustomModal={onOpenProfileModal}
            />
          </div>
        )}

        {/* Refer & Earn Quick Banner - Hidden when collapsed */}
        {!isCollapsed && onOpenReferralModal && (
          <div
            onClick={onOpenReferralModal}
            className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 cursor-pointer hover:border-amber-500/40 transition-all flex items-center justify-between group shadow-card"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                <Gift className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-300">{isHindi ? 'रेफ़र करें और कमाएं' : 'Refer & Earn'}</p>
                <p className="text-[10px] text-slate-400 font-mono">{user?.referralCode || 'ASPIRANT'}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {isHindi ? '+150 सिक्के' : '+150 Coins'}
            </span>
          </div>
        )}

        {/* Section Header: My Workspace */}
        {!isCollapsed && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-sky-400" />
                {isHindi ? 'मेरा कार्यक्षेत्र' : 'My Workspace'}
              </span>
              {onOpenWorkspaceCustomizer && (
                <button
                  onClick={() => {
                    dismissCustomizeHint();
                    onOpenWorkspaceCustomizer();
                  }}
                  className="text-[10px] text-sky-400 hover:text-sky-300 font-bold transition-colors flex items-center gap-1"
                  title={isHindi ? 'उपकरण जोड़ें, हटाएं या क्रम बदलें' : 'Add, remove or reorder tools'}
                >
                  <span>{isHindi ? 'कस्टमाइज़' : 'Customize'}</span>
                  <span>→</span>
                </button>
              )}
            </div>

            {/* First-time contextual nudge (One-time, non-intrusive tooltip) */}
            <AnimatePresence>
              {showCustomizeHint && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissCustomizeHint();
                    if (onOpenWorkspaceCustomizer) onOpenWorkspaceCustomizer();
                  }}
                  className="relative z-20 p-2.5 rounded-xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-sky-950/60 border border-sky-500/40 shadow-lg shadow-sky-950/50 flex items-center justify-between gap-2 cursor-pointer group hover:border-sky-400 transition-all"
                  title={isHindi ? 'कार्यक्षेत्र कस्टमाइज़ करने हेतु क्लिक करें' : 'Click to customize workspace'}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
                    </span>
                    <p className="text-[11px] font-semibold text-sky-200 group-hover:text-white leading-tight">
                      {isHindi ? 'उपकरण जोड़ने या हटाने हेतु कभी भी यहां टैप करें' : 'Tap here to add or remove tools anytime'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissCustomizeHint();
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded-md transition-colors shrink-0"
                    aria-label={isHindi ? 'संकेत हटाएं' : 'Dismiss hint'}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Grouped Information Architecture Navigation */}
        <nav className="space-y-4">
          {/* 1. 5-PILLAR CORE ARCHITECTURE */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-sky-400/90 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-sky-400" />
                  {isHindi ? '5 मुख्य आधार' : '5 Core Pillars'}
                </span>
                <span className="text-[9px] text-sky-500/70 font-mono">{isHindi ? 'आधार 1–5' : 'Pillar 1–5'}</span>
              </div>
            )}
            {renderNavItem({
              id: 'dashboard',
              label: isHindi ? '1. मुख्य पृष्ठ (आज)' : '1. Home (Today)',
              icon: Target,
              badge: isHindi ? 'मुख्य' : 'Hero',
            })}
            {renderNavItem({
              id: 'syllabus',
              label: isHindi ? '2. अध्ययन (पाठ्यक्रम)' : '2. Study (Syllabus)',
              icon: BookOpen,
              badge: isHindi ? 'वृक्ष' : 'Tree',
            })}
            {renderNavItem({
              id: 'practice_hub',
              label: isHindi ? '3. अभ्यास (पीवाईक्यू व सीबीटी)' : '3. Practice (PYQ & CBT)',
              icon: Award,
              badge: isHindi ? 'मॉक' : 'Test',
            })}
            {renderNavItem({
              id: 'progress_hub',
              label: isHindi ? '4. प्रगति (टेलीमेट्री)' : '4. Progress (Telemetry)',
              icon: BarChart3,
              badge: isHindi ? 'रिंग' : 'Rings',
            })}
            {renderNavItem({
              id: 'more_hub',
              label: isHindi ? '5. अन्य (उपकरण व लाभ)' : '5. More (Tools & Perks)',
              icon: LayoutGrid,
              badge: isHindi ? 'सभी' : 'All',
            })}
          </div>

          {/* 2. LEARN DOMAIN */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-sky-400" />
                  {isHindi ? 'अध्ययन सामग्री' : 'Learn'}
                </span>
                <span className="text-[9px] text-slate-600 font-mono">{isHindi ? 'सामग्री' : 'Content'}</span>
              </div>
            )}
            {renderNavItem({
              id: 'syllabus',
              label: isHindi ? 'पाठ्यक्रम ट्रैकर' : 'Syllabus Tracker',
              icon: BookOpen,
              badge: 'AI',
            })}
            {renderNavItem({
              id: 'library',
              label: isHindi ? 'डिजिटल लाइब्रेरी व नोट्स' : 'Digital Library & Notes',
              icon: BookMarked,
              badge: 'PDF',
            })}
            {/* Optional Learn sub-tools if active */}
            {activePreferences.some((p) => p.featureId === 'flashcards') &&
              renderNavItem({
                id: 'flashcards',
                label: isHindi ? 'सक्रिय स्मरण फ़्लैशकार्ड' : 'Active Recall Decks',
                icon: Sparkles,
                badge: isHindi ? 'कार्ड' : 'Cards',
              })}
            {activePreferences.some((p) => p.featureId === 'podcasts') &&
              renderNavItem({
                id: 'podcasts',
                label: isHindi ? 'ऑडियो व्याख्यान श्रृंखला' : 'Audio Lecture Series',
                icon: Mic,
                badge: isHindi ? 'ऑडियो' : 'Audio',
              })}
          </div>

          {/* 3. PRACTICE DOMAIN */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Award className="w-3 h-3 text-emerald-400" />
                  {isHindi ? 'अभ्यास मंच' : 'Practice'}
                </span>
                <span className="text-[9px] text-slate-600 font-mono">{isHindi ? 'परीक्षा तैयारी' : 'Exam Prep'}</span>
              </div>
            )}
            {renderNavItem({
              id: 'cbt',
              label: isHindi ? 'सीबीटी मॉक टेस्ट' : 'CBT Mock Tests',
              icon: Award,
              badge: 'NTA',
            })}
            {renderNavItem({
              id: 'pyq',
              label: isHindi ? 'गत वर्ष प्रश्न (35 वर्ष)' : 'PYQ Archive (35 Yrs)',
              icon: BookMarked,
              badge: '1991–26',
            })}
            {renderNavItem({
              id: 'question_bank',
              label: isHindi ? 'प्रश्न बैंक' : 'Question Bank',
              icon: HelpCircle,
              badge: '4000+',
            })}
          </div>

          {/* 4. PLAN DOMAIN */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Timer className="w-3 h-3 text-indigo-400" />
                  {isHindi ? 'योजना व एकाग्रता' : 'Plan & Focus'}
                </span>
              </div>
            )}
            {renderNavItem({
              id: 'tasks',
              label: isHindi ? 'दैनिक अध्ययन लक्ष्य' : 'Daily Study Tasks',
              icon: CheckSquare,
              badge: isHindi ? 'लक्ष्य' : 'Tasks',
            })}
            {renderNavItem({
              id: 'focus_shield',
              label: isHindi ? 'फ़ोकस शील्ड व ऐप लॉक' : 'Focus Shield & App Lock',
              icon: ShieldCheck,
              badge: isHindi ? 'शील्ड' : 'Shield',
            })}
            {renderNavItem({
              id: 'timer',
              label: isHindi ? 'पोमोडोरो फ़ोकस टाइमर' : 'Pomodoro Focus Timer',
              icon: Timer,
              badge: '25/50m',
            })}
            {renderNavItem({
              id: 'mountain_ride',
              label: isHindi ? 'माउंटेन राइड' : 'Mountain Ride',
              icon: Compass,
              badge: isHindi ? 'शीघ्र' : 'Soon',
            })}
            {activePreferences.some((p) => p.featureId === 'study_buddy') &&
              renderNavItem({
                id: 'study_buddy',
                label: isHindi ? 'अध्ययन साथी' : 'Study Buddy',
                icon: Users,
                badge: 'Sync',
              })}
          </div>

          {/* 5. IMPROVE / ANALYTICS DOMAIN */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="w-3 h-3 text-amber-400" />
                  {isHindi ? 'सुधार व विश्लेषण' : 'Improve'}
                </span>
              </div>
            )}
            {renderNavItem({
              id: 'weakness',
              label: isHindi ? 'कमजोर विषय व सटीकता' : 'Weak Areas & Accuracy',
              icon: BarChart3,
              badge: 'AI',
            })}
            {renderNavItem({
              id: 'leaderboard',
              label: isHindi ? 'अखिल भारतीय रैंक' : 'All-India Rank',
              icon: Flame,
              badge: 'AIR',
            })}
            {activePreferences.some((p) => p.featureId === 'eligibility') &&
              renderNavItem({
                id: 'eligibility',
                label: isHindi ? 'पात्रता जांचकर्ता' : 'Eligibility Checker',
                icon: ShieldCheck,
                badge: isHindi ? 'जांच' : 'Check',
              })}
          </div>

          {/* 6. CONNECT DOMAIN */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3 text-purple-400" />
                  {isHindi ? 'मार्गदर्शन व समुदाय' : 'Connect'}
                </span>
              </div>
            )}
            {renderNavItem({
              id: 'chat',
              label: isHindi ? 'एआई अध्ययन गुरु' : 'AI Study Mentor',
              icon: Sparkles,
              badge: 'AI',
            })}
            {renderNavItem({
              id: 'community',
              label: isHindi ? 'परीक्षार्थी समुदाय' : 'Aspirants Community',
              icon: Users,
              badge: isHindi ? 'फ़ोरम' : 'Forum',
            })}
          </div>

          {/* 7. ACCOUNT & PERKS DOMAIN */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Crown className="w-3 h-3 text-amber-400" />
                  {isHindi ? 'खाता व सुविधाएं' : 'Account & Perks'}
                </span>
              </div>
            )}
            {renderNavItem({
              id: 'premium',
              label: isHindi ? 'प्रीमियम सदस्यता' : 'Premium Subscription',
              icon: Crown,
              badge: isHindi ? 'प्रो' : 'Pro',
            })}
            {renderNavItem({
              id: 'reward_milestones',
              label: isHindi ? 'पुरस्कार व उपलब्धियां' : 'Rewards & Milestones',
              icon: Gift,
              badge: isHindi ? 'सिक्के' : 'Coins',
            })}
            {activePreferences.some((p) => p.featureId === 'wallpaper') &&
              renderNavItem({
                id: 'wallpaper',
                label: isHindi ? 'आदतें वॉलपेपर' : 'Habit Wallpaper',
                icon: Smartphone,
                badge: 'HD',
              })}
          </div>

          {/* 8. FACULTY / ADMIN SECTION (Role-Gated) */}
          {(showAdmin || isTeacherOrAdmin) && (
            <div className="pt-2 border-t border-slate-800/80 space-y-1">
              {!isCollapsed && (
                <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-rose-400/90 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-rose-400" />
                  {isHindi ? 'प्रशासन' : 'Administration'}
                </div>
              )}
              {showAdmin && renderNavItem(adminItem, true)}
              {isTeacherOrAdmin && (
                <>
                  {renderNavItem({
                    id: 'teachers',
                    label: isHindi ? 'शिक्षक पोर्टल' : 'Teacher Portal',
                    icon: Users,
                    badge: isHindi ? 'संकाय' : 'Faculty',
                  })}
                  {renderNavItem({
                    id: 'blog_submit',
                    label: isHindi ? 'ब्लॉग प्रकाशित करें' : 'Publish Blog Post',
                    icon: BookOpen,
                    badge: isHindi ? 'संपादक' : 'Editor',
                  })}
                </>
              )}
            </div>
          )}
        </nav>

        {/* "+ Add More Features" Drawer (Collapsible) */}
        {!isCollapsed && inactivePreferences.length > 0 && (
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setIsMoreFeaturesOpen(!isMoreFeaturesOpen)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 text-xs font-semibold text-slate-300 hover:text-white transition-all group"
            >
              <div className="flex items-center gap-2 truncate">
                <Plus className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate">{isHindi ? 'अतिरिक्त सुविधाएं जोड़ें' : 'Add More Features'}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {inactivePreferences.length} {isHindi ? 'छिपी हुई' : 'hidden'}
                </span>
                {isMoreFeaturesOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
            </button>

            {isMoreFeaturesOpen && (
              <div className="mt-2 space-y-1.5 p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 max-h-56 overflow-y-auto pr-1">
                {inactivePreferences.map((pref) => {
                  const meta = metaMap.get(pref.featureId);
                  if (!meta) return null;
                  const Icon = ICON_MAP[meta.iconName] || Target;

                  return (
                    <div
                      key={pref.featureId}
                      onClick={() => setActiveTab(pref.featureId)}
                      className="p-2 rounded-lg bg-slate-900/60 hover:bg-slate-900 border border-slate-800/60 flex items-center justify-between gap-2 cursor-pointer transition-colors group"
                      title={meta.shortDescription}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-400 shrink-0" />
                        <span className="text-xs text-slate-300 group-hover:text-white truncate font-medium">
                          {meta.defaultLabel}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleQuickAddFeature(e, pref.featureId)}
                        className="px-2 py-0.5 rounded bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0"
                        title={isHindi ? 'सक्रिय कार्यक्षेत्र में जोड़ें' : 'Add this feature to active workspace'}
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>{isHindi ? 'जोड़ें' : 'Add'}</span>
                      </button>
                    </div>
                  );
                })}

                {onOpenWorkspaceCustomizer && (
                  <button
                    onClick={onOpenWorkspaceCustomizer}
                    className="w-full text-center py-1.5 text-[11px] text-sky-400 hover:text-sky-300 font-bold transition-colors"
                  >
                    {isHindi ? 'संपूर्ण अनुकूलक खोलें →' : 'Open Full Customizer →'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Sidebar AdSense Ad Unit - Hidden when collapsed */}
        {!isCollapsed && (
          <div className="pt-3 border-t border-slate-800/80">
            <AdSenseBanner slotType="sidebar" isPremium={user?.isPremium} />
          </div>
        )}
      </div>

      {/* User Footer Profile */}
      <div className="pt-4 mt-6 border-t border-slate-800">
        {user ? (
          isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div 
                onClick={onOpenProfileModal}
                className="cursor-pointer group"
                title={`${user.name} - ${isHindi ? 'खाता सेटिंग्स' : 'My Account Settings'}`}
              >
                <img
                  src={resolveUserAvatar(user.avatar_url, user.id, user.email)}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-700 group-hover:border-sky-500 transition-colors"
                />
              </div>
              <button
                id="logout-btn"
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title={isHindi ? 'लॉग आउट' : 'Sign Out'}
                aria-label={isHindi ? 'लॉग आउट' : 'Sign Out'}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div 
                onClick={onOpenProfileModal}
                className="flex items-center gap-2.5 overflow-hidden cursor-pointer group flex-1 min-w-0"
              >
                <img
                  src={resolveUserAvatar(user.avatar_url, user.id, user.email)}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-700 group-hover:border-sky-500 transition-colors shrink-0"
                />
                <div className="truncate min-w-0">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-sky-300 transition-colors truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{isHindi ? 'खाता सेटिंग्स' : 'My Account Settings'}</p>
                </div>
              </div>

              <button
                id="logout-btn"
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0 ml-1"
                title={isHindi ? 'लॉग आउट' : 'Sign Out'}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )
        ) : null}

        {/* Live Version & In-App Update Trigger */}
        {!isCollapsed && (
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-400 font-medium">
            <span>StudyRide v{CANONICAL_APP_RELEASE.version}</span>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('studyride:check-update'))}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer text-slate-400 hover:underline"
              title={isHindi ? 'नवीनतम अपडेट जांचें' : 'Check for newest updates'}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isHindi ? 'अपडेट जांचें' : 'Check updates'}</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};


