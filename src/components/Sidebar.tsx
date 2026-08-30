import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveTab, UserProfile } from '../types';
import { EXAM_LIST } from '../lib/examList';
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
  ArrowDownRight
} from 'lucide-react';

import { AppCustomizerSettings } from '../lib/customizer';
import { getCustomExamsFromStorage } from '../lib/customExamStore';
import { AdSenseBanner } from './AdSenseBanner';
import { 
  ALL_WORKSPACE_FEATURES, 
  WorkspaceConfig, 
  loadWorkspaceConfig, 
  activateFeatureInWorkspace,
  saveWorkspaceConfig 
} from '../lib/workspacePreferences';

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
  const [clickCount, setClickCount] = React.useState<number>(0);
  const [isMoreFeaturesOpen, setIsMoreFeaturesOpen] = React.useState<boolean>(false);
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig>(() =>
    loadWorkspaceConfig(user?.id)
  );

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
    label: 'Admin Panel',
    icon: ShieldCheck,
    badge: 'Admin'
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
        } py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
          isActive
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
            : isAdmin
            ? 'text-rose-400 hover:bg-rose-500/10 hover:text-rose-300'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
        }`}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} truncate`}>
          <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
            isActive ? 'text-white' : isAdmin ? 'text-rose-400' : 'text-slate-400 group-hover:text-slate-200'
          }`} />
          {!isCollapsed && <span className="truncate">{item.label}</span>}
        </div>

        {!isCollapsed && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
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
      } bg-slate-950 border-r border-slate-800/80 flex-col justify-between shrink-0 z-30 sticky top-0 h-screen overflow-y-auto transition-all duration-200`}
    >
      <div className="space-y-4">
        {/* Logo & Brand Header */}
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2 pb-3 border-b border-slate-800/80">
            <div
              onClick={handleLogoSecretClick}
              onDoubleClick={handleLogoSecretClick}
              title={`${customizer?.brandName || 'ASPIRANTX'} - Double-tap logo for secret Admin Mode`}
              className="cursor-pointer select-none group"
            >
              {customizer?.logoUrl ? (
                <img 
                  src={customizer.logoUrl} 
                  alt="Brand Logo" 
                  className="w-9 h-9 rounded-xl object-cover border border-slate-800 shadow-sm group-hover:scale-105 transition-transform" 
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform shrink-0">
                  {customizer?.logoIconText || 'AX'}
                </div>
              )}
            </div>

            {onOpenWorkspaceCustomizer && (
              <button
                onClick={onOpenWorkspaceCustomizer}
                className="p-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-400 hover:text-indigo-200 transition-colors"
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
              onClick={handleLogoSecretClick}
              onDoubleClick={handleLogoSecretClick}
              title="Double-tap logo for secret Admin Mode"
              className="flex items-center gap-3 cursor-pointer select-none group flex-1 min-w-0"
            >
              {customizer?.logoUrl ? (
                <img 
                  src={customizer.logoUrl} 
                  alt="Brand Logo" 
                  className="w-9 h-9 rounded-xl object-cover border border-slate-800 shadow-sm group-hover:scale-105 transition-transform shrink-0" 
                />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform shrink-0">
                  {customizer?.logoIconText || 'AX'}
                </div>
              )}
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-slate-100 tracking-wide text-sm truncate">
                    {customizer?.brandName || 'ASPIRANTX'}
                  </h1>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md uppercase shrink-0">
                    {customizer?.brandBadge || 'PRO'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium line-clamp-1">
                  {customizer?.brandTagline || 'Exam Prep Suite'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-1">
              {onOpenWorkspaceCustomizer && (
                <button
                  onClick={onOpenWorkspaceCustomizer}
                  className="p-2 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-400 hover:text-indigo-200 transition-colors shrink-0 shadow-sm"
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
                <Target className="w-3.5 h-3.5 text-indigo-400" /> Target Exam
              </span>
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400/30" />
                {user?.streakDays ?? 1}d Streak
              </span>
            </div>

            <div className="relative flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
              <div className="truncate flex-1">
                <select
                  value={selectedExam || user?.exam || 'NEET_UG'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '__CREATE_CUSTOM__') {
                      if (onOpenProfileModal) onOpenProfileModal();
                    } else if (onExamChange) {
                      onExamChange(val);
                    }
                  }}
                  className="w-full bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer border-none p-0 truncate"
                >
                  <optgroup label="Preset Exams">
                    {EXAM_LIST.map((ex) => (
                      <option key={ex.id} value={ex.id} className="bg-slate-900 text-slate-200 font-medium">
                        {ex.label}
                      </option>
                    ))}
                  </optgroup>
                  {getCustomExamsFromStorage().length > 0 && (
                    <optgroup label="My Custom Exams">
                      {getCustomExamsFromStorage().map((ce) => (
                        <option key={ce.id} value={ce.id} className="bg-slate-900 text-indigo-300 font-semibold">
                          ✨ {ce.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <option value="__CREATE_CUSTOM__" className="bg-slate-900 text-amber-400 font-bold">
                    + Create Custom Exam...
                  </option>
                </select>
              </div>
              <button
                onClick={onOpenProfileModal}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold px-1.5 py-0.5 rounded transition-colors shrink-0 ml-1"
              >
                Edit
              </button>
            </div>
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
                <p className="text-xs font-semibold text-amber-300">Refer & Earn</p>
                <p className="text-[10px] text-slate-400 font-mono">{user?.referralCode || 'ASPIRANT'}</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              +150 Coins
            </span>
          </div>
        )}

        {/* Section Header: My Workspace */}
        {!isCollapsed && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3 h-3 text-indigo-400" />
                My Workspace
              </span>
              {onOpenWorkspaceCustomizer && (
                <button
                  onClick={() => {
                    dismissCustomizeHint();
                    onOpenWorkspaceCustomizer();
                  }}
                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors flex items-center gap-1"
                  title="Add, remove or reorder tools"
                >
                  <span>Customize</span>
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
                  className="relative z-20 p-2.5 rounded-xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/50 shadow-lg shadow-indigo-950/60 flex items-center justify-between gap-2 cursor-pointer group hover:border-indigo-400 transition-all"
                  title="Click to customize workspace"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                    </span>
                    <p className="text-[11px] font-semibold text-indigo-200 group-hover:text-white leading-tight">
                      Tap here to add or remove tools anytime
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissCustomizeHint();
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded-md transition-colors shrink-0"
                    aria-label="Dismiss hint"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Active Features Ordered By User */}
        <nav className="space-y-1">
          {activePreferences.map((pref) => {
            const meta = metaMap.get(pref.featureId);
            if (!meta) return null;
            const Icon = ICON_MAP[meta.iconName] || Target;

            return renderNavItem({
              id: pref.featureId,
              label: pref.customLabel || meta.defaultLabel,
              defaultLabel: meta.defaultLabel,
              icon: Icon,
              badge: meta.badge,
            });
          })}

          {/* "+ N More Features" Prominent Hint Card at Bottom of Nav List */}
          {inactivePreferences.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                dismissCustomizeHint();
                if (onOpenWorkspaceCustomizer) {
                  onOpenWorkspaceCustomizer();
                } else {
                  setIsMoreFeaturesOpen(!isMoreFeaturesOpen);
                }
              }}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2.5'
              } rounded-xl border border-dashed border-indigo-500/50 bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-300 hover:text-white transition-all duration-200 group mt-2 shadow-sm min-h-[40px]`}
              title={`See all ${inactivePreferences.length} more available tools`}
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} min-w-0`}>
                <div className="w-5 h-5 rounded-full border border-dashed border-indigo-400/80 flex items-center justify-center bg-indigo-500/20 group-hover:scale-110 transition-transform shrink-0">
                  <Plus className="w-3 h-3 text-indigo-300 group-hover:text-white" />
                </div>
                {!isCollapsed && (
                  <div className="text-left truncate">
                    <p className="text-xs font-bold text-indigo-200 group-hover:text-white truncate">
                      + {inactivePreferences.length} more tools available
                    </p>
                    <p className="text-[10px] text-indigo-400/80 font-medium truncate">
                      Tap to add to sidebar
                    </p>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                  Add Tools
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                dismissCustomizeHint();
                if (onOpenWorkspaceCustomizer) onOpenWorkspaceCustomizer();
              }}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2.5'
              } rounded-xl border border-dashed border-slate-700/70 bg-slate-900/40 hover:bg-slate-900 text-slate-400 hover:text-slate-200 transition-all duration-200 group mt-2 min-h-[40px]`}
              title="Personalize and reorder your workspace tools"
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} min-w-0`}>
                <Sliders className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
                {!isCollapsed && (
                  <span className="text-xs font-medium text-slate-300 group-hover:text-white truncate">
                    Personalize & reorder tools
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <span className="text-[10px] font-semibold text-slate-500 group-hover:text-indigo-300 transition-colors shrink-0">
                  Edit →
                </span>
              )}
            </button>
          )}

          {/* Admin panel if unlocked */}
          {showAdmin && (
            <div className="pt-2 border-t border-slate-800">
              {renderNavItem(adminItem, true)}
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
                <Plus className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
                <span className="truncate">Add More Features</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  {inactivePreferences.length} hidden
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
                        <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 shrink-0" />
                        <span className="text-xs text-slate-300 group-hover:text-white truncate font-medium">
                          {meta.defaultLabel}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleQuickAddFeature(e, pref.featureId)}
                        className="px-2 py-0.5 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors shrink-0"
                        title="Add this feature to active workspace"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  );
                })}

                {onOpenWorkspaceCustomizer && (
                  <button
                    onClick={onOpenWorkspaceCustomizer}
                    className="w-full text-center py-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
                  >
                    Open Full Customizer →
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
                title={`${user.name} - My Account Settings`}
              >
                <img
                  src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-700 group-hover:border-indigo-500 transition-colors"
                />
              </div>
              <button
                id="logout-btn"
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
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
                  src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-700 group-hover:border-indigo-500 transition-colors shrink-0"
                />
                <div className="truncate min-w-0">
                  <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">My Account Settings</p>
                </div>
              </div>

              <button
                id="logout-btn"
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0 ml-1"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )
        ) : null}
      </div>
    </aside>
  );
};


