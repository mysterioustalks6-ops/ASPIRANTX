import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Flame, 
  Sparkles, 
  Clock, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Shield, 
  AlertTriangle, 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  Globe2, 
  History, 
  ChevronRight, 
  X, 
  Compass, 
  Tag,
  Zap,
  Award,
  PieChart
} from 'lucide-react';
import { saveStudySessionLog, loadStudySessions } from '../lib/gamification';
import { StudySession, CustomSubject, PomodoroQuestionRef } from '../types';
import { fetchOfficialSyllabus, OfficialSyllabusNode } from '../lib/unifiedSyllabus';
import { PomodoroHistoryView } from './PomodoroHistoryView';
import { PomodoroAnalytics } from './PomodoroAnalytics';
import { GalaxyStudyChecklist } from './GalaxyStudyChecklist';
import { useFocusProgression, SessionCompleteModal, FocusSessionRewardResult } from '../features/focus/progression';
import { PlanetarySystem } from '../features/focus/galaxy/PlanetarySystem';
import { getExamConfig, normalizeExamId } from '../lib/examRegistry';
import { useExam } from '../context/ExamContext';
import { triggerConfetti, PressFeedback } from '../lib/animations';

// ═══════════════════════════════════════════════════════════════════════════════
// ZERO-ASSET WEB AUDIO FOCUS ENGINE (OFFLINE & BROWSER NATIVE)
// ═══════════════════════════════════════════════════════════════════════════════
class FocusAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  public isRunning = false;

  start(soundType: 'drone' | 'solar' | 'harmonics', volume = 0.5) {
    this.stop();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(volume * 0.35, this.ctx.currentTime + 1.2);
      this.masterGain.connect(this.ctx.destination);
      this.isRunning = true;

      if (soundType === 'drone') {
        // Deep Space 432Hz Drone with 6Hz Theta frequency binaural beat
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const subOsc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = 'sine';
        osc1.frequency.value = 108; // Root harmonic
        osc2.type = 'sine';
        osc2.frequency.value = 114; // 6Hz Theta binaural beat
        subOsc.type = 'triangle';
        subOsc.frequency.value = 54; // Deep sub-bass resonance

        filter.type = 'lowpass';
        filter.frequency.value = 350;

        osc1.connect(filter);
        osc2.connect(filter);
        subOsc.connect(filter);
        filter.connect(this.masterGain);

        osc1.start();
        osc2.start();
        subOsc.start();
      } else if (soundType === 'solar') {
        // Solar Wind White/Pink Noise with slow sweep
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02; // Pink noise filter
          lastOut = output[i];
          output[i] *= 3.5;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 450;
        filter.Q.value = 2.0;

        whiteNoise.connect(filter);
        filter.connect(this.masterGain);
        whiteNoise.start();
      } else if (soundType === 'harmonics') {
        // Celestial Harmonic Chords (F, A, C, E)
        const freqs = [174, 285, 396, 528];
        freqs.forEach((freq) => {
          if (!this.ctx || !this.masterGain) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.value = 0.25;
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start();
        });
      }
    } catch (e) {
      console.warn('Web Audio focus engine init error:', e);
    }
  }

  setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(volume * 0.35, this.ctx.currentTime);
    }
  }

  stop() {
    try {
      if (this.ctx) {
        this.ctx.close();
        this.ctx = null;
      }
    } catch {}
    this.isRunning = false;
  }
}

