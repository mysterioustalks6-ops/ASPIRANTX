import React from 'react';
import { ASSET_SLOTS_MANIFEST } from './assetManifest';
import { Shield } from 'lucide-react';

interface RiderAssetSlotProps {
  pose: 'rider_idle' | 'rider_ready' | 'rider_riding' | 'rider_tired' | 'rider_celebrate' | 'rider_workshop';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export const RiderAssetSlot: React.FC<RiderAssetSlotProps> = ({
  pose,
  className = '',
  size = 'md',
  showDetails = false
}) => {
  const asset = ASSET_SLOTS_MANIFEST[pose] || {
    id: pose,
    name: 'Rider Coach',
    description: 'Anime-styled focus coach with sports helmet & gloves',
    category: 'RIDER',
    dimensions: '384x512',
    format: 'SVG'
  };

  const sizeClasses = {
    sm: 'w-24 h-32',
    md: 'w-40 h-52',
    lg: 'w-56 h-72'
  }[size];

  return (
    <div
      data-asset-slot={asset.id}
      aria-label={`Rider Coach Asset Slot: ${asset.name}`}
      className={`relative rounded-3xl bg-slate-900/90 border-2 border-dashed border-slate-700/80 p-3 flex flex-col items-center justify-between text-center select-none shadow-md overflow-hidden ${sizeClasses} ${className}`}
    >
      {/* Top Tag: Slot ID & Format */}
      <div className="w-full flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400">
        <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-amber-400 font-mono">
          SLOT: {asset.id}
        </span>
        <span className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
          {asset.format}
        </span>
      </div>

      {/* Central Visual Silhouette Placeholder (Honest Labelled Box) */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-1.5 my-auto">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shadow-inner">
          <Shield className="w-6 h-6 stroke-[1.8] text-amber-400" />
        </div>
        <p className="text-[11px] font-black text-slate-200 leading-tight px-1">
          {asset.name.replace('Rider Coach — ', '')}
        </p>
        <p className="text-[9px] text-slate-400 font-mono">
          [{asset.dimensions}]
        </p>
      </div>

      {/* Bottom Placeholder Notice */}
      <div className="w-full pt-1 border-t border-slate-800/80">
        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-tight">
          Penpot Asset Pending
        </span>
      </div>
    </div>
  );
};
