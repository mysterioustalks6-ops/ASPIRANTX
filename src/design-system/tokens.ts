/**
 * StudyRide Design Tokens & Contrast Verification Engine
 * Implements W3C WCAG 2.1 relative luminance and contrast ratio formulas.
 */

export interface TokenPairAudit {
  name: string;
  theme: 'light' | 'dark' | 'night';
  foregroundHex: string;
  backgroundHex: string;
  ratio: number;
  minRequired: number; // 4.5 for normal text, 3.0 for large text/UI components
  passesAA: boolean;
  passesAAA: boolean;
  notes?: string;
}

// Convert hex string to sRGB normalized 0..1
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r / 255, g / 255, b / 255];
}

// Calculate relative luminance per W3C formula
export function getRelativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const adjust = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b);
}

// Calculate contrast ratio between two hex colors (1:1 to 21:1)
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Pre-defined Design System Color Palette for Direction A ("Calm Highway")
 */
export const DESIGN_TOKENS = {
  light: {
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    surface2: '#F1F5F9',
    surface3: '#E2E8F0',
    line: '#E2E8F0',
    lineStrong: '#CBD5E1',
    text: '#0F172A',
    textMuted: '#475569',
    textSubtle: '#64748B',
    primary: '#18803E',
    primaryHover: '#137333',
    primaryDepth: '#0D5023',
    onPrimary: '#FFFFFF',
    blue: '#1D4ED8',
    purple: '#6D28D9',
    amber: '#D97706',
    coral: '#DC2626',
    mint: '#059669',
  },
  dark: {
    bg: '#12161F',
    surface: '#1A202C',
    surface2: '#232B3B',
    surface3: '#2D3748',
    line: '#2D3748',
    lineStrong: '#4A5568',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    textSubtle: '#64748B',
    primary: '#2BC46F',
    primaryHover: '#26AF62',
    primaryDepth: '#167A3F',
    onPrimary: '#052410',
    blue: '#38BDF8',
    purple: '#A78BFA',
    amber: '#FBBF24',
    coral: '#F87171',
    mint: '#34D399',
  },
  night: {
    bg: '#080A0F',
    surface: '#10141D',
    surface2: '#181E2B',
    surface3: '#222A3C',
    line: '#1F2737',
    lineStrong: '#333F56',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    textSubtle: '#64748B',
    primary: '#27BD69',
    primaryHover: '#22A85C',
    primaryDepth: '#136534',
    onPrimary: '#041E0D',
    blue: '#38BDF8',
    purple: '#A78BFA',
    amber: '#FBBF24',
    coral: '#F87171',
    mint: '#34D399',
  },
} as const;

/**
 * Run comprehensive programmatic audit across all token pairs
 */
