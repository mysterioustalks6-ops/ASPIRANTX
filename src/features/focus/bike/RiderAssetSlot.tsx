import React from 'react';

interface RiderAssetSlotProps {
  pose?: 'rider_idle' | 'rider_ready' | 'rider_riding' | 'rider_tired' | 'rider_celebrate' | 'rider_workshop';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const RiderAssetSlot: React.FC<RiderAssetSlotProps> = ({
  pose = 'rider_ready',
  className = '',
  size = 'md',
  showDetails = false
}) => {
  const sizeClasses = {
    sm: 'w-24 h-32 p-2.5',
    md: 'w-44 h-56 p-4',
    lg: 'w-60 h-72 p-5'
  }[size];

  const avatarSize = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-20 h-20 text-3xl',
    lg: 'w-24 h-24 text-4xl'
  }[size];

  return (
    <div
      data-asset-slot={`rider_${pose}`}
      aria-label="Rider Focus Coach Card"
      className={`relative rounded-3xl bg-slate-900/90 border-2 border-indigo-500/30 flex flex-col items-center justify-between text-center select-none shadow-xl backdrop-blur-md transition-all hover:border-indigo-400/50 ${sizeClasses} ${className}`}
      style={{
        boxShadow: '0 8px 24px -4px rgba(79, 70, 229, 0.15), 0 4px 0 0 rgba(49, 46, 129, 0.5)'
      }}
    >
      {/* Top Header Badge */}
      <div className="w-full flex items-center justify-between text-[10px] font-bold">
        <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
          Coach
        </span>
        <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active
        </span>
      </div>

      {/* Center Initials "R" Avatar */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto">
        <div
          className={`${avatarSize} rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-800 text-white font-bold flex items-center justify-center shadow-lg border-2 border-indigo-300/40 relative group`}
          style={{
            boxShadow: '0 6px 0 0 rgba(30, 27, 75, 0.6)'
          }}
        >
          <span>R</span>
          {/* Subtle Goggles Accent */}
          <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900" />
        </div>

        <p className="text-xs font-bold text-white mt-2.5 tracking-tight">
          Rider
        </p>
        <p className="text-[10px] font-medium text-slate-400">
          Highway focus coach
        </p>
      </div>

      {/* Bottom Placeholder / Status Notice */}
      <div className="w-full pt-1.5 border-t border-slate-800/80">
        <span className="block text-[9px] font-bold text-slate-400">
          Rider slot • Ready
        </span>
      </div>
    </div>
  );
};
