import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Moon, Sun, Wind, CloudRain, Sparkles, Compass, AlertCircle } from 'lucide-react';

export interface EndlessHighwayLandscapeProps {
  className?: string;
  isDriving?: boolean;
  progressPercent?: number; // 0 to 100%
  speedMultiplier?: number;
}

export type SceneryStage = 'mountain_pass' | 'valley' | 'forest_rain' | 'sunrise';

interface StageConfig {
  id: SceneryStage;
  name: string;
  progressThreshold: number; // 0, 25, 50, 75
  skyGradient: string;
  mountainFarColor: string;
  mountainMidColor: string;
  valleyMistColor: string;
  hillsNearColor: string;
  roadColor: string;
  roadLineColor: string;
  ambientDescription: string;
  hasRain?: boolean;
}

const STAGES: Record<SceneryStage, StageConfig> = {
  mountain_pass: {
    id: 'mountain_pass',
    name: 'Mountain Pass (0%)',
    progressThreshold: 0,
    skyGradient: 'from-slate-950 via-indigo-950/90 to-purple-950/60',
    mountainFarColor: '#1e1b4b',
    mountainMidColor: '#0f172a',
    valleyMistColor: 'rgba(99, 102, 241, 0.22)',
    hillsNearColor: '#090d16',
    roadColor: '#0b0f19',
    roadLineColor: '#fbbf24',
    ambientDescription: 'Distant high peaks under clear starlight',
    hasRain: false
  },
  valley: {
    id: 'valley',
    name: 'Misty Valley (25%)',
    progressThreshold: 25,
    skyGradient: 'from-slate-950 via-teal-950/80 to-emerald-950/40',
    mountainFarColor: '#0f292d',
    mountainMidColor: '#062024',
    valleyMistColor: 'rgba(45, 212, 191, 0.25)',
    hillsNearColor: '#041318',
    roadColor: '#07151a',
    roadLineColor: '#38bdf8',
    ambientDescription: 'Winding highway through serene deep valley mist',
    hasRain: false
  },
  forest_rain: {
    id: 'forest_rain',
    name: 'Pine Forest & Rain (50%)',
    progressThreshold: 50,
    skyGradient: 'from-slate-950 via-slate-900/90 to-emerald-950/60',
    mountainFarColor: '#0a1a1e',
    mountainMidColor: '#061612',
    valleyMistColor: 'rgba(56, 189, 248, 0.20)',
    hillsNearColor: '#03110d',
    roadColor: '#050d0a',
    roadLineColor: '#6ee7b7',
    ambientDescription: 'Dense fragrant pines with refreshing gentle shower',
    hasRain: true
  },
  sunrise: {
    id: 'sunrise',
    name: 'Himalayan Sunrise (75%)',
    progressThreshold: 75,
    skyGradient: 'from-slate-950 via-rose-950/70 to-amber-900/40',
    mountainFarColor: '#33132d',
    mountainMidColor: '#1c0f2b',
    valleyMistColor: 'rgba(251, 146, 60, 0.25)',
    hillsNearColor: '#0e0b16',
    roadColor: '#0e0e18',
    roadLineColor: '#f59e0b',
    ambientDescription: 'Golden morning cresting over eternal snow ridges',
    hasRain: false
  }
};

