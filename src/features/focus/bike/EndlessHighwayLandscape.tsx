import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Moon, Sun, Wind, Sparkles } from 'lucide-react';

export interface EndlessHighwayLandscapeProps {
  className?: string;
  isDriving?: boolean;
  speedMultiplier?: number;
}

export type SceneryAtmosphere = 'twilight' | 'himalayan_dawn' | 'misty_valley' | 'midnight_desert';

interface AtmosphereConfig {
  id: SceneryAtmosphere;
  name: string;
  skyGradient: string;
  mountainFarColor: string;
  mountainMidColor: string;
  valleyMistColor: string;
  hillsNearColor: string;
  roadColor: string;
  roadLineColor: string;
  ambientDescription: string;
}

const ATMOSPHERES: Record<SceneryAtmosphere, AtmosphereConfig> = {
  twilight: {
    id: 'twilight',
    name: 'Twilight Pass',
    skyGradient: 'from-slate-950 via-indigo-950/90 to-purple-900/40',
    mountainFarColor: '#1e1b4b',
    mountainMidColor: '#0f172a',
    valleyMistColor: 'rgba(99, 102, 241, 0.25)',
    hillsNearColor: '#090d16',
    roadColor: '#0b0f19',
    roadLineColor: '#fbbf24',
    ambientDescription: 'Distant peaks beneath the evening stars'
  },
  himalayan_dawn: {
    id: 'himalayan_dawn',
    name: 'Himalayan Dawn',
    skyGradient: 'from-slate-950 via-rose-950/70 to-amber-900/30',
    mountainFarColor: '#31102a',
    mountainMidColor: '#180e29',
    valleyMistColor: 'rgba(251, 146, 60, 0.22)',
    hillsNearColor: '#0c0a14',
    roadColor: '#0b0f19',
    roadLineColor: '#f59e0b',
    ambientDescription: 'First rays touching far-off snow ridges'
  },
  misty_valley: {
    id: 'misty_valley',
    name: 'Misty Valleys',
    skyGradient: 'from-slate-950 via-teal-950/70 to-cyan-900/30',
    mountainFarColor: '#0f292d',
    mountainMidColor: '#07181c',
    valleyMistColor: 'rgba(45, 212, 191, 0.22)',
    hillsNearColor: '#030d10',
    roadColor: '#061014',
    roadLineColor: '#38bdf8',
    ambientDescription: 'Deep cloud valleys softly echoing the ride'
  },
  midnight_desert: {
    id: 'midnight_desert',
    name: 'Midnight Desert',
    skyGradient: 'from-slate-950 via-slate-900 to-indigo-950/40',
    mountainFarColor: '#111827',
    mountainMidColor: '#0b1120',
    valleyMistColor: 'rgba(148, 163, 184, 0.15)',
    hillsNearColor: '#050811',
    roadColor: '#070a12',
    roadLineColor: '#e2e8f0',
    ambientDescription: 'Infinite silence under the celestial dome'
  }
};

