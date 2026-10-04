import React from 'react';
import { Zap, Coins } from 'lucide-react';

export interface XPPillProps {
  xp: number;
  className?: string;
  onClick?: () => void;
}

export const XPPill: React.FC<XPPillProps> = ({ xp, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--sr-blue-subtle)] text-[var(--sr-blue)] border border-[var(--sr-blue)]/30 text-xs font-black select-none min-h-[36px] transition-transform active:scale-95 ${className}`}
      title={`${xp} Total Study XP`}
    >
      <Zap className="w-3.5 h-3.5 fill-current" />
      <span>{xp} XP</span>
    </div>
  );
};

export interface CoinPillProps {
  coins: number;
  className?: string;
  onClick?: () => void;
}

export const CoinPill: React.FC<CoinPillProps> = ({ coins, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--sr-amber-subtle)] text-[var(--sr-amber)] border border-[var(--sr-amber)]/30 text-xs font-black select-none min-h-[36px] transition-transform active:scale-95 ${className}`}
      title={`${coins} StudyRide Coins`}
    >
      <Coins className="w-3.5 h-3.5" />
      <span>{coins}</span>
    </div>
  );
};
