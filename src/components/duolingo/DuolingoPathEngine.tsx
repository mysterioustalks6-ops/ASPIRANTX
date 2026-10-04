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
  ChevronRight,
  Gift,
  Trophy,
  Crown
} from 'lucide-react';
import { soundFx } from '../../lib/soundEffects';
import { AspirantMascot } from './AspirantMascot';
import { DuolingoDrillModal, DrillQuestion } from './DuolingoDrillModal';
import { getCandidateHearts, HeartState } from '../../lib/duolingoHearts';
import { UserProfile } from '../../types';
import { getExamConfig, normalizeExamId } from '../../lib/examRegistry';

export interface PathNode {
  id: string;
  title: string;
  subject: string;
  type: 'lesson' | 'chest' | 'checkpoint';
  status: 'completed' | 'active' | 'locked';
  stars: number; // 0 to 3
  questions?: DrillQuestion[];
}

interface DuolingoPathEngineProps {
  userProfile: UserProfile;
  selectedExam: string;
  onNavigate?: (tab: any) => void;
  className?: string;
}

export const DuolingoPathEngine: React.FC<DuolingoPathEngineProps> = ({
  userProfile,
  selectedExam,
  onNavigate,
  className = '',
}) => {
  const normExam = normalizeExamId(selectedExam || userProfile.exam || 'SSC_JE_CIVIL');
  const examCfg = getExamConfig(normExam);
  const subjects = examCfg.subjects?.length > 0 ? examCfg.subjects : ['General Intelligence & Reasoning', 'General Awareness', 'Core Engineering & Concepts'];

  const [activeDrillNode, setActiveDrillNode] = useState<PathNode | null>(null);
  const [chestModalNode, setChestModalNode] = useState<PathNode | null>(null);
  const [heartsData, setHeartsData] = useState<HeartState>(() => getCandidateHearts(userProfile.id));

  // Generate learning nodes structured along an authentic S-curve
  const generatePathNodes = (): PathNode[] => {
    const nodes: PathNode[] = [];
    const chaptersBySubject: { subject: string; chapters: string[] }[] = [
      {
        subject: subjects[0] || 'Core Subject 1',
        chapters: ['Preamble & Fundamental Concepts', 'Core Principles & Analysis', 'High-Yield Applications', 'Previous Years High-Frequency Drill']
      },
      {
        subject: subjects[1] || subjects[0] || 'Core Subject 2',
        chapters: ['Standard Axioms & Formulas', 'Applied Case Studies', 'Speed Optimization Drill']
      },
      {
        subject: subjects[2] || subjects[0] || 'Core Subject 3',
        chapters: ['Advanced Problem Solving', 'Full Unit Comprehensive Review']
      }
    ];

    let globalIndex = 0;
    chaptersBySubject.forEach((sec, sIdx) => {
      sec.chapters.forEach((ch, cIdx) => {
        // First 2 completed, 3rd active, rest locked
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
          questions: [
            {
              id: `q-${globalIndex}-1`,
              question: `Which primary principle governs ${ch} in ${examCfg.displayName}?`,
              options: [
                'Constitutional statutory mandate',
                'Empirical field calibration standards',
                'Universal balance equations',
                'Iterative comparative benchmark analysis'
              ],
              correctAnswer: 1,
              topic: ch
            },
            {
              id: `q-${globalIndex}-2`,
              question: `What is the standard tolerance or benchmark limit specified in the official exam syllabus for ${ch}?`,
              options: ['±0.05% margin', 'Standard Grade 1 Tolerance', 'Optimal limit as per IS/ISO code', 'Zero variance'],
              correctAnswer: 2,
              topic: ch
            },
            {
              id: `q-${globalIndex}-3`,
              question: `In high-speed competitive examinations, how is computational efficiency maximized for ${ch}?`,
              options: ['Dimensional dimensional analysis', 'Direct formula deduction', 'Substitution of standard boundary conditions', 'Elimination of negative constraints'],
              correctAnswer: 2,
              topic: ch
            },
            {
              id: `q-${globalIndex}-4`,
              question: `Which previous exam year had the most prominent recurrence of questions from ${ch}?`,
              options: ['2023 Shift 1', '2024 Shift 2', '2022 Tier 1', 'All standard cycles'],
              correctAnswer: 3,
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
            topic: sec.subject
          }
        ]
      });
    });

    return nodes;
  };

  const [pathNodes, setPathNodes] = useState<PathNode[]>(generatePathNodes);

  // S-Curve horizontal offset generator (Duolingo snake path)
  const getNodeHorizontalOffset = (index: number): number => {
    // Generates a smooth wavy offset: 0, 48, 72, 48, 0, -48, -72, -48 ...
    const pattern = [0, 48, 72, 48, 0, -48, -72, -48];
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
      setChestModalNode(node);
      return;
    }

    // Open Drill Modal
    setActiveDrillNode(node);
  };

  const handleLessonComplete = (nodeId: string) => {
    setPathNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          return { ...n, status: 'completed', stars: 3 };
        }
        return n;
      })
    );
  };

  return (
    <div className={`w-full max-w-lg mx-auto flex flex-col items-center select-none font-sans ${className}`}>
      {/* ── TOP HUD (EXAM + HEARTS + STREAK + COINS) ────────────────── */}
      <div className="w-full sticky top-0 z-30 bg-[#0F1115]/95 backdrop-blur-xl border-b border-[#2A2F3A] py-2.5 px-4 mb-6 shadow-md">
        <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
          {/* Target Exam Tag */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#58CC02] animate-pulse" />
            <span className="text-xs font-black text-[#F3F4F6] truncate max-w-[130px]">
              {examCfg.displayName}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak */}
            <div className="flex items-center gap-1 text-[#FF9600] font-black text-xs">
              <Flame className="w-4 h-4 fill-current" />
              <span>{userProfile.streakDays || 1}</span>
            </div>

            {/* Coins */}
            <div className="flex items-center gap-1 text-[#FFC800] font-black text-xs">
              <Coins className="w-4 h-4 fill-current" />
              <span>{userProfile.coins || 120}</span>
            </div>

            {/* Hearts */}
            <div className="flex items-center gap-1 text-[#FF4B4B] font-black text-xs">
              <Heart className="w-4 h-4 fill-current" />
              <span>{heartsData.hearts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MASCOT ENCOURAGEMENT BANNER ──────────────────────────────── */}
      <div className="w-full px-4 mb-6">
        <div className="p-4 rounded-3xl bg-gradient-to-r from-[#16251B] to-[#1A1D24] border-2 border-[#58CC02]/30 flex items-center justify-between gap-3 shadow-lg">
          <AspirantMascot
            state="happy"
            size="md"
            speechBubble="Keep climbing! Daily practice turns aspirants into toppers."
          />
        </div>
      </div>

      {/* ── S-CURVE LEARNING PATH (Winding Stepping Stones) ──────────── */}
      <div className="w-full relative flex flex-col items-center py-4 space-y-6">
        {pathNodes.map((node, index) => {
          const xOffset = getNodeHorizontalOffset(index);
          const isCompleted = node.status === 'completed';
          const isActive = node.status === 'active';
          const isLocked = node.status === 'locked';

          return (
            <div
              key={node.id}
              style={{ transform: `translateX(${xOffset}px)` }}
              className="relative flex flex-col items-center transition-transform duration-300"
            >
              {/* Stepping Stone Node Button */}
              {node.type === 'lesson' && (
                <button
                  onClick={() => handleNodeClick(node)}
                  className={`
                    w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-150 relative cursor-pointer
                    ${
                      isCompleted
                        ? 'bg-[#58CC02] hover:bg-[#5FDB02] text-[#0B2300] border-b-6 border-[#46A302] active:border-b-0 active:translate-y-1.5 shadow-[0_4px_16px_rgba(88,204,2,0.3)]'
                        : isActive
                        ? 'bg-[#1CB0F6] hover:bg-[#28BCFF] text-[#00263D] border-b-6 border-[#1899D6] active:border-b-0 active:translate-y-1.5 ring-4 ring-[#1CB0F6]/30 animate-pulse shadow-[0_4px_20px_rgba(28,176,246,0.4)]'
                        : 'bg-[#2A2F3A] text-[#6B7280] border-b-6 border-[#1E232D] cursor-not-allowed opacity-75'
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
                    <div className="absolute -bottom-3 flex items-center gap-0.5 bg-[#0F1115] px-2 py-0.5 rounded-full border border-[#2A2F3A]">
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

              {/* Mystery Chest Node */}
              {node.type === 'chest' && (
                <button
                  onClick={() => handleNodeClick(node)}
                  className={`
                    w-18 h-18 rounded-2xl flex items-center justify-center transition-all duration-150 relative cursor-pointer
                    ${
                      isCompleted
                        ? 'bg-[#FF9600] text-[#2E1400] border-b-6 border-[#D87D00] shadow-[0_4px_16px_rgba(255,150,0,0.3)]'
                        : 'bg-[#2A2F3A] text-[#6B7280] border-b-6 border-[#1E232D] cursor-not-allowed opacity-70'
                    }
                  `}
                >
                  <Gift className="w-8 h-8 fill-current" />
                </button>
              )}

              {/* Checkpoint Castle Node */}
              {node.type === 'checkpoint' && (
                <button
                  onClick={() => handleNodeClick(node)}
                  className={`
                    w-24 h-22 rounded-3xl flex flex-col items-center justify-center transition-all duration-150 relative cursor-pointer
                    ${
                      isActive || isCompleted
                        ? 'bg-gradient-to-b from-[#A855F7] to-[#7E22CE] text-white border-b-6 border-[#6B21A8] shadow-[0_4px_20px_rgba(168,85,247,0.4)]'
                        : 'bg-[#2A2F3A] text-[#6B7280] border-b-6 border-[#1E232D] cursor-not-allowed opacity-75'
                    }
                  `}
                >
                  <Crown className="w-9 h-9 fill-current" />
                  <span className="text-[10px] font-black uppercase mt-1 tracking-tight">Checkpoint</span>
                </button>
              )}

              {/* Node Title Label */}
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

      {/* ── DUOLINGO DRILL MODAL ────────────────────────────────────── */}
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

      {/* ── CHEST UNLOCK MODAL ──────────────────────────────────────── */}
      {chestModalNode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#1A1D24] border-2 border-[#FF9600] rounded-3xl p-6 text-center space-y-5 shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-[#FF9600]/20 border border-[#FF9600] flex items-center justify-center mx-auto text-[#FF9600]">
              <Gift className="w-10 h-10 fill-current" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">Treasure Unlocked!</h3>
              <p className="text-xs text-[#9CA3AF]">
                You opened the milestone chest! Enjoy your candidate bonus rewards.
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
    </div>
  );
};
