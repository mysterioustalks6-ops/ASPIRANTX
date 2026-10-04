import React from 'react';

export interface TactileProgressBarProps {
  progressPercent: number; // 0 to 100
  color?: 'primary' | 'accent' | 'streak' | 'destructive';
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const TactileProgressBar: React.FC<TactileProgressBarProps> = ({
  progressPercent,
  color = 'primary',
  height = 'md',
  showLabel = false,
  className = '',
}) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progressPercent)));

  const getColorStyles = () => {
    switch (color) {
      case 'primary':
        return 'bg-[#58CC02] border-t border-[#76E025]/50';
      case 'accent':
        return 'bg-[#1CB0F6] border-t border-[#60C9FF]/50';
      case 'streak':
        return 'bg-[#FF9600] border-t border-[#FFAE33]/50';
      case 'destructive':
        return 'bg-[#FF4B4B] border-t border-[#FF7070]/50';
    }
  };

  const getHeightStyles = () => {
    switch (height) {
      case 'sm':
        return 'h-2';
      case 'md':
        return 'h-3.5';
      case 'lg':
        return 'h-5';
    }
  };

  return (
    <div className={`w-full flex items-center gap-3 ${className}`}>
      <div className={`flex-1 w-full bg-[#121419] rounded-full overflow-hidden border border-[#2A2F3A] p-0.5 ${getHeightStyles()}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out shadow-sm ${getColorStyles()}`}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-black text-[#F3F4F6] shrink-0 font-mono">
          {clampedProgress}%
        </span>
      )}
    </div>
  );
};
