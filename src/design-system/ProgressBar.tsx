import React from 'react';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: 'primary' | 'blue' | 'purple' | 'amber' | 'mint';
  height?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = 'primary',
  height = 'md',
  showLabel = false,
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));

  const getHeightClass = () => {
    switch (height) {
      case 'sm':
        return 'h-2';
      case 'md':
        return 'h-3.5';
      case 'lg':
        return 'h-5';
    }
  };

  const getColorStyle = () => {
    switch (color) {
      case 'primary':
        return 'var(--sr-primary)';
      case 'blue':
        return 'var(--sr-blue)';
      case 'purple':
        return 'var(--sr-purple)';
      case 'amber':
        return 'var(--sr-amber)';
      case 'mint':
        return 'var(--sr-mint)';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-xs font-bold text-[var(--sr-text-muted)]">
          <span>Progress</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div 
        role="progressbar" 
        aria-valuenow={clamped} 
        aria-valuemin={0} 
        aria-valuemax={100} 
        className={`w-full sr-progress-track ${getHeightClass()}`}
      >
        <div
          className="h-full sr-progress-fill"
          style={{
            width: `${clamped}%`,
            backgroundColor: getColorStyle(),
          }}
        />
      </div>
    </div>
  );
};
