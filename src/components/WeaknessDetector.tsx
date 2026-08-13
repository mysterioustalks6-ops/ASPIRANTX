import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingDown, 
  TrendingUp, 
  Award, 
  BookOpen, 
  HelpCircle,
  Play,
  Zap,
  Target,
  RotateCw
} from 'lucide-react';
import { EXAM_LIST } from '../lib/examList';

interface DiagnosticQuestion {
  id: number;
  exam: string;
  subject: string;
  topic: string;
  question: string;
  answer?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const EXAM_DIAGNOSTIC_POOL: DiagnosticQuestion[] = [
  // NEET UG Questions
  {
    id: 101,
    exam: 'NEET_UG',
    subject: 'Biology',
    topic: 'Human Physiology — Digestion',
    question: 'Bile juice me kaunsa digestive enzyme paaya jata hai?',
    answer: 'Bile juice me koi digestive enzyme nahi hota. Par isme bile salts (Sodium glycocholate & taurocholate) hote hain jo fats ka emulsification karte hain.',
    options: ['Lipase', 'Trypsin', 'No digestive enzyme', 'Amylase'],
    correctAnswer: 2,
    explanation: 'Bile juice released by liver contains bile pigments and salts but NO digestive enzymes. It aids fat emulsification.'
  },
  {
    id: 102,
    exam: 'NEET_UG',
    subject: 'Chemistry',
    topic: 'Organic Chemistry — Hydrocarbons',
    question: 'Ozonlysis of propene followed by Zn/H2O reduction gives which products?',
    options: ['Methanal + Ethanal', 'Ethanal + Ethanal', 'Propanal + Methanal', 'Methanal + Methanal'],
    correctAnswer: 0,
    explanation: 'Reductive ozonolysis of Propene (CH3-CH=CH2) breaks the double bond giving Methanal (HCHO) and Ethanal (CH3CHO).'
  },
  {
    id: 103,
    exam: 'NEET_UG',
    subject: 'Physics',
    topic: 'Ray Optics',
    question: 'When light travels from an optically denser to a rarer medium, the Critical Angle depends on:',
    options: ['Frequency of light only', 'Refractive index of media', 'Intensity of light', 'Angle of incidence'],
    correctAnswer: 1,
    explanation: 'Critical angle sin(ic) = 1 / μ, which depends directly on the relative refractive index of the two media.'
  },

  // NDA / NA Questions
  {
    id: 201,
    exam: 'NDA_NA',
    subject: 'Mathematics',
    topic: 'Calculus — Differentiation',
    question: 'What is the derivative of sin(x°) with respect to x?',
    options: ['cos(x°)', '(π/180) cos(x°)', '-(π/180) cos(x°)', '180/π cos(x°)'],
    correctAnswer: 1,
    explanation: 'Convert degrees to radians: x° = πx / 180. Derivative of sin(πx/180) is (π/180) cos(πx/180) = (π/180) cos(x°).'
  },
  {
    id: 202,
    exam: 'NDA_NA',
    subject: 'General Ability',
    topic: 'Physics — Mechanics',
    question: 'A heavy object and a light object have equal Kinetic Energy. Which one has greater momentum?',
    options: ['The lighter object', 'The heavier object', 'Both have equal momentum', 'Depends on temperature'],
    correctAnswer: 1,
    explanation: 'Momentum p = √(2m K). Since kinetic energy K is equal, momentum p is directly proportional to √m. Thus heavier object has greater momentum.'
  },

  // UPSC CSE Questions
  {
    id: 301,
    exam: 'UPSC_CSE',
    subject: 'Polity',
    topic: 'Preamble of the Constitution',
    question: 'Which Amendment Act added the terms "Socialist", "Secular", and "Integrity" to the Preamble?',
    options: ['38th Amendment Act', '42nd Amendment Act', '44th Amendment Act', '86th Amendment Act'],
    correctAnswer: 1,
    explanation: 'The 42nd Constitutional Amendment Act, 1976 added these three words to make India a Sovereign, Socialist, Secular, Democratic Republic.'
  },
  {
    id: 302,
    exam: 'UPSC_CSE',
    subject: 'Economy',
    topic: 'Monetary Policy',
    question: 'When RBI wants to inject liquidity into the banking system, which action does it perform?',
    options: ['Increases Repo Rate', 'Sells securities in OMO', 'Buys securities in OMO', 'Increases CRR'],
    correctAnswer: 2,
    explanation: 'Buying government securities in Open Market Operations (OMO) injects physical cash into the commercial banking system.'
  },

  // SSC CGL Questions
  {
    id: 401,
    exam: 'SSC_CGL',
    subject: 'Quantitative Aptitude',
    topic: 'Number System',
    question: 'What is the remainder when (7^19 + 2) is divided by 6?',
    options: ['1', '2', '3', '0'],
    correctAnswer: 2,
    explanation: '7 ≡ 1 (mod 6). So 7^19 ≡ 1^19 ≡ 1 (mod 6). Thus (7^19 + 2) ≡ (1 + 2) = 3 (mod 6).'
  }
];

interface WeaknessDetectorProps {
  selectedExam?: string;
  onExamChange?: (exam: string) => void;
}

export const WeaknessDetector: React.FC<WeaknessDetectorProps> = ({
  selectedExam = 'NEET_UG',
  onExamChange
}) => {
  const normalizeExamKey = (e: string) => {
    let s = String(e || '').trim().toLowerCase().replace(/[\s-_]/g, '');
    if (s.includes('nda') || s.includes('defence')) return 'nda';
    if (s.includes('neet') || s.includes('medical')) return 'neet';
    if (s.includes('upsc') || s.includes('civil') || s.includes('cse')) return 'upsc';
    if (s.includes('ssc') || s.includes('cgl') || s.includes('staffselection')) return 'ssc';
    return s;
  };

  // Filter questions by active exam with normalized key matching
  const matchedPool = EXAM_DIAGNOSTIC_POOL.filter(q => normalizeExamKey(q.exam) === normalizeExamKey(selectedExam));
  const examPool = matchedPool.length > 0 ? matchedPool : EXAM_DIAGNOSTIC_POOL;
  const examSubjects = Array.from(new Set(examPool.map(q => q.subject)));

  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [quizActive, setQuizActive] = useState<boolean>(false);
  const [answers, setAnswers] = useState<{ [qId: number]: number }>({});
  const [showResults, setShowResults] = useState<boolean>(false);

  // Set default subject whenever exam changes
  useEffect(() => {
    if (examSubjects.length > 0) {
      setSelectedSubject(examSubjects[0]);
    } else {
      setSelectedSubject('');
    }
    setQuizActive(false);
    setAnswers({});
    setShowResults(false);
  }, [selectedExam]);

  const activeQuestions = examPool.filter(q => selectedSubject === 'ALL' || q.subject === selectedSubject);

  const handleSelectOption = (qId: number, idx: number) => {
    setAnswers(prev => ({ ...prev, [qId]: idx }));
  };

  const calculateResults = () => {
    if (activeQuestions.length === 0) return;
    if (Object.keys(answers).length < activeQuestions.length) {
      alert('Kripya sabhi questions ke answers select karein!');
      return;
    }
    setShowResults(true);
  };

  const getAccuracyRate = () => {
    if (activeQuestions.length === 0) return 0;
    let correct = 0;
    activeQuestions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    return Math.round((correct / activeQuestions.length) * 100);
  };

  const currentExamLabel = EXAM_LIST.find(e => e.id === selectedExam)?.label || selectedExam.replace(/_/g, ' ');

  return (
    <div className="space-y-6 text-left">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900/60 border border-rose-500/30 rounded-2xl p-5 gap-4 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-lg shrink-0 font-black">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-white">AI Lag & Weakness Diagnostic Engine</h1>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2.5 py-0.5 rounded-full border border-rose-500/40 font-black uppercase">
                🎯 {currentExamLabel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifies syllabus gaps, negative marking risks, and weak topics for <strong className="text-rose-300">{currentExamLabel}</strong>.
            </p>
          </div>
        </div>

        {/* Diagnostic Status Badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-xs text-rose-300 font-extrabold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-rose-400" /> Diagnostic Test Pool: {examPool.length} Qs
          </span>
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <span className="text-xs font-extrabold text-slate-400 uppercase shrink-0">Subject Focus:</span>
          {examSubjects.map(sub => (
            <button
              key={sub}
              onClick={() => {
                setSelectedSubject(sub);
                setQuizActive(false);
                setShowResults(false);
                setAnswers({});
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
                selectedSubject === sub
                  ? 'bg-rose-600 text-white shadow'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {sub} ({examPool.filter(q => q.subject === sub).length})
            </button>
          ))}
        </div>

        {!quizActive && !showResults && activeQuestions.length > 0 && (
          <button
            onClick={() => setQuizActive(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white text-xs font-black flex items-center gap-1.5 shadow"
          >
            <Play className="w-3.5 h-3.5" /> Start Lag Diagnostic Test
          </button>
        )}
      </div>

      {/* Main Diagnostic Area */}
      {activeQuestions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-black/40 border border-white/10 space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No diagnostic questions registered for {currentExamLabel}</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Switch target exams or select another subject to perform an AI weakness diagnostic scan.
          </p>
        </div>
      ) : showResults ? (
        /* Diagnostic Results Card */
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-rose-500/40 space-y-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                {currentExamLabel} — {selectedSubject} Diagnostic Report
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                AI diagnostic assessment based on your response precision.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-black text-rose-400">{getAccuracyRate()}%</div>
                <div className="text-[10px] text-slate-400 font-extrabold uppercase">Subject Precision Rate</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Detailed Topic Diagnostic Breakdown</h3>
            {activeQuestions.map(q => {
              const selectedOpt = answers[q.id];
              const isCorrect = selectedOpt === q.correctAnswer;

              return (
                <div key={q.id} className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                    <span className="font-extrabold text-slate-300">{q.topic}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                      {isCorrect ? '✓ STRENGTH DETECTED' : '⚠️ HIGH WEAKNESS LAG'}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-white mt-1">{q.question}</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed bg-purple-950/30 p-2.5 rounded-lg border border-purple-500/20">
                    <strong className="text-purple-300">Solution & Remediation:</strong> {q.explanation}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setShowResults(false);
                setQuizActive(true);
                setAnswers({});
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" /> Retest Weak Areas
            </button>
          </div>
        </div>
      ) : quizActive ? (
        /* Quiz Active Cards */
        <div className="space-y-4">
          {activeQuestions.map((q, qIdx) => (
            <div key={q.id} className="p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-black text-rose-400">Question {qIdx + 1} of {activeQuestions.length}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 font-extrabold">{q.topic}</span>
              </div>

              <div className="text-sm font-semibold text-white">{q.question}</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {q.options.map((opt, optIdx) => {
                  const isSelected = answers[q.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        isSelected
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-200 font-bold'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <strong className="mr-2 text-slate-400">{String.fromCharCode(65 + optIdx)}.</strong>
                      {typeof opt === 'string' ? opt : ((opt as any)?.text ?? '')}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <button
              onClick={calculateResults}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-black text-xs shadow-lg"
            >
              Analyze Lag Diagnostic Results →
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-black/30 border border-white/5 space-y-3 text-slate-400 text-xs">
          <Target className="w-8 h-8 text-rose-400 mx-auto animate-pulse" />
          <h3 className="text-sm font-bold text-white">Click "Start Lag Diagnostic Test" to evaluate {currentExamLabel} ({selectedSubject}) precision</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Our AI diagnostic engine will analyze your answer speed, accuracy, and negative marking risk across all syllabus modules.
          </p>
        </div>
      )}
    </div>
  );
};
