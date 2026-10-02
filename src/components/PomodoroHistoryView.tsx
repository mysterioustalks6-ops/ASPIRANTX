import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Calendar, 
  Flame, 
  BookOpen, 
  BarChart2, 
  Sparkles,
  RotateCcw,
  TrendingUp,
  Award,
  Layers,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { StudySession } from '../types';
import { loadStudySessions } from '../lib/gamification';
import { GalaxyStudyChecklist } from './GalaxyStudyChecklist';

interface PomodoroHistoryViewProps {
  userId?: string;
}

export type HistoryRange = 'Day' | 'Week' | 'Month' | 'Year';

interface NormalizedSession {
  id: string;
  subject: string;
  topic: string;
  completedDuration: number; // in seconds
  startTime: string;
  endTime: string;
  createdAt: string;
  dateObj: Date;
  dateStr: string; // YYYY-MM-DD
}

export const PomodoroHistoryView: React.FC<PomodoroHistoryViewProps> = ({ userId }) => {
  const [historyRange, setHistoryRange] = useState<HistoryRange>('Week');
  const [periodOffset, setPeriodOffset] = useState<number>(0);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  
  const [sessions, setSessions] = useState<NormalizedSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Fetch sessions on mount
  const fetchSessions = async () => {
    setIsLoading(true);
    let rawSessions: any[] = [];

    // Try fetching from Express API
    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/user/study-sessions', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.sessions)) {
          rawSessions = data.sessions;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch study-sessions from API, checking local storage:', e);
    }

    // Combine with local study sessions from gamification store
    try {
      const local = await loadStudySessions(userId);
      if (Array.isArray(local) && local.length > 0) {
        // Merge without duplicating IDs
        const existingIds = new Set(rawSessions.map((s) => s.id));
        local.forEach((ls) => {
          if (!existingIds.has(ls.id)) {
            rawSessions.push({
              id: ls.id,
              subject: ls.subject,
              topic: 'Study Sprint',
              completedDuration: ls.durationSeconds,
              createdAt: ls.createdAt,
            });
          }
        });
      }
    } catch (e) {}

    // Normalize session fields
    const normalized: NormalizedSession[] = rawSessions.map((s, idx) => {
      const createdIso = s.createdAt || s.created_at || new Date().toISOString();
      const d = new Date(createdIso);

      // Duration resolution (seconds)
      let secs = 0;
      if (typeof s.completedDuration === 'number' && s.completedDuration > 0) {
        secs = s.completedDuration;
      } else if (typeof s.durationSeconds === 'number' && s.durationSeconds > 0) {
        secs = s.durationSeconds;
      } else if (typeof s.duration === 'number' && s.duration > 0) {
        secs = s.duration * 60; // minutes to seconds
      }

      // Start & End Time strings
      let startStr = s.startTime || s.start_time || '';
      let endStr = s.endTime || s.end_time || '';

      if (!startStr) {
        startStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (startStr.includes('T')) {
        try {
          startStr = new Date(startStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {}
      }

      if (!endStr) {
        const endD = new Date(d.getTime() + secs * 1000);
        endStr = endD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (endStr.includes('T')) {
        try {
          endStr = new Date(endStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {}
      }

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      return {
        id: s.id || `session_${idx}_${Date.now()}`,
        subject: s.subject || 'General Study',
        topic: s.topic || 'Study Sprint',
        completedDuration: secs,
        startTime: startStr,
        endTime: endStr,
        createdAt: createdIso,
        dateObj: d,
        dateStr,
      };
    });

    setSessions(normalized);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchSessions();
  }, [userId]);

  // Reset selected bar when range or period offset changes
  useEffect(() => {
    setSelectedBarIndex(null);
  }, [historyRange, periodOffset]);

  // Helper date math & reference range calculation
  const referenceDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (historyRange === 'Day') {
      const d = new Date(today);
      d.setDate(d.getDate() + periodOffset);
      return d;
    }

    if (historyRange === 'Week') {
      const d = new Date(today);
      // Find Monday of current week (ISO week)
      const dayOfWeek = d.getDay(); // 0 is Sun, 1 is Mon
      const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      d.setDate(d.getDate() + diffToMon + periodOffset * 7);
      return d; // Monday of reference week
    }

    if (historyRange === 'Month') {
      const d = new Date(today.getFullYear(), today.getMonth() + periodOffset, 1);
      return d;
    }

    if (historyRange === 'Year') {
      const d = new Date(today.getFullYear() + periodOffset, 0, 1);
      return d;
    }

    return today;
  }, [historyRange, periodOffset]);

  // Period Label
  const periodLabel = useMemo(() => {
    const d = referenceDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (historyRange === 'Day') {
      const isToday = d.getTime() === today.getTime();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = d.getTime() === yesterday.getTime();

      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = d.getDate();

      if (isToday) return `Today — ${dayName}, ${monthName} ${dayNum}`;
      if (isYesterday) return `Yesterday — ${dayName}, ${monthName} ${dayNum}`;
      return `${dayName}, ${monthName} ${dayNum}, ${d.getFullYear()}`;
    }

    if (historyRange === 'Week') {
      const sunday = new Date(d);
      sunday.setDate(sunday.getDate() + 6);

      const startMonth = d.toLocaleDateString('en-US', { month: 'short' });
      const endMonth = sunday.toLocaleDateString('en-US', { month: 'short' });
      const startDay = d.getDate();
      const endDay = sunday.getDate();
      const year = d.getFullYear();

      if (startMonth === endMonth) {
        return `${startMonth} ${startDay} – ${endDay}, ${year}`;
      }
      return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
    }

    if (historyRange === 'Month') {
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    if (historyRange === 'Year') {
      return `${d.getFullYear()}`;
    }

    return '';
  }, [historyRange, referenceDate]);

  // Chart Buckets and Sessions filtering
  const { chartData, periodSessions, defaultSelectedBarIndex, selectedBarDetail } = useMemo(() => {
    let buckets: {
      label: string;
      fullLabel: string;
      dateKey?: string;
      startHour?: number;
      seconds: number;
      sessions: NormalizedSession[];
    }[] = [];

    let filteredSessions: NormalizedSession[] = [];

    if (historyRange === 'Day') {
      // 24 Hourly buckets for the selected day
      const targetDateStr = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}-${String(referenceDate.getDate()).padStart(2, '0')}`;
      filteredSessions = sessions.filter((s) => s.dateStr === targetDateStr);

      for (let hour = 0; hour < 24; hour++) {
        const hourSessions = filteredSessions.filter((s) => s.dateObj.getHours() === hour);
        const secs = hourSessions.reduce((acc, s) => acc + s.completedDuration, 0);

        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 === 0 ? 12 : hour % 12;
        const tickLabel = hour % 3 === 0 ? `${h12}${ampm}` : '';

        buckets.push({
          label: tickLabel || `${h12}${ampm}`,
          fullLabel: `${h12}:00 ${ampm}`,
          startHour: hour,
          seconds: secs,
          sessions: hourSessions,
        });
      }
    } else if (historyRange === 'Week') {
      // 7 Days (Mon - Sun)
      const mon = new Date(referenceDate);
      for (let i = 0; i < 7; i++) {
        const cur = new Date(mon);
        cur.setDate(mon.getDate() + i);

        const curDateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`;
        const daySessions = sessions.filter((s) => s.dateStr === curDateStr);
        const secs = daySessions.reduce((acc, s) => acc + s.completedDuration, 0);

        const dayShort = cur.toLocaleDateString('en-US', { weekday: 'short' });
        const monthShort = cur.toLocaleDateString('en-US', { month: 'short' });
        const dayNum = cur.getDate();

        buckets.push({
          label: dayShort,
          fullLabel: `${dayShort}, ${monthShort} ${dayNum}`,
          dateKey: curDateStr,
          seconds: secs,
          sessions: daySessions,
        });

        filteredSessions.push(...daySessions);
      }
    } else if (historyRange === 'Month') {
      // Days in reference month
      const year = referenceDate.getFullYear();
      const month = referenceDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const curDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const daySessions = sessions.filter((s) => s.dateStr === curDateStr);
        const secs = daySessions.reduce((acc, s) => acc + s.completedDuration, 0);

        const dObj = new Date(year, month, day);
        const dayShort = dObj.toLocaleDateString('en-US', { weekday: 'short' });
        const monthShort = dObj.toLocaleDateString('en-US', { month: 'short' });

        buckets.push({
          label: `${day}`,
          fullLabel: `${dayShort}, ${monthShort} ${day}`,
          dateKey: curDateStr,
          seconds: secs,
          sessions: daySessions,
        });

        filteredSessions.push(...daySessions);
      }
    } else if (historyRange === 'Year') {
      // 12 Months
      const year = referenceDate.getFullYear();
      for (let m = 0; m < 12; m++) {
        const mSessions = sessions.filter(
          (s) => s.dateObj.getFullYear() === year && s.dateObj.getMonth() === m
        );
        const secs = mSessions.reduce((acc, s) => acc + s.completedDuration, 0);

        const mObj = new Date(year, m, 1);
        const mShort = mObj.toLocaleDateString('en-US', { month: 'short' });
        const mFull = mObj.toLocaleDateString('en-US', { month: 'long' });

        buckets.push({
          label: mShort,
          fullLabel: `${mFull} ${year}`,
          seconds: secs,
          sessions: mSessions,
        });

        filteredSessions.push(...mSessions);
      }
    }

    // Default bar selection
    let defIndex = 0;
    if (historyRange === 'Day') {
      defIndex = new Date().getHours();
    } else if (historyRange === 'Week') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const foundIdx = buckets.findIndex((b) => b.dateKey === todayStr);
      defIndex = foundIdx !== -1 ? foundIdx : 6;
    } else if (historyRange === 'Month') {
      const today = new Date();
      if (today.getFullYear() === referenceDate.getFullYear() && today.getMonth() === referenceDate.getMonth()) {
        defIndex = Math.min(today.getDate() - 1, buckets.length - 1);
      } else {
        defIndex = buckets.length - 1;
      }
    } else if (historyRange === 'Year') {
      const today = new Date();
      if (today.getFullYear() === referenceDate.getFullYear()) {
        defIndex = today.getMonth();
      } else {
        defIndex = 11;
      }
    }

    const activeIdx = selectedBarIndex !== null ? selectedBarIndex : defIndex;
    const barDetail = buckets[activeIdx] || buckets[0];

    return {
      chartData: buckets,
      periodSessions: filteredSessions,
      defaultSelectedBarIndex: defIndex,
      selectedBarDetail: barDetail,
    };
  }, [sessions, historyRange, referenceDate, selectedBarIndex]);

  // Total duration across period (Kitne Hours Padha)
  const totalPeriodSeconds = useMemo(() => {
    return periodSessions.reduce((acc, s) => acc + s.completedDuration, 0);
  }, [periodSessions]);

  // Active study days in this period (Kitne Din Padha)
  const activeStudyDaysCount = useMemo(() => {
    const daysSet = new Set<string>();
    periodSessions.forEach((s) => {
      if (s.completedDuration > 0) {
        daysSet.add(s.dateStr);
      }
    });
    return daysSet.size;
  }, [periodSessions]);

  // All-time active study days
  const allTimeActiveStudyDays = useMemo(() => {
    const daysSet = new Set<string>();
    sessions.forEach((s) => {
      if (s.completedDuration > 0) {
        daysSet.add(s.dateStr);
      }
    });
    return daysSet.size;
  }, [sessions]);

  // Average daily study time
  const averageDailySeconds = useMemo(() => {
    if (activeStudyDaysCount === 0) return 0;
    return Math.round(totalPeriodSeconds / activeStudyDaysCount);
  }, [totalPeriodSeconds, activeStudyDaysCount]);

  // Consistency percentage
  const totalDaysInPeriod = useMemo(() => {
    if (historyRange === 'Day') return 1;
    if (historyRange === 'Week') return 7;
    if (historyRange === 'Month') {
      const year = referenceDate.getFullYear();
      const month = referenceDate.getMonth();
      return new Date(year, month + 1, 0).getDate();
    }
    return 365;
  }, [historyRange, referenceDate]);

  const consistencyRate = Math.min(100, Math.round((activeStudyDaysCount / totalDaysInPeriod) * 100));

  // Subject-wise study distribution
  const subjectBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    periodSessions.forEach((s) => {
      const sub = s.subject || 'General Study';
      map.set(sub, (map.get(sub) || 0) + s.completedDuration);
    });

    const list: { subject: string; seconds: number; percentage: number }[] = [];
    const total = totalPeriodSeconds || 1;
    map.forEach((secs, sub) => {
      list.push({
        subject: sub,
        seconds: secs,
        percentage: Math.round((secs / total) * 100)
      });
    });

    return list.sort((a, b) => b.seconds - a.seconds);
  }, [periodSessions, totalPeriodSeconds]);

  // Selected bar duration
  const selectedBarSeconds = selectedBarDetail ? selectedBarDetail.seconds : 0;

  // Format Duration Helpers
  const formatDurationHM = (totalSecs: number) => {
    if (!totalSecs || totalSecs <= 0) return '0m';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (hrs > 0) {
      return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    }
    if (mins > 0) {
      return `${mins}m`;
    }
    return `${secs}s`;
  };

  const formatDurationHMS = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Filtered session logs list
  const displaySessions = useMemo(() => {
    if (selectedBarDetail && selectedBarDetail.sessions) {
      return selectedBarDetail.sessions;
    }
    return periodSessions;
  }, [selectedBarDetail, periodSessions]);

  // Group displaySessions by date for list rendering
  const groupedSessions = useMemo(() => {
    const map = new Map<string, NormalizedSession[]>();
    const sorted = [...displaySessions].sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

    sorted.forEach((s) => {
      const list = map.get(s.dateStr) || [];
      list.push(s);
      map.set(s.dateStr, list);
    });

    return Array.from(map.entries()).map(([dateStr, items]) => {
      const d = items[0].dateObj;
      const formattedHeader = d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return {
        dateStr,
        formattedHeader,
        items,
      };
    });
  }, [displaySessions]);

  // Format Recharts Y-Axis
  const formatYAxis = (secs: number) => {
    if (secs === 0) return '0';
    if (secs >= 3600) return `${Math.round(secs / 3600)}h`;
    return `${Math.round(secs / 60)}m`;
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* 1. TAB / TOGGLE ROW (Segmented Control) */}
      <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-2xl">
        <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-950 p-1 rounded-xl border border-slate-800/80">
          {(['Day', 'Week', 'Month', 'Year'] as HistoryRange[]).map((range) => (
            <button
              key={range}
              onClick={() => {
                setHistoryRange(range);
                setPeriodOffset(0);
              }}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                historyRange === range
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        <button
          onClick={fetchSessions}
          className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all hidden sm:flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          title="Refresh History Data"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* 2. DATE NAVIGATION ROW */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <button
          onClick={() => setPeriodOffset((prev) => prev - 1)}
          className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-all cursor-pointer"
          title="Previous Period"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-center">
          <Calendar className="w-4 h-4 text-purple-400 hidden sm:inline" />
          <span className="text-sm font-bold text-white tracking-wide">{periodLabel}</span>
        </div>

        <button
          onClick={() => setPeriodOffset((prev) => Math.min(0, prev + 1))}
          disabled={periodOffset >= 0}
          className={`p-2 rounded-xl border transition-all ${
            periodOffset >= 0
              ? 'bg-slate-950/40 text-slate-600 border-slate-800/40 cursor-not-allowed'
              : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 cursor-pointer'
          }`}
          title="Next Period (Clamped to Current)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 3. GALAXY ANALYTICS 4-METRIC HUD CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Kitne Hour Padha (Total Duration) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950 border border-indigo-500/25 space-y-1.5 backdrop-blur-xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] sm:text-[11px] font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" /> Kitne Hour Padha
          </span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-mono tracking-tight">
            {formatDurationHM(totalPeriodSeconds)}
          </div>
          <p className="text-[10px] font-medium text-slate-400">
            {periodSessions.length} focus sprint(s) in {historyRange.toLowerCase()}
          </p>
        </div>

        {/* Card 2: Kitne Din Padha (Active Study Days) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-slate-950 border border-cyan-500/25 space-y-1.5 backdrop-blur-xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] sm:text-[11px] font-black text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" /> Kitne Din Padha
          </span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-cyan-300 font-mono tracking-tight flex items-baseline gap-1.5">
            <span>{activeStudyDaysCount}</span>
            <span className="text-xs sm:text-sm font-bold text-slate-400">
              {historyRange === 'Week' ? '/ 7 Days' : 'Days Active'}
            </span>
          </div>
          <p className="text-[10px] font-medium text-slate-400">
            {consistencyRate}% consistency • {allTimeActiveStudyDays} all-time days
          </p>
        </div>

        {/* Card 3: Daily Average Study Time */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950 border border-emerald-500/25 space-y-1.5 backdrop-blur-xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] sm:text-[11px] font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Rozana Average
          </span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-300 font-mono tracking-tight">
            {formatDurationHM(averageDailySeconds)}
            <span className="text-xs font-semibold text-slate-400">/day</span>
          </div>
          <p className="text-[10px] font-medium text-slate-400">
            Per active study day
          </p>
        </div>

        {/* Card 4: Selected Interval Focus Time */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-purple-950/40 via-slate-900/90 to-slate-950 border border-purple-500/25 space-y-1.5 backdrop-blur-xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] sm:text-[11px] font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-pink-400" /> Selected Focus
          </span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-purple-300 font-mono tracking-tight">
            {formatDurationHM(selectedBarSeconds)}
          </div>
          <p className="text-[10px] font-bold text-purple-400/80 truncate">
            {selectedBarDetail ? selectedBarDetail.fullLabel : 'Current selection'}
          </p>
        </div>
      </div>

      {/* 4. GRAPHS & CHARTS SECTION */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl backdrop-blur-xl relative">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
              <BarChart2 className="w-4 h-4 text-purple-400" />
              Cosmic Study Activity Graph ({historyRange})
            </h4>
            <p className="text-[11px] text-slate-400">
              Interactive breakdown of your daily/hourly study patterns
            </p>
          </div>

          {/* Chart Type Toggle (Bar vs Area) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                chartType === 'bar'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              <span>Bar Chart</span>
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                chartType === 'area'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Trend Wave</span>
            </button>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(state) => {
                  if (state && typeof state.activeTooltipIndex === 'number') {
                    setSelectedBarIndex(state.activeTooltipIndex);
                  }
                }}
              >
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  interval={historyRange === 'Day' ? 2 : historyRange === 'Month' ? 4 : 0}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={formatYAxis}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-purple-500/40 p-3 rounded-2xl shadow-2xl text-xs space-y-1.5 backdrop-blur-xl">
                          <p className="font-black text-white flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            {data.fullLabel}
                          </p>
                          <p className="text-cyan-300 font-mono font-bold">
                            Study Time: {formatDurationHM(data.seconds)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {data.sessions ? data.sessions.length : 0} focus session(s)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="seconds" radius={[6, 6, 0, 0]} cursor="pointer">
                  {chartData.map((entry, index) => {
                    const activeIdx = selectedBarIndex !== null ? selectedBarIndex : defaultSelectedBarIndex;
                    const isSelected = index === activeIdx;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          isSelected
                            ? '#c084fc'
                            : entry.seconds > 0
                            ? '#38bdf8'
                            : '#1e293b'
                        }
                        className="transition-all duration-200 hover:opacity-80"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(state) => {
                  if (state && typeof state.activeTooltipIndex === 'number') {
                    setSelectedBarIndex(state.activeTooltipIndex);
                  }
                }}
              >
                <defs>
                  <linearGradient id="cosmicTrendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  interval={historyRange === 'Day' ? 2 : historyRange === 'Month' ? 4 : 0}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={formatYAxis}
                />
                <Tooltip
                  cursor={{ stroke: '#38bdf8', strokeWidth: 1, strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-cyan-500/40 p-3 rounded-2xl shadow-2xl text-xs space-y-1.5 backdrop-blur-xl">
                          <p className="font-black text-white">{data.fullLabel}</p>
                          <p className="text-cyan-300 font-mono font-bold">
                            Study Time: {formatDurationHM(data.seconds)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {data.sessions ? data.sessions.length : 0} session(s)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="seconds"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#cosmicTrendGradient)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. SUBJECT-WISE STUDY DISTRIBUTION */}
      {subjectBreakdown.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2 uppercase tracking-wider">
              <PieChart className="w-4 h-4 text-cyan-400" />
              Subject-wise Study Time Distribution
            </h4>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {subjectBreakdown.length} Subject(s)
            </span>
          </div>

          <div className="space-y-3">
            {subjectBreakdown.map((item, idx) => (
              <div key={item.subject} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    {item.subject}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-cyan-300 font-bold">{formatDurationHM(item.seconds)}</span>
                    <span className="text-slate-500 font-semibold">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 0
                        ? 'bg-gradient-to-r from-cyan-400 to-sky-500'
                        : idx === 1
                        ? 'bg-gradient-to-r from-purple-400 to-indigo-500'
                        : idx === 2
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                        : 'bg-gradient-to-r from-amber-400 to-orange-500'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. GALAXY STUDY TARGETS CHECKLIST (Modern Checkboxes) */}
      <GalaxyStudyChecklist userId={userId} />

      {/* 7. DETAILED SESSION LOG LIST */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" /> Detailed Session Logs ({displaySessions.length})
          </h4>
          {selectedBarIndex !== null && (
            <button
              onClick={() => setSelectedBarIndex(null)}
              className="text-[11px] font-bold text-purple-400 hover:text-purple-300 underline cursor-pointer"
            >
              Show all period sessions
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((k) => (
              <div key={k} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3.5 w-28 bg-slate-800 rounded" />
                  <div className="h-3 w-44 bg-slate-800/60 rounded" />
                </div>
                <div className="h-6 w-20 bg-slate-800/80 rounded-xl" />
              </div>
            ))}
          </div>
        ) : groupedSessions.length === 0 ? (
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h5 className="text-sm font-bold text-white">No Study Sessions in This Range</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                No focus hours logged for this period. Start a 25m or 45m Pomodoro sprint in the Timer tab to record verified study sessions.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedSessions.map((group) => (
              <div key={group.dateStr} className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  {group.formattedHeader}
                </div>

                <div className="space-y-2">
                  {group.items.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4 transition-all hover:border-slate-700"
                    >
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
                          <span>{session.startTime}</span>
                          <span className="text-slate-500">–</span>
                          <span>{session.endTime}</span>
                        </div>

                        <p className="text-xs text-slate-400 font-medium line-clamp-1">
                          <span className="text-purple-300 font-semibold">{session.subject}</span>
                          {session.topic && (
                            <>
                              <span className="mx-1.5 text-slate-600">•</span>
                              <span>{session.topic}</span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-cyan-300 font-mono">
                          {formatDurationHMS(session.completedDuration)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
