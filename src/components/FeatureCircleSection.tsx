import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  BookMarked,
  HelpCircle,
  Award,
  Sparkles,
  Shield,
  Layers,
  Zap,
  MessageSquare,
  BarChart3,
  Trophy,
  Gift,
  CheckSquare,
  Mic,
  Users,
  Search,
  Flame,
  Coins,
  ChevronDown,
  Compass,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { ActiveTab, UserProfile } from '../types';
import { ExamSelectModal } from './ExamSelectModal';

export interface FeatureCircleItem {
  id: ActiveTab;
  label: string;
  shortName: string;
  icon: React.ElementType;
  gradient: string;
  glowColor: string;
  category: 'core' | 'practice' | 'ai' | 'analytics' | 'rewards';
  badge?: string;
}

export const FEATURE_CIRCLES: FeatureCircleItem[] = [
  {
    id: 'syllabus',
    label: 'Syllabus Tracker',
    shortName: 'Syllabus',
    icon: BookOpen,
    gradient: 'from-sky-500 to-blue-600',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    category: 'core',
    badge: 'Core'
  },
  {
    id: 'pyq',
    label: 'PYQ Archive (35+ Yrs)',
    shortName: 'PYQ 35Y',
    icon: BookMarked,
    gradient: 'from-indigo-500 to-purple-600',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    category: 'practice',
    badge: '1991-2026'
  },
  {
    id: 'cbt',
    label: 'CBT Mock Tests',
    shortName: 'CBT Mocks',
    icon: Award,
    gradient: 'from-amber-500 to-orange-600',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    category: 'practice',
    badge: 'Live'
  },
  {
    id: 'question_bank',
    label: 'Question Bank Engine',
    shortName: 'Questions',
    icon: HelpCircle,
    gradient: 'from-emerald-500 to-teal-600',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    category: 'practice',
    badge: '10K+'
  },
  {
    id: 'timer',
    label: '3D Focus Galaxy Pomodoro',
    shortName: 'Focus Galaxy',
    icon: Sparkles,
    gradient: 'from-purple-500 via-pink-500 to-indigo-600',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    category: 'core',
    badge: '3D'
  },
  {
    id: 'focus_shield',
    label: 'Focus Shield Distraction Blocker',
    shortName: 'Focus Shield',
    icon: Shield,
    gradient: 'from-rose-500 to-red-600',
    glowColor: 'rgba(244, 63, 94, 0.4)',
    category: 'core',
    badge: 'Shield'
  },
  {
    id: 'tasks',
    label: 'Study Planner & Timetable',
    shortName: 'Study Tasks',
    icon: CheckSquare,
    gradient: 'from-cyan-500 to-teal-600',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    category: 'core'
  },
  {
    id: 'library',
    label: 'Reference Library & Notes',
    shortName: 'Library',
    icon: Layers,
    gradient: 'from-blue-600 to-indigo-700',
    glowColor: 'rgba(37, 99, 235, 0.4)',
    category: 'practice'
  },
  {
    id: 'flashcards',
    label: 'Flashcards & Formula Recall',
    shortName: 'Flashcards',
    icon: Zap,
    gradient: 'from-yellow-400 to-amber-500',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    category: 'practice'
  },
  {
    id: 'chat',
    label: 'AI Mentor & Doubt Solver',
    shortName: 'AI Mentor',
    icon: MessageSquare,
    gradient: 'from-emerald-400 to-green-600',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    category: 'ai',
    badge: 'AI'
  },
  {
    id: 'weakness',
    label: 'Weakness Radar & Diagnostics',
    shortName: 'Weakness',
    icon: BarChart3,
    gradient: 'from-fuchsia-500 to-rose-600',
    glowColor: 'rgba(217, 70, 239, 0.4)',
    category: 'analytics'
  },
  {
    id: 'leaderboard',
    label: 'All-India Ranker Board',
    shortName: 'Rankings',
    icon: Trophy,
    gradient: 'from-amber-400 to-yellow-600',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    category: 'analytics'
  },
  {
    id: 'rewards',
    label: 'Rewards & Milestones Hub',
    shortName: 'Rewards',
    icon: Gift,
    gradient: 'from-orange-500 to-pink-600',
    glowColor: 'rgba(249, 115, 22, 0.4)',
    category: 'rewards'
  },
  {
    id: 'podcasts',
    label: 'Topper Audio Podcasts',
    shortName: 'Podcasts',
    icon: Mic,
    gradient: 'from-violet-500 to-purple-700',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    category: 'ai'
  },
  {
    id: 'community',
    label: 'Aspirants Community Feed',
    shortName: 'Community',
    icon: Users,
    gradient: 'from-teal-500 to-cyan-600',
    glowColor: 'rgba(20, 184, 166, 0.4)',
    category: 'ai'
  }
];

