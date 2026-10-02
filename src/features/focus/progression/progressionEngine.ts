/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * ASPIRANTX — COSMIC DUST PROGRESSION ENGINE (LEVELS 1 TO 1000)
 * ═══════════════════════════════════════════════════════════════════════════════
 * Pure TypeScript Game Economy & Celestial Progression Utility.
 * Zero external math dependencies.
 */

export type PlanetType = 'rocky' | 'gas' | 'lava' | 'ice';

export const BASE_DUST_PER_MINUTE = 10;
export const MAX_LEVEL = 1000;
export const LEVEL_BASE_FACTOR = 120;
export const LEVEL_EXPONENT = 1.38;

export interface RewardCalculation {
  baseDust: number;
  bonusDust: number;
  totalDust: number;
  multiplier: number;
  durationMinutes: number;
  streakDays: number;
}

export interface LevelProgression {
  currentLevel: number;
  currentLevelProgress: number; // 0.0 to 1.0 (float)
  progressPercentage: number;   // 0 to 100 (integer)
  dustToNextLevel: number;
  currentLevelFloorDust: number;
  nextLevelCeilingDust: number;
  isMaxLevel: boolean;
}

export interface MilestoneEntity {
  name: string;
  category: PlanetType;
  description: string;
  badge: string;
  levelRange: string;
  accentColor: string;
  secondaryColor: string;
  glowColor: string;
  icon: string;
  minLevel: number;
  maxLevel: number;
}

/**
 * 1. STREAK MULTIPLIER TABLE
 * 1–3 days: 1.0x
 * 4–7 days: 1.2x
 * 8–14 days: 1.5x
 * 15+ days: 2.0x
 */
export function getStreakMultiplier(streakDays: number): number {
  const days = Math.max(0, Math.floor(streakDays || 0));
  if (days >= 15) return 2.0;
  if (days >= 8) return 1.5;
  if (days >= 4) return 1.2;
  return 1.0;
}

/**
 * 2. CALCULATE SESSION REWARD
 * Currency: 1 focused minute = 10 Cosmic Dust (base).
 * Total dust = Math.round(baseDust * multiplier)
 * Bonus dust = totalDust - baseDust
 */
export function calculateReward(durationMinutes: number, streakDays: number): RewardCalculation {
  const safeMinutes = Math.max(0, Math.round(durationMinutes || 0));
  const safeStreak = Math.max(0, Math.floor(streakDays || 0));
  const multiplier = getStreakMultiplier(safeStreak);

  const baseDust = safeMinutes * BASE_DUST_PER_MINUTE;
  const totalDust = Math.round(baseDust * multiplier);
  const bonusDust = Math.max(0, totalDust - baseDust);

  return {
    baseDust,
    bonusDust,
    totalDust,
    multiplier,
    durationMinutes: safeMinutes,
    streakDays: safeStreak
  };
}

/**
 * 3. CUMULATIVE DUST FORMULA FOR LEVEL N
 * Level N requires cumulative dust = Math.floor(120 * Math.pow(N, 1.38)).
 * For Level 1 (Initial Novice Tier), required threshold is 0.
 * For Level 2, cumulative requirement is Math.floor(120 * Math.pow(1, 1.38)) = 120.
 * For Level N, cumulative requirement is Math.floor(120 * Math.pow(N - 1, 1.38)).
 */
export function getCumulativeDustForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level > MAX_LEVEL) level = MAX_LEVEL;
  return Math.floor(LEVEL_BASE_FACTOR * Math.pow(level - 1, LEVEL_EXPONENT));
}

/**
 * Explicit formula threshold calculator as requested:
 * Level N requires cumulative dust = Math.floor(120 * Math.pow(N, 1.38))
 */
export function formulaCumulativeDust(n: number): number {
  if (n <= 0) return 0;
  return Math.floor(LEVEL_BASE_FACTOR * Math.pow(n, LEVEL_EXPONENT));
}

/**
 * 4. GET LEVEL FROM CUMULATIVE DUST
 * Computes currentLevel (1 to 1000), currentLevelProgress (0..1), and dustToNextLevel.
 */
