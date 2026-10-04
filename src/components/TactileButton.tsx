import React from 'react';
import { Loader2 } from 'lucide-react';
import { actions } from '../tokens/designSystem';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'destructive' | 'streak' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface TactileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const TactileButton: React.FC<TactileButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}) => {
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'primary':
        return 'bg-[#58CC02] hover:bg-[#5FDB02] text-[#0B2300] border-b-4 border-[#46A302] active:border-b-0 active:translate-y-1 shadow-sm';
      case 'secondary':
        return 'bg-[#1A1D24] hover:bg-[#222732] text-[#F3F4F6] border-b-4 border-[#2A2F3A] active:border-b-0 active:translate-y-1';
      case 'accent':
        return 'bg-[#1CB0F6] hover:bg-[#28BCFF] text-[#00263D] border-b-4 border-[#1899D6] active:border-b-0 active:translate-y-1 shadow-sm';
      case 'destructive':
        return 'bg-[#FF4B4B] hover:bg-[#FF6161] text-white border-b-4 border-[#EA2B2B] active:border-b-0 active:translate-y-1';
      case 'streak':
        return 'bg-[#FF9600] hover:bg-[#FFA726] text-[#2E1400] border-b-4 border-[#D87D00] active:border-b-0 active:translate-y-1 shadow-sm';
      case 'ghost':
        return 'bg-transparent hover:bg-[#1A1D24] text-[#9CA3AF] hover:text-[#F3F4F6] border-b-0 active:translate-y-0.5';
    }
  };

  const getSizeStyles = (): string => {
    switch (size) {
      case 'sm':
        return 'h-10 min-h-[40px] px-3.5 text-xs rounded-xl font-bold';
      case 'md':
        return 'h-[50px] min-h-[48px] px-5 text-sm rounded-xl font-bold tracking-wide';
      case 'lg':
        return 'h-[56px] min-h-[48px] px-6 text-base rounded-2xl font-black tracking-wide';
    }
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2 select-none touch-manipulation cursor-pointer
        transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#58CC02]
        ${fullWidth ? 'w-full' : ''}
        ${getSizeStyles()}
        ${getVariantStyles()}
        ${isDisabled ? 'opacity-50 pointer-events-none' : ''}
        ${className}
      `}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span className="truncate">{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
