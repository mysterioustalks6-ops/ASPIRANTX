/**
 * AspirantX Centralized Design System Tokens
 * Strict human-centric academic design language.
 * No raw magic numbers scattered in components.
 */

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '3rem',   // 48px
  '4xl': '4rem',   // 64px
} as const;

export const radius = {
  sm: '0.375rem',  // 6px
  md: '0.625rem',  // 10px
  lg: '0.875rem',  // 14px
  xl: '1.25rem',   // 20px
  full: '9999px',
} as const;

export const typography = {
  display: {
    fontSize: '1.875rem',    // 30px
    lineHeight: '2.25rem',   // 36px
    fontWeight: '800',
    letterSpacing: '-0.025em',
  },
  pageTitle: {
    fontSize: '1.375rem',    // 22px
    lineHeight: '1.75rem',   // 28px
    fontWeight: '700',
    letterSpacing: '-0.02em',
  },
  sectionTitle: {
    fontSize: '1rem',        // 16px
    lineHeight: '1.5rem',    // 24px
    fontWeight: '600',
    letterSpacing: '-0.01em',
  },
  body: {
    fontSize: '0.875rem',    // 14px
    lineHeight: '1.375rem',  // 22px
    fontWeight: '400',
    letterSpacing: '0em',
  },
  secondary: {
    fontSize: '0.8125rem',   // 13px
    lineHeight: '1.25rem',   // 20px
    fontWeight: '400',
    letterSpacing: '0em',
  },
  caption: {
    fontSize: '0.75rem',     // 12px
    lineHeight: '1rem',      // 16px
    fontWeight: '500',
    letterSpacing: '0.01em',
  },
  eyebrow: {
    fontSize: '0.625rem',    // 10px
    lineHeight: '0.875rem',  // 14px
    fontWeight: '700',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
} as const;

export const colors = {
  // Brand / Primary (Academic Precision Sky)
  primary: '#0284c7',
  primaryHover: '#0369a1',
  primaryActive: '#075985',
  primaryGlow: 'rgba(2, 132, 199, 0.2)',
  primarySurface: 'rgba(2, 132, 199, 0.1)',

  // Neutral Background & Surfaces
  background: '#06080d',
  surface: '#0c1017',
  surfaceElevated: '#151b26',
  surfaceMuted: '#090d14',

  // Borders
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  borderHighlight: 'rgba(56, 189, 248, 0.28)',

  // Typography
  text: '#f8fafc',
  textMuted: '#94a3b8',
  textSubtle: '#64748b',

  // Semantic Status
  success: '#10b981',
  successSurface: 'rgba(16, 185, 129, 0.1)',
  warning: '#f59e0b',
  warningSurface: 'rgba(245, 158, 11, 0.1)',
  error: '#f43f5e',
  errorSurface: 'rgba(244, 63, 94, 0.1)',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
  card: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.25)',
  cardHover: '0 8px 24px -4px rgba(0, 0, 0, 0.5), 0 2px 8px -2px rgba(2, 132, 199, 0.15)',
  modal: '0 24px 48px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)',
} as const;

export const motionTokens = {
  duration: {
    fast: 200,      // 200ms - micro clicks, toggles
    normal: 300,    // 300ms - standard tab & accordion
    moderate: 450,  // 450ms - page & modal entrance
    slow: 600,      // 600ms - large surface transitions
    dramatic: 700,  // 700ms - initial splash/welcome
  },
  easing: {
    default: [0.16, 1, 0.3, 1] as const,     // smooth outExpo
    decelerate: [0, 0, 0.2, 1] as const,     // entrance
    accelerate: [0.4, 0, 1, 1] as const,     // exit
    standard: [0.4, 0, 0.2, 1] as const,     // standard material
  },
  cssEasing: {
    default: 'cubic-bezier(0.16, 1, 0.3, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export const breakpoints = {
  desktop: 1280,
  tabletLandscape: 1024,
  tabletPortrait: 768,
  mobileStandard: 390,
  mobileCompact: 360,
} as const;

export const tokens = {
  spacing,
  radius,
  typography,
  colors,
  shadows,
  motion: motionTokens,
  breakpoints,
} as const;

export default tokens;
