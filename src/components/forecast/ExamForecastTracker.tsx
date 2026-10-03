import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Sliders,
  Target,
  BarChart3,
  ListTodo,
  BookOpen,
  Sparkles,
  RefreshCw,
  Plus,
  Play,
  Pause,
  Award,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowRight,
  Flame,
  Star,
  Check,
  RotateCcw,
  Zap,
  Filter,
  Search,
  BookCheck,
  HelpCircle
} from 'lucide-react';
import {
  ExamDefinition,
  ExamTask,
  StudentTaskProgress,
  StudySessionLog,
  TestRecord,
  CalendarAvailability,
  ForecastResult,
  WhatIfConfig,
  ForecastSnapshot,
  StudyDayType,
  TaskDifficulty,
  RevisionCycle,
  MasteryRating
} from '../../lib/forecast/types';
import { generateExamForecast } from '../../lib/forecast/forecastingEngine';
import {
  DEFAULT_JEE_EXAM,
  DEFAULT_JEE_TASKS,
  DEFAULT_STUDENT_PROGRESS,
  DEFAULT_STUDY_LOGS,
  DEFAULT_TEST_RECORDS,
  DEFAULT_CALENDAR_AVAILABILITY,
  DEFAULT_FORECAST_SNAPSHOTS
} from '../../data/forecastDefaultData';

interface ExamForecastTrackerProps {
  initialExamId?: string;
  userId?: string;
  isGuest?: boolean;
}

type ActiveView = 'dashboard' | 'syllabus' | 'logger' | 'tests' | 'simulator' | 'target' | 'analytics';

