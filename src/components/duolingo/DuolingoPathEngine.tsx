import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  Lock, 
  Check, 
  Play, 
  Sparkles, 
  Flame, 
  Heart, 
  Coins, 
  ChevronDown,
  Gift,
  Trophy,
  Crown,
  BookOpen,
  X,
  Zap,
  Bike,
  Wrench,
  Shield,
  Navigation
} from 'lucide-react';
import { soundFx } from '../../lib/soundEffects';
import { AspirantMascot, MascotState } from './AspirantMascot';
import { DuolingoDrillModal, DrillQuestion } from './DuolingoDrillModal';
import { getCandidateHearts, HeartState } from '../../lib/duolingoHearts';
import { UserProfile } from '../../types';
import { getExamConfig, normalizeExamId } from '../../lib/examRegistry';
import { getDefaultExamDate, getExamDaysLeft } from '../../lib/packetSyncService';
import { ExamSelectModal } from '../ExamSelectModal';
import { triggerConfetti } from '../../lib/animations';
import { getLocalCompletedSubtopicIds, saveCompletedSubtopicIds } from '../../lib/syllabusStorage';

export interface PathNode {
  id: string;
  title: string;
  subject: string;
  type: 'lesson' | 'chest' | 'checkpoint';
  status: 'completed' | 'active' | 'locked';
  stars: number; // 0 to 3
  nodeNumber?: number;
  questions?: DrillQuestion[];
}

interface DuolingoPathEngineProps {
  userProfile: UserProfile;
  selectedExam: string;
  onExamChange?: (exam: string) => void;
  onNavigate?: (tab: any) => void;
  className?: string;
}

