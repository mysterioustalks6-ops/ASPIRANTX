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
  Zap
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
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none w-full pr-10">
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
            <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-[var(--sr-surface)] to-transparent" />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[var(--sr-primary)] bg-[var(--sr-primary-subtle)] px-2.5 py-0.5 rounded-full border border-[var(--sr-primary)]/30 whitespace-nowrap inline-block">
                  SECTION 1 • UNIT {currentUnit?.unitNum || 1}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-[var(--sr-text)] tracking-tight line-clamp-2 leading-snug">
                {currentUnit?.subject || subjects[0] || 'Core Exam Concepts'}
              </h2>
              <p className="text-xs text-[var(--sr-text-muted)] line-clamp-2 mt-1 font-medium leading-normal break-words">
                Preamble, Formulas & High-Yield MCQs
              </p>
            </div>

            <div className="flex justify-start sm:justify-end shrink-0">
              <button
                onClick={() => onNavigate && onNavigate('syllabus')}
                className="px-3 py-1.5 rounded-2xl bg-[var(--sr-surface-2)] hover:bg-[var(--sr-surface-3)] border border-[var(--sr-line)] text-xs font-black text-[var(--sr-primary)] flex items-center gap-1.5 shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                title="View Complete Curriculum Syllabus"
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--sr-primary)]" />
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

      {/* ── 3. S-CURVE WINDING LEARNING PATH WITH CONNECTED NODES ─────── */}
      <div className="w-full relative flex flex-col items-center py-6">
        {/* Continuous Winding Path SVG Line (z-0 behind nodes) */}
        <svg 
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 opacity-40"
          style={{ minHeight: `${visibleNodes.length * 120}px` }}
        >
          {visibleNodes.map((_, i) => {
            if (i === visibleNodes.length - 1) return null;
            const startX = 200 + getNodeHorizontalOffset(i);
            const startY = 50 + i * 115;
            const endX = 200 + getNodeHorizontalOffset(i + 1);
            const endY = 50 + (i + 1) * 115;
            const midY = (startY + endY) / 2;

            return (
              <path
                key={`path-line-${i}`}
                d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
                fill="none"
                stroke="var(--sr-line-strong)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="14 10"
              />
            );
          })}
        </svg>

        {visibleNodes.map((node, index) => {
          const xOffset = getNodeHorizontalOffset(index);
          const isCompleted = node.status === 'completed';
          const isActive = node.status === 'active';
          const isLocked = node.status === 'locked';
          const isPopoverOpen = selectedActiveNode?.id === node.id;

          return (
            <div
              key={node.id}
              style={{ 
                transform: `translateX(${xOffset}px)`,
                marginTop: index === 0 ? '16px' : '36px'
              }}
              className="relative flex flex-col items-center transition-transform duration-300 z-10"
            >

              {/* ── DUOLINGO FLOATING POPOVER CARD FOR ACTIVE LESSON ── */}
              {isPopoverOpen && (
                <div className="absolute -top-28 z-30 flex flex-col items-center animate-bounce-short">
                  <div className="bg-[#1CB0F6] text-white px-4 py-3 rounded-2xl shadow-2xl border-b-4 border-[#1899D6] min-w-[210px] text-center">
                    <div className="text-[10px] font-black uppercase tracking-wider text-sky-100">
                      Lesson {node.nodeNumber || 1} of {currentUnit?.total || visibleNodes.length}
                    </div>
                    <div className="text-xs font-black line-clamp-2 max-w-[190px] mt-0.5 leading-snug">
                      {node.title}
                    </div>
                    <button
                      onClick={() => handleStartDrill(node)}
                      className="mt-2.5 w-full py-2 bg-[#58CC02] hover:bg-[#5FDB02] text-[#0B2300] font-black text-xs rounded-xl border-b-3 border-[#46A302] active:border-b-0 active:translate-y-0.5 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>START</span>
                      <span className="bg-[#46A302]/30 px-1.5 py-0.5 rounded text-[10px] font-black">+10 XP</span>
                    </button>
                  </div>
                  {/* Speech triangle pointing down */}
                  <div className="w-3 h-3 bg-[#1CB0F6] rotate-45 -mt-1.5 border-r-2 border-b-2 border-[#1899D6]" />
                </div>
              )}

              {/* ── 3D TACTILE STEPPING STONE BUTTONS ── */}

              {/* 1. LESSON NODE */}
              {node.type === 'lesson' && (
                <button
                  onClick={() => handleNodeClick(node)}
                  className={`
                    w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-150 relative cursor-pointer select-none
                    ${
                      isCompleted
                        ? 'bg-[#58CC02] hover:bg-[#5FDB02] text-[#0B2300] border-b-[6px] border-[#46A302] active:border-b-0 active:translate-y-1.5 shadow-[0_6px_20px_rgba(88,204,2,0.4)]'
                        : isActive
                        ? 'bg-[#1CB0F6] hover:bg-[#28BCFF] text-[#00263D] border-b-[6px] border-[#1899D6] active:border-b-0 active:translate-y-1.5 ring-4 ring-[#1CB0F6]/40 ring-offset-4 ring-offset-[#0F1115] animate-pulse shadow-[0_6px_24px_rgba(28,176,246,0.5)]'
                        : 'bg-[#2A2F3A] text-[#6B7280] border-b-[6px] border-[#1E232D] cursor-not-allowed opacity-75'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-8 h-8 stroke-[3.5]" />
                  ) : isActive ? (
                    <Play className="w-8 h-8 fill-current translate-x-0.5" />
                  ) : (
                    <Lock className="w-7 h-7" />
                  )}

                  {/* Stars Pill for Completed Lessons */}
                  {isCompleted && (
                    <div className="absolute -bottom-3 flex items-center gap-0.5 bg-[var(--sr-surface-2)] px-2 py-0.5 rounded-full border border-[var(--sr-line-strong)] shadow-md">
                      {[1, 2, 3].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= node.stars
                              ? 'text-[#FFC800] fill-[#FFC800]'
                              : 'text-[var(--sr-text-subtle)]'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )}

              {/* 2. MYSTERY CHEST NODE */}
              {node.type === 'chest' && (
                <button
                  onClick={() => handleNodeClick(node)}
                  className={`
                    w-18 h-18 rounded-2xl flex items-center justify-center transition-all duration-150 relative cursor-pointer select-none
                    ${
                      isCompleted
                        ? 'bg-[#FF9600] text-[#2E1400] border-b-[6px] border-[#D87D00] shadow-[0_6px_20px_rgba(255,150,0,0.4)] active:border-b-0 active:translate-y-1.5'
                        : 'bg-[#2A2F3A] text-[#6B7280] border-b-[6px] border-[#1E232D] cursor-not-allowed opacity-70'
                    }
                  `}
                >
                  <Gift className="w-8 h-8 fill-current animate-bounce-short" />
                </button>
              )}

              {/* 3. CHECKPOINT CASTLE NODE */}
              {node.type === 'checkpoint' && (
                <button
                  onClick={() => handleNodeClick(node)}
                  className={`
                    w-24 h-22 rounded-3xl flex flex-col items-center justify-center transition-all duration-150 relative cursor-pointer select-none
                    ${
                      isActive || isCompleted
                        ? 'bg-gradient-to-b from-[#A855F7] to-[#7E22CE] text-white border-b-[6px] border-[#6B21A8] shadow-[0_6px_24px_rgba(168,85,247,0.5)] active:border-b-0 active:translate-y-1.5'
                        : 'bg-[#2A2F3A] text-[#6B7280] border-b-[6px] border-[#1E232D] cursor-not-allowed opacity-75'
                    }
                  `}
                >
                  <Crown className="w-9 h-9 fill-current" />
                  <span className="text-xs font-black uppercase mt-1 tracking-tight">Checkpoint</span>
                </button>
              )}

              {/* Node Title & Subject Label */}
              <div className="mt-3 text-center max-w-[160px]">
                <p className="text-xs font-black text-[var(--sr-text)] line-clamp-2 leading-snug">
                  {node.title}
                </p>
                <p className="text-xs font-bold text-[var(--sr-text-muted)] truncate">
                  {node.subject}
                </p>
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

      {/* ── 5. CHEST REWARD CELEBRATION MODAL ────────────────────────── */}
      {chestModalNode && (
        <div className="fixed inset-0 z-50 bg-black/80 no-backdrop-blur flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[var(--sr-surface)] border-2 border-[var(--sr-amber)] rounded-3xl p-6 text-center space-y-5 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-[var(--sr-amber-subtle)] border border-[var(--sr-amber)] flex items-center justify-center mx-auto text-[var(--sr-amber)]">
              <Gift className="w-10 h-10 fill-current animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-[var(--sr-text)]">Treasure Unlocked!</h3>
              <p className="text-xs text-[var(--sr-text-muted)]">
                Shabaash! You completed 3 lessons and unlocked this mystery chest!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)] flex items-center justify-around">
              <div>
                <div className="text-xs text-[var(--sr-text-muted)] font-bold uppercase">Coins</div>
                <div className="text-base font-black text-[var(--sr-amber)]">+50 Coins</div>
              </div>
              <div className="h-6 w-px bg-[var(--sr-line)]" />
              <div>
                <div className="text-xs text-[var(--sr-text-muted)] font-bold uppercase">XP Boost</div>
                <div className="text-base font-black text-[var(--sr-primary)]">+100 XP</div>
              </div>
            </div>

            <button
              onClick={() => setChestModalNode(null)}
              className="w-full py-3.5 rounded-2xl bg-[var(--sr-primary)] text-[var(--sr-on-primary)] font-black text-sm border-b-4 border-[var(--sr-primary-depth)] active:border-b-0 active:translate-y-1 cursor-pointer"
            >
              CLAIM REWARDS
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
