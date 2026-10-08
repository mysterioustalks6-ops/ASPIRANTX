import React from 'react';
import { useLanguage } from '../lib/i18n/LanguageContext';
import { soundFx } from '../lib/soundEffects';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className = '',
  size = 'md',
  showIcon = true
}) => {
  const { language, setLanguage, isHindi } = useLanguage();

  const handleToggle = (lang: 'hi' | 'en') => {
    soundFx.playTap();
    soundFx.triggerHaptic(10);
    setLanguage(lang);
  };

  return (
    <div
      role="group"
      aria-label="Language selection"
      className={`inline-flex items-center rounded-2xl bg-[var(--sr-surface-2)] border-2 border-[var(--sr-line)] p-0.5 select-none transition-all shadow-xs ${className}`}
    >
      {showIcon && (
        <div className="pl-2 pr-1 text-[var(--sr-text-subtle)] flex items-center justify-center shrink-0">
          <Globe className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Hindi Button */}
      <button
        type="button"
        data-testid="lang-hi-btn"
        onClick={() => handleToggle('hi')}
        aria-pressed={isHindi}
        title="हिन्दी में स्विच करें (Pure Hindi Experience)"
        className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 ${
          isHindi
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-sm font-black'
            : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)]'
        }`}
      >
        हिं
      </button>

      {/* Divider */}
      <span className="text-[var(--sr-line-strong)] text-xs font-bold px-0.5 pointer-events-none">|</span>

      {/* English Button */}
      <button
        type="button"
        data-testid="lang-en-btn"
        onClick={() => handleToggle('en')}
        aria-pressed={!isHindi}
        title="Switch to English (Pure English Experience)"
        className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 ${
          !isHindi
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-sm font-black'
            : 'text-[var(--sr-text-muted)] hover:text-[var(--sr-text)]'
        }`}
      >
        EN
      </button>
    </div>
  );
};
