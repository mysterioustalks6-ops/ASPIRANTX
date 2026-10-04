import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, X, GraduationCap, CheckCircle2, ChevronRight, Sparkles, Plus, Compass
} from 'lucide-react';
import { EXAM_LIST, ExamOption } from '../lib/examList';
import { getCustomExamsFromStorage, CustomExamConfig } from '../lib/customExamStore';
import { soundFx } from '../lib/soundEffects';

export interface ExamSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedExam: string;
  onExamChange: (examId: string) => void;
  onOpenCustomModal?: () => void;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Exams (48+)' },
  { id: 'ENGINEERING', label: 'Engineering' },
  { id: 'MEDICAL', label: 'Medical' },
  { id: 'CIVIL_SERVICES', label: 'Civil Services' },
  { id: 'SSC_RAILWAYS', label: 'SSC & Railways' },
  { id: 'DEFENCE', label: 'Defence' },
  { id: 'BANKING', label: 'Banking' },
  { id: 'STATE_EXAMS', label: 'State PSCs' },
];

export const ExamSelectModal: React.FC<ExamSelectModalProps> = ({
  isOpen,
  onClose,
  selectedExam,
  onExamChange,
  onOpenCustomModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto focus on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch custom exams
  const customExams: CustomExamConfig[] = useMemo(() => {
    if (!isOpen) return [];
    return getCustomExamsFromStorage();
  }, [isOpen]);

  const getExamCategory = (ex: ExamOption): string => {
    const id = ex.id.toUpperCase();
    if (id.includes('JEE') || id.includes('GATE') || id.includes('BITSAT') || id.includes('AE_') || id.includes('JE_')) return 'ENGINEERING';
    if (id.includes('NEET') || id.includes('AIIMS') || id.includes('NORCET')) return 'MEDICAL';
    if (id.includes('UPSC') || id.includes('CIVIL')) return 'CIVIL_SERVICES';
    if (id.includes('NDA') || id.includes('CDS') || id.includes('AFCAT') || id.includes('CAPF')) return 'DEFENCE';
    if (id.includes('SSC') || id.includes('RRB') || id.includes('ALP') || id.includes('NTPC')) return 'SSC_RAILWAYS';
    if (id.includes('IBPS') || id.includes('SBI') || id.includes('RBI')) return 'BANKING';
    if (id.includes('PSC') || id.includes('BPSC') || id.includes('UPPSC') || id.includes('MPPSC') || id.includes('POLICE')) return 'STATE_EXAMS';
    return 'OTHER';
  };

  const filteredExams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return EXAM_LIST.filter(ex => {
      const matchSearch = !q || ex.label.toLowerCase().includes(q) || ex.id.toLowerCase().includes(q);
      if (!matchSearch) return false;
      if (selectedCategory === 'ALL') return true;
      return getExamCategory(ex) === selectedCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleSelectExam = (examId: string) => {
    soundFx.playTap();
    soundFx.triggerHaptic(15);
    onExamChange(examId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 text-left">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet Content */}
      <div className="relative w-full max-w-xl max-h-[85vh] sm:max-h-[78vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] shadow-2xl z-10 overflow-hidden">
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 rounded-full bg-[var(--sr-line-strong)] mx-auto mt-3 mb-1 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-[var(--sr-line)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--sr-blue-subtle)] text-[var(--sr-blue)] flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[var(--sr-text)] tracking-tight">
                Select Target Exam
              </h3>
              <p className="text-xs text-[var(--sr-text-muted)] font-medium">
                48+ National & State Exams Available
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sheet"
            className="w-8 h-8 rounded-full bg-[var(--sr-surface-2)] text-[var(--sr-text-muted)] hover:text-[var(--sr-text)] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2.5 border-b border-[var(--sr-line)] bg-[var(--sr-surface)]">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)]">
            <Search className="w-4 h-4 text-[var(--sr-text-subtle)] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exam (NEET, JEE, UPSC, SSC CGL...)"
              className="w-full bg-transparent text-[var(--sr-text)] placeholder-[var(--sr-text-subtle)] text-xs font-bold focus:outline-none min-h-[36px]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[var(--sr-text-muted)]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Category Horizontal Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto no-scrollbar border-b border-[var(--sr-line)] bg-[var(--sr-surface)] shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundFx.playTap();
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[var(--sr-primary)] text-[var(--sr-on-primary)] shadow-sm'
                  : 'bg-[var(--sr-surface-2)] text-[var(--sr-text-muted)] hover:text-[var(--sr-text)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Exam List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredExams.map((ex) => {
            const isSelected = ex.id === selectedExam;
            return (
              <button
                key={ex.id}
                onClick={() => handleSelectExam(ex.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer min-h-[52px] select-none ${
                  isSelected
                    ? 'bg-[var(--sr-primary-subtle)] border-[var(--sr-primary)] text-[var(--sr-text)]'
                    : 'bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-[var(--sr-line)] text-[var(--sr-text)]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                    isSelected
                      ? 'bg-[var(--sr-primary)] text-[var(--sr-on-primary)]'
                      : 'bg-[var(--sr-surface-2)] text-[var(--sr-text-subtle)]'
                  }`}>
                    {ex.id.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-sm font-bold text-[var(--sr-text)] truncate">
                      {ex.label}
                    </span>
                    <span className="block text-[11px] font-bold text-[var(--sr-text-subtle)] uppercase tracking-wider">
                      {ex.id.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-[var(--sr-primary)] shrink-0 ml-2" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[var(--sr-text-subtle)] shrink-0 ml-2" />
                )}
              </button>
            );
          })}

          {filteredExams.length === 0 && (
            <div className="py-12 text-center text-xs text-[var(--sr-text-muted)] font-medium">
              No exams found matching "{searchQuery}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
