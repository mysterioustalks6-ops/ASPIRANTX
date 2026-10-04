import React from 'react';
import { Flame } from 'lucide-react';

export interface StreakFlameProps {
  days: number;
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const StreakFlame: React.FC<StreakFlameProps> = ({
  days,
  isActive = true,
  size = 'md',
  className = '',
  onClick,
}) => {
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs gap-1 rounded-xl';
      case 'md':
        return 'px-3 py-1.5 text-xs font-black gap-1.5 rounded-xl min-h-[36px]';
      case 'lg':
        return 'px-4 py-2 text-sm font-black gap-2 rounded-2xl min-h-[44px]';
    }
  };

  const getFlameSize = () => {
    switch (size) {
      case 'sm':
        return 'w-3.5 h-3.5';
      case 'md':
        return 'w-4 h-4';
      case 'lg':
        return 'w-5 h-5';
    }
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className={`inline-flex items-center font-black select-none border transition-transform active:scale-95 ${
        isActive
          ? 'bg-[var(--sr-amber-subtle)] text-[var(--sr-amber)] border-[var(--sr-amber)]/30'
          : 'bg-[var(--sr-surface-2)] text-[var(--sr-text-subtle)] border-[var(--sr-line)]'
      } ${getSizeClass()} ${className}`}
      title={`${days} Days Active Study Streak`}
    >
      <Flame className={`${getFlameSize()} fill-current animate-pulse`} />
      <span>{days}d</span>
    </div>
  );
};
