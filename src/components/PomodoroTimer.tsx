import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  AlertTriangle,
  X,
  Save,
  Layers,
  ChevronDown,
  Globe2,
  Orbit,
  Radio,
  CloudRain,
  Waves,
  Music,
  ShieldAlert,
  Shield,
  WifiOff
} from 'lucide-react';
import { saveStudySessionLog, loadStudySessions, loadUserProfile } from '../lib/gamification';
import { StudySession, CustomSubject, ManualQuestion, PomodoroQuestionRef } from '../types';
import { INITIAL_PYQS_DATABASE, INITIAL_QUESTION_BANK } from '../data/academicData';
import { fetchOfficialSyllabus, fetchPersonalSyllabus } from '../lib/unifiedSyllabus';
import { PomodoroHistoryView } from './PomodoroHistoryView';
import { FocusGalaxyView, COSMIC_TIERS, CosmicTier, FocusPlanetRecord } from './FocusGalaxyView';
import { GalaxyCanvas } from './GalaxyCanvas';
import { getExamConfig, normalizeExamId } from '../lib/examRegistry';
import { useExam } from '../context/ExamContext';
import { getApiUrl } from '../lib/apiConfig';
import { triggerConfetti, PressFeedback, SlideUp, ModalTransition, CountUp } from '../lib/animations';
import { ContextualTour } from './ContextualTour';

// --- WEB AUDIO API AMBIENT SOUND GENERATOR (FEATURE D) ---
class FocusAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseNode: AudioNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  public isRunning = false;

  start(soundType: 'drone' | 'solar' | 'harmonics' | 'rain' | 'waves' | 'synth', volume = 0.5) {
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
      this.masterGain.gain.linearRampToValueAtTime(volume * 0.4, this.ctx.currentTime + 1.2);
      this.masterGain.connect(this.ctx.destination);
      this.isRunning = true;

      if (soundType === 'drone' || soundType === 'synth') {
        // Deep Space Cosmic Drone: 108Hz fundamental + 432Hz harmonic warmth + 6Hz theta modulation
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const subOsc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = 'sine';
        osc1.frequency.value = 108; // Sacred space root
        osc2.type = 'sine';
        osc2.frequency.value = 114; // 6Hz Theta frequency binaural beat for intense flow
        subOsc.type = 'triangle';
        subOsc.frequency.value = 54; // Deep sub-bass cosmic gravity

        filter.type = 'lowpass';
        filter.frequency.value = 380;
        filter.Q.value = 1.2;

        const subGain = this.ctx.createGain();
        subGain.gain.value = 0.35;
        subOsc.connect(subGain);
        subGain.connect(filter);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(this.masterGain);

        osc1.start(0);
        osc2.start(0);
        subOsc.start(0);
        this.osc1 = osc1;
        this.osc2 = osc2;
      } else if (soundType === 'solar' || soundType === 'rain') {
        // Interstellar Solar Wind: Filtered cosmic pink noise with slow drifting stellar gusts
        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.09;
          b6 = white * 0.115926;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 650;
        filter.Q.value = 1.1;

        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.08; // Ultra slow 12s stellar breeze cycle

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 250;
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);

        whiteNoise.connect(filter);
        filter.connect(this.masterGain);

        whiteNoise.start(0);
        lfo.start(0);
        this.noiseNode = whiteNoise;
        this.lfo = lfo;
      } else if (soundType === 'harmonics' || soundType === 'waves') {
        // Celestial Harmonics: 432 Hz + 288 Hz fifth interval glowing resonance
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = 'sine';
        osc1.frequency.value = 288;
        osc2.type = 'sine';
        osc2.frequency.value = 432;

        filter.type = 'lowpass';
        filter.frequency.value = 480;

        const swellGain = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.12;

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.3;
        lfo.connect(lfoGain);
        lfoGain.connect(swellGain.gain);

        swellGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(swellGain);
        swellGain.connect(this.masterGain);

        osc1.start(0);
        osc2.start(0);
        lfo.start(0);
        this.osc1 = osc1;
        this.osc2 = osc2;
        this.lfo = lfo;
      }
    } catch (e) {
      console.warn('FocusAudioEngine start failed:', e);
    }
  }

  setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, vol * 0.4)), this.ctx.currentTime + 0.1);
      } catch (e) {}
    }
  }

  stop() {
    this.isRunning = false;
    try {
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
      }
      setTimeout(() => {
        try {
          if (this.noiseNode) { (this.noiseNode as any).stop?.(); this.noiseNode.disconnect(); }
          if (this.lfo) { this.lfo.stop(); this.lfo.disconnect(); }
          if (this.osc1) { this.osc1.stop(); this.osc1.disconnect(); }
          if (this.osc2) { this.osc2.stop(); this.osc2.disconnect(); }
          if (this.ctx && this.ctx.state !== 'closed') { this.ctx.close(); }
        } catch (e) {}
        this.ctx = null;
        this.masterGain = null;
        this.noiseNode = null;
        this.osc1 = null;
        this.osc2 = null;
        this.lfo = null;
      }, 350);
    } catch (e) {}
  }
}

// --- COSMIC ACCRETION VISUAL COMPONENT ---
interface CosmicAccretionVisualProps {
  progressPercent: number; // 0 to 100
  isDistracted?: boolean;
  isPomoActive?: boolean;
  totalFocusHours?: number;
}

