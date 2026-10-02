/**
 * API Configuration Module for Web & Native Capacitor App Builds
 */

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const isNativeCapacitor = Boolean(
      (window as any).Capacitor?.isNativePlatform?.() ||
      (window as any).Capacitor?.platform === 'android' ||
      (window as any).Capacitor?.platform === 'ios' ||
      window.location.protocol === 'capacitor:' ||
      window.location.protocol === 'ionic:'
    );
    if (isNativeCapacitor) {
      return 'https://studyride.in';
    }
    // When running in a standard web browser on production (e.g. studyride.in),
    // use relative path '' so requests go to the same origin without CORS or domain mismatches.
    if (window.location?.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return '';
    }
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    const envUrl = import.meta.env.VITE_API_BASE_URL.trim().replace(/\/+$/, '');
    if (envUrl && !envUrl.includes('aspirantx.vercel.app')) {
      return envUrl;
    }
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PUBLIC_API_URL) {
    const envUrl = import.meta.env.VITE_PUBLIC_API_URL.trim().replace(/\/+$/, '');
    if (envUrl && !envUrl.includes('aspirantx.vercel.app')) {
      return envUrl;
    }
  }
  return 'https://studyride.in';
}


export const API_BASE_URL = getApiBaseUrl();

/**
 * Resolves a full absolute or relative API URL depending on current environment.
 * Ensures consistent handling without duplicate slashes or hardcoded local loopback fallbacks.
 */
export function getApiUrl(path: string): string {
  const base = getApiBaseUrl();
  if (!path) return base || '';
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (base) {
    return `${base}${cleanPath}`;
  }
  return cleanPath;
}

