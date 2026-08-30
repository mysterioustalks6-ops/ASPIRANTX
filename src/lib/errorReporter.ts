export interface ErrorLogPayload {
  message: string;
  stack?: string | null;
  context?: any;
  severity?: 'error' | 'warning';
  endpoint?: string | null;
}

export function reportFrontendError(payload: ErrorLogPayload): void {
  try {
    let userId: string | null = null;
    let userEmail: string | null = null;

    try {
      const storedUser = localStorage.getItem('aspirantx_user_profile');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        userId = parsed.id || null;
        userEmail = parsed.email || null;
      }
    } catch (_e) {}

    if (!userId) {
      try {
        userEmail = localStorage.getItem('aspirantx_user_email') || null;
      } catch (_e) {}
    }

    fetch('/api/error-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        userEmail,
        source: 'frontend',
        endpoint: payload.endpoint || (typeof window !== 'undefined' ? window.location.pathname : null),
        severity: payload.severity || 'error',
        message: payload.message || 'Unknown Frontend Error',
        stack: payload.stack || null,
        context: payload.context || {
          url: typeof window !== 'undefined' ? window.location.href : null,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          timestamp: new Date().toISOString()
        }
      })
    })
      .catch((err) => {
        // Silently warn to console without calling reportFrontendError recursively
        console.warn('[ErrorReporter] Failed to send error log to server:', err);
      });
  } catch (err) {
    console.warn('[ErrorReporter] Error preparing log payload:', err);
  }
}
