/**
 * Diagnostic logger for Auth, Profile, and Navigation transitions.
 */

export function logAuthDiagnostic(
  category: 'AUTH' | 'PROFILE' | 'NAVIGATION',
  message: string,
  details?: Record<string, any>
) {
  const timestamp = new Date().toISOString().substring(11, 23);
  const detailStr = details ? ` | ${JSON.stringify(details)}` : '';
  console.log(`[${timestamp}] [${category}_DIAGNOSTIC] ${message}${detailStr}`);
}
