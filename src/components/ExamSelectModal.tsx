import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, X, GraduationCap, CheckCircle2, ChevronRight, Sparkles, Plus, Compass
} from 'lucide-react';
import { EXAM_LIST, ExamOption } from '../lib/examList';
import { getCustomExamsFromStorage, CustomExamConfig } from '../lib/customExamStore';
import { soundFx } from '../lib/soundEffects';
import { useLanguage } from '../lib/i18n/LanguageContext';

export interface ExamSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedExam: string;
  onExamChange: (examId: string) => void;
  onOpenCustomModal?: () => void;
}

const CATEGORIES = [
  { id: 'ALL', labelEn: 'All Exams (48+)', labelHi: 'सभी परीक्षाएं (४८+)' },
  { id: 'ENGINEERING', labelEn: 'Engineering', labelHi: 'इंजीनियरिंग' },
  { id: 'MEDICAL', labelEn: 'Medical', labelHi: 'चिकित्सा (मेडिकल)' },
  { id: 'CIVIL_SERVICES', labelEn: 'Civil Services', labelHi: 'सिविल सेवा' },
  { id: 'SSC_RAILWAYS', labelEn: 'SSC & Railways', labelHi: 'एसएससी एवं रेलवे' },
  { id: 'DEFENCE', labelEn: 'Defence', labelHi: 'रक्षा सेवाएं' },
  { id: 'BANKING', labelEn: 'Banking', labelHi: 'बैंकिंग' },
  { id: 'STATE_EXAMS', labelEn: 'State PSCs', labelHi: 'राज्य लोक सेवा आयोग' },
];

const EXAM_LABEL_HI: Record<string, { shortName: string; fullName: string }> = {
  'JEE_MAIN': { shortName: 'जेईई मेन', fullName: 'संयुक्त प्रवेश परीक्षा (मुख्य)' },
  'JEE_ADVANCED': { shortName: 'जेईई एडवांस्ड', fullName: 'आईआईटी संयुक्त प्रवेश परीक्षा' },
  'NEET_UG': { shortName: 'नीट (UG)', fullName: 'राष्ट्रीय पात्रता सह प्रवेश परीक्षा (चिकित्सा)' },
  'UPSC_CSE': { shortName: 'यूपीएससी सिविल सेवा', fullName: 'संघ लोक सेवा आयोग सिविल सेवा परीक्षा' },
  'GATE': { shortName: 'गेट', fullName: 'इंजीनियरिंग स्नातक अभिरुचि परीक्षा' },
  'NDA_NA': { shortName: 'एनडीए एवं एनए', fullName: 'राष्ट्रीय रक्षा अकादमी परीक्षा' },
  'CDS': { shortName: 'सीडीएस', fullName: 'संयुक्त रक्षा सेवा परीक्षा' },
  'SSC_CGL': { shortName: 'एसएससी सीजीएल', fullName: 'कर्मचारी चयन आयोग संयुक्त स्नातक स्तरीय परीक्षा' },
  'SSC_CHSL': { shortName: 'एसएससी सीएचएसएल', fullName: 'कर्मचारी चयन आयोग उच्चतर माध्यमिक परीक्षा' },
  'SSC_MTS': { shortName: 'एसएससी एमटीएस', fullName: 'मल्टी टास्किंग स्टाफ परीक्षा' },
  'SSC_GD': { shortName: 'एसएससी जीडी', fullName: 'एसएससी कांस्टेबल जीडी परीक्षा' },
  'SSC_JE': { shortName: 'एसएससी जेई', fullName: 'कनिष्ठ अभियंता परीक्षा' },
  'CAT': { shortName: 'कैट', fullName: 'आईआईएम प्रबंधन प्रवेश परीक्षा' },
  'IBPS_PO': { shortName: 'आईबीपीएस पीओ', fullName: 'बैंक प्रोबेशनरी ऑफिसर परीक्षा' },
  'SBI_PO': { shortName: 'एसबीआई पीओ', fullName: 'भारतीय स्टेट बैंक पीओ परीक्षा' },
  'RRB_NTPC': { shortName: 'आरआरबी एनटीपीसी', fullName: 'रेलवे भर्ती बोर्ड गैर-तकनीकी परीक्षा' },
  'UPPSC_PCS': { shortName: 'यूपीपीएससी पीसीएस', fullName: 'उत्तर प्रदेश राज्य सिविल सेवा परीक्षा' },
  'BPSC_CCE': { shortName: 'बीपीएससी', fullName: 'बिहार लोक सेवा आयोग संयुक्त प्रतियोगी परीक्षा' },
  'UPSC_CAPF': { shortName: 'यूपीएससी सीएपीएफ', fullName: 'केंद्रीय सशस्त्र पुलिस बल परीक्षा' },
};

