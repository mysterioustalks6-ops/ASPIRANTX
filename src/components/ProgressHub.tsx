import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Clock, 
  Calendar, 
  Flame, 
  Target, 
  CheckCircle2, 
  ChevronRight,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { UserProfile, ExamType, ActiveTab } from '../types';
import { CircularRingMeter } from './CircularPerformanceMeter';

const LeaderboardView = React.lazy(() => import('./LeaderboardView').then(m => ({ default: m.LeaderboardView })));
const WeaknessDetector = React.lazy(() => import('./WeaknessDetector').then(m => ({ default: m.WeaknessDetector })));

interface ProgressHubProps {
  userProfile: UserProfile;
  selectedExam: ExamType;
  onNavigate?: (tab: ActiveTab) => void;
}

export const ProgressHub: React.FC<ProgressHubProps> = ({
  userProfile,
  selectedExam,
  onNavigate
}) => {
  const [subTab, setSubTab] = useState<'analytics' | 'leaderboard' | 'weakness'>('analytics');

  return (
    <div className="space-y-6 pb-28 max-w-4xl mx-auto px-4 pt-2">
      {/* Pillar Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-bold tracking-wider">
              PILLAR 04
            </span>
            <span className="text-xs text-slate-400 font-mono">TELEMETRY & MASTERY</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">Progress & Analytics</h1>
          <p className="text-xs text-slate-400">Measure syllabus velocity, retention, and competitive all-India standing</p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setSubTab('analytics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'analytics'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Telemetry & Pace
          </button>
          <button
            onClick={() => setSubTab('weakness')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'weakness'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Weakness AI
          </button>
          <button
            onClick={() => setSubTab('leaderboard')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'leaderboard'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AIR Leaderboard
          </button>
        </div>
      </div>

      {/* ANALYTICS SUB-TAB */}
      {subTab === 'analytics' && (
        <div className="space-y-6">
          {/* Hero Telemetry Rings */}
          <div className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Holistic Exam Readiness</h3>
                <p className="text-xs text-slate-400">Real-time multi-dimensional readiness metrics</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold font-mono border border-emerald-500/20">
                Pace: On Track
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <CircularRingMeter 
                progress={25}
                size={120}
                strokeWidth={9}
                gradientId="grad-syllabus-hub"
                gradientColors={['#0284c7', '#38bdf8']}
                title="Syllabus Coverage"
                subtitle="1 of 4 Official Modules"
                icon={<Target className="w-3.5 h-3.5 text-sky-400" />}
              />

              <CircularRingMeter 
                progress={78}
                size={120}
                strokeWidth={9}
                gradientId="grad-accuracy-hub"
                gradientColors={['#10b981', '#34d399']}
                title="Test Accuracy"
                subtitle="UPSC Prelims Standard"
                icon={<Award className="w-3.5 h-3.5 text-emerald-400" />}
              />

              <CircularRingMeter 
                progress={userProfile.streakDays > 0 ? Math.min(100, userProfile.streakDays * 10) : 15}
                size={120}
                strokeWidth={9}
                gradientId="grad-consistency-hub"
                gradientColors={['#f59e0b', '#fbbf24']}
                title="Consistency Index"
                subtitle={`${userProfile.streakDays || 1} Days Active Streak`}
                icon={<Flame className="w-3.5 h-3.5 text-amber-400" />}
              />
            </div>
          </div>

          {/* Subject-Wise Mastery Breakdown */}
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Subject Mastery & Syllabus Completion</h3>

            <div className="space-y-3">
              {[
                { subject: 'Indian Polity & Governance', percent: 35, hours: '14.5 hrs', color: 'bg-sky-500' },
                { subject: 'Modern Indian History', percent: 20, hours: '8.0 hrs', color: 'bg-amber-500' },
                { subject: 'Geography & Environment', percent: 12, hours: '4.5 hrs', color: 'bg-emerald-500' },
                { subject: 'Indian Economy & Budget', percent: 5, hours: '2.0 hrs', color: 'bg-indigo-500' },
                { subject: 'CSAT (Mental Ability & Logic)', percent: 45, hours: '12.0 hrs', color: 'bg-purple-500' },
              ].map((sub) => (
                <div key={sub.subject} className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{sub.subject}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono">{sub.hours}</span>
                      <span className="font-bold text-white font-mono">{sub.percent}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                    <div className={`${sub.color} h-full rounded-full transition-all duration-700`} style={{ width: `${sub.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Velocity & Study Consistency */}
          <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Weekly Study Velocity</h3>
                <p className="text-xs text-slate-400">Total: 28.5 Hours this week (Target: 35 Hours)</p>
              </div>
              <span className="text-xs font-mono text-sky-400 font-bold">81% of Target</span>
            </div>

            <div className="flex items-end justify-between h-28 pt-4 px-2 border-b border-slate-800">
              {[
                { day: 'Mon', hours: 4.5, target: 5 },
                { day: 'Tue', hours: 5.2, target: 5 },
                { day: 'Wed', hours: 6.0, target: 5 },
                { day: 'Thu', hours: 3.5, target: 5 },
                { day: 'Fri', hours: 5.0, target: 5 },
                { day: 'Sat', hours: 3.0, target: 5 },
                { day: 'Sun', hours: 1.3, target: 5 },
              ].map((d) => (
                <div key={d.day} className="flex flex-col items-center gap-1.5 flex-1">
                  <span className="text-[10px] text-slate-400 font-mono">{d.hours}h</span>
                  <div className="w-6 sm:w-8 bg-slate-800 rounded-t-md h-20 flex items-end overflow-hidden">
                    <div 
                      className={`w-full rounded-t-md transition-all duration-500 ${d.hours >= d.target ? 'bg-emerald-500' : 'bg-sky-500'}`}
                      style={{ height: `${(d.hours / 6.5) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LEADERBOARD SUB-TAB */}
      {subTab === 'leaderboard' && (
        <LeaderboardView userProfile={userProfile} />
      )}

      {/* WEAKNESS SUB-TAB */}
      {subTab === 'weakness' && (
        <WeaknessDetector selectedExam={selectedExam} />
      )}
    </div>
  );
};