export const DuolingoPathEngine: React.FC<DuolingoPathEngineProps> = ({
  userProfile,
  selectedExam,
  onExamChange,
  onNavigate,
  className = '',
}) => {
  const normExam = normalizeExamId(selectedExam || userProfile.exam || 'SSC_JE_CIVIL');
  const examCfg = getExamConfig(normExam);
  const subjects = examCfg.subjects?.length > 0 ? examCfg.subjects : ['General Intelligence & Reasoning', 'General Awareness', 'Core Engineering & Concepts'];

  const [activeDrillNode, setActiveDrillNode] = useState<PathNode | null>(null);
  const [chestModalNode, setChestModalNode] = useState<PathNode | null>(null);
  const [selectedActiveNode, setSelectedActiveNode] = useState<PathNode | null>(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [showHeartModal, setShowHeartModal] = useState(false);
  const [heartsData, setHeartsData] = useState<HeartState>(() => getCandidateHearts(userProfile.id));

  // Veer speech prompts
  const VEER_TIPS = [
    "Ready to master this concept? Tap Start! 🚀",
    "Tu banega Officer! Bas 3 questions aur laga de! ⚔️",
    "Roz ka 1 drill = Exam hall me 0 panic! 🎯",
    "Streak banaye rakh! Rank 1 mindset chalu hai! 🔥",
    "High five! Let's conquer this topic together! 🍀"
  ];
  const [tipIndex, setTipIndex] = useState(0);

  // Multi-unit subject chapters matching Territory
  const chaptersBySubject: { subject: string; chapters: string[] }[] = useMemo(() => {
    return subjects.slice(0, 3).map((subj) => {
      const treeNode = examCfg.syllabusTree?.[subj];
      let topicList: string[] = [];
      if (treeNode && Array.isArray(treeNode.topics) && treeNode.topics.length > 0) {
        topicList = treeNode.topics;
      } else {
        topicList = [
          `${subj} Fundamental Overview`,
          'Standard Laws & Principles',
          'High-Yield Problem Solving',
          'Applied Real-World Cases',
          'Unit Assessment & PYQs'
        ];
      }
      return {
        subject: subj,
        chapters: topicList
      };
    });
  }, [subjects, examCfg]);

  const [selectedUnitIdx, setSelectedUnitIdx] = useState<number>(0);

  // Generate learning nodes structured along an authentic S-curve
  const generatePathNodes = (): PathNode[] => {
    const nodes: PathNode[] = [];
    const normExam = normalizeExamId(selectedExam);
    const completedIds = getLocalCompletedSubtopicIds(userProfile?.id, normExam);
    let globalIndex = 0;
    let lessonCounter = 1;
    let foundFirstActive = false;

    chaptersBySubject.forEach((sec, sIdx) => {
      sec.chapters.forEach((ch) => {
        const nodeId = `node-${sIdx}-${globalIndex}`;
        const isDone = completedIds.has(nodeId) || completedIds.has(ch);
        let status: 'completed' | 'active' | 'locked' = 'locked';
        let stars = 0;
        if (isDone) {
          status = 'completed';
          stars = 3;
        } else if (!foundFirstActive) {
          status = 'active';
          stars = 0;
          foundFirstActive = true;
        }

        nodes.push({
          id: nodeId,
          title: ch,
          subject: sec.subject,
          type: 'lesson',
          status,
          stars,
          nodeNumber: lessonCounter++,
          questions: [
            {
              id: `q-${globalIndex}-1`,
              question: `Which fundamental principle is central to ${ch} in ${examCfg.displayName}?`,
              options: [
                'Constitutional statutory mandate',
                'Empirical field calibration standards',
                'Universal equilibrium conditions',
                'Iterative comparative benchmark analysis'
              ],
              correctAnswer: 1,
              explanation: 'Field calibration and benchmark axioms are standard across official AE/JE and national curricula.',
              topic: ch
            },
            {
              id: `q-${globalIndex}-2`,
              question: `What is the standard tolerance or benchmark limit specified in the official syllabus for ${ch}?`,
              options: ['±0.05% margin', 'Standard Grade 1 Tolerance', 'Optimal limit as per IS/ISO code', 'Zero variance'],
              correctAnswer: 2,
              explanation: 'IS/ISO national codes define the benchmark limits tested in competitive examinations.',
              topic: ch
            },
            {
              id: `q-${globalIndex}-3`,
              question: `In high-speed competitive examinations, how is computational efficiency maximized for ${ch}?`,
              options: ['Dimensional analysis', 'Direct formula deduction', 'Substitution of standard boundary conditions', 'Elimination of negative constraints'],
              correctAnswer: 2,
              explanation: 'Substituting boundary conditions eliminates multiple false options in under 30 seconds.',
              topic: ch
            },
            {
              id: `q-${globalIndex}-4`,
              question: `Which previous exam year had the most prominent recurrence of questions from ${ch}?`,
              options: ['2023 Shift 1', '2024 Shift 2', '2022 Tier 1', 'Repeated across all 5-year cycles'],
              correctAnswer: 3,
              explanation: 'Consistent multi-year analysis reveals questions from this topic appear in almost every shift.',
              topic: ch
            }
          ]
        });
        globalIndex++;

        // Add mystery chest after every 3 lessons
        if (globalIndex % 3 === 0) {
          nodes.push({
            id: `chest-${globalIndex}`,
            title: 'Mystery Treasure Chest',
            subject: sec.subject,
            type: 'chest',
            status: globalIndex <= 3 ? 'completed' : 'locked',
            stars: 0,
          });
        }
      });

      // Add Checkpoint Castle after each subject
      nodes.push({
        id: `checkpoint-${sIdx}`,
        title: `${sec.subject} Unit Exam`,
        subject: sec.subject,
        type: 'checkpoint',
        status: sIdx === 0 ? 'active' : 'locked',
        stars: sIdx === 0 ? 1 : 0,
        questions: [
          {
            id: `chk-${sIdx}-1`,
            question: `Comprehensive Evaluation: What is the primary operational metric for ${sec.subject}?`,
            options: ['Maximum stress resistance', 'Optimal throughput', 'System reliability index', 'All of the above'],
            correctAnswer: 3,
            explanation: 'Comprehensive evaluations verify all three primary metrics simultaneously.',
            topic: sec.subject
          }
        ]
      });
    });

    return nodes;
  };

  const [pathNodes, setPathNodes] = useState<PathNode[]>(generatePathNodes);

  // Keep path nodes synchronized whenever syllabus changes
  useEffect(() => {
    const handleSync = () => {
      setPathNodes(generatePathNodes());
    };
    window.addEventListener('aspirantx_personal_syllabus_updated', handleSync);
    return () => window.removeEventListener('aspirantx_personal_syllabus_updated', handleSync);
  }, [selectedExam, userProfile.id]);

  // S-Curve horizontal offset generator (Duolingo snake path)
  // [0, 48, 72, 48, 0, -48, -72, -48]
  const getNodeHorizontalOffset = (index: number): number => {
    const pattern = [0, 48, 70, 48, 0, -48, -70, -48];
    return pattern[index % pattern.length];
  };

  const handleNodeClick = (node: PathNode) => {
    soundFx.playTap();
    if (node.status === 'locked') {
      soundFx.playWrong();
      return;
    }

    if (node.type === 'chest') {
      soundFx.playChestOpen();
      triggerConfetti();
      setChestModalNode(node);
      return;
    }

    // Toggle Duolingo Popover for Active Node
    if (node.status === 'active') {
      if (selectedActiveNode?.id === node.id) {
        // Double tap or launch
        setActiveDrillNode(node);
        setSelectedActiveNode(null);
      } else {
        setSelectedActiveNode(node);
        setTipIndex((prev) => (prev + 1) % VEER_TIPS.length);
      }
      return;
    }

    // Completed node can be reviewed
    setActiveDrillNode(node);
  };

  const handleStartDrill = (node: PathNode) => {
    soundFx.playTap();
    setSelectedActiveNode(null);
    setActiveDrillNode(node);
  };

  const handleLessonComplete = (nodeId: string) => {
    const normExam = normalizeExamId(selectedExam);
    const completedIds = getLocalCompletedSubtopicIds(userProfile?.id, normExam);
    const updated = new Set(completedIds);
    updated.add(nodeId);
    const targetNode = pathNodes.find(n => n.id === nodeId);
    if (targetNode) updated.add(targetNode.title);
    saveCompletedSubtopicIds(updated, userProfile?.id, normExam);
    window.dispatchEvent(new CustomEvent('aspirantx_personal_syllabus_updated'));

    setPathNodes((prev) => {
      let unlockedNext = false;
      return prev.map((n, idx) => {
        if (n.id === nodeId) {
          return { ...n, status: 'completed', stars: 3 };
        }
        const currIdx = prev.findIndex((item) => item.id === nodeId);
        if (!unlockedNext && idx === currIdx + 1 && n.status === 'locked') {
          unlockedNext = true;
          return { ...n, status: 'active' };
        }
        return n;
      });
    });
  };

  const unitSummaries = useMemo(() => {
    return chaptersBySubject.map((sec, uIdx) => {
      const secNodes = pathNodes.filter(n => n.subject === sec.subject && n.type === 'lesson');
      const done = secNodes.filter(n => n.status === 'completed').length;
      const total = secNodes.length;
      return {
        unitIndex: uIdx,
        unitNum: uIdx + 1,
        subject: sec.subject,
        done,
        total,
        percent: total > 0 ? Math.round((done / total) * 100) : 0
      };
    });
  }, [chaptersBySubject, pathNodes]);

  const currentUnit = unitSummaries[selectedUnitIdx] || unitSummaries[0];
  const visibleNodes = pathNodes.filter(n => n.subject === currentUnit?.subject);

  return (
    <div className={`w-full max-w-md mx-auto flex flex-col items-center select-none font-sans relative pb-28 ${className}`}>
      {/* ── 1. DUOLINGO UNIT BANNER ───────────────────────────────────── */}
      <div className="w-full px-4 mt-4 mb-2">
        <div className="rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] p-4 shadow-sm relative overflow-hidden">
          {/* Unit Switcher Tabs with edge fade */}
          <div className="relative w-full mb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none w-full pr-12">
              {unitSummaries.map((u) => (
                <button
                  key={u.unitIndex}
                  onClick={() => setSelectedUnitIdx(u.unitIndex)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-black border transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1 ${
                    selectedUnitIdx === u.unitIndex
                      ? 'bg-[var(--sr-primary)] text-[var(--sr-on-primary)] border-[var(--sr-primary)] shadow-sm'
                      : 'bg-[var(--sr-surface-2)] text-[var(--sr-text-muted)] border-[var(--sr-line)] hover:text-[var(--sr-text)]'
                  }`}
                >
                  <span>Unit {u.unitNum}:</span>
                  <span>{u.done}/{u.total} Done</span>
                </button>
              ))}
              <span className="text-[10px] font-bold text-[var(--sr-primary)] bg-[var(--sr-primary-subtle)] px-2.5 py-1 rounded-xl border border-[var(--sr-primary)]/30 shrink-0 whitespace-nowrap">
                {getExamDaysLeft(selectedExam)} days left
              </span>
            </div>
            {/* Edge fade scroll indicator */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-1.5 w-10 bg-gradient-to-l from-[var(--sr-surface)] to-transparent" />
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1 w-full">
              <div className="flex items-center justify-between sm:justify-start gap-2 mb-1.5">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[var(--sr-primary)] bg-[var(--sr-primary-subtle)] px-2.5 py-0.5 rounded-full border border-[var(--sr-primary)]/30 whitespace-nowrap inline-block">
                  SECTION 1 • UNIT {currentUnit?.unitNum || 1}
                </span>
                <div className="sm:hidden">
                  <button
                    onClick={() => onNavigate && onNavigate('syllabus')}
                    className="px-2.5 py-1 rounded-xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-surface-3)] border border-[var(--sr-line)] text-[11px] font-black text-[var(--sr-primary)] flex items-center gap-1 shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                    title="View Complete Curriculum Syllabus"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[var(--sr-primary)]" />
                    <span>Guidebook</span>
                  </button>
                </div>
              </div>
              <h2 className="text-sm sm:text-base font-black text-[var(--sr-text)] tracking-tight line-clamp-2 leading-snug">
                {currentUnit?.subject || subjects[0] || 'Core Exam Concepts'}
              </h2>
              <p className="text-xs text-[var(--sr-text-muted)] line-clamp-2 mt-1 font-medium leading-normal break-words">
                Preamble, Formulas & High-Yield MCQs
              </p>
            </div>

            <div className="hidden sm:flex justify-end shrink-0">
              <button
                onClick={() => onNavigate && onNavigate('syllabus')}
                className="px-3 py-1.5 rounded-2xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-surface-3)] border border-[var(--sr-line)] text-xs font-black text-[var(--sr-primary)] flex items-center gap-1.5 shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                title="View Complete Curriculum Syllabus"
              >
                <BookOpen className="w-4 h-4 text-[var(--sr-primary)]" />
                <span className="text-xs">Guidebook</span>
              </button>
            </div>
          </div>

          {/* Unit Progress Indicator */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 bg-[var(--sr-surface-2)] h-2.5 rounded-full overflow-hidden border border-[var(--sr-line)]">
              <div
                className="bg-[var(--sr-primary)] h-full rounded-full transition-all duration-500"
                style={{ width: `${currentUnit?.percent || 0}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[var(--sr-primary)] whitespace-nowrap shrink-0">
              {currentUnit?.done || 0}/{currentUnit?.total || 0} Done ({currentUnit?.percent || 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. VEER FIXED IN-BOUNDS CHEERLEADER LANE (NEVER OVERLAPS A NODE OR THE BANNER) ── */}
      <div className="w-full px-4 mt-2 mb-1 flex items-center justify-center">
        <div className="w-full max-w-sm bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] rounded-2xl p-3 shadow-sm flex items-center gap-3 relative overflow-hidden">
          <AspirantMascot
            state="celebrating"
            size="sm"
            onClick={() => {
              soundFx.playChestOpen();
              triggerConfetti();
              setTipIndex((prev) => (prev + 1) % VEER_TIPS.length);
            }}
            className="cursor-pointer active:scale-95 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-[var(--sr-primary)] flex items-center gap-1 mb-0.5">
              <span>VEER'S RIDE TIP</span>
              <span className="text-[9px] text-[var(--sr-text-muted)] font-bold">(Tap to refresh)</span>
            </div>
            <p className="text-xs font-bold text-[var(--sr-text)] leading-snug break-words">
              {VEER_TIPS[tipIndex]}
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. CALM HIGHWAY CORRIDOR WITH MILESTONE STONES & ACTIVE BIKE MARKER ─────── */}
      <div className="w-full relative flex flex-col items-center py-6">
        {/* Asphalt Highway Road Corridor Background */}
        <div 
          className="absolute top-0 bottom-0 w-[270px] sm:w-[320px] bg-slate-900/90 border-x-4 border-amber-500/30 shadow-2xl rounded-3xl overflow-hidden pointer-events-none z-0"
          style={{ minHeight: `${visibleNodes.length * 130}px` }}
        >
          {/* Subtle Road Asphalt Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:12px_12px] opacity-40" />
          {/* Highway Dividing Center Lane (Dashed Yellow/White Line) */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 border-r-2 border-dashed border-amber-400/60" />
          {/* Roadside Shoulder White Ribbons */}
          <div className="absolute inset-y-0 left-3 w-0.5 bg-white/20" />
          <div className="absolute inset-y-0 right-3 w-0.5 bg-white/20" />
        </div>

        {visibleNodes.map((node, index) => {
          const xOffset = getNodeHorizontalOffset(index);
          const isCompleted = node.status === 'completed';
          const isActive = node.status === 'active';
          const isLocked = node.status === 'locked';
          const isPopoverOpen = selectedActiveNode?.id === node.id;
          const kmDistance = index * 12 + 10;

          return (
            <div
              key={node.id}
              style={{ 
                transform: `translateX(${xOffset}px)`,
                marginTop: index === 0 ? '16px' : '36px'
              }}
              className="relative flex flex-col items-center transition-transform duration-300 z-10"
            >

              {/* ── HIGHWAY OVERHEAD ROUTE SIGNBOARD POPOVER ── */}
              {isPopoverOpen && (
                <div className="absolute -top-32 z-30 flex flex-col items-center animate-bounce-short">
                  <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border-2 border-emerald-400/90 min-w-[220px] text-center">
                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center justify-center gap-1">
                      <Navigation className="w-3 h-3" />
                      <span>Highway Milestone • KM {kmDistance}</span>
                    </div>
                    <div className="text-xs font-black line-clamp-2 max-w-[200px] mt-1 leading-snug text-slate-100">
                      {node.title}
                    </div>
                    <button
                      onClick={() => handleStartDrill(node)}
                      className="mt-2.5 w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>ENGAGE GEAR & RIDE</span>
                      <span className="bg-slate-950/20 px-1.5 py-0.5 rounded text-[10px] font-black">+10 XP</span>
                    </button>
                  </div>
                  {/* Road arrow pointing down */}
                  <div className="w-3 h-3 bg-slate-900 rotate-45 -mt-1.5 border-r-2 border-b-2 border-emerald-400/90" />
                </div>
              )}

              {/* ── 1. LESSON NODE: AUTHENTIC HIGHWAY MILESTONE STONE ── */}
              {node.type === 'lesson' && (
                <div className="relative flex flex-col items-center group">
                  {/* Active Bike Marker moving on the highway! */}
                  {isActive && (
                    <div className="absolute -top-11 z-20 flex items-center gap-1.5 animate-bounce-short">
                      <div className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                        <Bike className="w-3.5 h-3.5" />
                        <span>Rider Here</span>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    </div>
                  )}

                  {/* Milestone Stone: curved dome top + rectangular base */}
                  <button
                    onClick={() => handleNodeClick(node)}
                    className={`
                      w-20 h-24 rounded-t-3xl rounded-b-xl flex flex-col overflow-hidden transition-all duration-200 relative cursor-pointer select-none border-2 shadow-xl
                      ${
                        isCompleted
                          ? 'bg-slate-900 border-emerald-500/80 shadow-[0_4px_16px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95'
                          : isActive
                          ? 'bg-slate-900 border-amber-400 ring-4 ring-amber-400/30 ring-offset-2 ring-offset-slate-950 shadow-[0_6px_24px_rgba(251,191,36,0.4)] hover:scale-105 active:scale-95'
                          : 'bg-slate-950/90 border-slate-800 text-slate-600 cursor-not-allowed opacity-75'
                      }
                    `}
                  >
                    {/* Milestone Top Curved Dome (Highway Yellow Tag) */}
                    <div className={`w-full py-1.5 text-center text-[10px] font-black tracking-wider uppercase ${
                      isCompleted ? 'bg-emerald-500 text-slate-950' : isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      KM {kmDistance}
                    </div>

                    {/* Milestone Body */}
                    <div className="flex-1 flex flex-col items-center justify-center p-1 bg-slate-900 text-center">
                      {isCompleted ? (
                        <div className="flex flex-col items-center">
                          <Check className="w-5 h-5 text-emerald-400 stroke-[3]" />
                          <span className="text-[9px] font-extrabold text-emerald-300 uppercase mt-0.5">Cleared</span>
                        </div>
                      ) : isActive ? (
                        <div className="flex flex-col items-center">
                          <Play className="w-5 h-5 text-amber-400 fill-current translate-x-0.5 animate-pulse" />
                          <span className="text-[9px] font-black text-amber-300 uppercase mt-0.5">Start</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Lock className="w-4 h-4 text-slate-600" />
                          <span className="text-[9px] font-bold text-slate-600 uppercase mt-0.5">Locked</span>
                        </div>
                      )}
                    </div>

                    {/* Stars Pill at Bottom */}
                    {isCompleted && (
                      <div className="w-full py-0.5 bg-slate-950 flex items-center justify-center gap-0.5">
                        {[1, 2, 3].map((star) => (
                          <Star key={star} className={`w-2.5 h-2.5 ${star <= node.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
                        ))}
                      </div>
                    )}
                  </button>
                </div>
              )}

              {/* ── 2. PITSTOP SERVICE BAY (REPLACING DUOLINGO CHEST) ── */}
              {node.type === 'chest' && (
                <button
                  onClick={() => handleNodeClick(node)}
                  className={`
                    w-24 h-20 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 relative cursor-pointer select-none border-2 shadow-xl
                    ${
                      isCompleted
                        ? 'bg-slate-900 border-amber-500 text-amber-400 shadow-[0_4px_20px_rgba(245,158,11,0.3)] active:scale-95'
                        : 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed opacity-70'
                    }
                  `}
                >
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center mb-1 text-amber-400">
                    <Wrench className="w-4 h-4 animate-bounce-short" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">Pitstop Bay</span>
                  <span className="text-[8px] text-slate-400">Bike Tuning</span>
                </button>
              )}

              {/* ── 3. HIGHWAY TOLL PLAZA CHECKPOINT (REPLACING CASTLE) ── */}
              {node.type === 'checkpoint' && (
                <button
                  onClick={() => handleNodeClick(node)}
                  className={`
                    w-32 h-20 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 relative cursor-pointer select-none border-2 shadow-2xl
                    ${
                      isActive || isCompleted
                        ? 'bg-gradient-to-r from-blue-900/80 via-indigo-900/90 to-blue-900/80 border-cyan-400 text-cyan-300 shadow-[0_6px_28px_rgba(6,182,212,0.4)] active:scale-95'
                        : 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed opacity-75'
                    }
                  `}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px] font-black tracking-widest uppercase text-white">Toll Plaza</span>
                  </div>
                  <span className="text-[9px] font-bold text-cyan-200 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                    Unit Gateway
                  </span>
                </button>
              )}

              {/* Node Title Signboard */}
              <div className="mt-2 text-center max-w-[170px]">
                <div className="inline-block px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 shadow-md">
                  <p className="text-xs font-black text-slate-200 line-clamp-2 leading-snug">
                    {node.title}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-400 truncate mt-0.5">
                    {node.subject}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 4. DUOLINGO INTERACTIVE DRILL MODAL ───────────────────────── */}
      {activeDrillNode && (
        <DuolingoDrillModal
          isOpen={!!activeDrillNode}
          onClose={() => setActiveDrillNode(null)}
          title={activeDrillNode.title}
          topicName={activeDrillNode.title}
          questions={activeDrillNode.questions || []}
          userId={userProfile.id}
          onCompleteLesson={() => {
            handleLessonComplete(activeDrillNode.id);
            setActiveDrillNode(null);
          }}
        />
      )}

      {/* ── 5. HIGHWAY PITSTOP GEAR REWARD CELEBRATION MODAL ────────────────────────── */}
      {chestModalNode && (
        <div className="fixed inset-0 z-50 bg-black/80 no-backdrop-blur flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 text-center space-y-5 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center mx-auto text-amber-400">
              <Wrench className="w-10 h-10 fill-current animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">Pitstop Service Bay!</h3>
              <p className="text-xs text-slate-300">
                Shabaash! You conquered 3 milestones. Bike tuning parts, highway fuel, and bonus Ride XP claimed!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-around">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Coins</div>
                <div className="text-base font-black text-amber-400">+50 Coins</div>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Ride XP</div>
                <div className="text-base font-black text-emerald-400">+100 XP</div>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Tuning</div>
                <div className="text-base font-black text-cyan-400">+1 Kit</div>
              </div>
            </div>

            <button
              onClick={() => setChestModalNode(null)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              CLAIM PITSTOP GEAR & CONTINUE
            </button>
          </div>
        </div>
      )}

      {/* ── 6. HEARTS REFILL / ENERGY INFO SHEET ─────────────────────── */}
      {showHeartModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#1A1D24] border-2 border-[#FF4B4B] rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#FF4B4B]/20 border border-[#FF4B4B] flex items-center justify-center mx-auto text-[#FF4B4B]">
              <Heart className="w-8 h-8 fill-current animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Candidate Energy</h3>
              <p className="text-xs text-[#9CA3AF]">
                Hearts keep your focus sharp during drills. You have <b className="text-white">{heartsData.hearts} of 5 Hearts</b> remaining.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-[#0F1115] border border-[#2A2F3A] text-left text-xs text-[#9CA3AF] space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[#58CC02] font-black">✓</span>
                <span>Refills automatically (+1 heart every 3 hours)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#1CB0F6] font-black">✓</span>
                <span>Solve practice questions to refill instantly</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowHeartModal(false);
                  if (onNavigate) onNavigate('practice_hub');
                }}
                className="w-full py-3 rounded-xl bg-[#58CC02] text-[#0B2300] font-black text-xs border-b-3 border-[#46A302] active:border-b-0 active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>PRACTICE TO REFILL HEARTS</span>
              </button>
              <button
                onClick={() => setShowHeartModal(false)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-[#9CA3AF] hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. EXAM SELECT MODAL ─────────────────────────────────────── */}
      {isExamModalOpen && (
        <ExamSelectModal
          isOpen={isExamModalOpen}
          onClose={() => setIsExamModalOpen(false)}
          selectedExam={normExam}
          onExamChange={(newEx) => {
            if (onExamChange) onExamChange(newEx);
            setIsExamModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
