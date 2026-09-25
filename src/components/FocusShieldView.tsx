import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Play, 
  Pause, 
  RotateCcw, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Flame, 
  Trophy, 
  Lock, 
  Smartphone, 
  ShieldCheck, 
  Sparkles,
  WifiOff,
  AlertTriangle,
  ExternalLink,
  Search,
  CheckCheck,
  X,
  Calendar,
  Layers,
  User,
  Plus,
  Coins,
  ChevronRight,
  TrendingUp,
  Volume2,
  VolumeX,
  Trash2,
  Edit2,
  Timer,
  Zap,
  Target
} from 'lucide-react';
import { UserProfile, TrophyItem } from '../types';
import { PressFeedback, triggerConfetti } from '../lib/animations';
import { getApiUrl } from '../lib/apiConfig';
import { AvatarStudioModal, AvatarConfig, DEFAULT_AVATAR_CONFIG } from './AvatarStudioModal';
import { AspirantAvatar } from './AspirantAvatar';
import { AppPickerModal, DistractingApp, FALLBACK_DEVICE_APPS } from './AppPickerModal';
import { AppGroupModal, AppGroup } from './AppGroupModal';

declare const Capacitor: any;

const callNativePlugin = async (method: string, data: any = {}) => {
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
    try {
      const { Plugins } = (window as any).Capacitor;
      if (Plugins?.FocusShield && typeof Plugins.FocusShield[method] === 'function') {
        return await Plugins.FocusShield[method](data);
      }
    } catch (e: any) {
      console.warn(`[FocusShield] Native plugin call ${method} failed:`, e?.message || e);
    }
  }
  return null;
};

interface FocusShieldViewProps {
  user: UserProfile | null;
  onTrophyUnlock?: (unlocked: any) => void;
}

export interface StudySchedule {
  id: string;
  name: string;
  tag: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  days: number[]; // 1 = Sun, 2 = Mon ... 7 = Sat
  enabled: boolean;
  streakDays: number;
  blockedPackages: string[];
  muteNotifications: boolean;
}

export const DEFAULT_APP_GROUPS: AppGroup[] = [
  {
    id: 'group_social',
    name: 'Social Media',
    icon: '📱',
    color: '#EC4899',
    packages: [
      'com.instagram.android',
      'com.facebook.katana',
      'com.snapchat.android',
      'com.twitter.android',
      'com.reddit.frontpage',
      'com.whatsapp',
      'org.telegram.messenger'
    ],
    dailyLimitMinutes: 30,
    blockMode: 'LIMIT',
    enabled: false,
    isCustom: false
  },
  {
    id: 'group_entertainment',
    name: 'Entertainment & Videos',
    icon: '🎬',
    color: '#8B5CF6',
    packages: [
      'com.google.android.youtube',
      'com.netflix.mediaclient',
      'in.startv.hotstar',
      'com.amazon.avod.thirdpartyclient',
      'com.spotify.music'
    ],
    dailyLimitMinutes: 45,
    blockMode: 'LIMIT',
    enabled: false,
    isCustom: false
  },
  {
    id: 'group_gaming',
    name: 'Gaming & Esports',
    icon: '🎮',
    color: '#EF4444',
    packages: [
      'com.pubg.imobile',
      'com.dts.freefireth',
      'com.king.candycrushsaga',
      'com.roblox.client',
      'com.ludo.king'
    ],
    dailyLimitMinutes: 20,
    blockMode: 'LIMIT',
    enabled: false,
    isCustom: false
  },
  {
    id: 'group_shopping',
    name: 'Shopping & Delivery',
    icon: '🛍️',
    color: '#F59E0B',
    packages: [
      'com.flipkart.android',
      'com.amazon.mShop.android.shopping',
      'com.myntra.android',
      'in.swiggy.android',
      'com.application.zomato'
    ],
    dailyLimitMinutes: 20,
    blockMode: 'LIMIT',
    enabled: false,
    isCustom: false
  }
];

const DEFAULT_SCHEDULES: StudySchedule[] = [];

