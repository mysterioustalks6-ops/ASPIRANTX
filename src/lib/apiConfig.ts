/**
 * API Configuration Module for Web & Native Capacitor App Builds
 */

export const API_BASE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PUBLIC_API_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_PUBLIC_API_URL) ||
  ''
).replace(/\/$/, '');

/**
 * Resolves a full absolute or relative API URL depending on current environment
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE_URL) {
    return `${API_BASE_URL}${cleanPath}`;
  }
  // If running in native Capacitor, point to http://127.0.0.1:3000 (accessible via adb reverse tcp:3000 tcp:3000 on physical devices and emulators)
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
    return `http://127.0.0.1:3000${cleanPath}`;
  }
  return cleanPath;
}

