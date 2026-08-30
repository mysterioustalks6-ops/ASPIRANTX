export interface WallpaperPersona {
  id: string;
  name: string;
  category: 'Anime Power' | 'Zen Minimal' | 'Officer Aura' | 'Cyberpunk Sci-Fi' | 'Mythic Legend';
  ageGroupLabel: string;
  characterTitle: string;
  characterQuote: string;
  tagline: string;
  badgeEmoji: string;
  bgGradient: [string, string, string];
  glowColor: string;
  accentColor: string;
  cardBorder: string;
}

export const WALLPAPER_PERSONAS: WallpaperPersona[] = [
  // 1. Anime - Sung Jin-woo / Shadow Monarch (Solo Leveling)
  {
    id: 'solo_shadow',
    name: 'Shadow Monarch (Jin-Woo)',
    category: 'Anime Power',
    ageGroupLabel: 'Youth & Competitive (16-24)',
    characterTitle: 'SUNG JIN-WOO • LEVEL UP',
    characterQuote: '"I will conquer my weakness. Arise and achieve Rank 1."',
    tagline: 'System awakened. Daily grinds fuel unstoppable ascension.',
    badgeEmoji: '🗡️⚡',
    bgGradient: ['#030712', '#0f172a', '#1e1b4b'],
    glowColor: 'rgba(99, 102, 241, 0.45)',
    accentColor: '#38bdf8',
    cardBorder: 'border-indigo-500/40',
  },
  // 2. Anime - Naruto Uzumaki / Will of Fire
  {
    id: 'naruto_hokage',
    name: 'Will of Fire (Naruto)',
    category: 'Anime Power',
    ageGroupLabel: 'Teens & Dreamers (14-22)',
    characterTitle: 'UZUMAKI NARUTO • SAGE MODE',
    characterQuote: '"I never go back on my word. That is my Nindo!"',
    tagline: 'Grit over talent. Tenacity that shakes the entire examination.',
    badgeEmoji: '🍥🔥',
    bgGradient: ['#1c0a00', '#2d1200', '#0a0a0a'],
    glowColor: 'rgba(249, 115, 22, 0.45)',
    accentColor: '#f97316',
    cardBorder: 'border-orange-500/40',
  },
  // 3. Anime - Levi Ackerman / Cold Precision
  {
    id: 'levi_ackerman',
    name: 'Captain Precision (Levi)',
    category: 'Anime Power',
    ageGroupLabel: 'Strict Perfectionists (18-28)',
    characterTitle: 'LEVI ACKERMAN • SCOUT REGIMENT',
    characterQuote: '"Give up on giving up. Clean every single question."',
    tagline: 'Zero errors. Ruthless time management and peak accuracy.',
    badgeEmoji: '⚔️🦅',
    bgGradient: ['#02120e', '#06201b', '#020617'],
    glowColor: 'rgba(16, 185, 129, 0.45)',
    accentColor: '#10b981',
    cardBorder: 'border-emerald-500/40',
  },
  // 4. Anime - Goku / Ultra Instinct
  {
    id: 'goku_ultra',
    name: 'Ultra Instinct (Goku)',
    category: 'Anime Power',
    ageGroupLabel: 'All Aspirants (All Ages)',
    characterTitle: 'SON GOKU • AUTONOMOUS INSTINCT',
    characterQuote: '"Limits only exist if you believe in them."',
    tagline: 'Calm body, lightning reflexes. 100% focus during exams.',
    badgeEmoji: '✨🥋',
    bgGradient: ['#09090b', '#18181b', '#1e293b'],
    glowColor: 'rgba(224, 231, 255, 0.45)',
    accentColor: '#e0e7ff',
    cardBorder: 'border-slate-400/40',
  },
  // 5. Officer Aura - IAS / IPS / NDA Commandant
  {
    id: 'officer_commandant',
    name: 'Ashoka Vanguard (Commandant)',
    category: 'Officer Aura',
    ageGroupLabel: 'Civil & Defense Aspirants (20-32)',
    characterTitle: 'BHARAT SEVA • OFFICER CADRE',
    characterQuote: '"Satyameva Jayate. Duty, Honour, and Unbending Discipline."',
    tagline: 'Lal Bahadur Shastri Academy aura. Leadership in every breath.',
    badgeEmoji: '🇮🇳🦁',
    bgGradient: ['#021612', '#0f241d', '#081018'],
    glowColor: 'rgba(217, 119, 6, 0.45)',
    accentColor: '#f59e0b',
    cardBorder: 'border-amber-500/40',
  },
  // 6. Zen Minimal - Stoic Scholar
  {
    id: 'zen_stoic',
    name: 'Stoic Monolith (Zen)',
    category: 'Zen Minimal',
    ageGroupLabel: 'Mature & Focused (22-40+)',
    characterTitle: 'MARCUS AURELIUS • STOIC DISCIPLINE',
    characterQuote: '"You have power over your mind - not outside events."',
    tagline: 'Zero distractions. Monochrome elegance and pristine clarity.',
    badgeEmoji: '🏛️🧘',
    bgGradient: ['#09090b', '#111827', '#030712'],
    glowColor: 'rgba(148, 163, 184, 0.3)',
    accentColor: '#cbd5e1',
    cardBorder: 'border-slate-600/40',
  },
  // 7. Cyberpunk Sci-Fi - Neural Prodigy
  {
    id: 'cyber_prodigy',
    name: 'Neural AI Prodigy',
    category: 'Cyberpunk Sci-Fi',
    ageGroupLabel: 'Tech & Modern Gen-Z (15-25)',
    characterTitle: 'NEURAL LINK • QUANTUM SPEED',
    characterQuote: '"Synthesizing knowledge at hyper-speed. 0ms lag."',
    tagline: 'Neon telemetry, matrix algorithms, cybernetic syllabus mastery.',
    badgeEmoji: '🤖⚡',
    bgGradient: ['#050518', '#0b0f2e', '#01020a'],
    glowColor: 'rgba(236, 72, 153, 0.45)',
    accentColor: '#ec4899',
    cardBorder: 'border-pink-500/40',
  }
];
