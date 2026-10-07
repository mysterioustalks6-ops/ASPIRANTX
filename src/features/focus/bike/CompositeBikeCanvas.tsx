import React, { useState, useEffect } from 'react';
import { ASSET_SLOTS_MANIFEST } from './assetManifest';
import { 
  Wrench, Sparkles, Check, Lock, Shield, Cpu, Gauge, Zap, Flame, Award, CircleDot, Info, X
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
  recentUnlockedSlotId?: string | null;
  className?: string;
  onSlotClick?: (slotId: BikeSlotId) => void;
}

interface SlotMeta {
  id: BikeSlotId;
  name: string;
  category: string;
  pinCoordinates: { x: number; y: number };
  icon: React.ReactNode;
  specSummary: string;
}

const SLOT_DEFINITIONS: Record<BikeSlotId, SlotMeta> = {
  frame: {
    id: 'frame',
    name: 'Trellis Chassis Frame',
    category: 'Structural Core',
    pinCoordinates: { x: 260, y: 220 },
    icon: <Shield className="w-3.5 h-3.5" />,
    specSummary: 'High-tensile tubular chromoly steel structure'
  },
  wheels: {
    id: 'wheels',
    name: 'Dual Alloy Wheels',
    category: 'Traction & Rolling',
    pinCoordinates: { x: 120, y: 320 },
    icon: <CircleDot className="w-3.5 h-3.5" />,
    specSummary: '17" Forged lightweight radial rims with compound highway rubber'
  },
  engine: {
    id: 'engine',
    name: 'Twin-Cylinder Engine',
    category: 'Powertrain',
    pinCoordinates: { x: 260, y: 290 },
    icon: <Cpu className="w-3.5 h-3.5" />,
    specSummary: 'Tuned liquid-cooled fuel-injected motor'
  },
  fuel_tank: {
    id: 'fuel_tank',
    name: 'Aerodynamic Fuel Tank',
    category: 'Energy Reservoir',
    pinCoordinates: { x: 280, y: 170 },
    icon: <Flame className="w-3.5 h-3.5" />,
    specSummary: 'Sculpted lightweight reservoir with knee indents'
  },
  seat: {
    id: 'seat',
    name: 'Touring Ergonomic Saddle',
    category: 'Rider Comfort',
    pinCoordinates: { x: 200, y: 185 },
    icon: <Gauge className="w-3.5 h-3.5" />,
    specSummary: 'Dual-density anti-vibration memory foam saddle'
  },
  paint: {
    id: 'paint',
    name: 'Twilight Road Paintwork',
    category: 'Aero Shell & Finish',
    pinCoordinates: { x: 330, y: 190 },
    icon: <Zap className="w-3.5 h-3.5" />,
    specSummary: 'High-gloss reflective twilight indigo metallic coat'
  },
  helmet_rack: {
    id: 'helmet_rack',
    name: 'Chassis Utility Rack',
    category: 'Gear Attachment',
    pinCoordinates: { x: 160, y: 160 },
    icon: <Wrench className="w-3.5 h-3.5" />,
    specSummary: 'Quick-release touring carrier for safety gear'
  },
  trophy: {
    id: 'trophy',
    name: 'Highway Mastery Crest',
    category: 'Milestone Insignia',
    pinCoordinates: { x: 380, y: 150 },
    icon: <Award className="w-3.5 h-3.5" />,
    specSummary: 'Polished gold endurance milestone medallion'
  }
};

