import React from 'react';
import { Check, X } from 'lucide-react';

export type OptionCardState = 'neutral' | 'selected' | 'correct' | 'incorrect';

export interface TactileOptionCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  letter?: string; // e.g. "A", "B", "C", "D"
  label: string;
  state?: OptionCardState;
  disabled?: boolean;
}

export const TactileOptionCard: React.FC<TactileOptionCardProps> = ({
  letter,
  label,
  state = 'neutral',
  disabled = false,
  className = '',
  ...props
}) => {
  const getStateStyles = () => {
    switch (state) {
      case 'neutral':
        return 'bg-[#1A1D24] border-2 border-[#2A2F3A] hover:border-[#3E4656] text-[#F3F4F6] active:scale-[0.99]';
      case 'selected':
        return 'bg-[#17271C] border-2 border-[#58CC02] text-[#F3F4F6] shadow-[0_0_12px_rgba(88,204,2,0.15)]';
      case 'correct':
        return 'bg-[#132A1C] border-2 border-[#58CC02] text-[#76E025]';
      case 'incorrect':
        return 'bg-[#2C1517] border-2 border-[#FF4B4B] text-[#FF6B6B]';
    }
  };

  const getLetterBadgeStyles = () => {
    switch (state) {
      case 'neutral':
        return 'bg-[#222732] text-[#9CA3AF] border border-[#2A2F3A]';
      case 'selected':
        return 'bg-[#58CC02] text-[#0B2300] font-black border border-[#46A302]';
      case 'correct':
        return 'bg-[#58CC02] text-[#0B2300] font-black border border-[#46A302]';
      case 'incorrect':
        return 'bg-[#FF4B4B] text-white font-black border border-[#EA2B2B]';
    }
  };

  return (
    <button
      {...props}
      disabled={disabled}
      className={`
        w-full p-4 rounded-xl text-left font-medium text-sm transition-all duration-150
        flex items-center justify-between gap-3 min-h-[52px] select-none touch-manipulation cursor-pointer
        outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02]
        ${getStateStyles()}
        ${disabled ? 'opacity-60 pointer-events-none' : ''}
        ${className}
      `}
    >
      <div className="flex items-center gap-3 min-w-0">
        {letter && (
          <span
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${getLetterBadgeStyles()}`}
          >
            {letter}
          </span>
        )}
        <span className="leading-snug break-words">{label}</span>
      </div>

      {state === 'correct' && (
        <div className="w-6 h-6 rounded-full bg-[#58CC02] text-[#0B2300] flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 stroke-[3]" />
        </div>
      )}

      {state === 'incorrect' && (
        <div className="w-6 h-6 rounded-full bg-[#FF4B4B] text-white flex items-center justify-center shrink-0">
          <X className="w-4 h-4 stroke-[3]" />
        </div>
      )}
    </button>
  );
};
