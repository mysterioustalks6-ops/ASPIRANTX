import React from 'react';
import { ASSET_SLOTS_MANIFEST } from './assetManifest';
import { Wrench } from 'lucide-react';

interface BikeAssetSlotProps {
  slotId: string;
  isUnlocked?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BikeAssetSlot: React.FC<BikeAssetSlotProps> = ({
  slotId,
  isUnlocked = false,
  className = '',
  size = 'md'
}) => {
  const asset = ASSET_SLOTS_MANIFEST[slotId] || {
    id: slotId,
    name: slotId.replace(/_/g, ' '),
    description: 'Vehicle / Part slot',
    category: 'BIKE_PART',
    dimensions: '256x256',
    format: 'SVG'
  };

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-28',
    lg: 'w-full h-44'
  }[size];

  return (
    <div
      data-asset-slot={asset.id}
      aria-label={`Bike Asset Slot: ${asset.name}`}
      className={`relative rounded-2xl p-2.5 flex flex-col items-center justify-between text-center select-none shadow-sm transition-all ${
        isUnlocked
          ? 'bg-slate-900 border-2 border-emerald-500/60 shadow-emerald-500/10'
          : 'bg-slate-950/80 border-2 border-dashed border-slate-800 opacity-80'
      } ${sizeClasses} ${className}`}
    >
      {/* Top Header */}
      <div className="w-full flex items-center justify-between text-[8px] font-bold">
        <span className="font-mono text-slate-400 truncate max-w-[80px]">
          {asset.id}
        </span>
        <span className={`px-1 py-0.2 rounded text-[8px] font-bold ${
          isUnlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
        }`}>
          {isUnlocked ? 'Unlocked' : 'Locked'}
        </span>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-1 my-auto">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
          isUnlocked ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-600'
        }`}>
          <Wrench className="w-4 h-4" />
        </div>
        <p className="text-[10px] font-bold text-slate-200 line-clamp-1 px-1">
          {asset.name}
        </p>
        <span className="text-[8px] font-mono text-slate-400">
          [{asset.dimensions}]
        </span>
      </div>

      {/* Footer */}
      <div className="w-full text-[7px] font-bold text-slate-400 border-t border-slate-800/80 pt-0.5">
        SVG Slot
      </div>
    </div>
  );
};
