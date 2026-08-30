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
  RotateCcw
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { StudySession } from '../types';
import { loadStudySessions } from '../lib/gamification';

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
      // d is Monday
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

    // Default bar selection (e.g. today or latest bar with data)
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

  // Total duration across period
  const totalPeriodSeconds = useMemo(() => {
    return periodSessions.reduce((acc, s) => acc + s.completedDuration, 0);
  }, [periodSessions]);

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

  // Filtered session logs list (show sessions for selected bar/date, or period if no selection)
  const displaySessions = useMemo(() => {
    if (selectedBarDetail && selectedBarDetail.sessions) {
      return selectedBarDetail.sessions;
    }
    return periodSessions;
  }, [selectedBarDetail, periodSessions]);

  // Group displaySessions by date for list rendering
  const groupedSessions = useMemo(() => {
    const map = new Map<string, NormalizedSession[]>();
    // Sort sessions descending by date/time
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
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                historyRange === range
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        <button
          onClick={fetchSessions}
          className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all hidden sm:flex items-center gap-1.5 text-xs font-semibold"
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

      {/* 3. SUMMARY NUMBERS STATS */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Duration */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-1 backdrop-blur-xl shadow-lg">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-400" /> Total duration
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
            {formatDurationHM(totalPeriodSeconds)}
          </div>
          <p className="text-[10px] font-medium text-slate-500">Across full {historyRange.toLowerCase()} period</p>
        </div>

        {/* Selected Bar Duration */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-1 backdrop-blur-xl shadow-lg">
          <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-pink-400" /> Duration
          </span>
          <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono tracking-tight">
            {formatDurationHM(selectedBarSeconds)}
          </div>
          <p className="text-[10px] font-bold text-purple-400/80 truncate">
            {selectedBarDetail ? selectedBarDetail.fullLabel : 'Selected Bar'}
          </p>
        </div>
      </div>

      {/* 4. BAR CHART */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
            <BarChart2 className="w-4 h-4 text-purple-400" /> Study Activity Breakdown ({historyRange})
          </h4>
          <span className="text-[11px] font-medium text-slate-500">Tap bar to view specific log</span>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
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
                      <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                        <p className="font-bold text-white">{data.fullLabel}</p>
                        <p className="text-purple-400 font-mono font-bold">
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
              <Bar dataKey="seconds" radius={[6, 6, 0, 0]} cursor="pointer">
                {chartData.map((entry, index) => {
                  const activeIdx = selectedBarIndex !== null ? selectedBarIndex : defaultSelectedBarIndex;
                  const isSelected = index === activeIdx;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        isSelected
                          ? '#c084fc' // Bright vibrant purple for active/selected bar
                          : entry.seconds > 0
                          ? '#475569' // Muted slate gray for non-zero bars
                          : '#1e293b' // Dark background bar for zero bars
                      }
                      className="transition-all duration-200 hover:opacity-80"
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. SESSION LOG LIST (below chart) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" /> Session Logs ({displaySessions.length})
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

        {groupedSessions.length === 0 ? (
          /* Empty State */
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h5 className="text-sm font-bold text-white">No Study Sessions Logged</h5>
              <p className="text-xs text-slate-400">
                No study sessions logged yet — start a Pomodoro to see your history here.
              </p>
            </div>
          </div>
        ) : (
          /* Session Groups */
          <div className="space-y-4">
            {groupedSessions.map((group) => (
              <div key={group.dateStr} className="space-y-2">
                {/* Date Sub-header */}
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  {group.formattedHeader}
                </div>

                {/* Session Rows */}
                <div className="space-y-2">
                  {group.items.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4 transition-all hover:border-slate-700"
                    >
                      <div className="space-y-1">
                        {/* Time Range */}
                        <div className="text-xs font-bold text-white font-mono flex items-center gap-2">
                          <span>{session.startTime}</span>
                          <span className="text-slate-500">–</span>
                          <span>{session.endTime}</span>
                        </div>

                        {/* Subject / Topic Subtitle */}
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

                      {/* Duration HH:MM:SS */}
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
