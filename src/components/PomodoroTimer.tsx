import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Flame, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  Coins, 
  Award, 
  Database,
  History,
  Tag,
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  HelpCircle,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Layers,
  ChevronDown
} from 'lucide-react';
import { saveStudySessionLog, loadStudySessions, loadUserProfile } from '../lib/gamification';
import { StudySession, CustomSubject, ManualQuestion, PomodoroQuestionRef } from '../types';
import { INITIAL_PYQS_DATABASE, INITIAL_QUESTION_BANK } from '../data/academicData';

interface PomodoroTimerProps {
  userId?: string;
  topicId?: string;
  selectedExam?: string;
}

const EXAM_SUBJECT_CHOICES: { [exam: string]: string[] } = {
  NEET_UG: [
    'Physics — Mechanics',
    'Physics — Electrostatics & Magnetism',
    'Physics — Ray & Wave Optics',
    'Chemistry — Organic Chemistry',
    'Chemistry — Physical Chemistry',
    'Chemistry — Inorganic Chemistry',
    'Biology — Human Physiology',
    'Biology — Genetics & Evolution',
    'Biology — Plant Physiology'
  ],
  NDA_NA: [
    'Mathematics — Calculus & Algebra',
    'Mathematics — Trigonometry & Geometry',
    'General Ability — Physics & Chemistry',
    'General Ability — History & Geography',
    'General Ability — English Grammar'
  ],
  UPSC_CSE: [
    'Indian Polity & Governance',
    'Modern History & Freedom Struggle',
    'Indian Economy & Budget',
    'Geography & Environment',
    'Science & Technology',
    'CSAT / Quantitative Aptitude'
  ],
  SSC_CGL: [
    'Quantitative Aptitude & Geometry',
    'English Language & Comprehension',
    'General Intelligence & Reasoning',
    'General Awareness & Static GK'
  ]
};

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ userId, topicId, selectedExam = 'NEET_UG' }) => {
  const currentPredefinedSubjects = EXAM_SUBJECT_CHOICES[selectedExam] || EXAM_SUBJECT_CHOICES['NEET_UG'];

  const [activeTab, setActiveTab] = useState<'stopwatch' | 'pomodoro'>('pomodoro');

  // --- Subject & Topic State ---
  const [customSubjects, setCustomSubjects] = useState<CustomSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>(currentPredefinedSubjects[0]);
  const [topicText, setTopicText] = useState<string>('');
  
  // Custom Subject Modals
  const [showAddSubjectModal, setShowAddSubjectModal] = useState<boolean>(false);
  const [newSubjectName, setNewSubjectName] = useState<string>('');
  const [editingSubject, setEditingSubject] = useState<CustomSubject | null>(null);
  const [editSubjectName, setEditSubjectName] = useState<string>('');

  // --- Questions Attachment State ---
  const [attachedQuestions, setAttachedQuestions] = useState<PomodoroQuestionRef[]>([]);
  const [showPyqPickerModal, setShowPyqPickerModal] = useState<boolean>(false);
  const [showQbPickerModal, setShowQbPickerModal] = useState<boolean>(false);
  const [showManualQuestionModal, setShowManualQuestionModal] = useState<boolean>(false);

  // Manual Question Form State
  const [mqText, setMqText] = useState<string>('');
  const [mqOptA, setMqOptA] = useState<string>('');
  const [mqOptB, setMqOptB] = useState<string>('');
  const [mqOptC, setMqOptC] = useState<string>('');
  const [mqOptD, setMqOptD] = useState<string>('');
  const [mqCorrectOpt, setMqCorrectOpt] = useState<string>(''); // "" for unverified, or "0", "1", "2", "3"
  const [mqExplanation, setMqExplanation] = useState<string>('');
  const [mqDifficulty, setMqDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  // --- Live Stopwatch State ---
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isStopwatchActive, setIsStopwatchActive] = useState<boolean>(false);

  // --- Pomodoro State ---
  const [pomoMinutes, setPomoMinutes] = useState<number>(25);
  const [pomoSeconds, setPomoSeconds] = useState<number>(0);
  const [isPomoActive, setIsPomoActive] = useState<boolean>(false);
  const [pomoMode, setPomoMode] = useState<'focus' | 'break'>('focus');
  const [selectedPomoDuration, setSelectedPomoDuration] = useState<number>(25);
  const [customDurationInput, setCustomDurationInput] = useState<string>('');

  // Session Completion Modal
  const [completionSummary, setCompletionSummary] = useState<any | null>(null);

  // --- Session & Heartbeat ID ---
  const sessionIdRef = useRef<string>('session_' + Date.now());

  // --- General & Sound State ---
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [soundPlaying, setSoundPlaying] = useState<boolean>(false);
  const [selectedSound, setSelectedSound] = useState<'rain' | 'waves' | 'synth'>('rain');
  const [lastRewardToast, setLastRewardToast] = useState<{ xp: number; coins: number; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);

  // 1. Load Custom Subjects for authenticated user
  const fetchUserSubjects = async () => {
    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/user/subjects', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.subjects)) {
          setCustomSubjects(data.subjects);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch user subjects from API, checking local storage:', e);
    }
    // Fallback to local storage per-user
    try {
      const saved = localStorage.getItem(`aspirantx_custom_subjects_${userId || 'guest'}`);
      if (saved) {
        setCustomSubjects(JSON.parse(saved));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchUserSubjects();
    loadStudySessions(userId).then(setSessions);
  }, [userId]);

  // Restore Active Pomodoro Session State on page refresh / browser reopen
  useEffect(() => {
    try {
      const savedStateRaw = localStorage.getItem(`aspirantx_active_pomodoro_session_${userId || 'guest'}`);
      if (savedStateRaw) {
        const savedState = JSON.parse(savedStateRaw);
        if (savedState && savedState.sessionId) {
          sessionIdRef.current = savedState.sessionId;
          if (savedState.pomoMinutes !== undefined) setPomoMinutes(savedState.pomoMinutes);
          if (savedState.pomoSeconds !== undefined) setPomoSeconds(savedState.pomoSeconds);
          if (savedState.selectedPomoDuration) setSelectedPomoDuration(savedState.selectedPomoDuration);
          if (savedState.pomoMode) setPomoMode(savedState.pomoMode);
          if (savedState.selectedSubject) setSelectedSubject(savedState.selectedSubject);
          if (savedState.topicText) setTopicText(savedState.topicText);
          if (Array.isArray(savedState.attachedQuestions)) setAttachedQuestions(savedState.attachedQuestions);
        }
      }
    } catch (e) {}
  }, [userId]);

  // Save current active session state on change to survive refresh
  useEffect(() => {
    if (isPomoActive) {
      try {
        localStorage.setItem(`aspirantx_active_pomodoro_session_${userId || 'guest'}`, JSON.stringify({
          sessionId: sessionIdRef.current,
          pomoMinutes,
          pomoSeconds,
          selectedPomoDuration,
          pomoMode,
          selectedSubject,
          topicText,
          attachedQuestions,
          updatedAt: new Date().toISOString()
        }));
      } catch (e) {}
    }
  }, [isPomoActive, pomoMinutes, pomoSeconds, selectedSubject, topicText, attachedQuestions]);

  // --- Custom Subject Actions ---
  const handleAddCustomSubject = async () => {
    if (!newSubjectName.trim()) return;
    const name = newSubjectName.trim();
    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/user/subjects', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.subject) {
          setCustomSubjects((prev) => [...prev, data.subject]);
          setSelectedSubject(data.subject.name);
        }
      }
    } catch (e) {
      // Local fallback
      const localSub: CustomSubject = {
        id: `subj_${Date.now()}`,
        userId: userId || 'guest',
        name,
        createdAt: new Date().toISOString()
      };
      const updated = [...customSubjects, localSub];
      setCustomSubjects(updated);
      localStorage.setItem(`aspirantx_custom_subjects_${userId || 'guest'}`, JSON.stringify(updated));
      setSelectedSubject(name);
    }
    setNewSubjectName('');
    setShowAddSubjectModal(false);
  };

  const handleRenameSubject = async () => {
    if (!editingSubject || !editSubjectName.trim()) return;
    const newName = editSubjectName.trim();
    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/user/subjects/${editingSubject.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCustomSubjects((prev) => prev.map(s => s.id === editingSubject.id ? { ...s, name: newName } : s));
          if (selectedSubject === editingSubject.name) setSelectedSubject(newName);
        }
      }
    } catch (e) {
      setCustomSubjects((prev) => prev.map(s => s.id === editingSubject.id ? { ...s, name: newName } : s));
    }
    setEditingSubject(null);
    setEditSubjectName('');
  };

  const handleDeleteSubject = async (sub: CustomSubject) => {
    if (!confirm(`Delete custom subject "${sub.name}"?`)) return;
    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/user/subjects/${sub.id}`, { method: 'DELETE', headers });
    } catch (e) {}

    const updated = customSubjects.filter(s => s.id !== sub.id);
    setCustomSubjects(updated);
    localStorage.setItem(`aspirantx_custom_subjects_${userId || 'guest'}`, JSON.stringify(updated));
    if (selectedSubject === sub.name) {
      setSelectedSubject(currentPredefinedSubjects[0]);
    }
  };

  // --- Create Manual Question ---
  const handleCreateManualQuestion = async () => {
    if (!mqText.trim()) return;

    const opts = [mqOptA, mqOptB, mqOptC, mqOptD].filter(o => o.trim() !== '');
    const parsedOpt = mqCorrectOpt !== '' ? parseInt(mqCorrectOpt, 10) : null;
    const validCorrect = (parsedOpt !== null && !isNaN(parsedOpt) && parsedOpt >= 0 && parsedOpt <= 3) ? parsedOpt : null;
    const isVerified = validCorrect !== null;

    let createdId = `mq_${Date.now()}`;

    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/user/questions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          questionText: mqText.trim(),
          options: opts,
          correctOption: validCorrect,
          explanation: mqExplanation.trim(),
          subject: selectedSubject,
          topic: topicText || 'General Topic',
          difficulty: mqDifficulty
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.question) {
          createdId = data.question.id;
        }
      }
    } catch (e) {}

    const newRef: PomodoroQuestionRef = {
      id: createdId,
      source: 'manual',
      questionText: mqText.trim(),
      subject: selectedSubject,
      topic: topicText || 'General Topic',
      options: opts,
      correctOption: validCorrect,
      explanation: mqExplanation.trim(),
      answerVerified: isVerified
    };

    setAttachedQuestions((prev) => [...prev, newRef]);

    // Reset Form
    setMqText('');
    setMqOptA('');
    setMqOptB('');
    setMqOptC('');
    setMqOptD('');
    setMqCorrectOpt('');
    setMqExplanation('');
    setShowManualQuestionModal(false);
  };

  // --- Attach PYQ Question ---
  const handleAttachPyq = (pyq: any) => {
    const ref: PomodoroQuestionRef = {
      id: pyq.id,
      source: 'pyq',
      questionText: pyq.questionText,
      subject: pyq.subject || selectedSubject,
      topic: pyq.topic || topicText || 'PYQ Topic',
      options: pyq.options,
      correctOption: pyq.correctOption,
      explanation: pyq.explanation,
      answerVerified: true
    };

    if (!attachedQuestions.some(q => q.id === pyq.id)) {
      setAttachedQuestions((prev) => [...prev, ref]);
    }
  };

  // --- Attach Question Bank Item ---
  const handleAttachQb = (qb: any) => {
    const ref: PomodoroQuestionRef = {
      id: qb.id,
      source: 'question_bank',
      questionText: qb.questionText,
      subject: qb.subject || selectedSubject,
      topic: qb.topic || topicText || 'QB Topic',
      options: qb.options,
      correctOption: qb.correctOption,
      explanation: qb.solutionText || qb.explanation,
      answerVerified: true
    };

    if (!attachedQuestions.some(q => q.id === qb.id)) {
      setAttachedQuestions((prev) => [...prev, ref]);
    }
  };

  const handleRemoveAttachedQuestion = (id: string) => {
    setAttachedQuestions((prev) => prev.filter(q => q.id !== id));
  };

  // --- Live Tickers ---
  useEffect(() => {
    let interval: any = null;
    if (isStopwatchActive) {
      interval = setInterval(() => {
        setStopwatchSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isStopwatchActive]);

  useEffect(() => {
    let interval: any = null;
    if (isPomoActive) {
      interval = setInterval(() => {
        if (pomoSeconds > 0) {
          setPomoSeconds((s) => s - 1);
        } else if (pomoMinutes > 0) {
          setPomoMinutes((m) => m - 1);
          setPomoSeconds(59);
        } else {
          // Timer reached 00:00
          setIsPomoActive(false);
          handlePomodoroFinish();
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPomoActive, pomoMinutes, pomoSeconds]);

  // Pomodoro Completion Handler with Server XP Deduplication
  const handlePomodoroFinish = async () => {
    if (pomoMode === 'focus') {
      const durationSeconds = selectedPomoDuration * 60;
      setIsSaving(true);

      const targetId = sessionIdRef.current;
      let xpAwarded = 50;

      try {
        const token = localStorage.getItem('aspirantx_auth_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/user/study-sessions/${targetId}/complete`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            subject: selectedSubject,
            topic: topicText || 'Study Sprint',
            duration: selectedPomoDuration,
            completedDuration: durationSeconds,
            questionsAttempted: attachedQuestions.length,
            questionIds: attachedQuestions.map(q => q.id),
            questionSources: attachedQuestions.map(q => q.source),
            manualQuestions: attachedQuestions.filter(q => q.source === 'manual'),
            selectedQuestions: attachedQuestions,
            accuracy: 100
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            xpAwarded = data.xpAwarded;
            if (data.streak && typeof data.streak.streakDays === 'number') {
              window.dispatchEvent(
                new CustomEvent('aspirantx_streak_updated', {
                  detail: { streakDays: data.streak.streakDays, lastActiveDate: data.streak.lastActiveDate },
                })
              );
            }
          }
        }
      } catch (e) {}

      await saveStudySessionLog({
        userId,
        subject: selectedSubject,
        durationSeconds,
        mode: 'pomodoro',
      });

      setIsSaving(false);

      // Clear active timer state in localStorage
      localStorage.removeItem(`aspirantx_active_pomodoro_session_${userId || 'guest'}`);

      setCompletionSummary({
        subject: selectedSubject,
        topic: topicText || 'Study Sprint',
        duration: selectedPomoDuration,
        xpAwarded,
        questionsCount: attachedQuestions.length,
        pyqCount: attachedQuestions.filter(q => q.source === 'pyq').length,
        qbCount: attachedQuestions.filter(q => q.source === 'question_bank').length,
        manualCount: attachedQuestions.filter(q => q.source === 'manual').length,
      });

      const updated = await loadStudySessions(userId);
      setSessions(updated);

      setPomoMode('break');
      setPomoMinutes(5);
      setPomoSeconds(0);
    } else {
      setPomoMode('focus');
      setPomoMinutes(selectedPomoDuration);
      setPomoSeconds(0);
    }
  };

  const handleDurationSelect = (mins: number) => {
    setSelectedPomoDuration(mins);
    setPomoMinutes(mins);
    setPomoSeconds(0);
    setIsPomoActive(false);
    setPomoMode('focus');
  };

  const handleApplyCustomDuration = () => {
    const val = parseInt(customDurationInput, 10);
    if (!isNaN(val) && val > 0 && val <= 300) {
      handleDurationSelect(val);
      setCustomDurationInput('');
    }
  };

  const formatStopwatchTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const totalPomoSecs = selectedPomoDuration * 60;
  const currentPomoSecs = pomoMinutes * 60 + pomoSeconds;
  const pomoProgress = Math.round(((totalPomoSecs - currentPomoSecs) / totalPomoSecs) * 100);

  const allSubjects = [
    ...currentPredefinedSubjects,
    ...customSubjects.map(s => s.name)
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-100">
      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pomodoro')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'pomodoro'
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Pomodoro Study Planner
          </button>
          <button
            onClick={() => setActiveTab('stopwatch')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'stopwatch'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-4 h-4" /> Live Stopwatch
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hidden sm:inline-flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Exam: {selectedExam}
          </span>
        </div>
      </div>

      {/* --- POMODORO STUDY PLANNER (FEATURE 1) --- */}
      {activeTab === 'pomodoro' && (
        <div className="space-y-6">
          {/* Top Configuration Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl space-y-6 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* A) Subject Selector with Custom Subject CRUD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Tag className="w-3.5 h-3.5 text-purple-400" /> Study Subject
                  </label>
                  <button
                    onClick={() => setShowAddSubjectModal(true)}
                    className="text-[11px] font-extrabold text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20"
                  >
                    <Plus className="w-3 h-3" /> Add Subject
                  </button>
                </div>

                <div className="relative flex items-center gap-2">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <optgroup label="Standard Subjects">
                      {currentPredefinedSubjects.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </optgroup>
                    {customSubjects.length > 0 && (
                      <optgroup label="My Custom Subjects">
                        {customSubjects.map((sub) => (
                          <option key={sub.id} value={sub.name}>★ {sub.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Custom Subjects Manager Pills */}
                {customSubjects.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Custom:</span>
                    {customSubjects.map((cs) => (
                      <div
                        key={cs.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-purple-300 font-semibold"
                      >
                        <span>{cs.name}</span>
                        <button
                          onClick={() => { setEditingSubject(cs); setEditSubjectName(cs.name); }}
                          className="hover:text-cyan-400"
                          title="Rename"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(cs)}
                          className="hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* B) Topic / Chapter Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Topic / Chapter (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Current Electricity, Organic Reactions, Modern History..."
                  value={topicText}
                  onChange={(e) => setTopicText(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* C & D & H) Questions Attachment Area */}
            <div className="space-y-3 pt-2 border-t border-slate-800/60">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-pink-400" /> Attached Practice Questions ({attachedQuestions.length})
                  </h4>
                  <p className="text-[11px] text-slate-400">Attach PYQs, Question Bank items, or custom manual questions to this session.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowPyqPickerModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> PYQ
                  </button>
                  <button
                    onClick={() => setShowQbPickerModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Question Bank
                  </button>
                  <button
                    onClick={() => setShowManualQuestionModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Manual Question
                  </button>
                </div>
              </div>

              {/* Attached List */}
              {attachedQuestions.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                  {attachedQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            q.source === 'pyq' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                            q.source === 'question_bank' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {q.source === 'pyq' ? 'PYQ' : q.source === 'question_bank' ? 'QB' : 'Manual'}
                          </span>
                          {!q.answerVerified && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Answer Not Verified
                            </span>
                          )}
                        </div>
                        <p className="text-slate-200 line-clamp-2 font-medium">{q.questionText}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveAttachedQuestion(q.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Duration Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-800/60">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-purple-400" /> Sprint Duration
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {[25, 50, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDurationSelect(d)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                      selectedPomoDuration === d && pomoMode === 'focus'
                        ? 'bg-purple-500 text-white border-purple-400 shadow-lg shadow-purple-500/20'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {d} Mins
                  </button>
                ))}

                {/* Custom Duration Input */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="Custom (m)"
                    value={customDurationInput}
                    onChange={(e) => setCustomDurationInput(e.target.value)}
                    className="w-24 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleApplyCustomDuration}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pomodoro Timer Display Card */}
          <div className="p-8 md:p-12 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl text-center shadow-2xl space-y-8 relative overflow-hidden">
            <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="8" className="text-slate-950" fill="transparent" />
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="currentColor"
                  strokeWidth="8"
                  className={pomoMode === 'focus' ? 'text-purple-500' : 'text-emerald-400'}
                  strokeDasharray={2 * Math.PI * 110}
                  strokeDashoffset={(2 * Math.PI * 110 * (100 - pomoProgress)) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-5xl md:text-6xl font-black tracking-tight text-white font-mono">
                  {String(pomoMinutes).padStart(2, '0')}:{String(pomoSeconds).padStart(2, '0')}
                </span>
                <span className="text-xs uppercase font-bold tracking-widest text-slate-400 mt-2">
                  {pomoMode === 'focus' ? `${selectedSubject}` : 'Rest & Refresh'}
                </span>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-4 relative z-10">
              <button
                onClick={() => {
                  if (!isPomoActive && pomoMode === 'focus') {
                    sessionIdRef.current = 'session_' + Date.now();
                  }
                  setIsPomoActive(!isPomoActive);
                }}
                className={`px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2.5 transition-all shadow-lg ${
                  isPomoActive
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                    : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 text-white shadow-purple-500/20'
                }`}
              >
                {isPomoActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                {isPomoActive ? 'PAUSE SPRINT' : 'START POMODORO SPRINT'}
              </button>

              <button
                onClick={() => {
                  setIsPomoActive(false);
                  setPomoMinutes(selectedPomoDuration);
                  setPomoSeconds(0);
                }}
                className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                title="Reset Timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- LIVE STOPWATCH (TAB 2) --- */}
      {activeTab === 'stopwatch' && (
        <div className="p-8 md:p-12 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-8 shadow-2xl">
          <div className="text-6xl sm:text-7xl font-black text-white font-mono tracking-tight">
            {formatStopwatchTime(stopwatchSeconds)}
          </div>

          <div className="flex justify-center gap-4">
            {!isStopwatchActive ? (
              <button
                onClick={() => setIsStopwatchActive(true)}
                className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-4 h-4 fill-current" /> Start Timer
              </button>
            ) : (
              <button
                onClick={() => setIsStopwatchActive(false)}
                className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Pause className="w-4 h-4 fill-current" /> Pause
              </button>
            )}
            <button
              onClick={() => { setIsStopwatchActive(false); setStopwatchSeconds(0); }}
              className="p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- ADD CUSTOM SUBJECT MODAL --- */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-400" /> Create Custom Subject
            </h3>
            <input
              type="text"
              placeholder="e.g. Physics — Quantum Mechanics, Organic Revision..."
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-purple-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomSubject}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-white shadow-lg shadow-purple-500/20"
              >
                Save Subject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- RENAME SUBJECT MODAL --- */}
      {editingSubject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-cyan-400" /> Rename Subject
            </h3>
            <input
              type="text"
              value={editSubjectName}
              onChange={(e) => setEditSubjectName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-cyan-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingSubject(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSubject}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MANUAL QUESTION MODAL --- */}
      {showManualQuestionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" /> Create Manual Question
              </h3>
              <button onClick={() => setShowManualQuestionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Question Text *</label>
                <textarea
                  rows={3}
                  placeholder="Type your custom question text here..."
                  value={mqText}
                  onChange={(e) => setMqText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Option A</label>
                  <input
                    type="text"
                    value={mqOptA}
                    onChange={(e) => setMqOptA(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Option B</label>
                  <input
                    type="text"
                    value={mqOptB}
                    onChange={(e) => setMqOptB(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Option C</label>
                  <input
                    type="text"
                    value={mqOptC}
                    onChange={(e) => setMqOptC(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Option D</label>
                  <input
                    type="text"
                    value={mqOptD}
                    onChange={(e) => setMqOptD(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Correct Option (Optional)</label>
                <select
                  value={mqCorrectOpt}
                  onChange={(e) => setMqCorrectOpt(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                >
                  <option value="">-- Leave Unspecified (Answer Not Verified) --</option>
                  <option value="0">Option A</option>
                  <option value="1">Option B</option>
                  <option value="2">Option C</option>
                  <option value="3">Option D</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Explanation (Optional)</label>
                <input
                  type="text"
                  placeholder="Solution steps or key formula..."
                  value={mqExplanation}
                  onChange={(e) => setMqExplanation(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowManualQuestionModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateManualQuestion}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
              >
                Save & Attach Question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PYQ PICKER MODAL --- */}
      {showPyqPickerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" /> Select PYQ Question
              </h3>
              <button onClick={() => setShowPyqPickerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {INITIAL_PYQS_DATABASE.slice(0, 10).map((pyq) => (
                <div key={pyq.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-purple-400">{pyq.exam} • {pyq.year}</span>
                    <p className="text-slate-200 font-medium line-clamp-2 mt-0.5">{pyq.questionText}</p>
                  </div>
                  <button
                    onClick={() => { handleAttachPyq(pyq); setShowPyqPickerModal(false); }}
                    className="px-3 py-1.5 rounded-xl bg-purple-500 text-white font-bold text-xs shrink-0"
                  >
                    Attach
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- QUESTION BANK PICKER MODAL --- */}
      {showQbPickerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" /> Select Question Bank Item
              </h3>
              <button onClick={() => setShowQbPickerModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {INITIAL_QUESTION_BANK.slice(0, 10).map((qb) => (
                <div key={qb.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400">{qb.subject} • {qb.topic}</span>
                    <p className="text-slate-200 font-medium line-clamp-2 mt-0.5">{qb.questionText}</p>
                  </div>
                  <button
                    onClick={() => { handleAttachQb(qb); setShowQbPickerModal(false); }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shrink-0"
                  >
                    Attach
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- COMPLETION SUMMARY MODAL --- */}
      {completionSummary && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">Pomodoro Session Complete!</h3>
              <p className="text-xs text-slate-400">{completionSummary.subject} • {completionSummary.topic}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-bold">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase">Duration</span>
                <p className="text-white text-base mt-0.5">{completionSummary.duration} mins</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase">XP Awarded</span>
                <p className="text-amber-400 text-base mt-0.5">+{completionSummary.xpAwarded} XP</p>
              </div>
            </div>

            {completionSummary.questionsCount > 0 && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-left space-y-1">
                <p className="font-bold text-slate-300">Questions Practiced ({completionSummary.questionsCount}):</p>
                <div className="flex gap-2 text-[11px]">
                  <span className="text-purple-400">PYQs: {completionSummary.pyqCount}</span>
                  <span className="text-cyan-400">QB: {completionSummary.qbCount}</span>
                  <span className="text-emerald-400">Manual: {completionSummary.manualCount}</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setCompletionSummary(null)}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20"
            >
              Continue Preparation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
