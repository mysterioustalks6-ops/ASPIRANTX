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
  Sprout,
  TreeDeciduous,
  TreePine,
  CloudRain,
  Waves,
  Music,
  ShieldAlert,
  WifiOff
} from 'lucide-react';
import { saveStudySessionLog, loadStudySessions, loadUserProfile } from '../lib/gamification';
import { StudySession, CustomSubject, ManualQuestion, PomodoroQuestionRef } from '../types';
import { INITIAL_PYQS_DATABASE, INITIAL_QUESTION_BANK } from '../data/academicData';
import { fetchOfficialSyllabus, fetchPersonalSyllabus } from '../lib/unifiedSyllabus';
import { PomodoroHistoryView } from './PomodoroHistoryView';
import { ForestGardenView } from './ForestGardenView';
import { getExamConfig, normalizeExamId } from '../lib/examRegistry';
import { useExam } from '../context/ExamContext';

// --- FOREST MILESTONE TIERS (FEATURE C) ---
interface ForestTier {
  id: string;
  name: string;
  minHours: number;
  maxHours: number;
  icon: string;
  badgeColor: string;
  borderCol: string;
  description: string;
}

const FOREST_TIERS: ForestTier[] = [
  { id: 't1', name: 'Seedling Scholar', minHours: 0, maxHours: 5, icon: '🌱', badgeColor: 'bg-emerald-500/20 text-emerald-300', borderCol: 'border-emerald-500/40', description: 'Just sprouted your focus garden' },
  { id: 't2', name: 'Sapling Achiever', minHours: 5, maxHours: 25, icon: '🌿', badgeColor: 'bg-teal-500/20 text-teal-300', borderCol: 'border-teal-500/40', description: 'Deep roots forming consistent study habits' },
  { id: 't3', name: 'Deep Focus Arborist', minHours: 25, maxHours: 100, icon: '🌳', badgeColor: 'bg-cyan-500/20 text-cyan-300', borderCol: 'border-cyan-500/40', description: 'Canopy of high concentration mastery' },
  { id: 't4', name: 'Redwood Sage', minHours: 100, maxHours: 250, icon: '🌲', badgeColor: 'bg-purple-500/20 text-purple-300', borderCol: 'border-purple-500/40', description: 'Unwavering willpower and endurance' },
  { id: 't5', name: 'Grandmaster Bonsai', minHours: 250, maxHours: 1000, icon: '🌸', badgeColor: 'bg-pink-500/20 text-pink-300', borderCol: 'border-pink-500/40', description: 'Zen master of peak academic performance' }
];

