/**
 * API Configuration Module for Web & Native Capacitor App Builds
 */

export const API_BASE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PUBLIC_API_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_PUBLIC_API_URL) ||
  ''
).trim().replace(/\/+$/, '');

/**
 * Resolves a full absolute or relative API URL depending on current environment.
 * Ensures consistent handling without duplicate slashes or hardcoded local loopback fallbacks.
 */
export function getApiUrl(path: string): string {
  if (!path) return API_BASE_URL || '';
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE_URL) {
    return `${API_BASE_URL}${cleanPath}`;
  }
  return cleanPath;
}