interface PomodoroTimerProps {
  userId?: string;
  topicId?: string;
  selectedExam?: string;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ 
  userId = 'guest', 
  topicId, 
  selectedExam 
}) => {
  const { selectedExamId } = useExam();
  const activeExamId = normalizeExamId(selectedExam || selectedExamId);
  const examConfig = getExamConfig(activeExamId);

  // 1. Navigation View Tabs (Pomodoro, Analytics, Stopwatch, History, Galaxy)
  const [activeTab, setActiveTab] = useState<'pomodoro' | 'analytics' | 'stopwatch' | 'history' | 'galaxy'>('pomodoro');

  // 2. Progression Hook (Levels 1 to 1000)
  const [streakDays, setStreakDays] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(`aspirantx_focus_streak_${userId}`);
      return stored ? Math.max(1, parseInt(stored, 10)) : 1;
    } catch {
      return 1;
    }
  });

  const {
    totalDust,
    progression,
    milestone,
    addSessionReward
  } = useFocusProgression(userId, streakDays);

  // 3. Audio Synth Engine
  const audioEngineRef = useRef<FocusAudioEngine | null>(null);
  const [soundPlaying, setSoundPlaying] = useState<boolean>(false);
  const [selectedSound, setSelectedSound] = useState<'drone' | 'solar' | 'harmonics'>('drone');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.5);

  useEffect(() => {
    return () => {
      audioEngineRef.current?.stop();
    };
  }, []);

  // 4. Subjects & Syllabus Integration
  const currentPredefinedSubjects = useMemo(() => {
    if (examConfig && examConfig.subjects && examConfig.subjects.length > 0) {
      return examConfig.subjects;
    }
    return ['General Studies', 'Mathematics', 'Science', 'English', 'Reasoning'];
  }, [examConfig]);

  const [selectedSubject, setSelectedSubject] = useState<string>(() => {
    return currentPredefinedSubjects[0] || 'General Studies';
  });

  useEffect(() => {
    if (currentPredefinedSubjects.length > 0 && !currentPredefinedSubjects.includes(selectedSubject)) {
      setSelectedSubject(currentPredefinedSubjects[0]);
    }
  }, [currentPredefinedSubjects]);

  const [customSubjects, setCustomSubjects] = useState<CustomSubject[]>(() => {
    try {
      const stored = localStorage.getItem(`aspirantx_custom_subjects_${userId || 'guest'}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [showAddSubjectModal, setShowAddSubjectModal] = useState<boolean>(false);
  const [newSubjectName, setNewSubjectName] = useState<string>('');

  const [officialNodes, setOfficialNodes] = useState<OfficialSyllabusNode[]>([]);
  const [selectedSyllabusNodeId, setSelectedSyllabusNodeId] = useState<string | null>(topicId || null);
  const [topicText, setTopicText] = useState<string>('');

  // Fetch Syllabus Nodes for Active Exam
  useEffect(() => {
    let unmounted = false;
    const loadNodes = async () => {
      try {
        const nodes = await fetchOfficialSyllabus(activeExamId);
        if (!unmounted && Array.isArray(nodes)) {
          setOfficialNodes(nodes);
        }
      } catch (err) {
        console.warn('Could not load official syllabus nodes:', err);
      }
    };
    loadNodes();
    return () => { unmounted = true; };
  }, [activeExamId]);

  const syllabusOptions = useMemo(() => {
    return officialNodes
      .filter(n => !selectedSubject || n.subject.toLowerCase() === selectedSubject.toLowerCase())
      .map(n => ({
        id: n.id,
        label: `${n.subject} • ${n.chapter || n.topic || n.title || 'Topic'}`
      }));
  }, [officialNodes, selectedSubject]);

  // 5. Pomodoro Timer State
  const [selectedPomoDuration, setSelectedPomoDuration] = useState<number>(25);
  const [pomoMinutes, setPomoMinutes] = useState<number>(25);
  const [pomoSeconds, setPomoSeconds] = useState<number>(0);
  const [isPomoActive, setIsPomoActive] = useState<boolean>(false);
  const [pomoMode, setPomoMode] = useState<'focus' | 'short_break' | 'long_break'>('focus');
  const [customDurationInput, setCustomDurationInput] = useState<string>('');
  const sessionIdRef = useRef<string>('session_' + Date.now());

  // 6. Stopwatch Timer State
  const [isStopwatchActive, setIsStopwatchActive] = useState<boolean>(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const stopwatchStartedAtMsRef = useRef<number | null>(null);
  const stopwatchAccumulatedSecsRef = useRef<number>(0);

  // 7. Attached Practice Questions State
  const [attachedQuestions, setAttachedQuestions] = useState<PomodoroQuestionRef[]>([]);

  // 8. Distraction Detector
  const [isDistracted, setIsDistracted] = useState<boolean>(false);
  const [distractionCount, setDistractionCount] = useState<number>(0);
  const visibilityTimerRef = useRef<any>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isPomoActive || isStopwatchActive) {
          visibilityTimerRef.current = setTimeout(() => {
            setIsDistracted(true);
            setDistractionCount(prev => prev + 1);
          }, 15000); // 15 seconds grace period
        }
      } else {
        if (visibilityTimerRef.current) {
          clearTimeout(visibilityTimerRef.current);
          visibilityTimerRef.current = null;
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPomoActive, isStopwatchActive]);

  // 9. Reward Celebration Modal State
  const [isRewardModalOpen, setIsRewardModalOpen] = useState<boolean>(false);
  const [sessionReward, setSessionReward] = useState<FocusSessionRewardResult | null>(null);

  // Pomodoro Countdown Ticker
  useEffect(() => {
    let interval: any = null;
    if (isPomoActive) {
      interval = setInterval(() => {
        if (pomoSeconds > 0) {
          setPomoSeconds(s => s - 1);
        } else if (pomoMinutes > 0) {
          setPomoMinutes(m => m - 1);
          setPomoSeconds(59);
        } else {
          // Reached 00:00
          setIsPomoActive(false);
          handlePomodoroFinish();
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPomoActive, pomoMinutes, pomoSeconds]);

  // Stopwatch Count-up Ticker
  useEffect(() => {
    let interval: any = null;
    if (isStopwatchActive) {
      if (!stopwatchStartedAtMsRef.current) {
        stopwatchStartedAtMsRef.current = Date.now();
      }
      interval = setInterval(() => {
        if (stopwatchStartedAtMsRef.current) {
          const elapsedSecs = Math.floor((Date.now() - stopwatchStartedAtMsRef.current) / 1000);
          setStopwatchSeconds(stopwatchAccumulatedSecsRef.current + Math.max(0, elapsedSecs));
        }
      }, 500);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isStopwatchActive]);

  // Pomodoro Progress Percent
  const pomoProgress = useMemo(() => {
    const total = selectedPomoDuration * 60;
    const remaining = pomoMinutes * 60 + pomoSeconds;
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round(((total - remaining) / total) * 100)));
  }, [selectedPomoDuration, pomoMinutes, pomoSeconds]);

  // Format MM:SS for Pomodoro
  const formattedPomoTime = useMemo(() => {
    const m = String(pomoMinutes).padStart(2, '0');
    const s = String(pomoSeconds).padStart(2, '0');
    return `${m}:${s}`;
  }, [pomoMinutes, pomoSeconds]);

  // Format HH:MM:SS for Stopwatch
  const formattedStopwatchTime = useMemo(() => {
    const h = Math.floor(stopwatchSeconds / 3600);
    const m = Math.floor((stopwatchSeconds % 3600) / 60);
    const s = stopwatchSeconds % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [stopwatchSeconds]);

  // Dynamic Browser Tab Countdown Title
  useEffect(() => {
    if (isPomoActive) {
      document.title = `(${formattedPomoTime}) ${selectedSubject || 'Focus'} • StudyRide`;
    } else if (isStopwatchActive) {
      document.title = `(${formattedStopwatchTime}) ${selectedSubject || 'Focus'} • StudyRide`;
    } else {
      document.title = 'StudyRide • Precision Exam Suite';
    }
    return () => {
      document.title = 'StudyRide • Precision Exam Suite';
    };
  }, [isPomoActive, isStopwatchActive, formattedPomoTime, formattedStopwatchTime, selectedSubject]);

  // Handle Finish Pomodoro Session
  const handlePomodoroFinish = async () => {
    if (pomoMode === 'focus') {
      triggerConfetti();
      const durationSeconds = selectedPomoDuration * 60;

      // Harmonic completion chime via Web Audio API
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const actx = new AudioCtx();
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(528, actx.currentTime); // 528Hz Solfeggio miracle tone
          osc.frequency.exponentialRampToValueAtTime(1056, actx.currentTime + 0.5);
          gain.gain.setValueAtTime(0.3, actx.currentTime);
          gain.gain.linearRampToValueAtTime(0.001, actx.currentTime + 1.2);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start();
          osc.stop(actx.currentTime + 1.2);
        }
      } catch {}

      // Log study session
      await saveStudySessionLog({
        userId,
        subject: selectedSubject,
        durationSeconds,
        mode: 'pomodoro',
      });

      // Dispatch real-time session logged event to sync Pie Chart & Analytics
      window.dispatchEvent(
        new CustomEvent('aspirantx_study_session_logged', {
          detail: {
            subject: selectedSubject,
            durationSeconds,
            mode: 'pomodoro'
          }
        })
      );

      // Award XP & Dust via progression engine
      try {
        const reward = addSessionReward(selectedPomoDuration, streakDays);
        setSessionReward(reward);
        setIsRewardModalOpen(true);
      } catch (err) {
        console.warn('Error calculating focus reward:', err);
      }

      // Dispatch syllabus time update event
      window.dispatchEvent(
        new CustomEvent('aspirantx_syllabus_time_updated', {
          detail: {
            nodeId: selectedSyllabusNodeId,
            secondsLogged: durationSeconds,
            subject: selectedSubject,
            topic: topicText,
          }
        })
      );
    }
  };

  // Stopwatch Controls
  const handleStartStopwatch = () => {
    stopwatchStartedAtMsRef.current = Date.now();
    setIsStopwatchActive(true);
  };

  const handlePauseStopwatch = () => {
    if (stopwatchStartedAtMsRef.current) {
      const elapsed = Math.floor((Date.now() - stopwatchStartedAtMsRef.current) / 1000);
      stopwatchAccumulatedSecsRef.current += Math.max(0, elapsed);
    }
    stopwatchStartedAtMsRef.current = null;
    setIsStopwatchActive(false);
  };

  const handleResetStopwatch = () => {
    setIsStopwatchActive(false);
    stopwatchStartedAtMsRef.current = null;
    stopwatchAccumulatedSecsRef.current = 0;
    setStopwatchSeconds(0);
  };

  const handleFinishStopwatch = async () => {
    if (stopwatchSeconds < 30) {
      handleResetStopwatch();
      return;
    }
    triggerConfetti();
    const durationMinutes = Math.max(1, Math.round(stopwatchSeconds / 60));

    await saveStudySessionLog({
      userId,
      subject: selectedSubject,
      durationSeconds: stopwatchSeconds,
      mode: 'stopwatch',
    });

    window.dispatchEvent(
      new CustomEvent('aspirantx_study_session_logged', {
        detail: {
          subject: selectedSubject,
          durationSeconds: stopwatchSeconds,
          mode: 'stopwatch'
        }
      })
    );

    try {
      const reward = addSessionReward(durationMinutes, streakDays);
      setSessionReward(reward);
      setIsRewardModalOpen(true);
    } catch {}

    handleResetStopwatch();
  };

  // Custom Subject CRUD
  const handleAddCustomSubject = () => {
    if (!newSubjectName.trim()) return;
    const newSub: CustomSubject = {
      id: 'custom_' + Date.now(),
      userId: userId || 'guest',
      name: newSubjectName.trim(),
      createdAt: new Date().toISOString()
    };
    const updated = [...customSubjects, newSub];
    setCustomSubjects(updated);
    try {
      localStorage.setItem(`aspirantx_custom_subjects_${userId || 'guest'}`, JSON.stringify(updated));
    } catch {}
    setSelectedSubject(newSub.name);
    setNewSubjectName('');
    setShowAddSubjectModal(false);
  };

  const handleDeleteCustomSubject = (id: string) => {
    const updated = customSubjects.filter(s => s.id !== id);
    setCustomSubjects(updated);
    try {
      localStorage.setItem(`aspirantx_custom_subjects_${userId || 'guest'}`, JSON.stringify(updated));
    } catch {}
    if (selectedSubject && !updated.some(s => s.name === selectedSubject)) {
      setSelectedSubject(currentPredefinedSubjects[0] || 'General Studies');
    }
  };

  // Preset Duration Switcher
  const handleSelectPresetDuration = (mins: number) => {
    setPomoMode('focus');
    setIsPomoActive(false);
    setSelectedPomoDuration(mins);
    setPomoMinutes(mins);
    setPomoSeconds(0);
  };

  // Break Mode Switcher
  const handleSelectBreakMode = (mode: 'short_break' | 'long_break') => {
    setPomoMode(mode);
    setIsPomoActive(false);
    const duration = mode === 'short_break' ? 5 : 15;
    setSelectedPomoDuration(duration);
    setPomoMinutes(duration);
    setPomoSeconds(0);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 px-3 sm:px-4 py-2 sm:py-4 text-slate-100 font-sans pb-24 sm:pb-8">
      {/* ══════════════════════════════════════════════════════════════════
          1. DISTRACTION ALERT BANNER (CONDITIONAL)
      ══════════════════════════════════════════════════════════════════ */}
      {isDistracted && (
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 flex items-center justify-between gap-3 animate-pulse shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Focus Drift Detected</p>
              <p className="text-[11px] text-amber-300/90">
                You switched tabs during your focus sprint. Resume to maintain momentum!
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDistracted(false)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/35 text-amber-100 text-xs font-bold shrink-0 cursor-pointer"
          >
            Refocus
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          2. VIEW MODE SELECTOR (POMODORO, STOPWATCH, FLIGHT LOG, GALAXY)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl gap-1">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('pomodoro')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'pomodoro'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Pomodoro Timer
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-sky-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-sky-400" /> Focus Analytics & Pie Chart 📊
          </button>

          <button
            onClick={() => setActiveTab('stopwatch')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'stopwatch'
                ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Stopwatch
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Flight Log
          </button>

          <button
            onClick={() => setActiveTab('galaxy')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'galaxy'
                ? 'bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500 text-white shadow-lg shadow-purple-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" /> Focus Galaxy 🌌
          </button>
        </div>

        {/* Level Progression Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
          <span className="text-[10px] font-mono text-slate-400">LVL {progression.currentLevel}</span>
          <div className="w-16 h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full" 
              style={{ width: `${progression.progressPercentage}%` }} 
            />
          </div>
          <span className="text-[10px] text-sky-400 font-bold font-mono">+{totalDust}✨</span>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. AMBIENT FOCUS AUDIO SYNTH BAR
      ══════════════════════════════════════════════════════════════════ */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (soundPlaying) {
                audioEngineRef.current?.stop();
                setSoundPlaying(false);
              } else {
                if (!audioEngineRef.current) audioEngineRef.current = new FocusAudioEngine();
                audioEngineRef.current.start(selectedSound, ambientVolume);
                setSoundPlaying(true);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              soundPlaying
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {soundPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            {soundPlaying ? 'Cosmic Audio ON' : 'Cosmic Audio'}
          </button>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {([
              { id: 'drone', label: '🪐 432Hz Drone' },
              { id: 'solar', label: '☀️ Solar Wind' },
              { id: 'harmonics', label: '✨ Harmonics' }
            ] as const).map((snd) => (
              <button
                key={snd.id}
                onClick={() => {
                  setSelectedSound(snd.id);
                  if (audioEngineRef.current && soundPlaying) {
                    audioEngineRef.current.start(snd.id, ambientVolume);
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedSound === snd.id
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {snd.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-[10px] uppercase font-bold text-slate-500">Volume</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={ambientVolume}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setAmbientVolume(v);
              audioEngineRef.current?.setVolume(v);
            }}
            className="w-20 accent-sky-400 cursor-pointer h-1.5 rounded-lg bg-slate-950"
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          4. TAB 1: POMODORO SPRINT ENGINE
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pomodoro' && (
        <div className="space-y-5">
          {/* Study Target Configuration Card */}
          <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl space-y-4 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subject Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                    <Tag className="w-3.5 h-3.5 text-purple-400" /> Target Subject
                  </label>
                  <button
                    onClick={() => setShowAddSubjectModal(true)}
                    className="text-[10px] font-extrabold text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Custom
                  </button>
                </div>

                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-purple-500 cursor-pointer"
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

                {/* Custom Subjects Manager */}
                {customSubjects.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {customSubjects.map((cs) => (
                      <div
                        key={cs.id}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-purple-300 font-semibold"
                      >
                        <span>{cs.name}</span>
                        <button
                          onClick={() => handleDeleteCustomSubject(cs.id)}
                          className="hover:text-rose-400 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Link Syllabus Sub-Topic */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Link Syllabus Chapter / Subtopic
                </label>

                {syllabusOptions.length > 0 && (
                  <select
                    value={selectedSyllabusNodeId || ''}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedSyllabusNodeId(id || null);
                      const opt = syllabusOptions.find(o => o.id === id);
                      if (opt) setTopicText(opt.label.split('•')[1]?.trim() || '');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-cyan-300 text-xs font-bold focus:outline-none focus:border-cyan-500 cursor-pointer mb-1.5"
                  >
                    <option value="">-- Optional: Select Syllabus Node --</option>
                    {syllabusOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="text"
                  placeholder="e.g. Thermodynamics, Kinematics, Modern History, Organic Chemistry..."
                  value={topicText}
                  onChange={(e) => setTopicText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
                />
              </div>
            </div>

            {/* Duration Presets & Mode Toggles */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Sprint:</span>
                {[25, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => handleSelectPresetDuration(mins)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      selectedPomoDuration === mins && pomoMode === 'focus'
                        ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/20 font-black'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}

                {/* Custom Minutes Input */}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="Custom"
                    min="1"
                    max="180"
                    value={customDurationInput}
                    onChange={(e) => setCustomDurationInput(e.target.value)}
                    className="w-16 px-2 py-1 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold text-center focus:outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={() => {
                      const v = parseInt(customDurationInput, 10);
                      if (v > 0) handleSelectPresetDuration(v);
                    }}
                    className="px-2 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold cursor-pointer"
                  >
                    Set
                  </button>
                </div>
              </div>

              {/* Breaks */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Break:</span>
                <button
                  onClick={() => handleSelectBreakMode('short_break')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    pomoMode === 'short_break'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 font-black'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  5m Short
                </button>
                <button
                  onClick={() => handleSelectBreakMode('long_break')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    pomoMode === 'long_break'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 font-black'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  15m Long
                </button>
              </div>
            </div>
          </div>

          {/* Central Timer Display & Controls Card */}
          <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl text-center shadow-2xl space-y-6 relative overflow-hidden">
            {/* Ambient Core Glow */}
            <div 
              className="absolute inset-0 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
              style={{
                backgroundColor: isPomoActive 
                  ? (pomoMode === 'focus' ? '#38bdf8' : '#10b981')
                  : 'rgba(56, 189, 248, 0.1)'
              }}
            />

            {/* Circular Progress & High Contrast Digits */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 mx-auto flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle 
                  cx="112" 
                  cy="112" 
                  r="96" 
                  stroke="currentColor" 
                  strokeWidth="7" 
                  className="text-slate-950" 
                  fill="transparent" 
                />
                <circle
                  cx="112"
                  cy="112"
                  r="96"
                  stroke={pomoMode === 'focus' ? '#38bdf8' : '#10b981'}
                  strokeWidth="7"
                  strokeDasharray={2 * Math.PI * 96}
                  strokeDashoffset={2 * Math.PI * 96 * (1 - pomoProgress / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                  {formattedPomoTime}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-2 px-3 py-0.5 rounded-full bg-slate-950/80 border border-slate-800">
                  {pomoMode === 'focus' ? selectedSubject : 'Break & Refresh'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-1">
                  {pomoProgress}% Complete
                </span>
              </div>
            </div>

            {/* Action Buttons Dock */}
            <div className="flex items-center justify-center gap-3 relative z-10 flex-wrap">
              <PressFeedback>
                <button
                  onClick={() => {
                    if (!isPomoActive && pomoMode === 'focus') {
                      sessionIdRef.current = 'session_' + Date.now();
                    }
                    setIsPomoActive(!isPomoActive);
                  }}
                  className={`h-12 px-7 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 ${
                    isPomoActive
                      ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                      : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/25'
                  }`}
                >
                  {isPomoActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPomoActive ? 'PAUSE TIMER' : 'START FOCUS SPRINT'}</span>
                </button>
              </PressFeedback>

              <PressFeedback>
                <button
                  onClick={() => {
                    setIsPomoActive(false);
                    setPomoMinutes(selectedPomoDuration);
                    setPomoSeconds(0);
                  }}
                  className="h-12 w-12 rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center cursor-pointer transition-all active:scale-95"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </PressFeedback>

              {(isPomoActive || pomoMinutes < selectedPomoDuration) && (
                <PressFeedback>
                  <button
                    onClick={() => {
                      setIsPomoActive(false);
                      handlePomodoroFinish();
                    }}
                    className="h-12 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm border border-emerald-400/50 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                    title="Finish session and claim rewards"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finish & Claim</span>
                  </button>
                </PressFeedback>
              )}
            </div>

            {/* Focus Shield Callout */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Focus Shield Distraction Blocker</span>
                  <p className="text-[10px] text-slate-400">
                    Blocks distracting apps & websites during deep sprints
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: { tab: 'focus_shield' } }));
                }}
                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-md shrink-0 cursor-pointer"
              >
                Configure Shield
              </button>
            </div>
          </div>

          {/* Galaxy Study Targets & Modern Checklist */}
          <GalaxyStudyChecklist userId={userId} currentSubject={selectedSubject} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          4B. TAB: ADVANCED FOCUS ANALYTICS & PIE CHARTS (DIRECT LINKAGE)
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          <PomodoroAnalytics 
            userId={userId} 
            onStartPomodoro={() => setActiveTab('pomodoro')} 
            activeExamId={activeExamId}
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          5. TAB 2: STOPWATCH COUNT-UP ENGINE
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'stopwatch' && (
        <div className="space-y-5">
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl text-center shadow-2xl space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Open-Ended Study Stopwatch</span>
              <h3 className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white">
                {formattedStopwatchTime}
              </h3>
              <p className="text-xs text-slate-400">
                Active Subject: <span className="text-sky-300 font-bold">{selectedSubject}</span>
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              {!isStopwatchActive ? (
                <button
                  onClick={handleStartStopwatch}
                  className="h-12 px-7 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Stopwatch</span>
                </button>
              ) : (
                <button
                  onClick={handlePauseStopwatch}
                  className="h-12 px-7 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer active:scale-95 transition-all"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={handleResetStopwatch}
                className="h-12 w-12 rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center cursor-pointer transition-all active:scale-95"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {stopwatchSeconds >= 30 && (
                <button
                  onClick={handleFinishStopwatch}
                  className="h-12 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Session</span>
                </button>
              )}
            </div>
          </div>

          {/* Galaxy Study Targets & Modern Checklist */}
          <GalaxyStudyChecklist userId={userId} currentSubject={selectedSubject} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          6. TAB 3: FLIGHT LOG & STUDY SESSIONS HISTORY
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-xl backdrop-blur-2xl">
          <PomodoroHistoryView userId={userId} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          7. TAB 4: 3D FOCUS GALAXY VIEWPORT
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'galaxy' && (
        <div className="h-[460px] sm:h-[520px] rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-2xl relative flex flex-col items-center justify-center">
          <PlanetarySystem
            level={progression.currentLevel}
            streakDays={streakDays}
            type={milestone.category}
            seed={progression.currentLevel * 37 + 101}
            autoRotate={true}
            allowIdleRotation={true}
            targetFps={60}
            showStarfield={true}
            className="w-full h-full pointer-events-auto"
          />

          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 backdrop-blur-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>World: {milestone.name}</span>
            <span className="text-slate-500">|</span>
            <span className="text-sky-400 font-bold">{totalDust.toLocaleString()} Dust</span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          8. CUSTOM SUBJECT MODAL
      ══════════════════════════════════════════════════════════════════ */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-400" /> Add Custom Subject
              </h3>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              placeholder="e.g. Organic Chemistry, Indian Polity..."
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-purple-500"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAddSubjectModal(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomSubject}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20"
              >
                Add Subject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          9. SESSION COMPLETE REWARD MODAL
      ══════════════════════════════════════════════════════════════════ */}
      <SessionCompleteModal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        reward={sessionReward}
        subject={selectedSubject}
        topic={topicText || 'Focus Sprint'}
        onClaim={() => setIsRewardModalOpen(false)}
      />
    </div>
  );
};
