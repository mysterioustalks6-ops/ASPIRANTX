import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { dedupFetch } from '../lib/apiDeduplicator';
import { PyqRecord } from '../types';
import { EXAM_LIST } from '../lib/examList';
import { getExamConfig } from '../lib/examRegistry';
import { AdSenseBanner } from './AdSenseBanner';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  FileSpreadsheet, 
  HelpCircle, 
  Award, 
  Languages, 
  Calendar, 
  Tag, 
  Check, 
  AlertTriangle,
  RotateCcw,
  BookMarked,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface PyqEngineProps {
  onOpenBulkImport?: () => void;
  isAdmin?: boolean;
  initialExam?: string;
}

const normalizeExamKey = (e: string) => {
  let s = String(e || '').trim().toLowerCase().replace(/[\s-_]/g, '');
  if (s.includes('nda') || s.includes('defence') || s.includes('naval')) return 'nda';
  if (s.includes('neet') || s.includes('medical') || s.includes('eligibilitycum')) return 'neet';
  if (s.includes('upsc') || s.includes('civil') || s.includes('cse')) return 'upsc';
  if (s.includes('ssc') || s.includes('cgl') || s.includes('staffselection')) return 'ssc';
  return s;
};

export const getStandardSubject = (examId: string, rawSubj: string): string => {
  const exam = String(examId || '').toUpperCase();
  let s = String(rawSubj || '').trim().toLowerCase();
  s = s.replace(/^(nda|neet|upsc|ssc)\s+/i, '');

  if (exam.includes('NEET') || exam.includes('JENPAS') || exam.includes('ANM') || exam.includes('GNM') || exam.includes('NURSING')) {
    if (s.includes('physic')) return 'Physics';
    if (s.includes('chemist')) return 'Chemistry';
    if (s.includes('bio') || s.includes('botany') || s.includes('zoolog') || s.includes('physiol')) return 'Biology';
    return 'Biology';
  }

  if (exam.includes('NDA') || exam.includes('CDS') || exam.includes('DEFENCE') || exam.includes('AIR_FORCE')) {
    if (s.includes('math') || s.includes('calculus') || s.includes('algebra') || s.includes('trig') || s.includes('geometry') || s.includes('vector') || s.includes('probab')) return 'Mathematics';
    if (s.includes('engl')) return 'English';
    if (s.includes('physic')) return 'Physics';
    if (s.includes('chemist')) return 'Chemistry';
    if (s.includes('biolog') || s.includes('zoolog') || s.includes('botany')) return 'Biology';
    if (s.includes('geog')) return 'Geography';
    if (s.includes('hist')) return 'History of India';
    if (s.includes('polit')) return 'Indian Polity & Governance';
    if (s.includes('current') || s.includes('gk')) return 'Current Affairs & GK';
    return 'General Science';
  }

  if (exam.includes('UPSC') || exam.includes('PCS') || exam.includes('WBCS') || exam.includes('BPSC')) {
    if (s.includes('polit') || s.includes('govern') || s.includes('constitut') || s.includes('law')) return 'Indian Polity & Governance';
    if (s.includes('histor') || s.includes('culture') || s.includes('art') || s.includes('freedom')) return 'History of India';
    if (s.includes('environ') || s.includes('ecolog')) return 'Environment & Ecology';
    if (s.includes('geograph')) return 'Geography';
    if (s.includes('econom') || s.includes('finance')) return 'Economy';
    if (s.includes('sci') || s.includes('tech')) return 'Science & Technology';
    if (s.includes('internat') || s.includes('current') || s.includes('relation')) return 'International Relations & Current Affairs';
    if (s.includes('csat') || s.includes('aptit') || s.includes('reason') || s.includes('math')) return 'CSAT (Paper-2)';
    return 'General Studies';
  }

  if (exam.includes('SSC') || exam.includes('BANK') || exam.includes('PO') || exam.includes('RRB')) {
    if (s.includes('quant') || s.includes('math') || s.includes('arith') || s.includes('number') || s.includes('geomet') || s.includes('algeb')) return 'Quantitative Aptitude';
    if (s.includes('reason') || s.includes('intellig') || s.includes('logic') || s.includes('mental')) return 'General Intelligence & Reasoning';
    if (s.includes('english') || s.includes('compreh') || s.includes('verbal')) return 'English Comprehension';
    if (s.includes('aware') || s.includes('gk') || s.includes('general') || s.includes('current')) return 'General Awareness';
    return 'General Studies';
  }

  if (s.includes('physic')) return 'Physics';
  if (s.includes('chemist')) return 'Chemistry';
  if (s.includes('biolog') || s.includes('botan') || s.includes('zoolo')) return 'Biology';
  if (s.includes('math')) return 'Mathematics';
  if (s.includes('english')) return 'English';
  if (s.includes('polit')) return 'Indian Polity & Governance';

  return rawSubj || 'General Studies';
};

