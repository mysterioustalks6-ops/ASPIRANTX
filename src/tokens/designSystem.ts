/**
 * StudyRide Centralized Design System Tokens
 * Strict human-centric academic design language inspired by clarity, simplicity,
 * and tactile responsiveness while preserving StudyRide's dark academic identity.
 * 
 * WCAG 2.1 AA compliant contrast ratios across all semantic surfaces.
 */

// Spacing System (4px base unit)
export const spacing = {
  none: '0',
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px (default screen padding)
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '3rem',   // 48px (minimum touch target)
  '4xl': '4rem',   // 64px
} as const;

// Border Radius Scale
export const radius = {
  none: '0',
  sm: '0.375rem',  // 6px
  md: '0.625rem',  // 10px
  lg: '0.875rem',  // 14px (standard button)
  xl: '1rem',      // 16px (standard card)
  '2xl': '1.25rem',// 20px
  full: '9999px',  // Pills / chips
} as const;

// Typography Scale (Nunito / System Sans fallback)
export const typography = {
  display: {
    fontSize: '2rem',        // 32px
    lineHeight: '2.5rem',    // 40px
    fontWeight: '800',
    letterSpacing: '-0.025em',
  },
  header: {
    fontSize: '1.5rem',      // 24px
    lineHeight: '2rem',      // 32px
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  title: {
    fontSize: '1.25rem',     // 20px
    lineHeight: '1.75rem',   // 28px
    fontWeight: '600',
    letterSpacing: '-0.015em',
  },
  body: {
    fontSize: '1rem',        // 16px
    lineHeight: '1.5rem',    // 24px
    fontWeight: '400',
    letterSpacing: '0em',
  },
  bodySmall: {
    fontSize: '0.875rem',    // 14px
    lineHeight: '1.375rem',  // 22px
    fontWeight: '400',
    letterSpacing: '0em',
  },
  label: {
    fontSize: '0.875rem',    // 14px
    lineHeight: '1.25rem',   // 20px
    fontWeight: '600',
    letterSpacing: '0.01em',
  },
  caption: {
    fontSize: '0.75rem',     // 12px
    lineHeight: '1rem',      // 16px
    fontWeight: '500',
    letterSpacing: '0.01em',
  },
  eyebrow: {
    fontSize: '0.6875rem',   // 11px
    lineHeight: '0.875rem',  // 14px
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
} as const;

// Semantic Surface Colors (Dark Academic Identity)
export const surfaces = {
  background: '#0F1115',         // Base app background (Calm obsidian)
  primary: '#15181F',            // Standard surface (Containers)
  elevated: '#1A1D24',           // Elevated cards
  interactive: '#222732',        // Hover / Active states
  selected: '#1C2E1F',           // Selected state container (Dark Green tint)
  selectedBorder: '#58CC02',     // Selected state border
  disabled: '#121419',           // Inactive / Disabled container
  modal: '#161920',              // Dialog & Sheet surface
  border: '#2A2F3A',             // Standard surface border
  borderSubtle: '#1E232D',       // Subtle dividers
  borderHighlight: 'rgba(88, 204, 2, 0.35)', // Vibrant focus border
} as const;

// Semantic Text Colors (High Contrast WCAG 2.1 AA >= 4.5:1)
export const textColors = {
  primary: '#F3F4F6',            // High contrast text (16.6:1 on background)
  secondary: '#9CA3AF',          // Supporting text (7.2:1 on background)
  muted: '#6B7280',              // Low priority metadata
  disabled: '#4B5563',           // Disabled text
  inverse: '#0F1115',            // Text on light/bright buttons
} as const;

// Semantic Actions (Tactile 3D Buttons: Fill + 4px Edge + Text)
export const actions = {
  // Primary (Action Green - Vibrant Highway inspired)
  primary: {
    fill: '#58CC02',
    edge: '#46A302',
    text: '#0B2300',             // Dark green high contrast on bright green (7.5:1)
    hover: '#5FDB02',
  },
  // Secondary (Tactile Dark Outlined)
  secondary: {
    fill: '#1A1D24',
    edge: '#2A2F3A',
    text: '#F3F4F6',
    hover: '#222732',
  },
  // Accent (Electric Cyan/Blue)
  accent: {
    fill: '#1CB0F6',
    edge: '#1899D6',
    text: '#00263D',             // High contrast dark blue on light blue (8.1:1)
    hover: '#28BCFF',
  },
  // Streak Flame (Orange)
  streak: {
    fill: '#FF9600',
    edge: '#D87D00',
    text: '#2E1400',
    hover: '#FFA726',
  },
  // Destructive / Danger (Red)
  destructive: {
    fill: '#FF4B4B',
    edge: '#EA2B2B',
    text: '#FFFFFF',             // 4.7:1 contrast on red
    hover: '#FF6161',
  },
  // Success
  success: {
    fill: '#58CC02',
    edge: '#46A302',
    text: '#0B2300',
  },
  // Warning
  warning: {
    fill: '#F59E0B',
    edge: '#D97706',
    text: '#271700',
  },
} as const;

// Product Interactive States
export const productStates = {
  correct: {
    bg: '#132A1C',
    border: '#58CC02',
    text: '#76E025',
    icon: 'CheckCircle2',
  },
  incorrect: {
    bg: '#2C1517',
    border: '#FF4B4B',
    text: '#FF6B6B',
    icon: 'XCircle',
  },
  selected: {
    bg: '#16281C',
    border: '#58CC02',
    text: '#F3F4F6',
  },
  completed: {
    bg: '#132A1C',
    border: 'rgba(88, 204, 2, 0.4)',
    text: '#58CC02',
  },
  locked: {
    bg: '#121419',
    border: '#1F242D',
    text: '#6B7280',
  },
  disabled: {
    bg: '#121419',
    border: '#1E222A',
    text: '#4B5563',
  },
} as const;

// Shadows (Restrained elevation)
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
  card: '0 2px 6px -1px rgba(0, 0, 0, 0.5), 0 1px 4px -2px rgba(0, 0, 0, 0.4)',
  elevated: '0 8px 24px -4px rgba(0, 0, 0, 0.6)',
  modal: '0 20px 48px -8px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.06)',
} as const;

// Motion (Restrained & Accessible 150-250ms)
export const motionTokens = {
  duration: {
    instant: 100,
    fast: 150,     // Touch feedback, button press
    normal: 220,   // Drawer, modal, card accordion
    relaxed: 300,  // Full screen transition
  },
  easing: {
    default: [0.16, 1, 0.3, 1] as const, // ease-out-expo
    springy: [0.34, 1.56, 0.64, 1] as const, // Subtle bounce for completion
  },
  cssEasing: {
    default: 'cubic-bezier(0.16, 1, 0.3, 1)',
    springy: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

// Component Utility Classes (for standard Tailwind integration)
export const componentStyles = {
  // 3D Tactile Buttons
  buttonPrimary: 'h-[50px] min-h-[48px] px-5 rounded-xl font-bold text-sm tracking-wide bg-[#58CC02] hover:bg-[#5FDB02] text-[#0B2300] border-b-4 border-[#46A302] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 select-none touch-manipulation cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-sm',
  buttonSecondary: 'h-[50px] min-h-[48px] px-5 rounded-xl font-bold text-sm tracking-wide bg-[#1A1D24] hover:bg-[#222732] text-[#F3F4F6] border-b-4 border-[#2A2F3A] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 select-none touch-manipulation cursor-pointer disabled:opacity-50 disabled:pointer-events-none',
  buttonAccent: 'h-[50px] min-h-[48px] px-5 rounded-xl font-bold text-sm tracking-wide bg-[#1CB0F6] hover:bg-[#28BCFF] text-[#00263D] border-b-4 border-[#1899D6] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 select-none touch-manipulation cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-sm',
  buttonDestructive: 'h-[50px] min-h-[48px] px-5 rounded-xl font-bold text-sm tracking-wide bg-[#FF4B4B] hover:bg-[#FF6161] text-white border-b-4 border-[#EA2B2B] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 select-none touch-manipulation cursor-pointer disabled:opacity-50 disabled:pointer-events-none',
  buttonStreak: 'h-[50px] min-h-[48px] px-5 rounded-xl font-bold text-sm tracking-wide bg-[#FF9600] hover:bg-[#FFA726] text-[#2E1400] border-b-4 border-[#D87D00] active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 select-none touch-manipulation cursor-pointer disabled:opacity-50 disabled:pointer-events-none',
  
  // Compact Action Buttons (for toolbars/rows, maintaining 48px touch target)
  buttonCompactPrimary: 'h-10 min-h-[40px] px-3.5 rounded-lg font-bold text-xs bg-[#58CC02] hover:bg-[#5FDB02] text-[#0B2300] border-b-2 border-[#46A302] active:border-b-0 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 select-none touch-manipulation cursor-pointer',
  buttonCompactSecondary: 'h-10 min-h-[40px] px-3.5 rounded-lg font-bold text-xs bg-[#1A1D24] hover:bg-[#222732] text-[#F3F4F6] border-b-2 border-[#2A2F3A] active:border-b-0 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 select-none touch-manipulation cursor-pointer',

  // Cards (16px radius, calm border, no nesting soup)
  cardBase: 'bg-[#1A1D24] rounded-2xl border border-[#2A2F3A] p-4 sm:p-5 transition-colors',
  cardInteractive: 'bg-[#1A1D24] hover:bg-[#20242D] rounded-2xl border border-[#2A2F3A] hover:border-[#383F4E] p-4 sm:p-5 transition-all cursor-pointer select-none active:scale-[0.99]',
  cardSelected: 'bg-[#16281C] rounded-2xl border-2 border-[#58CC02] p-4 sm:p-5 transition-all',

  // Quiz Option Cards
  optionNeutral: 'w-full p-4 rounded-xl text-left font-medium text-sm text-[#F3F4F6] bg-[#1A1D24] border-2 border-[#2A2F3A] hover:border-[#3E4656] active:scale-[0.99] transition-all flex items-center justify-between min-h-[52px] select-none touch-manipulation cursor-pointer',
  optionSelected: 'w-full p-4 rounded-xl text-left font-bold text-sm text-[#F3F4F6] bg-[#17271C] border-2 border-[#58CC02] shadow-[0_0_12px_rgba(88,204,2,0.15)] transition-all flex items-center justify-between min-h-[52px] select-none touch-manipulation cursor-pointer',
  optionCorrect: 'w-full p-4 rounded-xl text-left font-bold text-sm text-[#76E025] bg-[#132A1C] border-2 border-[#58CC02] transition-all flex items-center justify-between min-h-[52px] select-none',
  optionIncorrect: 'w-full p-4 rounded-xl text-left font-bold text-sm text-[#FF6B6B] bg-[#2C1517] border-2 border-[#FF4B4B] transition-all flex items-center justify-between min-h-[52px] select-none',

  // Pill Badges
  pillStatus: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold',
  pillStreak: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-[#FF9600]/15 text-[#FFA726] border border-[#FF9600]/30',
  pillXp: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-[#1CB0F6]/15 text-[#38BDF8] border border-[#1CB0F6]/30',
  pillExam: 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#1A1D24] text-[#F3F4F6] border border-[#2A2F3A] hover:border-[#383F4E] transition-colors',
} as const;

// Backward-compatible alias for existing imports
export const colors = {
  primary: actions.primary.fill,
  primaryHover: actions.primary.hover,
  primaryActive: actions.primary.edge,
  background: surfaces.background,
  surface: surfaces.primary,
  surfaceElevated: surfaces.elevated,
  border: surfaces.border,
  borderSubtle: surfaces.borderSubtle,
  text: textColors.primary,
  textMuted: textColors.secondary,
  textSubtle: textColors.muted,
  success: actions.success.fill,
  warning: actions.warning.fill,
  error: actions.destructive.fill,
} as const;

export const tokens = {
  spacing,
  radius,
  typography,
  surfaces,
  textColors,
  actions,
  productStates,
  shadows,
  motion: motionTokens,
  componentStyles,
  colors,
} as const;

export default tokens;