export const ExamSelectModal: React.FC<ExamSelectModalProps> = ({
  isOpen,
  onClose,
  selectedExam,
  onExamChange,
  onOpenCustomModal
}) => {
  const { currentLanguage, isHindi: ctxIsHindi } = useLanguage();
  const isHindi = Boolean(ctxIsHindi || currentLanguage === 'hi');
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

  function getExamBadge(id: string) {
    const norm = id.toUpperCase();
    if (norm.includes('JEE_ADV')) return { code: 'JA', color: 'bg-purple-100 text-purple-950 border border-purple-300 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30' };
    if (norm.includes('JEE_MAIN') || norm.includes('JEE')) return { code: 'JM', color: 'bg-sky-100 text-sky-950 border border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30' };
    if (norm.includes('NEET') || norm.includes('AIIMS')) return { code: 'NE', color: 'bg-emerald-100 text-emerald-950 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30' };
    if (norm.includes('UPSC')) return { code: 'UP', color: 'bg-amber-100 text-amber-950 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30' };
    if (norm.includes('GATE')) return { code: 'GA', color: 'bg-orange-100 text-orange-950 border border-orange-300 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30' };
    if (norm.includes('NDA')) return { code: 'ND', color: 'bg-blue-100 text-blue-950 border border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30' };
    if (norm.includes('CDS')) return { code: 'CD', color: 'bg-indigo-100 text-indigo-950 border border-indigo-300 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30' };
    if (norm.includes('SSC')) return { code: 'SC', color: 'bg-teal-100 text-teal-950 border border-teal-300 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30' };
    if (norm.includes('CAT')) return { code: 'CA', color: 'bg-rose-100 text-rose-950 border border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30' };
    if (norm.includes('PSC') || norm.includes('BPSC') || norm.includes('UPPSC')) return { code: 'PS', color: 'bg-yellow-100 text-yellow-950 border border-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30' };
    if (norm.includes('IBPS') || norm.includes('SBI')) return { code: 'BK', color: 'bg-green-100 text-green-950 border border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30' };
    const cleaned = norm.replace(/[^A-Z]/g, '');
    return { code: cleaned.slice(0, 2) || 'EX', color: 'bg-slate-100 text-slate-900 border border-slate-300 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30' };
  }

  function parseExamLabel(label: string) {
    const parts = label.split(/[–—]/);
    if (parts.length >= 2) {
      return {
        shortName: parts[0].trim(),
        fullName: parts.slice(1).join('—').trim()
      };
    }
    return {
      shortName: label.trim(),
      fullName: ''
    };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 text-left no-backdrop-blur">
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
                {isHindi ? 'लक्ष्य परीक्षा चुनें' : 'Select Target Exam'}
              </h3>
              <p className="text-xs text-[var(--sr-text-muted)] font-medium">
                {isHindi ? '४८+ राष्ट्रीय एवं राज्य स्तरीय परीक्षाएं उपलब्ध' : '48+ National & State Exams Available'}
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

        {/* Search Bar - Single Clean Border, No Double Focus Ring */}
        <div className="px-4 py-2.5 border-b border-[var(--sr-line)] bg-[var(--sr-surface)]">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)] focus-within:border-transparent focus-within:ring-2 focus-within:ring-[var(--sr-primary)] transition-all">
            <Search className="w-4 h-4 text-[var(--sr-text-subtle)] shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isHindi ? '४८+ परीक्षाएं खोजें...' : 'Search 48+ exams...'}
              style={{ outline: 'none', boxShadow: 'none' }}
              className="w-full bg-transparent text-[var(--sr-text)] placeholder-[var(--sr-text-subtle)] text-xs sm:text-sm font-bold border-none outline-none ring-0 focus:outline-none focus:ring-0 min-h-[36px]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[var(--sr-text-muted)] p-1 hover:text-[var(--sr-text)] cursor-pointer">
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
              {isHindi ? cat.labelHi : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Exam List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredExams.map((ex) => {
            const isSelected = ex.id === selectedExam;
            const { code, color } = getExamBadge(ex.id);
            const parsed = parseExamLabel(ex.label);
            const hiLabel = EXAM_LABEL_HI[ex.id];
            const shortName = isHindi && hiLabel ? hiLabel.shortName : parsed.shortName;
            const fullName = isHindi && hiLabel ? hiLabel.fullName : parsed.fullName;

            return (
              <button
                key={ex.id}
                onClick={() => handleSelectExam(ex.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer min-h-[56px] select-none ${
                  isSelected
                    ? 'bg-[var(--sr-primary-subtle)] border-[var(--sr-primary)] text-[var(--sr-text)]'
                    : 'bg-[var(--sr-surface)] hover:bg-[var(--sr-surface-2)] border-[var(--sr-line)] text-[var(--sr-text)]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                    isSelected
                      ? 'bg-[var(--sr-primary)] text-[var(--sr-on-primary)] shadow-sm'
                      : color
                  }`}>
                    {code}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-[var(--sr-text)] leading-snug break-words">
                      {shortName}
                    </span>
                    {fullName && (
                      <span className="block text-xs font-medium text-[var(--sr-text-muted)] line-clamp-2 mt-0.5 leading-tight">
                        {fullName}
                      </span>
                    )}
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
              {isHindi ? `"${searchQuery}" से मेल खाती कोई परीक्षा नहीं मिली।` : `No exams found matching "${searchQuery}".`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
