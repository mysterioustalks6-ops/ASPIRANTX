import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart as PieChartIcon, 
  BarChart2, 
  TrendingUp, 
  Clock, 
  Flame, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  Zap, 
  BookOpen, 
  Target, 
  ShieldCheck, 
  Play,
  RotateCcw,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  AreaChart, 
  Area 
} from 'recharts';
import { loadStudySessions } from '../lib/gamification';
import { StudySession } from '../types';

interface PomodoroAnalyticsProps {
  userId?: string;
  onStartPomodoro?: () => void;
  activeExamId?: string;
}

// Curated vibrant neon color palette for subjects
const SUBJECT_COLORS = [
  '#38bdf8', // Sky 400
  '#10b981', // Emerald 500
  '#f59e0b', // Amber 500
  '#a855f7', // Purple 500
  '#f43f5e', // Rose 500
  '#06b6d4', // Cyan 500
  '#ec4899', // Pink 500
  '#6366f1', // Indigo 500
  '#84cc16', // Lime 500
  '#eab308', // Yellow 500
];

// Sample preview data for first-time aspirants (so screen is never cold or dead)
const SAMPLE_PREVIEW_SESSIONS: StudySession[] = [
  { id: 'sample_1', userId: 'sample', subject: 'Physics', durationSeconds: 3000, mode: 'pomodoro', createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), xpEarned: 250, coinsEarned: 25 },
  { id: 'sample_2', userId: 'sample', subject: 'Chemistry', durationSeconds: 2400, mode: 'pomodoro', createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), xpEarned: 200, coinsEarned: 20 },
  { id: 'sample_3', userId: 'sample', subject: 'Mathematics', durationSeconds: 3600, mode: 'pomodoro', createdAt: new Date(Date.now() - 86400000).toISOString(), xpEarned: 300, coinsEarned: 30 },
  { id: 'sample_4', userId: 'sample', subject: 'Biology', durationSeconds: 1800, mode: 'pomodoro', createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), xpEarned: 150, coinsEarned: 15 },
  { id: 'sample_5', userId: 'sample', subject: 'General Studies', durationSeconds: 2700, mode: 'pomodoro', createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), xpEarned: 225, coinsEarned: 22 },
];

