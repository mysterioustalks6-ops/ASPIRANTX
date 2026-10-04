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

  const currentExamId = selectedExam || user?.exam || 'NEET_UG';
  const currentExamLabel = useMemo(() => {
    const found = EXAM_LIST.find(e => e.id === currentExamId);
    if (found) return found.label.split(/[–—]/)[0].trim();
    return currentExamId.replace(/_/g, ' ');
  }, [currentExamId]);

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
      {/* ── 1. LEFT: EXAM PICKER CHIP ── */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={handleOpenExamPicker}
          aria-label={`Current target exam: ${currentExamLabel}. Tap to change.`}
          className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-surface-3)] border-2 border-[var(--sr-line)] text-left cursor-pointer transition-transform active:scale-95 min-h-[44px] max-w-[210px] sm:max-w-xs"
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-xs font-black text-[var(--sr-text)] truncate">
              {currentExamLabel}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-[var(--sr-text-subtle)] shrink-0" />
        </button>
      </div>

      {/* ── 2. CENTER: STREAK FLAME ── */}
      <div 
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[var(--sr-amber-subtle)] border-2 border-[var(--sr-amber)]/30 text-xs font-black text-[var(--sr-amber)] shrink-0 min-h-[40px]"
        title={`${user?.streakDays ?? 1} Days Active Study Streak`}
      >
        <Flame className="w-4 h-4 fill-current animate-pulse text-[var(--sr-amber)]" />
        <span>{user?.streakDays ?? 1}d</span>
      </div>

      {/* ── 3. RIGHT: CANDIDATE AVATAR / PROFILE LAUNCHER ── */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleOpenMe}
          aria-label="Candidate Profile and Tools"
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