interface FeatureCircleSectionProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  selectedExam: string;
  onExamChange: (exam: string) => void;
  user: UserProfile | null;
  onOpenProfile: () => void;
  onOpenSearch: () => void;
}

export const FeatureCircleSection: React.FC<FeatureCircleSectionProps> = ({
  activeTab,
  onSelectTab,
  selectedExam,
  onExamChange,
  user,
  onOpenProfile,
  onOpenSearch
}) => {
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -260, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 260, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full bg-[#07090E]/95 border-b border-slate-800/80 backdrop-blur-2xl transition-all shadow-xl">
      {/* ── TOP UTILITY ROW (Minimalist Brand & Exam Pill) ── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2 group text-left cursor-pointer transition-transform active:scale-95"
            title="Return to Home Dashboard"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-[1.5px] shadow-md shadow-sky-500/20 group-hover:scale-105 transition-all">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Compass className="w-5 h-5 text-sky-400 group-hover:rotate-45 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-white group-hover:text-sky-400 transition-colors">
                  Aspirant<span className="text-sky-400">X</span>
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-300">
                  v2.7.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-none">
                National Exam Prep Suite
              </p>
            </div>
          </button>

          {/* Exam Selector Pill with Search Modal trigger */}
          <button
            onClick={() => setIsExamModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs font-bold text-sky-300 hover:border-sky-500/40 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Click to switch target examination"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="truncate max-w-[130px] sm:max-w-[200px]">{selectedExam || 'Select Exam'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Right Quick Controls: Flame Streak, Coins, Search & Profile */}
        <div className="flex items-center gap-2">
          {/* Daily Streak Flame */}
          <div 
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold shadow-sm"
            title={`${user?.streakDays || 1} Days Active Study Streak`}
          >
            <Flame className="w-3.5 h-3.5 fill-current animate-pulse text-amber-400" />
            <span className="font-mono">{user?.streakDays || 1}d</span>
          </div>

          {/* Coins Balance */}
          <div 
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold"
            title="StudyRide Coins"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono">{user?.coins || 0}</span>
          </div>

          {/* Search Action */}
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Search notes, questions & syllabus"
            aria-label="Global Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Profile Avatar */}
          <button
            onClick={onOpenProfile}
            className="p-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer relative"
            title="Open Student Profile"
            aria-label="Student Profile"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name || 'User'}
                className="w-7 h-7 rounded-lg object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* ── CIRCULAR FEATURE LAUNCHER TRAY (Horizontal Carousel with Circular Icons) ── */}
      <div className="relative max-w-7xl mx-auto px-2 sm:px-6 pt-1 pb-3">
        {/* Left Scroll Arrow (Desktop only) */}
        <button
          onClick={scrollLeft}
          className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white items-center justify-center shadow-lg transition-all active:scale-90 cursor-pointer"
          title="Scroll Left"
          aria-label="Previous Features"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Container with Circular Items */}
        <div
          ref={scrollContainerRef}
          className="flex items-start gap-3 sm:gap-5 overflow-x-auto scrollbar-none py-2 px-2 scroll-smooth select-none"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {FEATURE_CIRCLES.map((feature) => {
            const Icon = feature.icon;
            const isActive = activeTab === feature.id;

            return (
              <button
                key={feature.id}
                onClick={() => onSelectTab(feature.id)}
                className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer transition-all duration-200 focus:outline-none"
                style={{ width: '74px' }}
                title={feature.label}
              >
                {/* Circular Icon Container */}
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                      isActive
                        ? `bg-gradient-to-tr ${feature.gradient} shadow-[0_0_20px_${feature.glowColor}] ring-2 ring-white/90 scale-105`
                        : `bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 shadow-md group-hover:shadow-[0_0_12px_${feature.glowColor}]`
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 sm:w-7 sm:h-7 transition-all duration-200 ${
                        isActive
                          ? 'text-white stroke-[2.2]'
                          : 'text-slate-300 group-hover:text-white group-hover:scale-110'
                      }`}
                    />

                    {/* Small Badge / Tag */}
                    {feature.badge && (
                      <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-sky-500 text-slate-950 border border-sky-400 shadow-sm leading-tight">
                        {feature.badge}
                      </span>
                    )}
                  </motion.div>

                  {/* Active Indicator Dot */}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8] animate-pulse" />
                  )}
                </div>

                {/* Feature Name Under the Circle */}
                <span
                  className={`text-[11px] sm:text-xs font-bold text-center tracking-tight truncate w-full transition-colors leading-tight ${
                    isActive
                      ? 'text-sky-300 font-extrabold'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {feature.shortName}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Scroll Arrow (Desktop only) */}
        <button
          onClick={scrollRight}
          className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white items-center justify-center shadow-lg transition-all active:scale-90 cursor-pointer"
          title="Scroll Right"
          aria-label="Next Features"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Searchable Exam Select Modal */}
      <ExamSelectModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        selectedExam={selectedExam}
        onExamChange={onExamChange}
      />
    </section>
  );
};