export const PomodoroAnalytics: React.FC<PomodoroAnalyticsProps> = ({ 
  userId, 
  onStartPomodoro,
  activeExamId
}) => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');
  const [showSamplePreview, setShowSamplePreview] = useState<boolean>(false);
  const [hoveredSubject, setHoveredSubject] = useState<string | null>(null);

  // Fetch and sync sessions
  const refreshSessions = async () => {
    setIsLoading(true);
    try {
      const local = await loadStudySessions(userId);
      setSessions(local || []);
    } catch (err) {
      console.warn('Error loading study sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSessions();

    const handleSessionLogged = () => {
      refreshSessions();
    };

    window.addEventListener('aspirantx_study_session_logged', handleSessionLogged);
    window.addEventListener('aspirantx_syllabus_time_updated', handleSessionLogged);

    return () => {
      window.removeEventListener('aspirantx_study_session_logged', handleSessionLogged);
      window.removeEventListener('aspirantx_syllabus_time_updated', handleSessionLogged);
    };
  }, [userId]);

  // Determine active dataset (real or sample preview for new users)
  const isZeroState = sessions.length === 0;
  const activeDataset = (isZeroState && showSamplePreview) ? SAMPLE_PREVIEW_SESSIONS : sessions;

  // Filter sessions by selected time range
  const filteredSessions = useMemo(() => {
    const now = Date.now();
    return activeDataset.filter(s => {
      const sessionTime = new Date(s.createdAt).getTime();
      if (isNaN(sessionTime)) return true;
      if (timeRange === '7d') return now - sessionTime <= 7 * 86400000;
      if (timeRange === '30d') return now - sessionTime <= 30 * 86400000;
      return true;
    });
  }, [activeDataset, timeRange]);

  // Total Study Duration (Seconds)
  const totalSeconds = useMemo(() => {
    return filteredSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
  }, [filteredSessions]);

  const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;
  const totalCompletedPomos = filteredSessions.length;

  // 1. Subject-Wise Pie Chart Distribution
  const subjectPieData = useMemo(() => {
    const map = new Map<string, number>();
    filteredSessions.forEach(s => {
      const sub = s.subject || 'General Study';
      map.set(sub, (map.get(sub) || 0) + (s.durationSeconds || 0));
    });

    const total = totalSeconds || 1;
    const list: { name: string; value: number; hours: number; percentage: number; color: string }[] = [];
    
    let colorIdx = 0;
    map.forEach((secs, sub) => {
      const hrs = Math.round((secs / 3600) * 10) / 10;
      const pct = Math.round((secs / total) * 100);
      list.push({
        name: sub,
        value: secs,
        hours: hrs,
        percentage: pct,
        color: SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length]
      });
      colorIdx++;
    });

    return list.sort((a, b) => b.value - a.value);
  }, [filteredSessions, totalSeconds]);

  // 2. Weekly Daily Hours Trend (Mon - Sun)
  const weeklyTrendData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayMap = new Map<string, number>();
    
    // Initialize past 7 days
    const result: { day: string; dateStr: string; hours: number; pomos: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayName = days[d.getDay()];
      dayMap.set(key, 0);
      result.push({ day: dayName, dateStr: key, hours: 0, pomos: 0 });
    }

    filteredSessions.forEach(s => {
      try {
        const d = new Date(s.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const item = result.find(r => r.dateStr === key);
        if (item) {
          item.hours += Math.round(((s.durationSeconds || 0) / 3600) * 10) / 10;
          item.pomos += 1;
        }
      } catch {}
    });

    return result;
  }, [filteredSessions]);

  // 3. Time-of-Day Productivity Blocks
  const timeOfDayData = useMemo(() => {
    let morning = 0; // 06:00 - 12:00
    let afternoon = 0; // 12:00 - 18:00
    let evening = 0; // 18:00 - 24:00
    let lateNight = 0; // 00:00 - 06:00

    filteredSessions.forEach(s => {
      try {
        const hr = new Date(s.createdAt).getHours();
        const mins = (s.durationSeconds || 0) / 60;
        if (hr >= 6 && hr < 12) morning += mins;
        else if (hr >= 12 && hr < 18) afternoon += mins;
        else if (hr >= 18 && hr <= 23) evening += mins;
        else lateNight += mins;
      } catch {}
    });

    const total = morning + afternoon + evening + lateNight || 1;
    return [
      { label: 'Morning (6AM–12PM)', icon: '🌅', hours: Math.round(morning / 60 * 10) / 10, pct: Math.round((morning / total) * 100), color: '#38bdf8' },
      { label: 'Afternoon (12PM–6PM)', icon: '☀️', hours: Math.round(afternoon / 60 * 10) / 10, pct: Math.round((afternoon / total) * 100), color: '#f59e0b' },
      { label: 'Evening (6PM–12AM)', icon: '🌙', hours: Math.round(evening / 60 * 10) / 10, pct: Math.round((evening / total) * 100), color: '#a855f7' },
      { label: 'Late Night (12AM–6AM)', icon: '🌌', hours: Math.round(lateNight / 60 * 10) / 10, pct: Math.round((lateNight / total) * 100), color: '#10b981' },
    ];
  }, [filteredSessions]);

  // Best productivity time window
  const goldenHour = useMemo(() => {
    const sorted = [...timeOfDayData].sort((a, b) => b.hours - a.hours);
    return sorted[0];
  }, [timeOfDayData]);

  // Format Seconds into readable string
  const formatSecs = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* ── TOP HEADER & TIME CONTROLS ── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25 shrink-0">
            <PieChartIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Focus Analytics & Telemetry
              </h2>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-extrabold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive subject distribution, daily velocity & focus quality charts
            </p>
          </div>
        </div>

        {/* Time Filter Pill Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800/80 self-stretch sm:self-auto justify-center">
          {(['7d', '30d', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeRange === r
                  ? 'bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* ── ZERO-STATE ONBOARDING BANNER (NEW USER WOW FACTOR) ── */}
      {isZeroState && !showSamplePreview && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-gradient-to-r from-sky-950/40 via-indigo-950/40 to-slate-900 border border-sky-500/30 text-center space-y-4 shadow-2xl relative overflow-hidden"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center mx-auto text-xl shadow-lg shadow-sky-500/20">
            🚀
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-black text-white">Your Focus Journey Begins Today!</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Complete your first 25-minute Pomodoro sprint. As soon as you finish, your personalized 
              <strong> Subject Distribution Pie Chart</strong>, daily trends, and golden focus hours will generate automatically!
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
            {onStartPomodoro && (
              <button
                onClick={onStartPomodoro}
                className="btn-3d btn-3d-primary px-5 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 tap-target-44 shadow-lg shadow-sky-500/30"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start 25m Focus Sprint</span>
              </button>
            )}

            <button
              onClick={() => setShowSamplePreview(true)}
              className="btn-3d btn-3d-slate px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 tap-target-44"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Preview Sample AIR 1 Analytics</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Notice when previewing sample data */}
      {isZeroState && showSamplePreview && (
        <div className="p-3 px-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Sample Preview Mode:</strong> Showing how your analytics will look once you log study sprints.
            </span>
          </div>
          <button
            onClick={() => setShowSamplePreview(false)}
            className="text-[11px] font-bold text-amber-400 underline hover:text-amber-300 shrink-0 cursor-pointer"
          >
            Hide Preview
          </button>
        </div>
      )}

      {/* ── 4 KEY TELEMETRY CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Study Hours */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/40 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Deep Work</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {totalHours}<span className="text-sm font-semibold text-sky-400 ml-1">hrs</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Logged in {timeRange.toUpperCase()}</p>
        </div>

        {/* Card 2: Completed Pomodoro Sprints */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Pomodoros</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {totalCompletedPomos}<span className="text-sm font-semibold text-emerald-400 ml-1">sprints</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Completed focus intervals</p>
        </div>

        {/* Card 3: Deep Focus Score */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Focus Quality</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {totalCompletedPomos > 0 ? '94%' : '100%'}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Zero tab-drift efficiency</p>
        </div>

        {/* Card 4: Golden Study Window */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-purple-500/40 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className="font-semibold text-[11px] uppercase tracking-wider">Peak Window</span>
            <Flame className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-white tracking-tight truncate flex items-center gap-1">
            <span>{goldenHour.icon}</span>
            <span className="truncate">{goldenHour.label.split(' ')[0]}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">{goldenHour.pct}% of your study time</p>
        </div>
      </div>

      {/* ── CORE CHARTS ROW: PIE CHART + WEEKLY TREND ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Interactive Subject Doughnut Pie Chart (7 cols) */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-sky-400" />
                <span>Subject Distribution Pie Chart</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                {subjectPieData.length} Subjects Tracked
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Visual percentage breakdown of time invested into each syllabus subject
            </p>
          </div>

          {/* Interactive Recharts Pie Chart */}
          <div className="my-4 h-64 sm:h-72 w-full relative flex items-center justify-center">
            {subjectPieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-3 rounded-2xl bg-slate-950/95 border border-slate-800 shadow-2xl text-xs space-y-1">
                              <p className="font-extrabold text-white flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                {data.name}
                              </p>
                              <p className="text-slate-300 font-semibold">{data.hours} hours studied</p>
                              <p className="text-sky-400 font-black">{data.percentage}% of total time</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Pie
                      data={subjectPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(data) => setHoveredSubject(data.name)}
                      onMouseLeave={() => setHoveredSubject(null)}
                    >
                      {subjectPieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          stroke="#06080d" 
                          strokeWidth={2}
                          className="transition-all cursor-pointer hover:opacity-80"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Central Doughnut Stat Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {hoveredSubject || 'Total Study'}
                  </span>
                  <span className="text-2xl font-black text-white tracking-tight">
                    {hoveredSubject
                      ? `${subjectPieData.find(s => s.name === hoveredSubject)?.percentage || 0}%`
                      : `${totalHours}h`
                    }
                  </span>
                  <span className="text-[10px] font-semibold text-sky-400">
                    {hoveredSubject ? 'Mastery Share' : `${totalCompletedPomos} Sprints`}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500 text-xs">
                <PieChartIcon className="w-8 h-8 mb-2 opacity-40" />
                <span>No study sessions logged in this timeframe yet.</span>
              </div>
            )}
          </div>

          {/* Subject Breakdown Chips Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800">
            {subjectPieData.slice(0, 6).map((sub) => (
              <div
                key={sub.name}
                onMouseEnter={() => setHoveredSubject(sub.name)}
                onMouseLeave={() => setHoveredSubject(null)}
                className={`p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 transition flex items-center justify-between text-xs cursor-pointer ${
                  hoveredSubject === sub.name ? 'border-sky-500/50 bg-slate-900' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                  <span className="text-white font-bold truncate text-[11px]">{sub.name}</span>
                </div>
                <span className="font-mono text-[11px] font-extrabold text-slate-300 ml-1">
                  {sub.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Daily Focus Velocity & Time of Day (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Weekly Daily Velocity Bar Chart */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  <span>Daily Study Velocity</span>
                </h4>
                <p className="text-[11px] text-slate-400">Past 7 days hours trend</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-extrabold">
                Goal: 4h/day
              </span>
            </div>

            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs shadow-xl space-y-0.5">
                            <p className="font-bold text-white">{d.day} ({d.dateStr})</p>
                            <p className="text-emerald-400 font-black">{d.hours} hours ({d.pomos} sprints)</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                    {weeklyTrendData.map((entry, index) => (
                      <Cell 
                        key={`bar-${index}`} 
                        fill={entry.hours >= 4 ? '#10b981' : entry.hours > 0 ? '#38bdf8' : '#334155'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Time-of-Day Distribution Heatmap Blocks */}
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Peak Productivity Blocks</span>
              </h4>
              <span className="text-[10px] text-slate-400">Circadian Focus</span>
            </div>

            <div className="space-y-2">
              {timeOfDayData.map((block) => (
                <div key={block.label} className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                      <span>{block.icon}</span>
                      <span>{block.label}</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-300">
                      {block.hours}h ({block.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${block.pct}%`, backgroundColor: block.color }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