export function getLevelFromDust(totalDust: number): LevelProgression {
  const safeDust = Math.max(0, Math.floor(totalDust || 0));

  // Binary search for exact level in [1, 1000]
  let low = 1;
  let high = MAX_LEVEL;
  let currentLevel = 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const reqDust = getCumulativeDustForLevel(mid);

    if (safeDust >= reqDust) {
      currentLevel = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const isMaxLevel = currentLevel >= MAX_LEVEL;
  const currentLevelFloorDust = getCumulativeDustForLevel(currentLevel);
  const nextLevelCeilingDust = isMaxLevel 
    ? currentLevelFloorDust 
    : getCumulativeDustForLevel(currentLevel + 1);

  const span = nextLevelCeilingDust - currentLevelFloorDust;
  const dustInLevel = safeDust - currentLevelFloorDust;

  const currentLevelProgress = isMaxLevel 
    ? 1.0 
    : span > 0 
      ? Math.min(1.0, Math.max(0.0, dustInLevel / span))
      : 0.0;

  const progressPercentage = Math.round(currentLevelProgress * 100);
  const dustToNextLevel = isMaxLevel ? 0 : Math.max(0, nextLevelCeilingDust - safeDust);

  return {
    currentLevel,
    currentLevelProgress,
    progressPercentage,
    dustToNextLevel,
    currentLevelFloorDust,
    nextLevelCeilingDust,
    isMaxLevel
  };
}

/**
 * 5. MILESTONE ENTITY LOOKUP
 * - Level 1–99: "Moon & Protoplanet" (Rocky)
 * - Level 100–299: "Habitable Terrestrial Planet"
 * - Level 300–499: "Gas Giant with Rings"
 * - Level 500–749: "Lava / Molten Core"
 * - Level 750–999: "Solar Star (Protostar)"
 * - Level 1000: "Galaxy Core (Supermassive)"
 */
export const MILESTONES: MilestoneEntity[] = [
  {
    name: 'Moon & Protoplanet',
    category: 'rocky',
    description: 'Dense rocky protoplanetary mass coalescing under the initial gravitational pull of deep focus.',
    badge: 'PROTOPLANET',
    levelRange: 'Lv. 1–99',
    accentColor: '#38bdf8',
    secondaryColor: '#0284c7',
    glowColor: 'rgba(56, 189, 248, 0.45)',
    icon: '🪨',
    minLevel: 1,
    maxLevel: 99
  },
  {
    name: 'Habitable Terrestrial Planet',
    category: 'ice',
    description: 'Lush oceanic surface and stable magnetic field shielding daily uninterrupted learning routines.',
    badge: 'TERRESTRIAL',
    levelRange: 'Lv. 100–299',
    accentColor: '#34d399',
    secondaryColor: '#059669',
    glowColor: 'rgba(52, 211, 153, 0.45)',
    icon: '🌍',
    minLevel: 100,
    maxLevel: 299
  },
  {
    name: 'Gas Giant with Rings',
    category: 'gas',
    description: 'Massive swirling Jovian cloud bands surrounded by luminous gravitational rings of deep retention.',
    badge: 'GAS GIANT',
    levelRange: 'Lv. 300–499',
    accentColor: '#fbbf24',
    secondaryColor: '#d97706',
    glowColor: 'rgba(251, 191, 36, 0.45)',
    icon: '🪐',
    minLevel: 300,
    maxLevel: 499
  },
  {
    name: 'Lava / Molten Core',
    category: 'lava',
    description: 'Fierce tectonic activity with raging molten magma fissures forged in relentless high-intensity sprints.',
    badge: 'MOLTEN CORE',
    levelRange: 'Lv. 500–749',
    accentColor: '#f97316',
    secondaryColor: '#dc2626',
    glowColor: 'rgba(249, 115, 22, 0.45)',
    icon: '🌋',
    minLevel: 500,
    maxLevel: 749
  },
  {
    name: 'Solar Star (Protostar)',
    category: 'lava',
    description: 'Thermonuclear fusion ignited by unstoppable consistency, radiating luminous solar flares of brilliance.',
    badge: 'PROTOSTAR',
    levelRange: 'Lv. 750–999',
    accentColor: '#f43f5e',
    secondaryColor: '#be123c',
    glowColor: 'rgba(244, 63, 94, 0.5)',
    icon: '☀️',
    minLevel: 750,
    maxLevel: 999
  },
  {
    name: 'Galaxy Core (Supermassive)',
    category: 'gas',
    description: 'The luminous singularity at the heart of the galaxy. Supreme intellectual focus sustained across 1000 levels.',
    badge: 'GALAXY CORE',
    levelRange: 'Lv. 1000',
    accentColor: '#a855f7',
    secondaryColor: '#7e22ce',
    glowColor: 'rgba(168, 85, 247, 0.55)',
    icon: '🌌',
    minLevel: 1000,
    maxLevel: 1000
  }
];

export function getMilestoneEntity(level: number): MilestoneEntity {
  const safeLevel = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level || 1)));
  for (const m of MILESTONES) {
    if (safeLevel >= m.minLevel && safeLevel <= m.maxLevel) {
      return m;
    }
  }
  return MILESTONES[0];
}