export const FocusShieldView: React.FC<FocusShieldViewProps> = ({ user, onTrophyUnlock }) => {
  // Navigation Tabs: 'FOCUS' | 'PLANNER' | 'BLOCKS' | 'PROFILE'
  const [activeTab, setActiveTab] = useState<'FOCUS' | 'PLANNER' | 'BLOCKS' | 'PROFILE'>('FOCUS');

  // Focus Goal & Screen Time
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(180); // 3 Hours
  const [screenTimeData, setScreenTimeData] = useState<{
    totalScreenTimeMinutes: number;
    productiveMinutes: number;
    distractionMinutes: number;
  }>({
    totalScreenTimeMinutes: 0,
    productiveMinutes: 0,
    distractionMinutes: 0
  });

  // Timer & Session
  const [selectedDuration, setSelectedDuration] = useState<number>(25);
  const [customDuration, setCustomDuration] = useState<string>('45');
  const [sessionState, setSessionState] = useState<'IDLE' | 'STARTING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'>('IDLE');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [totalRequestedSeconds, setTotalRequestedSeconds] = useState<number>(25 * 60);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Installed & Blocked Apps
  const [installedApps, setInstalledApps] = useState<DistractingApp[]>([]);
  const [selectedApps, setSelectedApps] = useState<string[]>([
    'com.instagram.android',
    'com.google.android.youtube'
  ]);

  // App Daily Limits Quotas (package -> limitMinutes)
  const [appDailyLimits, setAppDailyLimits] = useState<Record<string, number>>({});

  // Shorts & Reels Granular Block
  const [blockShorts, setBlockShorts] = useState<boolean>(false);
  const [blockReels, setBlockReels] = useState<boolean>(false);
  const [allowFirstShort, setAllowFirstShort] = useState<boolean>(false);
  const [youtubeStudyMode, setYoutubeStudyMode] = useState<boolean>(false);

  // App Groups (Regain Feature)
  const [appGroups, setAppGroups] = useState<AppGroup[]>(() => {
    try {
      const saved = localStorage.getItem('studyride_app_groups');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_APP_GROUPS;
  });
  const [showAppPickerModal, setShowAppPickerModal] = useState<boolean>(false);
  const [showGroupModal, setShowGroupModal] = useState<boolean>(false);
  const [editingGroup, setEditingGroup] = useState<AppGroup | null>(null);

  // Schedules
  const [schedules, setSchedules] = useState<StudySchedule[]>(DEFAULT_SCHEDULES);
  const [showAddScheduleModal, setShowAddScheduleModal] = useState<boolean>(false);
  const [newScheduleName, setNewScheduleName] = useState<string>('');
  const [newScheduleTag, setNewScheduleTag] = useState<string>('GS Revision');
  const [newScheduleStart, setNewScheduleStart] = useState<string>('06:00');
  const [newScheduleEnd, setNewScheduleEnd] = useState<string>('08:00');
  const [newScheduleDays, setNewScheduleDays] = useState<number[]>([2, 3, 4, 5, 6, 7]);

  // App Limit Dialog
  const [showAddLimitModal, setShowAddLimitModal] = useState<boolean>(false);
  const [limitAppPkg, setLimitAppPkg] = useState<string>('com.google.android.youtube');
  const [limitMinutesVal, setLimitMinutesVal] = useState<number>(30);

  // Avatar Studio
  const [showAvatarStudio, setShowAvatarStudio] = useState<boolean>(false);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(DEFAULT_AVATAR_CONFIG);

  // Permissions & Telemetry
  const [permStatus, setPermStatus] = useState<{ hasUsageStats?: boolean; hasOverlay?: boolean; hasAccessibility?: boolean; canBlock?: boolean }>({});
  const [showStrictFrictionModal, setShowStrictFrictionModal] = useState<boolean>(false);
  const [frictionCountdown, setFrictionCountdown] = useState<number>(15);
  const [frictionInput, setFrictionInput] = useState<string>('');
  const frictionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const STRICT_PLEDGE = "I AM GIVING UP MY STUDY GOAL";

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial data and restore local states
  useEffect(() => {
    // 1. Restore Avatar
    try {
      const savedAvatar = localStorage.getItem('studyride_user_avatar');
      if (savedAvatar) setAvatarConfig(JSON.parse(savedAvatar));
    } catch (e) {}

    // 2. Restore Schedules
    try {
      const savedSched = localStorage.getItem('studyride_study_schedules');
      if (savedSched) setSchedules(JSON.parse(savedSched));
    } catch (e) {}

    // 3. Restore Limits
    try {
      const savedLimits = localStorage.getItem('studyride_app_limits');
      if (savedLimits) setAppDailyLimits(JSON.parse(savedLimits));
    } catch (e) {}

    // 4. Query Real Native Permissions & Usage Stats
    const initDevice = async () => {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
        const perms = await callNativePlugin('checkBlockerPermissions');
        if (perms) setPermStatus(perms);

        const appsRes = await callNativePlugin('getInstalledApps');
        if (appsRes?.apps && Array.isArray(appsRes.apps)) {
          setInstalledApps(appsRes.apps);
        }

        const groupsRes = await callNativePlugin('getAppGroups');
        if (groupsRes?.groups && Array.isArray(groupsRes.groups) && groupsRes.groups.length > 0) {
          setAppGroups(groupsRes.groups);
        }

        const usageRes = await callNativePlugin('getDailyUsageStats');
        if (usageRes && usageRes.hasPermission) {
          setScreenTimeData({
            totalScreenTimeMinutes: usageRes.totalScreenTimeMinutes || 0,
            productiveMinutes: usageRes.productiveMinutes || 0,
            distractionMinutes: usageRes.distractionMinutes || 0
          });
        }

        const rules = await callNativePlugin('getGranularBlockRules');
        if (rules) {
          if (rules.blockShorts !== undefined) setBlockShorts(rules.blockShorts);
          if (rules.blockReels !== undefined) setBlockReels(rules.blockReels);
          if (rules.youtubeStudyMode !== undefined) setYoutubeStudyMode(rules.youtubeStudyMode);
        }
      }
    };
    initDevice();
  }, []);

  const handleToggleShorts = async () => {
    if (!permStatus.hasUsageStats) {
      await callNativePlugin('openUsageAccessSettings');
      const p = await callNativePlugin('checkBlockerPermissions');
      if (p) setPermStatus(p);
      return;
    }
    if (!permStatus.hasOverlay) {
      await callNativePlugin('openOverlaySettings');
      const p = await callNativePlugin('checkBlockerPermissions');
      if (p) setPermStatus(p);
      return;
    }
    const nextVal = !blockShorts;
    setBlockShorts(nextVal);
    await callNativePlugin('setGranularBlockRules', {
      blockShorts: nextVal,
      blockReels,
      youtubeStudyMode
    });
  };

  const handleToggleReels = async () => {
    if (!permStatus.hasUsageStats) {
      await callNativePlugin('openUsageAccessSettings');
      const p = await callNativePlugin('checkBlockerPermissions');
      if (p) setPermStatus(p);
      return;
    }
    if (!permStatus.hasOverlay) {
      await callNativePlugin('openOverlaySettings');
      const p = await callNativePlugin('checkBlockerPermissions');
      if (p) setPermStatus(p);
      return;
    }
    const nextVal = !blockReels;
    setBlockReels(nextVal);
    await callNativePlugin('setGranularBlockRules', {
      blockShorts,
      blockReels: nextVal,
      youtubeStudyMode
    });
  };

  const handleToggleStudyMode = async () => {
    const nextVal = !youtubeStudyMode;
    setYoutubeStudyMode(nextVal);
    await callNativePlugin('setGranularBlockRules', {
      blockShorts,
      blockReels,
      youtubeStudyMode: nextVal
    });
  };

  // Save schedules and sync with native plugin
  const handleToggleSchedule = async (id: string) => {
    const updated = schedules.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s);
    setSchedules(updated);
    localStorage.setItem('studyride_study_schedules', JSON.stringify(updated));
    await callNativePlugin('setStudySchedules', { schedules: updated });
  };

  const handleCreateSchedule = async () => {
    if (!newScheduleName.trim()) return;
    const [sH, sM] = newScheduleStart.split(':').map(Number);
    const [eH, eM] = newScheduleEnd.split(':').map(Number);

    const newSched: StudySchedule = {
      id: `sched_${Date.now()}`,
      name: newScheduleName.trim(),
      tag: newScheduleTag,
      startHour: sH || 6,
      startMinute: sM || 0,
      endHour: eH || 8,
      endMinute: eM || 0,
      days: newScheduleDays,
      enabled: true,
      streakDays: 1,
      blockedPackages: selectedApps,
      muteNotifications: true
    };

    const updated = [...schedules, newSched];
    setSchedules(updated);
    localStorage.setItem('studyride_study_schedules', JSON.stringify(updated));
    await callNativePlugin('setStudySchedules', { schedules: updated });
    setShowAddScheduleModal(false);
    setNewScheduleName('');
  };

  const handleDeleteSchedule = async (id: string) => {
    const updated = schedules.filter(s => s.id !== id);
    setSchedules(updated);
    localStorage.setItem('studyride_study_schedules', JSON.stringify(updated));
    await callNativePlugin('setStudySchedules', { schedules: updated });
  };

  // Save App Daily Limits
  const handleSaveAppLimit = async () => {
    const updated = { ...appDailyLimits, [limitAppPkg]: limitMinutesVal };
    setAppDailyLimits(updated);
    localStorage.setItem('studyride_app_limits', JSON.stringify(updated));
    await callNativePlugin('setAppDailyLimits', { limits: updated });
    setShowAddLimitModal(false);
  };

  const handleRemoveAppLimit = async (pkg: string) => {
    const updated = { ...appDailyLimits };
    delete updated[pkg];
    setAppDailyLimits(updated);
    localStorage.setItem('studyride_app_limits', JSON.stringify(updated));
    await callNativePlugin('setAppDailyLimits', { limits: updated });
  };

  // Group Handlers (Regain Feature)
  const getGroupUsageMinutes = (group: AppGroup) => {
    let total = 0;
    group.packages.forEach(pkg => {
      const app = installedApps.find(a => a.package === pkg) || FALLBACK_DEVICE_APPS.find(a => a.package === pkg);
      if (app && app.usageMinutes) total += app.usageMinutes;
    });
    return total;
  };

  const handleToggleGroup = async (groupId: string) => {
    const updated = appGroups.map(g => g.id === groupId ? { ...g, enabled: !g.enabled } : g);
    setAppGroups(updated);
    localStorage.setItem('studyride_app_groups', JSON.stringify(updated));
    await callNativePlugin('setAppGroups', { groups: updated });
  };

  const handleSaveGroup = async (savedGroup: AppGroup) => {
    const exists = appGroups.some(g => g.id === savedGroup.id);
    const updated = exists
      ? appGroups.map(g => g.id === savedGroup.id ? savedGroup : g)
      : [...appGroups, savedGroup];
    setAppGroups(updated);
    localStorage.setItem('studyride_app_groups', JSON.stringify(updated));
    await callNativePlugin('setAppGroups', { groups: updated });
  };

  const handleDeleteGroup = async (groupId: string) => {
    const updated = appGroups.filter(g => g.id !== groupId);
    setAppGroups(updated);
    localStorage.setItem('studyride_app_groups', JSON.stringify(updated));
    await callNativePlugin('setAppGroups', { groups: updated });
  };

  // Multi-App Picker Saver for Device Apps
  const handleSavePickedApps = async (selectedPkgs: string[], quotaMins?: number) => {
    const q = quotaMins || 30;
    const updated = { ...appDailyLimits };
    selectedPkgs.forEach(pkg => {
      if (!updated[pkg]) updated[pkg] = q;
    });
    setAppDailyLimits(updated);
    localStorage.setItem('studyride_app_limits', JSON.stringify(updated));
    await callNativePlugin('setAppDailyLimits', { limits: updated });
  };

  // Timer Session Execution
  const handleStartSession = async () => {
    if (!permStatus.hasUsageStats) {
      await callNativePlugin('openUsageAccessSettings');
      const p = await callNativePlugin('checkBlockerPermissions');
      if (p) setPermStatus(p);
      return;
    }
    if (!permStatus.hasOverlay) {
      await callNativePlugin('openOverlaySettings');
      const p = await callNativePlugin('checkBlockerPermissions');
      if (p) setPermStatus(p);
      return;
    }

    const durMins = selectedDuration === -1 ? Math.max(5, parseInt(customDuration, 10) || 45) : selectedDuration;
    const durSecs = durMins * 60;

    setSessionState('STARTING');
    setTotalRequestedSeconds(durSecs);
    setRemainingSeconds(durSecs);

    const res = await callNativePlugin('startShield', {
      apps: selectedApps,
      durationMinutes: durMins,
      durationSeconds: durSecs
    });

    setSessionState('ACTIVE');
    setActiveSessionId(`foc_${Date.now()}`);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setSessionState('COMPLETED');
          callNativePlugin('stopShield');
          triggerConfetti();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleGiveUpPledge = async () => {
    if (frictionInput.trim() !== STRICT_PLEDGE) return;
    if (timerRef.current) clearInterval(timerRef.current);
    await callNativePlugin('stopShield');
    setSessionState('IDLE');
    setShowStrictFrictionModal(false);
    setFrictionInput('');
  };

  // Progress Calculations
  const focusedMins = Math.floor((totalRequestedSeconds - remainingSeconds) / 60);
  const goalPercent = Math.min(100, Math.round((screenTimeData.productiveMinutes / dailyGoalMinutes) * 100));

  return (
    <div className="min-h-screen bg-[#0C0F0D] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black">
      {/* ── TOP APP BAR ── */}
      <div className="sticky top-0 z-40 bg-[#0C0F0D]/90 backdrop-blur-xl border-b border-[#1E2520] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">Focus Shield Pro</h1>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950">PRO</span>
              </div>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Protection Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Streak Flame Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161B18] border border-[#1E2520]">
              <span className="text-amber-400 font-bold text-xs flex items-center gap-1">
                🔥 {user?.streakDays || 0}d
              </span>
            </div>

            {/* Coins Balance */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161B18] border border-[#1E2520]">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-white">{user?.coins || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4-TAB PILL SELECTOR (Focus, Planner, Blocks, Profile) ── */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-1 pb-1">
        <div className="bg-[#121614] border border-[#1E2520] rounded-2xl p-1.5 flex items-center justify-between gap-1 shadow-lg">
          {[
            { id: 'FOCUS', label: 'Focus', icon: Timer },
            { id: 'PLANNER', label: 'Planner', icon: Calendar },
            { id: 'BLOCKS', label: 'Blocks', icon: Shield },
            { id: 'PROFILE', label: 'Profile', icon: User }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div className="max-w-2xl mx-auto w-full flex-1 px-4 py-4 pb-28">
        {/* ══════════════════════════════════════════════
            TAB 1: FOCUS DASHBOARD & LIVE TIMER
           ══════════════════════════════════════════════ */}
        {activeTab === 'FOCUS' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* ══ PERMISSION SETUP WIZARD ══ */}
            {(() => {
              const step = !permStatus.hasUsageStats ? 1 : !permStatus.hasOverlay ? 2 : !permStatus.hasAccessibility ? 3 : 0;
              if (step === 0) return (
                <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Focus Shield Ready — Full Protection Active</span>
                  </div>
                  <span className="text-[11px] text-emerald-300/80 font-mono">3/3 ✓</span>
                </div>
              );

              const steps = [
                {
                  num: 1, icon: '📊', color: 'amber',
                  title: 'Step 1 of 3 — App Detection',
                  desc: 'Ek baar "Allow" karo — app detect karega ki YouTube ya Instagram khula hai',
                  btnText: 'Allow Now →',
                  action: async () => {
                    await callNativePlugin('openUsageAccessSettings');
                    // Auto-poll every 1.5s so wizard advances automatically
                    const poll = setInterval(async () => {
                      const p = await callNativePlugin('checkBlockerPermissions');
                      if (p) { setPermStatus(p); if (p.hasUsageStats) clearInterval(poll); }
                    }, 1500);
                    setTimeout(() => clearInterval(poll), 30000);
                  }
                },
                {
                  num: 2, icon: '🛡️', color: 'sky',
                  title: 'Step 2 of 3 — Block Screen',
                  desc: 'Ek baar "Allow" karo — blocking screen distracting apps ke upar aayegi',
                  btnText: 'Allow Now →',
                  action: async () => {
                    await callNativePlugin('openOverlaySettings');
                    const poll = setInterval(async () => {
                      const p = await callNativePlugin('checkBlockerPermissions');
                      if (p) { setPermStatus(p); if (p.hasOverlay) clearInterval(poll); }
                    }, 1500);
                    setTimeout(() => clearInterval(poll), 30000);
                  }
                },
                {
                  num: 3, icon: '✂️', color: 'violet',
                  title: 'Step 3 of 3 — Shorts Detector',
                  desc: 'Sirf Shorts tab block karne ke liye chahiye — YouTube lectures bilkul safe rahenge',
                  btnText: 'Allow Now →',
                  action: async () => {
                    await callNativePlugin('openAccessibilitySettings');
                    const poll = setInterval(async () => {
                      const p = await callNativePlugin('checkBlockerPermissions');
                      if (p) { setPermStatus(p); if (p.hasAccessibility) clearInterval(poll); }
                    }, 1500);
                    setTimeout(() => clearInterval(poll), 30000);
                  }
                }
              ];

              const s = steps[step - 1];
              const colorMap: Record<string, string> = {
                amber: 'bg-amber-500/10 border-amber-500/30',
                sky:   'bg-sky-500/10 border-sky-500/30',
                violet:'bg-violet-500/10 border-violet-500/30',
              };
              const btnMap: Record<string, string> = {
                amber: 'bg-amber-400 hover:bg-amber-300',
                sky:   'bg-sky-400 hover:bg-sky-300',
                violet:'bg-violet-400 hover:bg-violet-300',
              };
              const iconBgMap: Record<string, string> = {
                amber: 'bg-amber-500/20',
                sky:   'bg-sky-500/20',
                violet:'bg-violet-500/20',
              };

              return (
                <div className={`p-4 rounded-3xl border ${colorMap[s.color]} shadow-lg`}>
                  {/* Progress dots */}
                  <div className="flex items-center gap-1.5 mb-3">
                    {[1,2,3].map(n => (
                      <div key={n} className={`h-1 rounded-full flex-1 transition-all ${n <= step ? (s.color === 'amber' ? 'bg-amber-400' : s.color === 'sky' ? 'bg-sky-400' : 'bg-violet-400') : 'bg-slate-700'}`} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl ${iconBgMap[s.color]} flex items-center justify-center text-xl shrink-0`}>
                        {s.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white">{s.title}</h4>
                        <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">{s.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={s.action}
                      className={`px-4 py-2 rounded-xl ${btnMap[s.color]} text-slate-950 font-black text-xs shrink-0 cursor-pointer shadow-md transition-all active:scale-95`}
                    >
                      {s.btnText}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 text-center">
                    Settings khulegi → StudyRide dhundho → Enable karo → wapas aao — auto detect hoga ✓
                  </p>
                </div>
              );
            })()}

            {/* 1. Large Focus Goal Ring */}
            <div className="p-6 rounded-3xl bg-[#161B18] border border-[#1E2520] relative overflow-hidden flex flex-col items-center justify-center text-center">
              <div className="relative w-44 h-44 flex items-center justify-center my-2">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    stroke="#1E2520"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="68"
                    stroke="url(#emeraldGradient)"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={427}
                    strokeDashoffset={427 - (427 * goalPercent) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#22C55E" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white tracking-tight">
                    {screenTimeData.productiveMinutes}m
                  </span>
                  <span className="text-xs text-slate-400 font-medium mt-0.5">
                    Focus goal {Math.round(dailyGoalMinutes / 60)}h
                  </span>
                  <span className="text-[11px] text-emerald-400 font-bold mt-1">
                    {goalPercent}% completed
                  </span>
                </div>
              </div>

              {/* Goal Motivation */}
              <p className="text-xs text-slate-300 font-medium max-w-sm mt-1">
                {goalPercent >= 100 
                  ? "🎉 Daily Focus Goal Crushed! You are in the top 5% disciplined aspirants today."
                  : "Every focused minute brings you one step closer to your dream rank."}
              </p>
            </div>

            {/* 2. Today's Screen Time Breakdown Bar */}
            <div className="p-4 rounded-3xl bg-[#161B18] border border-[#1E2520] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Phone Screen Time</span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    {Math.floor(screenTimeData.totalScreenTimeMinutes / 60)}h {screenTimeData.totalScreenTimeMinutes % 60}m
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-300">Study ({screenTimeData.productiveMinutes}m)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-slate-300">Social ({screenTimeData.distractionMinutes}m)</span>
                  </div>
                </div>
              </div>

              {/* Tri-color Horizontal Bar */}
              <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (screenTimeData.productiveMinutes / Math.max(1, screenTimeData.totalScreenTimeMinutes)) * 100)}%` }}
                />
                <div 
                  className="bg-amber-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (screenTimeData.distractionMinutes / Math.max(1, screenTimeData.totalScreenTimeMinutes)) * 100)}%` }}
                />
              </div>
            </div>

            {/* 3. Upcoming Study Schedule Card */}
            {schedules.length > 0 && (
              <div className="p-4 rounded-3xl bg-[#161B18] border border-[#1E2520] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">
                    🌅
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{schedules[0].name}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20">
                        🔥 {schedules[0].streakDays}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {String(schedules[0].startHour).padStart(2, '0')}:{String(schedules[0].startMinute).padStart(2, '0')} - {String(schedules[0].endHour).padStart(2, '0')}:{String(schedules[0].endMinute).padStart(2, '0')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('PLANNER')}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* 4. StudyRide Coin Rewards Banner */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-transparent border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl font-bold">
                  🪙
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Earn Free Pro Unlocks</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Focus 1 Hour = <span className="font-bold text-amber-400">+25 StudyRide Coins</span>. Unlocks test series & AI evaluations!
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Focus Timer Presets */}
            {sessionState === 'IDLE' && (
              <div className="p-4 rounded-3xl bg-[#161B18] border border-[#1E2520] space-y-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Choose Focus Session</span>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 45, 60, 90].map(mins => (
                    <button
                      key={mins}
                      onClick={() => setSelectedDuration(mins)}
                      className={`py-3 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        selectedDuration === mins
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                          : 'bg-[#121614] border-[#1E2520] text-slate-400 hover:text-white'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>

                {/* Primary Start Shield Button */}
                <div className="pt-2 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-slate-400">Guarding:</span>
                    <button
                      onClick={() => setShowAppPickerModal(true)}
                      className="text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{selectedApps.length} Apps Selected</span>
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={handleStartSession}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm tracking-wide uppercase flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer active:scale-98"
                  >
                    <Shield className="w-5 h-5 fill-current" />
                    <span>START FOCUS SHIELD ({selectedDuration} MIN)</span>
                  </button>
                </div>
              </div>
            )}

            {/* 6. Active Focus Session Breathing View */}
            {sessionState === 'ACTIVE' && (
              <div className="p-8 rounded-3xl bg-[#161B18] border border-emerald-500/30 text-center space-y-4 relative overflow-hidden">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Shield Active & Guarding
                </div>

                <div className="text-5xl sm:text-6xl font-black font-mono text-white tracking-tight py-2">
                  {String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:
                  {String(remainingSeconds % 60).padStart(2, '0')}
                </div>

                <p className="text-xs text-slate-400 italic">
                  “Distractions are the cost of mediocrity. Stay disciplined.”
                </p>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setShowStrictFrictionModal(true)}
                    className="px-5 py-2.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs transition-all"
                  >
                    Give Up Session
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 2: PLANNER (AUTOMATED STUDY SCHEDULES)
           ══════════════════════════════════════════════ */}
        {activeTab === 'PLANNER' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Study Planner</h2>
                <p className="text-xs text-slate-400">Automated recurring study slots with auto-blocking</p>
              </div>
              <button
                onClick={() => setShowAddScheduleModal(true)}
                className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Schedule
              </button>
            </div>

            {/* Schedules Timeline List */}
            <div className="space-y-3">
              {schedules.length === 0 ? (
                <div className="p-8 rounded-3xl bg-[#161B18] border border-dashed border-[#1E2520] text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-2xl mx-auto">
                    📅
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">No Automated Schedules</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Schedule daily study slots (e.g. 6:00 AM - 8:00 AM) to automatically block distractions during study hours.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddScheduleModal(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    + Add Study Schedule
                  </button>
                </div>
              ) : (
                schedules.map(schedule => (
                  <div
                    key={schedule.id}
                    className="p-4 rounded-3xl bg-[#161B18] border border-[#1E2520] flex items-center justify-between gap-3 transition-all hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#121614] border border-[#1E2520] flex items-center justify-center text-2xl">
                        {schedule.name.toLowerCase().includes('morning') ? '🌅' : schedule.name.toLowerCase().includes('night') ? '🌙' : '☀️'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{schedule.name}</h4>
                          {schedule.streakDays > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              🔥 {schedule.streakDays}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <span className="font-mono text-emerald-400">
                            {String(schedule.startHour).padStart(2, '0')}:{String(schedule.startMinute).padStart(2, '0')} - {String(schedule.endHour).padStart(2, '0')}:{String(schedule.endMinute).padStart(2, '0')}
                          </span>
                          <span>•</span>
                          <span className="text-slate-300">{schedule.tag}</span>
                        </div>
                      </div>
                    </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle Switch */}
                    <button
                      onClick={() => handleToggleSchedule(schedule.id)}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        schedule.enabled ? 'bg-emerald-500' : 'bg-slate-800'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          schedule.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 3: BLOCKS (APP GROUPS, APP LIMITS & SHORTS/REELS)
           ══════════════════════════════════════════════ */}
        {activeTab === 'BLOCKS' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* ── 1. REGAIN-STYLE APP GROUPS SECTION ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">App Groups</h3>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">REGAIN SYNC</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Shared daily quota & 1-tap block for app categories</p>
                </div>
                <button
                  onClick={() => {
                    setEditingGroup(null);
                    setShowGroupModal(true);
                  }}
                  className="px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Group</span>
                </button>
              </div>

              {/* Group Cards Grid */}
              <div className="space-y-3">
                {appGroups.map(group => {
                  const usedMins = getGroupUsageMinutes(group);
                  const limitMins = group.dailyLimitMinutes || 30;
                  const pct = group.blockMode === 'BLOCKED' ? 100 : Math.min(100, Math.round((usedMins / limitMins) * 100));

                  return (
                    <div
                      key={group.id}
                      className="p-4 rounded-3xl bg-[#161B18] border border-[#1E2520] space-y-3 transition-all hover:border-[#2A342D]"
                    >
                      {/* Top Header of Group Card */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl border shadow-sm"
                            style={{ backgroundColor: `${group.color}20`, borderColor: `${group.color}40` }}
                          >
                            <span>{group.icon}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{group.name}</h4>
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ backgroundColor: `${group.color}15`, color: group.color }}
                              >
                                {group.packages.length} apps
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">
                              {group.blockMode === 'BLOCKED' ? '🔒 Strict 100% Locked' : `⏱️ ${limitMins}m shared limit`}
                            </p>
                          </div>
                        </div>

                        {/* Actions: Edit & Toggle */}
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => {
                              setEditingGroup(group);
                              setShowGroupModal(true);
                            }}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Edit Group"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleGroup(group.id)}
                            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                              group.enabled ? 'bg-emerald-500' : 'bg-slate-800'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                                group.enabled ? 'translate-x-6' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Apps inside Group Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {group.packages.slice(0, 4).map(pkg => {
                          const appInfo = installedApps.find(a => a.package === pkg) || FALLBACK_DEVICE_APPS.find(a => a.package === pkg);
                          const appName = appInfo?.name || pkg.split('.').pop() || pkg;
                          const appEmoji = appInfo?.icon || '📱';
                          return (
                            <span
                              key={pkg}
                              className="px-2 py-0.5 rounded-md bg-slate-900 border border-[#1E2520] text-[10px] text-slate-300 font-medium flex items-center gap-1"
                            >
                              <span>{appEmoji}</span>
                              <span className="truncate max-w-[90px]">{appName}</span>
                            </span>
                          );
                        })}
                        {group.packages.length > 4 && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-[#1E2520] text-[10px] text-slate-400 font-bold">
                            +{group.packages.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Group Shared Limit Progress Bar */}
                      {group.blockMode !== 'BLOCKED' ? (
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-medium">Combined today:</span>
                            <span className="font-mono font-bold" style={{ color: group.color }}>
                              {usedMins}m / {limitMins}m
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden">
                            <div
                              className="h-full transition-all duration-300 rounded-full"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: pct >= 100 ? '#EF4444' : pct >= 75 ? '#F59E0B' : group.color
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between text-[11px] text-rose-300 font-bold">
                          <span className="flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-rose-400" />
                            Strict Block Active
                          </span>
                          <span className="text-[10px] text-rose-400/80 font-normal">All apps locked</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── 2. INDIVIDUAL APP LIMITS SECTION (WITH MULTI-APP PICKER) ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">App Daily Limits</h3>
                  <p className="text-[11px] text-slate-400">Set customized daily allowance per app</p>
                </div>
                <button
                  onClick={() => setShowAppPickerModal(true)}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Apps</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {Object.keys(appDailyLimits).length === 0 ? (
                  <div className="p-6 rounded-3xl bg-[#161B18] border border-dashed border-[#1E2520] text-center space-y-2">
                    <p className="text-xs text-slate-400">No individual app limits configured</p>
                    <button
                      onClick={() => setShowAppPickerModal(true)}
                      className="px-4 py-2 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs"
                    >
                      Pick Apps from Device
                    </button>
                  </div>
                ) : (
                  Object.entries(appDailyLimits).map(([pkg, limitMins]) => {
                    const appInfo = installedApps.find(a => a.package === pkg) || FALLBACK_DEVICE_APPS.find(a => a.package === pkg) || {
                      name: pkg.includes('youtube') ? 'YouTube' : pkg.includes('instagram') ? 'Instagram' : pkg.split('.').pop() || pkg,
                      icon: pkg.includes('youtube') ? '▶️' : pkg.includes('instagram') ? '📸' : '📱',
                      usageMinutes: 15
                    };
                    const used = appInfo.usageMinutes || 15;
                    const pct = Math.min(100, Math.round((used / limitMins) * 100));

                    return (
                      <div
                        key={pkg}
                        className="p-4 rounded-3xl bg-[#161B18] border border-[#1E2520] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{appInfo.icon}</span>
                            <div>
                              <h4 className="text-sm font-bold text-white">{appInfo.name}</h4>
                              <p className="text-xs text-slate-400">{limitMins}m daily limit</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono text-emerald-400">
                              {used}m / {limitMins}m
                            </span>
                            <button
                              onClick={() => handleRemoveAppLimit(pkg)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              pct >= 100 ? 'bg-rose-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── 3. BLOCK SHORTS & REELS SECTION ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Block Shorts & Reels</h3>
                <span className="text-[11px] text-emerald-400 font-semibold">24×7 Habit Shield</span>
              </div>
              <div className="p-4 rounded-3xl bg-[#161B18] border border-[#1E2520] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">▶️</span>
                    <div>
                      <h4 className="text-sm font-bold text-white">YouTube Shorts Block</h4>
                      <p className="text-[11px] text-slate-400">
                        {blockShorts
                          ? 'Shorts tab blocked - Lectures and videos work fine'
                          : 'Blocks only Shorts tab (lectures and videos unaffected)'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleShorts}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      blockShorts ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        blockShorts ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="h-px bg-[#1E2520]" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📸</span>
                    <div>
                      <h4 className="text-sm font-bold text-white">Instagram Reels Block</h4>
                      <p className="text-[11px] text-slate-400">
                        {blockReels
                          ? '🚫 Instagram blocked — scroll addiction stopped'
                          : 'Blocks entire Instagram app when ON'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleReels}
                    className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                      blockReels ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        blockReels ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* ── 4. YOUTUBE STUDY MODE ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">YouTube Study Mode</h3>
                <span className="text-[11px] text-emerald-400 font-semibold">Lecture Mode</span>
              </div>
              <div className="p-4 rounded-3xl bg-[#161B18] border border-[#1E2520] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎓</span>
                  <div>
                    <h4 className="text-sm font-bold text-white">Educational Video Shield</h4>
                    <p className="text-[11px] text-slate-400">
                      {youtubeStudyMode
                        ? '✅ Active — YouTube allowed for lectures even if Shorts block is ON'
                        : blockShorts
                        ? '⚠️ OFF — Enable to allow YouTube lectures while blocking Shorts'
                        : 'Enable with Shorts Block to allow lectures but block Shorts'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggleStudyMode}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    youtubeStudyMode ? 'bg-emerald-500' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      youtubeStudyMode ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {/* Explain how study mode works */}
              {blockShorts && (
                <div className={`px-4 py-3 rounded-2xl text-[11px] ${
                  youtubeStudyMode
                    ? 'bg-emerald-950/50 border border-emerald-800/40 text-emerald-300'
                    : 'bg-amber-950/50 border border-amber-800/40 text-amber-300'
                }`}>
                  {youtubeStudyMode
                    ? '🎓 Study Mode Active: YouTube khul sakti hai lectures ke liye. Jab YouTube use karein to Shorts tab se door rahein — app automatically monitor karti hai.'
                    : '⚠️ Study Mode OFF: Abhi YouTube completely block hai. Lectures dekhne ke liye Study Mode ON karo.'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 4: PROFILE & AVATAR STUDIO
           ══════════════════════════════════════════════ */}
        {activeTab === 'PROFILE' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* 1. Yellow Illustrated Hero Avatar Banner */}
            <div 
              className="rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-center text-center transition-colors duration-300"
              style={{ backgroundColor: avatarConfig.bgColor || '#FACC15' }}
            >
              <div className="w-36 h-36 relative">
                <AspirantAvatar config={avatarConfig} className="w-full h-full drop-shadow-xl" />
              </div>

              <button
                onClick={() => setShowAvatarStudio(true)}
                className="mt-3 px-4 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white font-bold text-xs backdrop-blur-md flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                Customize Avatar
              </button>
            </div>

            {/* 2. User Info */}
            <div className="p-4 rounded-3xl bg-[#161B18] border border-[#1E2520] space-y-1">
              <h3 className="text-base font-bold text-white">
                {user?.fullName || user?.name || 'Ambuj Yadav'}
              </h3>
              <p className="text-xs text-slate-400">{user?.email || 'mysterioustalks6@gmail.com'}</p>
              <p className="text-[11px] text-emerald-400 font-medium pt-1">
                Target: UPSC CSE 2026 • Focusing since Sept 2026
              </p>
            </div>

            {/* 3. Achievements & Badges */}
            <div className="p-4 rounded-3xl bg-[#161B18] border border-[#1E2520] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Focus Achievements</h4>
                <span className="text-xs font-bold text-emerald-400">5 Badges</span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { title: '3H FOCUS', date: 'Earned Sept 03', icon: '⏳', unlocked: true },
                  { title: '7-DAY STREAK', date: 'Earned Sept 10', icon: '🔥', unlocked: true },
                  { title: '50H MASTER', date: 'In Progress (38h)', icon: '🛡️', unlocked: false }
                ].map((b, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center ${
                      b.unlocked
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-[#121614] border-[#1E2520] text-slate-500 opacity-60'
                    }`}
                  >
                    <span className="text-2xl mb-1">{b.icon}</span>
                    <span className="text-[11px] font-black">{b.title}</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">{b.date}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Weekly Focus Summary */}
            <div className="p-4 rounded-3xl bg-[#161B18] border border-[#1E2520] flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400">Weekly Average</span>
                <h4 className="text-lg font-bold text-white mt-0.5">2h 13m / day</h4>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500/30 border-t-emerald-400 flex items-center justify-center font-bold text-xs text-emerald-400">
                84%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── FLOATING START FOCUS ACTION BUTTON (Like Regain) ── */}
      {activeTab === 'FOCUS' && sessionState === 'IDLE' && (
        <div className="fixed bottom-20 inset-x-0 z-30 flex justify-center px-4 pointer-events-none">
          <button
            onClick={handleStartSession}
            className="pointer-events-auto w-full max-w-sm h-14 px-6 rounded-full bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm shadow-[0_8px_30px_rgb(0,0,0,0.5)] flex items-center justify-between transition-all transform active:scale-98 cursor-pointer border border-white/20"
          >
            <div className="flex flex-col text-left">
              <span className="text-sm font-black tracking-tight text-slate-950">Start focus timer</span>
              <span className="text-[11px] text-slate-500 font-semibold">{selectedDuration} mins • Strict Blocker Active</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </div>
          </button>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* 1. Add Schedule Modal */}
      {showAddScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full rounded-3xl bg-[#0C0F0D] border border-[#1E2520] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create Study Schedule</h3>
              <button onClick={() => setShowAddScheduleModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Schedule Name</label>
                <input
                  type="text"
                  placeholder="e.g., Morning Polity Revision"
                  value={newScheduleName}
                  onChange={e => setNewScheduleName(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[#161B18] border border-[#1E2520] text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Subject / Syllabus Tag</label>
                <input
                  type="text"
                  placeholder="e.g., GS-2 / Laxmikanth"
                  value={newScheduleTag}
                  onChange={e => setNewScheduleTag(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[#161B18] border border-[#1E2520] text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">From Time</label>
                  <input
                    type="time"
                    value={newScheduleStart}
                    onChange={e => setNewScheduleStart(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[#161B18] border border-[#1E2520] text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">To Time</label>
                  <input
                    type="time"
                    value={newScheduleEnd}
                    onChange={e => setNewScheduleEnd(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-[#161B18] border border-[#1E2520] text-white"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateSchedule}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Save Schedule
            </button>
          </div>
        </div>
      )}

      {/* 2. Add App Limit Modal */}
      {showAddLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full rounded-3xl bg-[#0C0F0D] border border-[#1E2520] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Set Daily App Limit</h3>
              <button onClick={() => setShowAddLimitModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Select App</label>
                <select
                  value={limitAppPkg}
                  onChange={e => setLimitAppPkg(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[#161B18] border border-[#1E2520] text-white focus:outline-none"
                >
                  <option value="com.google.android.youtube">YouTube (▶️)</option>
                  <option value="com.instagram.android">Instagram (📸)</option>
                  <option value="com.facebook.katana">Facebook (👥)</option>
                  <option value="com.snapchat.android">Snapchat (👻)</option>
                  <option value="com.android.chrome">Chrome Browser (🌐)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Daily Quota</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 45, 60].map(m => (
                    <button
                      key={m}
                      onClick={() => setLimitMinutesVal(m)}
                      className={`p-2.5 rounded-xl border font-bold ${
                        limitMinutesVal === m
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                          : 'bg-[#161B18] border-[#1E2520] text-slate-400'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveAppLimit}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Apply Limit
            </button>
          </div>
        </div>
      )}

      {/* 3. Strict Friction Give Up Modal */}
      {showStrictFrictionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full rounded-3xl bg-[#0C0F0D] border border-rose-500/40 p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Giving Up Study Session?</h3>
            <p className="text-xs text-slate-300">
              Discipline requires sacrifice. Type the pledge below to quit:
            </p>

            <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold select-all">
              {STRICT_PLEDGE}
            </div>

            <input
              type="text"
              placeholder="Type pledge here..."
              value={frictionInput}
              onChange={e => setFrictionInput(e.target.value)}
              className="w-full p-3 rounded-2xl bg-[#161B18] border border-[#1E2520] text-white text-xs font-mono focus:outline-none"
            />

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setShowStrictFrictionModal(false)}
                className="py-3 rounded-2xl bg-slate-800 text-slate-200 font-bold text-xs"
              >
                Keep Studying
              </button>
              <button
                onClick={handleGiveUpPledge}
                disabled={frictionInput.trim() !== STRICT_PLEDGE}
                className="py-3 rounded-2xl bg-rose-600 disabled:opacity-40 text-white font-bold text-xs"
              >
                Confirm Give Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Avatar Studio Modal */}
      <AvatarStudioModal
        isOpen={showAvatarStudio}
        onClose={() => setShowAvatarStudio(false)}
        currentConfig={avatarConfig}
        onSave={cfg => {
          setAvatarConfig(cfg);
          localStorage.setItem('studyride_user_avatar', JSON.stringify(cfg));
        }}
      />

      {/* 6. Multi-App Device Picker Modal (Select ANY installed app) */}
      <AppPickerModal
        isOpen={showAppPickerModal}
        onClose={() => setShowAppPickerModal(false)}
        installedApps={installedApps}
        selectedPackages={Object.keys(appDailyLimits)}
        showQuotaSelector={true}
        initialQuotaMinutes={30}
        title="Add App Daily Limits"
        subtitle="Search and select apps to restrict daily usage"
        onSave={handleSavePickedApps}
      />

      {/* 7. Regain App Group Creation & Editor Modal */}
      <AppGroupModal
        isOpen={showGroupModal}
        onClose={() => {
          setShowGroupModal(false);
          setEditingGroup(null);
        }}
        group={editingGroup}
        installedApps={installedApps}
        onSave={handleSaveGroup}
        onDelete={handleDeleteGroup}
      />
    </div>
  );
};
