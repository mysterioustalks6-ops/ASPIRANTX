import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AppLanguage, LanguageContextValue } from './types';
import { TRANSLATIONS } from './translations';

const STORAGE_LANG_KEY = 'studyride_language';
const STORAGE_INIT_KEY = 'studyride_lang_first_launch_done';

const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectDeviceLanguage(): AppLanguage {
  try {
    const navLang = navigator.language || (navigator as any).userLanguage || '';
    if (navLang.toLowerCase().startsWith('hi')) {
      return 'hi';
    }
  } catch (_) {}
  return 'en';
}

function getInitialLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem(STORAGE_LANG_KEY);
    if (saved === 'hi' || saved === 'en') {
      return saved;
    }
  } catch (_) {}
  return detectDeviceLanguage();
}

function getInitialPickerOpen(): boolean {
  try {
    const done = localStorage.getItem(STORAGE_INIT_KEY);
    // If not done yet, show the language picker on first launch
    return done !== 'true';
  } catch (_) {
    return false;
  }
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(getInitialLanguage);
  const [showBothLanguages, setShowBothLanguages] = useState<boolean>(false);
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(getInitialPickerOpen);

  // Apply language attribute to <html lang="...">
  useEffect(() => {
    try {
      document.documentElement.lang = language;
      localStorage.setItem(STORAGE_LANG_KEY, language);
    } catch (_) {}
  }, [language]);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
      document.documentElement.lang = lang;
      window.dispatchEvent(new CustomEvent('studyride:language_change', { detail: { language: lang } }));
    } catch (_) {}
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'hi' ? 'en' : 'hi');
  }, [language, setLanguage]);

  const dismissPicker = useCallback((chosenLang?: AppLanguage) => {
    const finalLang = chosenLang || language || detectDeviceLanguage();
    setLanguage(finalLang);
    setIsPickerOpen(false);
    try {
      localStorage.setItem(STORAGE_INIT_KEY, 'true');
    } catch (_) {}
  }, [language, setLanguage]);

  const openPicker = useCallback(() => {
    setIsPickerOpen(true);
  }, []);

  const t = useCallback((key: string, fallback?: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (dict[key]) return dict[key];
    const enDict = TRANSLATIONS.en;
    if (enDict[key]) return enDict[key];
    return fallback || key;
  }, [language]);

  const formatDate = useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
    try {
      const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
      const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
      const defaultOpts: Intl.DateTimeFormatOptions = options || {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      };
      return d.toLocaleDateString(locale, defaultOpts);
    } catch (_) {
      return String(date);
    }
  }, [language]);

  const formatTime = useCallback((date: Date | string | number): string => {
    try {
      const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
      const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
      return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return String(date);
    }
  }, [language]);

  const formatNumber = useCallback((num: number): string => {
    try {
      const locale = language === 'hi' ? 'hi-IN' : 'en-IN';
      return num.toLocaleString(locale);
    } catch (_) {
      return String(num);
    }
  }, [language]);

  const formatMinutes = useCallback((minutes: number): string => {
    const hrs = Math.floor(minutes / 60);
    const remMins = minutes % 60;
    if (language === 'hi') {
      if (hrs > 0 && remMins > 0) return `${hrs} घंटे ${remMins} मिनट`;
      if (hrs > 0) return `${hrs} घंटे`;
      return `${remMins} मिनट`;
    } else {
      if (hrs > 0 && remMins > 0) return `${hrs}h ${remMins}m`;
      if (hrs > 0) return `${hrs} hrs`;
      return `${remMins} mins`;
    }
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    currentLanguage: language,
    isHindi: language === 'hi',
    isEnglish: language === 'en',
    setLanguage,
    toggleLanguage,
    showBothLanguages,
    setShowBothLanguages,
    t,
    formatDate,
    formatTime,
    formatNumber,
    formatMinutes,
    isPickerOpen,
    dismissPicker,
    openPicker
  }), [
    language,
    setLanguage,
    toggleLanguage,
    showBothLanguages,
    setShowBothLanguages,
    t,
    formatDate,
    formatTime,
    formatNumber,
    formatMinutes,
    isPickerOpen,
    dismissPicker,
    openPicker
  ]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
