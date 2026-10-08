import React, { useState, useMemo } from 'react';
import { ActiveTab, UserProfile } from '../types';
import { EXAM_LIST } from '../lib/examList';
import { 
  Flame, 
  Search, 
  ChevronDown,
  User,
  GraduationCap
} from 'lucide-react';
import { resolveUserAvatar } from '../lib/avatarStorage';
import { ExamSelectModal } from './ExamSelectModal';
import { soundFx } from '../lib/soundEffects';
import { LanguageToggle } from './LanguageToggle';
import { useLanguage } from '../lib/i18n/LanguageContext';

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
  onOpenSearch, 
  onNavigate, 
}) => {
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const { t, currentLanguage, isHindi: ctxIsHindi } = useLanguage();
  const isHindi = Boolean(ctxIsHindi || currentLanguage === 'hi');

  const currentExamId = selectedExam || user?.exam || 'NEET_UG';
  const currentExamLabel = useMemo(() => {
    const found = EXAM_LIST.find(e => e.id === currentExamId);
    if (found) return found.label.split(/[–—]/)[0].trim();
    return currentExamId.replace(/_/g, ' ');
  }, [currentExamId]);

  const shortExamLabel = useMemo(() => {
    if (isHindi) {
      if (currentExamLabel.includes('NEET')) return 'नीट (UG)';
      if (currentExamLabel.includes('JEE Main')) return 'जेईई मेन';
      if (currentExamLabel.includes('JEE Adv')) return 'जेईई एडवांस';
      if (currentExamLabel.includes('UPSC')) return 'यूपीएससी';
      if (currentExamLabel.includes('GATE')) return 'गेट';
      if (currentExamLabel.includes('CAT')) return 'कैट';
      if (currentExamLabel.includes('SSC')) return 'एसएससी';
      if (currentExamLabel.includes('NDA')) return 'एनडीए';
    }
    if (currentExamLabel.includes('NEET')) return 'NEET (UG)';
    if (currentExamLabel.includes('JEE Main')) return 'JEE Main';
    if (currentExamLabel.includes('JEE Adv')) return 'JEE Adv';
    if (currentExamLabel.includes('UPSC')) return 'UPSC';
    if (currentExamLabel.includes('GATE')) return 'GATE';
    if (currentExamLabel.includes('CAT')) return 'CAT';
    if (currentExamLabel.length > 12) return currentExamLabel.slice(0, 10) + '…';
    return currentExamLabel;
  }, [currentExamLabel, isHindi]);

  const handleOpenExamPicker = () => {
    soundFx.playTap();
    soundFx.triggerHaptic(12);
    setIsExamModalOpen(true);
  };

  const handleOpenSearch = () => {
    soundFx.playTap();
    soundFx.triggerHaptic(12);
    onOpenSearch?.();
  };

  const handleOpenMe = () => {
    soundFx.playTap();
    soundFx.triggerHaptic(12);
    if (onNavigate) {
      onNavigate('more_hub');
    } else {
      onOpenProfileModal?.();
    }
  };

  return (
    <header className="w-full bg-[var(--sr-surface)] border-b-2 border-[var(--sr-line-strong)] px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-30 pt-safe select-none shadow-sm">
      {/* ── 1. LEFT: EXAM PICKER CHIP (NEVER COLLAPSES TO SINGLE LETTER) ── */}
      <div className="flex items-center gap-2 min-w-[110px] flex-1 max-w-[200px] sm:max-w-xs shrink-0">
        <button
          onClick={handleOpenExamPicker}
          aria-label={`Current target exam: ${currentExamLabel}. Tap to change.`}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-surface-3)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-transform active:scale-95 min-h-[40px] w-full min-w-0"
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-xs font-black text-[var(--sr-text)] truncate" title={currentExamLabel}>
              {shortExamLabel}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-[var(--sr-text-subtle)] shrink-0" />
        </button>
      </div>

      {/* ── 2. CENTER: STREAK FLAME (NEVER TRUNCATED OR OVERLAPPED) ── */}
      <div 
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[var(--sr-amber-subtle)] border-2 border-[var(--sr-amber)]/30 text-xs font-black text-[var(--sr-amber)] shrink-0 min-h-[40px] whitespace-nowrap"
        title={isHindi ? `${user?.streakDays ?? 0} दिन की निरंतरता` : `${user?.streakDays ?? 0} Days Active Study Streak`}
      >
        <Flame className="w-4 h-4 fill-current animate-pulse text-[var(--sr-amber)]" />
        <span>{user?.streakDays ?? 0}{isHindi ? ' दिन' : 'd'}</span>
      </div>

      {/* ── 3. RIGHT: PERSISTENT LANGUAGE TOGGLE & CANDIDATE AVATAR ── */}
      <div className="flex items-center gap-2 shrink-0">
        <LanguageToggle />
        <button
          onClick={handleOpenMe}
          data-testid="header-profile-btn"
          aria-label={t('header.candidateProfile', 'Candidate Profile and Tools')}
          className="w-9 h-9 rounded-2xl bg-[var(--sr-primary-subtle)] border-2 border-[var(--sr-primary)] text-[var(--sr-primary)] font-black text-xs flex items-center justify-center cursor-pointer transition-transform active:scale-95 shrink-0 overflow-hidden shadow-sm"
        >
          {user?.name ? (
            user.name[0].toUpperCase()
          ) : (
            <User className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Exam Picker Sheet Modal */}
      <ExamSelectModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        selectedExam={currentExamId}
        onExamChange={(val) => {
          if (onExamChange) onExamChange(val);
        }}
        onOpenCustomModal={onOpenProfileModal}
      />
    </header>
  );
};