export function runContrastAudit(): TokenPairAudit[] {
  const auditList: TokenPairAudit[] = [
    // --- LIGHT THEME AUDITS ---
    {
      name: 'Primary Button Text (White on #18803E)',
      theme: 'light',
      foregroundHex: '#FFFFFF',
      backgroundHex: '#18803E',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
      notes: 'Direction A refined green ensures high contrast',
    },
    {
      name: 'Body Text on Base Page (#0F172A on #F8FAFC)',
      theme: 'light',
      foregroundHex: '#0F172A',
      backgroundHex: '#F8FAFC',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
    },
    {
      name: 'Body Text on Card Surface (#0F172A on #FFFFFF)',
      theme: 'light',
      foregroundHex: '#0F172A',
      backgroundHex: '#FFFFFF',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
    },
    {
      name: 'Muted Text on Base Page (#475569 on #F8FAFC)',
      theme: 'light',
      foregroundHex: '#475569',
      backgroundHex: '#F8FAFC',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
    },
    {
      name: 'Signal Blue on White Surface (#1D4ED8 on #FFFFFF)',
      theme: 'light',
      foregroundHex: '#1D4ED8',
      backgroundHex: '#FFFFFF',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
    },
    {
      name: 'Checkpoint Purple on White Surface (#6D28D9 on #FFFFFF)',
      theme: 'light',
      foregroundHex: '#6D28D9',
      backgroundHex: '#FFFFFF',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
    },
    {
      name: 'Coral Danger on White Surface (#DC2626 on #FFFFFF)',
      theme: 'light',
      foregroundHex: '#DC2626',
      backgroundHex: '#FFFFFF',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
    },
    {
      name: 'Amber Milestone Badge (Black text on Amber fill)',
      theme: 'light',
      foregroundHex: '#78350F',
      backgroundHex: '#FBBF24',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
      notes: 'Amber used exclusively as fill/badge, never light text',
    },

    // --- REAL RENDERED UI COMPONENT PAIRS (Rule 7) ---
    {
      name: 'Real Rendered: Header Streak Pill Light (#92400E on #FEF3C7)',
      theme: 'light',
      foregroundHex: '#92400E',
      backgroundHex: '#FEF3C7',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
      notes: 'Real rendered pair: Amber-800 text on amber-subtle pill surface',
    },
    {
      name: 'Real Rendered: Header Streak Text on Surface (#92400E on #FFFFFF)',
      theme: 'light',
      foregroundHex: '#92400E',
      backgroundHex: '#FFFFFF',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
      notes: 'Real rendered pair: Header streak flame text on white card surface',
    },
    {
      name: 'Real Rendered: Exam Chip Light (#0F172A on #F1F5F9)',
      theme: 'light',
      foregroundHex: '#0F172A',
      backgroundHex: '#F1F5F9',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
      notes: 'Real rendered pair: Header target exam pill text',
    },
    {
      name: 'Real Rendered: Me Hub Stat Chip (#92400E on #F1F5F9)',
      theme: 'light',
      foregroundHex: '#92400E',
      backgroundHex: '#F1F5F9',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
      notes: 'Real rendered pair: Me hub streak & coin stat text',
    },
    {
      name: 'Real Rendered: Header Streak Pill Dark (#FBBF24 on #232B3B)',
      theme: 'dark',
      foregroundHex: '#FBBF24',
      backgroundHex: '#232B3B',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
      notes: 'Real rendered pair: Header flame streak counter in Dark Calm Highway',
    },
    {
      name: 'Real Rendered: Exam Chip Dark (#F8FAFC on #232B3B)',
      theme: 'dark',
      foregroundHex: '#F8FAFC',
      backgroundHex: '#232B3B',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
      notes: 'Real rendered pair: Header target exam chip in Dark mode',
    },
    {
      name: 'Real Rendered: Active Navigation Pill (#2BC46F on #12161F)',
      theme: 'dark',
      foregroundHex: '#2BC46F',
      backgroundHex: '#12161F',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
      notes: 'Real rendered pair: Bottom tab bar active state icon/label',
    },

    // --- DARK THEME AUDITS ---
    {
      name: 'Primary Button Text (Dark Green on #2BC46F)',
      theme: 'dark',
      foregroundHex: '#052410',
      backgroundHex: '#2BC46F',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
      notes: 'High-contrast dark-on-green formulation',
    },
    {
      name: 'Body Text on Dark Surface (#F8FAFC on #1A202C)',
      theme: 'dark',
      foregroundHex: '#F8FAFC',
      backgroundHex: '#1A202C',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
    },
    {
      name: 'Muted Text on Dark Surface (#94A3B8 on #1A202C)',
      theme: 'dark',
      foregroundHex: '#94A3B8',
      backgroundHex: '#1A202C',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
    },
    {
      name: 'Signal Blue on Dark Surface (#38BDF8 on #1A202C)',
      theme: 'dark',
      foregroundHex: '#38BDF8',
      backgroundHex: '#1A202C',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
    },
    {
      name: 'Milestone Amber on Dark Surface (#FBBF24 on #1A202C)',
      theme: 'dark',
      foregroundHex: '#FBBF24',
      backgroundHex: '#1A202C',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
    },

    // --- NIGHT (OLED) THEME AUDITS ---
    {
      name: 'Body Text on Night OLED (#F1F5F9 on #10141D)',
      theme: 'night',
      foregroundHex: '#F1F5F9',
      backgroundHex: '#10141D',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
    },
    {
      name: 'Primary Button on Night (#041E0D on #27BD69)',
      theme: 'night',
      foregroundHex: '#041E0D',
      backgroundHex: '#27BD69',
      minRequired: 4.5,
      ratio: 0,
      passesAA: false,
      passesAAA: false,
    },
  ];

  return auditList.map((item) => {
    const rawRatio = getContrastRatio(item.foregroundHex, item.backgroundHex);
    const ratio = Math.round(rawRatio * 100) / 100;
    return {
      ...item,
      ratio,
      passesAA: ratio >= item.minRequired,
      passesAAA: ratio >= 7.0,
    };
  });
}
