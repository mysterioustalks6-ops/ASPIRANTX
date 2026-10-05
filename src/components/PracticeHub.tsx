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
import { DuolingoPathEngine } from './duolingo/DuolingoPathEngine';
import { soundFx } from '../lib/soundEffects';
import { AspirantMascot } from './duolingo/AspirantMascot';

const PyqEngine = React.lazy(() => import('./PyqEngine').then(m => ({ default: m.PyqEngine })));
const QuestionBankEngine = React.lazy(() => import('./QuestionBankEngine').then(m => ({ default: m.QuestionBankEngine })));
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--sr-line)] pb-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-[var(--sr-primary)]">
            Practice & Test Engine
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--sr-text)] mt-0.5">Reinforce & Test Knowledge</h1>
          <p className="text-xs text-[var(--sr-text-muted)] mt-1">
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
              onClick={() => { soundFx.playTap(); setSubTab(t.id as any); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer active:scale-95 ${
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
          {/* Duolingo Gamified Veer Mascot Practice Arena Banner */}
          <div 
            onClick={() => { soundFx.playChestOpen(); }}
            className="p-4 sm:p-5 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl cursor-pointer hover:border-[var(--sr-primary)] transition-all select-none active:translate-y-1"
          >
            <div className="flex items-center gap-4">
              <AspirantMascot size="md" state="encouraging" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] border border-[var(--sr-primary)]/30">
                    Veer Practice Arena ⚡
                  </span>
                  <span className="text-xs text-[var(--sr-amber)] font-black flex items-center gap-1">
                    🔥 Daily Streak Bonus: +50 XP
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-[var(--sr-text)] mt-1">
                  "Practice makes permanent. Topic-wise questions lagao aur CBT mock me AIR check karo!"
                </h3>
                <p className="text-xs text-[var(--sr-text-muted)] mt-0.5">
                  Complete your 3 daily practice quests to earn gems and protect your league standing.
                </p>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                soundFx.playTap();
                setSubTab('duo_path');
              }}
              className="px-5 py-3 rounded-2xl bg-[var(--sr-primary)] hover:opacity-95 text-[var(--sr-on-primary)] font-black text-xs uppercase tracking-wider shadow-lg border-b-[4px] border-[var(--sr-primary-depth)] active:border-b-0 active:translate-y-1 transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <span>Play Path Drills</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* DUOLINGO DAILY PRACTICE QUESTS WIDGET */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--sr-amber-subtle)] text-[var(--sr-amber)] flex items-center justify-center font-black text-base border border-[var(--sr-amber)]/30">
                  🎯
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-[var(--sr-text)]">Daily Practice Quests</h3>
                  <p className="text-xs text-[var(--sr-text-muted)]">Complete all 3 quests before midnight to earn 150 XP</p>
                </div>
              </div>
              <span className="text-xs font-black text-[var(--sr-amber)] bg-[var(--sr-amber-subtle)] px-2.5 py-1 rounded-xl border border-[var(--sr-amber)]/30">
                1 / 3 Done
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Quest 1 */}
              <div className="p-3.5 rounded-2xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--sr-text)] flex items-center gap-1.5">
                    <span>📄</span> Solve 10 PYQs
                  </span>
                  <span className="font-bold text-[var(--sr-blue)]">6/10</span>
                </div>
                <div className="w-full bg-[var(--sr-surface)] h-2 rounded-full overflow-hidden border border-[var(--sr-line)]">
                  <div className="bg-[var(--sr-blue)] h-full rounded-full transition-all duration-500" style={{ width: '60%' }} />
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--sr-text-muted)]">
                  <span>Reward: +30 XP</span>
                  <button 
                    onClick={() => { soundFx.playTap(); setSubTab('pyq'); }}
                    className="text-[var(--sr-blue)] font-bold hover:underline cursor-pointer"
                  >
                    Solve →
                  </button>
                </div>
              </div>

              {/* Quest 2 */}
              <div className="p-3.5 rounded-2xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--sr-text)] flex items-center gap-1.5">
                    <span>⚡</span> 1 Topic Drill
                  </span>
                  <span className="font-bold text-[var(--sr-primary)]">1/1 ✓</span>
                </div>
                <div className="w-full bg-[var(--sr-surface)] h-2 rounded-full overflow-hidden border border-[var(--sr-line)]">
                  <div className="bg-[var(--sr-primary)] h-full rounded-full" style={{ width: '100%' }} />
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--sr-text-muted)]">
                  <span>Reward: +40 XP</span>
                  <span className="text-[var(--sr-primary)] font-black">CLAIMED!</span>
                </div>
              </div>

              {/* Quest 3 */}
              <div className="p-3.5 rounded-2xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--sr-text)] flex items-center gap-1.5">
                    <span>🏆</span> 1 Full Mock
                  </span>
                  <span className="font-bold text-[var(--sr-purple)]">0/1</span>
                </div>
                <div className="w-full bg-[var(--sr-surface)] h-2 rounded-full overflow-hidden border border-[var(--sr-line)]">
                  <div className="bg-[var(--sr-purple)] h-full rounded-full" style={{ width: '0%' }} />
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--sr-text-muted)]">
                  <span>Reward: +80 XP + 🪙 10</span>
                  <button 
                    onClick={() => { soundFx.playTap(); setSubTab('cbt'); }}
                    className="text-[var(--sr-purple)] font-bold hover:underline cursor-pointer"
                  >
                    Enter Mock →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 4 CORE TACTILE 3D PRACTICE MODULES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. PYQ Archive */}
            <div 
              onClick={() => { soundFx.playTap(); setSubTab('pyq'); }}
              className="p-5 sm:p-6 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-blue)]/30 border-b-[6px] border-b-[var(--sr-blue-depth)] hover:border-[var(--sr-blue)] transition-all cursor-pointer group space-y-4 shadow-xl active:translate-y-1 active:border-b-2"
            >
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-[var(--sr-blue-subtle)] border-2 border-[var(--sr-blue)]/40 text-[var(--sr-blue)] flex items-center justify-center font-black text-xl shadow-md">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-[var(--sr-blue-subtle)] text-[var(--sr-blue)] text-xs font-black uppercase tracking-wider border border-[var(--sr-blue)]/30">
                  +10 XP per Q
                </span>
              </div>
              <div>
                <h3 className="text-lg font-black text-[var(--sr-text)] group-hover:text-[var(--sr-blue)] transition-colors">
                  Enterprise PYQ Archive (1991–2026)
                </h3>
                <p className="text-xs text-[var(--sr-text-muted)] mt-1.5 leading-relaxed">
                  35 years of official Prelims & Mains examination papers with complete verified answer keys and instant topic filter.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-[var(--sr-text-muted)]">Official State & National Papers</span>
                <span className="px-4 py-2 rounded-xl bg-[var(--sr-blue)] text-[var(--sr-on-blue)] font-black text-xs uppercase tracking-wider border-b-[3px] border-[var(--sr-blue-depth)] group-hover:shadow-md">
                  Start PYQ 🚀
                </span>
              </div>
            </div>

            {/* 2. Question Bank */}
            <div 
              onClick={() => { soundFx.playTap(); setSubTab('question_bank'); }}
              className="p-5 sm:p-6 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-primary)]/30 border-b-[6px] border-b-[var(--sr-primary-depth)] hover:border-[var(--sr-primary)] transition-all cursor-pointer group space-y-4 shadow-xl active:translate-y-1 active:border-b-2"
            >
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-[var(--sr-primary-subtle)] border-2 border-[var(--sr-primary)]/40 text-[var(--sr-primary)] flex items-center justify-center font-black text-xl shadow-md">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] text-xs font-black uppercase tracking-wider border border-[var(--sr-primary)]/30">
                  6,000+ MCQs
                </span>
              </div>
              <div>
                <h3 className="text-lg font-black text-[var(--sr-text)] group-hover:text-[var(--sr-primary)] transition-colors">
                  Topic Question Bank & NCERT Drills
                </h3>
                <p className="text-xs text-[var(--sr-text-muted)] mt-1.5 leading-relaxed">
                  Curated conceptual MCQs structured by chapter, difficulty tier, and NCERT standard with instant detailed solutions.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-[var(--sr-text-muted)]">Easy • Medium • Hard</span>
                <span className="px-4 py-2 rounded-xl bg-[var(--sr-primary)] text-[var(--sr-on-primary)] font-black text-xs uppercase tracking-wider border-b-[3px] border-[var(--sr-primary-depth)] group-hover:shadow-md">
                  Start Drill 🎯
                </span>
              </div>
            </div>

            {/* 3. CBT Simulator */}
            <div 
              onClick={() => { soundFx.playTap(); setSubTab('cbt'); }}
              className="p-5 sm:p-6 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-purple)]/30 border-b-[6px] border-b-[var(--sr-purple-depth)] hover:border-[var(--sr-purple)] transition-all cursor-pointer group space-y-4 shadow-xl active:translate-y-1 active:border-b-2"
            >
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-[var(--sr-purple-subtle)] border-2 border-[var(--sr-purple)]/40 text-[var(--sr-purple)] flex items-center justify-center font-black text-xl shadow-md">
                  <Award className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-[var(--sr-purple-subtle)] text-[var(--sr-purple)] text-xs font-black uppercase tracking-wider border border-[var(--sr-purple)]/30">
                  Timed CBT Exam
                </span>
              </div>
              <div>
                <h3 className="text-lg font-black text-[var(--sr-text)] group-hover:text-[var(--sr-purple)] transition-colors">
                  All-India CBT Mock Simulator
                </h3>
                <p className="text-xs text-[var(--sr-text-muted)] mt-1.5 leading-relaxed">
                  Official NTA/TCS-style timed test interface with negative marking, question palette, and national rank prediction.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-[var(--sr-text-muted)]">National Percentile & AIR</span>
                <span className="px-4 py-2 rounded-xl bg-[var(--sr-purple)] text-white font-black text-xs uppercase tracking-wider border-b-[3px] border-[var(--sr-purple-depth)] group-hover:shadow-md">
                  Enter Exam ⚡
                </span>
              </div>
            </div>

            {/* 4. Weakness Re-tester */}
            <div 
              onClick={() => { soundFx.playTap(); setSubTab('weakness'); }}
              className="p-5 sm:p-6 rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-amber)]/30 border-b-[6px] border-b-[var(--sr-amber-depth)] hover:border-[var(--sr-amber)] transition-all cursor-pointer group space-y-4 shadow-xl active:translate-y-1 active:border-b-2"
            >
              <div className="flex items-center justify-between">
                <div className="w-13 h-13 rounded-2xl bg-[var(--sr-amber-subtle)] border-2 border-[var(--sr-amber)]/40 text-[var(--sr-amber)] flex items-center justify-center font-black text-xl shadow-md">
                  <Target className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-[var(--sr-amber-subtle)] text-[var(--sr-amber)] text-xs font-black uppercase tracking-wider border border-[var(--sr-amber)]/30">
                  AI Mistake Log
                </span>
              </div>
              <div>
                <h3 className="text-lg font-black text-[var(--sr-text)] group-hover:text-[var(--sr-amber)] transition-colors">
                  Weakness Diagnostic & Mistake Log
                </h3>
                <p className="text-xs text-[var(--sr-text-muted)] mt-1.5 leading-relaxed">
                  Automatic negative marking detection. Isolates your mistakes from mocks & drills to generate targeted re-tests.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-[var(--sr-text-muted)]">Spaced Memory Curve</span>
                <span className="px-4 py-2 rounded-xl bg-[var(--sr-amber)] text-[var(--sr-on-amber)] font-black text-xs uppercase tracking-wider border-b-[3px] border-[var(--sr-amber-depth)] group-hover:shadow-md">
                  Fix Mistakes 🛡️
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB VIEWS */}
      <React.Suspense fallback={<div className="p-8 text-center text-slate-400 font-bold text-xs">Loading Practice Engine...</div>}>
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
      </React.Suspense>
    </div>
  );
};
