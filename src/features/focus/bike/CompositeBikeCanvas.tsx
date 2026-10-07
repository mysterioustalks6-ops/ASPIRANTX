import React, { useState, useEffect } from 'react';
import { ASSET_SLOTS_MANIFEST } from './assetManifest';
import { Wrench, Sparkles, Check, Lock } from 'lucide-react';

export const BIKE_SLOT_ORDER = [
  'frame',
  'wheels',
  'engine',
  'fuel_tank',
  'seat',
  'paint',
  'helmet_rack',
  'trophy'
] as const;

export type BikeSlotId = typeof BIKE_SLOT_ORDER[number];

export interface CompositeBikeCanvasProps {
  unlockedSlotIds?: string[];
  isRunning?: boolean;
  isPaused?: boolean;
  tierNumber?: number;
  recentUnlockedSlotId?: string | null;
  className?: string;
  onSlotClick?: (slotId: BikeSlotId) => void;
}

export const CompositeBikeCanvas: React.FC<CompositeBikeCanvasProps> = ({
  unlockedSlotIds = [],
  isRunning = false,
  isPaused = false,
  tierNumber = 1,
  recentUnlockedSlotId = null,
  className = '',
  onSlotClick
}) => {
  const [sparkleSlot, setSparkleSlot] = useState<string | null>(recentUnlockedSlotId);

  // Check user prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  useEffect(() => {
    if (recentUnlockedSlotId) {
      setSparkleSlot(recentUnlockedSlotId);
      const timer = setTimeout(() => setSparkleSlot(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [recentUnlockedSlotId]);

  // Bike idle animation classes
  const isIdleActive = isRunning && !isPaused && !prefersReducedMotion;

  return (
    <div
      data-testid="composite-bike-canvas"
      aria-label={`Composite Bike: Tier ${tierNumber}, ${unlockedSlotIds.length} of 8 slots installed`}
      className={`relative w-full max-w-xl mx-auto rounded-3xl bg-slate-950/90 border border-slate-800/80 p-4 sm:p-6 overflow-hidden select-none ${className}`}
    >
      {/* Subtle Highway Road Grid & Horizon Backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950" />
      <div className="absolute bottom-4 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-slate-700 to-transparent pointer-events-none" />

      {/* Header Info */}
      <div className="flex items-center justify-between text-xs font-bold text-slate-400 pb-3 border-b border-slate-800/60 z-10 relative">
        <span className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px]">
          <Wrench className="w-3.5 h-3.5" />
          8-SLOT ASSEMBLY STAGE
        </span>
        <span className="text-[11px] font-mono">
          {unlockedSlotIds.length} / 8 INSTALLED
        </span>
      </div>

      {/* ── 8-LAYERED BIKE STAGE (FIXED ORDER 1..8) ── */}
      <div
        className={`relative w-full h-52 sm:h-64 my-2 flex items-center justify-center transition-transform ${
          isIdleActive ? 'animate-bounce-subtle' : ''
        }`}
      >
        {/* Layer Stack: Fixed order frame -> wheels -> engine -> fuel_tank -> seat -> paint -> helmet_rack -> trophy */}
        {BIKE_SLOT_ORDER.map((slotId, index) => {
          const partIdKey = `part_${slotId}`;
          const isUnlocked = unlockedSlotIds.some(
            id => id === slotId || id === partIdKey || id.toLowerCase().includes(slotId)
          );
          const isSparkling = sparkleSlot === slotId || sparkleSlot === partIdKey;
          const manifestEntry = ASSET_SLOTS_MANIFEST[partIdKey];

          // Positional layout offsets on the motorcycle blueprint canvas
          const slotLayouts: Record<BikeSlotId, { top: string; left: string; width: string; height: string }> = {
            wheels: { top: '55%', left: '15%', width: '70%', height: '35%' },
            frame: { top: '25%', left: '22%', width: '56%', height: '50%' },
            engine: { top: '42%', left: '38%', width: '25%', height: '32%' },
            fuel_tank: { top: '20%', left: '36%', width: '26%', height: '24%' },
            seat: { top: '24%', left: '20%', width: '22%', height: '18%' },
            paint: { top: '15%', left: '30%', width: '38%', height: '22%' },
            helmet_rack: { top: '12%', left: '60%', width: '18%', height: '22%' },
            trophy: { top: '5%', left: '42%', width: '16%', height: '16%' }
          };

          const layout = slotLayouts[slotId];
          const zIndex = index + 1; // 1 to 8 fixed layer order

          return (
            <div
              key={slotId}
              data-slot-id={slotId}
              data-layer-order={zIndex}
              onClick={() => onSlotClick && onSlotClick(slotId)}
              style={{
                top: layout.top,
                left: layout.left,
                width: layout.width,
                height: layout.height,
                zIndex
              }}
              className={`absolute flex flex-col items-center justify-center rounded-xl p-1 transition-all ${
                isUnlocked
                  ? 'bg-slate-900/90 border border-emerald-500/60 shadow-md text-emerald-300'
                  : 'border border-dashed border-slate-700/80 bg-slate-950/40 opacity-70 text-slate-500'
              } ${
                isSparkling && !prefersReducedMotion ? 'animate-slot-unlock' : ''
              }`}
            >
              {/* Slot content: Clean labeled grey placeholder */}
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-0.5 space-y-0.5">
                <span className="text-[9px] font-mono font-black uppercase tracking-tight line-clamp-1">
                  {isUnlocked ? `placeholder: ${partIdKey}` : `[locked: ${slotId}]`}
                </span>
                <span className="text-[7px] text-slate-400 font-mono">
                  {manifestEntry ? manifestEntry.dimensions : '256x256'} • z:{zIndex}
                </span>

                {isSparkling && (
                  <span className="absolute -top-2 -right-2 p-1 rounded-full bg-amber-400 text-slate-950 animate-ping">
                    <Sparkles className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assembly Legend Strip */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 pt-2 border-t border-slate-800/80">
        {BIKE_SLOT_ORDER.map((slotId, idx) => {
          const isUnlocked = unlockedSlotIds.some(
            id => id === slotId || id === `part_${slotId}` || id.toLowerCase().includes(slotId)
          );
          return (
            <div
              key={slotId}
              className={`flex flex-col items-center p-1 rounded-lg text-center ${
                isUnlocked ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-900/50 text-slate-400 border border-slate-800/40'
              }`}
            >
              <span className="text-[8px] font-mono font-bold capitalize truncate max-w-full">
                {idx + 1}. {slotId.replace('_', ' ')}
              </span>
              {isUnlocked ? (
                <Check className="w-2.5 h-2.5 mt-0.5" />
              ) : (
                <Lock className="w-2.5 h-2.5 mt-0.5" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
