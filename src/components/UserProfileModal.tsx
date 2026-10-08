import React, { useState, useEffect, useMemo } from 'react';
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
  CURATED_AVATARS, 
  THEME_AURA_PRESETS,
  computeStudyTelemetry,
  StudyTelemetryData
} from '../data/profileBadgesData';
import { resolveUserAvatar, storeUserAvatar, syncAvatarToServer } from '../lib/avatarStorage';
import { AvatarConfig, DEFAULT_AVATAR_CONFIG } from './AvatarStudioModal';
import { avatarConfigToDataUrl, generateMonogramDataUrl } from '../lib/avatarSvgGenerator';
import { AspirantAvatar } from './AspirantAvatar';
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
  Share2,
  Phone,
  Mail,
  UserCog,
  Edit2,
  Shirt,
  Glasses
} from 'lucide-react';
import { 
  loadStudyReminderSettings, 
  saveStudyReminderSettings, 
  StudyReminderSettings,
  requestNotificationPermission 
} from '../lib/studyReminderService';

import { soundFx } from '../lib/soundEffects';

interface UserProfileModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'overview' | 'avatar' | 'edit';
  onProfileUpdated?: (updated: UserProfile) => void;
  onOpenReferralModal?: () => void;
  onNavigateToRewards?: () => void;
  onOpenCustomizerModal?: () => void;
}

const VECTOR_BG_COLORS = [
  { label: 'Sun Gold', color: '#FACC15' },
  { label: 'Emerald Forest', color: '#10B981' },
  { label: 'Deep Cyan', color: '#06B6D4' },
  { label: 'Royal Violet', color: '#8B5CF6' },
  { label: 'Rose Pink', color: '#F43F5E' },
  { label: 'OLED Charcoal', color: '#1E2520' }
];

const VECTOR_SKIN_TONES = [
  { label: 'Fair', color: '#FBD8B5' },
  { label: 'Warm', color: '#F3C5A5' },
  { label: 'Olive', color: '#E0A37A' },
  { label: 'Rich Brown', color: '#A0633C' },
  { label: 'Deep Ebony', color: '#5C3822' }
];

const VECTOR_FACIAL_HAIR_OPTIONS = [
  { id: 'none', label: 'Clean Shaven', desc: 'Fresh & sharp' },
  { id: 'stubble', label: 'Light Stubble', desc: 'Subtle shadow' },
  { id: 'beard', label: 'Full Beard', desc: 'Dense beard' },
  { id: 'goatee', label: 'Goatee', desc: 'French cut' },
  { id: 'mustache', label: 'Handlebar', desc: 'Imperial mustache' },
  { id: 'salt_pepper', label: 'Salt & Pepper', desc: 'Experienced scholar' }
];

const VECTOR_HAIR_STYLES = [
  { id: 'bald', label: 'Bald / Shaved' },
  { id: 'short', label: 'Classic Crew' },
  { id: 'wavy', label: 'Wavy Volume' },
  { id: 'curly', label: 'Curly Top' },
  { id: 'parted', label: 'Side Part' }
];

const VECTOR_BODY_STYLES = [
  { id: 'shirt', label: 'White Collared Shirt', emoji: '👔' },
  { id: 'hoodie', label: 'Study Hoodie', emoji: '🧥' },
  { id: 'tshirt', label: 'Casual Crewneck', emoji: '👕' },
  { id: 'blazer', label: 'Officer Blazer', emoji: '🤵' },
  { id: 'kurta', label: 'Minimalist Kurta', emoji: '🥻' }
];

