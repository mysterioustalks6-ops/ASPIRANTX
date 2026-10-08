import React, { useState, useMemo } from 'react';
import { 
  User, Flame, Coins, Clock, Smartphone, Award, Users, MessageSquare, 
  Sparkles, Gift, Share2, Crown, Palette, Bell, HelpCircle, ShieldCheck, 
  FileText, ChevronRight, GraduationCap, Briefcase, Calendar, Shield, 
  Trophy, Download, RotateCcw, Volume2, VolumeX, Vibrate, CheckCircle2,
  BookOpen, BookMarked, BarChart3, Mic, Settings, LogOut
} from 'lucide-react';
import { UserProfile, ExamType, ActiveTab } from '../types';
import { CANONICAL_APP_RELEASE } from '../config/appRelease';
import { soundFx } from '../lib/soundEffects';
import { TactileButton } from '../design-system/TactileButton';
import { VeerMascot } from '../design-system/VeerMascot';
import { loadSessions, computeStreakDays } from '../lib/focus/sessionStore';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { getLocalizedExamName } from '../lib/subjectUtils';

interface MoreHubProps {
  user: UserProfile;
  selectedExam: ExamType;
  onNavigate: (tab: ActiveTab) => void;
  onOpenProfileModal: (tab?: 'overview' | 'avatar' | 'edit') => void;
  onOpenReferralModal: () => void;
  onOpenWorkspaceCustomizer: () => void;
  onOpenReminderSettings: () => void;
  onLogout?: () => void;
  isAdminUnlocked?: boolean;
}

