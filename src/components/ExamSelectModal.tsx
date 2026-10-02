import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  X, 
  GraduationCap, 
  CheckCircle2, 
  Sparkles, 
  Plus, 
  BookOpen, 
  Layers, 
  Flame, 
  ChevronRight,
  Compass
} from 'lucide-react';
import { EXAM_LIST, ExamOption } from '../lib/examList';
import { getCustomExamsFromStorage, CustomExamConfig } from '../lib/customExamStore';

export interface ExamSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedExam: string;
  onExamChange: (examId: string) => void;
  onOpenCustomModal?: () => void;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Exams' },
  { id: 'ENGINEERING', label: 'Engineering (JEE/GATE)' },
  { id: 'MEDICAL', label: 'Medical (NEET/Nursing)' },
  { id: 'CIVIL_SERVICES', label: 'Civil Services (UPSC)' },
  { id: 'DEFENCE', label: 'Defence (NDA/CDS)' },
  { id: 'SSC_RAILWAYS', label: 'SSC & Railways' },
  { id: 'BANKING', label: 'Banking & Insurance' },
  { id: 'STATE_EXAMS', label: 'State PSCs & Police' },
  { id: 'CUSTOM', label: 'My Custom Roadmaps' }
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

  // Helper to categorize exams
  const getExamCategory = (ex: ExamOption): string => {
    const id = ex.id.toUpperCase();
    const lbl = ex.label.toUpperCase();
    if (id.includes('JEE') || id.includes('GATE') || id.includes('BITSAT') || id.includes('PET') || id.includes('ENGINEER')) return 'ENGINEERING';
    if (id.includes('NEET') || id.includes('AIIMS') || id.includes('NURSING') || id.includes('MEDICAL') || id.includes('ANM') || id.includes('GNM')) return 'MEDICAL';
    if (id.includes('UPSC') || id.includes('CSE') || id.includes('CIVIL')) return 'CIVIL_SERVICES';
    if (id.includes('NDA') || id.includes('CDS') || id.includes('AFCAT') || id.includes('DEFENCE') || id.includes('AIR_FORCE') || id.includes('NAVY')) return 'DEFENCE';
    if (id.includes('SSC') || id.includes('RRB') || id.includes('RAILWAY') || id.includes('NTPC')) return 'SSC_RAILWAYS';
    if (id.includes('IBPS') || id.includes('SBI') || id.includes('PO') || id.includes('CLERK') || id.includes('BANK')) return 'BANKING';
    if (id.includes('PSC') || id.includes('POLICE') || id.includes('CONSTABLE') || id.includes('SI') || id.includes('BIHAR') || id.includes('UP') || id.includes('WB') || id.includes('MP') || id.includes('RAJASTHAN')) return 'STATE_EXAMS';
    return 'OTHER';
  };

  // Filtered standard exams
  const filteredExams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return EXAM_LIST.filter((ex) => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        if (selectedCategory === 'CUSTOM') return false;
        const cat = getExamCategory(ex);
        if (cat !== selectedCategory) return false;
      }

      // Search query filter
      if (!q) return true;
      const idMatch = ex.id.toLowerCase().includes(q);
      const labelMatch = ex.label.toLowerCase().includes(q);
      const catMatch = ex.category?.toLowerCase().includes(q);
      // Special acronym expansions
      if (q === 'jee' && (ex.id.includes('JEE') || ex.label.toLowerCase().includes('joint entrance'))) return true;
      if (q === 'neet' && (ex.id.includes('NEET') || ex.label.toLowerCase().includes('eligibility entrance'))) return true;
      if (q === 'upsc' && (ex.id.includes('UPSC') || ex.label.toLowerCase().includes('civil services'))) return true;
      if (q === 'ssc' && ex.id.includes('SSC')) return true;
      if (q === 'nda' && ex.id.includes('NDA')) return true;

      return idMatch || labelMatch || !!catMatch;
    });
  }, [searchQuery, selectedCategory]);

  // Filtered custom exams
  const filteredCustomExams = useMemo(() => {
    if (selectedCategory !== 'ALL' && selectedCategory !== 'CUSTOM') return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customExams;
    return customExams.filter(ce => 
      ce.id.toLowerCase().includes(q) || 
      ce.label.toLowerCase().includes(q) || 
      (ce.category && ce.category.toLowerCase().includes(q))
    );
  }, [customExams, searchQuery, selectedCategory]);

  const totalResults = filteredExams.length + filteredCustomExams.length;

  const handleSelect = (examId: string) => {
    onExamChange(examId);
    onClose();
  };

  if (!isOpen) return null;

  const modalNode = (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-3xl h-[90vh] sm:h-[84vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden relative"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Select Target Examination
              </h2>
              <p className="text-xs text-slate-400">
                Instantly switches curriculum, test series, question bank, and syllabus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar (Sticky) */}
        <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-slate-950/50">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-sky-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exam (e.g. JEE Main, JEE Advanced, NEET, UPSC, SSC, GATE)..."
              className="w-full pl-10 pr-9 py-2.5 sm:py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm font-semibold focus:outline-none focus:border-sky-500 transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-0.5 scrollbar-none text-[11px] font-bold">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/25 font-black'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter & Custom Action */}
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">
            Found <span className="text-sky-300 font-bold">{totalResults}</span> {totalResults === 1 ? 'examination' : 'examinations'}
          </span>
          {onOpenCustomModal && (
            <button
              onClick={() => {
                onClose();
                onOpenCustomModal();
              }}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer text-[11px]"
            >
              <Plus className="w-3.5 h-3.5" /> Create Custom Exam
            </button>
          )}
        </div>

        {/* Exams List Scrollable Container */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
          {/* Custom Exams Section */}
          {filteredCustomExams.length > 0 && (
            <div className="space-y-1.5 mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1 px-1">
                <Sparkles className="w-3 h-3" /> My Custom Roadmaps
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredCustomExams.map((ce) => {
                  const isCurrent = selectedExam === ce.id;
                  return (
                    <button
                      key={ce.id}
                      onClick={() => handleSelect(ce.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                        isCurrent
                          ? 'bg-purple-500/15 border-purple-500/60 shadow-lg shadow-purple-500/15'
                          : 'bg-slate-950/70 hover:bg-slate-950 border-slate-800/80 hover:border-purple-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-white leading-tight">
                          ✨ {ce.label}
                        </span>
                        {isCurrent && (
                          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                        )}
                      </div>
                      <span className="text-[10px] text-purple-300/80 mt-1 font-mono">
                        {ce.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Standard Exams List */}
          {filteredExams.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredExams.map((ex) => {
                const isCurrent = selectedExam === ex.id;
                const mainName = ex.label.split(/[–—]/)[0].trim();
                const subDesc = ex.label.split(/[–—]/)[1]?.trim() || ex.id;

                return (
                  <button
                    key={ex.id}
                    onClick={() => handleSelect(ex.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 group ${
                      isCurrent
                        ? 'bg-sky-500/15 border-sky-500/60 shadow-lg shadow-sky-500/15'
                        : 'bg-slate-950/70 hover:bg-slate-950 border-slate-800/80 hover:border-sky-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold transition-colors ${
                            isCurrent ? 'text-sky-300' : 'text-slate-100 group-hover:text-white'
                          }`}>
                            {mainName}
                          </span>
                          {(ex.id === 'JEE_MAIN' || ex.id === 'JEE_ADVANCED' || ex.id === 'NEET_UG' || ex.id === 'UPSC_CSE') && (
                            <span className="px-1.5 py-0.2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[9px] font-black uppercase">
                              HOT
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {subDesc}
                        </p>
                      </div>
                      {isCurrent ? (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[9px] font-bold shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-sky-400" />
                          <span>Active</span>
                        </div>
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">No examination matches "{searchQuery}"</p>
              <p className="text-xs text-slate-500">
                Can't find your exam? You can easily create a personalized custom syllabus roadmap!
              </p>
              {onOpenCustomModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCustomModal();
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Custom Roadmap
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1 text-[11px]">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            Switching updates questions, syllabus & timers instantly
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
};