const CosmicAccretionVisual: React.FC<CosmicAccretionVisualProps> = ({ 
  progressPercent, 
  isDistracted = false, 
  isPomoActive = false,
  totalFocusHours = 0
}) => {
  // Determine Stage based on total focus hours
  let cosmicStage = 1;
  for (let i = COSMIC_TIERS.length - 1; i >= 0; i--) {
    if (totalFocusHours >= COSMIC_TIERS[i].minHours) {
      cosmicStage = COSMIC_TIERS[i].stage;
      break;
    }
  }

  const activeTier = COSMIC_TIERS.find(t => t.stage === cosmicStage) || COSMIC_TIERS[0];

  return (
    <div className="flex flex-col items-center justify-center p-2 relative select-none">
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border border-slate-800/80 bg-slate-950/60 shadow-2xl flex items-center justify-center">
        {/* Soft Cosmic Aurora Glow */}
        <div 
          className="absolute inset-0 rounded-full blur-2xl transition-all duration-700 pointer-events-none"
          style={{
            backgroundColor: isDistracted 
              ? 'rgba(245, 158, 11, 0.2)' 
              : `${activeTier.accentColor}25`
          }}
        />

        {/* Live Procedural Galaxy Canvas with Accretion */}
        <GalaxyCanvas
          stage={cosmicStage}
          activeProgress={progressPercent / 100}
          isTimerRunning={isPomoActive}
          className="w-full h-full"
          seed={`focus-${cosmicStage}-${Math.floor(totalFocusHours)}`}
        />
      </div>

      <div className="mt-2 text-center">
        <span 
          className="text-[10px] font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full border shadow-sm"
          style={{
            color: isDistracted ? '#fbbf24' : activeTier.accentColor,
            borderColor: isDistracted ? 'rgba(245, 158, 11, 0.4)' : `${activeTier.accentColor}40`,
            backgroundColor: isDistracted ? 'rgba(245, 158, 11, 0.15)' : `${activeTier.accentColor}15`
          }}
        >
          {isDistracted ? '⚠️ GRAVITATIONAL DRIFT' : `${activeTier.badge} • ${progressPercent}% ACCRETED`}
        </span>
      </div>
    </div>
  );
};

// --- OFFLINE PENDING SYNC QUEUE HELPER (BUG FIX 3) ---
interface PendingSyncSession {
  targetId: string;
  payload: any;
  timestamp: string;
  retryCount: number;
}

const getPendingQueueKey = (userId?: string) => `aspirantx_pending_sync_sessions_${userId || 'guest'}`;