export const CompositeBikeCanvas: React.FC<CompositeBikeCanvasProps> = ({
  unlockedSlotIds = [],
  isRunning = false,
  isPaused = false,
  tierNumber = 1,
  recentUnlockedSlotId = null,
  className = '',
  onSlotClick
}) => {
  const [selectedSlotForDetail, setSelectedSlotForDetail] = useState<BikeSlotId | null>(null);
  const [sparkleSlot, setSparkleSlot] = useState<string | null>(recentUnlockedSlotId);

  // Check prefers-reduced-motion
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
      const timer = setTimeout(() => setSparkleSlot(null), 1200);
      return () => clearTimeout(timer);
    }
  }, [recentUnlockedSlotId]);

  const isIdleActive = isRunning && !isPaused && !prefersReducedMotion;
  const installedCount = unlockedSlotIds.filter(id => 
    BIKE_SLOT_ORDER.some(s => s === id || `part_${s}` === id || id.toLowerCase().includes(s))
  ).length;

  const isSlotInstalled = (slotId: BikeSlotId) => {
    return unlockedSlotIds.some(
      id => id === slotId || id === `part_${slotId}` || id.toLowerCase().includes(slotId)
    );
  };

  const handleSelectSlot = (slotId: BikeSlotId) => {
    setSelectedSlotForDetail(slotId);
    if (onSlotClick) onSlotClick(slotId);
  };

  return (
    <div
      data-testid="composite-bike-canvas"
      aria-label={`Composite Bike: Tier ${tierNumber}, ${installedCount} of 8 slots installed`}
      className={`relative w-full max-w-3xl mx-auto rounded-3xl bg-slate-950 border border-slate-800/90 shadow-2xl p-4 sm:p-6 overflow-hidden select-none ${className}`}
    >
      {/* ── 1. WORKSHOP BAY AMBIENCE & HOLOGRAPHIC GRID ── */}
      <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-600/30 via-slate-950 to-slate-950" />
      
      {/* Blueprint Iso Grid Lines */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '28px 28px'
        }}
      />

      {/* ── 2. WORKSHOP TELEMETRY HEADER ── */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono font-black text-amber-400 tracking-wider">
            WORKSHOP BAY • TIER {tierNumber} CHASSIS RIG
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400">
            SPEC: <span className="text-cyan-400 font-bold">150cc–1000cc FORGED</span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
            {installedCount} / 8 INSTALLED
          </span>
        </div>
      </div>

      {/* ── 3. MECHANICAL BLUEPRINT SCHEMATIC STAGE ── */}
      <div className="relative w-full h-64 sm:h-72 my-3 flex items-center justify-center">
        {/* Overhead Workshop Light Cone */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-48 bg-gradient-to-b from-indigo-500/15 via-cyan-500/5 to-transparent blur-xl pointer-events-none"
        />

        {/* Hydraulic Lift Base Plate with Hazard Stripes */}
        <div className="absolute bottom-2 left-6 right-6 h-4 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden">
          <div 
            className="w-full h-full opacity-30"
            style={{
              backgroundImage: 'repeating-linear-gradient(45deg, #f59e0b 0, #f59e0b 8px, #0f172a 8px, #0f172a 16px)'
            }}
          />
        </div>

        {/* ── INTRICATE VECTOR MOTORCYCLE BLUEPRINT SCHEMATIC ── */}
        <svg
          className={`relative z-10 w-full h-full max-w-lg transition-transform duration-500 ${
            isIdleActive ? 'animate-bounce-subtle' : ''
          }`}
          viewBox="0 0 512 360"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Blueprint Axis Guide Lines */}
          <line x1="20" y1="315" x2="492" y2="315" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="256" y1="40" x2="256" y2="315" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />

          {/* ── SLOT 2: ALLOY WHEELS (Front & Rear) ── */}
          <g id="schematic-wheels" className="transition-opacity duration-300">
            {/* Rear Wheel (Left) */}
            <circle cx="110" cy="270" r="48" stroke={isSlotInstalled('wheels') ? '#10b981' : '#38bdf8'} strokeWidth="4" fill="#020617" opacity={isSlotInstalled('wheels') ? '1' : '0.45'} />
            <circle cx="110" cy="270" r="32" stroke="#475569" strokeWidth="2" strokeDasharray="6 3" />
            <circle cx="110" cy="270" r="12" fill={isSlotInstalled('wheels') ? '#059669' : '#1e293b'} />
            {/* Spokes */}
            <line x1="110" y1="222" x2="110" y2="318" stroke="#64748b" strokeWidth="1.5" />
            <line x1="62" y1="270" x2="158" y2="270" stroke="#64748b" strokeWidth="1.5" />
            <line x1="76" y1="236" x2="144" y2="304" stroke="#64748b" strokeWidth="1.5" />
            <line x1="76" y1="304" x2="144" y2="236" stroke="#64748b" strokeWidth="1.5" />

            {/* Front Wheel (Right) */}
            <circle cx="400" cy="270" r="48" stroke={isSlotInstalled('wheels') ? '#10b981' : '#38bdf8'} strokeWidth="4" fill="#020617" opacity={isSlotInstalled('wheels') ? '1' : '0.45'} />
            <circle cx="400" cy="270" r="32" stroke="#475569" strokeWidth="2" strokeDasharray="6 3" />
            <circle cx="400" cy="270" r="12" fill={isSlotInstalled('wheels') ? '#059669' : '#1e293b'} />
            {/* Front Brake Rotor */}
            <circle cx="400" cy="270" r="22" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
            {/* Spokes */}
            <line x1="400" y1="222" x2="400" y2="318" stroke="#64748b" strokeWidth="1.5" />
            <line x1="352" y1="270" x2="448" y2="270" stroke="#64748b" strokeWidth="1.5" />
            <line x1="366" y1="236" x2="434" y2="304" stroke="#64748b" strokeWidth="1.5" />
            <line x1="366" y1="304" x2="434" y2="236" stroke="#64748b" strokeWidth="1.5" />
          </g>

          {/* ── SLOT 1: CHASSIS FRAME (Trellis) ── */}
          <g id="schematic-frame">
            {/* Rear Swingarm */}
            <path d="M110 270 L210 255 L210 275 Z" fill="#090d16" stroke={isSlotInstalled('frame') ? '#10b981' : '#38bdf8'} strokeWidth="3" opacity={isSlotInstalled('frame') ? '1' : '0.5'} />
            {/* Front Telescopic Inverted Forks */}
            <line x1="400" y1="270" x2="350" y2="120" stroke={isSlotInstalled('frame') ? '#10b981' : '#64748b'} strokeWidth="5" />
            <line x1="392" y1="270" x2="342" y2="120" stroke="#94a3b8" strokeWidth="2" />

            {/* Trellis Diamond Frame Triangles */}
            <path
              d="M210 255 L230 160 L330 140 L350 120 L270 230 L210 255 Z"
              fill={isSlotInstalled('frame') ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.05)'}
              stroke={isSlotInstalled('frame') ? '#10b981' : '#6366f1'}
              strokeWidth="3.5"
            />
            <line x1="230" y1="160" x2="270" y2="230" stroke="#475569" strokeWidth="2" />
            <line x1="330" y1="140" x2="270" y2="230" stroke="#475569" strokeWidth="2" />
          </g>

          {/* ── SLOT 3: ENGINE BLOCK ── */}
          <g id="schematic-engine">
            <rect
              x="220"
              y="215"
              width="65"
              height="55"
              rx="6"
              fill={isSlotInstalled('engine') ? '#1e293b' : '#090d16'}
              stroke={isSlotInstalled('engine') ? '#10b981' : '#f59e0b'}
              strokeWidth="2.5"
            />
            {/* Cooling Fins */}
            <line x1="225" y1="225" x2="280" y2="225" stroke="#64748b" strokeWidth="1.5" />
            <line x1="225" y1="235" x2="280" y2="235" stroke="#64748b" strokeWidth="1.5" />
            <line x1="225" y1="245" x2="280" y2="245" stroke="#64748b" strokeWidth="1.5" />
            <line x1="225" y1="255" x2="280" y2="255" stroke="#64748b" strokeWidth="1.5" />
            {/* Twin Exhaust Pipe Route */}
            <path d="M280 250 C310 255 260 290 140 295" stroke="#94a3b8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <rect x="130" y="288" width="55" height="14" rx="4" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
          </g>

          {/* ── SLOT 4: FUEL TANK ── */}
          <g id="schematic-fuel-tank">
            <path
              d="M230 160 C250 120 310 115 340 135 L330 165 C280 170 250 170 230 160 Z"
              fill={isSlotInstalled('fuel_tank') ? '#312e81' : '#0f172a'}
              stroke={isSlotInstalled('fuel_tank') ? '#10b981' : '#fbbf24'}
              strokeWidth="3"
            />
            {/* Filler Cap */}
            <ellipse cx="295" cy="132" rx="6" ry="3" fill="#64748b" stroke="#cbd5e1" strokeWidth="1" />
          </g>

          {/* ── SLOT 5: TOURING SADDLE ── */}
          <g id="schematic-seat">
            <path
              d="M170 165 C180 155 205 155 230 160 L220 180 C195 178 180 175 170 165 Z"
              fill={isSlotInstalled('seat') ? '#1e1b4b' : '#090d16'}
              stroke={isSlotInstalled('seat') ? '#10b981' : '#38bdf8'}
              strokeWidth="2.5"
            />
          </g>

          {/* ── SLOT 6: AERODYNAMIC PAINT / FRONT COWL ── */}
          <g id="schematic-paint">
            <path
              d="M340 120 C365 110 385 125 390 145 L355 160 Z"
              fill={isSlotInstalled('paint') ? '#4338ca' : '#090d16'}
              stroke={isSlotInstalled('paint') ? '#10b981' : '#818cf8'}
              strokeWidth="2.5"
            />
            {/* Headlight Pod */}
            <polygon points="385,135 398,140 388,148" fill={isSlotInstalled('paint') ? '#fef08a' : '#1e293b'} />
          </g>

          {/* ── SLOT 7: HELMET RACK (Tail Carrier) ── */}
          <g id="schematic-helmet-rack">
            <path
              d="M140 180 L170 165 L170 185 Z"
              fill="none"
              stroke={isSlotInstalled('helmet_rack') ? '#10b981' : '#64748b'}
              strokeWidth="2.5"
            />
            <circle cx="150" cy="165" r="5" stroke={isSlotInstalled('helmet_rack') ? '#10b981' : '#475569'} strokeWidth="1.5" fill="#0f172a" />
          </g>

          {/* ── SLOT 8: MASTERY CREST ── */}
          <g id="schematic-trophy">
            <circle
              cx="256"
              cy="95"
              r="14"
              fill={isSlotInstalled('trophy') ? '#f59e0b' : '#0f172a'}
              stroke={isSlotInstalled('trophy') ? '#fbbf24' : '#475569'}
              strokeWidth="2"
            />
            <polygon
              points="256,86 260,94 268,95 262,100 264,108 256,104 248,108 250,100 244,95 252,94"
              fill={isSlotInstalled('trophy') ? '#ffffff' : '#334155'}
            />
          </g>
        </svg>
      </div>

      {/* ── 4. THE 8 MECHANICAL POD CARDS (RESPONSIVE BLUEPRINT GRID) ── */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 font-bold text-indigo-400">
            <Wrench className="w-3.5 h-3.5" />
            ENGINEERING BAY MODULES (TAP TO INSPECT)
          </span>
          <span className="text-[11px]">8 MODULAR SLOTS</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BIKE_SLOT_ORDER.map((slotId, index) => {
            const def = SLOT_DEFINITIONS[slotId];
            const isInstalled = isSlotInstalled(slotId);
            const isSparkling = sparkleSlot === slotId || sparkleSlot === `part_${slotId}`;
            const zOrder = index + 1;

            return (
              <button
                key={slotId}
                type="button"
                onClick={() => handleSelectSlot(slotId)}
                className={`relative group p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isInstalled
                    ? 'bg-slate-900/90 border-emerald-500/50 hover:border-emerald-400 shadow-md shadow-emerald-950/20'
                    : 'bg-slate-950/50 border-slate-800/70 hover:border-slate-700 opacity-80'
                } ${
                  isSparkling && !prefersReducedMotion ? 'animate-slot-unlock' : ''
                }`}
              >
                {/* Header row: Layer index & status */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300">
                    L{zOrder}
                  </span>
                  {isInstalled ? (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <Check className="w-2.5 h-2.5" />
                      READY
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[9px] font-mono text-slate-400">
                      <Lock className="w-2.5 h-2.5" />
                      LOCKED
                    </span>
                  )}
                </div>

                {/* Slot Icon & Title */}
                <div className="flex items-center gap-1.5">
                  <div className={`p-1 rounded-lg ${isInstalled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                    {def.icon}
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">
                    {def.name}
                  </h4>
                </div>

                {/* Placeholder / Category tag */}
                <div className="mt-1.5 flex items-center justify-between text-[10px] font-mono text-slate-400 truncate">
                  <span className="truncate">{def.category}</span>
                  <Info className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {isSparkling && (
                  <span className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-amber-400 text-slate-950 animate-ping">
                    <Sparkles className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. MECHANICAL PART INSPECTION MODAL (TAP ANY SLOT) ── */}
      {selectedSlotForDetail && (
        <div 
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedSlotForDetail(null)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-5 space-y-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300">
                  {SLOT_DEFINITIONS[selectedSlotForDetail].icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {SLOT_DEFINITIONS[selectedSlotForDetail].name}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    {SLOT_DEFINITIONS[selectedSlotForDetail].category}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSlotForDetail(null)}
                aria-label="Close"
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p className="font-medium text-slate-200">
                {SLOT_DEFINITIONS[selectedSlotForDetail].specSummary}
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Layer Order:</span>
                  <span className="text-indigo-400 font-bold">
                    Layer {BIKE_SLOT_ORDER.indexOf(selectedSlotForDetail) + 1} of 8
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Installation Status:</span>
                  <span className={isSlotInstalled(selectedSlotForDetail) ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {isSlotInstalled(selectedSlotForDetail) ? 'Installed on Chassis' : 'Locked (Pending Study Target)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Asset Key:</span>
                  <span className="text-slate-400 truncate">
                    placeholder: part_{selectedSlotForDetail}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedSlotForDetail(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Close Blueprint Spec
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
