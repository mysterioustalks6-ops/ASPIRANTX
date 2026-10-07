import React, { useState, useEffect } from 'react';
import { ASSET_SLOTS_MANIFEST } from './assetManifest';
import { 
  Shield, CircleDot, Cpu, Flame, Gauge, Zap, Wrench, Award, Check, Lock, Sparkles, X, Info
} from 'lucide-react';

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
  progressPercent?: number;
  recentUnlockedSlotId?: string | null;
  className?: string;
  onSlotClick?: (slotId: BikeSlotId) => void;
}

interface SlotMeta {
  id: BikeSlotId;
  name: string;
  category: string;
  icon: React.ReactNode;
  specSummary: string;
}

export const PART_DEFINITIONS: Record<BikeSlotId, SlotMeta> = {
  frame: {
    id: 'frame',
    name: 'Trellis Chassis',
    category: 'Structural Core',
    icon: <Shield className="w-5 h-5 text-sky-400" />,
    specSummary: 'High-tensile tubular chromoly chassis frame.'
  },
  wheels: {
    id: 'wheels',
    name: 'Dual Alloy',
    category: 'Traction & Rolling',
    icon: <CircleDot className="w-5 h-5 text-indigo-400" />,
    specSummary: 'Forged lightweight alloy rims with compound radial tires.'
  },
  engine: {
    id: 'engine',
    name: 'Tuned Engine',
    category: 'Powertrain',
    icon: <Cpu className="w-5 h-5 text-amber-400" />,
    specSummary: 'Air-cooled 150cc high-compression single cylinder motor.'
  },
  fuel_tank: {
    id: 'fuel_tank',
    name: 'Fuel Tank',
    category: 'Energy Reservoir',
    icon: <Flame className="w-5 h-5 text-orange-400" />,
    specSummary: 'Sculpted warm amber highway tank with knee grips.'
  },
  seat: {
    id: 'seat',
    name: 'Touring Saddle',
    category: 'Rider Comfort',
    icon: <Gauge className="w-5 h-5 text-emerald-400" />,
    specSummary: 'Ergonomic dual-density ribbed leather saddle.'
  },
  paint: {
    id: 'paint',
    name: 'Twilight Paint',
    category: 'Aero Shell & Finish',
    icon: <Zap className="w-5 h-5 text-purple-400" />,
    specSummary: 'Reflective highway finish with protective lacquer.'
  },
  helmet_rack: {
    id: 'helmet_rack',
    name: 'Utility Rack',
    category: 'Gear Attachment',
    icon: <Wrench className="w-5 h-5 text-teal-400" />,
    specSummary: 'Rear tubular rack for focus safety helmet and pack.'
  },
  trophy: {
    id: 'trophy',
    name: 'Mastery Crest',
    category: 'Milestone Insignia',
    icon: <Award className="w-5 h-5 text-yellow-400" />,
    specSummary: 'Polished gold highway endurance milestone medallion.'
  }
};

