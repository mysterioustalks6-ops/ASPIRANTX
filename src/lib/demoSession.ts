export const DEMO_DURATION_STORAGE_KEY = 'aspirantx_demo_duration_minutes';
export const DEMO_START_STORAGE_KEY = 'aspirantx_demo_session_start';

// Default demo duration is 10 minutes unless changed by Admin
export function getDemoDurationMinutes(): number {
  try {
    const val = localStorage.getItem(DEMO_DURATION_STORAGE_KEY);
    if (val) {
      const num = Number(val);
      if (!isNaN(num) && num > 0) return num;
    }
  } catch (e) {
    console.warn('Error reading demo duration:', e);
  }
  return 10; // Default 10 minutes
}

export async function fetchServerDemoDurationMinutes(): Promise<number> {
  try {
    const res = await fetch('/api/admin/demo-limits');
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.demoDurationMinutes === 'number' && data.demoDurationMinutes > 0) {
        localStorage.setItem(DEMO_DURATION_STORAGE_KEY, String(data.demoDurationMinutes));
        return data.demoDurationMinutes;
      }
    }
  } catch (e) {
    console.warn('Error fetching demo limits from server:', e);
  }
  return getDemoDurationMinutes();
}

export function setDemoDurationMinutes(minutes: number): void {
  try {
    localStorage.setItem(DEMO_DURATION_STORAGE_KEY, String(minutes));

    // Persist to server Admin Database
    fetch('/api/admin/demo-limits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ demoDurationMinutes: minutes }),
    }).catch((err) => console.warn('Failed to sync demo limits with server:', err));

    try {
      window.dispatchEvent(new CustomEvent('aspirantx_customizer_updated'));
    } catch (err) {
      try {
        const evt = document.createEvent('CustomEvent');
        evt.initCustomEvent('aspirantx_customizer_updated', false, false, null);
        window.dispatchEvent(evt);
      } catch (e2) {
        console.warn('CustomEvent dispatch error:', e2);
      }
    }
  } catch (e) {
    console.warn('Error setting demo duration:', e);
  }
}

export function startDemoSession(): number {
  const now = Date.now();
  try {
    localStorage.setItem(DEMO_START_STORAGE_KEY, String(now));
  } catch (e) {
    console.warn('Error storing demo start time:', e);
  }
  return now;
}

export function getDemoSessionStartTime(): number {
  try {
    const val = localStorage.getItem(DEMO_START_STORAGE_KEY);
    if (val) {
      const num = Number(val);
      if (!isNaN(num) && num > 0) return num;
    }
  } catch (e) {
    console.warn('Error reading demo start time:', e);
  }
  return startDemoSession();
}

export function getRemainingDemoSeconds(): number {
  const startTime = getDemoSessionStartTime();
  const durationMinutes = getDemoDurationMinutes();
  const durationMs = durationMinutes * 60 * 1000;
  const elapsedMs = Date.now() - startTime;
  const remainingMs = durationMs - elapsedMs;
  return Math.max(0, Math.floor(remainingMs / 1000));
}

export function formatDemoTime(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
