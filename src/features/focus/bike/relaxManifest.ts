/**
 * ── RELAX SCENERY MANIFEST ──────────────────────────────────────────────────
 * Calm scenery presets for Relax View behind the focus numbers.
 * Strictly local bundled vector/CSS scenes & safe local media.
 * Zero external hotlinks. Sound is OFF by default.
 */

export interface RelaxScene {
  id: string;
  name: string;
  location: string;
  type: 'gradient_motion' | 'ambient_svg' | 'user_picked';
  primaryMood: string;
  gradientBackground: string;
  svgArtwork: string;
  license: string;
  source: string;
}

export const RELAX_SCENES_MANIFEST: RelaxScene[] = [
  {
    id: 'mountain_pass',
    name: 'Misty Mountain Pass',
    location: 'Himalayan Ridge Highway',
    type: 'ambient_svg',
    primaryMood: 'Deep Solitude & Clarity',
    gradientBackground: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #090d16 100%)',
    svgArtwork: `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" opacity="0.45">
      <defs>
        <linearGradient id="mtnGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#0f172a" stop-opacity="0.8"/>
        </linearGradient>
      </defs>
      <!-- Distant Range -->
      <polygon points="0,380 180,240 320,320 520,180 680,290 800,210 800,600 0,600" fill="url(#mtnGrad1)"/>
      <!-- Mid Peaks -->
      <polygon points="0,450 140,340 290,410 460,290 620,380 750,310 800,360 800,600 0,600" fill="#0f172a" opacity="0.6"/>
      <!-- Highway Road Surface -->
      <polygon points="360,600 440,600 405,430 395,430" fill="#334155" opacity="0.7"/>
      <line x1="400" y1="440" x2="400" y2="600" stroke="#f59e0b" stroke-width="2" stroke-dasharray="10 10"/>
    </svg>`,
    license: 'CC0 Public Domain (Original Vector Art by AspirantX Engineering)',
    source: 'Bundled Local SVG'
  },
  {
    id: 'forest_rain',
    name: 'Quiet Pine Forest Rain',
    location: 'Nilgiri Misty Woods',
    type: 'ambient_svg',
    primaryMood: 'Calm Rhythmic Focus',
    gradientBackground: 'linear-gradient(180deg, #064e3b 0%, #022c22 60%, #011612 100%)',
    svgArtwork: `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" opacity="0.4">
      <!-- Pine silhouettes -->
      <g fill="#022c22" opacity="0.7">
        <polygon points="100,600 90,300 110,300 100,200 95,200 100,160 105,200 100,200"/>
        <polygon points="220,600 200,340 240,340 220,240 215,240 220,190 225,240 220,240"/>
        <polygon points="580,600 560,320 600,320 580,220 575,220 580,170 585,220 580,220"/>
        <polygon points="700,600 680,280 720,280 700,180 695,180 700,130 705,180 700,180"/>
      </g>
      <!-- Fog layers -->
      <rect x="0" y="350" width="800" height="150" fill="#34d399" opacity="0.08"/>
      <rect x="0" y="480" width="800" height="120" fill="#10b981" opacity="0.06"/>
    </svg>`,
    license: 'CC0 Public Domain (Original Vector Art by AspirantX Engineering)',
    source: 'Bundled Local SVG'
  },
  {
    id: 'aurora_highway',
    name: 'Aurora Nightway',
    location: 'Northern Arctic Route',
    type: 'ambient_svg',
    primaryMood: 'Midnight Flow State',
    gradientBackground: 'linear-gradient(180deg, #09090b 0%, #1e1b4b 50%, #030712 100%)',
    svgArtwork: `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" opacity="0.5">
      <defs>
        <radialGradient id="auroraGlow" cx="50%" cy="20%" r="60%">
          <stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.35"/>
          <stop offset="50%" stop-color="#818cf8" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#09090b" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="800" height="600" fill="url(#auroraGlow)"/>
      <!-- Distant horizon hills -->
      <path d="M0,450 Q 200,380 400,430 T 800,420 L 800,600 L 0,600 Z" fill="#030712" opacity="0.8"/>
    </svg>`,
    license: 'CC0 Public Domain (Original Vector Art by AspirantX Engineering)',
    source: 'Bundled Local SVG'
  },
  {
    id: 'desert_twilight',
    name: 'Thar Twilight Highway',
    location: 'Golden Horizon Expanse',
    type: 'ambient_svg',
    primaryMood: 'Warm Evening Endurance',
    gradientBackground: 'linear-gradient(180deg, #451a03 0%, #78350f 45%, #180902 100%)',
    svgArtwork: `<svg viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" opacity="0.4">
      <circle cx="400" cy="300" r="140" fill="#f59e0b" opacity="0.25"/>
      <path d="M0,420 Q 250,370 500,440 T 800,390 L 800,600 L 0,600 Z" fill="#180902" opacity="0.85"/>
      <!-- Highway vanishing point -->
      <polygon points="350,600 450,600 404,390 396,390" fill="#292524" opacity="0.9"/>
      <line x1="400" y1="400" x2="400" y2="600" stroke="#fbbf24" stroke-width="2" stroke-dasharray="8 8"/>
    </svg>`,
    license: 'CC0 Public Domain (Original Vector Art by AspirantX Engineering)',
    source: 'Bundled Local SVG'
  }
];
