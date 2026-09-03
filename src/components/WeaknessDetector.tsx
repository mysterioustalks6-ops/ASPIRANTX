import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Award, 
  BookOpen, 
  Play, 
  Zap, 
  Target, 
  RotateCw,
  TrendingDown,
  TrendingUp,
  HelpCircle,
  Sparkles,
  BarChart3,
  Layers,
  ArrowRight
} from 'lucide-react';
import { EXAM_LIST } from '../lib/examList';
import { DIAGNOSTIC_QUESTION_BANK, DiagnosticQuestion } from '../data/diagnosticQuestionBank';
import { normalizeExamId } from '../lib/examRegistry';

interface WeaknessDetectorProps {
  selectedExam?: string;
  onExamChange?: (exam: string) => void;
}

interface TopicDiagnostic {
  topic: string;
  subject: string;
  total: number;
  correct: number;
  accuracy: number;
  status: 'Needs Work' | 'Developing' | 'Strong';
}

export const WeaknessDetector: React.FC<WeaknessDetectorProps> = ({
  selectedExam = 'NEET_UG',
  onExamChange
}) => {
  // Filter questions strictly by active exam with zero cross-exam contamination
  const examPool = useMemo(() => {
    const norm = normalizeExamId(selectedExam);
    return DIAGNOSTIC_QUESTION_BANK.filter(q => normalizeExamId(q.exam) === norm);
  }, [selectedExam]);

  const examSubjects = useMemo(() => {
    return Array.from(new Set(examPool.map(q => q.subject)));
  }, [examPool]);

  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [quizActive, setQuizActive] = useState<boolean>(false);
  const [answers, setAnswers] = useState<{ [qId: number]: number }>({});
  const [showResults, setShowResults] = useState<boolean>(false);

  // Set default subject whenever exam or subject list changes
  useEffect(() => {
    if (examSubjects.length > 0) {
      setSelectedSubject(examSubjects[0]);
    } else {
      setSelectedSubject('ALL');
    }
    setQuizActive(false);
    setAnswers({});
    setShowResults(false);
  }, [selectedExam, examSubjects]);

  const activeQuestions = useMemo(() => {
    if (selectedSubject === 'ALL') {
      return examPool;
    }
    return examPool.filter(q => q.subject === selectedSubject);
  }, [examPool, selectedSubject]);

  const handleSelectOption = (qId: number, idx: number) => {
    setAnswers(prev => ({ ...prev, [qId]: idx }));
  };

  const calculateResults = () => {
    if (activeQuestions.length === 0) return;
    if (Object.keys(answers).length < activeQuestions.length) {
      alert('Please select an answer for every diagnostic question to receive a complete assessment.');
      return;
    }
    setShowResults(true);
  };

  const overallAccuracy = useMemo(() => {
    if (activeQuestions.length === 0) return 0;
    let correct = 0;
    activeQuestions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    return Math.round((correct / activeQuestions.length) * 100);
  }, [activeQuestions, answers]);

  // Topic-Level Breakdown: Group by distinct topic and calculate accuracy and weakness level
  const topicDiagnostics: TopicDiagnostic[] = useMemo(() => {
    if (!showResults) return [];

    const topicMap: Record<string, { topic: string; subject: string; total: number; correct: number }> = {};
    activeQuestions.forEach(q => {
      if (!topicMap[q.topic]) {
        topicMap[q.topic] = { topic: q.topic, subject: q.subject, total: 0, correct: 0 };
      }
      topicMap[q.topic].total += 1;
      if (answers[q.id] === q.correctAnswer) {
        topicMap[q.topic].correct += 1;
      }
    });

    const list: TopicDiagnostic[] = Object.values(topicMap).map(t => {
      const acc = Math.round((t.correct / t.total) * 100);
      let status: 'Needs Work' | 'Developing' | 'Strong' = 'Needs Work';
      if (acc >= 80) status = 'Strong';
      else if (acc >= 60) status = 'Developing';

      return {
        topic: t.topic,
        subject: t.subject,
        total: t.total,
        correct: t.correct,
        accuracy: acc,
        status,
      };
    });

    // Sort weakest-first (lowest accuracy first) so weak topics are highlighted immediately
    list.sort((a, b) => a.accuracy - b.accuracy || b.total - a.total);
    return list;
  }, [showResults, activeQuestions, answers]);

  const weakTopics = useMemo(() => {
    return topicDiagnostics.filter(t => t.status === 'Needs Work');
  }, [topicDiagnostics]);

  const currentExamLabel = EXAM_LIST.find(e => e.id === selectedExam)?.label || selectedExam.replace(/_/g, ' ');

  return (
    <div className="space-y-6 text-left">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900/80 border border-rose-500/30 rounded-2xl p-5 gap-4 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3.5">
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
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              Multi-topic precision test to uncover syllabus gaps, conceptual lag, and negative marking risks.
            </p>
          </div>
        </div>

        {/* Diagnostic Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3.5 py-2 rounded-xl bg-black/50 border border-rose-500/20 text-xs text-rose-300 font-extrabold flex items-center gap-2">
            <Zap className="w-4 h-4 text-rose-400" />
            <span>Pool: <strong className="text-white">{examPool.length}</strong> Qs ({examSubjects.length} Subjects)</span>
          </span>
        </div>
      </div>

      {/* Subject Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-rose-400" /> Focus:
          </span>

          {/* ALL Subjects Mode */}
          <button
            onClick={() => {
              setSelectedSubject('ALL');
              setQuizActive(false);
              setShowResults(false);
              setAnswers({});
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
              selectedSubject === 'ALL'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40 ring-1 ring-rose-400/50'
                : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            All Subjects ({examPool.length} Qs)
          </button>

          {/* Per-Subject Buttons */}
          {examSubjects.map(sub => {
            const count = examPool.filter(q => q.subject === sub).length;
            const isSelected = selectedSubject === sub;
            return (
              <button
                key={sub}
                onClick={() => {
                  setSelectedSubject(sub);
                  setQuizActive(false);
                  setShowResults(false);
                  setAnswers({});
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all shrink-0 ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40 ring-1 ring-rose-400/50'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {sub} ({count} Qs)
              </button>
            );
          })}
        </div>

        {!quizActive && !showResults && activeQuestions.length > 0 && (
          <button
            onClick={() => setQuizActive(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 hover:from-rose-400 hover:to-pink-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-rose-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Diagnostic Test ({activeQuestions.length} Qs)</span>
          </button>
        )}
      </div>

      {/* Fallback Notice when Subject has < 5 Questions */}
      {activeQuestions.length > 0 && activeQuestions.length < 5 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-200 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Limited Question Bank Notice:</strong> Only {activeQuestions.length} diagnostic {activeQuestions.length === 1 ? 'question is' : 'questions are'} available for this selection yet — results may be less precise. More questions are being indexed.
          </span>
        </div>
      )}

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
        <div className="p-6 rounded-2xl bg-slate-900 border border-rose-500/40 space-y-7 shadow-2xl">
          {/* Top Score Summary Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                {currentExamLabel} — {selectedSubject === 'ALL' ? 'Comprehensive Multi-Subject' : selectedSubject} Diagnostic Report
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Evaluated across <strong className="text-white">{topicDiagnostics.length} distinct syllabus topics</strong> to detect concept lag and negative marking vulnerability.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-white/10">
              <div className="text-right">
                <div className="text-2xl font-black text-rose-400">{overallAccuracy}%</div>
                <div className="text-[10px] text-slate-400 font-extrabold uppercase">Overall Accuracy</div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-left">
                <div className="text-sm font-black text-white">
                  {activeQuestions.filter(q => answers[q.id] === q.correctAnswer).length} / {activeQuestions.length}
                </div>
                <div className="text-[10px] text-slate-400 font-extrabold uppercase">Questions Correct</div>
              </div>
            </div>
          </div>

          {/* Priority Remediation Alert for Weak Topics */}
          {weakTopics.length > 0 ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-black text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>🎯 Priority Remediation Alert ({weakTopics.length} Critical Lag {weakTopics.length === 1 ? 'Area' : 'Areas'} Detected)</span>
              </div>
              <p className="text-xs text-slate-300">
                You showed significant vulnerability in the following topics. Prioritize these in your study schedule and revision planner:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {weakTopics.map(wt => (
                  <span key={wt.topic} className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-200 text-[11px] font-bold">
                    ⚠️ {wt.topic} ({wt.accuracy}% accuracy)
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-1">
              <div className="flex items-center gap-2 text-emerald-300 font-black text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Excellent Conceptual Mastery!</span>
              </div>
              <p className="text-xs text-slate-300">
                No high-weakness topics detected in this diagnostic set. Maintain consistency with mock tests and spaced revision.
              </p>
            </div>
          )}

          {/* Detailed Topic-Level Breakdown Cards (Weakest First) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-rose-400" />
                Topic-Level Weakness Breakdown (Weakest First)
              </h3>
              <span className="text-[10px] text-slate-400 font-bold">
                Sorted by lowest accuracy
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topicDiagnostics.map((td) => {
                const isWeak = td.status === 'Needs Work';
                const isModerate = td.status === 'Developing';
                return (
                  <div
                    key={td.topic}
                    className={`p-4 rounded-xl border transition-all ${
                      isWeak
                        ? 'bg-rose-950/20 border-rose-500/40'
                        : isModerate
                        ? 'bg-amber-950/20 border-amber-500/40'
                        : 'bg-slate-950/60 border-emerald-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          {td.subject}
                        </span>
                        <h4 className="text-xs font-bold text-white truncate" title={td.topic}>
                          {td.topic}
                        </h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 border ${
                          isWeak
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : isModerate
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {td.status === 'Needs Work' ? '⚠️ Needs Work' : td.status === 'Developing' ? '⚡ Developing' : '✓ Strong'}
                      </span>
                    </div>

                    {/* Topic Progress Bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                        <span>Precision: {td.correct}/{td.total} correct</span>
                        <span className={isWeak ? 'text-rose-400 font-bold' : isModerate ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                          {td.accuracy}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isWeak ? 'bg-rose-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(5, td.accuracy)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question Review & Solutions */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              Detailed Solutions & Remediation Notes
            </h3>

            {activeQuestions.map((q, idx) => {
              const selectedOpt = answers[q.id];
              const isCorrect = selectedOpt === q.correctAnswer;

              return (
                <div key={q.id} className="p-4 rounded-xl bg-black/60 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-400">Q{idx + 1}.</span>
                      <span className="font-extrabold text-slate-200">{q.topic}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 ${
                      isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {isCorrect ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {isCorrect ? 'STRENGTH DETECTED' : 'HIGH WEAKNESS LAG'}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-white leading-relaxed">{q.question}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className={`p-2 rounded-lg border ${
                      isCorrect ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    }`}>
                      <span className="text-[10px] text-slate-400 block font-bold">Your Selection:</span>
                      <span>{selectedOpt !== undefined ? `${String.fromCharCode(65 + selectedOpt)}. ${q.options[selectedOpt]}` : 'Unanswered'}</span>
                    </div>

                    {!isCorrect && (
                      <div className="p-2 rounded-lg border bg-emerald-950/30 border-emerald-500/40 text-emerald-200">
                        <span className="text-[10px] text-emerald-400 block font-bold">Correct Option:</span>
                        <span>{String.fromCharCode(65 + q.correctAnswer)}. {q.options[q.correctAnswer]}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed bg-purple-950/30 p-3 rounded-lg border border-purple-500/20 mt-2">
                    <strong className="text-purple-300 block mb-0.5">💡 Remediation & Concept Logic:</strong>
                    {q.explanation}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setShowResults(false);
                setQuizActive(true);
                setAnswers({});
              }}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black flex items-center gap-2 shadow-lg transition-all"
            >
              <RotateCw className="w-4 h-4" /> Retest Diagnostic Pool
            </button>
          </div>
        </div>
      ) : quizActive ? (
        /* Quiz Active Cards */
        <div className="space-y-4">
          <div className="p-3 bg-slate-900/90 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs text-slate-300">
            <span className="font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-rose-400" />
              Answered: <strong className="text-white">{Object.keys(answers).length} of {activeQuestions.length}</strong>
            </span>
            <span className="text-[11px] text-slate-400">
              Targeting: <span className="text-rose-300 font-bold">{selectedSubject === 'ALL' ? 'All Subjects' : selectedSubject}</span>
            </span>
          </div>

          {activeQuestions.map((q, qIdx) => (
            <div key={q.id} className="p-5 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <span className="text-xs font-black text-rose-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-[10px] text-rose-300 border border-rose-500/30 font-bold">
                    {qIdx + 1}
                  </span>
                  Question {qIdx + 1} of {activeQuestions.length}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 font-bold border border-white/10">
                  {q.topic}
                </span>
              </div>

              <div className="text-sm font-semibold text-white leading-relaxed">{q.question}</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {q.options.map((opt, optIdx) => {
                  const isSelected = answers[q.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-rose-500/20 border-rose-500/60 text-rose-100 font-bold ring-1 ring-rose-400/40'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 ${
                        isSelected ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="leading-snug pt-0.5">
                        {typeof opt === 'string' ? opt : ((opt as any)?.text ?? '')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => {
                setQuizActive(false);
                setAnswers({});
              }}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all"
            >
              Cancel
            </button>

            <button
              onClick={calculateResults}
              disabled={Object.keys(answers).length < activeQuestions.length}
              className={`px-6 py-2.5 rounded-xl text-white font-black text-xs shadow-lg transition-all flex items-center gap-2 ${
                Object.keys(answers).length >= activeQuestions.length
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 hover:scale-[1.02]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Analyze Lag Diagnostic Results</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-white/10 space-y-4 text-slate-300 text-xs">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <Target className="w-7 h-7 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              Ready to Evaluate {currentExamLabel} ({selectedSubject === 'ALL' ? 'All Subjects' : selectedSubject}) Conceptual Precision?
            </h3>
            <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
              Our AI diagnostic test analyzes your responses across {activeQuestions.length} high-yield topic modules to isolate your weak areas and generate a targeted remediation strategy.
            </p>
          </div>

          <button
            onClick={() => setQuizActive(true)}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-black text-xs shadow-lg shadow-rose-950/50 inline-flex items-center gap-2 transition-all hover:scale-105"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch {activeQuestions.length}-Question Diagnostic Test</span>
          </button>
        </div>
      )}
    </div>
  );
};