// --- WEB AUDIO API AMBIENT SOUND GENERATOR (FEATURE D) ---
class FocusAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseNode: AudioNode | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  public isRunning = false;

  start(soundType: 'rain' | 'waves' | 'synth', volume = 0.5) {
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

      if (soundType === 'rain') {
        // Pink noise generator for gentle rainfall
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
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1100;
        filter.Q.value = 0.7;

        whiteNoise.connect(filter);
        filter.connect(this.masterGain);
        whiteNoise.start(0);
        this.noiseNode = whiteNoise;
      } else if (soundType === 'waves') {
        // Ocean swell noise modulated by slow LFO
        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 450;

        const waveGain = this.ctx.createGain();
        const lfo = this.ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.14; // ~7 second wave cycle

        const lfoGain = this.ctx.createGain();
        lfoGain.gain.value = 0.38;
        lfo.connect(lfoGain);
        lfoGain.connect(waveGain.gain);

        waveGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        whiteNoise.connect(filter);
        filter.connect(waveGain);
        waveGain.connect(this.masterGain);

        whiteNoise.start(0);
        lfo.start(0);
        this.noiseNode = whiteNoise;
        this.lfo = lfo;
      } else if (soundType === 'synth') {
        // Theta Wave Binaural Focus Drone (216 Hz & 222 Hz with harmonic warmth)
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = 'sine';
        osc1.frequency.value = 216;
        osc2.type = 'sine';
        osc2.frequency.value = 222; // 6Hz theta wave focus difference

        filter.type = 'lowpass';
        filter.frequency.value = 550;

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(this.masterGain);

        osc1.start(0);
        osc2.start(0);
        this.osc1 = osc1;
        this.osc2 = osc2;
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

// --- PLANT GROWTH VISUAL COMPONENT (FEATURE A) ---
interface PlantGrowthVisualProps {
  progressPercent: number; // 0 to 100
  isDistracted?: boolean;
  stageName?: string;
  isPomoActive?: boolean;
}

const PlantGrowthVisual: React.FC<PlantGrowthVisualProps> = ({ progressPercent, isDistracted = false, isPomoActive = false }) => {
  // 5 Distinct Growth Stages:
  // 1 (0-19%): Seed in soil
  // 2 (20-39%): Sprout
  // 3 (40-59%): Young Sapling
  // 4 (60-79%): Budding Focus Bush/Tree
  // 5 (80-100%): Majestic Blooming Sacred Tree with Golden Sparkles
  const stage = progressPercent < 20 ? 1 : progressPercent < 40 ? 2 : progressPercent < 60 ? 3 : progressPercent < 80 ? 4 : 5;

  const stageLabels = [
    'Stage 1: Seed in Soil 🌱',
    'Stage 2: Tender Sprout 🌿',
    'Stage 3: Flourishing Sapling 🪴',
    'Stage 4: Budding Arbor Tree 🌳',
    'Stage 5: Majestic Sacred Blossom 🌸'
  ];

  return (
    <div className="flex flex-col items-center justify-center p-3 relative select-none">
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* Soft Background Radial Aura */}
        <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-700 ${
          isDistracted 
            ? 'bg-amber-500/20'
            : stage === 5 ? 'bg-pink-500/25 animate-pulse' : stage >= 3 ? 'bg-emerald-500/20' : 'bg-purple-500/15'
        }`} />

        <svg viewBox="0 0 160 160" className="w-full h-full relative z-10 filter drop-shadow-md">
          {/* Pot / Earth Base */}
          <ellipse cx="80" cy="142" rx="42" ry="10" className="fill-slate-950/80 stroke-slate-800" strokeWidth="2" />
          <path d="M 45 138 Q 80 148 115 138 L 108 152 Q 80 158 52 152 Z" className="fill-amber-950/70 stroke-amber-900/60" strokeWidth="1.5" />

          {/* Stage 1: Seed & Micro Sprout */}
          {stage === 1 && (
            <g className="transition-all duration-500">
              <ellipse cx="80" cy="136" rx="6" ry="4" className="fill-amber-600" />
              <path d="M 80 134 Q 82 124 84 120" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" fill="transparent" />
              <circle cx="84" cy="119" r="2.5" className="fill-emerald-400 animate-pulse" />
            </g>
          )}

          {/* Stage 2: Small Sprout with 2 Leaves */}
          {stage === 2 && (
            <g className="transition-all duration-500">
              <path d="M 80 136 Q 80 115 80 102" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" fill="transparent" />
              {/* Left Leaf */}
              <path d="M 80 116 Q 64 112 66 102 Q 76 104 80 116" fill="#10b981" className="stroke-emerald-300" strokeWidth="0.8" />
              {/* Right Leaf */}
              <path d="M 80 108 Q 96 104 94 94 Q 84 96 80 108" fill="#34d399" className="stroke-emerald-200" strokeWidth="0.8" />
              <circle cx="80" cy="100" r="2" fill="#6ee7b7" />
            </g>
          )}

          {/* Stage 3: Flourishing Sapling with 4 Leaves */}
          {stage === 3 && (
            <g className="transition-all duration-500">
              {/* Stem */}
              <path d="M 80 136 Q 78 110 80 82" stroke="#047857" strokeWidth="4.5" strokeLinecap="round" fill="transparent" />
              {/* Lower Left Leaf */}
              <path d="M 79 118 Q 54 116 58 100 Q 72 104 79 118" fill="#059669" className="stroke-emerald-300" strokeWidth="1" />
              {/* Lower Right Leaf */}
              <path d="M 80 110 Q 106 108 102 92 Q 88 96 80 110" fill="#10b981" className="stroke-emerald-300" strokeWidth="1" />
              {/* Upper Left Leaf */}
              <path d="M 79 94 Q 60 88 64 74 Q 76 78 79 94" fill="#34d399" className="stroke-emerald-200" strokeWidth="1" />
              {/* Upper Right Leaf */}
              <path d="M 80 88 Q 98 82 96 68 Q 84 72 80 88" fill="#6ee7b7" className="stroke-emerald-100" strokeWidth="1" />
              <circle cx="80" cy="80" r="3" fill="#a7f3d0" />
            </g>
          )}

          {/* Stage 4: Budding Focus Tree */}
          {stage === 4 && (
            <g className="transition-all duration-500">
              {/* Trunk */}
              <path d="M 80 136 L 80 85 Q 74 65 65 52 M 80 85 Q 86 65 95 52 M 80 75 L 80 50" stroke="#78350f" strokeWidth="6" strokeLinecap="round" fill="transparent" />
              {/* Foliage Clusters */}
              <circle cx="65" cy="52" r="18" fill="#059669" opacity="0.9" />
              <circle cx="95" cy="52" r="18" fill="#10b981" opacity="0.9" />
              <circle cx="80" cy="42" r="22" fill="#34d399" opacity="0.95" />
              <circle cx="80" cy="40" r="14" fill="#6ee7b7" opacity="0.7" />
              {/* Buds */}
              <circle cx="60" cy="45" r="3" fill="#f43f5e" />
              <circle cx="100" cy="45" r="3" fill="#f43f5e" />
              <circle cx="80" cy="30" r="3.5" fill="#fb7185" />
            </g>
          )}

          {/* Stage 5: Majestic Sacred Blooming Tree */}
          {stage === 5 && (
            <g className="transition-all duration-500">
              {/* Trunk with Bark Details */}
              <path d="M 80 136 Q 78 100 80 80 Q 70 58 55 45 M 80 80 Q 90 58 105 45 M 80 70 L 80 42" stroke="#5c2c16" strokeWidth="7" strokeLinecap="round" fill="transparent" />
              {/* Lush Glowing Canopy */}
              <circle cx="55" cy="45" r="22" fill="#047857" opacity="0.9" />
              <circle cx="105" cy="45" r="22" fill="#059669" opacity="0.9" />
              <circle cx="80" cy="35" r="28" fill="#10b981" opacity="0.95" />
              <circle cx="80" cy="30" r="20" fill="#34d399" opacity="0.8" />
              {/* Blossom Flowers & Golden Sparkles */}
              <circle cx="50" cy="40" r="5" fill="#fda4af" className="stroke-pink-400" strokeWidth="1" />
              <circle cx="65" cy="25" r="5.5" fill="#f472b6" className="stroke-pink-300" strokeWidth="1" />
              <circle cx="95" cy="25" r="5.5" fill="#f472b6" className="stroke-pink-300" strokeWidth="1" />
              <circle cx="110" cy="40" r="5" fill="#fda4af" className="stroke-pink-400" strokeWidth="1" />
              <circle cx="80" cy="20" r="6" fill="#fb7185" className="stroke-white animate-pulse" strokeWidth="1" />
              <circle cx="80" cy="48" r="4.5" fill="#fbcfe8" />
              
              {/* Golden Fireflies */}
              <circle cx="42" cy="32" r="2" fill="#fef08a" className="animate-ping" />
              <circle cx="118" cy="32" r="2" fill="#fef08a" className="animate-ping" style={{ animationDelay: '0.6s' }} />
              <circle cx="80" cy="8" r="2.5" fill="#facc15" className="animate-pulse" />
            </g>
          )}
        </svg>
      </div>

      <div className="mt-1 text-center">
        <span className={`text-[11px] font-extrabold tracking-wide uppercase px-2.5 py-0.5 rounded-full border ${
          isDistracted 
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            : stage === 5 ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        }`}>
          {stageLabels[stage - 1]} ({progressPercent}%)
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

  const [activeTab, setActiveTab] = useState<'stopwatch' | 'pomodoro' | 'forest' | 'history'>('pomodoro');

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
  const [selectedSound, setSelectedSound] = useState<'rain' | 'waves' | 'synth'>('rain');
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

  // --- Feature C: Compute Total Focus Hours and Forest Tier ---
  const totalFocusSecs = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  const totalFocusHours = Math.round((totalFocusSecs / 3600) * 10) / 10;
  const currentTier = [...FOREST_TIERS].reverse().find(t => totalFocusHours >= t.minHours) || FOREST_TIERS[0];
  const nextTier = FOREST_TIERS.find(t => t.minHours > totalFocusHours);

  const allSubjects = [
    ...currentPredefinedSubjects,
    ...customSubjects.map(s => s.name)
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-100">
      {/* Feature B Alert: Tab Switching Distraction Warning */}
      {isDistracted && (
        <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-200 flex items-center justify-between gap-3 animate-pulse shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider">Distraction Warning — Tab Left Inactive!</p>
              <p className="text-[11px] text-amber-300/90">
                You were away from this tab for &gt;15 seconds. Your focus plant growth has withered slightly ({distractionCount} {distractionCount === 1 ? 'distraction' : 'distractions'} recorded).
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDistracted(false)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/30 hover:bg-amber-500/40 text-amber-100 text-xs font-bold shrink-0"
          >
            Refocus
          </button>
        </div>
      )}

      {/* Feature C: Forest Milestone Streak Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl shadow-inner">
            {currentTier.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Forest Sanctuary Tier</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {currentTier.name}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {totalFocusHours} Total Hours Focused • {sessions.length} Completed Sprints
            </p>
          </div>
        </div>

        {nextTier && (
          <div className="text-right text-[11px] text-slate-400 flex flex-col items-end">
            <span className="font-semibold text-slate-300">Next Milestone: {nextTier.name} ({nextTier.minHours}h)</span>
            <div className="w-36 h-2 bg-slate-950 rounded-full mt-1.5 overflow-hidden border border-slate-800">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((totalFocusHours / nextTier.minHours) * 100))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Feature D: Ambient Sound Engine Controls Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundPlaying(!soundPlaying)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              soundPlaying
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {soundPlaying ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {soundPlaying ? 'Ambient Sound ON' : 'Play Ambient Sound'}
          </button>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['rain', 'waves', 'synth'] as const).map((snd) => (
              <button
                key={snd}
                onClick={() => {
                  setSelectedSound(snd);
                  if (!soundPlaying) setSoundPlaying(true);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                  selectedSound === snd
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {snd === 'rain' ? '🌧️ Rain' : snd === 'waves' ? '🌊 Waves' : '🎵 Synth'}
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
            onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
            className="w-20 accent-emerald-400 cursor-pointer h-1.5 rounded-lg bg-slate-950"
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
                ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Pomodoro Timer
          </button>
          <button
            onClick={() => setActiveTab('forest')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'forest'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" /> My Focus Forest 🌲
          </button>
          <button
            onClick={() => setActiveTab('stopwatch')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'stopwatch'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/20'
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
            <History className="w-3.5 h-3.5" /> Study History
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
            {/* Feature A: Visual Growth Component */}
            <div className="mb-2">
              <PlantGrowthVisual
                progressPercent={pomoProgress}
                isPomoActive={isPomoActive}
                isDistracted={isDistracted}
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
          {/* Feature A Tree for Stopwatch */}
          <div className="mb-2">
            <PlantGrowthVisual
              progressPercent={Math.min(100, Math.round((stopwatchSeconds / 3600) * 100))}
              isPomoActive={isStopwatchActive}
              isDistracted={isDistracted}
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

      {/* --- FOREST GARDEN ECOSYSTEM (TAB 2) --- */}
      {activeTab === 'forest' && (
        <ForestGardenView
          userId={userId}
          selectedExam={selectedExam}
          onPlantNewTree={() => setActiveTab('pomodoro')}
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
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                    🌿 Zero Distractions
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
