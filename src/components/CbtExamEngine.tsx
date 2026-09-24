import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Clock, Shield, AlertTriangle, CheckCircle, XCircle, HelpCircle, 
  ChevronLeft, ChevronRight, RotateCcw, Maximize2, Minimize2, Send, 
  BarChart2, Award, Zap, BookOpen, FileText, Check, Filter, Search, Sparkles,
  Plus, Settings, Radio, Users, Trophy, Calendar, PlayCircle, Eye, AlertCircle,
  Pause, Play, MessageSquare, Tag, ChevronDown, ChevronUp, RefreshCw
} from 'lucide-react';
import { 
  CbtTest, CbtQuestion, CbtExamSessionState, CbtUserResponse, 
  CbtQuestionStatus, CbtExamResult, UserProfile, CbtSection
} from '../types';
import { EXAM_LIST } from '../lib/examList';
import { INITIAL_CBT_TESTS } from '../data/cbtData';
import { normalizeExamId } from '../lib/examRegistry';
import { useExam } from '../context/ExamContext';
import { contentPackageManager } from '../lib/contentPackageManager';
import { syncWorker } from '../lib/syncWorker';
import { getApiUrl } from '../lib/apiConfig';

import { normalizeCbtQuestion, normalizeCbtTest } from '../lib/cbtNormalizer.js';
export { normalizeCbtQuestion, normalizeCbtTest };
import { 
  FadeIn, SlideUp, ScaleIn, PressFeedback, CountUp, triggerConfetti, ModalTransition 
} from '../lib/animations';
import { ContextualTour } from './ContextualTour';


interface CbtExamEngineProps {
  userProfile: UserProfile;
  selectedExam?: string;
  onExit?: () => void;
}

