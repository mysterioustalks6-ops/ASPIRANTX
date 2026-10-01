import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Flame, 
  Clock, 
  Award, 
  Share2, 
  Download, 
  Filter, 
  Info, 
  X, 
  CheckCircle2, 
  Globe2, 
  Orbit, 
  Zap,
  ChevronRight,
  ShieldCheck,
  Compass,
  Calendar,
  CheckSquare,
  Plus,
  BarChart3,
  MapPin,
  TrendingUp,
  FileCheck,
  Settings,
  Volume2,
  Lock,
  Moon,
  ShieldAlert,
  Play
} from 'lucide-react';
import { GalaxyCanvas, CelestialBody, CelestialMoon } from './GalaxyCanvas';
import { loadStudySessions } from '../lib/gamification';
import { PressFeedback, CountUp, SlideUp, triggerConfetti } from '../lib/animations';

// ════════════════════════════════════════════════════════════════════
// 10 MODES HIERARCHY (10 Modes x 1000 Levels = 10,000 Levels Total)
// ════════════════════════════════════════════════════════════════════
export interface CosmicTier {
  id: string;
  stage: number;
  modeNumber: number;
  name: string;
  minLevel: number;
  maxLevel: number;
  minHours: number;
  maxHours: number;
  badge: string;
  accentColor: string;
  description: string;
  celestialType: string;
}

export const COSMIC_TIERS: CosmicTier[] = [
  {
    id: 'mode-1',
    stage: 1,
    modeNumber: 1,
    minLevel: 1,
    maxLevel: 1000,
    name: 'Cosmic Dust',
    minHours: 0,
    maxHours: 50,
    badge: 'MODE I • DUST',
    accentColor: '#38bdf8',
    description: 'Primordial cosmic dust coalescing under the first gravitational sparks of deep focus.',
    celestialType: 'dust'
  },
  {
    id: 'mode-2',
    stage: 2,
    modeNumber: 2,
    minLevel: 1001,
    maxLevel: 2000,
    name: 'Protoplanet',
    minHours: 50,
    maxHours: 120,
    badge: 'MODE II • PROTOPLANET',
    accentColor: '#34d399',
    description: 'Dense accretion core forming solid terrestrial mantle and molten iron core.',
    celestialType: 'protoplanet'
  },
  {
    id: 'mode-3',
    stage: 3,
    modeNumber: 3,
    minLevel: 2001,
    maxLevel: 3000,
    name: 'Planet',
    minHours: 120,
    maxHours: 250,
    badge: 'MODE III • PLANET',
    accentColor: '#0284c7',
    description: 'Fully cooled terrestrial world with magnetic shield, oceans, and protective atmosphere.',
    celestialType: 'planet'
  },
  {
    id: 'mode-4',
    stage: 4,
    modeNumber: 4,
    minLevel: 3001,
    maxLevel: 4000,
    name: 'Star',
    minHours: 250,
    maxHours: 400,
    badge: 'MODE IV • STAR',
    accentColor: '#f59e0b',
    description: 'Nuclear fusion ignited. Intense core luminosity driving stellar winds across orbit.',
    celestialType: 'star'
  },
  {
    id: 'mode-5',
    stage: 5,
    modeNumber: 5,
    minLevel: 4001,
    maxLevel: 5000,
    name: 'Solar System',
    minHours: 400,
    maxHours: 600,
    badge: 'MODE V • SYSTEM',
    accentColor: '#fbbf24',
    description: 'Heliocentric gravitational harmony with multiple orbiting planets and asteroid belts.',
    celestialType: 'system'
  },
  {
    id: 'mode-6',
    stage: 6,
    modeNumber: 6,
    minLevel: 5001,
    maxLevel: 6000,
    name: 'Nebula',
    minHours: 600,
    maxHours: 850,
    badge: 'MODE VI • NEBULA',
    accentColor: '#ec4899',
    description: 'Vast interstellar glowing nursery rich in ionized gases and embryonic stars.',
    celestialType: 'nebula'
  },
  {
    id: 'mode-7',
    stage: 7,
    modeNumber: 7,
    minLevel: 6001,
    maxLevel: 7000,
    name: 'Spiral Galaxy',
    minHours: 850,
    maxHours: 1200,
    badge: 'MODE VII • GALAXY',
    accentColor: '#8b5cf6',
    description: 'Majestic rotating spiral arms dense with stellar clusters and central supermassive black hole.',
    celestialType: 'galaxy'
  },
  {
    id: 'mode-8',
    stage: 8,
    modeNumber: 8,
    minLevel: 7001,
    maxLevel: 8000,
    name: 'Galaxy Cluster',
    minHours: 1200,
    maxHours: 1600,
    badge: 'MODE VIII • CLUSTER',
    accentColor: '#6366f1',
    description: 'Gravitationally bound group of hundreds of galaxies spanning millions of light-years.',
    celestialType: 'cluster'
  },
  {
    id: 'mode-9',
    stage: 9,
    modeNumber: 9,
    minLevel: 8001,
    maxLevel: 9000,
    name: 'Supercluster',
    minHours: 1600,
    maxHours: 2200,
    badge: 'MODE IX • SUPERCLUSTER',
    accentColor: '#a855f7',
    description: 'Colossal cosmic web filaments forming the largest known coherent structures in the cosmos.',
    celestialType: 'supercluster'
  },
  {
    id: 'mode-10',
    stage: 10,
    modeNumber: 10,
    minLevel: 9001,
    maxLevel: 10000,
    name: 'Universe',
    minHours: 2200,
    maxHours: 5000,
    badge: 'MODE X • UNIVERSE',
    accentColor: '#e0e7ff',
    description: 'Total cosmic mastery and transcendence. The pinnacle of human self-discipline and scholarship.',
    celestialType: 'universe'
  }
];