export const EndlessHighwayLandscape: React.FC<EndlessHighwayLandscapeProps> = ({
  className = '',
  isDriving = true,
  speedMultiplier = 1
}) => {
  const [atmosphere, setAtmosphere] = useState<SceneryAtmosphere>('twilight');
  const [isAudioMuted, setIsAudioMuted] = useState(true);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  const config = ATMOSPHERES[atmosphere];

  // Check prefers-reduced-motion
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
  }, []);

  // Guided breathing cycle (4s in, 4s hold, 4s out)
  useEffect(() => {
    const cycle = ['Inhale', 'Hold', 'Exhale'] as const;
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % 3;
      setBreathPhase(cycle[idx]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const shouldAnimate = isDriving && !prefersReducedMotion;

  return (
    <div 
      className={`relative w-full h-full overflow-hidden select-none bg-slate-950 ${className}`}
      aria-label="Endless Highway Landscape towards distant mountains and valleys"
    >
      {/* ── 1. SKY GRADIENT ── */}
      <div className={`absolute inset-0 bg-gradient-to-b ${config.skyGradient} transition-colors duration-1000`} />

      {/* ── 2. CELESTIAL ELEMENTS (STARS & HORIZON GLOW) ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="horizonGlow" cx="50%" cy="58%" r="45%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#818cf8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#horizonGlow)" />
        {/* Distant Twinkling Stars */}
        <circle cx="15%" cy="12%" r="1" fill="#ffffff" opacity="0.8" />
        <circle cx="28%" cy="20%" r="1.5" fill="#e0e7ff" opacity="0.6" />
        <circle cx="42%" cy="8%" r="1" fill="#ffffff" opacity="0.7" />
        <circle cx="68%" cy="15%" r="1.2" fill="#e0e7ff" opacity="0.9" />
        <circle cx="82%" cy="10%" r="1.8" fill="#ffffff" opacity="0.8" />
        <circle cx="91%" cy="25%" r="1" fill="#ffffff" opacity="0.5" />
        <circle cx="53%" cy="18%" r="1.5" fill="#fef08a" opacity="0.75" />
      </svg>

      {/* ── 3. LAYERED MAJESTIC FAR MOUNTAINS (NEVER REACHED) ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Layer 3A: Furthest Mountain Ridges */}
        <path
          d="M0,360 L80,310 L160,340 L260,280 L350,330 L450,260 L500,290 L560,250 L660,320 L760,270 L870,330 L940,300 L1000,340 L1000,600 L0,600 Z"
          fill={config.mountainFarColor}
          opacity="0.95"
          className="transition-colors duration-700"
        />

        {/* Snow & Crest Edge Highlights */}
        <path
          d="M260,280 L275,305 L245,305 Z M450,260 L470,288 L435,288 Z M560,250 L585,280 L540,280 Z M760,270 L780,298 L745,298 Z"
          fill="#ffffff"
          opacity="0.25"
        />

        {/* Layer 3B: Valley Mist / Cloud Layer nestled between mountain ranges */}
        <rect
          x="0"
          y="320"
          width="1000"
          height="80"
          fill={config.valleyMistColor}
          className="transition-colors duration-700 blur-sm"
        />

        {/* Layer 3C: Middle Rolling Valley Peaks & Mountain Slopes */}
        <path
          d="M0,410 Q120,350 250,390 T500,370 T750,400 T1000,380 L1000,600 L0,600 Z"
          fill={config.mountainMidColor}
          className="transition-colors duration-700"
        />

        {/* Layer 3D: Near Foothills & Valley Base */}
        <path
          d="M0,460 Q200,420 400,450 Q500,430 600,450 Q800,420 1000,460 L1000,600 L0,600 Z"
          fill={config.hillsNearColor}
          className="transition-colors duration-700"
        />
      </svg>

      {/* ── 4. ENDLESS PERSPECTIVE HIGHWAY ROAD (CONVERGING TO VALLEY HORIZON) ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Asphalt Texture Gradient */}
          <linearGradient id="roadSurface" x1="50%" y1="70%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={config.roadColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor="#030712" stopOpacity="1" />
          </linearGradient>

          {/* Road Verge & Side Glow */}
          <linearGradient id="vergeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
            <stop offset="50%" stopColor="transparent" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* The Highway: Vanishing point at horizon (x=500, y=435), flares out to width at bottom (x=120 to x=880) */}
        <polygon
          points="496,435 504,435 880,600 120,600"
          fill="url(#roadSurface)"
        />
        <polygon
          points="496,435 504,435 880,600 120,600"
          fill="url(#vergeGlow)"
        />

        {/* Road Left & Right Solid Edge Lines */}
        <line x1="496" y1="435" x2="120" y2="600" stroke="#475569" strokeWidth="2" opacity="0.6" />
        <line x1="504" y1="435" x2="880" y2="600" stroke="#475569" strokeWidth="2" opacity="0.6" />

        {/* Side Reflective Markers on the Verges (diminishing perspective) */}
        <circle cx="493" cy="442" r="1" fill="#38bdf8" opacity="0.3" />
        <circle cx="507" cy="442" r="1" fill="#38bdf8" opacity="0.3" />
        <circle cx="475" cy="470" r="1.5" fill="#38bdf8" opacity="0.5" />
        <circle cx="525" cy="470" r="1.5" fill="#38bdf8" opacity="0.5" />
        <circle cx="430" cy="515" r="2.5" fill="#38bdf8" opacity="0.7" />
        <circle cx="570" cy="515" r="2.5" fill="#38bdf8" opacity="0.7" />
        <circle cx="340" cy="570" r="3.5" fill="#38bdf8" opacity="0.9" />
        <circle cx="660" cy="570" r="3.5" fill="#38bdf8" opacity="0.9" />
      </svg>

      {/* ── 5. PERSPECTIVE DASHED CENTERLINE ANIMATION (FLOWING FORWARD) ── */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <svg
          className="w-full h-full"
          viewBox="0 0 1000 600"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Animated Perspective Center Dashes */}
          <g className={shouldAnimate ? 'animate-road-perspective' : ''}>
            {/* Near Dash */}
            <polygon points="498,550 502,550 504,595 496,595" fill={config.roadLineColor} opacity="0.9" />
            {/* Mid-Near Dash */}
            <polygon points="498.5,500 501.5,500 503,535 497,535" fill={config.roadLineColor} opacity="0.8" />
            {/* Mid Dash */}
            <polygon points="499,468 501,468 502,490 498,490" fill={config.roadLineColor} opacity="0.7" />
            {/* Far Dash */}
            <polygon points="499.3,448 500.7,448 501.4,462 498.6,462" fill={config.roadLineColor} opacity="0.5" />
            {/* Horizon Tip Dash */}
            <polygon points="499.6,437 500.4,437 500.8,444 499.2,444" fill={config.roadLineColor} opacity="0.3" />
          </g>
        </svg>
      </div>

      {/* ── 6. SLEEK RIDER / BIKE SILHOUETTE GLIDING TOWARDS HORIZON ── */}
      <div 
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-transform duration-300 ${
          shouldAnimate ? 'animate-bike-hover' : ''
        }`}
      >
        {/* Soft Headlight Beam illuminating the asphalt ahead */}
        <div 
          className="w-48 h-36 -mb-6 bg-gradient-to-t from-transparent via-amber-300/10 to-transparent blur-md rounded-full pointer-events-none"
          style={{ transform: 'perspective(200px) rotateX(60deg)' }}
        />

        {/* Vector Rider Silhouette Rear Profile */}
        <svg width="84" height="96" viewBox="0 0 84 96" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Red Glowing Taillight */}
          <circle cx="42" cy="74" r="5" fill="#f43f5e" />
          <circle cx="42" cy="74" r="10" fill="#f43f5e" opacity="0.4" className="animate-pulse" />

          {/* Rear Wheel & Fender */}
          <rect x="36" y="70" width="12" height="20" rx="6" fill="#020617" stroke="#334155" strokeWidth="2" />

          {/* Twin Exhausts / Chassis Body */}
          <path d="M26 68 L32 78 L52 78 L58 68 Z" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />

          {/* Fuel Tank & Tail Cowl */}
          <path d="M30 52 C30 46 36 42 42 42 C48 42 54 46 54 52 L56 66 L28 66 Z" fill="#1e293b" stroke="#6366f1" strokeWidth="1.5" />

          {/* Rider Torso & Riding Jacket */}
          <path d="M28 32 C28 26 34 22 42 22 C50 22 56 26 56 32 L58 50 L26 50 Z" fill="#090d16" stroke="#38bdf8" strokeWidth="1" />

          {/* Rider Helmet (Aerodynamic Shell) */}
          <ellipse cx="42" cy="18" rx="10" ry="12" fill="#020617" stroke="#818cf8" strokeWidth="1.5" />
          {/* Reflective Visor Stripe */}
          <path d="M36 18 Q42 21 48 18" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />

          {/* Handlebar & Rear Mirrors Silhouette */}
          <line x1="20" y1="40" x2="30" y2="44" stroke="#64748b" strokeWidth="2" />
          <line x1="64" y1="40" x2="54" y2="44" stroke="#64748b" strokeWidth="2" />
          <circle cx="18" cy="38" r="3" fill="#020617" stroke="#94a3b8" />
          <circle cx="66" cy="38" r="3" fill="#020617" stroke="#94a3b8" />
        </svg>

        {/* Ambient Ground Shadow */}
        <div className="w-24 h-3 bg-black/60 blur-sm rounded-full -mt-1" />
      </div>

      {/* ── 7. SUBTLE FLOATING ZEN OVERLAY (NO DIGITS, PURE SERENITY) ── */}
      <div className="absolute top-16 left-0 right-0 flex flex-col items-center pointer-events-none px-4">
        {/* Subtle breathing guide badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-slate-800/80 text-slate-300 text-xs shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-medium tracking-wide">
            {config.ambientDescription}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-1" />
        </div>

        {/* Guided Calm Breath Rhythm */}
        <div className="mt-2 text-[11px] font-mono tracking-widest text-slate-400/80 uppercase">
          {breathPhase} • Keep Riding Calmly
        </div>
      </div>

      {/* ── 8. BOTTOM AMBIENT CONTROLS (SCENERY CHANGER) ── */}
      <div className="absolute bottom-28 left-4 right-4 flex items-center justify-between pointer-events-auto z-20">
        {/* Atmosphere Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-slate-800/90 shadow-xl overflow-x-auto max-w-[80vw]">
          {(Object.keys(ATMOSPHERES) as SceneryAtmosphere[]).map((atmKey) => {
            const atm = ATMOSPHERES[atmKey];
            const isActive = atmosphere === atmKey;
            return (
              <button
                key={atmKey}
                onClick={() => setAtmosphere(atmKey)}
                aria-label={`Select ${atm.name}`}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {atm.name}
              </button>
            );
          })}
        </div>

        {/* Sound toggle hint */}
        <button
          onClick={() => setIsAudioMuted(!isAudioMuted)}
          aria-label={isAudioMuted ? 'Mute Atmosphere' : 'Unmute Atmosphere'}
          className="p-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
      </div>
    </div>
  );
};
