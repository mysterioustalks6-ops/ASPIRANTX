/**
 * API Configuration Module for Web & Native Capacitor App Builds
 */

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_PUBLIC_API_URL ||
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
  return cleanPath;
}