export const EndlessHighwayLandscape: React.FC<EndlessHighwayLandscapeProps> = ({
  className = '',
  isDriving = true,
  progressPercent = 0,
  speedMultiplier = 1
}) => {
  // Determine automatic stage based on ride progress (0%, 25%, 50%, 75%)
  const autoStage: SceneryStage = progressPercent >= 75
    ? 'sunrise'
    : progressPercent >= 50
    ? 'forest_rain'
    : progressPercent >= 25
    ? 'valley'
    : 'mountain_pass';

  const [selectedStage, setSelectedStage] = useState<SceneryStage>(autoStage);
  const [selectedSound, setSelectedSound] = useState<'off' | 'rain' | 'wind' | 'engine'>('off');
  const [soundTooltip, setSoundTooltip] = useState<string | null>(null);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');

  // Sync stage if auto progress changes
  useEffect(() => {
    setSelectedStage(autoStage);
  }, [autoStage]);

  const config = STAGES[selectedStage];

  // prefers-reduced-motion check
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

  const handleSoundSelect = (soundKey: 'off' | 'rain' | 'wind' | 'engine') => {
    if (soundKey === 'off') {
      setSelectedSound('off');
      setSoundTooltip(null);
    } else {
      // Audio files pending in assets/manifest.json
      const filename = soundKey === 'rain' ? 'rain.mp3' : soundKey === 'wind' ? 'wind.mp3' : 'engine_hum.mp3';
      setSoundTooltip(`Coming soon (Missing public/sounds/${filename})`);
      setTimeout(() => setSoundTooltip(null), 3500);
    }
  };

  return (
    <div 
      className={`relative w-full h-full overflow-hidden select-none bg-slate-950 ${className}`}
      aria-label="Endless Highway Landscape towards distant mountains and valleys"
    >
      {/* ── 1. SKY GRADIENT (2s Cross-fade) ── */}
      <div 
        className={`absolute inset-0 bg-gradient-to-b ${config.skyGradient}`}
        style={{ transition: 'all 2000ms ease-in-out' }}
      />

      {/* ── 2. CELESTIAL STARS & HORIZON GLOW ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="horizonGlow" cx="50%" cy="58%" r="45%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.25" />
            <stop offset="60%" stopColor="#818cf8" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#horizonGlow)" />
        <circle cx="15%" cy="12%" r="1" fill="#ffffff" opacity="0.8" />
        <circle cx="28%" cy="20%" r="1.5" fill="#e0e7ff" opacity="0.6" />
        <circle cx="42%" cy="8%" r="1" fill="#ffffff" opacity="0.7" />
        <circle cx="68%" cy="15%" r="1.2" fill="#e0e7ff" opacity="0.9" />
        <circle cx="82%" cy="10%" r="1.8" fill="#ffffff" opacity="0.8" />
        <circle cx="91%" cy="25%" r="1" fill="#ffffff" opacity="0.5" />
        <circle cx="53%" cy="18%" r="1.5" fill="#fef08a" opacity="0.75" />
      </svg>

      {/* ── 3. FOUR LAYER SILHOUETTE MOUNTAINS (JOINED TO GROUND, NO FLOATING TRIANGLES) ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transition: 'fill 2000ms ease-in-out' }}
      >
        {/* Layer 3A: Far Mountain Ridge (Solid Polygon Joined to Bottom) */}
        <polygon
          points="0,370 70,320 150,350 240,290 340,340 440,270 500,300 560,260 670,330 780,280 880,340 950,310 1000,350 1000,600 0,600"
          fill={config.mountainFarColor}
          opacity="0.95"
          style={{ transition: 'fill 2000ms ease-in-out' }}
        />

        {/* Layer 3B: Valley Mist / Cloud Layer Between Ridges */}
        <rect
          x="0"
          y="320"
          width="1000"
          height="90"
          fill={config.valleyMistColor}
          className="blur-sm"
          style={{ transition: 'fill 2000ms ease-in-out' }}
        />

        {/* Layer 3C: Middle Rolling Valley Ridge (Joined to Bottom) */}
        <path
          d="M0,410 Q140,360 260,395 T500,375 T740,405 T1000,385 L1000,600 L0,600 Z"
          fill={config.mountainMidColor}
          style={{ transition: 'fill 2000ms ease-in-out' }}
        />

        {/* Layer 3D: Near Foothills & Valley Base (Joined to Bottom) */}
        <path
          d="M0,455 Q200,425 400,448 Q500,432 600,448 Q800,425 1000,455 L1000,600 L0,600 Z"
          fill={config.hillsNearColor}
          style={{ transition: 'fill 2000ms ease-in-out' }}
        />
      </svg>

      {/* ── OPTIONAL RAIN LAYER (WHEN IN FOREST & RAIN STAGE) ── */}
      {config.hasRain && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" xmlns="http://www.w3.org/2000/svg">
          <line x1="20%" y1="0" x2="18%" y2="100%" stroke="#38bdf8" strokeWidth="1" strokeDasharray="6 20" />
          <line x1="40%" y1="0" x2="38%" y2="100%" stroke="#38bdf8" strokeWidth="1" strokeDasharray="8 24" />
          <line x1="60%" y1="0" x2="58%" y2="100%" stroke="#38bdf8" strokeWidth="1" strokeDasharray="5 18" />
          <line x1="80%" y1="0" x2="78%" y2="100%" stroke="#38bdf8" strokeWidth="1" strokeDasharray="7 22" />
        </svg>
      )}

      {/* ── 4. ENDLESS PERSPECTIVE HIGHWAY ROAD (WIDE & CLEAR) ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1000 600"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="roadSurfaceGrad" x1="50%" y1="70%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={config.roadColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor="#030712" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="vergeGlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e293b" stopOpacity="0.4" />
            <stop offset="50%" stopColor="transparent" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Highway Body: Vanishing point at horizon (x=500, y=435), flares out wide at bottom (x=120 to x=880) */}
        <polygon
          points="496,435 504,435 880,600 120,600"
          fill="url(#roadSurfaceGrad)"
          style={{ transition: 'all 2000ms ease-in-out' }}
        />
        <polygon
          points="496,435 504,435 880,600 120,600"
          fill="url(#vergeGlowGrad)"
        />

        {/* Left & Right Crisp Edges */}
        <line x1="496" y1="435" x2="120" y2="600" stroke="#475569" strokeWidth="2.5" opacity="0.7" />
        <line x1="504" y1="435" x2="880" y2="600" stroke="#475569" strokeWidth="2.5" opacity="0.7" />

        {/* Verges Cat's Eyes (Reflective Markers) */}
        <circle cx="493" cy="442" r="1" fill="#38bdf8" opacity="0.3" />
        <circle cx="507" cy="442" r="1" fill="#38bdf8" opacity="0.3" />
        <circle cx="475" cy="470" r="1.5" fill="#38bdf8" opacity="0.5" />
        <circle cx="525" cy="470" r="1.5" fill="#38bdf8" opacity="0.5" />
        <circle cx="430" cy="515" r="2.5" fill="#38bdf8" opacity="0.7" />
        <circle cx="570" cy="515" r="2.5" fill="#38bdf8" opacity="0.7" />
        <circle cx="340" cy="570" r="3.5" fill="#38bdf8" opacity="0.9" />
        <circle cx="660" cy="570" r="3.5" fill="#38bdf8" opacity="0.9" />
      </svg>

      {/* ── 5. PERSPECTIVE DASHED CENTERLINE (SMOOTH FORWARD FLOW) ── */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <svg
          className="w-full h-full"
          viewBox="0 0 1000 600"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g className={shouldAnimate ? 'animate-road-perspective' : ''}>
            <polygon points="498,550 502,550 504,595 496,595" fill={config.roadLineColor} opacity="0.9" />
            <polygon points="498.5,500 501.5,500 503,535 497,535" fill={config.roadLineColor} opacity="0.8" />
            <polygon points="499,468 501,468 502,490 498,490" fill={config.roadLineColor} opacity="0.7" />
            <polygon points="499.3,448 500.7,448 501.4,462 498.6,462" fill={config.roadLineColor} opacity="0.5" />
            <polygon points="499.6,437 500.4,437 500.8,444 499.2,444" fill={config.roadLineColor} opacity="0.3" />
          </g>
        </svg>
      </div>

      {/* ── 6. RIDER SILHOUETTE GLIDING TOWARDS HORIZON ── */}
      <div 
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-transform duration-300 ${
          shouldAnimate ? 'animate-bike-hover' : ''
        }`}
      >
        <div 
          className="w-48 h-36 -mb-6 bg-gradient-to-t from-transparent via-amber-300/10 to-transparent blur-md rounded-full pointer-events-none"
          style={{ transform: 'perspective(200px) rotateX(60deg)' }}
        />

        <svg width="84" height="96" viewBox="0 0 84 96" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="42" cy="74" r="5" fill="#f43f5e" />
          <circle cx="42" cy="74" r="10" fill="#f43f5e" opacity="0.4" className="animate-pulse" />
          <rect x="36" y="70" width="12" height="20" rx="6" fill="#020617" stroke="#334155" strokeWidth="2" />
          <path d="M26 68 L32 78 L52 78 L58 68 Z" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
          <path d="M30 52 C30 46 36 42 42 42 C48 42 54 46 54 52 L56 66 L28 66 Z" fill="#1e293b" stroke="#6366f1" strokeWidth="1.5" />
          <path d="M28 32 C28 26 34 22 42 22 C50 22 56 26 56 32 L58 50 L26 50 Z" fill="#090d16" stroke="#38bdf8" strokeWidth="1" />
          <ellipse cx="42" cy="18" rx="10" ry="12" fill="#020617" stroke="#818cf8" strokeWidth="1.5" />
          <path d="M36 18 Q42 21 48 18" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="40" x2="30" y2="44" stroke="#64748b" strokeWidth="2" />
          <line x1="64" y1="40" x2="54" y2="44" stroke="#64748b" strokeWidth="2" />
          <circle cx="18" cy="38" r="3" fill="#020617" stroke="#94a3b8" />
          <circle cx="66" cy="38" r="3" fill="#020617" stroke="#94a3b8" />
        </svg>

        <div className="w-24 h-3 bg-black/60 blur-sm rounded-full -mt-1" />
      </div>

      {/* ── 7. ZEN BREATHING HUD (SUBTLE) ── */}
      <div className="absolute top-16 left-0 right-0 flex flex-col items-center pointer-events-none px-4 z-10">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/75 backdrop-blur-md border border-slate-800 text-slate-300 text-xs shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold tracking-wide">
            {config.ambientDescription}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-1" />
        </div>

        <div className="mt-2 text-[11px] font-bold tracking-widest text-slate-400/90 uppercase">
          {breathPhase} • Smooth Highway Pace
        </div>
      </div>

      {/* ── 8. BOTTOM CONTROLS: 4-STAGE SELECTOR & DUO-STYLE SOUND PICKER ── */}
      <div className="absolute bottom-28 left-4 right-4 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-auto z-20">
        {/* Scenery Stage Progress Pills (0%, 25%, 50%, 75%) */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-xl overflow-x-auto max-w-[90vw]">
          {(Object.keys(STAGES) as SceneryStage[]).map((stageKey) => {
            const st = STAGES[stageKey];
            const isActive = selectedStage === stageKey;
            return (
              <button
                key={stageKey}
                onClick={() => setSelectedStage(stageKey)}
                aria-label={`Select ${st.name}`}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {st.name}
              </button>
            );
          })}
        </div>

        {/* Tactile Sound Picker (Off / Rain / Wind / Engine hum) */}
        <div className="relative flex items-center gap-1 p-1 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-800 shadow-xl">
          <button
            onClick={() => handleSoundSelect('off')}
            aria-label="Sound Off"
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedSound === 'off' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mute
          </button>
          <button
            onClick={() => handleSoundSelect('rain')}
            aria-label="Rain Audio"
            className="px-2.5 py-1 rounded-xl text-xs font-bold text-slate-400 opacity-60 hover:opacity-100 transition-all flex items-center gap-1 cursor-pointer"
          >
            <CloudRain className="w-3 h-3" />
            Rain
          </button>
          <button
            onClick={() => handleSoundSelect('wind')}
            aria-label="Wind Audio"
            className="px-2.5 py-1 rounded-xl text-xs font-bold text-slate-400 opacity-60 hover:opacity-100 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Wind className="w-3 h-3" />
            Wind
          </button>
          <button
            onClick={() => handleSoundSelect('engine')}
            aria-label="Engine Hum Audio"
            className="px-2.5 py-1 rounded-xl text-xs font-bold text-slate-400 opacity-60 hover:opacity-100 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Compass className="w-3 h-3" />
            Engine
          </button>

          {/* Sound Disabled Notification Tooltip */}
          {soundTooltip && (
            <div className="absolute -top-10 right-0 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-[10px] font-black shadow-lg flex items-center gap-1 animate-bounce">
              <AlertCircle className="w-3 h-3" />
              <span>{soundTooltip}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
