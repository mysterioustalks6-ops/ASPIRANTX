/**
 * API Configuration Module for Web & Native Capacitor App Builds
 */

export function getApiBaseUrl(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.trim().replace(/\/+$/, '');
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PUBLIC_API_URL) {
    return import.meta.env.VITE_PUBLIC_API_URL.trim().replace(/\/+$/, '');
  }
  if (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) {
    return process.env.VITE_API_BASE_URL.trim().replace(/\/+$/, '');
  }
  if (typeof process !== 'undefined' && process.env?.VITE_PUBLIC_API_URL) {
    return process.env.VITE_PUBLIC_API_URL.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const isNativeCapacitor = Boolean(
      (window as any).Capacitor?.isNativePlatform?.() ||
      (window as any).Capacitor?.platform === 'android' ||
      (window as any).Capacitor?.platform === 'ios'
    );
    const isLocalContainer = Boolean(
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.protocol === 'capacitor:' ||
      window.location.origin.includes('localhost')
    );
    if (isNativeCapacitor || isLocalContainer) {
      return 'https://studyride.in';
    }
  }
  return '';
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