export const ExamForecastTracker: React.FC<ExamForecastTrackerProps> = ({
  initialExamId = 'JEE_MAIN',
  userId = 'guest',
  isGuest = false
}) => {
  // ── Persistent State Initialization ──────────────────────────────────────────
  const storagePrefix = `forecast_tracker_${userId}_${initialExamId}`;

  const [exam, setExam] = useState<ExamDefinition>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_exam`);
      return saved ? JSON.parse(saved) : DEFAULT_JEE_EXAM;
    } catch {
      return DEFAULT_JEE_EXAM;
    }
  });

  const [tasks, setTasks] = useState<ExamTask[]>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_tasks`);
      return saved ? JSON.parse(saved) : DEFAULT_JEE_TASKS;
    } catch {
      return DEFAULT_JEE_TASKS;
    }
  });

  const [progressMap, setProgressMap] = useState<Map<string, StudentTaskProgress>>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_progress`);
      if (saved) {
        const obj = JSON.parse(saved);
        return new Map(Object.entries(obj));
      }
      return new Map(Object.entries(DEFAULT_STUDENT_PROGRESS));
    } catch {
      return new Map(Object.entries(DEFAULT_STUDENT_PROGRESS));
    }
  });

  const [sessionLogs, setSessionLogs] = useState<StudySessionLog[]>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_logs`);
      return saved ? JSON.parse(saved) : DEFAULT_STUDY_LOGS;
    } catch {
      return DEFAULT_STUDY_LOGS;
    }
  });

  const [tests, setTests] = useState<TestRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_tests`);
      return saved ? JSON.parse(saved) : DEFAULT_TEST_RECORDS;
    } catch {
      return DEFAULT_TEST_RECORDS;
    }
  });

  const [availability, setAvailability] = useState<CalendarAvailability[]>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_availability`);
      return saved ? JSON.parse(saved) : DEFAULT_CALENDAR_AVAILABILITY;
    } catch {
      return DEFAULT_CALENDAR_AVAILABILITY;
    }
  });

  const [snapshots, setSnapshots] = useState<ForecastSnapshot[]>(() => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}_snapshots`);
      return saved ? JSON.parse(saved) : DEFAULT_FORECAST_SNAPSHOTS;
    } catch {
      return DEFAULT_FORECAST_SNAPSHOTS;
    }
  });

  // UI state
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Incomplete' | 'Completed' | 'Weak' | 'NeedsRevision'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // What-If Simulator state
  const [whatIf, setWhatIf] = useState<WhatIfConfig>({
    dailyHourDelta: 0,
    removeSundayStudy: true,
    weeklyTestCount: 0,
    extraRestDaysPerMonth: 0,
    missedDaysToSimulate: 0,
    revisionMultiplier: 1.0
  });

  // Study Session Logger modal/form state
  const [newLogPlanned, setNewLogPlanned] = useState<number>(6.0);
  const [newLogActual, setNewLogActual] = useState<number>(5.5);
  const [newLogProductive, setNewLogProductive] = useState<number>(4.8);
  const [newLogDayType, setNewLogDayType] = useState<StudyDayType>('NORMAL');
  const [newLogNotes, setNewLogNotes] = useState<string>('');

  // Live Timer state
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);

  // Target Date Calculator state
  const [customTargetDate, setCustomTargetDate] = useState<string>(exam.targetSyllabusCompletionDate || '');

  // ── Sync to LocalStorage ───────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(`${storagePrefix}_exam`, JSON.stringify(exam));
      localStorage.setItem(`${storagePrefix}_tasks`, JSON.stringify(tasks));
      const progObj = Object.fromEntries(progressMap.entries());
      localStorage.setItem(`${storagePrefix}_progress`, JSON.stringify(progObj));
      localStorage.setItem(`${storagePrefix}_logs`, JSON.stringify(sessionLogs));
      localStorage.setItem(`${storagePrefix}_tests`, JSON.stringify(tests));
      localStorage.setItem(`${storagePrefix}_availability`, JSON.stringify(availability));
      localStorage.setItem(`${storagePrefix}_snapshots`, JSON.stringify(snapshots));
    } catch (e) {
      console.warn('Forecast storage sync warning:', e);
    }
  }, [exam, tasks, progressMap, sessionLogs, tests, availability, snapshots, storagePrefix]);

  // ── Live Timer Interval ───────────────────────────────────────────────────
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // ── Run Forecasting Engine ─────────────────────────────────────────────────
  const availabilityMap = useMemo(() => {
    const map = new Map<string, CalendarAvailability>();
    availability.forEach(a => map.set(a.date, a));
    return map;
  }, [availability]);

  // Baseline forecast (without What-If modifications)
  const baselineForecast: ForecastResult = useMemo(() => {
    return generateExamForecast(exam, tasks, progressMap, sessionLogs, availabilityMap, tests);
  }, [exam, tasks, progressMap, sessionLogs, availabilityMap, tests]);

  // Simulated forecast (with What-If modifications)
  const simulatedForecast: ForecastResult = useMemo(() => {
    return generateExamForecast(exam, tasks, progressMap, sessionLogs, availabilityMap, tests, whatIf);
  }, [exam, tasks, progressMap, sessionLogs, availabilityMap, tests, whatIf]);

  const currentForecast = activeView === 'simulator' ? simulatedForecast : baselineForecast;

  // ── Topic Handlers ────────────────────────────────────────────────────────
  const toggleLearningStatus = (taskId: string) => {
    setProgressMap(prev => {
      const next = new Map(prev);
      const cur = next.get(taskId) || {
        taskId,
        learningStatus: 'pending',
        practiceStatus: 'pending',
        pyqPercentage: 0,
        revisionCycle: 0,
        masteryLevel: 1,
        plannedHours: tasks.find(t => t.id === taskId)?.estimatedHours || 10,
        actualHoursSpent: 0
      };

      if (cur.learningStatus === 'completed') {
        // Undo completion
        next.set(taskId, {
          ...cur,
          learningStatus: 'in_progress',
          completedAt: undefined
        });
      } else if (cur.learningStatus === 'in_progress') {
        next.set(taskId, {
          ...cur,
          learningStatus: 'completed',
          practiceStatus: cur.practiceStatus === 'pending' ? 'in_progress' : cur.practiceStatus,
          completedAt: new Date().toISOString()
        });
      } else {
        next.set(taskId, {
          ...cur,
          learningStatus: 'in_progress'
        });
      }
      return next;
    });
  };

  const updatePracticeStatus = (taskId: string) => {
    setProgressMap(prev => {
      const next = new Map(prev);
      const cur = next.get(taskId);
      if (!cur) return prev;
      const order: ('pending' | 'in_progress' | 'completed')[] = ['pending', 'in_progress', 'completed'];
      const nextIdx = (order.indexOf(cur.practiceStatus) + 1) % order.length;
      next.set(taskId, { ...cur, practiceStatus: order[nextIdx] });
      return next;
    });
  };

  const cycleRevision = (taskId: string) => {
    setProgressMap(prev => {
      const next = new Map(prev);
      const cur = next.get(taskId);
      if (!cur) return prev;
      const nextCycle = ((cur.revisionCycle + 1) % 4) as RevisionCycle;
      next.set(taskId, { ...cur, revisionCycle: nextCycle, lastRevisedAt: new Date().toISOString() });
      return next;
    });
  };

  const setMasteryRating = (taskId: string, rating: MasteryRating) => {
    setProgressMap(prev => {
      const next = new Map(prev);
      const cur = next.get(taskId);
      if (!cur) return prev;
      next.set(taskId, { ...cur, masteryLevel: rating });
      return next;
    });
  };

  const setPyqProgress = (taskId: string, percentage: number) => {
    setProgressMap(prev => {
      const next = new Map(prev);
      const cur = next.get(taskId);
      if (!cur) return prev;
      next.set(taskId, { ...cur, pyqPercentage: Math.max(0, Math.min(100, percentage)) });
      return next;
    });
  };

  // ── Log Submission Handler ────────────────────────────────────────────────
  const handleAddStudyLog = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toISOString().split('T')[0];
    const newLog: StudySessionLog = {
      id: `log_${Date.now()}`,
      date: todayStr,
      dayType: newLogDayType,
      plannedHours: Number(newLogPlanned) || 0,
      actualHours: Number(newLogActual) || 0,
      productiveHours: Number(newLogProductive) || 0,
      topicsCovered: [],
      notes: newLogNotes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    setSessionLogs(prev => [newLog, ...prev]);
    setNewLogNotes('');
    alert('✅ Study session logged successfully! Forecast updated.');
  };

  const handleSaveTimerSession = () => {
    const hours = Math.round((timerSeconds / 3600) * 10) / 10;
    if (hours <= 0.1) {
      alert('Session too short to record (< 6 minutes).');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const newLog: StudySessionLog = {
      id: `timer_log_${Date.now()}`,
      date: todayStr,
      dayType: 'NORMAL',
      plannedHours: hours,
      actualHours: hours,
      productiveHours: Math.round(hours * 0.9 * 10) / 10,
      topicsCovered: [],
      notes: `Recorded with live focus stopwatch (${Math.floor(timerSeconds / 60)} min)`,
      createdAt: new Date().toISOString()
    };
    setSessionLogs(prev => [newLog, ...prev]);
    setIsTimerRunning(false);
    setTimerSeconds(0);
    alert(`🎉 Awesome! Logged ${hours} hours of live study session.`);
  };

  // ── Reset to Demo Data Handler ─────────────────────────────────────────────
  const handleResetDemoData = () => {
    if (confirm('Reset tracker to demo fresher state for JEE Main? All mock history will be restored.')) {
      setExam(DEFAULT_JEE_EXAM);
      setTasks(DEFAULT_JEE_TASKS);
      setProgressMap(new Map(Object.entries(DEFAULT_STUDENT_PROGRESS)));
      setSessionLogs(DEFAULT_STUDY_LOGS);
      setTests(DEFAULT_TEST_RECORDS);
      setAvailability(DEFAULT_CALENDAR_AVAILABILITY);
      setSnapshots(DEFAULT_FORECAST_SNAPSHOTS);
    }
  };

  // ── Filtered Tasks ────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (selectedSubject !== 'All' && t.subject !== selectedSubject) return false;
      const prog = progressMap.get(t.id);

      if (statusFilter === 'Completed' && prog?.learningStatus !== 'completed') return false;
      if (statusFilter === 'Incomplete' && prog?.learningStatus === 'completed') return false;
      if (statusFilter === 'Weak' && (!prog || prog.masteryLevel >= 3)) return false;
      if (statusFilter === 'NeedsRevision' && (!prog || prog.learningStatus !== 'completed' || prog.revisionCycle >= 2)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
      }
      return true;
    });
  }, [tasks, selectedSubject, statusFilter, searchQuery, progressMap]);

  // Date formatter
  const formatNiceDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── TOP HEADER & COUNTDOWN ──────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {exam.category}
                </span>
                <span className="text-xs text-slate-400">
                  Forecast Engine v2.8 • Dynamic Adaptive Modeling
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                {exam.name}
                <span className="text-xs font-normal px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live Forecasting
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Real-time syllabus completion projections grounded in your observed study velocity, rest days, and revision cycles.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Exam Date Counter */}
              <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-center min-w-[120px]">
                <div className="text-xs text-slate-400 font-medium">Exam Date</div>
                <div className="text-base font-bold text-indigo-300">{formatNiceDate(exam.examDate)}</div>
                <div className="text-[11px] text-amber-400 font-medium">
                  {currentForecast.daysUntilExam} days away ({currentForecast.effectiveStudyDaysRemaining} study days)
                </div>
              </div>

              {/* Reset to Demo */}
              <button
                onClick={handleResetDemoData}
                title="Reset to sample student data"
                className="px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                Reset Demo
              </button>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 mt-6 overflow-x-auto pb-1 scrollbar-none border-t border-slate-800/80 pt-4">
            {[
              { id: 'dashboard', label: 'Forecast Overview', icon: Sparkles },
              { id: 'syllabus', label: 'Syllabus & Mastery', icon: ListTodo },
              { id: 'logger', label: 'Log Study & Timer', icon: Clock },
              { id: 'tests', label: 'Tests & Mock Analysis', icon: BookCheck },
              { id: 'simulator', label: 'What-If Simulator', icon: Sliders },
              { id: 'target', label: 'Target Date Calculator', icon: Target },
              { id: 'analytics', label: 'Trajectory & History', icon: BarChart3 }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as ActiveView)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'simulator' && activeView !== 'simulator' && whatIf.dailyHourDelta !== 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── VIEW 1: DASHBOARD / OVERVIEW ─────────────────────────────────── */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">

            {/* THREE PRIMARY SCENARIOS BANNER */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    Probabilistic Syllabus Completion Scenarios
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Calculated from your rolling 21-day average ({currentForecast.currentDailyProductiveAverage}h/day productive focus) and calendar availability.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Confidence:</span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    currentForecast.confidenceLevel === 'High' ? 'bg-emerald-500/20 text-emerald-300' :
                    currentForecast.confidenceLevel === 'Medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {currentForecast.confidenceLevel}
                  </span>
                </div>
              </div>

              {/* The 3 Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Fast Scenario */}
                <div className="bg-gradient-to-b from-indigo-950/40 to-slate-950/60 border border-indigo-500/30 rounded-xl p-4 sm:p-5 relative overflow-hidden group hover:border-indigo-400/60 transition">
                  <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold mb-2">
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-400" /> FAST SCENARIO
                    </span>
                    <span className="text-[11px] text-indigo-400/80">Upper Pace (~115%)</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {formatNiceDate(currentForecast.fastDate)}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Disciplined execution with high focus adherence and minimal prerequisite friction.
                  </p>
                </div>

                {/* Realistic Scenario (Highlighted) */}
                <div className="bg-gradient-to-b from-emerald-950/40 to-slate-950/80 border-2 border-emerald-500/50 rounded-xl p-4 sm:p-5 relative overflow-hidden shadow-lg shadow-emerald-500/10">
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    MOST LIKELY
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold mb-2">
                    <Target className="w-4 h-4 text-emerald-400" /> REALISTIC SCENARIO
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-200 tracking-tight">
                    {formatNiceDate(currentForecast.realisticDate)}
                  </div>
                  <p className="text-xs text-slate-300 mt-2">
                    Expected window: <span className="font-semibold text-white">{formatNiceDate(currentForecast.expectedRangeStart)}</span> to <span className="font-semibold text-white">{formatNiceDate(currentForecast.expectedRangeEnd)}</span>.
                  </p>
                </div>

                {/* Slow Scenario */}
                <div className="bg-gradient-to-b from-slate-900/60 to-slate-950/60 border border-slate-800 rounded-xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" /> SLOW SCENARIO
                    </span>
                    <span className="text-[11px] text-slate-500">Lower Pace (~82%)</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-200 tracking-tight">
                    {formatNiceDate(currentForecast.slowDate)}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    Accounts for unexpected disruptions, difficult chapters, and family commitments.
                  </p>
                </div>
              </div>

              {/* Revision Buffer Callout */}
              <div className="mt-5 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-slate-300">
                    <strong className="text-white">Revision Buffer:</strong> {currentForecast.revisionBufferDays} days remaining between syllabus finish and exam day.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    Planned Revision Finish: <strong className="text-indigo-300">{formatNiceDate(currentForecast.plannedRevisionCompletionDate)}</strong>
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    currentForecast.revisionBufferDays >= 30 ? 'bg-emerald-500/20 text-emerald-300' :
                    currentForecast.revisionBufferDays >= 15 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {currentForecast.revisionBufferDays >= 30 ? 'Healthy Buffer' : currentForecast.revisionBufferDays >= 15 ? 'Moderate Buffer' : 'Critical Buffer'}
                  </span>
                </div>
              </div>
            </div>

            {/* METRICS GRID: PROGRESS, WORKLOAD, BACKLOG, PACE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Syllabus Completion vs Mastery */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5">
                <div className="text-xs text-slate-400 font-medium mb-1">Syllabus vs Mastery</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">{currentForecast.syllabusCompletionPercentage}%</span>
                  <span className="text-xs text-slate-400">theory completed</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${currentForecast.syllabusCompletionPercentage}%` }}></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>Strong / Mastered:</span>
                  <span className="font-bold text-emerald-400">{currentForecast.masteryCoveragePercentage}%</span>
                </div>
              </div>

              {/* 2. Remaining Workload */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5">
                <div className="text-xs text-slate-400 font-medium mb-1">Remaining Workload</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-indigo-300">{currentForecast.remainingWorkloadHours}</span>
                  <span className="text-xs text-slate-400">effective hours</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                  Includes learning theory, practice sets, 80% PYQ quota, and revision passes.
                </p>
              </div>

              {/* 3. Current Sustainable Pace */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5">
                <div className="text-xs text-slate-400 font-medium mb-1">Sustainable Study Pace</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400">{currentForecast.currentPaceHoursPerWeek}</span>
                  <span className="text-xs text-slate-400">hrs / week</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-3">
                  <span>Trend:</span>
                  {currentForecast.recentTrend === 'improving' ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5"><TrendingUp className="w-3.5 h-3.5" /> Improving (+12%)</span>
                  ) : currentForecast.recentTrend === 'declining' ? (
                    <span className="text-rose-400 font-bold flex items-center gap-0.5"><TrendingDown className="w-3.5 h-3.5" /> Softening (-10%)</span>
                  ) : (
                    <span className="text-slate-300 font-bold">Stable</span>
                  )}
                </div>
              </div>

              {/* 4. Accumulated Backlog */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 sm:p-5">
                <div className="text-xs text-slate-400 font-medium mb-1">Accumulated Backlog</div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl font-black ${currentForecast.backlogHours > 12 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {currentForecast.backlogHours}h
                  </span>
                  <span className="text-xs text-slate-400">unplanned gap</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-3">
                  Recovery: <strong className="text-indigo-300">+{currentForecast.recoveryHoursPerWeek}h/week</strong> (sustainable rate)
                </div>
              </div>
            </div>

            {/* ACTIONABLE WARNINGS & RISK DETECTION */}
            {currentForecast.warnings.length > 0 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Active Forecast Insights & Advisories ({currentForecast.warnings.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentForecast.warnings.map(w => (
                    <div
                      key={w.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                        w.severity === 'critical' ? 'bg-rose-950/30 border-rose-800/60 text-rose-200' :
                        w.severity === 'warning' ? 'bg-amber-950/30 border-amber-800/60 text-amber-200' :
                        'bg-blue-950/30 border-blue-800/60 text-blue-200'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5 text-white">
                        <span>{w.title}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{w.message}</p>
                      <div className="text-[11px] font-medium text-indigo-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        💡 <strong>Action:</strong> {w.actionableTip}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* QUICK ACTIONS ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveView('syllabus')}
                className="p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition group"
              >
                <div className="text-xs text-indigo-400 font-semibold mb-1 flex items-center justify-between">
                  <span>Mark Tasks Complete</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
                <div className="text-sm font-bold text-white">Syllabus & Mastery Tracker</div>
                <p className="text-xs text-slate-400 mt-1">Tick chapters, update PYQ % and revision cycles.</p>
              </button>

              <button
                onClick={() => setActiveView('logger')}
                className="p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition group"
              >
                <div className="text-xs text-emerald-400 font-semibold mb-1 flex items-center justify-between">
                  <span>Record Today's Work</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
                <div className="text-sm font-bold text-white">Daily Study Logger & Timer</div>
                <p className="text-xs text-slate-400 mt-1">Log productive study hours and day types.</p>
              </button>

              <button
                onClick={() => setActiveView('simulator')}
                className="p-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-left transition group"
              >
                <div className="text-xs text-amber-400 font-semibold mb-1 flex items-center justify-between">
                  <span>Test Scenarios</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
                <div className="text-sm font-bold text-white">What-If Schedule Simulator</div>
                <p className="text-xs text-slate-400 mt-1">See impact of +1h/day, missed days, or weekly tests.</p>
              </button>
            </div>

          </div>
        )}

        {/* ── VIEW 2: SYLLABUS & MASTERY CHECKLIST ─────────────────────────── */}
        {activeView === 'syllabus' && (
          <div className="space-y-4">
            {/* Subject Filters and Search */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {['All', ...exam.subjects].map(subj => (
                  <button
                    key={subj}
                    onClick={() => setSelectedSubject(subj)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      selectedSubject === subj
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 text-xs rounded-xl px-3 py-1.5 text-slate-200 outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="Incomplete">Incomplete Tasks</option>
                  <option value="Completed">Completed Tasks</option>
                  <option value="Weak">Weak / Low Mastery (≤2★)</option>
                  <option value="NeedsRevision">Needs Revision Cycle</option>
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search chapter..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-xs rounded-xl pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 outline-none w-40 sm:w-48"
                  />
                </div>
              </div>
            </div>

            {/* Explanatory banner */}
            <div className="bg-indigo-950/30 border border-indigo-900/40 rounded-xl p-3 text-xs text-indigo-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>
                <strong>Distinction:</strong> Marking a chapter complete tracks <em>theory coverage</em>. Use the <strong>Practice</strong>, <strong>PYQ %</strong>, and <strong>Mastery Stars (1–5)</strong> to reflect genuine exam-readiness.
              </span>
            </div>

            {/* Task Cards List */}
            <div className="space-y-2.5">
              {filteredTasks.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">
                  No chapters found matching current filters.
                </div>
              ) : (
                filteredTasks.map(task => {
                  const prog = progressMap.get(task.id) || {
                    taskId: task.id,
                    learningStatus: 'pending',
                    practiceStatus: 'pending',
                    pyqPercentage: 0,
                    revisionCycle: 0,
                    masteryLevel: 1,
                    plannedHours: task.estimatedHours,
                    actualHoursSpent: 0
                  };

                  const isCompleted = prog.learningStatus === 'completed';
                  const isInProgress = prog.learningStatus === 'in_progress';

                  return (
                    <div
                      key={task.id}
                      className={`border rounded-xl p-3.5 sm:p-4 transition-all ${
                        isCompleted
                          ? 'bg-slate-900/90 border-slate-800'
                          : isInProgress
                          ? 'bg-indigo-950/20 border-indigo-800/40'
                          : 'bg-slate-900/40 border-slate-850'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Title & Checkbox */}
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={() => toggleLearningStatus(task.id)}
                            className="mt-0.5 text-slate-400 hover:text-white transition flex-shrink-0"
                            title={isCompleted ? 'Click to undo completion' : 'Click to mark theory completed'}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : isInProgress ? (
                              <div className="w-5 h-5 rounded-full border-2 border-indigo-400 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                              </div>
                            ) : (
                              <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                            )}
                          </button>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-semibold text-indigo-400">{task.subject}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-xs text-slate-400">{task.estimatedHours}h est.</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                task.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' :
                                task.difficulty === 'Medium' ? 'bg-blue-500/10 text-blue-400' :
                                task.difficulty === 'Hard' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {task.difficulty}
                              </span>
                              {task.prerequisites && task.prerequisites.length > 0 && (
                                <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                                  Has Prerequisite
                                </span>
                              )}
                            </div>

                            <div className={`text-sm sm:text-base font-bold mt-0.5 ${isCompleted ? 'text-slate-200' : 'text-white'}`}>
                              {task.title}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Stages: Practice, PYQ, Revision, Mastery */}
                        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 pl-8 sm:pl-0">
                          {/* Practice Pill */}
                          <button
                            onClick={() => updatePracticeStatus(task.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                              prog.practiceStatus === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                              prog.practiceStatus === 'in_progress' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' :
                              'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                            }`}
                            title="Click to cycle Practice Status (Pending -> In-Progress -> Completed)"
                          >
                            Practice: {prog.practiceStatus}
                          </button>

                          {/* PYQ Percentage Quick-Selector */}
                          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-2 py-1 rounded-lg text-xs">
                            <span className="text-slate-400">PYQ:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="10"
                              value={prog.pyqPercentage}
                              onChange={e => setPyqProgress(task.id, Number(e.target.value) || 0)}
                              className="w-10 bg-slate-900 border border-slate-700 text-center font-bold text-indigo-300 rounded px-1 py-0.5 outline-none"
                            />
                            <span className="text-slate-400">%</span>
                          </div>

                          {/* Revision Cycle Pill */}
                          <button
                            onClick={() => cycleRevision(task.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                              prog.revisionCycle >= 2 ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                              prog.revisionCycle === 1 ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                              'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                            }`}
                            title="Click to advance Revision Cycle (0 -> 1 -> 2 -> 3)"
                          >
                            Rev: {prog.revisionCycle === 0 ? 'Pending' : `Cycle ${prog.revisionCycle}`}
                          </button>

                          {/* Mastery Rating (1 to 5 stars) */}
                          <div className="flex items-center gap-0.5 bg-slate-850 px-2 py-1 rounded-lg border border-slate-700">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                onClick={() => setMasteryRating(task.id, star as MasteryRating)}
                                className="text-slate-500 hover:text-amber-400 transition"
                                title={`Rate confidence: ${star}/5`}
                              >
                                <Star
                                  className={`w-3.5 h-3.5 ${
                                    star <= (prog.masteryLevel || 1)
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-slate-600'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── VIEW 3: STUDY ACTIVITY LOGGER & TIMER ───────────────────────── */}
        {activeView === 'logger' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Live Stopwatch & Manual Log Form */}
            <div className="lg:col-span-1 space-y-6">

              {/* LIVE TIMER CARD */}
              <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl p-5 shadow-xl text-center">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Live Focus Session</div>
                <div className="text-4xl sm:text-5xl font-black font-mono text-white tracking-widest my-3">
                  {String(Math.floor(timerSeconds / 3600)).padStart(2, '0')}:
                  {String(Math.floor((timerSeconds % 3600) / 60)).padStart(2, '0')}:
                  {String(timerSeconds % 60).padStart(2, '0')}
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Track actual productive focus in real-time.
                </p>

                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition ${
                      isTimerRunning
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                    }`}
                  >
                    {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isTimerRunning ? 'Pause Session' : 'Start Focus'}
                  </button>

                  <button
                    onClick={handleSaveTimerSession}
                    disabled={timerSeconds < 60}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition"
                  >
                    Save to Logs
                  </button>
                </div>
              </div>

              {/* MANUAL STUDY LOG FORM */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  Log Daily Study Hours
                </h3>

                <form onSubmit={handleAddStudyLog} className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Day Classification</label>
                    <select
                      value={newLogDayType}
                      onChange={e => setNewLogDayType(e.target.value as StudyDayType)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none"
                    >
                      <option value="NORMAL">Normal Study Day (100% capacity)</option>
                      <option value="FULL_STUDY">Full Focus Day (125% capacity)</option>
                      <option value="LIGHT">Light Day / College (50% capacity)</option>
                      <option value="COACHING_DAY">Coaching / Classes Day (70% capacity)</option>
                      <option value="REVISION_DAY">Dedicated Revision Day</option>
                      <option value="TEST_DAY">Mock Test Day</option>
                      <option value="REST_DAY">Rest / Recovery Day (0%)</option>
                      <option value="MISSED_DAY">Unplanned Missed Day (0%)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-1">Planned (h)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="16"
                        value={newLogPlanned}
                        onChange={e => setNewLogPlanned(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-center font-bold text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Actual (h)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="16"
                        value={newLogActual}
                        onChange={e => setNewLogActual(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-center font-bold text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Productive (h)</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="16"
                        value={newLogProductive}
                        onChange={e => setNewLogProductive(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-center font-bold text-emerald-400 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Session Notes (optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Completed Kinematics 2D exercises"
                      value={newLogNotes}
                      onChange={e => setNewLogNotes(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/30"
                  >
                    Submit Study Log
                  </button>
                </form>
              </div>

            </div>

            {/* Right Column: Recent Activity Logs List */}
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Logged Study History ({sessionLogs.length} sessions)
                </h3>
                <span className="text-xs text-slate-400">
                  Rolling 21-day average: <strong className="text-emerald-400">{currentForecast.currentDailyProductiveAverage}h/day</strong>
                </span>
              </div>

              <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
                {sessionLogs.map(log => (
                  <div
                    key={log.id}
                    className="bg-slate-850/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{formatNiceDate(log.date)}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-indigo-300">
                          {log.dayType.replace('_', ' ')}
                        </span>
                      </div>
                      {log.notes && <p className="text-slate-400 text-[11px] mt-1">{log.notes}</p>}
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <div className="text-emerald-400 font-bold">{log.productiveHours}h productive</div>
                        <div className="text-[10px] text-slate-500">
                          {log.actualHours}h actual / {log.plannedHours}h planned
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 4: TESTS & MOCK ANALYSIS ──────────────────────────────── */}
        {activeView === 'tests' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BookCheck className="w-5 h-5 text-indigo-400" />
                    Assessment & Mock Test Workload
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Remember: Test analysis duration is essential preparation time, but does NOT count as new syllabus completion.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tests.map(t => (
                  <div key={t.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{t.testName}</span>
                      <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-indigo-500/20 text-indigo-300">
                        {t.testType.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-2 border-y border-slate-850">
                      <div>
                        <span className="text-slate-500">Score:</span>{' '}
                        <strong className="text-emerald-400">{t.score} / {t.totalMarks}</strong> ({t.accuracyPercentage}% acc.)
                      </div>
                      <div>
                        <span className="text-slate-500">Duration:</span>{' '}
                        <strong className="text-white">{t.testDurationHours}h test + {t.analysisDurationHours}h analysis</strong>
                      </div>
                    </div>

                    {t.weakTaskIds.length > 0 && (
                      <div className="text-[11px] text-amber-300 bg-amber-950/30 p-2 rounded-lg border border-amber-900/30">
                        ⚠️ Weak Topics Identified: {t.weakTaskIds.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 5: WHAT-IF SCHEDULE SIMULATOR ──────────────────────────── */}
        {activeView === 'simulator' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/40 rounded-2xl p-5 sm:p-7 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-indigo-400" />
                    Interactive What-If Schedule Simulator
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    Adjust study habits below to instantly see how completion dates and revision buffers adapt in real-time.
                  </p>
                </div>

                <button
                  onClick={() => setWhatIf({
                    dailyHourDelta: 0,
                    removeSundayStudy: true,
                    weeklyTestCount: 0,
                    extraRestDaysPerMonth: 0,
                    missedDaysToSimulate: 0,
                    revisionMultiplier: 1.0
                  })}
                  className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Reset Sliders
                </button>
              </div>

              {/* Dynamic Comparison Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Baseline Realistic Date</div>
                  <div className="text-xl font-bold text-slate-300">{formatNiceDate(baselineForecast.realisticDate)}</div>
                  <div className="text-xs text-slate-500 mt-1">At {baselineForecast.currentPaceHoursPerWeek} hrs/week</div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/50">
                  <div className="text-xs text-indigo-300 font-semibold mb-1">Simulated Realistic Date</div>
                  <div className="text-2xl font-black text-indigo-200">{formatNiceDate(simulatedForecast.realisticDate)}</div>
                  <div className="text-xs text-indigo-400 mt-1">
                    At {simulatedForecast.currentPaceHoursPerWeek} hrs/week ({simulatedForecast.revisionBufferDays}d buffer)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Impact Shift</div>
                  <div className="text-xl font-bold text-white">
                    {simulatedForecast.realisticDate < baselineForecast.realisticDate ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        🚀 Finishes earlier
                      </span>
                    ) : simulatedForecast.realisticDate > baselineForecast.realisticDate ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        ⏳ Extended timeline
                      </span>
                    ) : (
                      <span className="text-slate-400">No shift</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Simulated fast: {formatNiceDate(simulatedForecast.fastDate)}
                  </div>
                </div>
              </div>

              {/* Sliders & Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/60 p-5 rounded-xl border border-slate-800 text-xs">
                {/* 1. Daily Hour Adjustment */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-300">Daily Study Hours Adjustment</span>
                    <span className="font-bold text-indigo-400">
                      {whatIf.dailyHourDelta > 0 ? `+${whatIf.dailyHourDelta}h/day` : `${whatIf.dailyHourDelta}h/day`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="3"
                    step="0.5"
                    value={whatIf.dailyHourDelta}
                    onChange={e => setWhatIf({ ...whatIf, dailyHourDelta: Number(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>-2h (lighter)</span>
                    <span>Baseline</span>
                    <span>+3h (surge)</span>
                  </div>
                </div>

                {/* 2. Sunday Study vs Rest Day */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-300">Weekly Rest Day</span>
                    <span className="font-bold text-indigo-400">
                      {whatIf.removeSundayStudy ? 'Sunday Off (Rest)' : 'Study on Sundays'}
                    </span>
                  </div>
                  <button
                    onClick={() => setWhatIf({ ...whatIf, removeSundayStudy: !whatIf.removeSundayStudy })}
                    className={`w-full py-2 rounded-lg font-bold text-xs border transition ${
                      whatIf.removeSundayStudy
                        ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {whatIf.removeSundayStudy ? 'Rest Day Protected (Recommended)' : 'Sunday Active Study'}
                  </button>
                </div>

                {/* 3. Weekly Mock Tests */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-300">Weekly Mock Tests Added</span>
                    <span className="font-bold text-indigo-400">+{whatIf.weeklyTestCount} mock/week</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    value={whatIf.weeklyTestCount}
                    onChange={e => setWhatIf({ ...whatIf, weeklyTestCount: Number(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Adds 3h test + 2h analysis workload to your prep schedule.
                  </p>
                </div>

                {/* 4. Revision Intensity */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-300">Revision Pass Intensity</span>
                    <span className="font-bold text-indigo-400">{Math.round(whatIf.revisionMultiplier * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.8"
                    step="0.1"
                    value={whatIf.revisionMultiplier}
                    onChange={e => setWhatIf({ ...whatIf, revisionMultiplier: Number(e.target.value) })}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Scales workload required for full multiple revision cycles.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── VIEW 6: TARGET DATE CALCULATOR ──────────────────────────────── */}
        {activeView === 'target' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-indigo-400" />
                Target Date Feasibility Calculator
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-6">
                Enter your desired date to complete the syllabus. The engine calculates the required weekly hours and evaluates mathematical feasibility.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
                <input
                  type="date"
                  value={customTargetDate}
                  onChange={e => {
                    setCustomTargetDate(e.target.value);
                    setExam({ ...exam, targetSyllabusCompletionDate: e.target.value });
                  }}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white outline-none w-full sm:w-64"
                />
                <span className="text-xs text-slate-500">
                  (Currently targeting {formatNiceDate(customTargetDate)})
                </span>
              </div>

              {currentForecast.targetCalculation && (
                <div className={`p-5 rounded-xl border text-xs space-y-4 ${
                  currentForecast.targetCalculation.isFeasible
                    ? 'bg-slate-950 border-emerald-500/40 text-slate-200'
                    : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="text-slate-400 mb-1">Required Pace</div>
                      <div className="text-2xl font-black text-white">
                        {currentForecast.targetCalculation.requiredWeeklyHours} hrs/week
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        ~{currentForecast.targetCalculation.requiredDailyHours}h daily average
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 mb-1">Current Observed Pace</div>
                      <div className="text-2xl font-black text-indigo-300">
                        {currentForecast.currentPaceHoursPerWeek} hrs/week
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Gap: {currentForecast.targetCalculation.gapWeeklyHours > 0 ? (
                          <span className="text-amber-400 font-bold">+{currentForecast.targetCalculation.gapWeeklyHours}h/week needed</span>
                        ) : (
                          <span className="text-emerald-400 font-bold">Ahead of schedule</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-400 mb-1">Feasibility Status</div>
                      <div className={`text-xl font-bold ${currentForecast.targetCalculation.isFeasible ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {currentForecast.targetCalculation.isFeasible ? '✅ Feasible' : '⚠️ High Risk'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {currentForecast.targetCalculation.availableBufferDays} days cushion
                      </div>
                    </div>
                  </div>

                  <p className="p-3 bg-slate-900/80 rounded-lg text-slate-300 leading-relaxed border border-slate-800">
                    {currentForecast.targetCalculation.explanation}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── VIEW 7: ANALYTICS & HISTORICAL SNAPSHOTS ─────────────────────── */}
        {activeView === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                Forecast Trajectory & Historical Evolution
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-6">
                Review how your projected completion date evolved over time as your study pace and recovery days changed.
              </p>

              <div className="space-y-3">
                {snapshots.map(s => (
                  <div key={s.id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-bold text-white">Snapshot taken: {formatNiceDate(s.date)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Pace: {s.weeklyPaceHours}h/week</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">{s.remainingHours}h remaining</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400">Projected Realistic Finish:</span>
                      <span className="font-bold text-emerald-400 text-sm">{formatNiceDate(s.projectedRealisticDate)}</span>
                      <span className="text-slate-500 text-[11px]">
                        (Range: {formatNiceDate(s.projectedFastDate)} – {formatNiceDate(s.projectedSlowDate)})
                      </span>
                    </div>

                    <p className="text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-850 text-[11px] leading-relaxed">
                      💬 <em>{s.explanation}</em>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