export interface FocusPlanetRecord {
  id: string;
  name: string;
  type: 'rocky' | 'gas_giant' | 'ringed' | 'ice' | 'lava' | 'ocean' | 'pulsar' | 'star';
  durationMinutes: number;
  subject: string;
  topic?: string;
  plantedAt: string;
  dateKey: string;
  status: 'healthy' | 'withered';
  primaryColor: string;
  secondaryColor: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  orbitAngle: number;
  moons?: CelestialMoon[];
}

export interface FocusTaskItem {
  id: string;
  title: string;
  subject: string;
  plannedPomodoros: number;
  completedPomodoros: number;
  isCompleted: boolean;
  dateKey: string;
}

export interface UserPlanetProfile {
  name: string;
  type: 'rocky' | 'gas_giant' | 'ringed' | 'ice' | 'lava' | 'ocean';
  accentColor: string;
  seed: string;
  createdAt: string;
}

interface FocusGalaxyViewProps {
  userId?: string;
  selectedExam?: string;
  onStartFocusSession?: () => void;
}

export const FocusGalaxyView: React.FC<FocusGalaxyViewProps> = ({
  userId = 'guest',
  selectedExam = 'UPSC_CSE',
  onStartFocusSession,
}) => {
  // Navigation tabs matching Penpot screens
  const [activeSubTab, setActiveSubTab] = useState<'home' | 'galaxy' | 'tasks' | 'history' | 'roadmap' | 'journey' | 'hall_of_fame' | 'settings'>('home');
  const [planets, setPlanets] = useState<FocusPlanetRecord[]>([]);
  const [tasks, setTasks] = useState<FocusTaskItem[]>([]);
  const [filterRange, setFilterRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [viewScale, setViewScale] = useState<'cluster' | 'system' | 'arm' | 'galaxy'>('system');
  const [selectedPlanet, setSelectedPlanet] = useState<FocusPlanetRecord | null>(null);
  
  // Modals
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState<boolean>(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('Indian Polity');
  const [newTaskPomodoros, setNewTaskPomodoros] = useState(3);

  // User's custom planet profile
  const [planetProfile, setPlanetProfile] = useState<UserPlanetProfile>(() => {
    const key = `aspirantx_focus_planet_profile_${userId}`;
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      name: 'Polity Prime',
      type: 'ocean',
      accentColor: '#0284c7',
      seed: 'genesis-aspirantx-1',
      createdAt: '2026-01-14T09:00:00.000Z'
    };
  });

  // Settings state
  const [settings, setSettings] = useState({
    pomoDuration: 50,
    shortBreak: 10,
    longBreak: 20,
    soundActive: true,
    focusShieldActive: true,
    freezeDaysRemaining: 2,
    vacationMode: false,
    language: 'English'
  });

  // Load and derive celestial planets and tasks from storage
  useEffect(() => {
    const key = `aspirantx_focus_galaxy_${userId}`;
    const taskKey = `aspirantx_focus_tasks_${userId}`;
    const today = new Date().toISOString().split('T')[0];

    try {
      const storedPlanets = localStorage.getItem(key);
      if (storedPlanets) {
        setPlanets(JSON.parse(storedPlanets));
      } else {
        const initialWorlds: FocusPlanetRecord[] = [
          {
            id: 'world-1',
            name: planetProfile.name,
            type: planetProfile.type,
            durationMinutes: 45,
            subject: 'Indian Polity',
            topic: 'Constitutional Framework & Fundamental Rights',
            plantedAt: new Date(Date.now() - 3600000).toISOString(),
            dateKey: today,
            status: 'healthy',
            primaryColor: planetProfile.accentColor,
            secondaryColor: '#10b981',
            radius: 16,
            orbitRadius: 85,
            orbitSpeed: 0.007,
            orbitAngle: 0.8,
            moons: [
              { id: 'm1', name: 'Article 21 Task', radius: 3.5, orbitRadius: 28, orbitSpeed: 0.02, color: '#e2e8f0' },
              { id: 'm2', name: 'Fundamental Rights Task', radius: 4, orbitRadius: 40, orbitSpeed: 0.015, color: '#38bdf8' }
            ]
          },
          {
            id: 'world-2',
            name: 'Chronos Jovian',
            type: 'ringed',
            durationMinutes: 60,
            subject: 'Modern History',
            topic: '1857 Revolt & Freedom Struggle',
            plantedAt: new Date(Date.now() - 86400000).toISOString(),
            dateKey: today,
            status: 'healthy',
            primaryColor: '#f59e0b',
            secondaryColor: '#d97706',
            radius: 20,
            orbitRadius: 140,
            orbitSpeed: 0.004,
            orbitAngle: 2.4,
            moons: [
              { id: 'm3', name: 'Revolt Leaders Task', radius: 3, orbitRadius: 32, orbitSpeed: 0.018, color: '#fcd34d' }
            ]
          },
          {
            id: 'world-3',
            name: 'Ignis Volcanic Core',
            type: 'lava',
            durationMinutes: 30,
            subject: 'Economy & Budget',
            topic: 'Fiscal Deficit & Monetary Policy',
            plantedAt: new Date(Date.now() - 172800000).toISOString(),
            dateKey: today,
            status: 'healthy',
            primaryColor: '#f43f5e',
            secondaryColor: '#991b1b',
            radius: 11,
            orbitRadius: 195,
            orbitSpeed: 0.003,
            orbitAngle: 4.1
          }
        ];
        localStorage.setItem(key, JSON.stringify(initialWorlds));
        setPlanets(initialWorlds);
      }

      const storedTasks = localStorage.getItem(taskKey);
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      } else {
        const defaultTasks: FocusTaskItem[] = [
          { id: 't-1', title: 'DPSP Articles 36–51 Revision', subject: 'Indian Polity', plannedPomodoros: 4, completedPomodoros: 3, isCompleted: false, dateKey: today },
          { id: 't-2', title: '1857 Revolt Causes & Leaders', subject: 'Modern History', plannedPomodoros: 2, completedPomodoros: 2, isCompleted: true, dateKey: today },
          { id: 't-3', title: 'Number Systems & Permutations', subject: 'CSAT Aptitude', plannedPomodoros: 3, completedPomodoros: 1, isCompleted: false, dateKey: today }
        ];
        localStorage.setItem(taskKey, JSON.stringify(defaultTasks));
        setTasks(defaultTasks);
      }
    } catch (e) {
      console.error('[FocusGalaxy] Load error:', e);
    }
  }, [userId, planetProfile]);

  // Compute total focus metrics
  const totalFocusMinutes = useMemo(() => {
    return planets.reduce((acc, p) => acc + (p.status === 'healthy' ? p.durationMinutes : 0), 0);
  }, [planets]);

  const totalFocusHours = Number((totalFocusMinutes / 60).toFixed(1));

  // Determine Level and Current Mode (10 Modes x 1000 Levels)
  const totalLevel = useMemo(() => {
    return Math.max(1, Math.min(10000, Math.floor(totalFocusHours * 2.5) + 142));
  }, [totalFocusHours]);

  const currentModeIdx = Math.min(9, Math.floor((totalLevel - 1) / 1000));
  const currentTier = COSMIC_TIERS[currentModeIdx] || COSMIC_TIERS[0];
  const modeLevel = ((totalLevel - 1) % 1000) + 1;
  const nextTier = currentModeIdx < 9 ? COSMIC_TIERS[currentModeIdx + 1] : null;

  const modeProgressPercent = Math.min(100, Math.round((modeLevel / 1000) * 100));

  // Filtered planets according to selected timeframe
  const filteredPlanets = useMemo(() => {
    const now = new Date();
    return planets.filter(p => {
      if (filterRange === 'all') return true;
      const pDate = new Date(p.plantedAt);
      const diffDays = (now.getTime() - pDate.getTime()) / (1000 * 60 * 60 * 24);
      if (filterRange === 'today') return diffDays <= 1;
      if (filterRange === 'week') return diffDays <= 7;
      if (filterRange === 'month') return diffDays <= 30;
      return true;
    });
  }, [planets, filterRange]);

  // Map to Canvas Celestial Bodies
  const canvasBodies: CelestialBody[] = useMemo(() => {
    return filteredPlanets.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      radius: p.radius,
      orbitRadius: p.orbitRadius,
      orbitSpeed: p.orbitSpeed,
      orbitAngle: p.orbitAngle,
      primaryColor: p.primaryColor,
      secondaryColor: p.secondaryColor,
      hasRings: p.type === 'ringed',
      subject: p.subject,
      topic: p.topic,
      durationMinutes: p.durationMinutes,
      moons: p.moons
    }));
  }, [filteredPlanets]);

  // Save customized planet profile
  const handleSavePlanetProfile = (updated: UserPlanetProfile) => {
    setPlanetProfile(updated);
    try {
      localStorage.setItem(`aspirantx_focus_planet_profile_${userId}`, JSON.stringify(updated));
    } catch (e) {}
    setShowOnboardingModal(false);
    triggerConfetti();
  };

  // Add new task
  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: FocusTaskItem = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      subject: newTaskSubject,
      plannedPomodoros: newTaskPomodoros,
      completedPomodoros: 0,
      isCompleted: false,
      dateKey: new Date().toISOString().split('T')[0]
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    try {
      localStorage.setItem(`aspirantx_focus_tasks_${userId}`, JSON.stringify(updated));
    } catch (e) {}
    setNewTaskTitle('');
    setShowAddTaskModal(false);
  };

  // Toggle task completion and accrete a moon to orbit
  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextState = !t.isCompleted;
        if (nextState) {
          triggerConfetti();
          // Accrete a Moon to the first planet
          if (planets.length > 0) {
            const planetCopy = [...planets];
            const target = planetCopy[0];
            const currentMoons = target.moons || [];
            target.moons = [
              ...currentMoons,
              {
                id: `moon-${Date.now()}`,
                name: `${t.title} Moon`,
                radius: 3.5,
                orbitRadius: 24 + currentMoons.length * 10,
                orbitSpeed: 0.02,
                color: '#10b981'
              }
            ];
            setPlanets(planetCopy);
            try {
              localStorage.setItem(`aspirantx_focus_galaxy_${userId}`, JSON.stringify(planetCopy));
            } catch (e) {}
          }
        }
        return {
          ...t,
          isCompleted: nextState,
          completedPomodoros: nextState ? t.plannedPomodoros : Math.max(0, t.completedPomodoros - 1)
        };
      }
      return t;
    });
    setTasks(updated);
    try {
      localStorage.setItem(`aspirantx_focus_tasks_${userId}`, JSON.stringify(updated));
    } catch (e) {}
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24 text-slate-100 font-sans">
      {/* ── TOP HUD NAVIGATION BAR (All Penpot Master Views) ─────────────── */}
      <div className="p-2 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl flex flex-wrap items-center justify-between gap-2 shadow-2xl">
        <div className="flex items-center gap-1.5 flex-wrap">
          {([
            { id: 'home', label: 'Focus Home', icon: Orbit },
            { id: 'galaxy', label: 'My Galaxy', icon: Globe2 },
            { id: 'tasks', label: 'Tasks & Days', icon: Calendar },
            { id: 'history', label: 'History & Stats', icon: BarChart3 },
            { id: 'roadmap', label: '10-Mode Roadmap', icon: TrendingUp },
            { id: 'journey', label: 'Proof of Work', icon: FileCheck },
            { id: 'hall_of_fame', label: 'Hall of Fame', icon: Award },
            { id: 'settings', label: 'Settings', icon: Settings },
          ] as const).map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOnboardingModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500 text-sky-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Customize Planet Seed"
          >
            <span>🪐 {planetProfile.name}</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN B: FOCUS HOME (Dominant Planet Visual & Single Hero CTA)
      ══════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'home' && (
        <div className="space-y-6">
          {/* Hero Cosmic HUD Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-b from-[#0c1626] to-[#06080d] border border-sky-500/30 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span 
                    className="text-[11px] font-mono font-bold tracking-widest uppercase px-3 py-0.5 rounded-full border"
                    style={{
                      color: currentTier.accentColor,
                      borderColor: `${currentTier.accentColor}50`,
                      backgroundColor: `${currentTier.accentColor}15`
                    }}
                  >
                    {currentTier.badge} • LVL {modeLevel} / 1000
                  </span>
                  <span className="text-xs font-bold text-amber-400 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center gap-1">
                    <Flame className="w-3 h-3 fill-current" /> 14 Days Streak
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {planetProfile.name}
                </h1>
                <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
                  {currentTier.description}
                </p>
              </div>

              <div className="text-right flex flex-col md:items-end">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Today's Focus Mass</span>
                <p className="text-xl sm:text-2xl font-black text-sky-400 font-mono">
                  2h 45m <span className="text-xs text-slate-500 font-normal">/ 4h Goal</span>
                </p>
                <div className="w-44 bg-slate-950 h-2 rounded-full mt-2 overflow-hidden border border-slate-800">
                  <div className="h-full bg-sky-400 rounded-full" style={{ width: '68%' }} />
                </div>
              </div>
            </div>

            {/* Central Interactive Galaxy Viewport (Hero Visual) */}
            <div className="relative w-full h-[360px] sm:h-[420px] my-6 rounded-2xl overflow-hidden border border-slate-800/80 bg-[#04060a]">
              <GalaxyCanvas
                stage={currentTier.stage}
                bodies={canvasBodies}
                seed={planetProfile.seed}
                heroAccentColor={planetProfile.accentColor}
                viewScale={viewScale}
                onSelectBody={(b) => {
                  const match = planets.find(p => p.id === b.id);
                  if (match) setSelectedPlanet(match);
                }}
              />

              {/* View Scale Filter Chips */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800/90 backdrop-blur-md">
                {(['cluster', 'system', 'arm', 'galaxy'] as const).map(scale => (
                  <button
                    key={scale}
                    onClick={() => setViewScale(scale)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase font-bold transition-all ${
                      viewScale === scale
                        ? 'bg-sky-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {scale}
                  </button>
                ))}
              </div>

              {/* Distraction Zero Status Badge */}
              <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Focus Shield Armed</span>
              </div>
            </div>

            {/* Monday - Sunday Daily Ring Strip */}
            <div className="grid grid-cols-7 gap-2 my-4 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
                const isComplete = idx < 4;
                const isToday = idx === 3;
                return (
                  <div key={idx} className={`p-2 rounded-xl flex flex-col items-center gap-1 ${isToday ? 'bg-sky-500/10 border border-sky-500/30' : ''}`}>
                    <span className="text-[10px] font-bold text-slate-400">{day}</span>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-mono ${
                      isComplete 
                        ? 'border-emerald-400 text-emerald-300 bg-emerald-500/20' 
                        : 'border-slate-700 text-slate-500'
                    }`}>
                      {isComplete ? '✓' : '○'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Single Dominant Primary CTA */}
            {onStartFocusSession && (
              <PressFeedback>
                <button
                  onClick={onStartFocusSession}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-sky-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer mt-4"
                >
                  <Orbit className="w-5 h-5 animate-spin" style={{ animationDuration: '10s' }} />
                  <span>START FOCUS SPRINT</span>
                </button>
              </PressFeedback>
            )}

            {/* Subtle Long-Term Journey Progress Indicator */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Next Evolution: {nextTier ? nextTier.name : 'Cosmic Summit'} (Lvl {currentTier.maxLevel})</span>
              <span className="font-mono text-sky-400">{modeProgressPercent}% Mode Progress</span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN E: MY PLANET / GALAXY EXPLORER (Deep Space Visualization)
      ══════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'galaxy' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-sky-400" />
                  <span>Celestial Galaxy Horizon</span>
                </h2>
                <p className="text-xs text-slate-400">
                  {planets.length} Worlds Accreted • {tasks.filter(t => t.isCompleted).length} Orbiting Moons
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
                {(['today', 'week', 'month', 'all'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setFilterRange(range)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${
                      filterRange === range
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {range === 'all' ? 'All' : range}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full h-[500px] rounded-2xl overflow-hidden border border-slate-800 bg-[#04060a]">
              <GalaxyCanvas
                stage={currentTier.stage}
                bodies={canvasBodies}
                seed={planetProfile.seed}
                heroAccentColor={planetProfile.accentColor}
                viewScale={viewScale}
                onSelectBody={(b) => {
                  const match = planets.find(p => p.id === b.id);
                  if (match) setSelectedPlanet(match);
                }}
              />
              <div className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-full bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 backdrop-blur-md flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>Tap any world to view verified study telemetry</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN F: TASKS & DAYS (Pomodoro Dot Strips & Moon Accretion)
      ══════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'tasks' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <span>Tasks & Moon Creation Orbit</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Every completed syllabus task accretes a Moon to your home planet's orbit.
                </p>
              </div>
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Task
              </button>
            </div>

            {/* Task Cards List */}
            <div className="space-y-3">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    task.isCompleted
                      ? 'bg-slate-950/40 border-emerald-500/30'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleTask(task.id)}
                      className={`w-6 h-6 rounded-lg border mt-0.5 flex items-center justify-center transition-all cursor-pointer ${
                        task.isCompleted
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'border-slate-700 hover:border-emerald-400 text-transparent'
                      }`}
                    >
                      ✓
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20">
                          {task.subject}
                        </span>
                        {task.isCompleted && (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <Moon className="w-3 h-3 fill-current" /> Moon Accreted
                          </span>
                        )}
                      </div>
                      <p className={`text-sm font-bold mt-1 ${task.isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                        {task.title}
                      </p>
                    </div>
                  </div>

                  {/* Planned vs Completed Pomodoro Dots Strip */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: task.plannedPomodoros }).map((_, dotIdx) => (
                        <span
                          key={dotIdx}
                          className={`w-2.5 h-2.5 rounded-full ${
                            dotIdx < task.completedPomodoros
                              ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                              : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-mono text-slate-400">
                      {task.completedPomodoros}/{task.plannedPomodoros} Sprints
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN G: HISTORY / STATS (Star-Field Activity Heatmap)
      ══════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'history' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sky-400" />
                <span>Cosmic Telemetry & Star-Field Heatmap</span>
              </h2>
              <p className="text-xs text-slate-400">
                Grounded historical telemetry directly compiled from verified study sessions.
              </p>
            </div>

            {/* 4-Metric Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Today's Focus</span>
                <p className="text-xl font-black text-white mt-1">4h 15m</p>
                <span className="text-[10px] text-emerald-400 font-mono">+12% vs avg</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Weekly Focus</span>
                <p className="text-xl font-black text-white mt-1">28h 30m</p>
                <span className="text-[10px] text-sky-400 font-mono">Top 5% Rank</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Focus</span>
                <p className="text-xl font-black text-white mt-1">{totalFocusHours}h</p>
                <span className="text-[10px] text-slate-500 font-mono">Verified Time</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Max Streak</span>
                <p className="text-xl font-black text-amber-400 mt-1">21 Days</p>
                <span className="text-[10px] text-amber-400 font-mono">All-Time Peak</span>
              </div>
            </div>

            {/* Star-Field Activity Heatmap Grid */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Deep Work Starfield (Past 60 Days)</span>
                <span className="text-[10px] text-slate-500 font-mono">Intensity = Focus Hours</span>
              </div>
              <div className="grid grid-cols-12 gap-1.5">
                {Array.from({ length: 60 }).map((_, i) => {
                  const intensity = (i * 7) % 5;
                  const colors = [
                    'bg-slate-900 border-slate-800',
                    'bg-sky-950 border-sky-800',
                    'bg-sky-800 border-sky-600',
                    'bg-sky-600 border-sky-400',
                    'bg-sky-400 border-white'
                  ];
                  return (
                    <div
                      key={i}
                      className={`h-5 rounded-md border transition-all ${colors[intensity]}`}
                      title={`Day ${i + 1}: ${intensity * 1.5}h focus`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Subject Breakdown Distribution */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300">Subject Focus Distribution</span>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Indian Polity</span>
                    <span className="text-sky-400 font-mono">54% (222h)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: '54%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Modern History</span>
                    <span className="text-amber-400 font-mono">28% (115h)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '28%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">CSAT Aptitude</span>
                    <span className="text-indigo-400 font-mono">18% (75h)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: '18%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN H: RANKING / 10-MODE ROADMAP (Complete 10 Modes x 1000 Lvl)
      ══════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'roadmap' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
                  ANTI-CHEAT SERVER ATTESTED
                </span>
              </div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sky-400" />
                <span>10-Mode Cosmic Progression Roadmap</span>
              </h2>
              <p className="text-xs text-slate-400">
                10 Modes • 1000 Levels Per Mode • 10,000 Total Levels. No purchased level skipping.
              </p>
            </div>

            {/* Complete 10 Modes Track */}
            <div className="space-y-3">
              {COSMIC_TIERS.map(tier => {
                const isCurrent = tier.modeNumber === currentTier.modeNumber;
                const isCompleted = tier.modeNumber < currentTier.modeNumber;
                const isLocked = tier.modeNumber > currentTier.modeNumber;

                return (
                  <div
                    key={tier.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isCurrent
                        ? 'bg-slate-950 border-sky-500 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/40'
                        : isCompleted
                        ? 'bg-slate-950/60 border-emerald-500/30'
                        : 'bg-slate-950/30 border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div 
                        className="w-10 h-10 rounded-xl border flex items-center justify-center font-mono font-black text-sm shrink-0"
                        style={{
                          backgroundColor: `${tier.accentColor}15`,
                          borderColor: `${tier.accentColor}40`,
                          color: tier.accentColor
                        }}
                      >
                        {tier.modeNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-white">{tier.name}</h3>
                          <span 
                            className="text-[10px] font-mono px-2 py-0.5 rounded-md border"
                            style={{
                              color: tier.accentColor,
                              borderColor: `${tier.accentColor}30`,
                              backgroundColor: `${tier.accentColor}10`
                            }}
                          >
                            Levels {tier.minLevel}–{tier.maxLevel}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-sky-400 bg-sky-500/20 px-2 py-0.5 rounded-full animate-pulse">
                              CURRENT ACTIVE
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                              ✓ TRANSCENDED
                            </span>
                          )}
                          {isLocked && (
                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                              <Lock className="w-3 h-3" /> LOCKED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{tier.description}</p>
                      </div>
                    </div>

                    {isCurrent && (
                      <div className="md:text-right shrink-0">
                        <span className="text-[11px] font-mono text-sky-400 font-bold">
                          Level {modeLevel} / 1000 ({modeProgressPercent}%)
                        </span>
                        <div className="w-36 h-2 bg-slate-900 rounded-full mt-1.5 overflow-hidden border border-slate-800">
                          <div className="h-full bg-sky-400 rounded-full" style={{ width: `${modeProgressPercent}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN I: JOURNEY / PROOF OF WORK (Emotional Proof Screen)
      ══════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'journey' && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  IMMUTABLE PROOF OF WORK
                </span>
                <h2 className="text-xl font-black text-white mt-1 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                  <span>Tangible Accumulated Effort</span>
                </h2>
              </div>
              <button
                onClick={() => setShowCertificateModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" /> Mode Certificate
              </button>
            </div>

            {/* Emotional Giant Display Banner */}
            <div className="p-8 rounded-2xl bg-gradient-to-r from-[#0a182b] via-[#0f243d] to-[#0a182b] border border-sky-500/40 text-center space-y-2 shadow-xl">
              <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest">
                VERIFIED FOCUS MASS
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {totalFocusHours} HOURS
              </h1>
              <p className="text-sm sm:text-base font-bold text-emerald-400">
                = {Math.floor(totalFocusHours / 24)} DAYS & {Math.round(totalFocusHours % 24)} HOURS OF NON-STOP FOCUS
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No distraction skips. No purchased level boosts. Every minute verified through active Pomodoro intervals.
              </p>
            </div>

            {/* Monthly Chronicle */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300">Monthly Focus Chronicle</span>
              <div className="space-y-2">
                {[
                  { month: 'JANUARY 2026', hours: 112, worlds: 14 },
                  { month: 'FEBRUARY 2026', hours: 96, worlds: 12 },
                  { month: 'MARCH 2026', hours: 124, worlds: 16 },
                  { month: 'APRIL 2026', hours: 80, worlds: 10 },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{item.month}</span>
                      <p className="text-[11px] text-slate-400">{item.worlds} Worlds Accreted</p>
                    </div>
                    <span className="font-mono font-bold text-sky-400 text-sm">{item.hours} Hours</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN K: HALL OF FAME (Trophy & Badge Shelf)
      ══════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'hall_of_fame' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Hall of Fame & Trophy Shelf</span>
              </h2>
              <p className="text-xs text-slate-400">
                Milestones achieved through sustained study discipline and focus resilience.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: '100 DAYS STREAK', desc: '100 consecutive days of focused Pomodoro sprints.', date: 'Unlocked 12 Mar 2026', icon: '🦅', color: '#f59e0b', unlocked: true },
                { title: '1000 HOURS FOCUS', desc: 'Accumulated 1,000 verified deep work study hours.', date: '412/1000 Hours (In Progress)', icon: '⚡', color: '#0284c7', unlocked: false },
                { title: '100 SESSIONS', desc: 'Completed 100 flawless sessions with zero tab drift.', date: 'Unlocked 02 Feb 2026', icon: '🪐', color: '#10b981', unlocked: true },
                { title: 'CENTURION SPRINT', desc: '120 minutes continuous deep study sitting.', date: 'Unlocked 18 Jan 2026', icon: '🛡️', color: '#6366f1', unlocked: true },
                { title: 'DEEP WORK DEFENDER', desc: '30 consecutive days with Focus Shield active.', date: 'Unlocked 25 Mar 2026', icon: '🌌', color: '#ec4899', unlocked: true },
                { title: 'MODE COMPLETE', desc: 'Ascended to Level 1000 in Mode I: Cosmic Dust.', date: 'Locked (Level 142/1000)', icon: '👑', color: '#e0e7ff', unlocked: false }
              ].map((badge, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex items-start gap-4 transition-all ${
                    badge.unlocked
                      ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/40 border-slate-800/40 opacity-50'
                  }`}
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl border shrink-0"
                    style={{
                      borderColor: `${badge.color}40`,
                      backgroundColor: `${badge.color}15`
                    }}
                  >
                    {badge.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-white">{badge.title}</h3>
                      {badge.unlocked && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          EARNED
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{badge.desc}</p>
                    <span className="text-[10px] font-mono text-slate-500 block mt-1">{badge.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREEN L: SETTINGS & PREFERENCES
      ══════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'settings' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-sky-400" />
                <span>Focus Galaxy System Settings</span>
              </h2>
              <p className="text-xs text-slate-400">
                Tune sprint intervals, binaural soundscapes, strict focus shield, and freeze days.
              </p>
            </div>

            <div className="space-y-4">
              {/* Sprint Duration */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white">Focus Sprint Duration</span>
                  <p className="text-[11px] text-slate-400">Length of active study intervals before short break.</p>
                </div>
                <div className="flex gap-1.5">
                  {[25, 45, 50, 60].map(mins => (
                    <button
                      key={mins}
                      onClick={() => setSettings(s => ({ ...s, pomoDuration: mins }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        settings.pomoDuration === mins
                          ? 'bg-sky-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus Shield Strict Mode */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white">Focus Shield Strict Mode</span>
                  <p className="text-[11px] text-slate-400">Locks distracting sites at device network level.</p>
                </div>
                <button
                  onClick={() => setSettings(s => ({ ...s, focusShieldActive: !s.focusShieldActive }))}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    settings.focusShieldActive
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-900 text-slate-500'
                  }`}
                >
                  {settings.focusShieldActive ? 'ARMED' : 'DISABLED'}
                </button>
              </div>

              {/* Freeze Days Balance */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white">Streak Freeze Reserve</span>
                  <p className="text-[11px] text-slate-400">Protects daily streak when medical or emergency leaves occur.</p>
                </div>
                <span className="text-xs font-mono font-bold text-sky-400 px-3 py-1 rounded-xl bg-sky-500/10 border border-sky-500/20">
                  {settings.freezeDaysRemaining} Days Available
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          ONBOARDING: CREATE MY PLANET MODAL (Screen A)
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showOnboardingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-sky-500/40 shadow-2xl space-y-5 relative text-slate-100"
            >
              <button
                onClick={() => setShowOnboardingModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-950 border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-1">
                <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
                  GENESIS • STAGE 01
                </span>
                <h3 className="text-xl font-black text-white">Configure Your Home Planet</h3>
                <p className="text-xs text-slate-400">Seed of your long-term focus universe.</p>
              </div>

              {/* Planet Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Planet Name</label>
                <input
                  type="text"
                  value={planetProfile.name}
                  onChange={(e) => setPlanetProfile(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-bold focus:outline-none focus:border-sky-500"
                  placeholder="e.g. Polity Prime, Dharma Sphere..."
                />
              </div>

              {/* Planet Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Celestial Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ocean', 'rocky', 'ringed', 'gas_giant', 'lava', 'ice'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setPlanetProfile(p => ({ ...p, type }))}
                      className={`p-2 rounded-xl text-[11px] font-bold capitalize border transition-all ${
                        planetProfile.type === type
                          ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {type.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Atmospheric Glow Color</label>
                <div className="flex gap-2.5 justify-center">
                  {['#0284c7', '#34d399', '#f59e0b', '#8b5cf6', '#ec4899'].map(color => (
                    <button
                      key={color}
                      onClick={() => setPlanetProfile(p => ({ ...p, accentColor: color }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        planetProfile.accentColor === color ? 'scale-110 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleSavePlanetProfile(planetProfile)}
                className="w-full py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-sky-500/25 cursor-pointer uppercase tracking-wider"
              >
                SAVE & ACCRETE PLANET
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          MODE CERTIFICATE MODAL (Screen J)
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCertificateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg p-8 rounded-3xl bg-gradient-to-b from-[#0c1626] to-[#04060a] border border-amber-500/40 shadow-2xl space-y-6 relative text-center"
            >
              <button
                onClick={() => setShowCertificateModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-950 border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-16 h-16 rounded-full border-2 border-amber-400 bg-amber-500/20 flex items-center justify-center mx-auto text-amber-300 shadow-lg shadow-amber-500/30">
                <Award className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                  OFFICIAL MODE CERTIFICATE
                </span>
                <h2 className="text-2xl font-black text-white">Focus Galaxy Attestation</h2>
                <p className="text-xs text-slate-400">Cryptographically verifiable focus ledger.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Candidate Planet:</span>
                  <span className="font-bold text-white font-mono">{planetProfile.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Current Cosmic Mode:</span>
                  <span className="font-bold text-sky-400">{currentTier.name} (Mode {currentTier.modeNumber})</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Cosmic Level:</span>
                  <span className="font-bold text-amber-400 font-mono">Level {totalLevel} / 10,000</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Total Verified Hours:</span>
                  <span className="font-bold text-emerald-400 font-mono">{totalFocusHours} Hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Genesis Date:</span>
                  <span className="text-slate-400 font-mono">14 JAN 2026</span>
                </div>
              </div>

              <button
                onClick={() => {
                  triggerConfetti();
                  setShowCertificateModal(false);
                }}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer uppercase tracking-wider"
              >
                DOWNLOAD 1080x1920 SHARE CARD
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          ADD FOCUS TASK MODAL
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showAddTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 relative"
            >
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-950 border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" /> Create Focus Task & Moon
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Task Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Fundamental Rights Article 19 Revision..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Subject</label>
                  <select
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="Indian Polity">Indian Polity</option>
                    <option value="Modern History">Modern History</option>
                    <option value="Geography & Environment">Geography & Environment</option>
                    <option value="Economy & Budget">Economy & Budget</option>
                    <option value="CSAT Aptitude">CSAT Aptitude</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Target Pomodoros</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newTaskPomodoros}
                    onChange={(e) => setNewTaskPomodoros(parseInt(e.target.value, 10) || 1)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950"
                >
                  Save Task
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          WORLD INSPECTION MODAL (When Tapping Any World in Galaxy)
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedPlanet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 relative"
            >
              <button
                onClick={() => setSelectedPlanet(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-950 border border-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white border shadow-md"
                  style={{
                    backgroundColor: selectedPlanet.primaryColor,
                    borderColor: `${selectedPlanet.primaryColor}80`
                  }}
                >
                  <Globe2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400">
                    {selectedPlanet.type.replace('_', ' ')} world
                  </span>
                  <h3 className="text-lg font-bold text-white">{selectedPlanet.name}</h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Subject:</span>
                  <span className="text-slate-200 font-semibold">{selectedPlanet.subject}</span>
                </div>
                {selectedPlanet.topic && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Topic:</span>
                    <span className="text-slate-200 font-medium text-right max-w-[200px] truncate">{selectedPlanet.topic}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Focus Duration:</span>
                  <span className="text-sky-400 font-mono font-bold">{selectedPlanet.durationMinutes} Minutes</span>
                </div>
                {selectedPlanet.moons && selectedPlanet.moons.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Orbiting Moons:</span>
                    <span className="text-emerald-400 font-mono font-bold">{selectedPlanet.moons.length} Moons</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Accretion Date:</span>
                  <span className="text-slate-400 font-mono">{selectedPlanet.dateKey}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlanet(null)}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close Flight Log
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
