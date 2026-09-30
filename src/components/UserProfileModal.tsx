import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { saveUserProfile } from '../lib/gamification';
import { CustomExamModal } from './CustomExamModal';
import { triggerConfetti } from '../lib/animations';
import { 
  EXAM_CATEGORIES, 
  INDIAN_STATES_AND_UTS, 
  EDUCATIONAL_BOARDS,
  SYLLABUS_PRESETS 
} from '../data/syllabusTemplates';
import { 
  PROFILE_BADGES, 
  PROFILE_AWARDS, 
  CURATED_AVATARS, 
  THEME_AURA_PRESETS,
  ProfileBadge
} from '../data/profileBadgesData';
import { 
  User, 
  Target, 
  GraduationCap, 
  MapPin, 
  BookOpen, 
  Calendar, 
  Sparkles, 
  Check, 
  X, 
  ShieldCheck, 
  Flame, 
  Award, 
  Coins, 
  Crown,
  Loader2,
  RefreshCw,
  Building2,
  Layers,
  Gift,
  Trophy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Bell,
  Send,
  Zap,
  Compass,
  Star,
  Copy,
  Pin,
  Palette,
  ChevronRight,
  Sliders,
  Share2
} from 'lucide-react';
import { 
  loadStudyReminderSettings, 
  saveStudyReminderSettings, 
  StudyReminderSettings,
  requestNotificationPermission 
} from '../lib/studyReminderService';

interface UserProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated?: (updated: UserProfile) => void;
  onOpenReferralModal?: () => void;
  onNavigateToRewards?: () => void;
  onOpenCustomizerModal?: () => void;
}

