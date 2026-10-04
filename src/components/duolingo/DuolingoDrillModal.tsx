import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Heart, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  Award,
  Zap
} from 'lucide-react';
import { soundFx } from '../../lib/soundEffects';
import { AspirantMascot, MascotState } from './AspirantMascot';
import { getCandidateHearts, deductHeart } from '../../lib/duolingoHearts';
import { awardXPAndCoins } from '../../lib/gamification';
import { triggerConfetti } from '../../lib/animations';

export interface DrillQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string | number; // option index or text
  explanation?: string;
  topic?: string;
}

interface DuolingoDrillModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  topicName: string;
  questions: DrillQuestion[];
  userId: string;
  onCompleteLesson?: (score: number, total: number) => void;
}

export const DuolingoDrillModal: React.FC<DuolingoDrillModalProps> = ({
  isOpen,
  onClose,
  title,
  topicName,
  questions,
  userId,
  onCompleteLesson,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [evaluationState, setEvaluationState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [hearts, setHearts] = useState(() => getCandidateHearts(userId).hearts);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [speech, setSpeech] = useState<string>('Ready? Pick the best answer!');

  // Sync hearts from storage
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setSelectedOption(null);
      setEvaluationState('idle');
      setScore(0);
      setIsCompleted(false);
      setHearts(getCandidateHearts(userId).hearts);
      setMascotState('idle');
      setSpeech("Let's master this concept together!");
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const currentQ = questions[currentIndex] || {
    id: 'q-fallback',
    question: 'Sample Question',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 0,
    explanation: 'Explanation',
  };

  const totalQuestions = questions.length || 1;
  const progressPercent = Math.min(100, Math.round(((currentIndex) / totalQuestions) * 100));

  // Determine correct answer index
  const getCorrectOptionIndex = (): number => {
    if (typeof currentQ.correctAnswer === 'number') {
      return currentQ.correctAnswer;
    }
    const idx = currentQ.options.findIndex(
      (opt) => opt.trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase()
    );
    return idx >= 0 ? idx : 0;
  };

  const correctIndex = getCorrectOptionIndex();

  const handleSelectOption = (index: number) => {
    if (evaluationState !== 'idle') return;
    soundFx.playTap();
    setSelectedOption(index);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null || evaluationState !== 'idle') return;

    if (selectedOption === correctIndex) {
      // CORRECT!
      soundFx.playCorrect();
      setEvaluationState('correct');
      setScore((prev) => prev + 1);
      setMascotState('happy');
      const cheers = ['Shabash! Great job!', 'Spot on! Outstanding!', 'Exactly right!', 'Mastered! +10 XP'];
      setSpeech(cheers[Math.floor(Math.random() * cheers.length)]);
    } else {
      // WRONG!
      soundFx.playWrong();
      setEvaluationState('wrong');
      const remainingHearts = deductHeart(userId);
      setHearts(remainingHearts);
      setMascotState('thinking');
      setSpeech("Don't worry! Review the concept and try again.");
    }
  };

  const handleContinue = () => {
    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setEvaluationState('idle');
      setMascotState('idle');
      setSpeech('Next question! You got this.');
    } else {
      // Completed lesson
      soundFx.playVictory();
      triggerConfetti();
      setIsCompleted(true);
      setMascotState('celebrating');
      setSpeech('Lesson Completed! You gained +50 XP!');
      
      // Award XP
      const earnedXP = 50 + score * 10;
      awardXPAndCoins(earnedXP, 15, `Completed drill: ${topicName}`, userId);

      if (onCompleteLesson) {
        onCompleteLesson(score + (evaluationState === 'correct' ? 1 : 0), totalQuestions);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F1115] flex flex-col font-sans select-none overflow-hidden">
      {/* ── TOP DUOLINGO HUD ────────────────────────────────────────── */}
      <header className="h-16 px-4 border-b border-[#2A2F3A] bg-[#15181F] flex items-center justify-between gap-4 max-w-2xl w-full mx-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Exit Drill"
          className="p-2 text-[#9CA3AF] hover:text-[#F3F4F6] rounded-xl hover:bg-[#1A1D24] transition-all cursor-pointer"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Tactile Duolingo Progress Bar */}
        <div className="flex-1 h-4 bg-[#1A1D24] rounded-full overflow-hidden p-0.5 border border-[#2A2F3A] relative">
          <motion.div
            className="h-full bg-gradient-to-r from-[#58CC02] to-[#6FE505] rounded-full shadow-[0_0_12px_rgba(88,204,2,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>

        {/* Hearts Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF4B4B]/15 border border-[#FF4B4B]/30 text-[#FF4B4B] font-black text-sm">
          <Heart className="w-4 h-4 fill-current stroke-[2.2]" />
          <span>{hearts}</span>
        </div>
      </header>

      {/* ── MAIN DRILL AREA ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-4 py-6 max-w-xl w-full mx-auto flex flex-col justify-between">
        {!isCompleted ? (
          <div className="space-y-6">
            {/* Topic Badge & Mascot Encourager */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[#1CB0F6]/15 text-[#1CB0F6] border border-[#1CB0F6]/30 text-[11px] font-black uppercase tracking-wider">
                {topicName}
              </span>
              <span className="text-xs font-bold text-[#9CA3AF]">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
            </div>

            {/* Mascot with Speech Bubble */}
            <div className="py-2">
              <AspirantMascot
                state={mascotState}
                size="md"
                speechBubble={speech}
              />
            </div>

            {/* The Question Prompt */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#1A1D24] border-2 border-[#2A2F3A] shadow-md">
              <h2 className="text-base sm:text-lg font-black text-[#F3F4F6] leading-relaxed">
                {currentQ.question}
              </h2>
            </div>

            {/* Tactile 3D Option Buttons */}
            <div className="space-y-3">
              {currentQ.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                let optionStyle = 'bg-[#15181F] text-[#F3F4F6] border-b-4 border-[#2A2F3A] hover:bg-[#1A1D24]';

                if (isSelected) {
                  optionStyle = 'bg-[#1C2E1F] text-[#58CC02] border-2 border-[#58CC02] border-b-4 shadow-[0_0_15px_rgba(88,204,2,0.2)]';
                }

                if (evaluationState === 'correct' && isSelected) {
                  optionStyle = 'bg-[#1C2E1F] text-[#58CC02] border-2 border-[#58CC02] border-b-4';
                } else if (evaluationState === 'wrong' && isSelected) {
                  optionStyle = 'bg-[#2E1A1A] text-[#FF4B4B] border-2 border-[#FF4B4B] border-b-4';
                } else if (evaluationState === 'wrong' && idx === correctIndex) {
                  optionStyle = 'bg-[#1C2E1F] text-[#58CC02] border-2 border-[#58CC02] border-b-4';
                }

                return (
                  <button
                    key={idx}
                    disabled={evaluationState !== 'idle'}
                    onClick={() => handleSelectOption(idx)}
                    className={`
                      w-full p-4 rounded-2xl font-bold text-sm text-left transition-all duration-150
                      active:border-b-0 active:translate-y-1 select-none flex items-center justify-between gap-3 cursor-pointer
                      ${optionStyle}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-xl bg-[#0F1115] border border-[#2A2F3A] text-xs font-black flex items-center justify-center text-[#9CA3AF] shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-snug">{option}</span>
                    </div>

                    {evaluationState === 'correct' && isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-[#58CC02] shrink-0" />
                    )}
                    {evaluationState === 'wrong' && isSelected && (
                      <AlertCircle className="w-5 h-5 text-[#FF4B4B] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* ── LESSON COMPLETE CELEBRATION ──────────────────────────── */
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-8">
            <AspirantMascot state="celebrating" size="xl" speechBubble="You crushed it! Incredible work!" />
            
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-black text-[#58CC02] tracking-tight">
                Lesson Complete!
              </h1>
              <p className="text-sm text-[#9CA3AF]">
                You mastered <span className="text-[#F3F4F6] font-bold">{topicName}</span> with flying colors!
              </p>
            </div>

            {/* Score & Rewards Cards */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              <div className="p-4 rounded-2xl bg-[#1A1D24] border-2 border-[#58CC02]/40 text-center">
                <div className="text-[10px] font-black uppercase text-[#9CA3AF]">Accuracy</div>
                <div className="text-xl font-black text-[#58CC02] mt-0.5">
                  {Math.round((score / totalQuestions) * 100)}%
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#1A1D24] border-2 border-[#FF9600]/40 text-center">
                <div className="text-[10px] font-black uppercase text-[#9CA3AF]">XP Earned</div>
                <div className="text-xl font-black text-[#FF9600] mt-0.5">
                  +{50 + score * 10} XP
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full max-w-xs py-4 rounded-2xl bg-[#58CC02] hover:bg-[#5FDB02] text-[#0B2300] font-black text-base border-b-4 border-[#46A302] active:border-b-0 active:translate-y-1 shadow-lg cursor-pointer"
            >
              CONTINUE JOURNEY
            </button>
          </div>
        )}
      </main>

      {/* ── BOTTOM EVALUATION DRAWER ────────────────────────────────── */}
      {!isCompleted && (
        <footer
          className={`
            border-t p-4 transition-colors duration-200
            ${
              evaluationState === 'idle'
                ? 'bg-[#15181F] border-[#2A2F3A]'
                : evaluationState === 'correct'
                ? 'bg-[#1C2E1F] border-[#58CC02]/50'
                : 'bg-[#2E1A1A] border-[#FF4B4B]/50'
            }
          `}
        >
          <div className="max-w-xl mx-auto flex items-center justify-between gap-4">
            {/* Feedback Message */}
            {evaluationState === 'correct' && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#58CC02]/20 border border-[#58CC02] flex items-center justify-center text-[#58CC02]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-[#58CC02]">Awesome!</h4>
                  <p className="text-xs text-[#9CA3AF]">+10 XP Awarded</p>
                </div>
              </div>
            )}

            {evaluationState === 'wrong' && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FF4B4B]/20 border border-[#FF4B4B] flex items-center justify-center text-[#FF4B4B]">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-[#FF4B4B]">Correct answer:</h4>
                  <p className="text-xs text-[#F3F4F6] font-bold">
                    {currentQ.options[correctIndex]}
                  </p>
                </div>
              </div>
            )}

            {evaluationState === 'idle' && (
              <div className="text-xs text-[#9CA3AF] font-medium hidden sm:block">
                Select an option to evaluate
              </div>
            )}

            {/* Action Button: CHECK or CONTINUE */}
            {evaluationState === 'idle' ? (
              <button
                disabled={selectedOption === null}
                onClick={handleCheckAnswer}
                className={`
                  ml-auto px-8 py-3.5 rounded-2xl font-black text-sm tracking-wide transition-all
                  ${
                    selectedOption !== null
                      ? 'bg-[#58CC02] hover:bg-[#5FDB02] text-[#0B2300] border-b-4 border-[#46A302] active:border-b-0 active:translate-y-1 shadow-md cursor-pointer'
                      : 'bg-[#2A2F3A] text-[#9CA3AF] cursor-not-allowed opacity-50'
                  }
                `}
              >
                CHECK
              </button>
            ) : (
              <button
                onClick={handleContinue}
                className={`
                  ml-auto px-8 py-3.5 rounded-2xl font-black text-sm tracking-wide transition-all border-b-4 active:border-b-0 active:translate-y-1 shadow-md cursor-pointer
                  ${
                    evaluationState === 'correct'
                      ? 'bg-[#58CC02] hover:bg-[#5FDB02] text-[#0B2300] border-[#46A302]'
                      : 'bg-[#FF4B4B] hover:bg-[#FF6161] text-white border-[#EA2B2B]'
                  }
                `}
              >
                CONTINUE
              </button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
};
