export interface AppCustomizerSettings {
  brandName: string;
  brandTagline: string;
  brandBadge: string;
  logoUrl?: string; // Optional custom image URL
  logoIconText: string; // e.g. "AX" or initials
  
  // Theme & Colors
  themePalette: 'CYBER_EMERALD' | 'ROYAL_PURPLE' | 'FIRE_SUNSET' | 'ELECTRIC_BLUE' | 'GOLD_LUXURY';
  fontFamily: 'PLUS_JAKARTA' | 'OUTFIT' | 'PLAYFAIR' | 'SPACE_GROTESK' | 'MONO';
  
  // Background Animations & FX
  backgroundAnimation: 'NEON_CYBER' | 'AURORA_WAVE' | 'ACADEMIC_SLATE' | 'GOLDEN_EMERALD' | 'MINIMAL_CLEAN';
  showBackgroundParticles: boolean;
  
  // Hero Banner & Photos
  showHeroBanner: boolean;
  heroBannerTitle: string;
  heroBannerSubtitle: string;
  heroBannerImageUrl: string;
  heroBannerCtaText: string;
  
  // Announcement Ticker
  showAnnouncementTicker: boolean;
  announcementText: string;
}

export const DEFAULT_CUSTOMIZER_SETTINGS: AppCustomizerSettings = {
  brandName: 'StudyRide',
  brandTagline: 'Precision Exam Prep & Progress Suite',
  brandBadge: 'PRO',
  logoIconText: 'SR',
  logoUrl: '/logo.png',
  
  themePalette: 'CYBER_EMERALD',
  fontFamily: 'PLUS_JAKARTA',
  
  backgroundAnimation: 'AURORA_WAVE',
  showBackgroundParticles: true,
  
  showHeroBanner: true,
  heroBannerTitle: '🎓 Complete Prep Suite for All Exams (Class 1 to Ph.D.)',
  heroBannerSubtitle: 'Track Syllabus, AI Study Buddy, Live Mock Predictor & Community Chat in One Place.',
  heroBannerImageUrl: '',
  heroBannerCtaText: 'Explore Syllabus Tracker',
  
  showAnnouncementTicker: true,
  announcementText: '🔥 New Syllabus Templates added for UPPSC, Bihar Board, Class 10/12 PCM & Ph.D. Entrance! Customize your goal in Profile.',
};

const STORAGE_KEY = 'studyride_customizer_settings_v3';
const LEGACY_STORAGE_KEY = 'aspirantx_customizer_settings_v3';

function normalizeSettings(data: any): AppCustomizerSettings {
  const merged: AppCustomizerSettings = { ...DEFAULT_CUSTOMIZER_SETTINGS, ...data };
  if (!merged.brandName || merged.brandName.toUpperCase() === 'PROTRACK' || merged.brandName.toUpperCase() === 'ASPIRANTX') {
    merged.brandName = 'StudyRide';
  }
  if (!merged.logoIconText || merged.logoIconText.toUpperCase() === 'PT' || merged.logoIconText.toUpperCase() === 'AX') {
    merged.logoIconText = 'SR';
  }
  if (!merged.logoUrl) {
    merged.logoUrl = '/logo.png';
  }
  return merged;
}

export function loadCustomizerSettings(): AppCustomizerSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const normalized = normalizeSettings(parsed);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    }
  } catch (e) {
    console.warn('Failed to load customizer settings', e);
  }
  return DEFAULT_CUSTOMIZER_SETTINGS;
}

export async function fetchServerCustomizerSettings(): Promise<AppCustomizerSettings> {
  try {
    const res = await fetch('/api/admin/customizer');
    if (res.ok) {
      const data = await res.json();
      if (data?.customizer) {
        const merged = normalizeSettings(data.customizer);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch customizer settings from server:', e);
  }
  return loadCustomizerSettings();
}

export function saveCustomizerSettings(settings: AppCustomizerSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    
    // Asynchronously persist to server Admin Database
    fetch('/api/admin/customizer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customizer: settings }),
    }).catch((err) => console.warn('Failed to sync customizer settings with server:', err));

    try {
      window.dispatchEvent(new CustomEvent('aspirantx_customizer_updated'));
    } catch (e) {
      try {
        const evt = document.createEvent('CustomEvent');
        evt.initCustomEvent('aspirantx_customizer_updated', false, false, null);
        window.dispatchEvent(evt);
      } catch (err) {
        console.warn('Could not dispatch customizer event:', err);
      }
    }
  } catch (e) {
    console.error('Failed to save customizer settings', e);
  }
}

export const PRESET_BANNER_IMAGES = [
  { label: 'Academic Blue', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='400' viewBox='0 0 1200 400'><defs><linearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%230f172a'/><stop offset='100%25' stop-color='%230284c7'/></linearGradient></defs><rect width='100%25' height='100%25' fill='url(%23g1)'/></svg>" },
  { label: 'Modern Indigo', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='400' viewBox='0 0 1200 400'><defs><linearGradient id='g2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%231e1b4b'/><stop offset='100%25' stop-color='%234f46e5'/></linearGradient></defs><rect width='100%25' height='100%25' fill='url(%23g2)'/></svg>" },
  { label: 'Cyberpunk Neon', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='400' viewBox='0 0 1200 400'><defs><linearGradient id='g3' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23022c22'/><stop offset='100%25' stop-color='%23059669'/></linearGradient></defs><rect width='100%25' height='100%25' fill='url(%23g3)'/></svg>" },
  { label: 'Nebula Purple', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='400' viewBox='0 0 1200 400'><defs><linearGradient id='g4' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%233b0764'/><stop offset='100%25' stop-color='%239333ea'/></linearGradient></defs><rect width='100%25' height='100%25' fill='url(%23g4)'/></svg>" },
  { label: 'Minimalist Slate', url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='400' viewBox='0 0 1200 400'><defs><linearGradient id='g5' x1='0%25' y1='0%25' x2='100%25' y2='100%25'><stop offset='0%25' stop-color='%23090d16'/><stop offset='100%25' stop-color='%231e293b'/></linearGradient></defs><rect width='100%25' height='100%25' fill='url(%23g5)'/></svg>" },
];