const ICON_MAP: Record<string, any> = {
  Flame,
  Zap,
  ShieldCheck,
  Crown,
  Compass,
  BookOpen,
  Target,
  Trophy,
  Clock,
  Sparkles,
  User,
  Award,
  Coins
};

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onProfileUpdated,
  onOpenReferralModal,
  onNavigateToRewards,
  onOpenCustomizerModal,
}) => {
  // Navigation Tabs: 'overview' | 'badges' | 'awards' | 'edit'
  const [activeTab, setActiveTab] = useState<'overview' | 'badges' | 'awards' | 'edit'>('overview');
  
  // Profile Form States
  const [name, setName] = useState<string>(user.name || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatar_url || CURATED_AVATARS[0].url);
  const [bio, setBio] = useState<string>(user.bio || 'Future Civil Servant / High-Performance Aspirant');
  const [studyGoal, setStudyGoal] = useState<string>(user.studyGoal || 'Daily Consistency • Master Syllabus • Crack Target Exam');
  const [category, setCategory] = useState<string>(user.educationCategory || 'UPSC_CIVILS');
  const [examName, setExamName] = useState<string>(user.exam || 'UPSC CSE (IAS/IPS)');
  const [stateName, setStateName] = useState<string>(user.stateName || 'Uttar Pradesh');
  const [boardOrUniversity, setBoardOrUniversity] = useState<string>(
    user.boardOrUniversity || 'CBSE (Central Board of Secondary Education)'
  );
  const [streamOrSubject, setStreamOrSubject] = useState<string>(user.streamOrSubject || 'General Studies');
  const [targetYear, setTargetYear] = useState<number>(user.targetYear || 2026);
  const [themeAccent, setThemeAccent] = useState<string>(user.themeAccent || 'cyan');
  const [pinnedBadges, setPinnedBadges] = useState<string[]>(
    user.pinnedBadges && user.pinnedBadges.length > 0
      ? user.pinnedBadges
      : ['badge_first_spark', 'badge_syllabus_starter', 'badge_focus_monk']
  );

  // Badge Filter State
  const [badgeFilter, setBadgeFilter] = useState<'ALL' | 'MASTERY' | 'STREAK' | 'FOCUS' | 'COMMUNITY' | 'UNLOCKED'>('ALL');

  // Photo Upload & Statuses
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedReferral, setCopiedReferral] = useState<boolean>(false);

  // Rewards Claims
  const [myClaims, setMyClaims] = useState<any[]>([]);
  const [loadingClaims, setLoadingClaims] = useState<boolean>(false);

  // Custom Exam Modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);

  // Reminders Settings
  const [reminderSettings, setReminderSettings] = useState<StudyReminderSettings>(() => loadStudyReminderSettings());

  // Active Aura Theme Info
  const activeAura = THEME_AURA_PRESETS.find(p => p.id === themeAccent) || THEME_AURA_PRESETS[0];

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatarUrl(user.avatar_url || CURATED_AVATARS[0].url);
      setBio(user.bio || 'Future Civil Servant / High-Performance Aspirant');
      setStudyGoal(user.studyGoal || 'Daily Consistency • Master Syllabus • Crack Target Exam');
      setExamName(user.exam || 'UPSC CSE (IAS/IPS)');
      setTargetYear(user.targetYear || 2026);
      setThemeAccent(user.themeAccent || 'cyan');
      if (user.pinnedBadges && user.pinnedBadges.length > 0) {
        setPinnedBadges(user.pinnedBadges);
      }
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'awards' && user) {
      fetchMyClaims();
    }
  }, [activeTab, user?.id]);

  const fetchMyClaims = async () => {
    setLoadingClaims(true);
    try {
      const res = await fetch(`/api/rewards/my-claims?userId=${encodeURIComponent(user.id)}&userEmail=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.success && data.claims) {
        setMyClaims(data.claims);
      }
    } catch (e) {
      console.error('Failed to load my claims', e);
    } finally {
      setLoadingClaims(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Kripya sirf image file (JPG, PNG, WebP) upload karein.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Photo ka size 8MB se zyada nahi hona chahiye.');
      return;
    }

    setUploadError(null);
    setUploadingPhoto(true);

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 240;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatarUrl(compressedDataUrl);
          try {
            localStorage.setItem(`aspirantx_avatar_${user.id}`, compressedDataUrl);
          } catch (_) {}
        }
        setUploadingPhoto(false);
      };
      img.onerror = () => {
        setUploadError('Photo read karne me problem aayi.');
        setUploadingPhoto(false);
      };
      img.src = uploadEvent.target?.result as string;
    };
    reader.onerror = () => {
      setUploadError('File read fail ho gayi.');
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const togglePinBadge = (badgeId: string) => {
    if (pinnedBadges.includes(badgeId)) {
      setPinnedBadges(pinnedBadges.filter(id => id !== badgeId));
    } else {
      if (pinnedBadges.length >= 3) {
        setPinnedBadges([...pinnedBadges.slice(1), badgeId]);
      } else {
        setPinnedBadges([...pinnedBadges, badgeId]);
      }
      triggerConfetti();
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccessMessage(null);

    try {
      const resolvedAvatar = avatarUrl ||
        localStorage.getItem(`aspirantx_avatar_${user.id}`) ||
        user.avatar_url ||
        CURATED_AVATARS[0].url;

      const updatedProfile: UserProfile = {
        ...user,
        name: name.trim() || user.name,
        avatar_url: resolvedAvatar,
        bio: bio.trim(),
        studyGoal: studyGoal.trim(),
        educationCategory: category,
        exam: examName.trim() || user.exam,
        stateName,
        boardOrUniversity,
        streamOrSubject: streamOrSubject.trim(),
        targetYear,
        themeAccent,
        pinnedBadges,
        isProfileComplete: true,
      };

      // 1. Instant local storage update
      localStorage.setItem(`aspirantx_user_profile_${user.id}`, JSON.stringify(updatedProfile));
      saveStudyReminderSettings(reminderSettings);

      // 2. Set syllabus preset if available
      if (SYLLABUS_PRESETS[category]) {
        localStorage.setItem(`aspirantx_custom_syllabus_${user.id}`, JSON.stringify(SYLLABUS_PRESETS[category]));
      }

      // 3. Save via gamification layer
      await saveUserProfile(updatedProfile);

      // 4. Sync to backend API
      if (user.email) {
        const token = localStorage.getItem('aspirantx_auth_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        await fetch('/api/user/update-profile', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: updatedProfile.name,
            exam: updatedProfile.exam,
            educationCategory: updatedProfile.educationCategory,
            stateName: updatedProfile.stateName,
            boardOrUniversity: updatedProfile.boardOrUniversity,
            streamOrSubject: updatedProfile.streamOrSubject,
            targetYear: updatedProfile.targetYear,
            bio: updatedProfile.bio,
            studyGoal: updatedProfile.studyGoal,
            avatar_url: resolvedAvatar.startsWith('data:') ? '' : resolvedAvatar,
            pinnedBadges: updatedProfile.pinnedBadges,
            themeAccent: updatedProfile.themeAccent,
            isProfileComplete: true,
          }),
        }).catch((e) => console.warn('Background profile update ping error:', e));
      }

      triggerConfetti();
      setSaveSuccessMessage('✨ Profile successfully updated! Changes live across your dashboard.');
      if (onProfileUpdated) onProfileUpdated(updatedProfile);

      setTimeout(() => {
        setSaveSuccessMessage(null);
      }, 2500);
    } catch (err: any) {
      setSaveError(`Save karne me problem: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyReferral = () => {
    const code = user.referralCode || 'ASPIRANT-101';
    navigator.clipboard.writeText(code);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  // XP Level Calculations
  const currentXP = user.xp || 150;
  const currentLevel = user.level || Math.max(1, Math.floor(currentXP / 150) + 1);
  const nextLevelXP = currentLevel * 150;
  const prevLevelXP = (currentLevel - 1) * 150;
  const xpProgress = Math.min(100, Math.round(((currentXP - prevLevelXP) / 150) * 100));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 md:p-6 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-4xl bg-slate-900/95 border border-slate-800/80 rounded-[32px] shadow-[0_20px_70px_rgba(0,0,0,0.8)] overflow-hidden relative my-auto max-h-[92vh] flex flex-col"
        style={{
          boxShadow: `0 0 60px -15px ${activeAura.glow}, 0 25px 70px rgba(0,0,0,0.8)`
        }}
      >
        {/* Dynamic Glowing Ambient Aura */}
        <div 
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-30"
          style={{ background: activeAura.glow }}
        />
        <div 
          className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-20"
          style={{ background: activeAura.glow }}
        />

        {/* Top Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 transition-all shadow-lg backdrop-blur-md"
          title="Close Profile"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ============================================================== */}
        {/* DRIBBBLE HERO BANNER WITH AVATAR & PINNED BADGES */}
        {/* ============================================================== */}
        <div className="relative pt-6 px-6 sm:px-8 pb-5 border-b border-slate-800/80 bg-gradient-to-b from-slate-950/90 via-slate-900/80 to-slate-900/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* Avatar & Core Identity */}
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Concentric Level Ring Avatar */}
              <div className="relative group shrink-0">
                <div 
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl p-1 relative overflow-hidden transition-transform duration-300 group-hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${activeAura.glow}, rgba(255,255,255,0.1), ${activeAura.glow})`
                  }}
                >
                  <img
                    src={avatarUrl}
                    alt={name || 'Student Avatar'}
                    onError={(e) => { (e.target as HTMLImageElement).src = CURATED_AVATARS[0].url; }}
                    className="w-full h-full object-cover rounded-[22px] bg-slate-950 shadow-inner"
                  />
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-slate-950/80 rounded-[22px] flex items-center justify-center backdrop-blur-sm">
                      <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                    </div>
                  )}
                </div>

                {/* Level Badge Pill */}
                <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] tracking-wider uppercase border border-amber-300/40 shadow-lg flex items-center gap-1">
                  <Star className="w-3 h-3 fill-slate-950" />
                  LVL {currentLevel}
                </div>
              </div>

              {/* Name, Handle, Exam & Target Year */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                    {name || 'Aspirant'}
                  </h1>
                  {user.isPremium ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400/20 to-orange-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-black tracking-wide flex items-center gap-1">
                      <Crown className="w-3 h-3" /> PRO PASS
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700 text-[10px] font-bold">
                      Aspirant
                    </span>
                  )}
                </div>

                {/* Target Exam & Year Pills */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className={`px-2.5 py-1 rounded-lg ${activeAura.bg} ${activeAura.text} border ${activeAura.border} font-extrabold flex items-center gap-1.5`}>
                    <Target className="w-3.5 h-3.5" />
                    {examName}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/60 text-slate-300 border border-slate-700/60 font-semibold">
                    Target: {targetYear}
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline">•</span>
                  <span className="text-xs text-slate-400 truncate max-w-[200px]">
                    {user.email}
                  </span>
                </div>

                {/* Motto / Bio quote */}
                <p className="text-xs text-slate-300/90 italic line-clamp-1 max-w-md pt-0.5">
                  "{studyGoal || 'Discipline beats motivation every single day.'}"
                </p>
              </div>
            </div>

            {/* Quick Actions & Pinned Badges Showcase */}
            <div className="flex flex-row md:flex-col items-start md:items-end justify-between gap-3 shrink-0">
              {/* Pinned Badges Header Strip */}
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1 md:justify-end">
                  <Pin className="w-3 h-3 text-amber-400" /> Featured Badges
                </p>
                <div className="flex items-center gap-2">
                  {pinnedBadges.map((badgeId) => {
                    const badge = PROFILE_BADGES.find(b => b.id === badgeId);
                    if (!badge) return null;
                    const IconComponent = ICON_MAP[badge.icon] || Award;
                    return (
                      <div
                        key={badge.id}
                        title={`${badge.name} (${badge.rarity})`}
                        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${badge.accentColor} p-0.5 shadow-md hover:scale-110 transition-transform cursor-pointer`}
                        onClick={() => setActiveTab('badges')}
                      >
                        <div className="w-full h-full bg-slate-950/80 rounded-[10px] flex items-center justify-center backdrop-blur-sm">
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Edit Profile Button Trigger */}
              <button
                onClick={() => setActiveTab('edit')}
                className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Edit Profile & Preferences
              </button>
            </div>
          </div>

          {/* Dribbble Level XP Progress Bar */}
          <div className="mt-5 pt-4 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Level {currentLevel} Mastery
              </span>
              <span className="text-white font-mono">
                {currentXP} / {nextLevelXP} XP <span className="text-slate-500 font-sans">({xpProgress}%)</span>
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-950/80 border border-slate-800 overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-amber-400 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
              />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* FOUR-TAB DRIBBBLE NAVIGATION BAR */}
        {/* ============================================================== */}
        <div className="flex items-center border-b border-slate-800/80 bg-slate-950/60 px-6 sm:px-8 gap-6 sm:gap-8 overflow-x-auto custom-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? `${activeAura.border} ${activeAura.text}`
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" /> Overview & Stats
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('badges')}
            className={`py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'badges'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" /> Badges Showcase ({PROFILE_BADGES.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('awards')}
            className={`py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'awards'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" /> Awards & Trophies ({PROFILE_AWARDS.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'edit'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" /> Dynamic Customizer
          </button>
        </div>

        {/* Toast / Notification Banner */}
        {saveSuccessMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}
        {saveError && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: OVERVIEW & STATS */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {/* Streak Card */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-orange-500/40 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Streak</span>
                  <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 group-hover:scale-110 transition-transform">
                    <Flame className="w-4 h-4 fill-orange-400" />
                  </div>
                </div>
                <p className="text-2xl font-black text-white">{user.streakDays ?? 1} <span className="text-sm font-semibold text-orange-400">Days</span></p>
                <p className="text-[10px] text-slate-500 mt-1">Target: 21 Days Habit Titan</p>
              </div>

              {/* Coins Balance Card */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-amber-500/40 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Aspirant Coins</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                    <Coins className="w-4 h-4 fill-amber-400" />
                  </div>
                </div>
                <p className="text-2xl font-black text-amber-400">{user.coins ?? 50} <span className="text-sm font-semibold text-slate-400">🪙</span></p>
                {onNavigateToRewards && (
                  <button
                    onClick={onNavigateToRewards}
                    className="text-[10px] text-amber-400/90 hover:text-amber-300 font-bold mt-1 flex items-center gap-1"
                  >
                    Redeem for Prizes →
                  </button>
                )}
              </div>

              {/* Study Time Card */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/40 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Study Time</span>
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-white">{(user.studyHoursToday ?? 0).toFixed(1)} <span className="text-sm font-semibold text-cyan-400">Hours</span></p>
                <p className="text-[10px] text-slate-500 mt-1">Logged today in IST</p>
              </div>

              {/* Total XP Card */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-purple-500/40 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total XP</span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-white">{currentXP} <span className="text-sm font-semibold text-purple-400">XP</span></p>
                <p className="text-[10px] text-slate-500 mt-1">Next rank in {nextLevelXP - currentXP} XP</p>
              </div>
            </div>

            {/* Referral Hero Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-purple-500/15 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-black text-amber-300">Invite Friends & Earn Rewards</h3>
                </div>
                <p className="text-xs text-slate-300">
                  Share your referral code to unlock <span className="font-extrabold text-amber-300">+150 Coins</span> and free <span className="font-extrabold text-cyan-300">PRO Pass</span> for every classmate who joins.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="px-3 py-1 rounded-lg bg-slate-950/80 border border-amber-500/40 font-mono text-xs font-black text-amber-400 tracking-wider">
                    {user.referralCode || 'ASPIRANT-101'}
                  </span>
                  <button
                    onClick={handleCopyReferral}
                    className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    {copiedReferral ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedReferral ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
              </div>

              {onOpenReferralModal && (
                <button
                  type="button"
                  onClick={onOpenReferralModal}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 shrink-0"
                >
                  Referral Dashboard →
                </button>
              )}
            </div>

            {/* Academic Information Summary Card */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-cyan-400" /> Academic Roadmap
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-slate-500">Target Commission / Exam</p>
                  <p className="font-extrabold text-white mt-0.5">{examName}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-slate-500">Board / University</p>
                  <p className="font-extrabold text-white mt-0.5 truncate">{boardOrUniversity}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <p className="text-[10px] text-slate-500">State / Region</p>
                  <p className="font-extrabold text-white mt-0.5">{stateName}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: BADGES SHOWCASE */}
        {/* ============================================================== */}
        {activeTab === 'badges' && (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            {/* Badges Filter Bar */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-800/80">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" /> Achievement Badges Collection
                </h3>
                <p className="text-xs text-slate-400">
                  Complete study sessions, solve PYQs, and maintain streaks to unlock badges. Click <Pin className="w-3 h-3 inline text-amber-400" /> to pin top 3 to your profile!
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['ALL', 'STREAK', 'MASTERY', 'FOCUS', 'COMMUNITY', 'UNLOCKED'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setBadgeFilter(f)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-extrabold uppercase transition-all ${
                      badgeFilter === f
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Badges Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {PROFILE_BADGES
                .filter(b => {
                  if (badgeFilter === 'ALL') return true;
                  if (badgeFilter === 'UNLOCKED') return b.currentValue(user) >= b.targetValue;
                  return b.category === badgeFilter;
                })
                .map((badge) => {
                  const currentVal = badge.currentValue(user);
                  const isUnlocked = currentVal >= badge.targetValue;
                  const isPinned = pinnedBadges.includes(badge.id);
                  const pct = Math.min(100, Math.round((currentVal / badge.targetValue) * 100));
                  const IconComponent = ICON_MAP[badge.icon] || Award;

                  return (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-2xl border transition-all relative overflow-hidden group ${
                        isUnlocked
                          ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700 shadow-md'
                          : 'bg-slate-950/40 border-slate-800/40 opacity-70'
                      }`}
                    >
                      {/* Top Row: Icon + Rarity Tag + Pin Button */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${badge.accentColor} p-0.5 shadow-lg group-hover:scale-105 transition-transform`}>
                          <div className="w-full h-full bg-slate-950/90 rounded-[14px] flex items-center justify-center">
                            <IconComponent className={`w-6 h-6 ${isUnlocked ? 'text-white' : 'text-slate-500'}`} />
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Rarity Pill */}
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            badge.rarity === 'LEGENDARY' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                            badge.rarity === 'EPIC' ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' :
                            badge.rarity === 'RARE' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' :
                            'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {badge.rarity}
                          </span>

                          {/* Pin Toggle Button */}
                          {isUnlocked && (
                            <button
                              onClick={() => togglePinBadge(badge.id)}
                              title={isPinned ? 'Unpin from profile' : 'Pin to profile top'}
                              className={`p-1.5 rounded-lg border transition-all ${
                                isPinned
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                                  : 'bg-slate-800/60 text-slate-400 hover:text-white border-slate-700'
                              }`}
                            >
                              <Pin className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                        {badge.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {badge.description}
                      </p>

                      {/* Progress Bar & Status */}
                      <div className="mt-3 pt-3 border-t border-slate-800/60">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-bold">
                          <span className={isUnlocked ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-400'}>
                            {isUnlocked ? <Check className="w-3 h-3" /> : null}
                            {isUnlocked ? 'Unlocked' : `${currentVal} / ${badge.targetValue} ${badge.unit}`}
                          </span>
                          <span className="text-amber-400 font-extrabold">+{badge.xpReward} XP</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isUnlocked ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-700'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: AWARDS & TROPHIES CABINET */}
        {/* ============================================================== */}
        {activeTab === 'awards' && (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-purple-400" /> Academic Trophies & Prize Claims
              </h3>
              <p className="text-xs text-slate-400">
                Major milestones unlocked during your preparation journey and physical rewards status.
              </p>
            </div>

            {/* Awards Trophy Showcase */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PROFILE_AWARDS.map((award) => {
                const IconComp = ICON_MAP[award.icon] || Trophy;
                return (
                  <div
                    key={award.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      award.unlocked
                        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950/20 border-purple-500/30 shadow-lg'
                        : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-purple-500 to-indigo-600 p-0.5 shrink-0 shadow-lg">
                        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                          <IconComp className="w-7 h-7 text-amber-400" />
                        </div>
                      </div>

                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">
                            {award.category}
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                            {award.rarity}
                          </span>
                        </div>
                        <h4 className="text-base font-black text-white truncate">{award.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2">{award.description}</p>
                        <p className="text-xs font-bold text-amber-300 pt-1 flex items-center gap-1.5">
                          <Gift className="w-3.5 h-3.5 text-amber-400" /> {award.rewardText}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Real Reward Claims Status */}
            <div className="pt-4 border-t border-slate-800/80">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-400" /> Physical & Digital Prize Claims ({myClaims.length})
              </h4>
              {loadingClaims ? (
                <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> Loading claims...
                </div>
              ) : myClaims.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-2">
                  <p className="text-xs text-slate-400">Aapne abhi tak koi physical prize claim nahi kiya hai.</p>
                  <p className="text-[11px] text-slate-500">Milestones complete karke Books, T-Shirts, aur Tablets claim karein!</p>
                  {onNavigateToRewards && (
                    <button
                      onClick={onNavigateToRewards}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md"
                    >
                      Milestones Hub Dekhein →
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {myClaims.map((claim: any) => (
                    <div key={claim.id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-extrabold text-white">{claim.milestoneName || 'Prize Reward'}</p>
                        <p className="text-[10px] text-slate-500">{claim.claimedAt ? new Date(claim.claimedAt).toLocaleDateString() : 'Recent'}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                        claim.status === 'fulfilled' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        claim.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {claim.status || 'Pending Review'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: DYNAMIC CUSTOMIZER & SETTINGS */}
        {/* ============================================================== */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            {/* Section 1: Dynamic Aura Theme Accent */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Palette className="w-4 h-4 text-cyan-400" /> Profile Aura Theme Accent
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {THEME_AURA_PRESETS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setThemeAccent(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 border ${
                      themeAccent === t.id
                        ? `${t.bg} ${t.text} ${t.border} shadow-lg shadow-cyan-500/20 scale-105`
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ background: t.glow }} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Personal Identity */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-4">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-400" /> Personal Identity & Bio
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                    placeholder="e.g. Ambuj Yadav"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Target Year</label>
                  <select
                    value={targetYear}
                    onChange={(e) => setTargetYear(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none cursor-pointer"
                  >
                    {[2025, 2026, 2027, 2028, 2029].map((yr) => (
                      <option key={yr} value={yr} className="bg-slate-900 text-white">
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bio & Motto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Student Bio / Persona</label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                    placeholder="e.g. UPSC CSE 2026 Aspirant • Sociology Optional"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Study Battlecry / Motto</label>
                  <input
                    type="text"
                    value={studyGoal}
                    onChange={(e) => setStudyGoal(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                    placeholder="e.g. AIR 1 Mission • Consistency Over Intensity"
                  />
                </div>
              </div>

              {/* Avatar Studio */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Avatar & Profile Photo</span>
                  {uploadingPhoto && <span className="text-cyan-400 text-[10px] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</span>}
                </label>

                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-bold text-cyan-300 cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5" /> Upload Custom Photo
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingPhoto}
                    />
                  </label>
                  <span className="text-[11px] text-slate-500">Ya select karein niche diye gaye presets me se:</span>
                </div>

                {/* Preset Avatar Gallery */}
                <div className="flex items-center gap-2.5 flex-wrap pt-1">
                  {CURATED_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setAvatarUrl(av.url)}
                      title={av.label}
                      className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                        avatarUrl === av.url ? 'border-cyan-400 scale-110 shadow-lg shadow-cyan-500/30' : 'border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 3: Academic Preferences & Target Exam */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-4">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" /> Academic Exam & Board Details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Target Exam Name</label>
                  <input
                    type="text"
                    required
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                    placeholder="e.g. UPSC CSE, NDA, NEET, SSC CGL..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Exam Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none cursor-pointer"
                  >
                    {EXAM_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">State / Region</label>
                  <select
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none cursor-pointer"
                  >
                    {INDIAN_STATES_AND_UTS.map((st) => (
                      <option key={st} value={st} className="bg-slate-900 text-white">
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Board / University</label>
                  <select
                    value={boardOrUniversity}
                    onChange={(e) => setBoardOrUniversity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none cursor-pointer"
                  >
                    {EDUCATIONAL_BOARDS.map((bd) => (
                      <option key={bd} value={bd} className="bg-slate-900 text-white truncate">
                        {bd}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Stream / Optional</label>
                  <input
                    type="text"
                    value={streamOrSubject}
                    onChange={(e) => setStreamOrSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                    placeholder="e.g. Science / Arts / Commerce"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Save Trigger Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {isSaving ? 'Saving Changes...' : 'Save & Sync Profile'}
              </button>
            </div>
          </form>
        )}

        {/* Custom Exam Modal Fallback */}
        {isCustomModalOpen && (
          <CustomExamModal
            isOpen={isCustomModalOpen}
            onClose={() => setIsCustomModalOpen(false)}
            onExamSaved={(customExam) => {
              setExamName(customExam.title);
              setCategory('OTHER');
              setIsCustomModalOpen(false);
            }}
          />
        )}
      </motion.div>
    </div>
  );
};