export const CompositeBikeCanvas: React.FC<CompositeBikeCanvasProps> = ({
  unlockedSlotIds = [],
  isRunning = false,
  isPaused = false,
  tierNumber = 1,
  progressPercent = 0,
  recentUnlockedSlotId = null,
  className = '',
  onSlotClick
}) => {
  const [selectedSlotForDetail, setSelectedSlotForDetail] = useState<BikeSlotId | null>(null);
  const [sparkleSlot, setSparkleSlot] = useState<string | null>(recentUnlockedSlotId);

  useEffect(() => {
    if (recentUnlockedSlotId) {
      setSparkleSlot(recentUnlockedSlotId);
      const timer = setTimeout(() => setSparkleSlot(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [recentUnlockedSlotId]);

  const isSlotInstalled = (slotId: BikeSlotId) => {
    return unlockedSlotIds.some(
      id => id === slotId || id === `part_${slotId}` || id.toLowerCase().includes(slotId)
    );
  };

  const installedCount = BIKE_SLOT_ORDER.filter(isSlotInstalled).length;
  const effectiveProgress = progressPercent || Math.round((installedCount / BIKE_SLOT_ORDER.length) * 100);

  const bikeAsset = ASSET_SLOTS_MANIFEST[`tier_${tierNumber}_bike`]?.expectedPath || '/assets/bike/tier1/full_bike.svg';

  const handleSelectSlot = (slotId: BikeSlotId) => {
    setSelectedSlotForDetail(slotId);
    if (onSlotClick) onSlotClick(slotId);
  };

  return (
    <div
      data-testid="composite-bike-canvas"
      aria-label={`Workshop Bay: Tier ${tierNumber}, ${installedCount} of 8 slots installed`}
      className={`relative w-full rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line)] shadow-lg p-4 sm:p-6 overflow-hidden select-none ${className}`}
    >
      {/* ── 1. WORKSHOP BAY HEADER ── */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--sr-line)]">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            Workshop Bay
          </h2>
          <p className="text-xs text-[var(--sr-text-subtle)] font-medium">
            Fuel Time: Ready • Specs: 150cc Single-Cylinder
          </p>
        </div>
        <div className="text-right">
          <span className="px-2.5 py-1 rounded-xl bg-[var(--sr-primary-subtle)] text-[var(--sr-primary)] text-xs font-black">
            {installedCount}/8 Parts Installed
          </span>
        </div>
      </div>

      {/* ── 2. BIKE ILLUSTRATION SHOWCASE (CSS MASK PROGRESS FILL) ── */}
      <div className="relative w-full h-56 sm:h-72 my-4 flex items-center justify-center overflow-hidden rounded-2xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)]">
        {/* Subtle Ambient Light Floor */}
        <div className="absolute inset-x-8 bottom-4 h-12 bg-amber-500/10 blur-xl rounded-full pointer-events-none" />

        {/* Base: Full Motorbike Illustration */}
        <div className="relative w-full max-w-lg h-full flex items-center justify-center p-2">
          {/* Grayscale / Unlocked Background Silhouette */}
          <img
            src={bikeAsset}
            alt="Highway Cruiser 150"
            className="w-full h-full object-contain filter grayscale opacity-35 transition-all duration-700"
          />

          {/* Color Fill Mask (revealed proportionally by weekly progress) */}
          <div 
            className="absolute inset-0 flex items-center justify-center p-2 transition-all duration-700"
            style={{
              clipPath: `inset(0 ${Math.max(0, 100 - effectiveProgress)}% 0 0)`
            }}
          >
            <img
              src={bikeAsset}
              alt="Highway Cruiser 150 Color Progress"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>
        </div>
      </div>

      {/* ── 3. CHASSIS & ENGINE PARTS (8 TACTILE DUOLINGO-STYLE BADGES) ── */}
      <div className="space-y-3 pt-1">
        <h3 className="text-xs font-black text-[var(--sr-text-muted)] uppercase tracking-wider">
          Chassis & Powertrain Parts
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {BIKE_SLOT_ORDER.map((slotId) => {
            const part = PART_DEFINITIONS[slotId];
            const installed = isSlotInstalled(slotId);
            const isSparkling = sparkleSlot === slotId;

            return (
              <button
                key={slotId}
                type="button"
                onClick={() => handleSelectSlot(slotId)}
                className={`relative p-3 rounded-2xl border-2 text-left transition-all duration-150 active:scale-95 flex flex-col justify-between min-h-[82px] cursor-pointer ${
                  installed
                    ? 'bg-[var(--sr-surface-2)] border-[var(--sr-primary)] text-white shadow-sm'
                    : 'bg-[var(--sr-surface-2)]/60 border-[var(--sr-line)] text-[var(--sr-text-subtle)] hover:border-[var(--sr-line-strong)]'
                } ${isSparkling ? 'ring-2 ring-amber-400 animate-pulse' : ''}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`p-1.5 rounded-xl ${installed ? 'bg-[var(--sr-surface-3)]' : 'bg-slate-800/80'}`}>
                    {part.icon}
                  </div>
                  {installed ? (
                    <span className="w-5 h-5 rounded-full bg-[var(--sr-primary)] text-[var(--sr-on-primary)] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center shrink-0">
                      <Lock className="w-3 h-3" />
                    </span>
                  )}
                </div>

                <div className="mt-2 min-w-0">
                  <span className={`block text-xs font-black truncate ${installed ? 'text-white' : 'text-slate-400'}`}>
                    {part.name}
                  </span>
                  <span className="block text-[10px] font-bold text-[var(--sr-text-subtle)]">
                    {installed ? 'Installed' : 'Locked'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. PART DETAIL MODAL / SHEET ── */}
      {selectedSlotForDetail && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedSlotForDetail(null)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line)] p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[var(--sr-surface-2)]">
                  {PART_DEFINITIONS[selectedSlotForDetail].icon}
                </div>
                <div>
                  <h4 className="text-base font-black text-white">
                    {PART_DEFINITIONS[selectedSlotForDetail].name}
                  </h4>
                  <p className="text-xs text-[var(--sr-text-subtle)] font-bold">
                    {PART_DEFINITIONS[selectedSlotForDetail].category}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSlotForDetail(null)}
                aria-label="Close part details"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[var(--sr-surface-2)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[var(--sr-text-muted)] leading-relaxed">
              {PART_DEFINITIONS[selectedSlotForDetail].specSummary}
            </p>

            <div className="p-3 rounded-2xl bg-[var(--sr-surface-2)] border border-[var(--sr-line)] flex items-center justify-between text-xs font-bold">
              <span className="text-[var(--sr-text-subtle)]">Build Status</span>
              {isSlotInstalled(selectedSlotForDetail) ? (
                <span className="text-[var(--sr-primary)] font-black flex items-center gap-1">
                  <Check className="w-4 h-4 stroke-[3]" /> Installed on Cruiser
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Forges at weekly target
                </span>
              )}
            </div>

            <button
              onClick={() => setSelectedSlotForDetail(null)}
              className="btn-3d btn-3d-slate w-full py-2.5 rounded-2xl text-xs font-black text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
