import React, { useState, useEffect } from 'react';
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
import { ExamSelectModal } from '../ExamSelectModal';
import { triggerConfetti } from '../../lib/animations';

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

  // Generate learning nodes structured along an authentic S-curve
  const generatePathNodes = (): PathNode[] => {
    const nodes: PathNode[] = [];
    const chaptersBySubject: { subject: string; chapters: string[] }[] = [
      {
        subject: subjects[0] || 'Core Subject 1',
        chapters: [
          'Foundational Principles & Core Concepts',
          'Axioms, Theorems & Formula Rules',
          'High-Yield Applications & Rapid Shortcuts',
          'Previous Years High-Frequency Questions'
        ]
      },
      {
        subject: subjects[1] || subjects[0] || 'Core Subject 2',
        chapters: [
          'Standard Formulas & Boundary Conditions',
          'Applied Real-world Case Analysis',
          'High-Speed Calculation Sprint'
        ]
      },
      {
        subject: subjects[2] || subjects[0] || 'Core Subject 3',
        chapters: [
          'Advanced Multi-Concept Integration',
          'Comprehensive Unit Mastery Assessment'
        ]
      }
    ];

    let globalIndex = 0;
    let lessonCounter = 1;

    chaptersBySubject.forEach((sec, sIdx) => {
      sec.chapters.forEach((ch) => {
        let status: 'completed' | 'active' | 'locked' = 'locked';
        let stars = 0;
        if (globalIndex === 0) {
          status = 'completed';
          stars = 3;
        } else if (globalIndex === 1) {
          status = 'completed';
          stars = 2;
        } else if (globalIndex === 2) {
          status = 'active';
          stars = 0;
        }

        nodes.push({
          id: `node-${globalIndex}`,
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
    setPathNodes((prev) =>
      prev.map((n, idx) => {
        if (n.id === nodeId) {
          return { ...n, status: 'completed', stars: 3 };
        }
        // Unlock next node
        const currIdx = prev.findIndex((item) => item.id === nodeId);
        if (idx === currIdx + 1 && n.status === 'locked') {
          return { ...n, status: 'active' };
        }
        return n;
      })
    );
  };

  return (
    <div className={`w-full max-w-md mx-auto flex flex-col items-center select-none font-sans relative pb-28 ${className}`}>
      {/* ── 1. DUOLINGO TOP STICKY HUD (EXAM FLAG + STREAK + GEMS + HEARTS) ── */}
      <div className="w-full sticky top-0 z-30 bg-[#0F1115]/95 backdrop-blur-xl border-b border-[#2A2F3A] py-2 px-3 shadow-lg">
        <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
          {/* Target Exam Button Pill with Flag */}
          <button
            onClick={() => setIsExamModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#1A1D24] hover:bg-[#252B37] border border-[#2A2F3A] text-xs font-black text-white shadow-sm transition-all active:scale-95 cursor-pointer"
            title="Switch Target Examination"
          >
            <span className="text-sm">🎯</span>
            <span className="truncate max-w-[110px] text-xs font-black text-[#1CB0F6]">
              {examCfg.displayName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
          </button>

          {/* Right: Gamification Telemetry */}
          <div className="flex items-center gap-2">
            {/* Streak */}
            <div 
              onClick={() => { soundFx.playChestOpen(); triggerConfetti(); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0F1115] border border-[#FF9600]/40 text-[#FF9600] font-black text-xs cursor-pointer active:scale-95 shadow-sm"
              title="Daily Study Streak"
            >
              <Flame className="w-4 h-4 fill-[#FF9600] animate-pulse" />
              <span>{userProfile.streakDays || 1}</span>
            </div>

            {/* Gems / Coins */}
            <div 
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0F1115] border border-[#FFC800]/40 text-[#FFC800] font-black text-xs shadow-sm"
              title="Coins Balance"
            >
              <Coins className="w-4 h-4 fill-[#FFC800]" />
              <span>{userProfile.coins || 150}</span>
            </div>

            {/* Hearts Energy */}
            <div 
              onClick={() => setShowHeartModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0F1115] border border-[#FF4B4B]/40 text-[#FF4B4B] font-black text-xs cursor-pointer active:scale-95 shadow-sm"
              title="Energy Hearts"
            >
              <Heart className="w-4 h-4 fill-[#FF4B4B] animate-pulse" />
              <span>{heartsData.hearts}/5</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. DUOLINGO UNIT BANNER ───────────────────────────────────── */}
      <div className="w-full px-4 mt-4 mb-2">
        <div className="rounded-3xl bg-gradient-to-r from-[#17301B] via-[#1A1D24] to-[#17301B] border-2 border-[#58CC02]/40 p-4 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#58CC02] bg-[#58CC02]/20 px-2.5 py-0.5 rounded-full border border-[#58CC02]/30">
                  SECTION 1 • UNIT 1
                </span>
              </div>
              <h2 className="text-base font-black text-white tracking-tight">
                {subjects[0] || 'Core Exam Concepts'}
              </h2>
              <p className="text-xs text-[#9CA3AF] line-clamp-1 mt-0.5 font-medium">
                Preamble, Formulas & High-Yield MCQs
              </p>
            </div>

            <button
              onClick={() => onNavigate && onNavigate('syllabus')}
              className="px-3 py-2 rounded-2xl bg-[#0F1115] hover:bg-[#1A1D24] border border-[#2A2F3A] text-xs font-black text-[#58CC02] flex items-center gap-1.5 shrink-0 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="View Complete Curriculum Syllabus"
            >
              <BookOpen className="w-4 h-4 text-[#58CC02]" />
              <span className="text-[11px]">Guidebook</span>
            </button>
          </div>

          {/* Unit Progress Indicator */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 bg-[#0F1115] h-2.5 rounded-full overflow-hidden border border-[#2A2F3A]/60">
              <div className="bg-[#58CC02] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(88,204,2,0.6)]" style={{ width: '45%' }} />
            </div>
            <span className="text-[10px] font-black text-[#58CC02]">2/5 Complete</span>
          </div>
        </div>
      </div>

      {/* ── 3. S-CURVE WINDING LEARNING PATH WITH CONNECTED NODES ─────── */}
      <div className="w-full relative flex flex-col items-center py-6">
        {/* Continuous Winding Path SVG Line */}
        <svg 
          className="absolute top-0 left-0 w-full h-full pointer-events-none -z-0 opacity-40"
          style={{ minHeight: `${pathNodes.length * 120}px` }}
        >
          {pathNodes.map((_, i) => {
            if (i === pathNodes.length - 1) return null;
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
                stroke="#374151"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray="14 10"
              />
            );
          })}
        </svg>

        {pathNodes.map((node, index) => {
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
                marginTop: index === 0 ? '0px' : '36px'
              }}
              className="relative flex flex-col items-center transition-transform duration-300 z-10"
            >
              {/* ── VEER MASCOT STANDING BESIDE ACTIVE NODE ── */}
              {isActive && (
                <div 
                  className={`absolute -top-6 ${xOffset >= 0 ? '-left-28' : '-right-28'} z-20 flex flex-col items-center pointer-events-auto`}
                >
                  <AspirantMascot
                    state="celebrating"
                    size="sm"
                    speechBubble={VEER_TIPS[tipIndex]}
                    onClick={() => {
                      soundFx.playChestOpen();
                      triggerConfetti();
                      setTipIndex((prev) => (prev + 1) % VEER_TIPS.length);
                    }}
                    className="cursor-pointer active:scale-95"
                  />
                </div>
              )}

              {/* ── DUOLINGO FLOATING POPOVER CARD FOR ACTIVE LESSON ── */}
              {isPopoverOpen && (
                <div className="absolute -top-28 z-30 flex flex-col items-center animate-bounce-short">
                  <div className="bg-[#1CB0F6] text-white px-4 py-3 rounded-2xl shadow-2xl border-b-4 border-[#1899D6] min-w-[210px] text-center">
                    <div className="text-[10px] font-black uppercase tracking-wider text-sky-100">
                      Lesson {node.nodeNumber || 1} of 6
                    </div>
                    <div className="text-xs font-black truncate max-w-[190px] mt-0.5">
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
                    <div className="absolute -bottom-3 flex items-center gap-0.5 bg-[#0F1115] px-2 py-0.5 rounded-full border border-[#2A2F3A] shadow-md">
                      {[1, 2, 3].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= node.stars
                              ? 'text-[#FFC800] fill-[#FFC800]'
                              : 'text-[#4B5563]'
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
                  <span className="text-[10px] font-black uppercase mt-1 tracking-tight">Checkpoint</span>
                </button>
              )}

              {/* Node Title & Subject Label */}
              <div className="mt-3 text-center max-w-[160px]">
                <p className="text-xs font-black text-[#F3F4F6] line-clamp-1 leading-snug">
                  {node.title}
                </p>
                <p className="text-[10px] font-bold text-[#9CA3AF] truncate">
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#1A1D24] border-2 border-[#FF9600] rounded-3xl p-6 text-center space-y-5 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-[#FF9600]/20 border border-[#FF9600] flex items-center justify-center mx-auto text-[#FF9600]">
              <Gift className="w-10 h-10 fill-current animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">Treasure Unlocked!</h3>
              <p className="text-xs text-[#9CA3AF]">
                Shabaash! You completed 3 lessons and unlocked this mystery chest!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0F1115] border border-[#2A2F3A] flex items-center justify-around">
              <div>
                <div className="text-[10px] text-[#9CA3AF] font-bold uppercase">Coins</div>
                <div className="text-base font-black text-[#FFC800]">+50 Coins</div>
              </div>
              <div className="h-6 w-px bg-[#2A2F3A]" />
              <div>
                <div className="text-[10px] text-[#9CA3AF] font-bold uppercase">XP Boost</div>
                <div className="text-base font-black text-[#58CC02]">+100 XP</div>
              </div>
            </div>

            <button
              onClick={() => setChestModalNode(null)}
              className="w-full py-3.5 rounded-2xl bg-[#58CC02] text-[#0B2300] font-black text-sm border-b-4 border-[#46A302] active:border-b-0 active:translate-y-1 cursor-pointer"
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
