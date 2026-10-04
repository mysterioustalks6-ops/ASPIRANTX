import React from 'react';
import { soundFx } from '../lib/soundEffects';

export interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'blue' | 'purple' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  withSound?: boolean;
  icon?: React.ReactNode;
}

export const TactileButton: React.FC<TactileButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  withSound = true,
  icon,
  children,
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (withSound) {
      if (variant === 'danger') {
        soundFx.playIncorrect();
      } else {
        soundFx.playTap();
      }
    }
    soundFx.triggerHaptic(12);
    onClick?.(e);
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'sr-btn-tactile-primary';
      case 'secondary':
        return 'sr-btn-tactile-secondary';
      case 'blue':
        return 'sr-btn-tactile-blue';
      case 'purple':
        return 'sr-btn-tactile-purple';
      case 'danger':
        return 'sr-btn-tactile-danger';
      case 'ghost':
        return 'bg-transparent text-[var(--sr-text-muted)] hover:text-[var(--sr-text)] hover:bg-[var(--sr-surface-2)] transition-colors active:scale-95';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'min-h-[40px] px-3.5 py-1.5 text-xs font-bold rounded-xl gap-1.5';
      case 'md':
        return 'min-h-[48px] px-5 py-2.5 text-sm font-black rounded-2xl gap-2'; // 48dp touch target
      case 'lg':
        return 'min-h-[56px] px-6 py-3.5 text-base font-black rounded-2xl gap-2.5';
    }
  };

  return (
    <button
      {...props}
      disabled={disabled}
      onClick={handleClick}
      className={`inline-flex items-center justify-center select-none cursor-pointer touch-manipulation tracking-tight ${
        fullWidth ? 'w-full' : ''
      } ${getSizeClass()} ${getVariantClass()} ${
        disabled ? 'opacity-45 cursor-not-allowed transform-none filter grayscale' : ''
      } ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
