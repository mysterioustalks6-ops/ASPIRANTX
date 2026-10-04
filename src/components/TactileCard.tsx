import React from 'react';

export interface TactileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  selected?: boolean;
  padded?: boolean;
  children: React.ReactNode;
}

export const TactileCard: React.FC<TactileCardProps> = ({
  interactive = false,
  selected = false,
  padded = true,
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      {...props}
      className={`
        rounded-2xl transition-all duration-150
        ${padded ? 'p-4 sm:p-5' : ''}
        ${
          selected
            ? 'bg-[#16281C] border-2 border-[#58CC02] shadow-[0_0_16px_rgba(88,204,2,0.12)]'
            : 'bg-[#1A1D24] border border-[#2A2F3A]'
        }
        ${
          interactive && !selected
            ? 'hover:bg-[#20242D] hover:border-[#383F4E] active:scale-[0.99] cursor-pointer touch-manipulation'
            : ''
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
};
