import React, { useState } from 'react';
import { 
  Award, 
  FileText, 
  HelpCircle, 
  Target, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { UserProfile, ExamType, ActiveTab } from '../types';
import { PyqEngine } from './PyqEngine';
import { QuestionBankEngine } from './QuestionBankEngine';

const CbtExamEngine = React.lazy(() => import('./CbtExamEngine').then(m => ({ default: m.CbtExamEngine })));
const WeaknessDetector = React.lazy(() => import('./WeaknessDetector').then(m => ({ default: m.WeaknessDetector })));

interface PracticeHubProps {
  userProfile: UserProfile;
  selectedExam: ExamType;
  isAdmin?: boolean;
  onNavigate?: (tab: ActiveTab) => void;
  initialSubTab?: 'overview' | 'pyq' | 'question_bank' | 'cbt' | 'weakness';
}

export const PracticeHub: React.FC<PracticeHubProps> = ({
  userProfile,
  selectedExam,
  isAdmin = false,
  onNavigate,
  initialSubTab = 'overview'
}) => {
  const [subTab, setSubTab] = useState<'overview' | 'pyq' | 'question_bank' | 'cbt' | 'weakness'>(initialSubTab);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Quiet Header & Category Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-400">
            Practice & Test Engine
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-0.5">Reinforce & Test Knowledge</h1>
          <p className="text-xs text-slate-400 mt-1">
            Topic drills, 35-year PYQ archives, and All-India timed CBT mock simulations.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 self-start overflow-x-auto max-w-full">
          {[
            { id: 'overview', label: 'Hub' },
            { id: 'pyq', label: 'PYQ Archive' },
            { id: 'question_bank', label: 'Question Bank' },
            { id: 'cbt', label: 'CBT Simulator' },
            { id: 'weakness', label: 'Weak Areas' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                subTab === t.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW / HUB SELECTION */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          {/* Contextual Recommendation Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold uppercase border border-sky-500/30">
                  Recommended Drill
                </span>
                <span className="text-xs text-slate-400">Polity • Constitutional Framework</span>
              </div>
              <h3 className="text-base font-bold text-white">5 High-Yield Preamble & Articles PYQs</h3>
              <p className="text-xs text-slate-300">
                Reinforce foundational concepts covered in today's study plan with previous years' questions.
              </p>
            </div>
            <button
              onClick={() => setSubTab('pyq')}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-sky-600/20 shrink-0"
            >
              Start Drill <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 4 Core Practice Modules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. PYQ Archive */}
            <div 
              onClick={() => setSubTab('pyq')}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                  Enterprise PYQ Archive (1991–2026)
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Search and practice official UPSC Civil Services Prelims & Mains questions with detailed official answer keys.
                </p>
              </div>
              <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span>35 Years Archive</span>
                <span>•</span>
                <span>Subject & Year Filters</span>
              </div>
            </div>

            {/* 2. Question Bank */}
            <div 
              onClick={() => setSubTab('question_bank')}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Topic Question Bank
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Over 6,000+ curated conceptual MCQs indexed strictly by chapter, difficulty tier, and NCERT standard.
                </p>
              </div>
              <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span>6,000+ MCQs</span>
                <span>•</span>
                <span>Instant Explanations</span>
              </div>
            </div>

            {/* 3. CBT Simulator */}
            <div 
              onClick={() => setSubTab('cbt')}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                  All-India CBT Mock Simulator
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Real-time full-length GS Paper-1 & CSAT timed mock exam with negative marking and All-India ranks.
                </p>
              </div>
              <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span>NTA Interface</span>
                <span>•</span>
                <span>Live Percentile</span>
              </div>
            </div>

            {/* 4. Weakness Re-tester */}
            <div 
              onClick={() => setSubTab('weakness')}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Weakness Detector & Mistake Log
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  AI diagnostic detector that tracks your incorrect attempts and generates targeted re-tests to turn weaknesses into strengths.
                </p>
              </div>
              <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span>Auto Error Log</span>
                <span>•</span>
                <span>Targeted Drills</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB VIEWS */}
      {subTab === 'pyq' && (
        <div className="space-y-4">
          <button 
            onClick={() => setSubTab('overview')}
            className="text-xs text-sky-400 font-semibold hover:underline flex items-center gap-1"
          >
            ← Back to Practice Hub
          </button>
          <PyqEngine isAdmin={isAdmin} initialExam={selectedExam} />
        </div>
      )}

      {subTab === 'question_bank' && (
        <div className="space-y-4">
          <button 
            onClick={() => setSubTab('overview')}
            className="text-xs text-sky-400 font-semibold hover:underline flex items-center gap-1"
          >
            ← Back to Practice Hub
          </button>
          <QuestionBankEngine isAdmin={isAdmin} initialExam={selectedExam} />
        </div>
      )}

      {subTab === 'cbt' && (
        <div className="space-y-4">
          <button 
            onClick={() => setSubTab('overview')}
            className="text-xs text-sky-400 font-semibold hover:underline flex items-center gap-1"
          >
            ← Back to Practice Hub
          </button>
          <CbtExamEngine userProfile={userProfile} selectedExam={selectedExam} />
        </div>
      )}

      {subTab === 'weakness' && (
        <div className="space-y-4">
          <button 
            onClick={() => setSubTab('overview')}
            className="text-xs text-sky-400 font-semibold hover:underline flex items-center gap-1"
          >
            ← Back to Practice Hub
          </button>
          <WeaknessDetector selectedExam={selectedExam} />
        </div>
      )}
    </div>
  );
};
