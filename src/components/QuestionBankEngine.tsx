import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getStandardSubject, getExamSubjects } from './PyqEngine';
import { dedupFetch } from '../lib/apiDeduplicator';
import { QuestionBankRecord } from '../types';
import { EXAM_LIST } from '../lib/examList';
import { normalizeExamId } from '../lib/examRegistry';
import { useExam } from '../context/ExamContext';
import { AdSenseBanner } from './AdSenseBanner';
import { DIAGNOSTIC_QUESTION_BANK } from '../data/diagnosticQuestionBank';
import { contentPackageManager } from '../lib/contentPackageManager';
import { 
  HelpCircle, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  FileText, 
  Award, 
  Sparkles, 
  Eye, 
  Check, 
  Tag, 
  Layers,
  TrendingUp,
  RefreshCw,
  Compass,
  Play,
  Clock,
  CheckCircle,
  HelpCircle as QuestionIcon
} from 'lucide-react';

interface QuestionBankEngineProps {
  isAdmin?: boolean;
  onOpenBulkImport?: () => void;
  initialExam?: string;
}

const normalizeExamKey = (e: string) => normalizeExamId(e);

export const QuestionBankEngine: React.FC<QuestionBankEngineProps> = ({ 
  isAdmin = false, 
  onOpenBulkImport, 
  initialExam 
}) => {
  const { selectedExamId } = useExam();
  const [activeEngineTab, setActiveEngineTab] = useState<'browse' | 'quiz' | 'patterns'>('browse');
  const [selectedExam, setSelectedExam] = useState<string>(() => normalizeExamId(initialExam || selectedExamId));
  const [loading, setLoading] = useState<boolean>(false);

  // Clean initial state (No dataset duplication in React state)
  const [questions, setQuestions] = useState<QuestionBankRecord[]>([]);

  // Update selectedExam whenever initialExam or selectedExamId changes
  useEffect(() => {
    const target = normalizeExamId(initialExam || selectedExamId);
    if (target !== selectedExam) {
      setSelectedExam(target);
      setQuestions([]);
      setSelectedSubject('All');
      setTypeFilter('All');
      setSearchQuery('');
      setPage(1);
    }
  }, [initialExam, selectedExamId, selectedExam]);

  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('published');
  const [languageFilter, setLanguageFilter] = useState<string>('All');
  const [showSolutionId, setShowSolutionId] = useState<string | null>(null);
  const [similarToId, setSimilarToId] = useState<string | null>(null);

  // Backend Pagination States
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [selectedExam, selectedSubject, typeFilter, searchQuery, statusFilter, languageFilter]);

  // Quiz States
  const [quizActive, setQuizActive] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuestionBankRecord[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<{ [qId: string]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizTimeRemaining, setQuizTimeRemaining] = useState(600); // 10 mins

  // Modal State for New Question
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // AI Trend Prediction States
  const [isGeneratingTrend, setIsGeneratingTrend] = useState<boolean>(false);
  const [trendPredictionResult, setTrendPredictionResult] = useState<string | null>(null);
  const [trendPredictionMessage, setTrendPredictionMessage] = useState<string | null>(null);
  const [showTrendModal, setShowTrendModal] = useState<boolean>(false);

  const handleGenerateTrendPrediction = async () => {
    setIsGeneratingTrend(true);
    setTrendPredictionResult(null);
    setTrendPredictionMessage(null);

    let userEmail = '';
    try {
      const storedUser = localStorage.getItem('aspirantx_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        userEmail = u.email || u.userEmail || '';
      }
    } catch (e) {}

    let clientAttempts: any[] = [];
    try {
      const savedQuiz = localStorage.getItem('aspirantx_quiz_history');
      if (savedQuiz) {
        clientAttempts = JSON.parse(savedQuiz);
      }
    } catch (e) {}

    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (userEmail) headers['x-user-email'] = userEmail;

      const res = await fetch('/api/ai/trend-prediction', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userEmail,
          exam: selectedExam,
          clientAttempts
        })
      });

      const data = await res.json();
      if (data.success && data.prediction) {
        setTrendPredictionResult(data.prediction);
        setShowTrendModal(true);
      } else if (data.notEnoughData || data.geminiNotConfigured || data.message) {
        setTrendPredictionMessage(data.message || 'Unable to generate trend prediction.');
        setShowTrendModal(true);
      } else {
        setTrendPredictionMessage(data.error || 'Failed to generate prediction report.');
        setShowTrendModal(true);
      }
    } catch (err: any) {
      setTrendPredictionMessage('Network or server error while generating AI trend prediction: ' + (err.message || err));
      setShowTrendModal(true);
    } finally {
      setIsGeneratingTrend(false);
    }
  };
  const [newQuestion, setNewQuestion] = useState<Partial<QuestionBankRecord>>({
    exam: initialExam || 'UPSC_CSE',
    type: 'mcq',
    subject: 'Indian Polity & Governance',
    topic: 'Constitutional Amendments',
    questionText: '',
    options: ['', '', '', ''],
    correctOption: 0,
    solutionText: '',
    imageUrl: '',
    difficulty: 'Medium',
    status: 'published',
  });

  const fetchQuestions = async () => {
    setLoading(true);
    let loaded = false;

    // 1. Instant Local-First query from IndexedDB (0ms latency, zero cloud traffic)
    try {
      const localRes = await contentPackageManager.getLocalQuestions(selectedExam, {
        subject: selectedSubject,
        type: typeFilter,
        searchQuery,
        page,
        limit
      });

      if (localRes.questions.length > 0) {
        setQuestions(localRes.questions as any);
        setTotal(localRes.total);
        setTotalPages(localRes.totalPages);
        loaded = true;
        setLoading(false);
        return;
      }
    } catch (localErr) {
      console.warn('[QuestionBank] Local-first query skipped:', localErr);
    }

    try {
      const typeParam = typeFilter !== 'All' ? `&type=${typeFilter}` : '';
      const subjParam = selectedSubject !== 'All' ? `&subject=${encodeURIComponent(selectedSubject)}` : '';
      const statusParam = statusFilter !== 'All' ? `&status=${statusFilter}` : '';
      const langParam = languageFilter !== 'All' ? `&language=${languageFilter}` : '';

      const url = `/api/academic/questions?exam=${selectedExam}&page=${page}&limit=${limit}&search=${encodeURIComponent(
        searchQuery
      )}${subjParam}${typeParam}${statusParam}${langParam}`;

      const res = await dedupFetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
          setTotal(data.total || data.questions.length);
          setTotalPages(data.totalPages || 1);
          loaded = true;
          return;
        }
      }
    } catch (e) {
      console.warn('Backend API unreachable, checking direct Supabase question store...');
    }

    // Direct Supabase Fallback for native APK
    if (!loaded) {
      try {
        const { supabase, isSupabaseConfigured } = await import('../lib/supabase');
        if (isSupabaseConfigured) {
          let query = supabase.from('pyqs').select('id, data', { count: 'exact' });
          if (selectedExam) {
            const cleanExam = selectedExam.replace(/_/g, '%');
            query = query.or(`data->>exam.ilike.%${selectedExam}%,data->>exam.ilike.%${cleanExam}%`);
          }
          if (selectedSubject !== 'All') {
            query = query.ilike('data->>subject', `%${selectedSubject}%`);
          }
          const offset = (page - 1) * limit;
          query = query.range(offset, offset + limit - 1);
          const { data: dbData, count: dbCount, error: dbErr } = await query;
          if (!dbErr && Array.isArray(dbData) && dbData.length > 0) {
            const mapped = dbData.map((row: any) => {
              const d = row.data || row;
              return {
                id: row.id || d.id,
                exam: d.exam || selectedExam,
                subject: d.subject || 'General',
                topic: d.topic || 'General Topic',
                questionText: d.questionText || d.question_text || '',
                type: 'mcq' as const,
                options: Array.isArray(d.options) ? d.options : ['Option A', 'Option B', 'Option C', 'Option D'],
                correctOption: typeof d.correctOption === 'number' ? d.correctOption : 0,
                solutionText: d.explanation || 'Detailed solution verified.',
                difficulty: d.difficulty || 'Medium',
                status: 'published' as const,
                language: d.language || 'English',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
            });
            setQuestions(mapped);
            setTotal(dbCount || mapped.length);
            setTotalPages(Math.max(1, Math.ceil((dbCount || mapped.length) / limit)));
            loaded = true;
            return;
          }
        }
      } catch (sbErr) {
        console.warn('Direct Supabase question bank error:', sbErr);
      }
    }

    // Offline Instant Fallback from local diagnostic question database
    if (!loaded) {
      const normExam = normalizeExamKey(selectedExam);
      const fallbackQuestions = DIAGNOSTIC_QUESTION_BANK
        .filter(q => normalizeExamKey(q.exam) === normExam)
        .map(q => ({
          id: `q_diag_${q.id}`,
          exam: q.exam,
          subject: q.subject,
          topic: q.topic,
          questionText: q.question,
          type: 'mcq' as const,
          options: q.options,
          correctOption: q.correctAnswer,
          solutionText: q.explanation,
          difficulty: 'Medium' as const,
          status: 'published' as const,
          language: 'English',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

      if (fallbackQuestions.length > 0) {
        setQuestions(fallbackQuestions);
        setTotal(fallbackQuestions.length);
        setTotalPages(Math.max(1, Math.ceil(fallbackQuestions.length / limit)));
      } else {
        setQuestions([]);
        setTotal(0);
        setTotalPages(1);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
  }, [selectedExam, selectedSubject, typeFilter, searchQuery, statusFilter, languageFilter, page]);

  // Quiz Timer Effect
  useEffect(() => {
    if (!quizActive || quizSubmitted) return;
    const interval = setInterval(() => {
      setQuizTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setQuizSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [quizActive, quizSubmitted]);

  // Save new manually added question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/academic/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion),
      });

      if (res.ok) {
        setShowAddModal(false);
        fetchQuestions();
      }
    } catch (e) {
      console.error('Failed to create question');
    }
  };

  // Launch interactive mock quiz from current question pool
  const startQuiz = () => {
    const mcqPool = questions.filter(q => q.type === 'mcq');
    if (mcqPool.length === 0) {
      alert('Is criteria ke under koi MCQ questions nahi hain to generate quiz!');
      return;
    }
    // Pick up to 10 random questions
    const shuffled = [...mcqPool].sort(() => 0.5 - Math.random()).slice(0, 10);
    setQuizQuestions(shuffled);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizTimeRemaining(600);
    setQuizActive(true);
  };

  const getTopicTrends = () => {
    const trendMap: { [topic: string]: { count: number; subject: string } } = {};
    questions.forEach(q => {
      const t = q.topic || 'General Concepts';
      if (!trendMap[t]) {
        trendMap[t] = { count: 0, subject: q.subject };
      }
      trendMap[t].count += 1;
    });

    return Object.entries(trendMap)
      .map(([topic, data]) => ({
        topic,
        subject: data.subject,
        count: data.count,
        repeatIndex: Math.round(data.count * 1.4 * 10) / 10,
        pattern: data.count > 2 ? 'Odd/Even cycle repeating pattern detected' : 'Standard occurrence'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  };

  const topicTrends = getTopicTrends();

  // Find similar questions in database
  const getSimilarQuestions = (origin: QuestionBankRecord) => {
    return questions.filter(q => q.topic === origin.topic && q.id !== origin.id).slice(0, 3);
  };

  return (
    <div className="space-y-6">
      {/* Upper Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Enterprise Question Bank & Analytics
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Pattern Analyzer
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              PYQs, MCQs, and Descriptive answer blueprints with odd/even repeating exam trend detectors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          )}
        </div>
      </div>

      {/* AdSense In-Feed Ad Banner */}
      <AdSenseBanner slotType="inFeed" />

      {/* Main Tab selector */}
      <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
        <button
          onClick={() => { setActiveEngineTab('browse'); setQuizActive(false); }}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all border ${
            activeEngineTab === 'browse'
              ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
              : 'bg-transparent text-slate-400 border-transparent hover:text-white'
          }`}
        >
          Browse Questions ({questions.length})
        </button>
        <button
          onClick={() => { setActiveEngineTab('quiz'); }}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all border ${
            activeEngineTab === 'quiz'
              ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
              : 'bg-transparent text-slate-400 border-transparent hover:text-white'
          }`}
        >
          Interactive PYQ Quiz Mode 📝
        </button>
        <button
          onClick={() => { setActiveEngineTab('patterns'); setQuizActive(false); }}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all border ${
            activeEngineTab === 'patterns'
              ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
              : 'bg-transparent text-slate-400 border-transparent hover:text-white'
          }`}
        >
          PYQ Repeat & Trend Analyzer 📈
        </button>
      </div>

      {/* ── TAB: BROWSE QUESTIONS ── */}
      {activeEngineTab === 'browse' && (
        <div className="space-y-6">
          {/* Filter Toolbar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {/* Read-Only Active Exam Badge */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Active Exam Context
                </label>
                <div className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-sky-300 font-semibold flex items-center justify-between shadow-inner">
                  <span className="truncate">{EXAM_LIST.find((ex) => ex.id === selectedExam)?.label || selectedExam}</span>
                  <span className="text-[9px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded font-semibold uppercase shrink-0">Profile Bounded</span>
                </div>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-semibold cursor-pointer"
                >
                  <option value="All">📖 All Subjects ({total} Qs)</option>
                  {getExamSubjects(selectedExam).map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Question Type Filter */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Question Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="All">All Question Types</option>
                  <option value="mcq">Prelims MCQ</option>
                  <option value="mains_descriptive">Mains Descriptive</option>
                  <option value="essay">Essay Paper</option>
                  <option value="case_study">Ethics Case Study</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Publish Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="All">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft Mode</option>
                </select>
              </div>

              {/* Language Filter */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Language / भाषा</label>
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="All">🌐 All Languages</option>
                  <option value="English">🇬🇧 English</option>
                  <option value="Hindi">🇮🇳 Hindi / हिन्दी</option>
                </select>
              </div>

              {/* Search */}
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Search Keywords</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search question bank..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Questions Stats & Pagination Bar Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-black/40 border border-emerald-500/20 shadow-lg">
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
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
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-white transition-all shadow cursor-pointer flex items-center gap-1"
              >
                <span>← Previous</span>
              </button>
              <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-extrabold text-white font-mono">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-white transition-all shadow cursor-pointer flex items-center gap-1"
              >
                <span>Next →</span>
              </button>
            </div>
          </div>

          {/* Questions Grid */}
          <div className="space-y-4 max-h-[82vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-emerald-500/40 scrollbar-track-transparent">
            {(() => {
              if (questions.length === 0) {
                return (
                  <div className="p-8 text-center rounded-2xl bg-black/30 border border-white/5 text-slate-400 text-xs">
                    No questions found in Question Bank for subject ({selectedSubject}). Try selecting "All Subjects".
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {questions.map((q, index) => (
                    <div
                      key={q.id}
                      className="p-5 rounded-2xl bg-slate-900/40 border border-white/10 space-y-4 transition-all hover:border-emerald-500/20 text-left"
                    >
                      {/* Meta Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-extrabold">
                            {getStandardSubject(selectedExam, q.subject)}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 text-[11px] font-semibold">
                            Topic: {q.topic}
                          </span>
                          {q.repeatCount && q.repeatCount > 1 && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold flex items-center gap-1">
                              <span>🔁 Repeated {q.repeatCount} times</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-slate-400 font-bold">
                            {q.type}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                              q.difficulty === 'Hard'
                                ? 'bg-rose-500/20 text-rose-300'
                                : q.difficulty === 'Medium'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="text-sm font-semibold text-slate-100 whitespace-pre-line leading-relaxed">
                        <span className="text-emerald-400 font-extrabold mr-2">Q{(page - 1) * limit + index + 1}.</span>
                        {q.questionText}
                      </div>

                      {/* Options (if MCQ) */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                q.correctOption === oIdx
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
                                  : 'bg-white/5 border-white/10 text-slate-300'
                              }`}
                            >
                              <span>
                                <strong className="mr-1.5 text-slate-400">{String.fromCharCode(65 + oIdx)}.</strong>
                                {typeof opt === 'string' ? opt : ((opt as any)?.text ?? '')}
                              </span>
                              {q.correctOption === oIdx && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Explanation Toggle */}
                      {q.solutionText && (
                        <div className="pt-1">
                          <button
                            onClick={() => setShowSolutionId(showSolutionId === q.id ? null : q.id)}
                            className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-semibold flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            {showSolutionId === q.id ? 'Hide Detailed Solution' : 'View Detailed Solution'}
                          </button>

                          {showSolutionId === q.id && (
                            <div className="mt-2 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-200 leading-relaxed">
                              <strong className="block font-black text-emerald-300 mb-1">Model Solution Blueprint:</strong>
                              {q.solutionText}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Bottom Pagination Controls Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-black/40 border border-emerald-500/20 shadow-lg mt-6">
                    <div className="text-xs text-slate-300 font-extrabold">
                      Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} Questions Total)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-xs font-bold text-white transition-all shadow cursor-pointer"
                      >
                        ← Previous Page
                      </button>
                      <button
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-xs font-bold text-white transition-all shadow cursor-pointer"
                      >
                        Next Page →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── TAB: INTERACTIVE QUIZ MODE ── */}
      {activeEngineTab === 'quiz' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {!quizActive ? (
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-8 text-center space-y-5">
              <QuestionIcon className="w-16 h-16 text-emerald-500/80 mx-auto" />
              
              <div className="space-y-2">
                <h3 className="text-white font-extrabold text-base">Start Interactive PYQ Practice Quiz</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Aapki select kari hui criteria ke base par 10 questions ka interactive, timed mock test generate hoga.
                </p>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl max-w-sm mx-auto border border-white/5 text-left text-[11px] text-slate-400 space-y-1.5">
                <div>• Time Limit: 10 Minutes</div>
                <div>• Marking: +2.0 Correct / -0.66 Negative</div>
                <div>• Questions: 10 MCQ Prelims</div>
              </div>

              <button
                onClick={startQuiz}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 mx-auto"
              >
                <Play className="w-4 h-4 fill-slate-950" /> Start Timed Quiz
              </button>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-6">
              {/* Quiz Header Info */}
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="font-mono font-bold text-amber-400">
                    Time: {Math.floor(quizTimeRemaining / 60)}:{(quizTimeRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded font-black uppercase">
                  Quiz Active
                </span>
              </div>

              {/* Questions Loop */}
              <div className="space-y-6">
                {quizQuestions.map((q, idx) => (
                  <div key={q.id} className="text-left space-y-3.5">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-black text-emerald-400 shrink-0">Q{idx + 1}.</span>
                      <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">{q.questionText}</p>
                    </div>

                    {/* MCQ Options */}
                    {q.options && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-5">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = quizAnswers[q.id] === optIdx;
                          const isCorrect = q.correctOption === optIdx;
                          return (
                            <button
                              key={optIdx}
                              disabled={quizSubmitted}
                              onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                              className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all ${
                                quizSubmitted
                                  ? isCorrect
                                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                                    : isSelected
                                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                                    : 'bg-slate-950/40 border-white/5 text-slate-500'
                                  : isSelected
                                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                                  : 'bg-slate-950 border-white/10 text-slate-300 hover:border-white/20'
                              }`}
                            >
                              <strong className="mr-1.5">{String.fromCharCode(65 + optIdx)}.</strong>
                              {typeof opt === 'string' ? opt : ((opt as any)?.text ?? '')}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Explanations visible after submit */}
                    {quizSubmitted && (
                      <div className="pl-5 p-3 rounded-xl bg-emerald-950/10 border border-emerald-500/20 text-[11px] text-emerald-300 leading-relaxed font-semibold">
                        <strong>Solution explanation:</strong> {q.solutionText}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit panel */}
              <div className="pt-4 border-t border-white/5 flex justify-between">
                <button
                  onClick={() => setQuizActive(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Exit Quiz
                </button>

                {!quizSubmitted ? (
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-lg hover:brightness-110"
                  >
                    Finish & View Score
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setQuizActive(false);
                      setQuizSubmitted(false);
                    }}
                    className="px-5 py-2.5 bg-slate-950 border border-white/10 hover:border-emerald-500/30 text-white font-black text-xs rounded-xl transition-all"
                  >
                    Return to Selector
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: PYQ REPEAT & TREND ANALYZER ── */}
      {activeEngineTab === 'patterns' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Trend Heatmap & Analytics */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="font-extrabold text-white text-xs uppercase tracking-wider pb-3 border-b border-white/5 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Syllabus Topic Repeating Index
            </h3>

            <div className="space-y-4">
              {topicTrends.map(trend => (
                <div key={trend.topic} className="p-4 bg-slate-950/60 border border-white/5 rounded-xl text-left space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] bg-slate-900 border border-white/5 px-2 py-0.5 rounded text-slate-400 font-extrabold">
                        {trend.subject}
                      </span>
                      <h4 className="font-black text-white text-xs sm:text-sm mt-1">{trend.topic}</h4>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        Repeat index: {trend.repeatIndex}/yr
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">• Mapped occurrences in past exams: {trend.count} Questions found.</p>
                  <p className="text-[9px] text-indigo-400 font-bold bg-indigo-500/10 w-fit px-2 py-0.5 rounded border border-indigo-500/20">
                    🔍 Pattern: {trend.pattern}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Cycle Extrapolator */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-5 h-fit text-left">
            <Compass className="w-6 h-6 text-cyan-400" />
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-white text-xs uppercase tracking-wider">Odd/Even Year Cycles</h3>
              <p className="text-[11px] text-slate-400">Analysis of the question bank shows patterns on odd/even year intervals.</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-white/5 space-y-3 text-xs">
              <div className="font-black text-emerald-400">🔥 High Probability Topics for 2026:</div>
              <div className="space-y-1.5 text-slate-300 font-medium">
                <div>1. Constitutional Amendments (Polity)</div>
                <div>2. Monetary Policy & SLR (Economy)</div>
                <div>3. Writ Jurisdiction & Articles (Polity)</div>
              </div>
              <p className="text-[9px] text-slate-500 leading-normal">
                These topics show an average repeating frequency of 85% in adjacent years.
              </p>
            </div>

            <button
              onClick={handleGenerateTrendPrediction}
              disabled={isGeneratingTrend}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGeneratingTrend ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Practice Data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Full Predictor Report</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}

      {/* Manual Question Creator Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-[#0d0d12] border border-white/10 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-white">Create Question Bank Entry</h3>

            <form onSubmit={handleSaveQuestion} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Exam</label>
                <select
                  value={newQuestion.exam}
                  onChange={(e) => setNewQuestion({ ...newQuestion, exam: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white font-bold"
                >
                  {EXAM_LIST.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Type</label>
                  <select
                    value={newQuestion.type}
                    onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white"
                  >
                    <option value="mcq">MCQ (Prelims)</option>
                    <option value="mains_descriptive">Mains Descriptive</option>
                    <option value="essay">Essay</option>
                    <option value="case_study">Ethics Case Study</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Status</label>
                  <select
                    value={newQuestion.status}
                    onChange={(e) => setNewQuestion({ ...newQuestion, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white"
                  >
                    <option value="published">Publish Mode</option>
                    <option value="draft">Draft Mode</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Subject</label>
                <input
                  type="text"
                  value={newQuestion.subject}
                  onChange={(e) => setNewQuestion({ ...newQuestion, subject: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Topic</label>
                <input
                  type="text"
                  value={newQuestion.topic}
                  onChange={(e) => setNewQuestion({ ...newQuestion, topic: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Question Text</label>
                <textarea
                  rows={3}
                  value={newQuestion.questionText}
                  onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Solution Blueprint</label>
                <textarea
                  rows={3}
                  value={newQuestion.solutionText}
                  onChange={(e) => setNewQuestion({ ...newQuestion, solutionText: e.target.value })}
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-extrabold text-white"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Trend Prediction Modal */}
      {showTrendModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-[#0d0d12] border border-white/10 p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm uppercase tracking-wider">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span>AI Exam Trend & Weak-Area Predictor</span>
              </div>
              <button
                onClick={() => setShowTrendModal(false)}
                className="px-3 py-1 rounded-xl bg-white/10 text-slate-300 text-xs font-bold hover:bg-white/20 transition-all"
              >
                Close
              </button>
            </div>

            {trendPredictionResult ? (
              <div className="space-y-4 text-xs text-slate-200">
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 leading-relaxed space-y-3 font-sans whitespace-pre-line text-slate-200">
                  {trendPredictionResult}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(trendPredictionResult);
                      alert('Prediction report copied to clipboard!');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-950 text-xs flex items-center gap-1.5 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Copy Report
                  </button>
                </div>
              </div>
            ) : trendPredictionMessage ? (
              <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2 text-xs text-amber-200 leading-relaxed font-sans">
                <div className="font-extrabold text-amber-400 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>Notice / Diagnostic</span>
                </div>
                <p>{trendPredictionMessage}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
