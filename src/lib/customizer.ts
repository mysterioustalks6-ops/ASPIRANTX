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
  brandName: 'ASPIRANTX',
  brandTagline: 'Gen-Z Prep Suite (Class 1 - Ph.D.)',
  brandBadge: 'PRO',
  logoIconText: 'AX',
  logoUrl: '',
  
  themePalette: 'CYBER_EMERALD',
  fontFamily: 'PLUS_JAKARTA',
  
  backgroundAnimation: 'AURORA_WAVE',
  showBackgroundParticles: true,
  
  showHeroBanner: true,
  heroBannerTitle: '🎓 Complete Prep Suite for All Exams (Class 1 to Ph.D.)',
  heroBannerSubtitle: 'Track Syllabus, AI Study Buddy, Live Mock Predictor & Community Chat in One Place.',
  heroBannerImageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80',
  heroBannerCtaText: 'Explore Syllabus Tracker',
  
  showAnnouncementTicker: true,
  announcementText: '🔥 New Syllabus Templates added for UPPSC, Bihar Board, Class 10/12 PCM & Ph.D. Entrance! Customize your goal in Profile.',
};

const STORAGE_KEY = 'aspirantx_customizer_settings_v1';

export function loadCustomizerSettings(): AppCustomizerSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_CUSTOMIZER_SETTINGS, ...JSON.parse(raw) };
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
        const merged = { ...DEFAULT_CUSTOMIZER_SETTINGS, ...data.customizer };
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
  { label: 'Academic Library', url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Modern Study Setup', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Cyberpunk Neon Workspace', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Nebula Space Galaxy', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80' },
  { label: 'Minimalist Modern Gradient', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80' },
];