export const MoreHub: React.FC<MoreHubProps> = ({
  user,
  selectedExam,
  onNavigate,
  onOpenProfileModal,
  onOpenReferralModal,
  onOpenWorkspaceCustomizer,
  onOpenReminderSettings,
  onLogout,
  isAdminUnlocked = false
}) => {
  const { currentLanguage, isHindi: ctxIsHindi } = useLanguage();
  const isHindi = Boolean(ctxIsHindi || currentLanguage === 'hi');
  const [checkStatus, setCheckStatus] = useState<'idle' | 'checking' | 'done'>('idle');
  const [isSoundOn, setIsSoundOn] = useState(() => soundFx.isEnabled());
  const [isHapticOn, setIsHapticOn] = useState(() => soundFx.isHaptics());

  const handleToggleSound = () => {
    const next = !isSoundOn;
    setIsSoundOn(next);
    soundFx.setEnabled(next);
    if (next) soundFx.playTap();
  };

  const handleToggleHaptic = () => {
    const next = !isHapticOn;
    setIsHapticOn(next);
    soundFx.setHaptics(next);
    if (next) soundFx.triggerHaptic(20);
  };

  const handleCheckUpdate = () => {
    soundFx.playTap();
    setCheckStatus('checking');
    window.dispatchEvent(new CustomEvent('studyride:check-update'));
    setTimeout(() => {
      soundFx.playSuccess();
      setCheckStatus('done');
      setTimeout(() => setCheckStatus('idle'), 5000);
    }, 1200);
  };

  const navigateTo = (tab: ActiveTab) => {
    soundFx.playTap();
    soundFx.triggerHaptic(12);
    onNavigate(tab);
  };

  const userXp = user.xp ?? 0;
  const getLeagueInfo = (xp: number) => {
    if (xp <= 0) return { name: isHindi ? 'अनारक्षित' : 'Unranked', icon: '🌱', badgeClass: 'bg-[var(--sr-surface-2)] text-[var(--sr-text-muted)] border-[var(--sr-line)]' };
    if (xp < 500) return { name: isHindi ? 'कांस्य लीग' : 'Bronze League', icon: '🥉', badgeClass: 'bg-[var(--sr-amber-subtle)] text-[var(--sr-amber)] border-[var(--sr-amber)]/30' };
    if (xp < 1500) return { name: isHindi ? 'रजत लीग' : 'Silver League', icon: '🥈', badgeClass: 'bg-[var(--sr-blue-subtle)] text-[var(--sr-blue)] border-[var(--sr-blue)]/30' };
    if (xp < 3000) return { name: isHindi ? 'स्वर्ण लीग' : 'Gold League', icon: '🥇', badgeClass: 'bg-[var(--sr-amber-subtle)] text-[var(--sr-amber)] border-[var(--sr-amber)]/30' };
    if (xp < 6000) return { name: isHindi ? 'प्लैटिनम लीग' : 'Platinum League', icon: '🏆', badgeClass: 'bg-[var(--sr-purple-subtle)] text-[var(--sr-purple)] border-[var(--sr-purple)]/30' };
    return { name: isHindi ? 'डायमंड लीग' : 'Diamond League', icon: '💎', badgeClass: 'bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] border-[var(--sr-primary)]/30' };
  };
  const league = getLeagueInfo(userXp);
  const liveStreak = useMemo(() => computeStreakDays(loadSessions(user.id)), [user.id]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-28 px-3 sm:px-4 text-[var(--sr-text)]">
      {/* ── PROFILE & CANDIDATE SUMMARY CARD ── */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="relative shrink-0">
              <div 
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--sr-primary-subtle)] border-2 border-[var(--sr-primary)] overflow-hidden flex items-center justify-center font-black text-[var(--sr-primary)] text-xl sm:text-2xl shrink-0 cursor-pointer"
                onClick={() => onOpenProfileModal('avatar')}
                title={isHindi ? 'अवतार स्टूडियो खोलें' : 'Open Avatar Studio'}
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name || (isHindi ? 'परीक्षार्थी' : 'Aspirant')} className="w-full h-full object-cover" />
                ) : (
                  user.name ? user.name[0].toUpperCase() : (isHindi ? 'प' : 'A')
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[var(--sr-primary)] text-[var(--sr-on-primary)] border-2 border-[var(--sr-surface)] flex items-center justify-center text-[10px] sm:text-xs font-black">
                ✓
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-[var(--sr-text)] tracking-tight truncate">
                  {user.name && user.name.toLowerCase() !== 'aspirant' ? user.name : (isHindi ? 'परीक्षार्थी' : 'Aspirant')}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[var(--sr-blue-subtle)] text-[var(--sr-blue)] text-xs font-black border border-[var(--sr-blue)]/30 shrink-0">
                  {isHindi ? 'स्तर' : 'LVL'} {user.level || 1}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-black border shrink-0 ${league.badgeClass}`}>
                  {league.icon} {league.name}
                </span>
              </div>
              <p className="text-xs font-bold text-[var(--sr-text-muted)] mt-1 truncate">
                {isHindi ? 'लक्ष्य परीक्षा: ' : 'Target: '}{getLocalizedExamName(selectedExam.replace(/_/g, ' '), isHindi)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto flex-wrap">
            <TactileButton
              variant="secondary"
              size="sm"
              onClick={() => onOpenProfileModal('avatar')}
              icon={<Palette className="w-3.5 h-3.5 text-[var(--sr-primary)]" />}
            >
              {isHindi ? 'अवतार स्टूडियो' : 'Avatar Studio'}
            </TactileButton>
            <TactileButton
              variant="secondary"
              size="sm"
              onClick={() => onOpenProfileModal('edit')}
              icon={<User className="w-3.5 h-3.5" />}
            >
              {isHindi ? 'प्रोफ़ाइल संपादन' : 'Edit Profile'}
            </TactileButton>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-[var(--sr-line)]">
          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[var(--sr-surface-2)]">
            <div className="flex items-center gap-1 text-[var(--sr-amber)] font-black text-sm">
              <Flame className="w-4 h-4 fill-current" />
              <span>{liveStreak}{isHindi ? ' दिन' : 'd'}</span>
            </div>
            <span className="text-xs font-bold text-[var(--sr-text-muted)] mt-0.5">{isHindi ? 'निरंतरता' : 'Streak'}</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[var(--sr-surface-2)]">
            <div className="flex items-center gap-1 text-[var(--sr-blue)] font-black text-sm">
              <Sparkles className="w-4 h-4 fill-current" />
              <span>{user.xp ?? 0}</span>
            </div>
            <span className="text-xs font-bold text-[var(--sr-text-muted)] mt-0.5">{isHindi ? 'एक्सपी' : 'XP'}</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[var(--sr-surface-2)]">
            <div className="flex items-center gap-1 text-[var(--sr-amber)] font-black text-sm">
              <Coins className="w-4 h-4" />
              <span>{user.coins ?? 0}</span>
            </div>
            <span className="text-xs font-bold text-[var(--sr-text-muted)] mt-0.5">{isHindi ? 'सिक्के' : 'Coins'}</span>
          </div>
        </div>
      </div>

      {/* ── CONTEXTUAL ASK VEER AI (Rule 3) ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] hover:border-[var(--sr-primary)]/50 transition-all flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-2xl bg-[var(--sr-primary-subtle)] border border-[var(--sr-primary)]/30 flex items-center justify-center text-[var(--sr-primary)] shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-[var(--sr-text)]">
                {isHindi ? 'वीर एआई गुरु' : 'Veer AI Mentor'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--sr-primary-subtle)] text-[var(--sr-primary-depth)] dark:text-[var(--sr-primary)] text-xs font-black uppercase shrink-0 border border-[var(--sr-primary)]/30">
                {isHindi ? 'शिक्षक' : 'Tutor'}
              </span>
            </div>
            <p className="text-xs text-[var(--sr-text-muted)] line-clamp-2 mt-0.5">
              {isHindi ? 'परीक्षा संबंधी शंकाएं, सूत्र स्पष्टीकरण या रिवीजन रणनीति पूछें' : 'Ask exam doubts, formula clarifications or revision strategy'}
            </p>
          </div>
        </div>
        <TactileButton
          variant="primary"
          size="sm"
          onClick={() => navigateTo('chat')}
          icon={<Sparkles className="w-3.5 h-3.5" />}
          className="shrink-0"
        >
          {isHindi ? 'शंका पूछें' : 'Ask Doubts'}
        </TactileButton>
      </div>

      {/* ── AUDIO & HAPTIC PREFERENCES (Rule 7: 2 List Rows with Switches) ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] space-y-3">
        <div className="border-b border-[var(--sr-line)] pb-2.5">
          <h3 className="text-sm font-black text-[var(--sr-text)]">
            {isHindi ? 'संवेदी प्रतिक्रिया व ध्वनियां' : 'Interaction Feedback'}
          </h3>
          <p className="text-xs text-[var(--sr-text-muted)] mt-0.5">
            {isHindi ? 'स्पर्श ध्वनि प्रभाव एवं कंपन (हैप्टिक्स) अनुकूलित करें' : 'Customize tactile sound effects and touch haptics'}
          </p>
        </div>

        {/* Sound Row */}
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)] flex items-center justify-center text-[var(--sr-text)] shrink-0">
              {isSoundOn ? <Volume2 className="w-4 h-4 text-[var(--sr-primary)]" /> : <VolumeX className="w-4 h-4 text-[var(--sr-text-subtle)]" />}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs sm:text-sm font-bold text-[var(--sr-text)]">
                {isHindi ? 'ध्वनि प्रभाव' : 'Sound Effects'}
              </span>
              <span className="block text-xs text-[var(--sr-text-muted)] leading-tight mt-0.5">
                {isHindi ? 'उत्तरों एवं क्रियाओं पर ध्वनि प्रतिक्रिया' : 'Audio feedback on answers and actions'}
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isSoundOn}
            onClick={handleToggleSound}
            aria-label="Toggle Sound Effects"
            className={`w-12 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
              isSoundOn ? 'bg-[var(--sr-primary)]' : 'bg-[var(--sr-line-strong)]'
            }`}
          >
            <div
              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                isSoundOn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Haptics Row */}
        <div className="flex items-center justify-between gap-3 py-1 border-t border-[var(--sr-line)] pt-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)] flex items-center justify-center text-[var(--sr-text)] shrink-0">
              <Vibrate className={`w-4 h-4 ${isHapticOn ? 'text-[var(--sr-primary)]' : 'text-[var(--sr-text-subtle)]'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs sm:text-sm font-bold text-[var(--sr-text)]">
                {isHindi ? 'कंपन (हैप्टिक्स)' : 'Vibration Haptics'}
              </span>
              <span className="block text-xs text-[var(--sr-text-muted)] leading-tight mt-0.5">
                {isHindi ? 'बटन दबाने पर स्पर्शनीय सूक्ष्म कंपन' : 'Tactile micro-vibrations on button press'}
              </span>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isHapticOn}
            onClick={handleToggleHaptic}
            aria-label="Toggle Vibration Haptics"
            className={`w-12 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
              isHapticOn ? 'bg-[var(--sr-primary)]' : 'bg-[var(--sr-line-strong)]'
            }`}
          >
            <div
              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                isHapticOn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── 1. FOCUS & TIME MANAGEMENT ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--sr-text-subtle)] px-1">
          {isHindi ? 'एकाग्रता एवं समय प्रबंधन' : 'Focus & Time Management'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigateTo('focus_shield')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] hover:border-[var(--sr-primary)] text-left cursor-pointer transition-all flex items-center gap-3.5 min-h-[56px]"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--sr-blue-subtle)] text-[var(--sr-blue)] flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">
                {isHindi ? 'फोकस शील्ड' : 'Focus Shield'}
              </span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">
                {isHindi ? 'ऐप ध्यान भटकाव अवरोधक' : 'App distraction blocker'}
              </span>
            </div>
          </button>

          <button
            onClick={() => navigateTo('timer')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] hover:border-[var(--sr-primary)] text-left cursor-pointer transition-all flex items-center gap-3.5 min-h-[56px]"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--sr-purple-subtle)] text-[var(--sr-purple)] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">
                {isHindi ? 'फोकस राइड टाइमर' : 'Focus Ride Timer'}
              </span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">
                {isHindi ? 'वैज्ञानिक अध्ययन अंतराल' : 'Scientific study intervals'}
              </span>
            </div>
          </button>

          <button
            onClick={() => navigateTo('tasks')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] hover:border-[var(--sr-primary)] text-left cursor-pointer transition-all flex items-center gap-3.5 min-h-[56px]"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--sr-amber-subtle)] text-[var(--sr-amber)] flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">
                {isHindi ? 'दैनिक योजनाकार' : 'Daily Planner'}
              </span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">
                {isHindi ? 'दैनिक समय-सारणी सूची' : 'Target timetable checklist'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ── 2. PRACTICE & QUESTION VAULTS ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--sr-text-subtle)] px-1">
          {isHindi ? 'अभ्यास एवं प्रश्न संग्रह' : 'Practice & Question Vaults'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => navigateTo('pyq')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] hover:border-[var(--sr-blue)] text-left cursor-pointer transition-all flex items-center justify-between min-h-[56px]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[var(--sr-blue-subtle)] text-[var(--sr-blue)] flex items-center justify-center shrink-0">
                <BookMarked className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-black text-[var(--sr-text)] truncate">
                  {isHindi ? '३५-वर्षीय गत वर्ष प्रश्न' : 'PYQ 35-Year Archive'}
                </span>
                <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">
                  {isHindi ? 'हल किए गए प्रश्नपत्र व विश्लेषण' : 'Past solved papers with analysis'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--sr-text-subtle)] shrink-0" />
          </button>

          <button
            onClick={() => navigateTo('question_bank')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] hover:border-[var(--sr-primary)] text-left cursor-pointer transition-all flex items-center justify-between min-h-[56px]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-black text-[var(--sr-text)] truncate">
                  {isHindi ? 'विषयवार प्रश्न बैंक' : 'Topic Question Bank'}
                </span>
                <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">
                  {isHindi ? '२,४३,०००+ वर्गीकृत बहुविकल्पीय प्रश्न' : '243,000+ categorized MCQs'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--sr-text-subtle)] shrink-0" />
          </button>

          <button
            onClick={() => navigateTo('cbt_exam')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] hover:border-[var(--sr-purple)] text-left cursor-pointer transition-all flex items-center justify-between min-h-[56px]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[var(--sr-purple-subtle)] text-[var(--sr-purple)] flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-black text-[var(--sr-text)] truncate">
                  {isHindi ? 'सीबीटी मॉक सिमुलेटर' : 'CBT Mock Simulator'}
                </span>
                <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">
                  {isHindi ? 'वास्तविक परीक्षा कंप्यूटर इंटरफ़ेस' : 'Real NTA/SSC exam interface'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--sr-text-subtle)] shrink-0" />
          </button>

          <button
            onClick={() => navigateTo('flashcards')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] hover:border-[var(--sr-amber)] text-left cursor-pointer transition-all flex items-center justify-between min-h-[56px]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[var(--sr-amber-subtle)] text-[var(--sr-amber)] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-black text-[var(--sr-text)] truncate">
                  {isHindi ? 'स्मरण फ्लैशकार्ड्स' : 'Spaced Flashcards'}
                </span>
                <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">
                  {isHindi ? 'सक्रिय स्मरण सूत्र व मुख्य बिंदु' : 'Active recall formula decks'}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--sr-text-subtle)] shrink-0" />
          </button>
        </div>
      </div>

      {/* ── 3. DIGITAL LIBRARY & MEDIA ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--sr-text-subtle)] px-1">
          {isHindi ? 'डिजिटल पुस्तकालय एवं मीडिया' : 'Digital Library & Media'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigateTo('library')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <FileText className="w-5 h-5 text-[var(--sr-blue)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">
                {isHindi ? 'एनसीईआरटी पुस्तकालय' : 'NCERT Library'}
              </span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">
                {isHindi ? 'पाठ्यपुस्तकें व नोट्स' : 'Textbooks & Notes'}
              </span>
            </div>
          </button>

          <button
            onClick={() => navigateTo('podcasts')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <Mic className="w-5 h-5 text-[var(--sr-purple)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">
                {isHindi ? 'टॉपर पॉडकास्ट' : 'Topper Podcasts'}
              </span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">
                {isHindi ? 'रणनीति ऑडियो चर्चा' : 'Audio Strategy'}
              </span>
            </div>
          </button>

          <button
            onClick={() => navigateTo('blog')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <GraduationCap className="w-5 h-5 text-[var(--sr-primary)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">
                {isHindi ? 'संपादकीय एवं लेख' : 'Editorial & Blog'}
              </span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">
                {isHindi ? 'तैयारी रणनीति लेख' : 'Strategy Articles'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ── 4. COMMUNITY & SOCIAL ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--sr-text-subtle)] px-1">
          {isHindi ? 'समुदाय एवं मार्गदर्शन' : 'Community & Mentorship'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigateTo('study_buddy')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <Users className="w-5 h-5 text-[var(--sr-primary)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">
                {isHindi ? 'अध्ययन साथी' : 'Study Buddy'}
              </span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">
                {isHindi ? 'जवाबदेही एवं सहपाठी' : 'Accountability partner'}
              </span>
            </div>
          </button>

          <button
            onClick={() => navigateTo('community')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <MessageSquare className="w-5 h-5 text-[var(--sr-blue)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">
                {isHindi ? 'सामुदायिक फ़ीड' : 'Community Feed'}
              </span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">
                {isHindi ? 'सहपाठी चर्चा व समाधान' : 'Peer discussion'}
              </span>
            </div>
          </button>

          <button
            onClick={() => navigateTo('collaboration')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <Briefcase className="w-5 h-5 text-[var(--sr-amber)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">
                {isHindi ? 'ब्रांड एंबेसडर' : 'Ambassadors'}
              </span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">
                {isHindi ? 'सहयोग व पुरस्कार' : 'Collaboration perks'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ── 5. UTILITIES, REWARDS & ADMIN ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--sr-text-subtle)] px-1">
          {isHindi ? 'सुविधाएं एवं पुरस्कार' : 'Utilities & Rewards'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => navigateTo('reward_milestones')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <Trophy className="w-5 h-5 text-[var(--sr-amber)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">
                {isHindi ? 'उपलब्धियां व पुरस्कार' : 'Rewards & Milestones'}
              </span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">
                {isHindi ? 'ट्रॉफी एवं स्ट्रीक सुरक्षा प्राप्त करें' : 'Earn trophies & streak freezes'}
              </span>
            </div>
          </button>

          <button
            onClick={() => navigateTo('wallpaper')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <Smartphone className="w-5 h-5 text-[var(--sr-blue)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">
                {isHindi ? 'प्रेरणादायक वॉलपेपर' : 'Habit Wallpaper'}
              </span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">
                {isHindi ? 'लॉकस्क्रीन उलटी गिनती कला' : 'Lockscreen countdown art'}
              </span>
            </div>
          </button>

          <button
            onClick={() => navigateTo('eligibility')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <ShieldCheck className="w-5 h-5 text-[var(--sr-primary)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">
                {isHindi ? 'पात्रता जांचकर्ता' : 'Eligibility Checker'}
              </span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">
                {isHindi ? 'आयु सीमा व परीक्षा प्रयास' : 'Age limits & attempts'}
              </span>
            </div>
          </button>

          <button
            onClick={() => navigateTo('premium')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <Crown className="w-5 h-5 text-[var(--sr-purple)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">
                {isHindi ? 'स्टडीराइड प्रो पास' : 'StudyRide PRO Pass'}
              </span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">
                {isHindi ? 'असीमित एआई व संपूर्ण मॉक' : 'Unlimited AI & full mocks'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ── 6. ADMIN & EDUCATOR ACCESS (ROLE GATED) ── */}
      {(user.role === 'ADMIN' || user.role === 'DEVELOPER' || isAdminUnlocked) && (
        <div className="p-4 rounded-2xl bg-[var(--sr-coral-subtle)] border-2 border-[var(--sr-coral)]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-[var(--sr-coral)]" />
            <div>
              <span className="block text-sm font-black text-[var(--sr-text)]">
                {isHindi ? 'व्यवस्थापक कंसोल' : 'Administrator Console'}
              </span>
              <span className="block text-xs text-[var(--sr-text-muted)]">
                {isHindi ? 'सत्यापित व्यवस्थापक खाता सक्रिय' : 'Verified server role active'}
              </span>
            </div>
          </div>
          <TactileButton variant="danger" size="sm" onClick={() => navigateTo('admin')}>
            {isHindi ? 'कंसोल खोलें' : 'Open Console'}
          </TactileButton>
        </div>
      )}

      {/* ── 7. ABOUT & TELEMETRY SECTION (Clean Home for Version & Build Tags) ── */}
      <div className="p-5 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-[var(--sr-text)]">
                {isHindi ? 'स्टडीराइड शैक्षणिक मंच' : 'StudyRide Educational Platform'}
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] text-xs font-black">
                v{CANONICAL_APP_RELEASE.version}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--sr-blue-subtle)] text-[var(--sr-blue)] text-xs font-black">
                {isHindi ? 'बिल्ड ' : 'Build '}{CANONICAL_APP_RELEASE.versionCode}
              </span>
            </div>
            <p className="text-xs text-[var(--sr-text-muted)] mt-0.5">
              {isHindi ? 'यूपीएससी, नीट, जेईई, एसएससी व राज्य सेवा अभ्यर्थियों के लिए निर्मित' : 'Engineered for UPSC, NEET, JEE, SSC & State PSC Aspirants'}
            </p>
          </div>

          <TactileButton
            variant="secondary"
            size="sm"
            onClick={handleCheckUpdate}
            disabled={checkStatus === 'checking'}
            icon={<RotateCcw className={`w-3.5 h-3.5 ${checkStatus === 'checking' ? 'animate-spin' : ''}`} />}
          >
            {checkStatus === 'checking'
              ? (isHindi ? 'जांच जारी...' : 'Checking...')
              : checkStatus === 'done'
              ? (isHindi ? 'अद्यतन है ✓' : 'Up to date ✓')
              : (isHindi ? 'अपडेट जांचें' : 'Check Updates')}
          </TactileButton>
        </div>

        {/* Guest Demo Notice if Active */}
        {user.isGuest && (
          <div className="p-3 rounded-2xl bg-[var(--sr-amber-subtle)] border border-[var(--sr-amber)]/30 text-xs text-[var(--sr-amber)] font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              {isHindi
                ? 'वर्तमान में अतिथि सत्र सक्रिय है। सभी उपकरणों में प्रगति सहेजने हेतु निःशुल्क खाता बनाएं।'
                : 'Currently using Guest Session. Create a free account to sync progress permanently across devices.'}
            </span>
          </div>
        )}
      </div>

      {/* ── 8. ACCOUNT SESSION & LOGOUT ── */}
      <div className="p-5 rounded-3xl bg-[var(--sr-surface)] border-2 border-rose-500/30 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-black text-[var(--sr-text)]">
                {isHindi ? 'खाता एवं सक्रिय सत्र' : 'Account & Session'}
              </h4>
              <p className="text-xs text-[var(--sr-text-muted)] truncate max-w-[220px] sm:max-w-sm">
                {isHindi ? 'सक्रिय खाता: ' : 'Signed in as '}
                <span className="font-bold text-[var(--sr-text)]">
                  {user.email || user.name || (isHindi ? 'परीक्षार्थी' : 'Aspirant')}
                </span>
              </p>
            </div>
          </div>

          {onLogout && (
            <TactileButton
              variant="danger"
              size="md"
              onClick={() => {
                const confirmMsg = isHindi
                  ? 'क्या आप निश्चित रूप से स्टडीराइड से लॉग आउट करना चाहते हैं?'
                  : 'Are you sure you want to log out of StudyRide?';
                if (window.confirm(confirmMsg)) {
                  onLogout();
                }
              }}
              icon={<LogOut className="w-4 h-4" />}
            >
              {isHindi ? 'लॉग आउट' : 'Log Out'}
            </TactileButton>
          )}
        </div>
      </div>
    </div>
  );
};
