import React from 'react';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { soundFx } from '../lib/soundEffects';

export type FreshnessState = 'new' | 'learning' | 'strong' | 'fading';

export interface MasteryCellProps {
  title: string;
  weightPercent?: number; // % marks weight
  freshness: FreshnessState;
  daysSinceRevision?: number;
  onClick?: () => void;
  className?: string;
}

export const MasteryCell: React.FC<MasteryCellProps> = ({
  title,
  weightPercent,
  freshness,
  daysSinceRevision,
  onClick,
  className = '',
}) => {
  const getFreshnessConfig = () => {
    switch (freshness) {
      case 'new':
        return {
          bg: 'var(--sr-surface-2)',
          border: 'var(--sr-line-strong)',
          label: 'Not Started',
          badgeClass: 'text-[var(--sr-text-subtle)] bg-[var(--sr-surface-3)]',
          icon: null,
        };
      case 'learning':
        return {
          bg: 'var(--sr-blue-subtle)',
          border: 'var(--sr-blue)',
          label: 'Learning',
          badgeClass: 'text-[var(--sr-blue)] bg-[var(--sr-blue)]/15',
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case 'strong':
        return {
          bg: 'var(--sr-primary-subtle)',
          border: 'var(--sr-primary)',
          label: 'Strong',
          badgeClass: 'text-[var(--sr-primary)] bg-[var(--sr-primary)]/15',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case 'fading':
        return {
          bg: 'var(--sr-amber-subtle)',
          border: 'var(--sr-amber)',
          label: 'Revision Due',
          badgeClass: 'text-[var(--sr-amber)] bg-[var(--sr-amber)]/20 animate-pulse',
          icon: <AlertCircle className="w-3.5 h-3.5" />,
        };
    }
  };

  const config = getFreshnessConfig();

  const handleClick = () => {
    soundFx.playTap();
    onClick?.();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer select-none active:scale-[0.98] ${className}`}
      style={{
        backgroundColor: config.bg,
        borderColor: config.border,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black ${config.badgeClass}`}>
          {config.icon}
          <span>{config.label}</span>
        </span>
        {weightPercent !== undefined && (
          <span className="text-xs font-bold text-[var(--sr-text-subtle)]">
            ~{weightPercent}% weight
          </span>
        )}
      </div>

      <h4 className="text-sm font-bold text-[var(--sr-text)] leading-snug line-clamp-2 mb-1.5">
        {title}
      </h4>

      {freshness === 'fading' && daysSinceRevision !== undefined && (
        <p className="text-[11px] font-bold text-[var(--sr-amber)] flex items-center gap-1">
          Last revised {daysSinceRevision} days ago
        </p>
      )}
    </div>
  );
};