const VECTOR_ACCESSORIES = [
  { id: 'none', label: 'None', emoji: '🚫' },
  { id: 'reading_glasses', label: 'Study Specs', emoji: '👓' },
  { id: 'round_glasses', label: 'Professor Glasses', emoji: '🕶️' },
  { id: 'headphones', label: 'Noise-Cancel Headphones', emoji: '🎧' }
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  initialTab = 'overview',
  onProfileUpdated,
  onOpenReferralModal,
  onNavigateToRewards,
  onOpenCustomizerModal,
}) => {
  // Navigation Tabs: 'overview' | 'avatar' | 'edit'
  const [activeTab, setActiveTab] = useState<'overview' | 'avatar' | 'edit'>(initialTab);

  useEffect(() => {
    if (initialTab && isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);
  
  // Profile Form States
  const [name, setName] = useState<string>(user.name || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(user.phoneNumber || '');
  const [dailyStudyTargetHours, setDailyStudyTargetHours] = useState<number>(user.dailyStudyTargetHours || 6);
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    return resolveUserAvatar(user.avatar_url, user.id, user.email);
  });
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
  const [themeAccent, setThemeAccent] = useState<string>(user.themeAccent || 'emerald');

  // Avatar Studio State
  const [avatarStudioMode, setAvatarStudioMode] = useState<'vector' | 'presets' | 'monogram' | 'upload'>('vector');
  const [vectorConfig, setVectorConfig] = useState<AvatarConfig>(() => {
    try {
      const saved = localStorage.getItem('studyride_user_avatar');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_AVATAR_CONFIG;
  });
  const [vectorCategory, setVectorCategory] = useState<'Face' | 'Hair' | 'Facial Hair' | 'Outfit' | 'Accessories' | 'Background'>('Facial Hair');
  const [monogramInitials, setMonogramInitials] = useState<string>(() => (user.name ? user.name.slice(0, 2).toUpperCase() : 'AY'));
  const [monogramGrad, setMonogramGrad] = useState<string>('emerald');

  // Photo Upload & Statuses
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);

  // Reminder Preferences
  const [reminderSettings, setReminderSettings] = useState<StudyReminderSettings>(() => {
    return loadStudyReminderSettings();
  });

  // Sound Effects Preference
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => soundFx.isEnabled());

  // Calculate Real Telemetry
  const telemetry: StudyTelemetryData = useMemo(() => {
    return computeStudyTelemetry(user);
  }, [user, isOpen]);

  // Active Aura Theme Preset
  const activeAura = useMemo(() => {
    return THEME_AURA_PRESETS.find(p => p.id === themeAccent) || THEME_AURA_PRESETS[0];
  }, [themeAccent]);

  // Dynamic Levels and XP calculation (safe non-negative modulo)
  const currentXP = Math.max(0, user.xp || 0);
  const currentLevel = Math.max(1, user.level || 1);
  const levelBracketXP = 200;
  const currentLevelXP = currentXP % levelBracketXP;
  const xpProgress = Math.min(100, Math.max(0, Math.round((currentLevelXP / levelBracketXP) * 100)));

  // Device Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Kripya valid image file (JPG, PNG, WebP) select karein.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size 5MB se kam honi chahiye.');
      return;
    }

    setUploadingPhoto(true);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 400;
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
          storeUserAvatar(compressedDataUrl, user.id, user.email);
          syncAvatarToServer(compressedDataUrl, user.email, user.id);

          if (onProfileUpdated) {
            onProfileUpdated({ ...user, avatar_url: compressedDataUrl });
          }

          setUploadingPhoto(false);
          triggerConfetti();
          setSaveSuccessMessage('Profile photo successfully update ho gayi! ✓');
          setTimeout(() => setSaveSuccessMessage(null), 3000);
        } else {
          setAvatarUrl(rawDataUrl);
          storeUserAvatar(rawDataUrl, user.id, user.email);
          setUploadingPhoto(false);
        }
      };
      img.onerror = () => {
        setUploadError('Image process nahi ho saki.');
        setUploadingPhoto(false);
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      setUploadError('File read karne me error aayi.');
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  // Apply Vector Avatar
  const handleApplyVectorAvatar = () => {
    const dataUri = avatarConfigToDataUrl(vectorConfig);
    setAvatarUrl(dataUri);
    localStorage.setItem('studyride_user_avatar', JSON.stringify(vectorConfig));
    storeUserAvatar(dataUri, user.id, user.email);
    syncAvatarToServer(dataUri, user.email, user.id);
    if (onProfileUpdated) {
      onProfileUpdated({ ...user, avatar_url: dataUri });
    }
    triggerConfetti();
    setSaveSuccessMessage('Vector Aspirant Avatar set ho gaya! ✓');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Apply Monogram Avatar
  const handleApplyMonogram = () => {
    const dataUri = generateMonogramDataUrl(monogramInitials, monogramGrad);
    setAvatarUrl(dataUri);
    storeUserAvatar(dataUri, user.id, user.email);
    syncAvatarToServer(dataUri, user.email, user.id);
    if (onProfileUpdated) {
      onProfileUpdated({ ...user, avatar_url: dataUri });
    }
    triggerConfetti();
    setSaveSuccessMessage('Monogram Avatar set ho gaya! ✓');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Profile Save Submission
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMessage(null);
    setSaveError(null);

    try {
      const updatedProfile: UserProfile = {
        ...user,
        name: name.trim() || user.name,
        fullName: name.trim() || user.name,
        phoneNumber: phoneNumber.trim(),
        dailyStudyTargetHours: Number(dailyStudyTargetHours) || 6,
        bio: bio.trim(),
        studyGoal: studyGoal.trim(),
        exam: examName,
        educationCategory: category,
        stateName,
        boardOrUniversity,
        streamOrSubject,
        targetYear,
        themeAccent,
        avatar_url: avatarUrl,
      };

      saveUserProfile(updatedProfile);
      storeUserAvatar(avatarUrl, user.id, user.email);
      saveStudyReminderSettings(reminderSettings);

      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }

      try {
        const token = localStorage.getItem('aspirantx_auth_token') || localStorage.getItem('supabase.auth.token');
        await fetch('/api/user/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(updatedProfile)
        });
      } catch (_) {}

      triggerConfetti();
      setSaveSuccessMessage('Aapka profile aur study preferences successfully save ho gaye! ✓');
      setTimeout(() => setSaveSuccessMessage(null), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Profile save karne me samasya aayi.');
    } finally {
      setIsSaving(false);
    }
  };

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
          className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-25"
          style={{ background: activeAura.glow }}
        />
        <div 
          className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-20"
          style={{ background: activeAura.glow }}
        />

        {/* Top Floating Action Bar: ONLY Close Button (No Logout in Profile) */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 transition-all shadow-lg backdrop-blur-md active:scale-95"
            title="Close Profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ============================================================== */}
        {/* HERO BANNER WITH AVATAR & CANDIDATE IDENTITY */}
        {/* ============================================================== */}
        <div className="relative pt-6 pr-16 pl-5 sm:px-8 pb-5 border-b border-slate-800/80 bg-gradient-to-b from-slate-950/90 via-slate-900/80 to-slate-900/40 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* Avatar & Core Identity */}
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              {/* Concentric Level Ring Avatar */}
              <div 
                className="relative group shrink-0 cursor-pointer"
                onClick={() => setActiveTab('avatar')}
                title="Click to Open Avatar Studio"
              >
                <div 
                  className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl p-1 relative overflow-hidden transition-transform duration-300 group-hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${activeAura.glow}, rgba(255,255,255,0.15), ${activeAura.glow})`
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
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                    </div>
                  )}
                  {/* Subtle Camera / Edit Overlay Badge */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[22px] flex items-center justify-center">
                    <Edit2 className="w-5 h-5 text-white drop-shadow" />
                  </div>
                </div>

                {/* Level Pill */}
                <div className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-[10px] font-black text-amber-400 shadow-md flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 fill-amber-400" /> Lvl {currentLevel}
                </div>
              </div>

              {/* Candidate Info */}
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate max-w-[280px]">
                    {name || 'Aspirant'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold">
                    Candidate Profile
                  </span>
                </div>

                {/* Target Exam & Year Pills */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className={`px-2.5 py-1 rounded-lg ${activeAura.bg} ${activeAura.text} border ${activeAura.border} font-extrabold flex items-center gap-1.5`}>
                    <Target className="w-3.5 h-3.5" />
                    {examName}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-800/60 text-slate-300 border border-slate-700/60 font-semibold">
                    Target {targetYear}
                  </span>
                  <span className="text-xs text-slate-400 truncate max-w-[180px] hidden sm:inline">
                    {user.email || 'guest@studyride.internal'}
                  </span>
                </div>

                {/* Motto */}
                <p className="text-xs text-slate-300/90 italic line-clamp-1 max-w-md pt-0.5">
                  "{studyGoal || 'Discipline beats motivation every single day.'}"
                </p>
              </div>
            </div>

            {/* Quick Navigation Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('avatar')}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 ${
                  activeTab === 'avatar'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-white border-slate-700/80'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                Avatar Studio
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 ${
                  activeTab === 'edit'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-white border-slate-700/80'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Edit Profile
              </button>
            </div>
          </div>

          {/* Level XP Progress Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Level {currentLevel} Mastery
              </span>
              <span className="text-white font-mono">
                {currentXP} XP <span className="text-emerald-400 font-sans font-bold">({currentLevelXP}/{levelBracketXP} XP to Lvl {currentLevel + 1} • {xpProgress}%)</span>
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-950/80 border border-slate-800 overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
              />
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* THREE CLEAN PROFILE-ONLY TABS (RESPONSIVE GRID) */}
        {/* ============================================================== */}
        <div className="grid grid-cols-3 border-b border-slate-800/80 bg-slate-950/70 px-2 sm:px-6 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-[11px] sm:text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === 'overview'
                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Profile & Stats</span>
            <span className="sm:hidden">Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('avatar')}
            className={`py-3 text-[11px] sm:text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === 'avatar'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Avatar Studio</span>
            <span className="sm:hidden">Avatar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`py-3 text-[11px] sm:text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-1.5 sm:gap-2 ${
              activeTab === 'edit'
                ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCog className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Preferences</span>
          </button>
        </div>

        {/* Toast / Notification Banner */}
        {saveSuccessMessage && (
          <div className="mx-6 mt-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}
        {saveError && (
          <div className="mx-6 mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: PROFILE & STATS (CANDIDATE CARD + REWARDS HUB LINK) */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <div className="p-5 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            {/* Candidate Details Grid */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-400" /> Academic & Personal Profile
                </span>
                <button
                  onClick={() => setActiveTab('edit')}
                  className="text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Target Exam</span>
                  <p className="text-xs font-black text-white">{examName}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Daily Study Target</span>
                  <p className="text-xs font-black text-amber-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {dailyStudyTargetHours} Hours / Day
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Target Year</span>
                  <p className="text-xs font-black text-white">{targetYear}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Stream / Optional</span>
                  <p className="text-xs font-black text-white truncate">{streamOrSubject || 'General Studies'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Board / University</span>
                  <p className="text-xs font-black text-white truncate">{boardOrUniversity}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">State / Region</span>
                  <p className="text-xs font-black text-white truncate">{stateName}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Registered Email</span>
                  <p className="text-xs font-bold text-slate-300 truncate">{user.email || 'guest@studyride.internal'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Mobile / WhatsApp</span>
                  <p className="text-xs font-bold text-slate-300 truncate">{phoneNumber || 'Not provided'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Persona / Bio</span>
                  <p className="text-xs font-bold text-slate-300 truncate">{bio || 'Dedicated Aspirant'}</p>
                </div>
              </div>
            </div>

            {/* Verified Focus Telemetry */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" /> Focus Sessions & Consistency
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Focus Hours</span>
                  <p className="text-lg font-black text-white mt-0.5">{telemetry.totalStudyHours} hrs</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Completed Rides</span>
                  <p className="text-lg font-black text-white mt-0.5">{telemetry.totalSessionsCount}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Current Streak</span>
                  <p className="text-lg font-black text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                    <Flame className="w-4 h-4 fill-amber-400" /> {telemetry.streakDays}d
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Study</span>
                  <p className="text-lg font-black text-emerald-400 mt-0.5">{telemetry.todayStudyHours} hrs</p>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* SEPARATE REWARDS SECTION PROMINENT CALLOUT BANNER */}
            {/* Badges, Medals & Winning belong in dedicated Rewards Hub */}
            {/* ============================================================== */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-emerald-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    Badges, Medals & Winning Rewards Hub
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 max-w-lg">
                    Aapke sabhi achievement medals, subject badges, study streaks, aur physical swag prizes ab ek dedicated Rewards section me hain!
                  </p>
                </div>
              </div>

              {onNavigateToRewards && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToRewards();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition-all active:scale-95 flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <Trophy className="w-4 h-4" />
                  Open Rewards Hub →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: AVATAR STUDIO & CREATOR (DIRECTLY INSIDE PROFILE) */}
        {/* ============================================================== */}
        {activeTab === 'avatar' && (
          <div className="p-5 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            {/* Studio Header Card */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-br from-emerald-400 to-cyan-400 shrink-0 overflow-hidden shadow-lg">
                  <img
                    src={avatarUrl}
                    alt="Active Avatar"
                    className="w-full h-full object-cover rounded-[14px] bg-slate-950"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    Aspirant Avatar Studio
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      Live
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Design your vector character, choose curated presets, or upload a custom photo.
                  </p>
                </div>
              </div>

              {/* Mode Selector Chips */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto flex-wrap">
                {[
                  { id: 'vector', label: 'Vector Character', icon: User },
                  { id: 'presets', label: 'Aspirant Presets', icon: Sparkles },
                  { id: 'monogram', label: 'Initials Monogram', icon: Palette },
                  { id: 'upload', label: 'Upload Photo', icon: Upload }
                ].map(mode => {
                  const Icon = mode.icon;
                  const active = avatarStudioMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setAvatarStudioMode(mode.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        active
                          ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode 1: Vector Character Creator */}
            {avatarStudioMode === 'vector' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Character Preview Column */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div 
                    className="w-full rounded-3xl p-6 relative overflow-hidden flex flex-col items-center justify-center text-center transition-colors duration-300 border border-slate-800 shadow-xl"
                    style={{ backgroundColor: vectorConfig.bgColor || '#FACC15' }}
                  >
                    <div className="w-48 h-48 sm:w-56 sm:h-56 relative">
                      <AspirantAvatar config={vectorConfig} className="w-full h-full drop-shadow-2xl" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyVectorAvatar}
                    className="mt-4 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    Apply Vector Avatar to Profile
                  </button>
                </div>

                {/* Customizer Tabs & Options Column */}
                <div className="md:col-span-7 space-y-4">
                  {/* Category Pill Nav */}
                  <div className="flex items-center overflow-x-auto no-scrollbar gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
                    {(['Facial Hair', 'Hair', 'Face', 'Outfit', 'Accessories', 'Background'] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setVectorCategory(cat as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          vectorCategory === cat
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Panel Content */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 min-h-[220px]">
                    {/* Facial Hair */}
                    {vectorCategory === 'Facial Hair' && (
                      <div className="grid grid-cols-2 gap-2.5">
                        {VECTOR_FACIAL_HAIR_OPTIONS.map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setVectorConfig({ ...vectorConfig, facialHair: opt.id })}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              vectorConfig.facialHair === opt.id
                                ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-xs font-bold text-white">{opt.label}</span>
                            <span className="text-[10px] text-slate-400 mt-1">{opt.desc}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Hair */}
                    {vectorCategory === 'Hair' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          {VECTOR_HAIR_STYLES.map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setVectorConfig({ ...vectorConfig, hairStyle: opt.id })}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                vectorConfig.hairStyle === opt.id
                                  ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <span className="text-xs font-bold text-white">{opt.label}</span>
                            </button>
                          ))}
                        </div>

                        <div>
                          <p className="text-[11px] font-bold text-slate-400 mb-2">Hair Color</p>
                          <div className="flex items-center gap-2.5">
                            {['#161B18', '#3E2723', '#5D4037', '#78909C', '#F59E0B'].map(c => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => setVectorConfig({ ...vectorConfig, hairColor: c })}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                  vectorConfig.hairColor === c ? 'border-emerald-400 scale-110 shadow-lg' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Skin Tone */}
                    {vectorCategory === 'Face' && (
                      <div className="space-y-3">
                        <p className="text-[11px] font-bold text-slate-400">Skin Tone</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {VECTOR_SKIN_TONES.map(opt => (
                            <button
                              key={opt.color}
                              type="button"
                              onClick={() => setVectorConfig({ ...vectorConfig, skinTone: opt.color })}
                              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                                vectorConfig.skinTone === opt.color
                                  ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <span className="w-6 h-6 rounded-full border border-black/30 shrink-0" style={{ backgroundColor: opt.color }} />
                              <span className="text-xs font-bold text-white">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Outfit */}
                    {vectorCategory === 'Outfit' && (
                      <div className="grid grid-cols-2 gap-2.5">
                        {VECTOR_BODY_STYLES.map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setVectorConfig({ ...vectorConfig, bodyStyle: opt.id })}
                            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                              vectorConfig.bodyStyle === opt.id
                                ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-lg">{opt.emoji}</span>
                            <span className="text-xs font-bold text-white">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Accessories */}
                    {vectorCategory === 'Accessories' && (
                      <div className="grid grid-cols-2 gap-2.5">
                        {VECTOR_ACCESSORIES.map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setVectorConfig({ ...vectorConfig, accessory: opt.id })}
                            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                              vectorConfig.accessory === opt.id
                                ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-lg">{opt.emoji}</span>
                            <span className="text-xs font-bold text-white">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Background */}
                    {vectorCategory === 'Background' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {VECTOR_BG_COLORS.map(opt => (
                          <button
                            key={opt.color}
                            type="button"
                            onClick={() => setVectorConfig({ ...vectorConfig, bgColor: opt.color })}
                            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                              vectorConfig.bgColor === opt.color
                                ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <span className="w-6 h-6 rounded-full border border-black/30 shrink-0" style={{ backgroundColor: opt.color }} />
                            <span className="text-xs font-bold text-white">{opt.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Curated Aspirant Presets */}
            {avatarStudioMode === 'presets' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Select a curated aspirant avatar that matches your study mindset:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {CURATED_AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        setAvatarUrl(av.url);
                        storeUserAvatar(av.url, user.id, user.email);
                        syncAvatarToServer(av.url, user.email, user.id);
                        if (onProfileUpdated) {
                          onProfileUpdated({ ...user, avatar_url: av.url });
                        }
                        triggerConfetti();
                        setSaveSuccessMessage(`${av.label} set ho gaya! ✓`);
                        setTimeout(() => setSaveSuccessMessage(null), 3000);
                      }}
                      className={`relative rounded-2xl overflow-hidden border-2 transition-all p-1 group flex flex-col items-center cursor-pointer ${
                        avatarUrl === av.url
                          ? 'border-emerald-400 bg-emerald-500/20 scale-105 shadow-lg shadow-emerald-500/30'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
                      }`}
                    >
                      <img src={av.url} alt={av.label} className="w-full h-20 sm:h-24 object-cover rounded-xl" />
                      <span className="text-[10px] font-bold text-slate-300 mt-1 truncate px-1 text-center">
                        {av.label}
                      </span>
                      {avatarUrl === av.url && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mode 3: Monogram Generator */}
            {avatarStudioMode === 'monogram' && (
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4 max-w-lg mx-auto text-center">
                <div className="w-24 h-24 mx-auto rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
                  <img
                    src={generateMonogramDataUrl(monogramInitials, monogramGrad)}
                    alt="Monogram Preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-300">Initials (1-2 Characters)</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={monogramInitials}
                    onChange={(e) => setMonogramInitials(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-400 text-center font-black text-lg text-white outline-none uppercase"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-bold text-slate-300">Gradient Theme</label>
                  <div className="flex items-center justify-center gap-3">
                    {[
                      { id: 'emerald', label: 'Emerald' },
                      { id: 'violet', label: 'Violet' },
                      { id: 'cyan', label: 'Cyan' },
                      { id: 'amber', label: 'Amber' },
                      { id: 'rose', label: 'Rose' }
                    ].map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setMonogramGrad(g.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          monogramGrad === g.id
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-md'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyMonogram}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Apply Monogram Avatar
                </button>
              </div>
            )}

            {/* Mode 4: Custom Device Upload */}
            {avatarStudioMode === 'upload' && (
              <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4 max-w-lg mx-auto text-center">
                <div className="w-24 h-24 mx-auto rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-500/40">
                  <img
                    src={avatarUrl}
                    alt="Current Avatar"
                    className="w-full h-full object-cover bg-slate-900"
                  />
                </div>

                {uploadError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <label className="inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                  <Upload className="w-4 h-4" />
                  {uploadingPhoto ? 'Uploading & Compressing...' : 'Select Photo from Phone / Device'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                </label>
                <p className="text-[11px] text-slate-400">
                  Image auto-crop aur auto-compress hokar permanently aapke profile pe save ho jayegi.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: EDIT PROFILE & PREFERENCES (THEME ALIGNED - NO LOGOUT) */}
        {/* ============================================================== */}
        {activeTab === 'edit' && (
          <form onSubmit={handleSaveProfile} className="p-5 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            {/* Header Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-indigo-500/10 border border-emerald-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Edit Student Profile & Preferences</h3>
                  <p className="text-xs text-slate-400">Custom Target Exam, Daily Study Hours & Notification Reminders</p>
                </div>
              </div>
            </div>

            {/* Section 1: Candidate Identity */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-4">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" /> Candidate Identity & Contact
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 text-xs text-white outline-none"
                    placeholder="e.g. Ambuj Yadav"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Target Exam Year</label>
                  <select
                    value={targetYear}
                    onChange={(e) => setTargetYear(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-400 text-xs text-white outline-none cursor-pointer"
                  >
                    {[2025, 2026, 2027, 2028, 2029].map((yr) => (
                      <option key={yr} value={yr} className="bg-slate-900 text-white">
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email & Phone Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Registered Email</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Verified</span>
                  </label>
                  <div className="w-full px-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{user.email || 'guest@studyride.internal'}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>Mobile / WhatsApp Number</span>
                    <span className="text-[10px] text-slate-500">For daily streak reports</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Phone className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/30 text-xs text-white outline-none"
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
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
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-400 text-xs text-white outline-none"
                    placeholder="e.g. UPSC CSE Aspirant • High-Performance Monk"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Study Battlecry / Motto</label>
                  <input
                    type="text"
                    value={studyGoal}
                    onChange={(e) => setStudyGoal(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-400 text-xs text-white outline-none"
                    placeholder="e.g. Tu banega Officer! LBSNAA is calling 🇮🇳"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Target Exam & Academic Roadmap */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-4">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" /> Target Exam & Academic Roadmap
              </label>

              {/* Quick Exam Chips */}
              <div className="space-y-2">
                <span className="text-xs text-slate-400">Popular Exam Presets:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    'UPSC CSE (IAS/IPS)',
                    'SSC CGL',
                    'NEET UG',
                    'JEE Main',
                    'NDA / CDS',
                    'UPPSC / BPSC',
                    'Banking (IBPS/SBI)',
                    'CUET UG'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setExamName(preset)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        examName === preset
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-md'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Target Exam Name *</label>
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
                  <label className="text-xs font-bold text-slate-300">Stream / Optional Subject</label>
                  <input
                    type="text"
                    value={streamOrSubject}
                    onChange={(e) => setStreamOrSubject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                    placeholder="e.g. Science / Humanities"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Daily Study Target Hours */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" /> Daily Study Target (Team Consistency Standard)
                </span>
                <span className="text-amber-400 font-bold">{dailyStudyTargetHours} hrs / day</span>
              </label>

              <div className="flex items-center gap-2.5 flex-wrap">
                {[3, 4, 6, 8, 10, 12].map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setDailyStudyTargetHours(hours)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                      dailyStudyTargetHours === hours
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-md scale-105'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {hours} Hours / Day
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                Highway Focus Timer aur Progress Hub is daily target ke according aapki live pace track karte hain.
              </p>
            </div>

            {/* Section 4: Daily Reminder & Notification Preferences */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-4">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" /> Study Reminders & Sound Preferences
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Daily Study Call Time</label>
                  <input
                    type="time"
                    value={reminderSettings.reminderTime || '06:00'}
                    onChange={(e) => setReminderSettings({ ...reminderSettings, reminderTime: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-400 text-xs text-white outline-none cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-white block">Sound & Bell Effects</span>
                    <span className="text-[10px] text-slate-400">Timer alerts and audio feedback</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !soundEnabled;
                      setSoundEnabled(next);
                      soundFx.setEnabled(next);
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        soundEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Section 5: Profile Aura Theme Accent */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" /> Profile Aura Theme Accent
              </label>
              <div className="flex items-center gap-2.5 flex-wrap">
                {THEME_AURA_PRESETS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setThemeAccent(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 border cursor-pointer ${
                      themeAccent === t.id
                        ? `${t.bg} ${t.text} ${t.border} shadow-lg shadow-emerald-500/20 scale-105`
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full" style={{ background: t.glow }} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Save Trigger Button (STRICTLY NO LOGOUT HERE) */}
            <div className="pt-2 flex items-center justify-end gap-3 sticky bottom-0 bg-slate-950/90 backdrop-blur-md p-3 -mx-5 -mb-5 sm:-mx-8 sm:-mb-8 border-t border-slate-800/80 z-20">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
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
            onExamCreated={(examId) => {
              setExamName(examId);
              setCategory('OTHER');
              setIsCustomModalOpen(false);
            }}
          />
        )}
      </motion.div>
    </div>
  );
};
