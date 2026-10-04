import React, { useState } from 'react';
import { 
  User, Flame, Coins, Clock, Smartphone, Award, Users, MessageSquare, 
  Sparkles, Gift, Share2, Crown, Palette, Bell, HelpCircle, ShieldCheck, 
  FileText, ChevronRight, GraduationCap, Briefcase, Calendar, Shield, 
  Trophy, Download, RotateCcw, Volume2, VolumeX, Vibrate, CheckCircle2,
  BookOpen, BookMarked, BarChart3, Mic, Settings
} from 'lucide-react';
import { UserProfile, ExamType, ActiveTab } from '../types';
import { CANONICAL_APP_RELEASE } from '../config/appRelease';
import { soundFx } from '../lib/soundEffects';
import { TactileButton } from '../design-system/TactileButton';
import { VeerMascot } from '../design-system/VeerMascot';

interface MoreHubProps {
  user: UserProfile;
  selectedExam: ExamType;
  onNavigate: (tab: ActiveTab) => void;
  onOpenProfileModal: () => void;
  onOpenReferralModal: () => void;
  onOpenWorkspaceCustomizer: () => void;
  onOpenReminderSettings: () => void;
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
  isAdminUnlocked = false
}) => {
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
    if (xp <= 0) return { name: 'Unranked', icon: '🌱', badgeClass: 'bg-[var(--sr-surface-2)] text-[var(--sr-text-muted)] border-[var(--sr-line)]' };
    if (xp < 500) return { name: 'Bronze League', icon: '🥉', badgeClass: 'bg-[var(--sr-amber-subtle)] text-[var(--sr-amber)] border-[var(--sr-amber)]/30' };
    if (xp < 1500) return { name: 'Silver League', icon: '🥈', badgeClass: 'bg-[var(--sr-blue-subtle)] text-[var(--sr-blue)] border-[var(--sr-blue)]/30' };
    if (xp < 3000) return { name: 'Gold League', icon: '🥇', badgeClass: 'bg-[var(--sr-amber-subtle)] text-[var(--sr-amber)] border-[var(--sr-amber)]/30' };
    if (xp < 6000) return { name: 'Platinum League', icon: '🏆', badgeClass: 'bg-[var(--sr-purple-subtle)] text-[var(--sr-purple)] border-[var(--sr-purple)]/30' };
    return { name: 'Diamond League', icon: '💎', badgeClass: 'bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] border-[var(--sr-primary)]/30' };
  };
  const league = getLeagueInfo(userXp);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-28 px-3 sm:px-4 text-[var(--sr-text)]">
      {/* ── PROFILE & CANDIDATE SUMMARY CARD ── */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--sr-primary-subtle)] border-2 border-[var(--sr-primary)] flex items-center justify-center font-black text-[var(--sr-primary)] text-xl sm:text-2xl shrink-0">
                {user.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[var(--sr-primary)] text-[var(--sr-on-primary)] border-2 border-[var(--sr-surface)] flex items-center justify-center text-[10px] sm:text-xs font-black">
                ✓
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-[var(--sr-text)] tracking-tight truncate">
                  {user.name || 'Aspirant'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[var(--sr-blue-subtle)] text-[var(--sr-blue)] text-xs font-black border border-[var(--sr-blue)]/30 shrink-0">
                  LVL {user.level || 1}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-black border shrink-0 ${league.badgeClass}`}>
                  {league.icon} {league.name}
                </span>
              </div>
              <p className="text-xs font-bold text-[var(--sr-text-muted)] mt-1 truncate">
                Target: {selectedExam.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <TactileButton
              variant="secondary"
              size="sm"
              onClick={onOpenProfileModal}
              icon={<User className="w-3.5 h-3.5" />}
            >
              Edit Profile
            </TactileButton>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-[var(--sr-line)]">
          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[var(--sr-surface-2)]">
            <div className="flex items-center gap-1 text-[var(--sr-amber)] font-black text-sm">
              <Flame className="w-4 h-4 fill-current" />
              <span>{user.streakDays ?? 1}d</span>
            </div>
            <span className="text-xs font-bold text-[var(--sr-text-muted)] mt-0.5">Streak</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[var(--sr-surface-2)]">
            <div className="flex items-center gap-1 text-[var(--sr-blue)] font-black text-sm">
              <Sparkles className="w-4 h-4 fill-current" />
              <span>{user.xp ?? 0}</span>
            </div>
            <span className="text-xs font-bold text-[var(--sr-text-muted)] mt-0.5">XP</span>
          </div>

          <div className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-[var(--sr-surface-2)]">
            <div className="flex items-center gap-1 text-[var(--sr-amber)] font-black text-sm">
              <Coins className="w-4 h-4" />
              <span>{user.coins ?? 0}</span>
            </div>
            <span className="text-xs font-bold text-[var(--sr-text-muted)] mt-0.5">Coins</span>
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
              <h3 className="text-sm sm:text-base font-black text-[var(--sr-text)]">Veer AI Mentor</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-[var(--sr-primary-subtle)] text-[var(--sr-primary-depth)] dark:text-[var(--sr-primary)] text-xs font-black uppercase shrink-0 border border-[var(--sr-primary)]/30">
                Tutor
              </span>
            </div>
            <p className="text-xs text-[var(--sr-text-muted)] line-clamp-2 mt-0.5">
              Ask exam doubts, formula clarifications or revision strategy
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
          Ask Doubts
        </TactileButton>
      </div>

      {/* ── AUDIO & HAPTIC PREFERENCES (Rule 7: 2 List Rows with Switches) ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] space-y-3">
        <div className="border-b border-[var(--sr-line)] pb-2.5">
          <h3 className="text-sm font-black text-[var(--sr-text)]">Interaction Feedback</h3>
          <p className="text-xs text-[var(--sr-text-muted)] mt-0.5">Customize tactile sound effects and touch haptics</p>
        </div>

        {/* Sound Row */}
        <div className="flex items-center justify-between gap-3 py-1">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)] flex items-center justify-center text-[var(--sr-text)] shrink-0">
              {isSoundOn ? <Volume2 className="w-4 h-4 text-[var(--sr-primary)]" /> : <VolumeX className="w-4 h-4 text-[var(--sr-text-subtle)]" />}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs sm:text-sm font-bold text-[var(--sr-text)]">Sound Effects</span>
              <span className="block text-xs text-[var(--sr-text-muted)] leading-tight mt-0.5">Audio feedback on answers and actions</span>
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
              <span className="block text-xs sm:text-sm font-bold text-[var(--sr-text)]">Vibration Haptics</span>
              <span className="block text-xs text-[var(--sr-text-muted)] leading-tight mt-0.5">Tactile micro-vibrations on button press</span>
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
          Focus & Time Management
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
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">Focus Shield</span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">App distraction blocker</span>
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
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">Focus Ride Timer</span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">Scientific study intervals</span>
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
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">Daily Planner</span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">Target timetable checklist</span>
            </div>
          </button>
        </div>
      </div>

      {/* ── 2. PRACTICE & QUESTION VAULTS ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--sr-text-subtle)] px-1">
          Practice & Question Vaults
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
                <span className="block text-sm font-black text-[var(--sr-text)] truncate">PYQ 35-Year Archive</span>
                <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">Past solved papers with analysis</span>
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
                <span className="block text-sm font-black text-[var(--sr-text)] truncate">Topic Question Bank</span>
                <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">243,000+ categorized MCQs</span>
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
                <span className="block text-sm font-black text-[var(--sr-text)] truncate">CBT Mock Simulator</span>
                <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">Real NTA/SSC exam interface</span>
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
                <span className="block text-sm font-black text-[var(--sr-text)] truncate">Spaced Flashcards</span>
                <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">Active recall formula decks</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--sr-text-subtle)] shrink-0" />
          </button>
        </div>
      </div>

      {/* ── 3. DIGITAL LIBRARY & MEDIA ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--sr-text-subtle)] px-1">
          Digital Library & Media
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigateTo('library')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <FileText className="w-5 h-5 text-[var(--sr-blue)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">NCERT Library</span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">Textbooks & Notes</span>
            </div>
          </button>

          <button
            onClick={() => navigateTo('podcasts')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <Mic className="w-5 h-5 text-[var(--sr-purple)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">Topper Podcasts</span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">Audio Strategy</span>
            </div>
          </button>

          <button
            onClick={() => navigateTo('blog')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <GraduationCap className="w-5 h-5 text-[var(--sr-primary)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">Editorial & Blog</span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">Strategy Articles</span>
            </div>
          </button>
        </div>
      </div>

      {/* ── 4. COMMUNITY & SOCIAL ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--sr-text-subtle)] px-1">
          Community & Mentorship
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigateTo('study_buddy')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <Users className="w-5 h-5 text-[var(--sr-primary)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">Study Buddy</span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">Accountability partner</span>
            </div>
          </button>

          <button
            onClick={() => navigateTo('community')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <MessageSquare className="w-5 h-5 text-[var(--sr-blue)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">Community Feed</span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">Peer discussion</span>
            </div>
          </button>

          <button
            onClick={() => navigateTo('collaboration')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <Briefcase className="w-5 h-5 text-[var(--sr-amber)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">Ambassadors</span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">Collaboration perks</span>
            </div>
          </button>
        </div>
      </div>

      {/* ── 5. UTILITIES, REWARDS & ADMIN ── */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-[var(--sr-text-subtle)] px-1">
          Utilities & Rewards
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => navigateTo('reward_milestones')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <Trophy className="w-5 h-5 text-[var(--sr-amber)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">Rewards & Milestones</span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">Earn trophies & streak freezes</span>
            </div>
          </button>

          <button
            onClick={() => navigateTo('wallpaper')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <Smartphone className="w-5 h-5 text-[var(--sr-blue)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">Habit Wallpaper</span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">Lockscreen countdown art</span>
            </div>
          </button>

          <button
            onClick={() => navigateTo('eligibility')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <ShieldCheck className="w-5 h-5 text-[var(--sr-primary)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">Eligibility Checker</span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">Age limits & attempts</span>
            </div>
          </button>

          <button
            onClick={() => navigateTo('premium')}
            className="p-4 rounded-2xl bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-all flex items-center gap-3 min-h-[56px]"
          >
            <Crown className="w-5 h-5 text-[var(--sr-purple)] shrink-0" />
            <div className="min-w-0">
              <span className="block text-sm font-black text-[var(--sr-text)] truncate">StudyRide PRO Pass</span>
              <span className="block text-xs font-medium text-[var(--sr-text-muted)] truncate">Unlimited AI & full mocks</span>
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
              <span className="block text-sm font-black text-[var(--sr-text)]">Administrator Console</span>
              <span className="block text-xs text-[var(--sr-text-muted)]">Verified server role active</span>
            </div>
          </div>
          <TactileButton variant="danger" size="sm" onClick={() => navigateTo('admin')}>
            Open Console
          </TactileButton>
        </div>
      )}

      {/* ── 7. ABOUT & TELEMETRY SECTION (Clean Home for Version & Build Tags) ── */}
      <div className="p-5 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-[var(--sr-text)]">StudyRide Educational Platform</h4>
              <span className="px-2 py-0.5 rounded-full bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] text-xs font-black">
                v{CANONICAL_APP_RELEASE.version}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--sr-blue-subtle)] text-[var(--sr-blue)] text-xs font-black">
                Build {CANONICAL_APP_RELEASE.versionCode}
              </span>
            </div>
            <p className="text-xs text-[var(--sr-text-muted)] mt-0.5">
              Engineered for UPSC, NEET, JEE, SSC & State PSC Aspirants
            </p>
          </div>

          <TactileButton
            variant="secondary"
            size="sm"
            onClick={handleCheckUpdate}
            disabled={checkStatus === 'checking'}
            icon={<RotateCcw className={`w-3.5 h-3.5 ${checkStatus === 'checking' ? 'animate-spin' : ''}`} />}
          >
            {checkStatus === 'checking' ? 'Checking...' : checkStatus === 'done' ? 'Up to date ✓' : 'Check Updates'}
          </TactileButton>
        </div>

        {/* Guest Demo Notice if Active */}
        {user.isGuest && (
          <div className="p-3 rounded-2xl bg-[var(--sr-amber-subtle)] border border-[var(--sr-amber)]/30 text-xs text-[var(--sr-amber)] font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Currently using Guest Session. Create a free account to sync progress permanently across devices.</span>
          </div>
        )}
      </div>
    </div>
  );
};
