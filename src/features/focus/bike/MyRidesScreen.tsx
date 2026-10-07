import React, { useState, useMemo, useEffect } from 'react';
import { 
  loadSessions, 
  FocusSession, 
  isSessionCounted, 
  getCountedSecondsForSession, 
  getDailyCountedSecondsMap, 
  computeStreakDays, 
  getLocalDateKey 
} from '../../../lib/focus/sessionStore';
import { 
  ArrowLeft, 
  Play, 
  Flame, 
  Clock, 
  Calendar, 
  TrendingUp, 
  Award, 
  Tag, 
  Table, 
  BarChart2, 
  HelpCircle,
  Target,
  Sparkles
} from 'lucide-react';

export interface MyRidesScreenProps {
  userId: string;
  onBack: () => void;
  onStartRide: () => void;
  /** Test-only fixture data override; never shipped in production */
  customSessions?: FocusSession[];
}

type Period = 'today' | 'this_week' | 'this_month' | 'total';

export const MyRidesScreen: React.FC<MyRidesScreenProps> = ({
  userId,
  onBack,
  onStartRide,
  customSessions
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('this_week');
  const [showTable7Days, setShowTable7Days] = useState(false);
  const [showTable4Weeks, setShowTable4Weeks] = useState(false);
  const [showTableSubjects, setShowTableSubjects] = useState(false);

  // Load sessions strictly from sessionStore (or test override if provided in testing)
  const [allSessions, setAllSessions] = useState<FocusSession[]>(() => {
    if (customSessions) return customSessions;
    return loadSessions(userId);
  });

  useEffect(() => {
    if (customSessions) {
      setAllSessions(customSessions);
      return;
    }
    const reload = () => setAllSessions(loadSessions(userId));
    window.addEventListener('aspirantx_session_recorded', reload);
    return () => window.removeEventListener('aspirantx_session_recorded', reload);
  }, [userId, customSessions]);

  // Weekly target preference
  const weeklyTargetHours = useMemo(() => {
    try {
      const raw = localStorage.getItem(`aspirantx_bike_prefs_${userId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.weeklyTargetHours === 'number') return parsed.weeklyTargetHours;
      }
    } catch {}
    return 15; // default 15 hours
  }, [userId]);

  // Filter only counted sessions
  const countedSessions = useMemo(() => {
    return allSessions.filter(s => isSessionCounted(s));
  }, [allSessions]);

  const now = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => getLocalDateKey(now), [now]);

  // Helper date boundaries
  const startOfWeek = useMemo(() => {
    const d = new Date(now);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day; // Monday as start of week
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);

  const startOfMonth = useMemo(() => {
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
  }, [now]);

  // Aggregate metrics for a set of sessions
  const computeMetrics = (sessions: FocusSession[]) => {
    const totalSecs = sessions.reduce((acc, s) => acc + getCountedSecondsForSession(s), 0);
    const hours = Number((totalSecs / 3600).toFixed(1));
    const count = sessions.length;
    const avgMins = count > 0 ? Math.round((totalSecs / count) / 60) : 0;
    const longestMins = count > 0 ? Math.round(Math.max(...sessions.map(s => getCountedSecondsForSession(s))) / 60) : 0;
    return { hours, count, avgMins, longestMins, totalSecs };
  };

  // Metrics for Today, This Week, This Month, Total
  const todayMetrics = useMemo(() => {
    const subset = countedSessions.filter(s => getLocalDateKey(s.startedAt) === todayKey);
    return computeMetrics(subset);
  }, [countedSessions, todayKey]);

  const thisWeekMetrics = useMemo(() => {
    const subset = countedSessions.filter(s => new Date(s.startedAt) >= startOfWeek);
    return computeMetrics(subset);
  }, [countedSessions, startOfWeek]);

  const thisMonthMetrics = useMemo(() => {
    const subset = countedSessions.filter(s => new Date(s.startedAt) >= startOfMonth);
    return computeMetrics(subset);
  }, [countedSessions, startOfMonth]);

  const totalMetrics = useMemo(() => {
    return computeMetrics(countedSessions);
  }, [countedSessions]);

  const currentPeriodMetrics = useMemo(() => {
    switch (selectedPeriod) {
      case 'today': return todayMetrics;
      case 'this_week': return thisWeekMetrics;
      case 'this_month': return thisMonthMetrics;
      case 'total': return totalMetrics;
    }
  }, [selectedPeriod, todayMetrics, thisWeekMetrics, thisMonthMetrics, totalMetrics]);

  // Streak
  const streakDays = useMemo(() => {
    return computeStreakDays(allSessions, now);
  }, [allSessions, now]);

  // Daily map of counted seconds
  const dailyMap = useMemo(() => {
    return getDailyCountedSecondsMap(allSessions);
  }, [allSessions]);

  // Distinct study days count
  const distinctStudyDaysCount = useMemo(() => {
    return Object.keys(dailyMap).filter(k => (dailyMap[k] || 0) > 0).length;
  }, [dailyMap]);

  // 1. Chart Data: Last 7 Days (Hours)
  const last7DaysData = useMemo(() => {
    const days: { dateKey: string; label: string; hours: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = getLocalDateKey(d);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const secs = dailyMap[key] || 0;
      days.push({
        dateKey: key,
        label: i === 0 ? 'Today' : dayName,
        hours: Number((secs / 3600).toFixed(1))
      });
    }
    return days;
  }, [now, dailyMap]);

  const max7DaysHours = useMemo(() => {
    return Math.max(1, ...last7DaysData.map(d => d.hours));
  }, [last7DaysData]);

  // 2. Chart Data: Last 4 Weeks (Hours)
  const last4WeeksData = useMemo(() => {
    const weeks: { weekLabel: string; hours: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(startOfWeek);
      weekStart.setDate(weekStart.getDate() - w * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      let weekSecs = 0;
      countedSessions.forEach(s => {
        const st = new Date(s.startedAt);
        if (st >= weekStart && st < weekEnd) {
          weekSecs += getCountedSecondsForSession(s);
        }
      });

      const label = w === 0 ? 'This Wk' : `Wk -${w}`;
      weeks.push({
        weekLabel: label,
        hours: Number((weekSecs / 3600).toFixed(1))
      });
    }
    return weeks;
  }, [startOfWeek, countedSessions]);

  const max4WeeksHours = useMemo(() => {
    return Math.max(1, ...last4WeeksData.map(w => w.hours));
  }, [last4WeeksData]);

  // 3. Calendar Heatmap: Last 12 Weeks (84 Days)
  const heatmapData = useMemo(() => {
    const days: { dateKey: string; hours: number; intensity: number; isToday: boolean }[] = [];
    const totalDays = 12 * 7;
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = getLocalDateKey(d);
      const secs = dailyMap[key] || 0;
      const hrs = Number((secs / 3600).toFixed(1));

      let intensity = 0;
      if (hrs > 0 && hrs < 1) intensity = 1;
      else if (hrs >= 1 && hrs < 3) intensity = 2;
      else if (hrs >= 3 && hrs < 5) intensity = 3;
      else if (hrs >= 5) intensity = 4;

      days.push({
        dateKey: key,
        hours: hrs,
        intensity,
        isToday: key === todayKey
      });
    }
    return days;
  }, [now, dailyMap, todayKey]);

  // 4. Subject Split with honest "No subject tagged"
  const subjectSplit = useMemo(() => {
    const totals: Record<string, number> = {};
    let totalSecs = 0;

    countedSessions.forEach(s => {
      const subj = s.subject && s.subject.trim() !== '' ? s.subject.trim() : 'No subject tagged';
      const secs = getCountedSecondsForSession(s);
      totals[subj] = (totals[subj] || 0) + secs;
      totalSecs += secs;
    });

    const entries = Object.entries(totals).map(([subj, secs]) => ({
      subject: subj,
      hours: Number((secs / 3600).toFixed(1)),
      percentage: totalSecs > 0 ? Math.round((secs / totalSecs) * 100) : 0
    }));

    return entries.sort((a, b) => b.hours - a.hours);
  }, [countedSessions]);

  // 5. Best Study Hour of Day (>= 7 distinct study days required)
  const bestHourOfDay = useMemo(() => {
    if (distinctStudyDaysCount < 7) {
      return { status: 'insufficient', label: 'Not enough data yet (>= 7 study days needed)' };
    }

    const hourCounts: number[] = new Array(24).fill(0);
    countedSessions.forEach(s => {
      const hour = new Date(s.startedAt).getHours();
      hourCounts[hour] += getCountedSecondsForSession(s);
    });

    let bestH = 0;
    let maxSecs = 0;
    hourCounts.forEach((secs, h) => {
      if (secs > maxSecs) {
        maxSecs = secs;
        bestH = h;
      }
    });

    if (maxSecs === 0) {
      return { status: 'insufficient', label: 'Not enough data yet' };
    }

    const periodStr = bestH >= 12 ? 'PM' : 'AM';
    const displayHour = bestH % 12 === 0 ? 12 : bestH % 12;
    return {
      status: 'available',
      label: `${displayHour}:00 ${periodStr} - ${(displayHour % 12) + 1}:00 ${periodStr}`,
      bestH
    };
  }, [distinctStudyDaysCount, countedSessions]);

  // 6. Missed Days this week
  const missedDaysThisWeek = useMemo(() => {
    const missed: string[] = [];
    const todayDayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // 1=Mon .. 7=Sun

    for (let dayOffset = 1; dayOffset < todayDayOfWeek; dayOffset++) {
      const checkDate = new Date(startOfWeek);
      checkDate.setDate(checkDate.getDate() + (dayOffset - 1));
      const key = getLocalDateKey(checkDate);
      if (!dailyMap[key] || dailyMap[key] === 0) {
        missed.push(checkDate.toLocaleDateString('en-US', { weekday: 'long' }));
      }
    }
    return missed;
  }, [now, startOfWeek, dailyMap]);

  // ── EMPTY STATE VIEW ──
  if (countedSessions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 max-w-4xl mx-auto select-none">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold p-2 rounded-xl hover:bg-slate-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black tracking-wide text-white">MY RIDES</h1>
            <p className="text-[11px] text-slate-400 font-mono">Performance & Analytics</p>
          </div>
          <div className="w-16" />
        </div>

        {/* Empty State Card */}
        <div className="my-auto py-16 flex flex-col items-center justify-center text-center px-4 space-y-6">
          <div className="w-24 h-24 rounded-3xl bg-slate-900/90 border border-slate-800 flex items-center justify-center shadow-xl shadow-indigo-500/5">
            <TrendingUp className="w-12 h-12 text-slate-500" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h2 className="text-xl font-black text-white">No Rides Logged Yet</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete your first study ride on the highway to unlock precision pace tracking, subject distribution, and streak analytics.
            </p>
          </div>
          <button
            onClick={onStartRide}
            className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center space-x-2 text-sm transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start a ride</span>
          </button>
        </div>

        <div className="text-center text-[11px] text-slate-400 font-mono pb-2">
          StudyRide Telemetry Engine • Calm Highway
        </div>
      </div>
    );
  }

  // ── POPULATED ANALYTICS VIEW ──
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 md:p-8 max-w-4xl mx-auto space-y-6 select-none">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold p-2 rounded-xl hover:bg-slate-900"
          aria-label="Back to Previous Screen"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black tracking-wide text-white">MY RIDES</h1>
          <p className="text-[11px] text-slate-400 font-mono">Calm Highway Study Telemetry</p>
        </div>
        <button
          onClick={onStartRide}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-md shadow-indigo-600/20"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Ride</span>
        </button>
      </div>

      {/* ── PERIOD TOGGLE ── */}
      <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-xs font-bold">
        {(['today', 'this_week', 'this_month', 'total'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setSelectedPeriod(p)}
            className={`flex-1 py-2 rounded-xl transition-all capitalize text-[12px] ${
              selectedPeriod === p
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {p.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* ── 4 SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Counted Hours</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{currentPeriodMetrics.hours}</span>
            <span className="text-xs text-slate-400 ml-1 font-mono">hrs</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Rides Completed</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{currentPeriodMetrics.count}</span>
            <span className="text-xs text-slate-400 ml-1 font-mono">sessions</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Avg Session</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{currentPeriodMetrics.avgMins}</span>
            <span className="text-xs text-slate-400 ml-1 font-mono">mins</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Longest Ride</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white">{currentPeriodMetrics.longestMins}</span>
            <span className="text-xs text-slate-400 ml-1 font-mono">mins</span>
          </div>
        </div>
      </div>

      {/* ── TARGET VS ACTUAL & STREAK BANNER ── */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Weekly Target vs Actual</h2>
              <p className="text-[11px] text-slate-400">
                Goal: {weeklyTargetHours}h • Completed: {thisWeekMetrics.hours}h ({Math.min(100, Math.round((thisWeekMetrics.hours / weeklyTargetHours) * 100))}%)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-bold">
              <Flame className="w-4 h-4 fill-amber-400" />
              <span>{streakDays} Day Streak</span>
            </div>
          </div>
        </div>

        {/* Target Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(2, Math.round((thisWeekMetrics.hours / weeklyTargetHours) * 100)))}%` }}
          />
        </div>

        {/* Missed / Rest Days info */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 gap-2 border-t border-slate-800/60">
          <span>
            {missedDaysThisWeek.length > 0 ? (
              <span className="text-amber-400">Missed days this week: {missedDaysThisWeek.join(', ')}</span>
            ) : (
              <span className="text-emerald-400">On track! Zero missed days this week.</span>
            )}
          </span>
          <span className="text-slate-400">Rest/pause days protected</span>
        </div>
      </div>

      {/* ── CHART 1: LAST 7 DAYS (BARS) ── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Daily Focus Hours (Last 7 Days)</h2>
          </div>
          <button
            onClick={() => setShowTable7Days(!showTable7Days)}
            className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 border border-slate-800 px-2.5 py-1 rounded-xl hover:bg-slate-800/60"
            aria-label="Toggle Table View for Last 7 Days"
          >
            <Table className="w-3 h-3" />
            <span>{showTable7Days ? 'Hide Table' : 'Table View'}</span>
          </button>
        </div>

        {showTable7Days ? (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse border border-slate-800">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-2">Day</th>
                  <th className="p-2">Date</th>
                  <th className="p-2 text-right">Study Hours</th>
                </tr>
              </thead>
              <tbody>
                {last7DaysData.map(d => (
                  <tr key={d.dateKey} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="p-2 font-bold text-white">{d.label}</td>
                    <td className="p-2 font-mono text-slate-400">{d.dateKey}</td>
                    <td className="p-2 text-right font-mono text-emerald-400">{d.hours} hrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            role="img"
            aria-label={`Bar chart of last 7 days study hours: ${last7DaysData.map(d => `${d.label}: ${d.hours}h`).join(', ')}`}
            className="flex items-end justify-between h-40 pt-4 px-2 border-b border-slate-800/80 gap-2"
          >
            {last7DaysData.map(d => {
              const heightPercent = Math.max(6, Math.round((d.hours / max7DaysHours) * 100));
              return (
                <div key={d.dateKey} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <span className="text-[11px] font-mono text-slate-400 mb-1 group-hover:text-white transition-colors">
                    {d.hours > 0 ? `${d.hours}h` : '0'}
                  </span>
                  <div className="w-full max-w-[32px] bg-slate-950 rounded-t-lg h-full flex items-end overflow-hidden">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        d.hours > 0
                          ? 'bg-gradient-to-t from-indigo-600 to-emerald-400 group-hover:from-indigo-500 group-hover:to-emerald-300'
                          : 'bg-slate-800/40'
                      }`}
                    />
                  </div>
                  <span className="text-[12px] font-bold text-slate-400 mt-2 truncate max-w-full">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CHART 2: LAST 4 WEEKS ── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Weekly Progression (Last 4 Weeks)</h2>
          </div>
          <button
            onClick={() => setShowTable4Weeks(!showTable4Weeks)}
            className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 border border-slate-800 px-2.5 py-1 rounded-xl hover:bg-slate-800/60"
            aria-label="Toggle Table View for Last 4 Weeks"
          >
            <Table className="w-3 h-3" />
            <span>{showTable4Weeks ? 'Hide Table' : 'Table View'}</span>
          </button>
        </div>

        {showTable4Weeks ? (
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse border border-slate-800">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="p-2">Period</th>
                  <th className="p-2 text-right">Counted Hours</th>
                </tr>
              </thead>
              <tbody>
                {last4WeeksData.map(w => (
                  <tr key={w.weekLabel} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="p-2 font-bold text-white">{w.weekLabel}</td>
                    <td className="p-2 text-right font-mono text-emerald-400">{w.hours} hrs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            role="img"
            aria-label={`Chart of last 4 weeks progression: ${last4WeeksData.map(w => `${w.weekLabel}: ${w.hours}h`).join(', ')}`}
            className="flex items-end justify-around h-36 pt-4 px-4 border-b border-slate-800/80 gap-4"
          >
            {last4WeeksData.map(w => {
              const heightPercent = Math.max(8, Math.round((w.hours / max4WeeksHours) * 100));
              return (
                <div key={w.weekLabel} className="flex-1 flex flex-col items-center h-full justify-end group">
                  <span className="text-[11px] font-mono text-slate-400 mb-1 group-hover:text-white transition-colors">
                    {w.hours}h
                  </span>
                  <div className="w-full max-w-[48px] bg-slate-950 rounded-t-xl h-full flex items-end overflow-hidden">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-emerald-600 to-indigo-500 rounded-t-xl transition-all duration-500"
                    />
                  </div>
                  <span className="text-[12px] font-bold text-slate-400 mt-2 truncate">
                    {w.weekLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── CHART 3: CALENDAR HEATMAP (LAST 12 WEEKS) ── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Study Consistency Heatmap (Last 12 Weeks)</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">84 Days</span>
        </div>

        <div
          role="img"
          aria-label="Calendar heatmap of last 12 weeks study intensity"
          className="grid grid-cols-12 gap-1.5 pt-2"
        >
          {heatmapData.map(day => {
            const bgClass = {
              0: 'bg-slate-950 border border-slate-800/60',
              1: 'bg-emerald-950/80 border border-emerald-800/40 text-emerald-300',
              2: 'bg-emerald-700/80 border border-emerald-500/50',
              3: 'bg-emerald-500 border border-emerald-400',
              4: 'bg-emerald-300 border border-white'
            }[day.intensity];

            return (
              <div
                key={day.dateKey}
                title={`${day.dateKey}: ${day.hours} hrs`}
                className={`h-6 rounded-md transition-transform hover:scale-110 flex items-center justify-center text-[9px] font-mono ${bgClass} ${
                  day.isToday ? 'ring-2 ring-indigo-400' : ''
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
          <span>Less active</span>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 rounded-sm bg-slate-950 border border-slate-800" />
            <div className="w-3 h-3 rounded-sm bg-emerald-950 border border-emerald-800/40" />
            <div className="w-3 h-3 rounded-sm bg-emerald-700" />
            <div className="w-3 h-3 rounded-sm bg-emerald-500" />
            <div className="w-3 h-3 rounded-sm bg-emerald-300" />
          </div>
          <span>More active (5h+)</span>
        </div>
      </div>

      {/* ── SUBJECT SPLIT & BEST STUDY HOUR ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Subject Split */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Subject Breakdown</h2>
            </div>
            <button
              onClick={() => setShowTableSubjects(!showTableSubjects)}
              className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 border border-slate-800 px-2 py-0.5 rounded-lg"
              aria-label="Toggle Subject Breakdown Table View"
            >
              <Table className="w-3 h-3" />
              <span>{showTableSubjects ? 'Hide' : 'Table'}</span>
            </button>
          </div>

          {showTableSubjects ? (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse border border-slate-800">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="p-2">Subject</th>
                    <th className="p-2 text-right">Hours</th>
                    <th className="p-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectSplit.map(s => (
                    <tr key={s.subject} className="border-b border-slate-800/60">
                      <td className="p-2 font-bold text-white">{s.subject}</td>
                      <td className="p-2 text-right font-mono text-emerald-400">{s.hours}h</td>
                      <td className="p-2 text-right font-mono text-slate-400">{s.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="space-y-3">
              {subjectSplit.map(s => (
                <div key={s.subject} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                      {s.subject}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">
                      {s.hours}h ({s.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        s.subject === 'No subject tagged'
                          ? 'bg-slate-500'
                          : 'bg-gradient-to-r from-indigo-500 to-emerald-400'
                      }`}
                      style={{ width: `${Math.max(2, s.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Best Study Hour */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Peak Productivity Hour</h2>
          </div>

          <div className="my-auto py-4 text-center space-y-2">
            {bestHourOfDay.status === 'available' ? (
              <>
                <div className="text-2xl font-black text-amber-400">
                  {bestHourOfDay.label}
                </div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Your deepest focus concentration is empirically observed during this window.
                </p>
              </>
            ) : (
              <div className="space-y-2 py-4">
                <div className="w-10 h-10 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {bestHourOfDay.label}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-800/60 pt-2 text-[11px] text-slate-400 text-center font-mono">
            Calibrated on {distinctStudyDaysCount} / 7 required days
          </div>
        </div>
      </div>
    </div>
  );
};