const queueSessionForSync = (userId: string | undefined, targetId: string, payload: any) => {
  try {
    const key = getPendingQueueKey(userId);
    const existing: PendingSyncSession[] = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push({ targetId, payload, timestamp: new Date().toISOString(), retryCount: 0 });
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (e) {}
};

const flushPendingSessions = async (userId?: string) => {
  try {
    const key = getPendingQueueKey(userId);
    const queueRaw = localStorage.getItem(key);
    if (!queueRaw) return;
    const queue: PendingSyncSession[] = JSON.parse(queueRaw);
    if (!queue || !queue.length) return;

    const remaining: PendingSyncSession[] = [];
    const token = localStorage.getItem('aspirantx_auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    for (const item of queue) {
      try {
        const res = await fetch(`/api/user/study-sessions/${item.targetId}/complete`, {
          method: 'POST',
          headers,
          body: JSON.stringify(item.payload)
        });
        if (!res.ok) {
          item.retryCount += 1;
          if (item.retryCount < 5) remaining.push(item);
        }
      } catch (e) {
        item.retryCount += 1;
        if (item.retryCount < 5) remaining.push(item);
      }
    }
    localStorage.setItem(key, JSON.stringify(remaining));
  } catch (e) {}
};

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

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ userId, topicId, selectedExam }) => {
  const { selectedExamId } = useExam();
  const activeExamId = normalizeExamId(selectedExam || selectedExamId);
  const examConfig = getExamConfig(activeExamId);

  const currentPredefinedSubjects = useMemo(() => {
    if (EXAM_SUBJECT_CHOICES[activeExamId]) {
      return EXAM_SUBJECT_CHOICES[activeExamId];
    }
    if (examConfig && Array.isArray(examConfig.subjects) && examConfig.subjects.length > 0) {
      return examConfig.subjects;
    }
    return ['General Studies', 'Core Subject 1', 'Core Subject 2', 'Aptitude & Practice'];
  }, [activeExamId, examConfig]);

  const [activeTab, setActiveTab] = useState<'stopwatch' | 'pomodoro' | 'galaxy' | 'history'>('pomodoro');

  // --- Subject & Topic State ---
  const [customSubjects, setCustomSubjects] = useState<CustomSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>(() => currentPredefinedSubjects[0]);
  const [topicText, setTopicText] = useState<string>('');

  useEffect(() => {
    if (currentPredefinedSubjects.length > 0 && !currentPredefinedSubjects.includes(selectedSubject)) {
      setSelectedSubject(currentPredefinedSubjects[0]);
    }
  }, [currentPredefinedSubjects, selectedSubject]);
  
  // --- Syllabus Linkage State ---
  const [selectedSyllabusNodeId, setSelectedSyllabusNodeId] = useState<string | null>(null);
  const [selectedNodeSource, setSelectedNodeSource] = useState<'official' | 'personal'>('official');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('');
  const [syllabusOptions, setSyllabusOptions] = useState<Array<{
    id: string;
    source: 'official' | 'personal';
    subject: string;
    topic: string;
    subtopic: string;
    label: string;
  }>>([]);
  
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

  // Dynamic Picker Data State (real backend datasets)
  const [pickerPyqs, setPickerPyqs] = useState<any[]>([]);
  const [pickerPyqsLoading, setPickerPyqsLoading] = useState<boolean>(false);
  const [pickerQbQuestions, setPickerQbQuestions] = useState<any[]>([]);
  const [pickerQbLoading, setPickerQbLoading] = useState<boolean>(false);

  useEffect(() => {
    if (showPyqPickerModal && pickerPyqs.length === 0) {
      setPickerPyqsLoading(true);
      fetch(getApiUrl(`/api/academic/pyqs?exam=${encodeURIComponent(selectedExam)}&limit=25`))
        .then(r => r.json())
        .then(d => {
          if (d.success && Array.isArray(d.pyqs)) {
            setPickerPyqs(d.pyqs);
          } else {
            setPickerPyqs(INITIAL_PYQS_DATABASE.slice(0, 10));
          }
        })
        .catch(() => setPickerPyqs(INITIAL_PYQS_DATABASE.slice(0, 10)))
        .finally(() => setPickerPyqsLoading(false));
    }
  }, [showPyqPickerModal, selectedExam, pickerPyqs.length]);

  useEffect(() => {
    if (showQbPickerModal && pickerQbQuestions.length === 0) {
      setPickerQbLoading(true);
      fetch(getApiUrl(`/api/academic/questions?exam=${encodeURIComponent(selectedExam)}&limit=25`))
        .then(r => r.json())
        .then(d => {
          if (d.success && Array.isArray(d.questions)) {
            setPickerQbQuestions(d.questions);
          } else {
            setPickerQbQuestions(INITIAL_QUESTION_BANK.slice(0, 10));
          }
        })
        .catch(() => setPickerQbQuestions(INITIAL_QUESTION_BANK.slice(0, 10)))
        .finally(() => setPickerQbLoading(false));
    }
  }, [showQbPickerModal, selectedExam, pickerQbQuestions.length]);

  // Manual Question Form State
  const [mqText, setMqText] = useState<string>('');
  const [mqOptA, setMqOptA] = useState<string>('');
  const [mqOptB, setMqOptB] = useState<string>('');
  const [mqOptC, setMqOptC] = useState<string>('');
  const [mqOptD, setMqOptD] = useState<string>('');
  const [mqCorrectOpt, setMqCorrectOpt] = useState<string>(''); // "" for unverified, or "0", "1", "2", "3"
  const [mqExplanation, setMqExplanation] = useState<string>('');
  const [mqDifficulty, setMqDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  // --- Live Stopwatch State (Bug Fix 2: Date.now() timestamp-based) ---
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isStopwatchActive, setIsStopwatchActive] = useState<boolean>(false);
  const stopwatchStartedAtMsRef = useRef<number | null>(null);
  const stopwatchAccumulatedSecsRef = useRef<number>(0);

  // --- Pomodoro State ---
  const [pomoMinutes, setPomoMinutes] = useState<number>(25);
  const [pomoSeconds, setPomoSeconds] = useState<number>(0);
  const [isPomoActive, setIsPomoActive] = useState<boolean>(false);
  const [pomoMode, setPomoMode] = useState<'focus' | 'break'>('focus');
  const [selectedPomoDuration, setSelectedPomoDuration] = useState<number>(25);
  const [customDurationInput, setCustomDurationInput] = useState<string>('');

  // --- Feature B: Tab-Switching & Distraction Tracking State ---
  const [isDistracted, setIsDistracted] = useState<boolean>(false);
  const [distractionCount, setDistractionCount] = useState<number>(0);
  const [distractedSecondsTotal, setDistractedSecondsTotal] = useState<number>(0);
  const hiddenSinceMsRef = useRef<number | null>(null);

  // Session Completion Modal
  const [completionSummary, setCompletionSummary] = useState<any | null>(null);

  // --- Session & Heartbeat ID ---
  const sessionIdRef = useRef<string>('session_' + Date.now());

  // --- General & Sound State (Feature D: Ambient Sounds) ---
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [soundPlaying, setSoundPlaying] = useState<boolean>(false);
  const [selectedSound, setSelectedSound] = useState<'drone' | 'solar' | 'harmonics' | 'rain' | 'waves' | 'synth'>('drone');
  const [ambientVolume, setAmbientVolume] = useState<number>(0.6);
  const [lastRewardToast, setLastRewardToast] = useState<{ xp: number; coins: number; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const audioEngineRef = useRef<FocusAudioEngine | null>(null);

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

  // Load Syllabus nodes for current exam and user
  const loadSyllabusOptions = async () => {
    try {
      const [offNodes, persNodes] = await Promise.all([
        fetchOfficialSyllabus(selectedExam),
        fetchPersonalSyllabus(userId, selectedExam)
      ]);

      const options: Array<{
        id: string;
        source: 'official' | 'personal';
        subject: string;
        topic: string;
        subtopic: string;
        label: string;
      }> = [];

      offNodes.forEach((node: any) => {
        const subj = node.subject || node.category || 'General Subject';
        const ch = node.chapter || node.topic || 'General Topic';
        const sub = node.subtopic || node.title || ch;
        options.push({
          id: node.id || `off_${subj}_${ch}_${sub}`,
          source: 'official',
          subject: subj,
          topic: ch,
          subtopic: sub,
          label: `(Official) ${subj} → ${ch} → ${sub}`
        });
      });

      persNodes.forEach((node: any) => {
        const subj = node.subject || 'My Subject';
        const ch = node.chapter || node.topic || 'My Topic';
        const sub = node.subtopic || node.title || ch;
        options.push({
          id: node.id || `pers_${subj}_${ch}_${sub}`,
          source: 'personal',
          subject: subj,
          topic: ch,
          subtopic: sub,
          label: `(My Syllabus) ${subj} → ${ch} → ${sub}`
        });
      });

      setSyllabusOptions(options);

      if (topicId) {
        const match = options.find((o) => o.id === topicId);
        if (match) {
          setSelectedSyllabusNodeId(match.id);
          setSelectedNodeSource(match.source);
          setSelectedSubject(match.subject);
          setTopicText(`${match.topic} — ${match.subtopic}`);
          setSelectedSubtopic(match.subtopic);
        }
      }
    } catch (e) {
      console.warn('Failed to load syllabus options in PomodoroTimer:', e);
    }
  };

  useEffect(() => {
    fetchUserSubjects();
    loadSyllabusOptions();
    loadStudySessions(userId).then(setSessions);
    flushPendingSessions(userId);

    const handleOnline = () => {
      flushPendingSessions(userId);
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [userId, selectedExam]);

  const handleSyllabusOptionSelect = (optId: string) => {
    if (!optId) {
      setSelectedSyllabusNodeId(null);
      setSelectedSubtopic('');
      return;
    }
    const match = syllabusOptions.find((o) => o.id === optId);
    if (match) {
      setSelectedSyllabusNodeId(match.id);
      setSelectedNodeSource(match.source);
      setSelectedSubject(match.subject);
      setTopicText(`${match.topic} — ${match.subtopic}`);
      setSelectedSubtopic(match.subtopic);
    }
  };

  // Restore Active Pomodoro Session State & Stopwatch State on page refresh / browser reopen
  useEffect(() => {
    try {
      // 1. Pomodoro Restore
      const savedPomoRaw = localStorage.getItem(`aspirantx_active_pomodoro_session_${userId || 'guest'}`);
      if (savedPomoRaw) {
        const savedState = JSON.parse(savedPomoRaw);
        if (savedState && savedState.sessionId) {
          sessionIdRef.current = savedState.sessionId;
          if (savedState.pomoMinutes !== undefined) setPomoMinutes(savedState.pomoMinutes);
          if (savedState.pomoSeconds !== undefined) setPomoSeconds(savedState.pomoSeconds);
          if (savedState.selectedPomoDuration) setSelectedPomoDuration(savedState.selectedPomoDuration);
          if (savedState.pomoMode) setPomoMode(savedState.pomoMode);
          if (savedState.selectedSubject) setSelectedSubject(savedState.selectedSubject);
          if (savedState.topicText) setTopicText(savedState.topicText);
          if (savedState.selectedSyllabusNodeId) setSelectedSyllabusNodeId(savedState.selectedSyllabusNodeId);
          if (savedState.selectedNodeSource) setSelectedNodeSource(savedState.selectedNodeSource);
          if (savedState.selectedSubtopic) setSelectedSubtopic(savedState.selectedSubtopic);
          if (Array.isArray(savedState.attachedQuestions)) setAttachedQuestions(savedState.attachedQuestions);
        }
      }

      // 2. Stopwatch Restore (Bug Fix 2: Seamless timestamp persistence)
      const savedStopwatchRaw = localStorage.getItem(`aspirantx_active_stopwatch_${userId || 'guest'}`);
      if (savedStopwatchRaw) {
        const savedSw = JSON.parse(savedStopwatchRaw);
        if (savedSw) {
          const accumulated = savedSw.accumulatedSecs || 0;
          stopwatchAccumulatedSecsRef.current = accumulated;
          if (savedSw.isActive && savedSw.startedAtMs) {
            const elapsedSinceStart = Math.floor((Date.now() - savedSw.startedAtMs) / 1000);
            const total = accumulated + Math.max(0, elapsedSinceStart);
            setStopwatchSeconds(total);
            setIsStopwatchActive(true);
            stopwatchStartedAtMsRef.current = savedSw.startedAtMs;
          } else {
            setStopwatchSeconds(accumulated);
            setIsStopwatchActive(false);
            stopwatchStartedAtMsRef.current = null;
          }
          if (savedSw.selectedSubject) setSelectedSubject(savedSw.selectedSubject);
          if (savedSw.topicText) setTopicText(savedSw.topicText);
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
          selectedSyllabusNodeId,
          selectedNodeSource,
          selectedSubtopic,
          attachedQuestions,
          updatedAt: new Date().toISOString()
        }));
      } catch (e) {}
    }
  }, [isPomoActive, pomoMinutes, pomoSeconds, selectedSubject, topicText, selectedSyllabusNodeId, selectedNodeSource, selectedSubtopic, attachedQuestions]);

  // Persist Stopwatch state in localStorage whenever running state or subject changes
  useEffect(() => {
    try {
      localStorage.setItem(`aspirantx_active_stopwatch_${userId || 'guest'}`, JSON.stringify({
        isActive: isStopwatchActive,
        startedAtMs: stopwatchStartedAtMsRef.current,
        accumulatedSecs: stopwatchAccumulatedSecsRef.current,
        seconds: stopwatchSeconds,
        selectedSubject,
        topicText,
        updatedAt: new Date().toISOString()
      }));
    } catch (e) {}
  }, [isStopwatchActive, stopwatchSeconds, selectedSubject, topicText, userId]);

  // Window beforeunload protection for Stopwatch & Pomodoro
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        if (isStopwatchActive && stopwatchStartedAtMsRef.current) {
          const deltaSecs = Math.floor((Date.now() - stopwatchStartedAtMsRef.current) / 1000);
          localStorage.setItem(`aspirantx_active_stopwatch_${userId || 'guest'}`, JSON.stringify({
            isActive: true,
            startedAtMs: stopwatchStartedAtMsRef.current,
            accumulatedSecs: stopwatchAccumulatedSecsRef.current,
            seconds: stopwatchAccumulatedSecsRef.current + Math.max(0, deltaSecs),
            selectedSubject,
            topicText,
            updatedAt: new Date().toISOString()
          }));
        }
      } catch (e) {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isStopwatchActive, selectedSubject, topicText, userId]);

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

  // --- Feature D: Audio Engine Lifecycle ---
  useEffect(() => {
    if (!audioEngineRef.current) {
      audioEngineRef.current = new FocusAudioEngine();
    }
    if (soundPlaying) {
      audioEngineRef.current.start(selectedSound, ambientVolume);
    } else {
      audioEngineRef.current.stop();
    }
    return () => {
      audioEngineRef.current?.stop();
    };
  }, [soundPlaying, selectedSound]);

  useEffect(() => {
    if (audioEngineRef.current && soundPlaying) {
      audioEngineRef.current.setVolume(ambientVolume);
    }
  }, [ambientVolume, soundPlaying]);

  // --- Feature B: Page Visibility API for Tab-Switching & Distraction Tracking ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isTimerRunning = isPomoActive || isStopwatchActive;
      if (!isTimerRunning) return;

      if (document.hidden) {
        hiddenSinceMsRef.current = Date.now();
      } else {
        if (hiddenSinceMsRef.current) {
          const awayDurationMs = Date.now() - hiddenSinceMsRef.current;
          const awaySecs = Math.floor(awayDurationMs / 1000);
          if (awaySecs >= 15) {
            setIsDistracted(true);
            setDistractionCount((prev) => prev + 1);
            setDistractedSecondsTotal((prev) => prev + awaySecs);

            // Auto-hide warning toast after 8 seconds of returning
            setTimeout(() => {
              setIsDistracted(false);
            }, 8000);
          }
          hiddenSinceMsRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isPomoActive, isStopwatchActive]);

  // --- Live Tickers ---
  // Stopwatch Ticker (Bug Fix 2: drift-free Date.now() calculation)
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
    try {
      localStorage.removeItem(`aspirantx_active_stopwatch_${userId || 'guest'}`);
    } catch (e) {}
  };

  // Pomodoro Ticker
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

  // Pomodoro Completion Handler with Server XP Deduplication, Offline Sync Queue, and Inline Syllabus Time Logging
  const handlePomodoroFinish = async () => {
    if (pomoMode === 'focus') {
      triggerConfetti();
      const durationSeconds = selectedPomoDuration * 60;
      setIsSaving(true);

      const targetId = sessionIdRef.current;
      let xpAwarded = 50;
      let syncSucceeded = false;

      const payload = {
        subject: selectedSubject,
        topic: topicText || 'Study Sprint',
        subtopic: selectedSubtopic || (topicText ? topicText.split('—').pop()?.trim() || topicText : ''),
        nodeId: selectedSyllabusNodeId || null,
        nodeSource: selectedNodeSource || 'official',
        duration: selectedPomoDuration,
        completedDuration: durationSeconds,
        secondsLogged: durationSeconds,
        questionsAttempted: attachedQuestions.length,
        questionIds: attachedQuestions.map(q => q.id),
        questionSources: attachedQuestions.map(q => q.source),
        manualQuestions: attachedQuestions.filter(q => q.source === 'manual'),
        selectedQuestions: attachedQuestions,
        accuracy: 100,
        distractionCount,
        distractedSecondsTotal
      };

      try {
        const token = localStorage.getItem('aspirantx_auth_token');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`/api/user/study-sessions/${targetId}/complete`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            syncSucceeded = true;
            xpAwarded = data.xpAwarded;

            // Dispatch event for syllabus time update
            if (data.syllabusTimeLogged || data.totalTimeForNode !== undefined) {
              window.dispatchEvent(
                new CustomEvent('aspirantx_syllabus_time_updated', {
                  detail: {
                    nodeId: selectedSyllabusNodeId || (data.syllabusTimeLogged && data.syllabusTimeLogged.nodeId),
                    nodeSource: selectedNodeSource || (data.syllabusTimeLogged && data.syllabusTimeLogged.nodeSource),
                    secondsLogged: durationSeconds,
                    subject: selectedSubject,
                    topic: topicText,
                    subtopic: selectedSubtopic,
                    totalTimeForNode: data.totalTimeForNode || (data.syllabusTimeLogged && data.syllabusTimeLogged.totalTimeForNode)
                  }
                })
              );
            }

            if (data.streak && typeof data.streak.streakDays === 'number') {
              window.dispatchEvent(
                new CustomEvent('aspirantx_streak_updated', {
                  detail: { streakDays: data.streak.streakDays, lastActiveDate: data.streak.lastActiveDate },
                })
              );
            }
            window.dispatchEvent(
              new CustomEvent('aspirantx_focus_session_completed', {
                detail: { sessionId: targetId, durationSeconds, mode: 'pomodoro' },
              })
            );
          }
        }
      } catch (e) {
        console.warn('Network sync failed, session will be queued for offline retry:', e);
      }

      // Bug Fix 3: If remote call did not succeed, queue locally for background sync
      if (!syncSucceeded) {
        queueSessionForSync(userId, targetId, payload);
      }

      await saveStudySessionLog({
        userId,
        subject: selectedSubject,
        durationSeconds,
        mode: 'pomodoro',
      });

      setIsSaving(false);

      // Clear active timer state in localStorage
      localStorage.removeItem(`aspirantx_active_pomodoro_session_${userId || 'guest'}`);

      // Accrete new celestial world into Focus Galaxy
      try {
        const galaxyKey = `aspirantx_focus_galaxy_${userId || 'guest'}`;
        const existingGalaxy: FocusPlanetRecord[] = JSON.parse(localStorage.getItem(galaxyKey) || '[]');
        const planetTypes: ('rocky' | 'gas_giant' | 'ringed' | 'ice' | 'lava' | 'ocean')[] = [
          'rocky', 'gas_giant', 'ringed', 'ice', 'lava', 'ocean'
        ];
        const planetPalettes = [
          { primary: '#0284c7', secondary: '#10b981' },
          { primary: '#f59e0b', secondary: '#d97706' },
          { primary: '#a855f7', secondary: '#6366f1' },
          { primary: '#38bdf8', secondary: '#0284c7' },
          { primary: '#f43f5e', secondary: '#991b1b' },
          { primary: '#10b981', secondary: '#047857' }
        ];
        const paletteIdx = existingGalaxy.length % planetPalettes.length;
        const newWorld: FocusPlanetRecord = {
          id: `world_${Date.now()}`,
          name: `${selectedSubject.split('—')[0].trim()} Sphere ${existingGalaxy.length + 1}`,
          type: planetTypes[existingGalaxy.length % planetTypes.length],
          durationMinutes: selectedPomoDuration,
          subject: selectedSubject,
          topic: topicText || 'Deep Study Sprint',
          plantedAt: new Date().toISOString(),
          dateKey: new Date().toISOString().split('T')[0],
          status: 'healthy',
          primaryColor: planetPalettes[paletteIdx].primary,
          secondaryColor: planetPalettes[paletteIdx].secondary,
          radius: 10 + Math.min(12, Math.floor(selectedPomoDuration / 6)),
          orbitRadius: 75 + ((existingGalaxy.length * 28) % 150),
          orbitSpeed: 0.003 + (Math.random() * 0.005),
          orbitAngle: Math.random() * Math.PI * 2
        };
        existingGalaxy.push(newWorld);
        localStorage.setItem(galaxyKey, JSON.stringify(existingGalaxy));
      } catch (e) {
        console.warn('Galaxy world accretion error:', e);
      }

      setCompletionSummary({
        subject: selectedSubject,
        topic: topicText || 'Study Sprint',
        duration: selectedPomoDuration,
        xpAwarded,
        questionsCount: attachedQuestions.length,
        pyqCount: attachedQuestions.filter(q => q.source === 'pyq').length,
        qbCount: attachedQuestions.filter(q => q.source === 'question_bank').length,
        manualCount: attachedQuestions.filter(q => q.source === 'manual').length,
        distractionCount,
        syncSucceeded
      });

      const updated = await loadStudySessions(userId);
      setSessions(updated);

      setPomoMode('break');
      setPomoMinutes(5);
      setPomoSeconds(0);
      setDistractionCount(0);
      setDistractedSecondsTotal(0);
    } else {
      setPomoMode('focus');
      setPomoMinutes(selectedPomoDuration);
      setPomoSeconds(0);
    }
  };

  // Stopwatch Session Completion Handler
  const handleStopwatchFinish = async () => {
    if (stopwatchSeconds <= 0) return;
    setIsSaving(true);
    const targetId = `stopwatch_${Date.now()}`;
    const durationSeconds = stopwatchSeconds;
    let syncSucceeded = false;

    const payload = {
      subject: selectedSubject,
      topic: topicText || 'Live Stopwatch Sprint',
      subtopic: selectedSubtopic || (topicText ? topicText.split('—').pop()?.trim() || topicText : ''),
      nodeId: selectedSyllabusNodeId || null,
      nodeSource: selectedNodeSource || 'official',
      duration: Math.round(durationSeconds / 60) || 1,
      completedDuration: durationSeconds,
      secondsLogged: durationSeconds,
      questionsAttempted: attachedQuestions.length,
      questionIds: attachedQuestions.map(q => q.id),
      questionSources: attachedQuestions.map(q => q.source),
      manualQuestions: attachedQuestions.filter(q => q.source === 'manual'),
      selectedQuestions: attachedQuestions,
      accuracy: 100,
      distractionCount,
      distractedSecondsTotal
    };

    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/user/study-sessions/${targetId}/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          syncSucceeded = true;
          if (data.syllabusTimeLogged || data.totalTimeForNode !== undefined) {
            window.dispatchEvent(
              new CustomEvent('aspirantx_syllabus_time_updated', {
                detail: {
                  nodeId: selectedSyllabusNodeId || (data.syllabusTimeLogged && data.syllabusTimeLogged.nodeId),
                  nodeSource: selectedNodeSource || (data.syllabusTimeLogged && data.syllabusTimeLogged.nodeSource),
                  secondsLogged: durationSeconds,
                  subject: selectedSubject,
                  topic: topicText,
                  subtopic: selectedSubtopic,
                  totalTimeForNode: data.totalTimeForNode || (data.syllabusTimeLogged && data.syllabusTimeLogged.totalTimeForNode)
                }
              })
            );
          }
          if (data.streak && typeof data.streak.streakDays === 'number') {
            window.dispatchEvent(
              new CustomEvent('aspirantx_streak_updated', {
                detail: { streakDays: data.streak.streakDays, lastActiveDate: data.streak.lastActiveDate },
              })
            );
          }
          window.dispatchEvent(
            new CustomEvent('aspirantx_focus_session_completed', {
              detail: { sessionId: targetId, durationSeconds, mode: 'stopwatch' },
            })
          );
        }
      }
    } catch (e) {
      console.warn('Network sync failed for stopwatch session, queued locally:', e);
    }

    if (!syncSucceeded) {
      queueSessionForSync(userId, targetId, payload);
    }

    await saveStudySessionLog({
      userId,
      subject: selectedSubject,
      durationSeconds,
      mode: 'stopwatch'
    });

    handleResetStopwatch();

    // Accrete world into Focus Galaxy from stopwatch
    try {
      const galaxyKey = `aspirantx_focus_galaxy_${userId || 'guest'}`;
      const existingGalaxy: FocusPlanetRecord[] = JSON.parse(localStorage.getItem(galaxyKey) || '[]');
      const planetTypes: ('rocky' | 'gas_giant' | 'ringed' | 'ice' | 'lava' | 'ocean')[] = [
        'rocky', 'gas_giant', 'ringed', 'ice', 'lava', 'ocean'
      ];
      const planetPalettes = [
        { primary: '#0284c7', secondary: '#10b981' },
        { primary: '#f59e0b', secondary: '#d97706' },
        { primary: '#a855f7', secondary: '#6366f1' },
        { primary: '#38bdf8', secondary: '#0284c7' },
        { primary: '#f43f5e', secondary: '#991b1b' },
        { primary: '#10b981', secondary: '#047857' }
      ];
      const paletteIdx = existingGalaxy.length % planetPalettes.length;
      const durationMins = Math.round(durationSeconds / 60) || 1;
      const newWorld: FocusPlanetRecord = {
        id: `world_${Date.now()}`,
        name: `${selectedSubject.split('—')[0].trim()} Sphere ${existingGalaxy.length + 1}`,
        type: planetTypes[existingGalaxy.length % planetTypes.length],
        durationMinutes: durationMins,
        subject: selectedSubject,
        topic: topicText || 'Live Stopwatch Sprint',
        plantedAt: new Date().toISOString(),
        dateKey: new Date().toISOString().split('T')[0],
        status: 'healthy',
        primaryColor: planetPalettes[paletteIdx].primary,
        secondaryColor: planetPalettes[paletteIdx].secondary,
        radius: 10 + Math.min(12, Math.floor(durationMins / 6)),
        orbitRadius: 75 + ((existingGalaxy.length * 28) % 150),
        orbitSpeed: 0.003 + (Math.random() * 0.005),
        orbitAngle: Math.random() * Math.PI * 2
      };
      existingGalaxy.push(newWorld);
      localStorage.setItem(galaxyKey, JSON.stringify(existingGalaxy));
    } catch (e) {}

    setIsSaving(false);

    const updated = await loadStudySessions(userId);
    setSessions(updated);
    setDistractionCount(0);
    setDistractedSecondsTotal(0);
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

  // --- Feature C: Compute Total Focus Hours and Cosmic Tier ---
  const totalFocusSecs = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const totalFocusHours = Math.round((totalFocusSecs / 3600) * 10) / 10;
  const currentTier = [...COSMIC_TIERS].reverse().find(t => totalFocusHours >= t.minHours) || COSMIC_TIERS[0];
  const nextTier = COSMIC_TIERS.find(t => t.minHours > totalFocusHours);

  const allSubjects = [
    ...currentPredefinedSubjects,
    ...customSubjects.map(s => s.name)
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-100">
      <ContextualTour
        featureKey="pomodoro"
        steps={[
          {
            title: 'Deep Focus Sprints',
            description: 'Choose your sprint duration (25m, 45m, or 60m). Your focus star accretes cosmic dust as you concentrate.',
            badge: 'Step 1 of 3'
          },
          {
            title: 'Cosmic Soundscapes',
            description: 'Enable gentle interstellar solar winds, deep space binaural drone, or celestial harmonics to maintain intense flow.',
            badge: 'Step 2 of 3'
          },
          {
            title: 'Syllabus Time Logging',
            description: 'Attach a subject and chapter to automatically log verified focus hours onto your syllabus tracker.',
            badge: 'Step 3 of 3'
          }
        ]}
      />

      {/* Feature B Alert: Tab Switching Distraction Warning */}
      {isDistracted && (
        <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-200 flex items-center justify-between gap-3 animate-pulse shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Gravitational Drift — Tab Left Inactive!</p>
              <p className="text-[11px] text-amber-300/90">
                You were away from this focus tab for &gt;15 seconds. Accretion paused and celestial orbit destabilized ({distractionCount} {distractionCount === 1 ? 'drift' : 'drifts'} recorded).
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDistracted(false)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 text-xs font-bold shrink-0 cursor-pointer"
          >
            Stabilize Orbit
          </button>
        </div>
      )}

      {/* Feature C: Cosmic Focus Horizon Streak Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/30 to-slate-900 border border-sky-500/30 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div 
            className="w-12 h-12 rounded-2xl border flex items-center justify-center text-xl shadow-inner"
            style={{
              backgroundColor: `${currentTier.accentColor}15`,
              borderColor: `${currentTier.accentColor}40`,
              color: currentTier.accentColor
            }}
          >
            <Orbit className="w-6 h-6 animate-spin" style={{ animationDuration: '24s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-sky-400">Focus Galaxy Horizon</span>
              <span 
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border"
                style={{
                  color: currentTier.accentColor,
                  borderColor: `${currentTier.accentColor}40`,
                  backgroundColor: `${currentTier.accentColor}15`
                }}
              >
                {currentTier.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {totalFocusHours} Total Hours in Orbit • {sessions.length} Worlds Accreted
            </p>
          </div>
        </div>

        {nextTier && (
          <div className="text-right text-[11px] text-slate-400 flex flex-col items-end">
            <span className="font-semibold text-slate-300">Next Horizon: {nextTier.name} ({nextTier.minHours}h)</span>
            <div className="w-36 h-2 bg-slate-950 rounded-full mt-1.5 overflow-hidden border border-slate-800">
              <div
                className="h-full rounded-full transition-all"
                style={{ 
                  backgroundColor: nextTier.accentColor,
                  width: `${Math.min(100, Math.round((totalFocusHours / nextTier.minHours) * 100))}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Feature D: Ambient Cosmic Soundscapes Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
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
            {soundPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {soundPlaying ? 'Cosmic Audio ON' : 'Cosmic Frequency'}
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
                  setSelectedSound(snd.id as any);
                  if (audioEngineRef.current && soundPlaying) {
                    audioEngineRef.current.start(snd.id as any, ambientVolume);
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

      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('pomodoro')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'pomodoro'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Pomodoro Timer
          </button>
          <button
            onClick={() => setActiveTab('galaxy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'galaxy'
                ? 'bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" /> Focus Galaxy 🌌
          </button>
          <button
            onClick={() => setActiveTab('stopwatch')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'stopwatch'
                ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Stopwatch
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <History className="w-3.5 h-3.5" /> Flight Log
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

              {/* B) Topic / Chapter Input with Syllabus Subtopic Picker */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" /> Link Syllabus Sub-topic
                </label>
                
                {syllabusOptions.length > 0 && (
                  <select
                    value={selectedSyllabusNodeId || ''}
                    onChange={(e) => handleSyllabusOptionSelect(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-cyan-300 text-xs font-bold focus:outline-none focus:border-cyan-500 cursor-pointer mb-2"
                  >
                    <option value="">-- Optional: Select Syllabus Subtopic (Official / My Syllabus) --</option>
                    {syllabusOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                <input
                  type="text"
                  placeholder="e.g. Current Electricity, Organic Reactions, Modern History..."
                  value={topicText}
                  onChange={(e) => {
                    setTopicText(e.target.value);
                    if (!selectedSyllabusNodeId) {
                      setSelectedSubtopic(e.target.value);
                    }
                  }}
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
            {/* Cosmic Accretion Visual */}
            <div className="mb-2">
              <CosmicAccretionVisual
                progressPercent={pomoProgress}
                isPomoActive={isPomoActive}
                isDistracted={isDistracted}
                totalFocusHours={totalFocusHours}
              />
            </div>

            <div className="relative w-64 h-64 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="128" cy="128" r="110" stroke="currentColor" strokeWidth="8" className="text-slate-950" fill="transparent" />
                <circle
                  cx="128"
                  cy="128"
                  r="110"
                  stroke="currentColor"
                  strokeWidth="8"
                  className={pomoMode === 'focus' ? 'text-sky-500' : 'text-emerald-400'}
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
                  {pomoMode === 'focus' ? `${selectedSubject}` : 'Orbital Rest & Refresh'}
                </span>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center justify-center gap-4 relative z-10">
              <PressFeedback>
                <motion.button
                  animate={isPomoActive ? { scale: [1, 1.015, 1] } : {}}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  onClick={() => {
                    if (!isPomoActive && pomoMode === 'focus') {
                      sessionIdRef.current = 'session_' + Date.now();
                    }
                    setIsPomoActive(!isPomoActive);
                  }}
                  className={`px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2.5 transition-all shadow-lg cursor-pointer ${
                    isPomoActive
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                      : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/20'
                  }`}
                >
                  {isPomoActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  {isPomoActive ? 'PAUSE ORBIT' : 'IGNITE ACCRETION SPRINT'}
                </motion.button>
              </PressFeedback>

              <PressFeedback>
                <button
                  onClick={() => {
                    setIsPomoActive(false);
                    setPomoMinutes(selectedPomoDuration);
                    setPomoSeconds(0);
                  }}
                  className="p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </PressFeedback>
            </div>

            {/* Feature: Focus Shield Integration Callout */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Focus Shield Distraction Blocker</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider">
                      Zero-Bypass VPN
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Locks out YouTube & Instagram at device network level during deep study.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('aspirantx_navigate_tab', { detail: { tab: 'focus_shield' } }));
                }}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-md shadow-sky-600/20 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Launch Shield</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- LIVE STOPWATCH (TAB 2) --- */}
      {activeTab === 'stopwatch' && (
        <div className="p-8 md:p-12 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-8 shadow-2xl">
          {/* Cosmic Visual for Stopwatch */}
          <div className="mb-2">
            <CosmicAccretionVisual
              progressPercent={Math.min(100, Math.round((stopwatchSeconds / 3600) * 100))}
              isPomoActive={isStopwatchActive}
              isDistracted={isDistracted}
              totalFocusHours={totalFocusHours}
            />
          </div>

          <div className="text-6xl sm:text-7xl font-black text-white font-mono tracking-tight">
            {formatStopwatchTime(stopwatchSeconds)}
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {!isStopwatchActive ? (
              <button
                onClick={handleStartStopwatch}
                className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Play className="w-4 h-4 fill-current" /> Start Timer
              </button>
            ) : (
              <button
                onClick={handlePauseStopwatch}
                className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Pause className="w-4 h-4 fill-current" /> Pause
              </button>
            )}

            {stopwatchSeconds > 0 && (
              <button
                onClick={handleStopwatchFinish}
                disabled={isSaving}
                className="px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <CheckCircle2 className="w-4 h-4" /> Save & Log Time
              </button>
            )}

            <button
              onClick={handleResetStopwatch}
              className="p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300"
              title="Reset Stopwatch"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* --- FOCUS GALAXY COSMOS (TAB 2) --- */}
      {activeTab === 'galaxy' && (
        <FocusGalaxyView
          userId={userId}
          selectedExam={selectedExam}
          onStartFocusSession={() => setActiveTab('pomodoro')}
        />
      )}

      {/* --- HISTORY VIEW (TAB 4) --- */}
      {activeTab === 'history' && (
        <PomodoroHistoryView userId={userId} />
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

            {pickerPyqsLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
                Loading real previous year questions...
              </div>
            ) : (
              <div className="space-y-2">
                {(pickerPyqs.length > 0 ? pickerPyqs : INITIAL_PYQS_DATABASE.slice(0, 10)).map((pyq) => (
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
            )}
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

            {pickerQbLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
                Loading real Question Bank items...
              </div>
            ) : (
              <div className="space-y-2">
                {(pickerQbQuestions.length > 0 ? pickerQbQuestions : INITIAL_QUESTION_BANK.slice(0, 10)).map((qb) => (
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
            )}
          </div>
        </div>
      )}

      {/* --- COMPLETION SUMMARY MODAL WITH PROGRESSIVE DISCOVERY --- */}
      <ModalTransition isOpen={Boolean(completionSummary)} onClose={() => setCompletionSummary(null)}>
        {completionSummary && (
          <div className="max-w-md w-full bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 text-center space-y-5 shadow-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">Pomodoro Session Complete!</h3>
              <p className="text-xs text-slate-400">{completionSummary.subject} • {completionSummary.topic}</p>
              <div className="pt-1 flex items-center justify-center gap-2">
                {completionSummary.syncSucceeded ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Cloud Synced
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Saved Locally (Will Sync Online)
                  </span>
                )}
                {completionSummary.distractionCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {completionSummary.distractionCount} {completionSummary.distractionCount === 1 ? 'Distraction' : 'Distractions'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 inline-flex items-center gap-1">
                    ✨ Flawless Orbit (Zero Drift)
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-bold">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase">Duration</span>
                <p className="text-white text-base mt-0.5">{completionSummary.duration} mins</p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase">XP Awarded</span>
                <p className="text-amber-400 text-base mt-0.5">
                  +<CountUp value={completionSummary.xpAwarded} suffix=" XP" />
                </p>
              </div>
            </div>

            {/* Contextual Progressive Discovery: Next Recommended Action */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 to-indigo-950/40 border border-sky-500/30 text-left space-y-1.5 shadow-sm">
              <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Next Recommended Action
              </span>
              <p className="text-xs font-bold text-white">
                Reinforce {completionSummary.subject || 'this subject'} with 5 Practice PYQs
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Active recall immediately following a focus sprint increases retention by up to 40%.
              </p>
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
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Continue Preparation
            </button>
          </div>
        )}
      </ModalTransition>
    </div>
  );
};
