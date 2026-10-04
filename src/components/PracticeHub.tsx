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
import { DuolingoPathEngine } from './duolingo/DuolingoPathEngine';

const CbtExamEngine = React.lazy(() => import('./CbtExamEngine').then(m => ({ default: m.CbtExamEngine })));
const WeaknessDetector = React.lazy(() => import('./WeaknessDetector').then(m => ({ default: m.WeaknessDetector })));

interface PracticeHubProps {
  userProfile: UserProfile;
  selectedExam: ExamType;
  isAdmin?: boolean;
  onNavigate?: (tab: ActiveTab) => void;
  initialSubTab?: 'overview' | 'duo_path' | 'pyq' | 'question_bank' | 'cbt' | 'weakness';
}

export const PracticeHub: React.FC<PracticeHubProps> = ({
  userProfile,
  selectedExam,
  isAdmin = false,
  onNavigate,
  initialSubTab = 'overview'
}) => {
  const [subTab, setSubTab] = useState<'overview' | 'duo_path' | 'pyq' | 'question_bank' | 'cbt' | 'weakness'>(initialSubTab);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Quiet Header & Category Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2F3A] pb-4">
        <div>
          <span className="text-[11px] font-mono font-black uppercase tracking-wider text-[#1CB0F6]">
            Practice & Test Engine
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-[#F3F4F6] mt-0.5">Reinforce & Test Knowledge</h1>
          <p className="text-xs text-[#9CA3AF] mt-1">
            Topic drills, 35-year PYQ archives, and All-India timed CBT mock simulations.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#15181F] rounded-xl border border-[#2A2F3A] self-start overflow-x-auto max-w-full">
          {[
            { id: 'overview', label: 'Hub' },
            { id: 'duo_path', label: '🎯 Exam Path (Duo Drills)' },
            { id: 'pyq', label: 'PYQ Archive' },
            { id: 'question_bank', label: 'Question Bank' },
            { id: 'cbt', label: 'CBT Simulator' },
            { id: 'weakness', label: 'Weak Areas' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                subTab === t.id
                  ? 'bg-[#1CB0F6] text-[#052840] shadow-sm'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1A1D24]'
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
          <div className="p-4 sm:p-5 rounded-2xl bg-[#1A1D24] border border-[#1CB0F6]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-[#1CB0F6]/5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#1CB0F6]/20 text-[#1CB0F6] text-[10px] font-black uppercase border border-[#1CB0F6]/40">
                  Recommended Drill
                </span>
                <span className="text-xs text-[#9CA3AF]">Polity • Constitutional Framework</span>
              </div>
              <h3 className="text-base font-black text-white">5 High-Yield Preamble & Articles PYQs</h3>
              <p className="text-xs text-[#9CA3AF]">
                Reinforce foundational concepts covered in today's study plan with previous years' questions.
              </p>
            </div>
            <button
              onClick={() => setSubTab('pyq')}
              className="px-5 py-2.5 rounded-xl bg-[#58CC02] hover:bg-[#46A302] text-[#0B2300] font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md border-b-2 border-[#46A302] active:border-b-0 active:translate-y-0.5 shrink-0 cursor-pointer"
            >
              Start Drill <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 4 Core Practice Modules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. PYQ Archive */}
            <div 
              onClick={() => setSubTab('pyq')}
              className="p-5 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-4 border-b-[#1A1D24] hover:border-[#1CB0F6] hover:border-b-[#1899D6] transition-all cursor-pointer group space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-[#1CB0F6]/10 border border-[#1CB0F6]/30 text-[#1CB0F6] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <ChevronRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#1CB0F6] group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#F3F4F6] group-hover:text-[#1CB0F6] transition-colors">
                  Enterprise PYQ Archive (1991–2026)
                </h3>
                <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
                  Search and practice official UPSC Civil Services Prelims & Mains questions with detailed official answer keys.
                </p>
              </div>
              <div className="pt-1 flex items-center gap-3 text-[11px] text-[#9CA3AF] font-mono">
                <span>35 Years Archive</span>
                <span>•</span>
                <span>Subject & Year Filters</span>
              </div>
            </div>

            {/* 2. Question Bank */}
            <div 
              onClick={() => setSubTab('question_bank')}
              className="p-5 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-4 border-b-[#1A1D24] hover:border-[#58CC02] hover:border-b-[#46A302] transition-all cursor-pointer group space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-[#58CC02]/10 border border-[#58CC02]/30 text-[#58CC02] flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <ChevronRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#58CC02] group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#F3F4F6] group-hover:text-[#58CC02] transition-colors">
                  Topic Question Bank
                </h3>
                <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
                  Over 6,000+ curated conceptual MCQs indexed strictly by chapter, difficulty tier, and NCERT standard.
                </p>
              </div>
              <div className="pt-1 flex items-center gap-3 text-[11px] text-[#9CA3AF] font-mono">
                <span>6,000+ MCQs</span>
                <span>•</span>
                <span>Instant Explanations</span>
              </div>
            </div>

            {/* 3. CBT Simulator */}
            <div 
              onClick={() => setSubTab('cbt')}
              className="p-5 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-4 border-b-[#1A1D24] hover:border-indigo-400 hover:border-b-indigo-500 transition-all cursor-pointer group space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <ChevronRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#F3F4F6] group-hover:text-indigo-300 transition-colors">
                  All-India CBT Mock Simulator
                </h3>
                <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
                  Real-time full-length GS Paper-1 & CSAT timed mock exam with negative marking and All-India ranks.
                </p>
              </div>
              <div className="pt-1 flex items-center gap-3 text-[11px] text-[#9CA3AF] font-mono">
                <span>NTA Interface</span>
                <span>•</span>
                <span>Live Percentile</span>
              </div>
            </div>

            {/* 4. Weakness Re-tester */}
            <div 
              onClick={() => setSubTab('weakness')}
              className="p-5 rounded-2xl bg-[#15181F] border border-[#2A2F3A] border-b-4 border-b-[#1A1D24] hover:border-[#FF9600] hover:border-b-[#E08500] transition-all cursor-pointer group space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-[#FF9600]/10 border border-[#FF9600]/30 text-[#FF9600] flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <ChevronRight className="w-5 h-5 text-[#9CA3AF] group-hover:text-[#FF9600] group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#F3F4F6] group-hover:text-[#FF9600] transition-colors">
                  Weakness Detector & Mistake Log
                </h3>
                <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
                  AI diagnostic detector that tracks your incorrect attempts and generates targeted re-tests to turn weaknesses into strengths.
                </p>
              </div>
              <div className="pt-1 flex items-center gap-3 text-[11px] text-[#9CA3AF] font-mono">
                <span>Auto Error Log</span>
                <span>•</span>
                <span>Targeted Drills</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB VIEWS */}
      {subTab === 'duo_path' && (
        <div className="space-y-4">
          <button 
            onClick={() => setSubTab('overview')}
            className="text-xs text-sky-400 font-semibold hover:underline flex items-center gap-1"
          >
            ← Back to Practice Hub
          </button>
          <DuolingoPathEngine userProfile={userProfile} selectedExam={selectedExam} onNavigate={onNavigate} />
        </div>
      )}

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