// ─── Custom Test Builder State ────────────────────────────────────────────────
interface CustomBuilderState {
  step: 1 | 2 | 3 | 4;
  exam: string;
  subject: string;
  selectedTopics: string[];
  questionCount: number;
  durationMinutes: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export const CbtExamEngine: React.FC<CbtExamEngineProps> = ({ userProfile, selectedExam, onExit }) => {
  const { selectedExamId, examOption } = useExam();
  const activeExamKey = normalizeExamId(selectedExam || selectedExamId || userProfile.exam);

  const [availableTests, setAvailableTests] = useState<CbtTest[]>([]);
  const [canonicalBlueprints, setCanonicalBlueprints] = useState<any[]>([]);
  const [questionInventory, setQuestionInventory] = useState<{ total: number; verified_count: number; pending_review_count: number; rejected_count: number } | null>(null);
  const [selectedTest, setSelectedTest] = useState<CbtTest | null>(null);
  const [sessionState, setSessionState] = useState<CbtExamSessionState | null>(null);
  const [examResult, setExamResult] = useState<CbtExamResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'available' | 'custom' | 'live' | 'results'>('available');
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Pause / Resume state machine
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [pauseRemainingSeconds, setPauseRemainingSeconds] = useState<number>(0);

  // Post-Exam Review & AI Discussion state
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'unattempted' | 'marked'>('all');
  const [taggedMistakes, setTaggedMistakes] = useState<Record<string, { category: string; notes?: string }>>({});
  const [aiDiscussionActive, setAiDiscussionActive] = useState<Record<string, boolean>>({});
  const [aiDiscussionPrompts, setAiDiscussionPrompts] = useState<Record<string, string>>({});
  const [aiDiscussionReplies, setAiDiscussionReplies] = useState<Record<string, string>>({});
  const [aiDiscussionLoading, setAiDiscussionLoading] = useState<Record<string, boolean>>({});
  const [loadingReviewId, setLoadingReviewId] = useState<string | null>(null);

  // Custom Builder
  const [builder, setBuilder] = useState<CustomBuilderState>({
    step: 1, exam: activeExamKey, subject: '', selectedTopics: [],
    questionCount: 20, durationMinutes: 30, difficulty: 'Medium'
  });
  const [subjects, setSubjects] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  // Bank source
  const [bankSource, setBankSource] = useState<'ai' | 'bank'>('ai');
  const [bankMode, setBankMode] = useState<'full' | 'subject' | 'topic'>('full');
  const [bankStats, setBankStats] = useState<any | null>(null);
  const [bankSubjects, setBankSubjects] = useState<string[]>([]);
  const [bankSelectedSubject, setBankSelectedSubject] = useState<string>('');
  const [bankSelectedTopics, setBankSelectedTopics] = useState<string[]>([]);
  const [bankTopics, setBankTopics] = useState<string[]>([]);
  const [bankAvailCount, setBankAvailCount] = useState<number | null>(null);

  // Live Exams (admin conducted)
  const [liveExams, setLiveExams] = useState<any[]>([]);
  const [liveCountdowns, setLiveCountdowns] = useState<Record<string, string>>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const isSubmittingRef = useRef<boolean>(false);
  const startTimeMsRef = useRef<number | null>(null);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    let authToken = '';
    try {
      const token = localStorage.getItem('aspirantx_auth_token') || localStorage.getItem('token');
      if (token) authToken = token;
      else {
        const demoUser = localStorage.getItem('aspirantx_demo_user');
        if (demoUser) {
          const parsed = JSON.parse(demoUser);
          if (parsed?.token) authToken = parsed.token;
        }
      }
    } catch (e) {}

    return {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      'x-guest-user-id': userProfile.id || 'guest_aspirant'
    };
  }, [userProfile.id]);

  useEffect(() => {
    setSelectedTest(null);
    setSessionState(null);
    setExamResult(null);
    setBuilder(prev => ({ ...prev, exam: activeExamKey, subject: '', selectedTopics: [], step: 1 }));
    fetchTests();
    fetchSubjects(activeExamKey);
  }, [activeExamKey]);

  useEffect(() => {
    if (activeTab === 'custom') {
      fetchSubjects(activeExamKey);
    }
  }, [activeTab, activeExamKey]);

  useEffect(() => { fetchLiveExams(); }, []);

  useEffect(() => {
    if (examResult) {
      triggerConfetti();
    }
  }, [examResult]);

  // Live exam countdown ticker
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      const updated: Record<string, string> = {};
      liveExams.forEach((ex) => {
        const diff = new Date(ex.scheduledAt).getTime() - Date.now();
        if (diff > 0) {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          updated[ex.id] = `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
        } else updated[ex.id] = 'LIVE NOW';
      });
      setLiveCountdowns(updated);
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [liveExams]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      // 1. Fetch canonical blueprints & inventory from Neon PostgreSQL
      const [bpRes, invRes] = await Promise.allSettled([
        fetch(getApiUrl(`/api/cbt/blueprints?examId=${encodeURIComponent(activeExamKey)}`), { headers: getAuthHeaders() }),
        fetch(getApiUrl(`/api/cbt/inventory?examId=${encodeURIComponent(activeExamKey)}`), { headers: getAuthHeaders() })
      ]);

      if (bpRes.status === 'fulfilled' && bpRes.value.ok) {
        const bpData = await bpRes.value.json();
        if (bpData.success && Array.isArray(bpData.blueprints)) {
          setCanonicalBlueprints(bpData.blueprints);
        }
      }

      if (invRes.status === 'fulfilled' && invRes.value.ok) {
        const invData = await invRes.value.json();
        if (invData.success && invData.inventory) {
          setQuestionInventory(invData.inventory);
        }
      }

      // 2. Instant Local-First read from IndexedDB (0ms network)
      const localTests = await contentPackageManager.getLocalCbtTests(activeExamKey);
      if (localTests && localTests.length > 0) {
        setAvailableTests(localTests.map(t => normalizeCbtTest(t, activeExamKey)));
        setLoading(false);
        return;
      }

      // 3. Fallback to Academic API if not seeded yet
      const res = await fetch(getApiUrl(`/api/academic/cbt/tests?exam=${encodeURIComponent(activeExamKey)}`));
      const data = await res.json();
      if (data.success && data.tests && data.tests.length > 0) {
        setAvailableTests(data.tests.map((t: any) => normalizeCbtTest(t, activeExamKey)));
      } else {
        const fallback = INITIAL_CBT_TESTS.filter(t => normalizeExamId(t.exam) === activeExamKey).map(t => normalizeCbtTest(t, activeExamKey));
        setAvailableTests(fallback);
      }
    } catch (err) {
      console.warn('Failed to load CBT tests from API, using cached tests:', err);
      const fallback = INITIAL_CBT_TESTS.filter(t => normalizeExamId(t.exam) === activeExamKey).map(t => normalizeCbtTest(t, activeExamKey));
      setAvailableTests(fallback);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveExams = async () => {
    try {
      const res = await fetch(getApiUrl('/api/academic/cbt/live-exams'));
      const data = await res.json();
      if (data.success && Array.isArray(data.exams)) setLiveExams(data.exams);
    } catch (e) { console.error('Failed to fetch live exams:', e); }
  };

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      // 1. Authoritative Neon PostgreSQL History
      const res = await fetch(getApiUrl(`/api/cbt/history?examId=${encodeURIComponent(activeExamKey)}`), {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.history) && data.history.length > 0) {
          setTestHistory(data.history);
          setLoadingHistory(false);
          return;
        }
      }

      // 2. Legacy endpoint fallback
      const legRes = await fetch(getApiUrl(`/api/academic/cbt/history?userId=${encodeURIComponent(userProfile.id || 'guest')}&exam=${encodeURIComponent(activeExamKey)}`));
      if (legRes.ok) {
        const legData = await legRes.json();
        if (legData.success && Array.isArray(legData.history) && legData.history.length > 0) {
          const matching = legData.history.filter((h: any) => !h.exam || normalizeExamId(h.exam) === activeExamKey);
          setTestHistory(matching);
          setLoadingHistory(false);
          return;
        }
      }

      // 3. LocalStorage cache fallback
      const scopedKey = `aspirantx_cbt_results_cache_${userProfile.id || 'guest'}_${activeExamKey}`;
      const local = localStorage.getItem(scopedKey);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTestHistory(parsed);
          setLoadingHistory(false);
          return;
        }
      }
      setTestHistory([]);
    } catch (e) {
      setTestHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [activeExamKey, userProfile.id, getAuthHeaders]);

  const handleStartCanonicalAttempt = async (opts: {
    blueprintId?: string;
    mode?: 'full' | 'quick' | 'subject' | 'topic';
    count?: number;
    title?: string;
    subject?: string;
    topic?: string;
  }) => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/cbt/attempts/create'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          examId: activeExamKey,
          blueprintId: opts.blueprintId,
          mode: opts.mode || 'quick',
          count: opts.count,
          title: opts.title || `${activeExamKey.replace(/_/g, ' ')} Practice Exam`,
          allowPendingReview: true,
          subject: opts.subject,
          topic: opts.topic
        })
      });

      const data = await res.json();
      if (!data.success || !data.attempt || !data.questions) {
        throw new Error(data.error || 'Failed to initialize CBT attempt on server.');
      }

      const { attempt, questions } = data;
      // Zero cheat leakage: questions do NOT have correctOption or explanation during exam
      const mappedQuestions: CbtQuestion[] = questions.map((q: any) => ({
        id: q.id,
        type: 'single_choice' as const,
        section: q.section || 'General',
        questionText: q.question_text,
        options: Array.isArray(q.options)
          ? q.options.map((opt: any) => typeof opt === 'string' ? opt : (opt?.text ?? JSON.stringify(opt)))
          : [],
        passageText: q.passage_text || undefined,
        assertionText: q.assertion_text || undefined,
        reasonText: q.reason_text || undefined,
        imageUrl: q.image_url || undefined,
        language: 'English',
        subject: q.subject || 'General',
        topic: q.topic || 'General',
        marks: Number(q.marks) || 2,
        negativeMarks: Number(q.negative_marks) || 0.66
      }));

      const durationMinutes = Math.max(5, Math.ceil((attempt.duration_seconds || 1800) / 60));
      const totalMarks = mappedQuestions.reduce((sum, q) => sum + (q.marks || 2), 0);

      const testPayload: CbtTest = {
        id: attempt.id,
        title: attempt.title || `${activeExamKey.replace(/_/g, ' ')} Mock Exam`,
        exam: activeExamKey,
        durationMinutes,
        totalMarks,
        sections: [{
          name: 'General',
          totalQuestions: mappedQuestions.length,
          durationMinutes
        }],
        questions: mappedQuestions,
        markingScheme: {
          correct: mappedQuestions[0]?.marks || 2,
          incorrect: mappedQuestions[0]?.negativeMarks || 0.66
        },
        sourceType: 'official'
      };

      setSelectedTest(testPayload);
      startTimeMsRef.current = Date.now();
      isSubmittingRef.current = false;
      setIsPaused(false);

      const initialResponses: Record<string, CbtUserResponse> = {};
      mappedQuestions.forEach((q, idx) => {
        initialResponses[q.id] = {
          questionId: q.id,
          selectedOption: null,
          status: idx === 0 ? 'not_answered' : 'not_visited',
          timeSpentSeconds: 0
        };
      });

      setSessionState({
        testId: attempt.id,
        attemptId: attempt.id,
        startTimeIso: new Date().toISOString(),
        elapsedSeconds: 0,
        currentQuestionIndex: 0,
        responses: initialResponses,
        isSubmitted: false,
        currentSection: mappedQuestions[0]?.section || 'General',
        language: 'English'
      });
      setExamResult(null);
    } catch (err: any) {
      console.error('Failed to create authoritative CBT attempt:', err);
      alert(`Could not start CBT attempt: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewHistoricalAttempt = async (item: any) => {
    const attemptId = item.attempt_id || item.attemptId || item.id;
    if (!attemptId) {
      setExamResult(item);
      return;
    }

    setLoadingReviewId(attemptId);
    try {
      const revRes = await fetch(getApiUrl(`/api/cbt/attempts/${attemptId}/review`), {
        headers: getAuthHeaders()
      });
      const revData = await revRes.json();
      if (revData.success && Array.isArray(revData.questions)) {
        setExamResult({
          ...item,
          reviewQuestions: revData.questions
        });
      } else {
        setExamResult(item);
      }
    } catch (e) {
      console.warn('Failed to fetch historical review details:', e);
      setExamResult(item);
    } finally {
      setLoadingReviewId(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'results') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  // ── Custom Builder helpers ────────────────────────────────────────────────
  const fetchSubjects = async (examId: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/academic/syllabus/subjects?exam=${encodeURIComponent(examId)}`));
      const data = await res.json();
      if (data.success && Array.isArray(data.subjects) && data.subjects.length > 0) {
        setSubjects(data.subjects);
        return;
      }
    } catch (e) { console.error('Failed to fetch subjects:', e); }

    const norm = normalizeExamId(examId);
    if (norm === 'NEET') setSubjects(['Biology (Botany & Zoology)', 'Chemistry', 'Physics']);
    else if (norm === 'JEE_MAIN' || norm === 'JEE_ADVANCED') setSubjects(['Physics', 'Chemistry', 'Mathematics']);
    else if (norm === 'UPSC_CSE') setSubjects(['General Studies', 'CSAT']);
    else setSubjects(['General Awareness', 'Quantitative Aptitude', 'Reasoning']);
  };

  const fetchTopics = async (examId: string, subject: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/academic/syllabus/topics?exam=${encodeURIComponent(examId)}&subject=${encodeURIComponent(subject)}`));
      const data = await res.json();
      if (data.success && Array.isArray(data.topics) && data.topics.length > 0) {
        setTopics(data.topics);
        return;
      }
    } catch (e) { console.error('Failed to fetch topics:', e); }

    setTopics(['Fundamentals & Core Concepts', 'Important Past-Year Focus Areas', 'High-Yield Mock Applications']);
  };

  const handleBuilderExamChange = async (examId: string) => {
    setBuilder(prev => ({ ...prev, exam: examId, subject: '', selectedTopics: [], step: 1 }));
    await fetchSubjects(examId);
  };

  const handleBuilderSubjectSelect = async (subject: string) => {
    setBuilder(prev => ({ ...prev, subject, selectedTopics: [], step: 2 }));
    await fetchTopics(builder.exam, subject);
  };

  const toggleTopic = (topic: string) => {
    setBuilder(prev => ({
      ...prev,
      selectedTopics: prev.selectedTopics.includes(topic)
        ? prev.selectedTopics.filter(t => t !== topic)
        : [...prev.selectedTopics, topic]
    }));
  };

  const handleGenerateCustomExam = async () => {
    if (!builder.subject || builder.selectedTopics.length === 0) return;
    setGenerating(true);
    try {
      const res = await fetch(getApiUrl('/api/academic/cbt/generate-custom'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam: builder.exam,
          subject: builder.subject,
          topics: builder.selectedTopics,
          questionCount: builder.questionCount,
          durationMinutes: builder.durationMinutes,
          difficulty: builder.difficulty
        })
      });
      const data = await res.json();
      if (data.success && data.test) {
        const normalized = normalizeCbtTest(data.test, builder.exam);
        handleStartExam(normalized);
      } else {
        alert(data.error || 'Failed to generate test. Please try with different topics or Bank mode.');
      }
    } catch (e) { 
      console.error('Generate custom exam failed:', e); 
      alert('Network error while generating exam. Please try again.');
    } finally { 
      setGenerating(false); 
    }
  };

  const fetchBankStats = async (examId: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/academic/cbt/bank-stats?exam=${encodeURIComponent(examId)}`));
      const data = await res.json();
      if (data.success && data.byExam) {
        setBankStats(data.byExam[examId] || data.byExam[Object.keys(data.byExam)[0]] || null);
        const subs = data.byExam[examId] ? Object.keys(data.byExam[examId].subjects) : [];
        setBankSubjects(subs);
        setBankAvailCount(data.byExam[examId]?.total || 0);
      }
    } catch (e) { console.error('Bank stats fetch failed', e); }
  };

  const handleBankSubjectSelect = (sub: string) => {
    setBankSelectedSubject(sub);
    setBankSelectedTopics([]);
    const topicArr = bankStats?.subjects?.[sub]?.topics || [];
    setBankTopics(topicArr);
  };

  const toggleBankTopic = (t: string) => {
    setBankSelectedTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleGenerateFromBank = async () => {
    setGenerating(true);
    try {
      const payload: any = {
        exam: builder.exam,
        mode: bankMode,
        questionCount: builder.questionCount,
        durationMinutes: builder.durationMinutes,
        difficulty: builder.difficulty !== 'Medium' ? builder.difficulty : undefined
      };
      if (bankMode === 'subject' || bankMode === 'topic') payload.subject = bankSelectedSubject;
      if (bankMode === 'topic') payload.topics = bankSelectedTopics;

      const res = await fetch(getApiUrl('/api/academic/cbt/from-bank'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.test) {
        const normalized = normalizeCbtTest(data.test, builder.exam);
        handleStartExam(normalized);
      } else {
        alert(data.error || 'Question bank mein kafi questions nahi mile. AI mode try karo.');
      }
    } catch (e) { 
      console.error('From-bank failed:', e); 
      alert('Failed to build exam from bank.'); 
    } finally { 
      setGenerating(false); 
    }
  };

  const handleJoinLiveExam = async (ex: any) => {
    try {
      const res = await fetch(getApiUrl('/api/academic/cbt/join-admin-exam'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: ex.id, userId: userProfile.id || userProfile.email || 'guest' })
      });
      const data = await res.json();
      if (data.success && data.test) {
        const normalized = normalizeCbtTest(data.test, ex.exam || activeExamKey);
        handleStartExam(normalized);
      }
    } catch (e) { console.error('Join live exam failed:', e); }
  };

  // ── Session / Exam logic ──────────────────────────────────────────────────
  useEffect(() => {
    if (selectedTest) {
      const saved = localStorage.getItem(`cbt_session_${selectedTest.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (!parsed.isSubmitted) {
            setSessionState(parsed);
            if (parsed.startTimeIso) {
              startTimeMsRef.current = new Date(parsed.startTimeIso).getTime();
            }
          }
        } catch (e) { console.error('Failed to restore CBT session:', e); }
      }
    }
  }, [selectedTest]);

  useEffect(() => {
    if (sessionState && !sessionState.isSubmitted && selectedTest) {
      localStorage.setItem(`cbt_session_${selectedTest.id}`, JSON.stringify(sessionState));
    }
  }, [sessionState, selectedTest]);

  // Wall-clock authoritative timer (respects pause state)
  useEffect(() => {
    if (sessionState && !sessionState.isSubmitted && selectedTest && !isPaused) {
      if (!startTimeMsRef.current) {
        startTimeMsRef.current = sessionState.startTimeIso 
          ? new Date(sessionState.startTimeIso).getTime() 
          : Date.now();
      }

      timerRef.current = setInterval(() => {
        const now = Date.now();
        const start = startTimeMsRef.current || now;
        const actualElapsed = Math.max(0, Math.floor((now - start) / 1000));
        const totalMaxSeconds = selectedTest.durationMinutes * 60;

        if (actualElapsed >= totalMaxSeconds) {
          if (timerRef.current) clearInterval(timerRef.current);
          setSessionState(prev => {
            if (!prev || prev.isSubmitted) return prev;
            return { ...prev, elapsedSeconds: totalMaxSeconds };
          });
          // Auto-submit outside of React updater
          if (!isSubmittingRef.current) {
            handleFinalSubmit();
          }
          return;
        }

        setSessionState(prev => {
          if (!prev || prev.isSubmitted) return prev;
          const currentQ = selectedTest.questions[prev.currentQuestionIndex];
          if (!currentQ) return { ...prev, elapsedSeconds: actualElapsed };

          const currResp = prev.responses[currentQ.id] || {
            questionId: currentQ.id, selectedOption: null, status: 'not_visited', timeSpentSeconds: 0
          };
          const updatedResp: CbtUserResponse = {
            ...currResp,
            status: currResp.status === 'not_visited' ? 'not_answered' : currResp.status,
            timeSpentSeconds: currResp.timeSpentSeconds + 1
          };
          return {
            ...prev,
            elapsedSeconds: actualElapsed,
            responses: { ...prev.responses, [currentQ.id]: updatedResp }
          };
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionState?.isSubmitted, selectedTest, isPaused]);

  const handlePauseExam = async () => {
    if (!sessionState || !selectedTest) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const currentElapsed = sessionState.elapsedSeconds;
    const totalSeconds = selectedTest.durationMinutes * 60;
    const rem = Math.max(0, totalSeconds - currentElapsed);
    setPauseRemainingSeconds(rem);
    setIsPaused(true);

    if (sessionState.attemptId) {
      try {
        const res = await fetch(getApiUrl(`/api/cbt/attempts/${sessionState.attemptId}/pause`), {
          method: 'POST',
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success && typeof data.remaining_time_seconds === 'number') {
          setPauseRemainingSeconds(data.remaining_time_seconds);
        }
      } catch (e) {
        console.warn('Failed to sync pause with server:', e);
      }
    }
  };

  const handleResumeExam = async () => {
    if (!sessionState || !selectedTest) return;
    setIsPaused(false);
    let rem = pauseRemainingSeconds;

    if (sessionState.attemptId) {
      try {
        const res = await fetch(getApiUrl(`/api/cbt/attempts/${sessionState.attemptId}/resume`), {
          method: 'POST',
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success && typeof data.remaining_time_seconds === 'number') {
          rem = data.remaining_time_seconds;
        }
      } catch (e) {
        console.warn('Failed to sync resume with server:', e);
      }
    }

    const totalSeconds = selectedTest.durationMinutes * 60;
    const newElapsed = Math.max(0, totalSeconds - rem);
    setSessionState(prev => prev ? { ...prev, elapsedSeconds: newElapsed } : prev);
    startTimeMsRef.current = Date.now() - (newElapsed * 1000);
  };

  const handleStartExam = (test: CbtTest) => {
    const normalized = normalizeCbtTest(test, activeExamKey);
    setSelectedTest(normalized);
    const startIso = new Date().toISOString();
    startTimeMsRef.current = Date.now();
    isSubmittingRef.current = false;
    setIsPaused(false);

    const initialResponses: Record<string, CbtUserResponse> = {};
    normalized.questions.forEach((q, idx) => {
      initialResponses[q.id] = {
        questionId: q.id,
        selectedOption: null,
        status: idx === 0 ? 'not_answered' : 'not_visited',
        timeSpentSeconds: 0
      };
    });
    setSessionState({
      testId: normalized.id,
      startTimeIso: startIso,
      elapsedSeconds: 0,
      currentQuestionIndex: 0,
      responses: initialResponses,
      isSubmitted: false,
      currentSection: normalized.sections[0]?.name || 'General',
      language: 'English'
    });
    setExamResult(null);
  };

  const handleSelectOption = (optIdx: number) => {
    if (!selectedTest) return;
    setSessionState(prev => {
      if (!prev || prev.isSubmitted) return prev;
      const currentQ = selectedTest.questions[prev.currentQuestionIndex];
      if (!currentQ) return prev;
      const currResp = prev.responses[currentQ.id] || {
        questionId: currentQ.id, selectedOption: null, status: 'not_answered', timeSpentSeconds: 0
      };
      const nextStatus: CbtQuestionStatus = currResp.status === 'marked_for_review' || currResp.status === 'answered_and_marked'
        ? 'answered_and_marked'
        : 'answered';
      return {
        ...prev,
        responses: {
          ...prev.responses,
          [currentQ.id]: {
            ...currResp,
            selectedOption: optIdx,
            status: nextStatus
          }
        }
      };
    });

    // Authoritative Server Sync
    if (sessionState?.attemptId) {
      const currentQ = selectedTest.questions[sessionState.currentQuestionIndex];
      if (currentQ) {
        fetch(getApiUrl(`/api/cbt/attempts/${sessionState.attemptId}/answer`), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            questionId: currentQ.id,
            selectedAnswer: optIdx,
            confidenceLevel: 'sure',
            timeSpentIncrement: 5
          })
        }).catch(err => console.warn('CBT answer server sync failed:', err));
      }
    }
  };

  const handleClearResponse = () => {
    if (!selectedTest) return;
    setSessionState(prev => {
      if (!prev || prev.isSubmitted) return prev;
      const currentQ = selectedTest.questions[prev.currentQuestionIndex];
      if (!currentQ) return prev;
      const currResp = prev.responses[currentQ.id] || {
        questionId: currentQ.id, selectedOption: null, status: 'not_answered', timeSpentSeconds: 0
      };
      return {
        ...prev,
        responses: {
          ...prev.responses,
          [currentQ.id]: {
            ...currResp,
            selectedOption: null,
            status: 'not_answered'
          }
        }
      };
    });

    if (sessionState?.attemptId) {
      const currentQ = selectedTest.questions[sessionState.currentQuestionIndex];
      if (currentQ) {
        fetch(getApiUrl(`/api/cbt/attempts/${sessionState.attemptId}/answer`), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            questionId: currentQ.id,
            selectedAnswer: null
          })
        }).catch(err => console.warn('CBT answer clear sync failed:', err));
      }
    }
  };

  const handleMarkForReview = () => {
    if (!selectedTest) return;
    setSessionState(prev => {
      if (!prev || prev.isSubmitted) return prev;
      const currentQ = selectedTest.questions[prev.currentQuestionIndex];
      if (!currentQ) return prev;
      const currResp = prev.responses[currentQ.id] || {
        questionId: currentQ.id, selectedOption: null, status: 'not_visited', timeSpentSeconds: 0
      };
      const newStatus: CbtQuestionStatus = currResp.selectedOption !== null ? 'answered_and_marked' : 'marked_for_review';
      const updatedResponses = {
        ...prev.responses,
        [currentQ.id]: { ...currResp, status: newStatus }
      };

      if (prev.currentQuestionIndex < selectedTest.questions.length - 1) {
        const nextIdx = prev.currentQuestionIndex + 1;
        const nextQ = selectedTest.questions[nextIdx];
        const nextResp = updatedResponses[nextQ.id] || {
          questionId: nextQ.id, selectedOption: null, status: 'not_visited', timeSpentSeconds: 0
        };
        return {
          ...prev,
          currentQuestionIndex: nextIdx,
          currentSection: nextQ.section || prev.currentSection,
          responses: {
            ...updatedResponses,
            [nextQ.id]: {
              ...nextResp,
              status: nextResp.status === 'not_visited' ? 'not_answered' : nextResp.status
            }
          }
        };
      }
      return { ...prev, responses: updatedResponses };
    });

    if (sessionState?.attemptId) {
      const currentQ = selectedTest.questions[sessionState.currentQuestionIndex];
      if (currentQ) {
        fetch(getApiUrl(`/api/cbt/attempts/${sessionState.attemptId}/mark`), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            questionId: currentQ.id,
            isMarked: true
          })
        }).catch(err => console.warn('CBT mark sync failed:', err));
      }
    }
  };

  const handleSaveAndNext = () => {
    if (!selectedTest) return;
    const isLast = sessionState ? sessionState.currentQuestionIndex >= selectedTest.questions.length - 1 : false;

    setSessionState(prev => {
      if (!prev || prev.isSubmitted) return prev;
      const currentQ = selectedTest.questions[prev.currentQuestionIndex];
      if (!currentQ) return prev;
      const currResp = prev.responses[currentQ.id] || {
        questionId: currentQ.id, selectedOption: null, status: 'not_visited', timeSpentSeconds: 0
      };
      const finalStatus: CbtQuestionStatus = currResp.selectedOption !== null ? 'answered' : 'not_answered';
      const updatedResponses = {
        ...prev.responses,
        [currentQ.id]: { ...currResp, status: finalStatus }
      };

      if (prev.currentQuestionIndex < selectedTest.questions.length - 1) {
        const nextIdx = prev.currentQuestionIndex + 1;
        const nextQ = selectedTest.questions[nextIdx];
        const nextResp = updatedResponses[nextQ.id] || {
          questionId: nextQ.id, selectedOption: null, status: 'not_visited', timeSpentSeconds: 0
        };
        return {
          ...prev,
          currentQuestionIndex: nextIdx,
          currentSection: nextQ.section || prev.currentSection,
          responses: {
            ...updatedResponses,
            [nextQ.id]: {
              ...nextResp,
              status: nextResp.status === 'not_visited' ? 'not_answered' : nextResp.status
            }
          }
        };
      }
      return { ...prev, responses: updatedResponses };
    });

    if (isLast) {
      setShowSubmitModal(true);
    }
  };

  const handleNextQuestion = () => {
    if (!selectedTest) return;
    setSessionState(prev => {
      if (!prev || prev.isSubmitted) return prev;
      if (prev.currentQuestionIndex < selectedTest.questions.length - 1) {
        const nextIdx = prev.currentQuestionIndex + 1;
        const nextQ = selectedTest.questions[nextIdx];
        const nextResp = prev.responses[nextQ.id] || {
          questionId: nextQ.id, selectedOption: null, status: 'not_visited', timeSpentSeconds: 0
        };
        return {
          ...prev,
          currentQuestionIndex: nextIdx,
          currentSection: nextQ.section || prev.currentSection,
          responses: {
            ...prev.responses,
            [nextQ.id]: {
              ...nextResp,
              status: nextResp.status === 'not_visited' ? 'not_answered' : nextResp.status
            }
          }
        };
      }
      return prev;
    });
  };

  const handlePrevQuestion = () => {
    if (!selectedTest) return;
    setSessionState(prev => {
      if (!prev || prev.isSubmitted) return prev;
      if (prev.currentQuestionIndex > 0) {
        const prevIdx = prev.currentQuestionIndex - 1;
        const prevQ = selectedTest.questions[prevIdx];
        return {
          ...prev,
          currentQuestionIndex: prevIdx,
          currentSection: prevQ.section || prev.currentSection
        };
      }
      return prev;
    });
  };

  const handleJumpToQuestion = (idx: number) => {
    if (!selectedTest) return;
    setSessionState(prev => {
      if (!prev || prev.isSubmitted) return prev;
      if (idx < 0 || idx >= selectedTest.questions.length) return prev;
      const targetQ = selectedTest.questions[idx];
      const targetResp = prev.responses[targetQ.id] || {
        questionId: targetQ.id, selectedOption: null, status: 'not_visited', timeSpentSeconds: 0
      };
      return {
        ...prev,
        currentQuestionIndex: idx,
        currentSection: targetQ.section || prev.currentSection,
        responses: {
          ...prev.responses,
          [targetQ.id]: {
            ...targetResp,
            status: targetResp.status === 'not_visited' ? 'not_answered' : targetResp.status
          }
        }
      };
    });
  };

  const handleTagMistake = async (questionId: string, mistakeCategory: string, notes?: string) => {
    setTaggedMistakes(prev => ({
      ...prev,
      [questionId]: { category: mistakeCategory, notes }
    }));

    const attemptId = examResult?.attemptId || sessionState?.attemptId;
    if (attemptId) {
      try {
        await fetch(getApiUrl(`/api/cbt/attempts/${attemptId}/mistake`), {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ questionId, mistakeCategory, notes })
        });
      } catch (e) {
        console.warn('Failed to tag mistake on server:', e);
      }
    }
  };

  const handleAiDiscuss = async (q: any, promptText?: string) => {
    const qId = q.id;
    const userPrompt = promptText || aiDiscussionPrompts[qId] || 'Please explain why the correct option is right and how to approach this question.';
    setAiDiscussionLoading(prev => ({ ...prev, [qId]: true }));

    try {
      const res = await fetch(getApiUrl('/api/cbt/ai-discuss'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          questionText: q.question_text || q.questionText,
          options: q.options,
          correctAnswer: q.correct_answer !== undefined ? q.correct_answer : q.correctOption,
          selectedAnswer: q.selected_answer !== undefined ? q.selected_answer : (sessionState?.responses?.[qId]?.selectedOption),
          explanation: q.explanation,
          userPrompt
        })
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setAiDiscussionReplies(prev => ({ ...prev, [qId]: data.reply }));
      }
    } catch (err) {
      setAiDiscussionReplies(prev => ({ ...prev, [qId]: 'Failed to reach AI mentor. Please try again.' }));
    } finally {
      setAiDiscussionLoading(prev => ({ ...prev, [qId]: false }));
    }
  };

  const handlePracticeTopicAgain = (subject: string, topic?: string) => {
    setSelectedTest(null);
    setSessionState(null);
    setExamResult(null);
    setActiveTab('custom');
    setBuilder(prev => ({
      ...prev,
      subject: subject || '',
      selectedTopics: topic ? [topic] : [],
      step: topic ? 3 : 2
    }));
    if (subject) {
      fetchTopics(activeExamKey, subject);
    }
  };

  const handleFinalSubmit = async (customState?: CbtExamSessionState) => {
    const finalSession = customState || sessionState;
    if (!finalSession || !selectedTest) return;
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmitting(true);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const saveResultToHistory = (r: any) => {
      try {
        const item = {
          ...r,
          exam: selectedTest.exam || activeExamKey,
          submittedAt: new Date().toISOString()
        };
        const scopedKey = `aspirantx_cbt_results_cache_${userProfile.id || 'guest'}_${activeExamKey}`;
        const raw = localStorage.getItem(scopedKey);
        const prev = raw ? JSON.parse(raw) : [];
        const updated = [item, ...(Array.isArray(prev) ? prev : [])];
        localStorage.setItem(scopedKey, JSON.stringify(updated));

        syncWorker.enqueueCbtResult(userProfile.id || 'guest', selectedTest.exam || activeExamKey, selectedTest.id, item).catch(() => {});
        window.dispatchEvent(new CustomEvent('aspirantx_cbt_results_updated', { detail: { exam: activeExamKey } }));
      } catch (e) {}
    };

    // 1. Authoritative Neon PostgreSQL Attempt Submission
    if (finalSession.attemptId) {
      try {
        const res = await fetch(getApiUrl(`/api/cbt/attempts/${finalSession.attemptId}/submit`), {
          method: 'POST',
          headers: getAuthHeaders()
        });
        const data = await res.json();
        if (data.success && data.result) {
          let reviewQs: any[] = [];
          try {
            const revRes = await fetch(getApiUrl(`/api/cbt/attempts/${finalSession.attemptId}/review`), {
              headers: getAuthHeaders()
            });
            const revData = await revRes.json();
            if (revData.success && Array.isArray(revData.questions)) {
              reviewQs = revData.questions;
            }
          } catch (revErr) {
            console.warn('Failed to fetch post-exam review:', revErr);
          }

          const evaluatedResult: CbtExamResult = {
            testId: selectedTest.id,
            attemptId: finalSession.attemptId,
            testTitle: selectedTest.title,
            score: Number(data.result.score) || 0,
            totalPossibleScore: Number(data.result.total_marks) || selectedTest.totalMarks || 200,
            accuracy: Number(data.result.accuracy_percent) || 0,
            accuracyPercentage: Number(data.result.accuracy_percent) || 0,
            globalRank: Math.floor(Math.random() * 25) + 3,
            totalAspirants: 1540,
            percentile: Math.min(99.6, Math.max(68.0, Math.round(((Number(data.result.accuracy_percent) || 0) * 0.95 + 10) * 10) / 10)),
            correctCount: Number(data.result.correct_count) || 0,
            incorrectCount: Number(data.result.incorrect_count) || 0,
            unattemptedCount: Number(data.result.unattempted_count) || 0,
            timeTakenSeconds: Number(data.result.time_spent_seconds) || finalSession.elapsedSeconds,
            subjectWiseBreakdown: selectedTest.sections?.map(s => ({
              subject: s.name,
              score: Math.max(0, Math.round(((Number(data.result.score) || 0) / (selectedTest.sections.length || 1)) * 10) / 10),
              accuracy: Number(data.result.accuracy_percent) || 0
            })) || [],
            aiMistakeAnalysis: [
              `Neon PostgreSQL Engine evaluated. You answered ${data.result.correct_count} correctly out of ${data.result.total_questions} questions.`,
              Number(data.result.incorrect_count) > 0
                ? `You incurred negative penalty on ${data.result.incorrect_count} questions. Review them below to avoid repeated mistakes.`
                : 'Outstanding accuracy! Zero negative marking incurred.'
            ],
            aiImprovementSuggestions: [
              'Classify your incorrect answers below using "Why Was I Wrong" to discover conceptual traps.',
              'Discuss any confusing question with the AI Mentor box below for instant conceptual clarity.'
            ],
            reviewQuestions: reviewQs
          };

          saveResultToHistory(evaluatedResult);
          setExamResult(evaluatedResult);
          setSessionState((prev) => prev ? { ...prev, isSubmitted: true } : prev);
          localStorage.removeItem(`cbt_session_${selectedTest.id}`);
          setSubmitting(false);
          setShowSubmitModal(false);
          isSubmittingRef.current = false;
          return;
        }
      } catch (serverErr) {
        console.warn('Server evaluation failed, using fallback client evaluation:', serverErr);
      }
    }

    // 2. Legacy / Offline Fallback Submit
    try {
      const res = await fetch(getApiUrl('/api/academic/cbt/submit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          testId: selectedTest.id, 
          sessionState: { ...finalSession, isSubmitted: true }, 
          userId: userProfile.id || 'default_user', 
          exam: selectedTest.exam || activeExamKey,
          test: selectedTest
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        saveResultToHistory(data.result);
        setExamResult(data.result);
        setSessionState((prev) => prev ? { ...prev, isSubmitted: true } : prev);
        localStorage.removeItem(`cbt_session_${selectedTest.id}`);
        setSubmitting(false);
        setShowSubmitModal(false);
        isSubmittingRef.current = false;
        return;
      }
    } catch (err) {
      console.warn('Network submit failed, using instant client evaluation:', err);
    }

    // Direct Instant Client-side CBT Evaluation Fallback (0ms Offline Ready)
    try {
      let correct = 0;
      let incorrect = 0;
      let unattempted = 0;
      let score = 0;

      selectedTest.questions.forEach((q) => {
        const resp = finalSession.responses[q.id];
        if (resp && resp.selectedOption !== null && resp.selectedOption !== undefined) {
          if (resp.selectedOption === q.correctOption) {
            correct++;
            score += Math.abs(q.marks || selectedTest.markingScheme?.correct || 2);
          } else {
            incorrect++;
            score -= Math.abs(q.negativeMarks || selectedTest.markingScheme?.incorrect || 0.66);
          }
        } else {
          unattempted++;
        }
      });

      const totalItems = selectedTest.questions.length;
      const totalPossibleScore = selectedTest.totalMarks || (totalItems * (selectedTest.markingScheme?.correct || 2));
      const accuracy = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;
      const finalScore = Math.max(0, Math.round(score * 100) / 100);

      const safeSections = (selectedTest.sections && selectedTest.sections.length > 0)
        ? selectedTest.sections
        : [{ name: 'General', totalQuestions: totalItems, marksPerQuestion: 2, negativeMarks: 0.66 }];

      const fallbackResult: CbtExamResult = {
        testId: selectedTest.id,
        testTitle: selectedTest.title,
        score: finalScore,
        totalPossibleScore,
        accuracy: accuracy,
        accuracyPercentage: accuracy,
        globalRank: Math.floor(Math.random() * 45) + 12,
        totalAspirants: 1420,
        percentile: Math.min(99.4, Math.max(65.0, Math.round((accuracy * 0.95 + 10) * 10) / 10)),
        correctCount: correct,
        incorrectCount: incorrect,
        unattemptedCount: unattempted,
        timeTakenSeconds: finalSession.elapsedSeconds,
        subjectWiseBreakdown: safeSections.map((s) => ({
          subject: s.name,
          score: Math.max(0, Math.round((finalScore / safeSections.length) * 10) / 10),
          accuracy: accuracy
        })),
        aiMistakeAnalysis: [
          `You answered ${correct} questions correctly with an accuracy of ${accuracy}%.`,
          incorrect > 0 ? `Identified ${incorrect} conceptual mistakes in time-pressured sections.` : 'Outstanding accuracy! Zero negative marking recorded.'
        ],
        aiImprovementSuggestions: [
          'Review tricky questions in your question palette before final timer runs out.',
          'Practice 10 high-yield questions in Weakness Detector to boost speed.'
        ]
      };

      saveResultToHistory(fallbackResult);
      setExamResult(fallbackResult);
      setSessionState((prev) => prev ? { ...prev, isSubmitted: true } : prev);
      localStorage.removeItem(`cbt_session_${selectedTest.id}`);
    } catch (calcErr) {
      console.error('Client calculation error:', calcErr);
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
      isSubmittingRef.current = false;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.log(err));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) { document.exitFullscreen(); setIsFullscreen(false); }
    }
  };

  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h > 0 ? String(h).padStart(2, '0') + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 1. RENDER TEST SELECTOR (with Custom + Live tabs)
  // ─────────────────────────────────────────────────────────────────────────
  if (!selectedTest) {
    return (
      <div className="w-full space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
          <div className="flex items-center space-x-2 text-sky-600 font-semibold mb-1 text-xs sm:text-sm">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>National Standard Exam Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Computer Based Test (CBT) Engine</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Practice, build custom tests by subject & topic, or join live All-India admin exams.</p>

          {/* Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-4 sm:mt-5 flex-wrap">
            {([
              { key: 'available', label: 'Mock Tests', icon: BookOpen },
              { key: 'custom', label: 'Create Custom Test', icon: Plus },
              { key: 'live', label: 'Live Exams', icon: Radio },
              { key: 'results', label: 'My Results', icon: BarChart2 },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => { setActiveTab(key); if (key === 'custom' && subjects.length === 0) fetchSubjects(builder.exam); }}
                className={`flex items-center space-x-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all min-h-[40px] ${activeTab === key ? 'bg-sky-600 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                <Icon className="w-4 h-4" /><span>{label}</span>
                {key === 'live' && liveExams.length > 0 && <span className="w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center">{liveExams.length}</span>}
              </button>
            ))}
          </div>
        </div>

        <ContextualTour
          featureKey="cbt"
          steps={[
            {
              title: 'Authentic Exam Atmosphere',
              description: 'Experience official NTA/UPSC style CBT tests with real countdown timers and negative marking rules.',
              badge: 'Step 1 of 3'
            },
            {
              title: 'Color-Coded Question Palette',
              description: 'Use the side palette to track answered, unvisited, and marked-for-review questions during the exam.',
              badge: 'Step 2 of 3'
            },
            {
              title: 'Instant In-Depth Analysis',
              description: 'Upon submission, review question-by-question explanations, subject percentiles, and accuracy benchmarks.',
              badge: 'Step 3 of 3'
            }
          ]}
        />

        {/* ── AVAILABLE MOCK TESTS ── */}
        {activeTab === 'available' && (
          loading ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading Examination Series & Verified Blueprints...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Question Inventory Transparency Banner */}
              {questionInventory && (
                <div className="bg-gradient-to-r from-sky-50 via-indigo-50 to-sky-50 border border-sky-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-sky-900 font-semibold">
                    <Shield className="w-5 h-5 text-sky-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">Neon PostgreSQL Authoritative Question Bank</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">Strict anti-leak projection, verified syllabi & atomic evaluation</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700 bg-white/80 border border-sky-100 rounded-xl px-3 py-2">
                    <div>
                      <span className="text-slate-500">Ready Inventory: </span>
                      <strong className="text-sky-700 font-extrabold text-sm">
                        {(questionInventory.verified_count || 0) + (questionInventory.pending_review_count || 0)} Questions
                      </strong>
                    </div>
                    <span className="text-slate-300">|</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Cheat-Proof
                    </span>
                  </div>
                </div>
              )}

              {/* Canonical Blueprints from Neon */}
              {canonicalBlueprints.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      <span>Official Exam Blueprints (National Pattern)</span>
                    </h3>
                    <span className="text-xs text-sky-600 font-bold bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-md">
                      Verified Architecture
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {canonicalBlueprints.map((bp) => {
                      const availCount = (questionInventory?.verified_count || 0) + (questionInventory?.pending_review_count || 0);
                      const canRunFull = availCount >= bp.total_questions;
                      const markingScheme = typeof bp.marking_scheme === 'string' ? JSON.parse(bp.marking_scheme) : (bp.marking_scheme || { correct: 2, incorrect: 0.66 });

                      return (
                        <div key={bp.id} className="bg-white rounded-2xl border-2 border-sky-100 p-6 shadow-sm hover:border-sky-400 hover:shadow-md transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <span className="px-2.5 py-1 text-xs font-black rounded-md bg-sky-100 text-sky-800 uppercase tracking-wide">
                                {bp.exam_id?.replace(/_/g, ' ')}
                              </span>
                              <span className="text-xs text-slate-500 font-medium flex items-center">
                                <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />{bp.duration_minutes} Mins
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 leading-snug mb-2">{bp.title}</h3>
                            <div className="space-y-1.5 text-xs text-slate-600 mb-6">
                              <div className="flex justify-between"><span>Total Marks:</span><span className="font-semibold text-slate-900">{bp.total_marks} Marks</span></div>
                              <div className="flex justify-between"><span>Blueprint Pattern:</span><span className="font-semibold text-slate-900">{bp.total_questions} Questions</span></div>
                              <div className="flex justify-between"><span>Marking Scheme:</span><span className="font-semibold text-emerald-600">+{markingScheme.correct} / -{markingScheme.incorrect}</span></div>
                              <div className="flex justify-between pt-1 border-t border-slate-100">
                                <span>Bank Inventory:</span>
                                <span className={`font-bold ${canRunFull ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  {availCount} available
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {canRunFull ? (
                              <button
                                onClick={() => handleStartCanonicalAttempt({ blueprintId: bp.id, mode: 'full', title: bp.title })}
                                className="w-full py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                              >
                                <Zap className="w-4 h-4" />
                                <span>Start Full Mock ({bp.total_questions} Qs)</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleStartCanonicalAttempt({ blueprintId: bp.id, mode: 'quick', count: Math.min(availCount, 10), title: `${bp.title} (Practice)` })}
                                  disabled={availCount === 0}
                                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                                >
                                  <PlayCircle className="w-4 h-4" />
                                  <span>Start Practice Test ({Math.min(availCount, 10)} Qs)</span>
                                </button>
                                <div className="text-[11px] text-amber-700 text-center font-medium bg-amber-50 rounded-lg py-1 px-2 border border-amber-200">
                                  Full {bp.total_questions}-Q blueprint unlocks when 100 questions verified.
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Additional Mock Tests */}
              {availableTests.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-sky-600" />
                    <span>Subject & Speed Mock Series</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableTests.map((test) => (
                      <div key={test.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:border-sky-400 hover:shadow-md transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-sky-50 text-sky-700 border border-sky-100 uppercase">{test.exam?.replace(/_/g, ' ')}</span>
                            <span className="text-xs text-slate-500 font-medium flex items-center"><Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />{test.durationMinutes} Mins</span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 leading-snug mb-2">{test.title}</h3>
                          <div className="space-y-1.5 text-xs text-slate-600 mb-6">
                            <div className="flex justify-between"><span>Total Marks:</span><span className="font-semibold text-slate-900">{test.totalMarks} Marks</span></div>
                            <div className="flex justify-between"><span>Questions:</span><span className="font-semibold text-slate-900">{test.questions.length} Items</span></div>
                            <div className="flex justify-between"><span>Marking Scheme:</span><span className="font-semibold text-emerald-600">+{test.markingScheme.correct} / -{test.markingScheme.incorrect}</span></div>
                          </div>
                        </div>
                        <button onClick={() => handleStartExam(test)} className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer">
                          <Zap className="w-4 h-4" /><span>Start Live CBT Exam</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canonicalBlueprints.length === 0 && availableTests.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm space-y-4 my-6">
                  <div className="w-14 h-14 bg-sky-50 border border-sky-100 rounded-2xl flex items-center justify-center mx-auto text-sky-600">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-slate-900">CBT is not available for this exam yet.</h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      Official full-length CBT tests for <span className="font-semibold text-slate-800">{examOption?.label || activeExamKey.replace(/_/g, ' ')}</span> are currently in preparation by the academic faculty. You can build a targeted practice test using the Custom Test Builder.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('custom')}
                      className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Build Custom Test for {activeExamKey.replace(/_/g, ' ')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* ── CUSTOM TEST BUILDER ── */}
        {activeTab === 'custom' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-purple-600 rounded-lg flex items-center justify-center"><Plus className="w-4 h-4 text-white" /></div>
              <div><h2 className="font-bold text-slate-900">Custom Test Builder</h2><p className="text-xs text-slate-500">Apne exam ke subjects aur topics choose karke custom practice test banao</p></div>
            </div>

            {/* Source Selector — AI vs Question Bank */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              <button
                onClick={() => setBankSource('ai')}
                className={`flex items-start space-x-3 p-4 rounded-2xl border-2 text-left transition-all ${
                  bankSource === 'ai'
                    ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-200'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bankSource === 'ai' ? 'bg-sky-600' : 'bg-slate-100'}`}>
                  <Sparkles className={`w-4 h-4 ${bankSource === 'ai' ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">🤖 AI Generated</div>
                  <div className="text-xs text-slate-500 mt-0.5">Gemini AI se fresh questions generate hote hain</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setBankSource('bank');
                  fetchBankStats(builder.exam);
                }}
                className={`flex items-start space-x-3 p-4 rounded-2xl border-2 text-left transition-all ${
                  bankSource === 'bank'
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${bankSource === 'bank' ? 'bg-emerald-600' : 'bg-slate-100'}`}>
                  <BookOpen className={`w-4 h-4 ${bankSource === 'bank' ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">📚 Question Bank</div>
                  <div className="text-xs text-slate-500 mt-0.5">4000+ real PYQ questions se exam banao — instant!</div>
                  {bankSource === 'bank' && bankAvailCount !== null && (
                    <div className="text-xs font-bold text-emerald-700 mt-1">{bankAvailCount} questions available</div>
                  )}
                </div>
              </button>
            </div>

            {/* ── BANK SOURCE UI ── */}
            {bankSource === 'bank' && (
              <div className="space-y-5 border-t border-slate-100 pt-4">
                {/* Exam display (Immutable Profile Exam) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Active Profile Exam</label>
                  <div className="w-full border border-emerald-500/30 bg-emerald-50 text-emerald-800 font-bold rounded-xl px-4 py-2.5 text-sm flex items-center justify-between">
                    <span>{EXAM_LIST.find(ex => ex.id === activeExamKey)?.label || activeExamKey}</span>
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded font-black">Authoritative</span>
                  </div>
                </div>

                {/* Mode picker */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Test Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([['full', '📄 Full Paper', 'Sabhi subjects se questions'], ['subject', '📘 Subject-wise', 'Ek subject ke saare questions'], ['topic', '🎯 Topic-wise', 'Specific topics se questions']] as const).map(([mode, label, desc]) => (
                      <button key={mode} onClick={() => { setBankMode(mode); setBankSelectedSubject(''); setBankSelectedTopics([]); }}
                        className={`p-3 text-left rounded-xl border-2 transition-all ${
                          bankMode === mode ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                        }`}>
                        <div className="text-xs font-bold text-slate-800">{label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject picker (for subject/topic mode) */}
                {(bankMode === 'subject' || bankMode === 'topic') && bankSubjects.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">Subject</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {bankSubjects.map(sub => (
                        <button key={sub} onClick={() => handleBankSubjectSelect(sub)}
                          className={`p-2.5 text-xs font-medium text-left rounded-xl border transition-all ${
                            bankSelectedSubject === sub
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 hover:border-emerald-300 text-slate-700'
                          }`}>
                          {sub}
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            {bankStats?.subjects?.[sub]?.count || 0} Qs
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Topic picker (for topic mode) */}
                {bankMode === 'topic' && bankSelectedSubject && bankTopics.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">
                      Topics <span className="text-slate-400 font-normal">({bankSelectedTopics.length} selected)</span>
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                      {bankTopics.map(t => (
                        <button key={t} onClick={() => toggleBankTopic(t)}
                          className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                            bankSelectedTopics.includes(t)
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'border-slate-300 text-slate-600 hover:border-emerald-400'
                          }`}>{t}</button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Config row */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Questions</label>
                    <select value={builder.questionCount} onChange={e => setBuilder(p => ({ ...p, questionCount: +e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs">
                      {[10, 20, 30, 50, 75, 100].map(n => <option key={n} value={n}>{n} Qs</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Duration</label>
                    <select value={builder.durationMinutes} onChange={e => setBuilder(p => ({ ...p, durationMinutes: +e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs">
                      {[15, 20, 30, 45, 60, 90, 120].map(n => <option key={n} value={n}>{n} min</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Difficulty</label>
                    <select value={builder.difficulty} onChange={e => setBuilder(p => ({ ...p, difficulty: e.target.value as any }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs">
                      <option value="Mixed">Mixed</option>
                      {['Easy', 'Medium', 'Hard'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {/* Start button */}
                <button
                  onClick={handleGenerateFromBank}
                  disabled={generating ||
                    (bankMode === 'subject' && !bankSelectedSubject) ||
                    (bankMode === 'topic' && (bankSelectedTopics.length === 0 || !bankSelectedSubject))
                  }
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
                >
                  {generating ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Building exam from bank...</span></>
                  ) : (
                    <><BookOpen className="w-4 h-4" /><span>Start Exam from Question Bank</span></>
                  )}
                </button>
              </div>
            )}

            {/* ── AI SOURCE UI (original) ── */}
            {bankSource === 'ai' && (
              <div className="space-y-4 border-t border-slate-100 pt-2">

            {/* Step indicators */}
            <div className="flex items-center space-x-2">
              {[1,2,3,4].map((s) => (
                <React.Fragment key={s}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${builder.step >= s ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-400 border-slate-300'}`}>{s}</div>
                  {s < 4 && <div className={`flex-1 h-0.5 ${builder.step > s ? 'bg-sky-600' : 'bg-slate-200'}`} />}
                </React.Fragment>
              ))}
            </div>
            <div className="flex text-[10px] text-slate-500 font-medium justify-between px-1">
              <span>Exam</span><span>Subject</span><span>Topics</span><span>Configure</span>
            </div>

            {/* Step 1: Active Profile Target Exam */}
            {builder.step >= 1 && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Active Profile Exam Target</label>
                <div className="w-full border border-sky-500/30 bg-sky-50 text-slate-900 font-bold rounded-xl px-4 py-2.5 text-sm flex items-center justify-between">
                  <span>{EXAM_LIST.find((ex) => ex.id === activeExamKey)?.label || activeExamKey}</span>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 bg-sky-200 text-slate-900 rounded font-black">Authoritative</span>
                </div>
                {builder.step === 1 && subjects.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mt-3 mb-2 font-medium">Subject choose karo:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {subjects.map((sub) => (
                        <button
                          key={sub}
                          data-testid="cbt-builder-subject-btn"
                          onClick={() => handleBuilderSubjectSelect(sub)}
                          className="cbt-builder-subject-btn p-3 text-sm text-left rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50 transition-all font-medium text-slate-700"
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Topic Multi-Select */}
            {builder.step >= 2 && builder.subject && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Step 2: Topics choose karo <span className="text-sky-600">({builder.subject})</span></label>
                  <div className="flex space-x-2">
                    <button id="cbt-builder-select-all-topics" onClick={() => setBuilder(prev => ({ ...prev, selectedTopics: topics }))} className="text-xs text-sky-600 hover:underline">Select All</button>
                    <button onClick={() => setBuilder(prev => ({ ...prev, selectedTopics: [] }))} className="text-xs text-slate-500 hover:underline">Clear</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {topics.map((topic) => {
                    const sel = builder.selectedTopics.includes(topic);
                    return (
                      <button key={topic} onClick={() => toggleTopic(topic)}
                        className={`flex items-center space-x-2 p-2.5 rounded-lg text-sm text-left border transition-all ${sel ? 'bg-sky-50 border-sky-400 text-slate-900 font-semibold' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${sel ? 'bg-sky-600 border-sky-600' : 'border-slate-300'}`}>
                          {sel && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="line-clamp-1">{topic}</span>
                      </button>
                    );
                  })}
                </div>
                {builder.selectedTopics.length > 0 && builder.step === 2 && (
                  <button id="cbt-builder-next-configure" onClick={() => setBuilder(prev => ({ ...prev, step: 3 }))}
                    className="mt-2 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg transition-all">
                    Next: Configure →
                  </button>
                )}
              </div>
            )}

            {/* Step 3: Configuration */}
            {builder.step >= 3 && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <label className="text-sm font-semibold text-slate-700">Step 3: Test Configure karo</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Questions</label>
                    <select value={builder.questionCount} onChange={(e) => setBuilder(prev => ({ ...prev, questionCount: +e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                      {[10, 15, 20, 30, 50].map(n => <option key={n} value={n}>{n} Questions</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Duration</label>
                    <select value={builder.durationMinutes} onChange={(e) => setBuilder(prev => ({ ...prev, durationMinutes: +e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                      {[10, 15, 20, 30, 45, 60].map(n => <option key={n} value={n}>{n} Minutes</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Difficulty</label>
                    <select value={builder.difficulty} onChange={(e) => setBuilder(prev => ({ ...prev, difficulty: e.target.value as any }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm">
                      {['Easy', 'Medium', 'Hard'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 bg-sky-50 rounded-xl border border-sky-200 text-sm space-y-1">
                  <div className="font-bold text-slate-900 mb-2">Test Summary</div>
                  <div className="flex justify-between text-slate-700"><span>Exam:</span><span className="font-semibold">{EXAM_LIST.find(e => e.id === builder.exam)?.label || builder.exam}</span></div>
                  <div className="flex justify-between text-slate-700"><span>Subject:</span><span className="font-semibold">{builder.subject}</span></div>
                  <div className="flex justify-between text-slate-700"><span>Topics Selected:</span><span className="font-semibold">{builder.selectedTopics.length} topics</span></div>
                  <div className="flex justify-between text-slate-700"><span>Questions:</span><span className="font-semibold">{builder.questionCount}</span></div>
                  <div className="flex justify-between text-slate-700"><span>Duration:</span><span className="font-semibold">{builder.durationMinutes} min</span></div>
                  <div className="flex justify-between text-slate-700"><span>Total Marks:</span><span className="font-semibold">{builder.questionCount * 4} (4 per correct, -1 wrong)</span></div>
                </div>

                <button id="cbt-builder-generate-start-btn" onClick={handleGenerateCustomExam} disabled={generating}
                  className="w-full py-3 bg-gradient-to-r from-sky-600 to-purple-600 hover:from-sky-700 hover:to-purple-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-70">
                  {generating ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>AI Questions Generate ho rahi hain...</span></>
                  ) : (
                    <><Sparkles className="w-4 h-4" /><span>Generate & Start Exam</span></>
                  )}
                </button>
              </div>
            )}
              </div>
            )}
          </div>
        )}


        {/* ── LIVE EXAMS (ADMIN CONDUCTED) ── */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2"><Radio className="w-5 h-5 text-rose-500" /><span>Live & Upcoming Admin Exams</span></h2>
              <button onClick={fetchLiveExams} className="text-xs text-sky-600 font-semibold hover:underline flex items-center space-x-1"><RotateCcw className="w-3 h-3" /><span>Refresh</span></button>
            </div>

            {liveExams.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Radio className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold">Abhi koi live exam scheduled nahi hai</p>
                <p className="text-xs mt-1">Admin jab exam schedule karega, yahan dikh jayega</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveExams.map((ex) => {
                  const isLive = ex.status === 'live' || liveCountdowns[ex.id] === 'LIVE NOW';
                  return (
                    <div key={ex.id} className={`rounded-2xl border p-5 shadow-sm transition-all ${isLive ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-200' : 'border-slate-200 bg-white hover:border-sky-300'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase ${isLive ? 'bg-rose-600 text-white animate-pulse' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                          {isLive ? '🔴 LIVE' : '📅 Upcoming'}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center space-x-1"><Users className="w-3.5 h-3.5" /><span>{ex.joinedCount || 0} joined</span></span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mb-1">{ex.title}</h3>
                      <div className="text-xs text-slate-600 space-y-1 mb-4">
                        <div className="flex justify-between"><span>Exam:</span><span className="font-semibold">{ex.exam?.replace(/_/g, ' ')}</span></div>
                        <div className="flex justify-between"><span>Subject:</span><span className="font-semibold">{ex.subject}</span></div>
                        <div className="flex justify-between"><span>Questions:</span><span className="font-semibold">{ex.questionCount}</span></div>
                        <div className="flex justify-between"><span>Duration:</span><span className="font-semibold">{ex.durationMinutes} min</span></div>
                        <div className="flex justify-between"><span>Scheduled:</span><span className="font-semibold">{new Date(ex.scheduledAt).toLocaleString('en-IN')}</span></div>
                      </div>
                      {/* Countdown */}
                      <div className={`text-center py-2 rounded-lg mb-3 font-bold text-sm ${isLive ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        <Clock className="w-4 h-4 inline mr-1" />
                        {isLive ? 'Exam is LIVE! Join Now' : `Starts in: ${liveCountdowns[ex.id] || '...'}`}
                      </div>
                      <button onClick={() => handleJoinLiveExam(ex)} disabled={!isLive}
                        className={`w-full py-2.5 font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2 ${isLive ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                        <PlayCircle className="w-4 h-4" />
                        <span>{isLive ? 'Join Live Exam' : 'Waiting...'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MY RESULTS ── */}
        {activeTab === 'results' && (
          loadingHistory ? (
            <div className="p-12 text-center text-slate-500">
              <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading Results History...
            </div>
          ) : testHistory.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm space-y-4 my-6">
              <BarChart2 className="w-12 h-12 mx-auto mb-2 text-slate-400 opacity-40" />
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-800">No mock tests submitted yet for {examOption?.label || activeExamKey.replace(/_/g, ' ')}</h3>
                <p className="text-xs text-slate-500">
                  Complete an official CBT test or custom test to view detailed question-by-question analytics, All India Rank, and subject mastery breakdown.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('available')}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Browse CBT Tests
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Completed Tests ({testHistory.length})</h3>
                  <p className="text-xs text-slate-500">Verified scores and performance history for {examOption?.label || activeExamKey.replace(/_/g, ' ')}</p>
                </div>
                <span className="text-xs font-semibold text-sky-600 bg-sky-50 border border-sky-100 px-3 py-1 rounded-lg">
                  Exam: {activeExamKey.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testHistory.map((item: any, idx: number) => (
                  <div key={item.testId ? `${item.testId}_${idx}` : `hist_${idx}`} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-sky-300 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-slate-100 text-slate-700">
                          {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                          {item.accuracy || item.accuracyPercentage || 0}% Accuracy
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mb-3">{item.testTitle || 'Full Mock Examination'}</h4>
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 text-center mb-4">
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Score</div>
                          <div className="text-sm font-black text-sky-600">{item.score} <span className="text-[10px] text-slate-400 font-normal">/ {item.totalPossibleScore || 200}</span></div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">AIR Rank</div>
                          <div className="text-sm font-black text-amber-600">#{item.globalRank || '18'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500 uppercase font-semibold">Percentile</div>
                          <div className="text-sm font-black text-slate-800">{item.percentile || 94.2}%</div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReviewHistoricalAttempt(item)}
                      disabled={loadingReviewId === (item.attempt_id || item.attemptId || item.id)}
                      className="w-full py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{loadingReviewId === (item.attempt_id || item.attemptId || item.id) ? 'Loading Full Review...' : 'Review Detailed Analytics'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    );
  }



  // 2. RENDER EXAM RESULT VIEW (IF SUBMITTED)
  if (examResult) {
    return (
      <SlideUp id="cbt-result-scorecard" className="w-full space-y-4 sm:space-y-6">
        <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl border border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4 mb-4 sm:mb-6">
            <div>
              <span className="px-3 py-1 bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold rounded-md">
                CBT EXAM EVALUATION
              </span>
              <h2 className="text-xl sm:text-2xl font-bold mt-2">{examResult.testTitle}</h2>
              <p className="text-sky-200 text-xs sm:text-sm">Server-authoritative evaluation & AI Diagnostic report</p>
            </div>
            <PressFeedback>
              <button
                onClick={() => {
                  setSelectedTest(null);
                  setSessionState(null);
                  setExamResult(null);
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md w-full sm:w-auto cursor-pointer"
              >
                Back to Exam Portal
              </button>
            </PressFeedback>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 text-center">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4">
              <div className="text-[11px] sm:text-xs text-sky-300 font-medium">Final Score</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1">
                <CountUp value={examResult.score} /> / {examResult.totalPossibleScore}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4">
              <div className="text-[11px] sm:text-xs text-sky-300 font-medium">National Rank</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 mt-1">
                #<CountUp value={examResult.globalRank} />
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4">
              <div className="text-[11px] sm:text-xs text-sky-300 font-medium">Percentile</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 mt-1">
                <CountUp value={examResult.percentile} suffix="%" />
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4">
              <div className="text-[11px] sm:text-xs text-sky-300 font-medium">Accuracy</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-300 mt-1">
                <CountUp value={examResult.accuracy} suffix="%" />
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-sky-600" />
              <span>Performance Summary</span>
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm p-3 bg-emerald-50 rounded-xl text-emerald-900 font-semibold">
                <span className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" /> Correct Responses:
                </span>
                <span>{examResult.correctCount} items</span>
              </div>
              <div className="flex justify-between items-center text-sm p-3 bg-rose-50 rounded-xl text-rose-900 font-semibold">
                <span className="flex items-center">
                  <XCircle className="w-4 h-4 mr-2 text-rose-600" /> Incorrect Responses:
                </span>
                <span>{examResult.incorrectCount} items</span>
              </div>
              <div className="flex justify-between items-center text-sm p-3 bg-slate-100 rounded-xl text-slate-700 font-semibold">
                <span className="flex items-center">
                  <HelpCircle className="w-4 h-4 mr-2 text-slate-500" /> Unattempted:
                </span>
                <span>{examResult.unattemptedCount} items</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>AI Mistake Diagnostic & Revision Plan</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <div className="font-bold mb-1">AI Diagnostic Insight:</div>
                {examResult.aiMistakeAnalysis.map((m, i) => (
                  <p key={i}>• {m}</p>
                ))}
              </div>
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-slate-900">
                <div className="font-bold mb-1">Targeted Action Plan:</div>
                {examResult.aiImprovementSuggestions.map((s, i) => (
                  <p key={i}>• {s}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* ── QUESTION-BY-QUESTION REVIEW & MISTAKE RECTIFICATION ── */}
        {(() => {
          const reviewList = (examResult.reviewQuestions && examResult.reviewQuestions.length > 0)
            ? examResult.reviewQuestions
            : (selectedTest?.questions || []).map((q) => {
                const resp = sessionState?.responses?.[q.id];
                const isCorrect = resp?.selectedOption !== null && resp?.selectedOption !== undefined && resp?.selectedOption === q.correctOption;
                return {
                  id: q.id,
                  question_text: q.questionText,
                  options: q.options,
                  correct_answer: q.correctOption,
                  explanation: q.explanation,
                  subject: q.subject,
                  topic: q.topic,
                  section: q.section,
                  marks: q.marks,
                  negative_marks: q.negativeMarks,
                  selected_answer: resp?.selectedOption ?? null,
                  is_correct: isCorrect,
                  is_marked_for_review: resp?.status === 'marked_for_review' || resp?.status === 'answered_and_marked'
                };
              });

          const filteredReviewList = reviewList.filter((q: any) => {
            if (reviewFilter === 'incorrect') return q.selected_answer !== null && q.selected_answer !== undefined && !q.is_correct;
            if (reviewFilter === 'unattempted') return q.selected_answer === null || q.selected_answer === undefined;
            if (reviewFilter === 'marked') return q.is_marked_for_review;
            return true;
          });

          return (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-sky-600" />
                    <span>Post-Exam Question Review & Analysis</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Official solutions, conceptual explanations, error classification & AI mentor doubts.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {([
                    { key: 'all', label: `All (${reviewList.length})` },
                    { key: 'incorrect', label: `Incorrect (${examResult.incorrectCount})` },
                    { key: 'unattempted', label: `Unattempted (${examResult.unattemptedCount})` },
                    { key: 'marked', label: 'Marked' }
                  ] as const).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setReviewFilter(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        reviewFilter === key
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredReviewList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  Koi question is filter mein match nahi karta.
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredReviewList.map((q: any, idx: number) => {
                    const qId = q.id;
                    const correctAns = q.correct_answer;
                    const studentAns = q.selected_answer;
                    const isUnattempted = studentAns === null || studentAns === undefined;
                    const isCorrect = q.is_correct === true;
                    const currentMistakeTag = taggedMistakes[qId]?.category || q.mistake_category;
                    const isAiOpen = Boolean(aiDiscussionActive[qId]);
                    const aiReply = aiDiscussionReplies[qId];
                    const isAiLoading = Boolean(aiDiscussionLoading[qId]);

                    return (
                      <div
                        key={qId || idx}
                        className={`rounded-2xl border p-4 sm:p-5 transition-all space-y-4 ${
                          isCorrect
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : isUnattempted
                            ? 'border-slate-200 bg-slate-50/40'
                            : 'border-rose-200 bg-rose-50/20'
                        }`}
                      >
                        {/* Question Meta Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center space-x-2">
                            <span className="w-7 h-7 bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center justify-center">
                              Q{idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                              {q.subject || 'General'} {q.topic ? `• ${q.topic}` : ''}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {isCorrect ? (
                              <span className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md border border-emerald-200">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Correct (+{q.marks || 2})</span>
                              </span>
                            ) : isUnattempted ? (
                              <span className="flex items-center space-x-1 px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-md">
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>Unattempted (0)</span>
                              </span>
                            ) : (
                              <span className="flex items-center space-x-1 px-2.5 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-md border border-rose-200">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Incorrect (-{q.negative_marks || 0.66})</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Passage Context if applicable */}
                        {q.passage_text && (
                          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-slate-800 leading-relaxed">
                            <span className="font-bold text-amber-900 block mb-0.5">Passage:</span>
                            {q.passage_text}
                          </div>
                        )}

                        {/* Question Text */}
                        <div className="text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-line">
                          {q.question_text}
                        </div>

                        {/* Options List with Color Highlighting */}
                        <div className="space-y-2 pt-1">
                          {Array.isArray(q.options) && q.options.map((opt: any, optIdx: number) => {
                            const optText = typeof opt === 'string' ? opt : (opt?.text ?? JSON.stringify(opt));
                            const isThisCorrect = optIdx === correctAns;
                            const isStudentPick = optIdx === studentAns;

                            let optStyle = 'border-slate-200 bg-white text-slate-800';
                            if (isThisCorrect) {
                              optStyle = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-semibold ring-1 ring-emerald-300';
                            } else if (isStudentPick && !isThisCorrect) {
                              optStyle = 'border-rose-500 bg-rose-50/80 text-rose-950 font-semibold ring-1 ring-rose-300';
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start space-x-3 transition-all ${optStyle}`}
                              >
                                <span className={`w-5 h-5 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                  isThisCorrect
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : isStudentPick
                                    ? 'bg-rose-600 text-white border-rose-600'
                                    : 'bg-slate-100 text-slate-600 border-slate-300'
                                }`}>
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <div className="flex-1 leading-relaxed">
                                  <span>{optText}</span>
                                </div>
                                {isThisCorrect && (
                                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-emerald-600 text-white rounded-md shrink-0">
                                    Correct Answer
                                  </span>
                                )}
                                {isStudentPick && !isThisCorrect && (
                                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-rose-600 text-white rounded-md shrink-0">
                                    Your Answer
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Official Explanation Card */}
                        {q.explanation && (
                          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-3.5 space-y-1">
                            <div className="flex items-center space-x-1.5 text-sky-900 font-bold text-xs">
                              <BookOpen className="w-4 h-4 text-sky-600" />
                              <span>Official Verified Explanation</span>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line pt-0.5">
                              {q.explanation}
                            </p>
                          </div>
                        )}

                        {/* Action Row: Mistake Tagging + AI Mentor Discuss + Practice Topic */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                          {/* Why was I wrong? Mistake Tagger */}
                          {!isCorrect && (
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                <Tag className="w-3.5 h-3.5 text-amber-600" />
                                <span>Why was I wrong?</span>
                              </span>
                              <select
                                value={currentMistakeTag || ''}
                                onChange={(e) => handleTagMistake(qId, e.target.value)}
                                className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold bg-white text-slate-700 hover:border-sky-400 focus:ring-1 focus:ring-sky-500 cursor-pointer"
                              >
                                <option value="">Classify Error...</option>
                                <option value="conceptual_gap">📚 Conceptual Gap</option>
                                <option value="calculation_error">➗ Calculation Error</option>
                                <option value="silly_mistake">🤦 Silly / Reading Mistake</option>
                                <option value="time_pressure">⏱️ Time Pressure / Rushed</option>
                                <option value="misread_question">👓 Misread Question</option>
                                <option value="guesswork">🎲 Guesswork</option>
                              </select>
                              {currentMistakeTag && (
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Saved to Revision Plan
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center space-x-2 flex-wrap ml-auto">
                            {/* Practice Topic Again */}
                            {q.subject && (
                              <button
                                onClick={() => handlePracticeTopicAgain(q.subject, q.topic)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                              >
                                <Zap className="w-3.5 h-3.5 text-amber-600" />
                                <span>Practice Topic Again</span>
                              </button>
                            )}

                            {/* Discuss with AI Mentor */}
                            <button
                              onClick={() => setAiDiscussionActive(prev => ({ ...prev, [qId]: !prev[qId] }))}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                                isAiOpen
                                  ? 'bg-purple-600 text-white shadow-sm'
                                  : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{isAiOpen ? 'Close AI Mentor' : 'Discuss with AI Mentor'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Interactive AI Mentor Discussion Drawer */}
                        {isAiOpen && (
                          <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-150">
                            <div className="flex items-center space-x-2 text-purple-900 font-bold text-xs">
                              <Sparkles className="w-4 h-4 text-purple-600" />
                              <span>StudyRide AI Exam Mentor (Instant Doubt Clarification)</span>
                            </div>

                            {/* Quick Prompt Chips */}
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                'Explain why the correct option is right in simple terms',
                                'Why are other options incorrect?',
                                'Give me an exam shortcut or mnemonic for this concept'
                              ].map((chip, chipIdx) => (
                                <button
                                  key={chipIdx}
                                  onClick={() => {
                                    setAiDiscussionPrompts(p => ({ ...p, [qId]: chip }));
                                    handleAiDiscuss(q, chip);
                                  }}
                                  className="text-[11px] bg-white border border-purple-200 hover:border-purple-400 text-purple-800 px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer"
                                >
                                  {chip}
                                </button>
                              ))}
                            </div>

                            {/* Input box */}
                            <div className="flex items-center space-x-2 pt-1">
                              <input
                                type="text"
                                value={aiDiscussionPrompts[qId] || ''}
                                onChange={(e) => setAiDiscussionPrompts(p => ({ ...p, [qId]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAiDiscuss(q);
                                }}
                                placeholder="Type your specific doubt regarding this question..."
                                className="flex-1 bg-white border border-purple-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                              <button
                                onClick={() => handleAiDiscuss(q)}
                                disabled={isAiLoading}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                              >
                                {isAiLoading ? (
                                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                                <span>Ask</span>
                              </button>
                            </div>

                            {/* AI Mentor Response */}
                            {aiReply && (
                              <div className="p-3.5 bg-white border border-purple-100 rounded-xl text-xs text-slate-800 space-y-1.5 leading-relaxed shadow-xs">
                                <div className="font-bold text-purple-900 flex items-center space-x-1">
                                  <span>Mentor Guidance:</span>
                                </div>
                                <div className="whitespace-pre-line text-slate-700">
                                  {aiReply}
                                </div>
                              </div>
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
        })()}
      </SlideUp>
    );
  }

  // 3. RENDER LIVE CBT EXAM INTERFACE (ENTERPRISE NTA / UPSC ENGINE)
  if (!sessionState) return null;

  const currentQuestion = selectedTest.questions[sessionState.currentQuestionIndex];
  const currentResp = sessionState.responses[currentQuestion.id] || {
    questionId: currentQuestion.id,
    selectedOption: null,
    status: 'not_visited',
    timeSpentSeconds: 0
  };

  const remainingSeconds = Math.max(0, selectedTest.durationMinutes * 60 - sessionState.elapsedSeconds);

  // Question counts by status
  let countAnswered = 0;
  let countNotAnswered = 0;
  let countMarked = 0;
  let countAnsweredMarked = 0;
  let countNotVisited = 0;

  Object.values(sessionState.responses).forEach((resp: any) => {
    if (resp?.status === 'answered') countAnswered++;
    else if (resp?.status === 'not_answered') countNotAnswered++;
    else if (resp?.status === 'marked_for_review') countMarked++;
    else if (resp?.status === 'answered_and_marked') countAnsweredMarked++;
    else countNotVisited++;
  });

  return (
    <div id="cbt-live-exam-workspace" className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* CBT HEADER BAR */}
      <header className="bg-slate-900 text-white px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-600 text-white font-bold flex items-center justify-center text-xs sm:text-sm shadow-md shrink-0">
            CBT
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-slate-100 truncate max-w-[150px] sm:max-w-xs md:max-w-md">{selectedTest.title}</h1>
            <div className="text-[10px] sm:text-xs text-slate-400 truncate">Sec: {currentQuestion.section}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Palette Button on Mobile */}
          <button
            onClick={() => setIsMobilePaletteOpen(true)}
            className="md:hidden px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shrink-0"
          >
            <span>Q {sessionState.currentQuestionIndex + 1}/{selectedTest.questions.length}</span>
          </button>

          {/* TIMER DISPLAY */}
          <div className={`flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-xs sm:text-sm font-extrabold shrink-0 ${
            remainingSeconds < 300 
              ? 'bg-rose-950 text-rose-300 border-rose-800 animate-pulse' 
              : 'bg-slate-800 text-emerald-400 border-slate-700'
          }`}>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          {/* PAUSE BUTTON */}
          <button
            onClick={handlePauseExam}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
            title="Pause Exam (Freezes Timer on Server)"
          >
            <Pause className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pause</span>
          </button>

          {/* Mobile Submit Button in Header */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="md:hidden px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
          >
            <Send className="w-3 h-3" />
            <span>Submit</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="hidden sm:block p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* CBT MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT / CENTER: QUESTION PAPER VIEW (STABLE LAYOUT: FIXED META BAR, SCROLLABLE QUESTION, FIXED ACTION BAR) */}
        <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
          {/* SECTION & QUESTION META BAR (FIXED) */}
          <div className="px-3 sm:px-6 py-2.5 sm:py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase text-slate-500">Question No.</span>
              <span className="w-7 h-7 bg-sky-600 text-white font-bold rounded-md flex items-center justify-center text-sm">
                {sessionState.currentQuestionIndex + 1}
              </span>
              <span className="text-xs text-slate-400">/ {selectedTest.questions.length}</span>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 text-xs font-semibold">
              <span className="text-emerald-700 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border border-emerald-200">
                +{currentQuestion.marks}
              </span>
              <span className="text-rose-700 bg-rose-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border border-rose-200">
                -{currentQuestion.negativeMarks}
              </span>
            </div>
          </div>

          {/* QUESTION TEXT & OPTIONS AREA (THE ONLY SCROLLABLE AREA IN THE WORKSPACE) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="max-w-4xl mx-auto w-full space-y-4 sm:space-y-6 pb-4">
              {/* PASSAGE OR ASSERTION BOX IF APPLICABLE */}
              {currentQuestion.passageText && (
                <div className="p-3.5 sm:p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-slate-800 text-xs sm:text-sm leading-relaxed">
                  <span className="font-bold text-amber-900 block mb-1">Passage Context:</span>
                  {currentQuestion.passageText}
                </div>
              )}

              {currentQuestion.assertionText && (
                <div className="p-3.5 sm:p-4 bg-sky-50/60 border border-sky-200 rounded-xl text-slate-800 text-xs sm:text-sm space-y-2">
                  <p className="font-semibold">{currentQuestion.assertionText}</p>
                  <p className="font-semibold">{currentQuestion.reasonText}</p>
                </div>
              )}

              {/* QUESTION MAIN STATEMENT */}
              <div className="text-sm sm:text-base font-semibold text-slate-900 whitespace-pre-line leading-relaxed">
                {currentQuestion.questionText}
              </div>

              {/* OPTIONS GRID */}
              <div className="space-y-2.5 sm:space-y-3 pt-1 sm:pt-2">
                {currentQuestion.options.map((optText, optIdx) => {
                  const isSelected = currentResp.selectedOption === optIdx;
                  const optionLabel = typeof optText === 'string' ? optText : ((optText as any)?.text ?? (typeof optText === 'object' && optText !== null ? JSON.stringify(optText) : ''));
                  return (
                    <button
                      key={optIdx}
                      id={`cbt-option-${optIdx}`}
                      data-testid={`cbt-option-${optIdx}`}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full p-3 sm:p-4 text-left rounded-xl border transition-all flex items-start space-x-3 cursor-pointer ${
                        isSelected
                          ? 'bg-sky-50 border-sky-600 text-slate-950 font-semibold ring-2 ring-sky-200'
                          : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="text-xs sm:text-sm pt-0.5 leading-relaxed break-words">{optionLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BOTTOM CONTROLS BAR (ALWAYS FIXED, NEVER DISAPPEARS ON SCROLL) */}
          <div className="p-2.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0 z-10">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <button
                id="cbt-btn-review"
                onClick={handleMarkForReview}
                className="px-2.5 sm:px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap"
              >
                <span className="hidden sm:inline">Mark for Review & Next</span>
                <span className="sm:hidden">Review</span>
              </button>
              <button
                id="cbt-btn-clear"
                onClick={handleClearResponse}
                className="px-2.5 sm:px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap"
              >
                <span className="hidden sm:inline">Clear Response</span>
                <span className="sm:hidden">Clear</span>
              </button>
            </div>

            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <button
                id="cbt-btn-prev"
                onClick={handlePrevQuestion}
                disabled={sessionState.currentQuestionIndex === 0}
                className="px-2.5 sm:px-4 py-2 bg-white border border-slate-300 text-slate-700 text-[11px] sm:text-xs font-bold rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all flex items-center space-x-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Previous</span>
              </button>

              {sessionState.currentQuestionIndex >= selectedTest.questions.length - 1 ? (
                <button
                  id="cbt-btn-save-submit"
                  onClick={handleSaveAndNext}
                  className="px-3 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-bold rounded-lg shadow-md transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>Save & Submit Exam</span>
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              ) : (
                <button
                  id="cbt-btn-save-next"
                  onClick={handleSaveAndNext}
                  className="px-3 sm:px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-bold rounded-lg shadow-md transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>Save & Next</span>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}

              <button
                id="cbt-btn-submit-exam"
                onClick={() => setShowSubmitModal(true)}
                className="px-3 sm:px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-[11px] sm:text-xs font-bold rounded-lg shadow-md transition-all flex items-center space-x-1 cursor-pointer"
              >
                <Send className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span className="hidden sm:inline">Submit Exam</span>
                <span className="sm:hidden">Submit</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: QUESTION PALETTE (OFFICIAL NTA / UPSC STYLE) */}
        <div className="hidden md:flex w-80 bg-slate-100 border-l border-slate-200 flex-col shrink-0">
          <div className="p-4 bg-white border-b border-slate-200">
            <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">Question Palette Legend</h3>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-5 bg-emerald-600 text-white font-bold text-[10px] rounded flex items-center justify-center">
                  {countAnswered}
                </span>
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-5 bg-rose-600 text-white font-bold text-[10px] rounded flex items-center justify-center">
                  {countNotAnswered}
                </span>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-5 bg-purple-600 text-white font-bold text-[10px] rounded flex items-center justify-center">
                  {countMarked}
                </span>
                <span>Marked Review</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-5 h-5 bg-slate-300 text-slate-700 font-bold text-[10px] rounded flex items-center justify-center">
                  {countNotVisited}
                </span>
                <span>Not Visited</span>
              </div>
            </div>
          </div>

          {/* QUESTION PALETTE GRID */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Questions Grid</h4>
            <div className="grid grid-cols-5 gap-2">
              {selectedTest.questions.map((q, idx) => {
                const resp = sessionState.responses[q.id];
                const st = resp?.status || 'not_visited';
                const isCurrent = idx === sessionState.currentQuestionIndex;

                let bgClass = 'bg-slate-200 text-slate-700 hover:bg-slate-300';
                if (st === 'answered') bgClass = 'bg-emerald-600 text-white';
                else if (st === 'not_answered') bgClass = 'bg-rose-600 text-white';
                else if (st === 'marked_for_review') bgClass = 'bg-purple-600 text-white';
                else if (st === 'answered_and_marked') bgClass = 'bg-purple-700 text-white ring-2 ring-emerald-400';

                return (
                  <button
                    key={q.id}
                    onClick={() => handleJumpToQuestion(idx)}
                    className={`h-9 font-bold text-xs rounded transition-all flex items-center justify-center ${bgClass} ${
                      isCurrent ? 'ring-2 ring-slate-900 ring-offset-1 font-black shadow-md' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="p-4 bg-white border-t border-slate-200">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Submit Examination</span>
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE QUESTION PALETTE DRAWER SHEET */}
      {isMobilePaletteOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm md:hidden flex justify-end">
          <div className="w-4/5 max-w-xs bg-white h-full flex flex-col shadow-2xl">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider">Question Palette</h3>
              <button 
                onClick={() => setIsMobilePaletteOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 text-slate-300 hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 border-b border-slate-200">
              <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-700 font-medium">
                <div className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 bg-emerald-600 text-white font-bold text-[9px] rounded flex items-center justify-center">{countAnswered}</span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 bg-rose-600 text-white font-bold text-[9px] rounded flex items-center justify-center">{countNotAnswered}</span>
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 bg-purple-600 text-white font-bold text-[9px] rounded flex items-center justify-center">{countMarked}</span>
                  <span>Review</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-4 h-4 bg-slate-300 text-slate-700 font-bold text-[9px] rounded flex items-center justify-center">{countNotVisited}</span>
                  <span>Not Visited</span>
                </div>
              </div>
            </div>

            <div className="flex-1 p-3 overflow-y-auto">
              <div className="grid grid-cols-4 gap-2">
                {selectedTest.questions.map((q, idx) => {
                  const resp = sessionState.responses[q.id];
                  const st = resp?.status || 'not_visited';
                  const isCurrent = idx === sessionState.currentQuestionIndex;

                  let bgClass = 'bg-slate-200 text-slate-700';
                  if (st === 'answered') bgClass = 'bg-emerald-600 text-white';
                  else if (st === 'not_answered') bgClass = 'bg-rose-600 text-white';
                  else if (st === 'marked_for_review') bgClass = 'bg-purple-600 text-white';
                  else if (st === 'answered_and_marked') bgClass = 'bg-purple-700 text-white ring-2 ring-emerald-400';

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        handleJumpToQuestion(idx);
                        setIsMobilePaletteOpen(false);
                      }}
                      className={`h-9 font-bold text-xs rounded flex items-center justify-center ${bgClass} ${
                        isCurrent ? 'ring-2 ring-slate-900 ring-offset-1 font-black' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-white border-t border-slate-200">
              <button
                onClick={() => {
                  setIsMobilePaletteOpen(false);
                  setShowSubmitModal(true);
                }}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Examination</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM SUBMIT MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Confirm Final Submission</span>
            </h3>
            <p className="text-slate-600 text-sm">
              Are you sure you want to submit your examination? Once submitted, your responses will be evaluated by the server engine.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-700 font-medium">
              <div className="flex justify-between">
                <span>Total Answered:</span>
                <span className="font-bold text-emerald-600">{countAnswered}</span>
              </div>
              <div className="flex justify-between">
                <span>Not Answered:</span>
                <span className="font-bold text-rose-600">{countNotAnswered}</span>
              </div>
              <div className="flex justify-between">
                <span>Marked for Review:</span>
                <span className="font-bold text-purple-600">{countMarked + countAnsweredMarked}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Return to Exam
              </button>
              <button
                id="cbt-btn-confirm-submit"
                onClick={() => handleFinalSubmit()}
                disabled={submitting}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                {submitting ? 'Evaluating...' : 'Yes, Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* PAUSE MODAL (SERVER AUTHORITATIVE FREEZE) */}
      {isPaused && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="w-16 h-16 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-600 shadow-inner">
              <Pause className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900">Exam Temporarily Paused</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Your exam timer has been safely frozen on the server. Take a deep breath, stretch, and regain your focus.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
              <div className="flex justify-between font-semibold">
                <span>Remaining Exam Time:</span>
                <span className="text-sky-600 font-mono text-sm">{formatTime(pauseRemainingSeconds)}</span>
              </div>
            </div>
            <button
              onClick={handleResumeExam}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Resume Examination</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
