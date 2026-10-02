import { useState, useEffect, useRef, useCallback } from 'react';
import { saveStudySessionLog, loadStudySessions } from '../../../lib/gamification';

export interface UseFocusSessionOptions {
  userId?: string;
  defaultDurationMinutes?: number;
  initialSubject?: string;
  initialTopic?: string;
}

export interface CompletedSessionData {
  sessionId: string;
  durationMinutes: number;
  durationSeconds: number;
  subject: string;
  topic: string;
  mode: 'pomodoro' | 'stopwatch';
  completedAt: string;
}

export function useFocusSession({
  userId = 'guest',
  defaultDurationMinutes = 25,
  initialSubject = 'General Study',
  initialTopic = 'Focus Sprint'
}: UseFocusSessionOptions = {}) {
  const [mode, setMode] = useState<'pomodoro' | 'stopwatch'>('pomodoro');
  const [selectedDuration, setSelectedDuration] = useState<number>(defaultDurationMinutes);
  const [pomoMinutes, setPomoMinutes] = useState<number>(defaultDurationMinutes);
  const [pomoSeconds, setPomoSeconds] = useState<number>(0);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [subject, setSubject] = useState<string>(initialSubject);
  const [topic, setTopic] = useState<string>(initialTopic);
  const [lastCompletedSession, setLastCompletedSession] = useState<CompletedSessionData | null>(null);

  const sessionIdRef = useRef<string>('session_' + Date.now());
  const stopwatchStartedAtMsRef = useRef<number | null>(null);
  const stopwatchAccumulatedSecsRef = useRef<number>(0);

  // Restore Active Session State from LocalStorage
  useEffect(() => {
    try {
      const storageKey = `aspirantx_active_focus_session_${userId}`;
      const savedRaw = localStorage.getItem(storageKey);
      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        if (saved.mode) setMode(saved.mode);
        if (saved.selectedDuration) setSelectedDuration(saved.selectedDuration);
        if (typeof saved.pomoMinutes === 'number') setPomoMinutes(saved.pomoMinutes);
        if (typeof saved.pomoSeconds === 'number') setPomoSeconds(saved.pomoSeconds);
        if (typeof saved.stopwatchSeconds === 'number') setStopwatchSeconds(saved.stopwatchSeconds);
        if (saved.subject) setSubject(saved.subject);
        if (saved.topic) setTopic(saved.topic);
      }
    } catch {}
  }, [userId]);

  // Save Active Session State to LocalStorage
  useEffect(() => {
    if (isActive || isPaused) {
      try {
        localStorage.setItem(`aspirantx_active_focus_session_${userId}`, JSON.stringify({
          sessionId: sessionIdRef.current,
          mode,
          selectedDuration,
          pomoMinutes,
          pomoSeconds,
          stopwatchSeconds,
          subject,
          topic,
          isActive,
          isPaused,
          updatedAt: new Date().toISOString()
        }));
      } catch {}
    }
  }, [userId, mode, selectedDuration, pomoMinutes, pomoSeconds, stopwatchSeconds, subject, topic, isActive, isPaused]);

  // Pomodoro Countdown Interval
  useEffect(() => {
    let interval: any = null;
    if (isActive && !isPaused && mode === 'pomodoro') {
      interval = setInterval(() => {
        setPomoSeconds(sec => {
          if (sec > 0) return sec - 1;
          setPomoMinutes(min => {
            if (min > 0) {
              return min - 1;
            } else {
              // Timer Reached 00:00
              setIsActive(false);
              completeSession();
              return 0;
            }
          });
          return 59;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, mode]);

  // Stopwatch Interval
  useEffect(() => {
    let interval: any = null;
    if (isActive && !isPaused && mode === 'stopwatch') {
      interval = setInterval(() => {
        setStopwatchSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, mode]);

  // Start Session
  const startTimer = useCallback(() => {
    sessionIdRef.current = 'session_' + Date.now();
    setIsActive(true);
    setIsPaused(false);
  }, []);

  // Pause Session
  const pauseTimer = useCallback(() => {
    setIsPaused(true);
  }, []);

  // Resume Session
  const resumeTimer = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Complete / Finish Session
  const completeSession = useCallback(async (): Promise<CompletedSessionData> => {
    setIsActive(false);
    setIsPaused(false);

    let durationMins = 0;
    let durationSecs = 0;

    if (mode === 'pomodoro') {
      const elapsedSecs = selectedDuration * 60 - (pomoMinutes * 60 + pomoSeconds);
      durationSecs = Math.max(60, elapsedSecs);
      durationMins = Math.max(1, Math.round(durationSecs / 60));
    } else {
      durationSecs = Math.max(60, stopwatchSeconds);
      durationMins = Math.max(1, Math.round(durationSecs / 60));
    }

    const sessionData: CompletedSessionData = {
      sessionId: sessionIdRef.current,
      durationMinutes: durationMins,
      durationSeconds: durationSecs,
      subject: subject || 'General Study',
      topic: topic || 'Focus Sprint',
      mode,
      completedAt: new Date().toISOString()
    };

    setLastCompletedSession(sessionData);

    // Save to study session log asynchronously
    try {
      await saveStudySessionLog({
        userId,
        subject: sessionData.subject,
        durationSeconds: durationSecs,
        mode
      });
      localStorage.removeItem(`aspirantx_active_focus_session_${userId}`);
    } catch (e) {
      console.warn('Error saving study session log:', e);
    }

    // Reset timer counts
    if (mode === 'pomodoro') {
      setPomoMinutes(selectedDuration);
      setPomoSeconds(0);
    } else {
      setStopwatchSeconds(0);
    }

    return sessionData;
  }, [mode, selectedDuration, pomoMinutes, pomoSeconds, stopwatchSeconds, subject, topic, userId]);

  // Reset Session
  const resetTimer = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    if (mode === 'pomodoro') {
      setPomoMinutes(selectedDuration);
      setPomoSeconds(0);
    } else {
      setStopwatchSeconds(0);
    }
    try {
      localStorage.removeItem(`aspirantx_active_focus_session_${userId}`);
    } catch {}
  }, [mode, selectedDuration, userId]);

  // Set Duration
  const setDurationMinutes = useCallback((mins: number) => {
    setSelectedDuration(mins);
    setPomoMinutes(mins);
    setPomoSeconds(0);
    setIsActive(false);
    setIsPaused(false);
  }, []);

  return {
    mode,
    setMode,
    selectedDuration,
    setDurationMinutes,
    pomoMinutes,
    pomoSeconds,
    stopwatchSeconds,
    isActive,
    isPaused,
    subject,
    setSubject,
    topic,
    setTopic,
    lastCompletedSession,
    startTimer,
    pauseTimer,
    resumeTimer,
    completeSession,
    resetTimer
  };
}