export const getExamSubjects = (examId: string): string[] => {
  return getExamConfig(examId).subjects;
};

export const PyqEngine: React.FC<PyqEngineProps> = ({ onOpenBulkImport, isAdmin = false, initialExam }) => {
  const [selectedExam, setSelectedExam] = useState<string>(initialExam || 'NEET_UG');

  // Clean initial state (No dataset duplication in React state)
  const [pyqs, setPyqs] = useState<PyqRecord[]>([]);

  const [pdfPapers, setPdfPapers] = useState<any[]>([]);
  const [subTab, setSubTab] = useState<'practice' | 'pdfs' | 'trends' | 'ocr'>('practice');
  const [loading, setLoading] = useState<boolean>(false);
  const [ocrStatus, setOcrStatus] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [ocrProgress, setOcrProgress] = useState(0);

  // Update selectedExam whenever initialExam prop changes from parent
  useEffect(() => {
    if (initialExam && initialExam !== selectedExam) {
      setSelectedExam(initialExam);
      setSelectedSubject('All');
      setSelectedTopic('All');
      setStageFilter('All');
      setSearchQuery('');
      setPage(1);
    }
  }, [initialExam]);

  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [minYear, setMinYear] = useState<number>(1991);
  const [maxYear, setMaxYear] = useState<number>(2026);
  const [selectedSpecificYear, setSelectedSpecificYear] = useState<string>('All');
  const [viewGroupBy, setViewGroupBy] = useState<'year' | 'flat'>('flat');
  const [collapsedYears, setCollapsedYears] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [languageFilter, setLanguageFilter] = useState<string>('All');

  // Backend Pagination & Repeat Filter States
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  const [repeatFilter, setRepeatFilter] = useState<string>('All');
  const [minRepeats, setMinRepeats] = useState<number>(1);
  const [minYears, setMinYears] = useState<number>(1);

  // Compute available topics based on selectedExam and selectedSubject
  const availableTopics = React.useMemo(() => {
    const config = getExamConfig(selectedExam);
    if (!config || !config.syllabusTree) return [];
    if (selectedSubject !== 'All' && config.syllabusTree[selectedSubject]) {
      return config.syllabusTree[selectedSubject].topics || [];
    }
    const allT: string[] = [];
    Object.values(config.syllabusTree).forEach((s) => {
      if (s.topics) allT.push(...s.topics);
    });
    return Array.from(new Set(allT));
  }, [selectedExam, selectedSubject]);

  // Clean Reset of ALL Filters when selectedExam changes
  useEffect(() => {
    setSelectedSubject('All');
    setSelectedTopic('All');
    setSelectedSpecificYear('All');
    setSearchQuery('');
    setRepeatFilter('All');
    setDifficultyFilter('All');
    setLanguageFilter('All');
    setPage(1);
  }, [selectedExam]);

  // Reset topic & page when selectedSubject changes
  useEffect(() => {
    setSelectedTopic('All');
    setPage(1);
  }, [selectedSubject]);

  // Reset page to 1 whenever any filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedTopic, selectedSpecificYear, difficultyFilter, searchQuery, repeatFilter, minRepeats, minYears]);

  const [analyticsData, setAnalyticsData] = useState<{
    totalQuestions: number;
    totalRepeated: number;
    repeatPercentage: number;
    topicBreakdown: { topic: string; subject: string; count: number; repeatCount: number }[];
  } | null>(null);

  // Practice Mode State: Map of question ID -> selected option index
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [showExplanations, setShowExplanations] = useState<Record<string, boolean>>({});

  // Modal State for Manual Entry
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newPyq, setNewPyq] = useState<Partial<PyqRecord>>({
    exam: 'UPSC_CSE',
    year: 2024,
    stage: 'Prelims',
    paper: 'GS Paper 1',
    subject: 'Indian Polity & Governance',
    topic: 'Preamble & Fundamental Rights',
    questionText: '',
    options: ['', '', '', ''],
    correctOption: 0,
    explanation: '',
    difficulty: 'Medium',
    language: 'English',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch PYQs with true backend pagination (page=1, limit=20) and AbortController cancellation
  const fetchPyqs = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const langParam = languageFilter !== 'All' ? `&language=${languageFilter}` : '';
      const subjParam = selectedSubject !== 'All' ? `&subject=${encodeURIComponent(selectedSubject)}` : '';
      const topicParam = selectedTopic !== 'All' ? `&topic=${encodeURIComponent(selectedTopic)}` : '';
      const yearParam = selectedSpecificYear !== 'All' ? `&minYear=${selectedSpecificYear}&maxYear=${selectedSpecificYear}` : '';
      const diffParam = difficultyFilter !== 'All' ? `&difficulty=${difficultyFilter}` : '';
      const repeatParam = repeatFilter !== 'All' ? `&repeatFilter=${repeatFilter}&minRepeats=${minRepeats}&minYears=${minYears}` : '';

      const url = `/api/academic/pyqs?exam=${selectedExam}&page=${page}&limit=${limit}&search=${encodeURIComponent(
        searchQuery
      )}${langParam}${subjParam}${topicParam}${yearParam}${diffParam}${repeatParam}`;

      const res = await dedupFetch(url, signal ? { signal } : undefined);
      if (res.ok) {
        const data = await res.json();
        if ((!signal || !signal.aborted) && data.success && Array.isArray(data.pyqs)) {
          setPyqs(data.pyqs);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.warn('Failed to fetch PYQs from API:', e.message);
      }
    } finally {
      if (!signal || !signal.aborted) {
        setLoading(false);
      }
    }
  }, [selectedExam, selectedSubject, selectedTopic, selectedSpecificYear, searchQuery, languageFilter, difficultyFilter, repeatFilter, minRepeats, minYears, page, limit]);

  useEffect(() => {
    const controller = new AbortController();
    fetchPyqs(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchPyqs]);

  // Secondary Background Effect for PDF Papers & Analytics (Does NOT re-run on page changes)
  useEffect(() => {
    const controller = new AbortController();

    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/academic/pyqs/analytics?exam=${selectedExam}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (!controller.signal.aborted && data.success) setAnalyticsData(data.analytics || data);
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') console.warn('Analytics fetch warning');
      }
    };

    const fetchPdfPapers = async () => {
      try {
        const url = `/api/academic/pyqs/pdfs?exam=${selectedExam}&search=${encodeURIComponent(searchQuery)}`;
        const res = await fetch(url, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (!controller.signal.aborted && data.success && Array.isArray(data.papers)) {
            setPdfPapers(data.papers);
          }
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') console.warn('PDF papers fetch warning');
      }
    };

    fetchPdfPapers();
    fetchAnalytics();

    return () => {
      controller.abort();
    };
  }, [selectedExam, searchQuery]);

  const handleSelectOption = (pyqId: string, optionIndex: number) => {
    setUserAnswers((prev) => ({ ...prev, [pyqId]: optionIndex }));
    setShowExplanations((prev) => ({ ...prev, [pyqId]: true }));
  };

  const handleSavePyq = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newPyq.questionText || !newPyq.subject || !newPyq.topic) {
      setFormError('Question text, subject, and topic are required fields.');
      return;
    }

    try {
      const res = await fetch('/api/academic/pyqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPyq),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to save PYQ');
        return;
      }

      setShowAddModal(false);
      fetchPyqs();
    } catch (err: any) {
      setFormError(err.message || 'Error creating PYQ');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              Enterprise PYQ Engine (1991 – 2026)
              <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                35+ Years Archive
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Verified Past Year Question Papers with Subject Mapping & Explanations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenBulkImport && (
            <button
              onClick={onOpenBulkImport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-xs font-bold text-purple-300 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bulk PYQ Import</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-xs font-bold text-white transition-all shadow-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add PYQ</span>
            </button>
          )}
        </div>
      </div>

      {/* AdSense In-Feed Ad Banner */}
      <AdSenseBanner slotType="inFeed" />

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10 w-fit">
        <button
          onClick={() => setSubTab('practice')}
          className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
            subTab === 'practice'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Interactive Quiz Mode
        </button>
        <button
          onClick={() => setSubTab('pdfs')}
          className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
            subTab === 'pdfs'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Official PDF Papers
          {pdfPapers.length > 0 && (
            <span className="px-1.5 py-0.5 text-[9px] bg-white/20 text-white rounded-full font-black">
              {pdfPapers.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setSubTab('trends')}
          className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
            subTab === 'trends'
              ? 'bg-amber-500 text-black font-black shadow-lg'
              : 'text-amber-400/80 hover:text-amber-300'
          }`}
        >
          <span>🔥 PYQ Repeat Trends</span>
        </button>
        <button
          onClick={() => setSubTab('ocr')}
          className={`px-4 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
            subTab === 'ocr'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          📄 PDF to Word Beautifier
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          {/* Read-Only Active Exam Badge (Single Source of Truth) */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
              Active Exam Context
            </label>
            <div className="w-full px-3 py-2 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs text-purple-200 font-extrabold flex items-center justify-between shadow-inner">
              <span className="truncate">{EXAM_LIST.find((ex) => ex.id === selectedExam)?.label || selectedExam}</span>
              <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-400/30 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">Profile Bounded</span>
            </div>
          </div>

          {subTab === 'practice' ? (
            <>
              {/* Select Subject Dropdown */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Select Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/40 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 font-extrabold cursor-pointer"
                >
                  <option value="All">📖 All Subjects ({total} Qs)</option>
                  {getExamSubjects(selectedExam).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Topic Dropdown */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Select Topic</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-purple-500/30 text-xs text-purple-300 focus:outline-none focus:border-purple-400 font-extrabold cursor-pointer"
                >
                  <option value="All">🎯 All Topics</option>
                  {availableTopics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by Specific Year */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Select Exam Year</label>
                <select
                  value={selectedSpecificYear}
                  onChange={(e) => setSelectedSpecificYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-purple-500/30 text-xs text-white focus:outline-none focus:border-purple-400 font-extrabold"
                >
                  <option value="All">📅 All Exam Years (1991–2026)</option>
                  {Array.from({ length: 35 }, (_, i) => 2025 - i).map((y) => (
                    <option key={y} value={y}>Exam Year {y}</option>
                  ))}
                </select>
              </div>

              {/* Repeat Pattern Filter */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Repeat Filter</label>
                <select
                  value={repeatFilter}
                  onChange={(e) => setRepeatFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-amber-500/40 text-xs text-amber-300 focus:outline-none focus:border-amber-400 font-extrabold cursor-pointer"
                >
                  <option value="All">🔁 All Questions</option>
                  <option value="Repeated">🔥 Repeated Questions Only</option>
                  <option value="ExactDuplicate">🎯 Exact Duplicate Text</option>
                  <option value="SimilarPattern">💡 Similar Question Patterns</option>
                </select>
              </div>

              {/* Language Filter */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Language / भाषा</label>
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="All">🌐 All Languages</option>
                  <option value="English">🇬🇧 English</option>
                  <option value="Hindi">🇮🇳 Hindi / हिन्दी</option>
                </select>
              </div>
            </>
          ) : (
            <div className="hidden md:block col-span-3"></div>
          )}

          {/* Search Keywords */}
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Search Keywords</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={subTab === 'practice' ? "Search PYQs..." : "Search PDF Papers..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>
        </div>

        {subTab === 'practice' && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-black/40 border border-purple-500/20 shadow-lg">
            <div className="text-xs font-bold text-purple-300 flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30">
                📚 <strong>{total}</strong> Questions Available for {selectedExam.replace(/_/g, ' ')}
              </span>
              {total > 0 && (
                <span className="text-slate-400 font-normal hidden sm:inline">
                  (Displaying {((page - 1) * limit) + 1}–{Math.min(page * limit, total)})
                </span>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-white transition-all shadow cursor-pointer flex items-center gap-1"
              >
                <span>← Previous</span>
              </button>
              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-extrabold text-white font-mono">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-white transition-all shadow cursor-pointer flex items-center gap-1"
              >
                <span>Next →</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content Rendering based on Tab */}
      {subTab === 'practice' ? (
        <div className="space-y-4 max-h-[82vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-500/40 scrollbar-track-transparent">
          {pyqs.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white">No past year questions yet for {selectedExam} — ask admin to bulk import or add PYQs</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                There are no PYQs currently available in the archive for {selectedExam}. Use the Bulk PYQ Import modal or add questions manually to populate this exam's archives.
              </p>
            </div>
          ) : viewGroupBy === 'year' ? (
            /* ── YEAR-WISE GROUPED FOLDERS VIEW ── */
            (() => {
              const displayPyqs = pyqs;
              const years = Array.from(new Set(displayPyqs.map(q => q.year))).sort((a, b) => b - a);

              if (years.length === 0) {
                return (
                  <div className="p-8 text-center rounded-2xl bg-black/40 border border-white/10 text-slate-400 text-xs">
                    No questions found for the selected subject ({selectedSubject}) / year ({selectedSpecificYear}). Try selecting "All Subjects" or "All Exam Years".
                  </div>
                );
              }

              return years.map(year => {
                const yearQuestions = displayPyqs.filter(q => q.year === year);
                const isCollapsed = collapsedYears[year] ?? false;

                return (
                  <div key={year} className="rounded-2xl bg-slate-900/80 border border-purple-500/30 overflow-hidden shadow-xl transition-all">
                    {/* Year Folder Accordion Header */}
                    <div
                      onClick={() => setCollapsedYears(prev => ({ ...prev, [year]: !prev[year] }))}
                      className="p-4 bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-purple-950/60 flex items-center justify-between cursor-pointer hover:bg-purple-900/20 transition-all select-none border-b border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center font-extrabold text-sm shadow-inner">
                          {year}
                        </div>
                        <div className="text-left">
                          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                            <span>{selectedExam.replace(/_/g, ' ')} — Exam Year {year}</span>
                            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-[10px] text-purple-300 font-black">
                              {yearQuestions.length} Questions
                            </span>
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Subject Breakdown: {[...new Set(yearQuestions.map(q => getStandardSubject(selectedExam, q.subject)))].join(', ')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-purple-400 font-bold hidden sm:inline-block">
                          {isCollapsed ? 'Click to Expand' : 'Click to Collapse'}
                        </span>
                        <div className="p-1.5 rounded-lg bg-white/5 text-purple-300 border border-white/10">
                          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Questions Body under this year */}
                    {!isCollapsed && (
                      <div className="p-4 space-y-4 bg-black/40">
                        {yearQuestions.map((pyq, index) => {
                          const selectedOpt = userAnswers[pyq.id];
                          const isAnswered = selectedOpt !== undefined;
                          const isCorrect = selectedOpt === pyq.correctOption;

                          return (
                            <div
                              key={pyq.id}
                              className="p-4 rounded-xl bg-slate-950/70 border border-white/10 space-y-3 text-left transition-all hover:border-purple-500/30"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black">
                                    Year {pyq.year}
                                  </span>
                                  <span className="text-xs font-bold text-slate-300">{getStandardSubject(selectedExam, pyq.subject)}</span>
                                  <span className="text-[10px] text-slate-500">• {pyq.topic}</span>
                                </div>

                                <span
                                  className={`text-[9px] font-black px-2 py-0.5 rounded ${
                                    pyq.difficulty === 'Hard'
                                      ? 'bg-rose-500/20 text-rose-300'
                                      : pyq.difficulty === 'Medium'
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : 'bg-emerald-500/20 text-emerald-300'
                                  }`}
                                >
                                  {pyq.difficulty}
                                </span>
                              </div>

                              <div className="text-xs font-semibold text-slate-100 whitespace-pre-line leading-relaxed">
                                <span className="text-purple-400 font-extrabold mr-1.5">Q{index + 1}.</span>
                                {pyq.questionText}
                              </div>

                              {pyq.options && pyq.options.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                                  {pyq.options.map((opt, optIdx) => {
                                    const isSelected = selectedOpt === optIdx;
                                    const isOptionCorrect = pyq.correctOption === optIdx;

                                    let btnStyle = 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10';

                                    if (isAnswered) {
                                      if (isOptionCorrect) {
                                        btnStyle = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200 font-bold';
                                      } else if (isSelected && !isCorrect) {
                                        btnStyle = 'bg-rose-500/20 border-rose-500/40 text-rose-200';
                                      }
                                    }

                                    return (
                                      <button
                                        key={optIdx}
                                        onClick={() => handleSelectOption(pyq.id, optIdx)}
                                        className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                                      >
                                        <span>
                                          <strong className="mr-1.5 text-slate-400">{String.fromCharCode(65 + optIdx)}.</strong>
                                          {opt}
                                        </span>
                                        {isAnswered && isOptionCorrect && (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        )}
                                        {isAnswered && isSelected && !isCorrect && (
                                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {pyq.explanation && (
                                <div className="pt-1">
                                  <button
                                    onClick={() =>
                                      setShowExplanations((prev) => ({ ...prev, [pyq.id]: !prev[pyq.id] }))
                                    }
                                    className="text-[11px] text-purple-400 hover:text-purple-300 underline font-semibold flex items-center gap-1"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    {showExplanations[pyq.id] ? 'Hide Explanation' : 'View Model Solution & Explanation'}
                                  </button>

                                  {showExplanations[pyq.id] && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="mt-2 p-3 rounded-xl bg-purple-950/40 border border-purple-500/20 text-xs text-purple-200 leading-relaxed"
                                    >
                                      <strong className="block font-black text-purple-300 mb-0.5">
                                        Official Solution & Explanation:
                                      </strong>
                                      {pyq.explanation}
                                    </motion.div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            })()
          ) : (
            /* ── FLAT LIST VIEW ── */
            (() => {
              if (pyqs.length === 0) {
                return (
                  <div className="p-8 text-center rounded-2xl bg-black/40 border border-white/10 text-slate-400 text-xs">
                    No questions found matching the selected filters. Try selecting "All Subjects" or clearing search.
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {pyqs.map((pyq, index) => {
                    const selectedOpt = userAnswers[pyq.id];
                    const isAnswered = selectedOpt !== undefined;
                    const isCorrect = selectedOpt === pyq.correctOption;

                    return (
                      <div
                        key={pyq.id}
                        className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-4 transition-all hover:border-white/20 text-left"
                      >
                        {/* PYQ Meta Badge Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-extrabold">
                              Year {pyq.year}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 text-[11px] font-semibold">
                              {pyq.paper}
                            </span>
                            <span className="text-xs font-bold text-slate-400">{getStandardSubject(selectedExam, pyq.subject)}</span>
                            {pyq.repeatCount && pyq.repeatCount > 1 && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold flex items-center gap-1">
                                <span>🔁 Repeated {pyq.repeatCount} times</span>
                                {pyq.repeatYears && pyq.repeatYears.length > 0 && (
                                  <span className="text-amber-200/80 font-mono">({pyq.repeatYears.join(', ')})</span>
                                )}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400">
                              {pyq.stage}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                                pyq.difficulty === 'Hard'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : pyq.difficulty === 'Medium'
                                  ? 'bg-amber-500/20 text-amber-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {pyq.difficulty}
                            </span>
                          </div>
                        </div>

                        {/* Question Body */}
                        <div className="text-sm font-semibold text-slate-100 whitespace-pre-line leading-relaxed">
                          <span className="text-purple-400 font-extrabold mr-2">Q{(page - 1) * limit + index + 1}.</span>
                          {pyq.questionText}
                        </div>

                        {/* Options */}
                        {pyq.options && pyq.options.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                            {pyq.options.map((opt, optIdx) => {
                              const isSelected = selectedOpt === optIdx;
                              const isOptionCorrect = pyq.correctOption === optIdx;

                              let btnStyle = 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10';

                              if (isAnswered) {
                                if (isOptionCorrect) {
                                  btnStyle = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200 font-bold';
                                } else if (isSelected && !isCorrect) {
                                  btnStyle = 'bg-rose-500/20 border-rose-500/40 text-rose-200';
                                }
                              }

                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => handleSelectOption(pyq.id, optIdx)}
                                  className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                                >
                                  <span>
                                    <strong className="mr-2 text-slate-400">{String.fromCharCode(65 + optIdx)}.</strong>
                                    {opt}
                                  </span>
                                  {isAnswered && isOptionCorrect && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                  )}
                                  {isAnswered && isSelected && !isCorrect && (
                                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Explanation Drawer */}
                        {pyq.explanation && (
                          <div className="pt-2">
                            <button
                              onClick={() =>
                                setShowExplanations((prev) => ({ ...prev, [pyq.id]: !prev[pyq.id] }))
                              }
                              className="text-xs text-purple-400 hover:text-purple-300 underline font-semibold flex items-center gap-1"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              {showExplanations[pyq.id] ? 'Hide Solution Explanation' : 'View Model Solution & Explanation'}
                            </button>

                            {showExplanations[pyq.id] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-2 p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200 leading-relaxed"
                              >
                                <strong className="block font-black text-purple-300 mb-1">
                                  Official Key & Detailed Explanation:
                                </strong>
                                {pyq.explanation}
                              </motion.div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Bottom Pagination Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-black/40 border border-purple-500/20 shadow-lg mt-6">
                    <div className="text-xs text-slate-300 font-extrabold">
                      Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} Questions Total)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-xs font-bold text-white transition-all shadow cursor-pointer"
                      >
                        ← Previous Page
                      </button>
                      <button
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 text-xs font-bold text-white transition-all shadow cursor-pointer"
                      >
                        Next Page →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {pdfPapers.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white">No PDF Papers found for {EXAM_LIST.find(e => e.id === selectedExam)?.label}</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No past year PDF downloads are registered for this exam yet. Try selecting a State PCS exam like UPPCS, BPSC, RAS, UKPSC, JPSC, or CGPSC.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pdfPapers.map((paper) => (
                <div
                  key={paper.id}
                  className="p-5 rounded-2xl bg-gradient-to-br from-black/40 to-purple-950/15 border border-white/10 hover:border-purple-500/30 transition-all duration-300 flex items-center justify-between gap-4 group"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black uppercase">
                        {paper.year}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {paper.exam.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-purple-300 transition-colors leading-relaxed">
                      {paper.title}
                    </h4>
                  </div>
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-4 py-2.5 rounded-xl bg-purple-600/10 hover:bg-purple-600 border border-purple-500/20 text-purple-400 hover:text-white transition-all text-xs font-extrabold shrink-0 shadow-lg shadow-purple-950/20 hover:scale-105"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'trends' && (
        <div className="space-y-6 text-left">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Analyzed PYQs</span>
              <div className="text-2xl font-black text-white">{analyticsData?.totalQuestions || total}</div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/40 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-400">Repeated / Similar Questions</span>
              <div className="text-2xl font-black text-amber-300">
                {analyticsData?.totalRepeated || 0} ({analyticsData?.repeatPercentage || 0}%)
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Target Exam</span>
              <div className="text-lg font-black text-emerald-300">{selectedExam.replace(/_/g, ' ')}</div>
            </div>
          </div>

          {/* Topic-Wise Repeat Breakdown */}
          <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-4">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>📈 High-Yield Topic Repeat Analytics</span>
              <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                Pre-Computed
              </span>
            </h3>

            {analyticsData?.topicBreakdown && analyticsData.topicBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analyticsData.topicBreakdown.map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="text-xs font-extrabold text-white truncate">{item.topic}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{item.subject}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black">
                        🔁 {item.repeatCount} Repeats
                      </span>
                      <div className="text-[9px] text-slate-400 mt-1">{item.count} total PYQs</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No repeated question patterns detected for {selectedExam.replace(/_/g, ' ')}.
              </div>
            )}
          </div>
        </div>
      )}

      {subTab === 'ocr' && (
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="text-left space-y-1">
            <h3 className="font-extrabold text-white text-base">PDF Scans to Word Format Converter</h3>
            <p className="text-xs text-slate-400">
              Convert raw scanned previous year question papers (bad fonts / low readability) into clean editable Word styles.
            </p>
          </div>

          {ocrStatus === 'idle' ? (
            <div className="p-8 border-2 border-dashed border-white/10 rounded-2xl text-center space-y-4">
              <BookOpen className="w-12 h-12 text-purple-400 mx-auto animate-pulse" />
              <div className="space-y-1">
                <p className="text-xs text-white font-bold">Select Scanned UPSC/SSC Question PDF</p>
                <p className="text-[10px] text-slate-500">Supported types: Scanned UPSC GS Prelims PDF, SSC CGL Tier-1 PDF</p>
              </div>

              <button
                onClick={() => {
                  setOcrStatus('scanning');
                  setOcrProgress(0);
                  const interval = setInterval(() => {
                    setOcrProgress(prev => {
                      if (prev >= 100) {
                        clearInterval(interval);
                        setOcrStatus('done');
                        return 100;
                      }
                      return prev + 20;
                    });
                  }, 200);
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl shadow-lg transition-all mx-auto block"
              >
                Simulate PDF to Word Conversion
              </button>
            </div>
          ) : ocrStatus === 'scanning' ? (
            <div className="p-12 text-center space-y-3.5">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="space-y-1">
                <p className="text-xs text-white font-bold">Converting PDF Scanned Fonts...</p>
                <p className="text-[10px] text-slate-500">Progress: {ocrProgress}% Completed</p>
              </div>
              <div className="w-48 bg-slate-950 h-1.5 rounded-full overflow-hidden mx-auto">
                <div className="bg-purple-500 h-full transition-all" style={{ width: `${ocrProgress}%` }} />
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-left">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left: Scrambled Scanner Font (PDF) */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-white/5 space-y-3">
                  <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-black uppercase">
                    Scrambled PDF Scan Font Output
                  </span>
                  
                  <div className="font-mono text-[10px] text-slate-400 leading-relaxed space-y-2 whitespace-pre-wrap select-none blur-[0.5px]">
                    {`Q_1 .   Cons id er   th e   fol lo win g   sta te me nts   ab out   Pr ea m bl e .  
( 1 )   It   is   a   pa rt   of   Con sti tu tion .  
( 2 )   It   c a n   b e   am en d ed .  
Wh i ch   is   co rr e ct ?  
A . 1   o n ly   |   B . 2   o n ly   |   C . Bo th   |   D . N on e`}
                  </div>
                </div>

                {/* Right: Beautified Editable Word Layout (Font normalized) */}
                <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/30 space-y-3">
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-black uppercase">
                    Beautified Microsoft Word Layout Font
                  </span>

                  <div className="font-serif text-xs text-slate-900 leading-relaxed space-y-2 bg-white p-4 rounded-lg">
                    <p className="font-bold underline text-center">UPSC CSE Prelims Exam (GS-1)</p>
                    <p className="mt-2 font-bold">Question 1. Consider the following statements about Preamble:</p>
                    <p className="pl-3">(1) It is an integral part of the Constitution.</p>
                    <p className="pl-3">(2) It can be amended under Article 368.</p>
                    <p className="mt-1">Which of the following statements is/are correct?</p>
                    <p className="mt-1 font-bold pl-3">A. 1 only | B. 2 only | C. Both 1 and 2 | D. Neither 1 nor 2</p>
                  </div>
                </div>

              </div>

              {/* Action commands */}
              <div className="flex justify-end gap-3.5 pt-4 border-t border-white/5">
                <button
                  onClick={() => setOcrStatus('idle')}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Convert Another File
                </button>

                <button
                  onClick={() => {
                    // Inject mock question into local database array
                    const importedQ: PyqRecord = {
                      id: `imported_pyp_${Date.now()}`,
                      exam: selectedExam,
                      year: 2025,
                      stage: 'Prelims',
                      paper: 'GS Paper 1',
                      subject: 'Indian Polity & Governance',
                      topic: 'Preamble & Amendments',
                      questionText: 'Consider the following statements about Preamble:\n(1) It is an integral part of the Constitution.\n(2) It can be amended under Article 368.\nWhich of the following statements is/are correct?',
                      options: ['1 only', '2 only', 'Both 1 and 2', 'Neither 1 nor 2'],
                      correctOption: 2,
                      explanation: 'According to Kesavananda Bharati case (1973), Preamble is an integral part of the Constitution and can be amended subject to Basic Structure doctrine.',
                      difficulty: 'Medium',
                      language: 'English'
                    };
                    setPyqs(prev => [importedQ, ...prev]);
                    setSubTab('practice');
                    alert('Success: Converted questions successfully integrated into the active PYQ Practice Pool!');
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-xs rounded-xl shadow-lg hover:brightness-110"
                >
                  Send to PYQ Section (Practice Pool)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-[#0d0d12] border border-white/10 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-white">Add Past Year Question (PYQ)</h3>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSavePyq} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Exam</label>
                  <select
                    value={newPyq.exam}
                    onChange={(e) => setNewPyq({ ...newPyq, exam: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white"
                  >
                    {EXAM_LIST.map((ex) => (
                      <option key={ex.id} value={ex.id}>{ex.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Year (1991–2026)</label>
                  <input
                    type="number"
                    min="1991"
                    max="2026"
                    value={newPyq.year}
                    onChange={(e) => setNewPyq({ ...newPyq, year: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Subject</label>
                <input
                  type="text"
                  value={newPyq.subject}
                  onChange={(e) => setNewPyq({ ...newPyq, subject: e.target.value })}
                  placeholder="e.g. Indian Polity & Governance"
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Topic</label>
                <input
                  type="text"
                  value={newPyq.topic}
                  onChange={(e) => setNewPyq({ ...newPyq, topic: e.target.value })}
                  placeholder="e.g. Fundamental Rights"
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Question Text</label>
                <textarea
                  rows={3}
                  value={newPyq.questionText}
                  onChange={(e) => setNewPyq({ ...newPyq, questionText: e.target.value })}
                  placeholder="Type PYQ question..."
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Explanation</label>
                <textarea
                  rows={2}
                  value={newPyq.explanation}
                  onChange={(e) => setNewPyq({ ...newPyq, explanation: e.target.value })}
                  placeholder="Explanation & Key..."
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-extrabold text-white"
                >
                  Save PYQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
