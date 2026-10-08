/**
 * Application Localization Types
 * StudyRide Pure Dual-Language System (Hindi / English)
 */

export type AppLanguage = 'hi' | 'en';

export interface LanguageContextValue {
  language: AppLanguage;
  currentLanguage: AppLanguage;
  isHindi: boolean;
  isEnglish: boolean;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  showBothLanguages: boolean;
  setShowBothLanguages: (val: boolean) => void;
  t: (key: string, fallback?: string) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | string | number) => string;
  formatNumber: (num: number) => string;
  formatMinutes: (minutes: number) => string;
  isPickerOpen: boolean;
  dismissPicker: (chosenLang?: AppLanguage) => void;
  openPicker: () => void;
}
