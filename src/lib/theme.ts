/**
 * UK Grocery Store - Theme System
 *
 * A comprehensive, type-safe theme system with support for:
 * - Light and dark modes
 * - Consistent color palette (green grocery theme)
 * - Typography scales
 * - Spacing system
 * - Responsive breakpoints
 * - Animation tokens
 * - Shadow system
 */

// ============================================
// COLOR PALETTE
// ============================================

/**
 * Primary colors - Fresh Green theme
 * Main brand color for the grocery store
 */
export const primaryColors = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e',
  600: '#16a34a', // Primary brand color
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
  950: '#052e16',
} as const;

/**
 * Secondary colors - Warm Orange for accents
 * Used for sales, promotions, and call-to-action elements
 */
export const secondaryColors = {
  50: '#fff7ed',
  100: '#ffedd5',
  200: '#fed7aa',
  300: '#fdba74',
  400: '#fb923c',
  500: '#f97316',
  600: '#ea580c',
  700: '#c2410c',
  800: '#9a3412',
  900: '#7c2d12',
  950: '#431407',
} as const;

/**
 * Neutral colors - For text, backgrounds, and borders
 */
export const neutralColors = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
  950: '#0a0a0a',
} as const;

/**
 * Semantic colors for feedback and status
 */
export const semanticColors = {
  success: {
    light: '#dcfce7',
    default: '#22c55e',
    dark: '#15803d',
  },
  warning: {
    light: '#fef3c7',
    default: '#f59e0b',
    dark: '#b45309',
  },
  error: {
    light: '#fee2e2',
    default: '#ef4444',
    dark: '#b91c1c',
  },
  info: {
    light: '#dbeafe',
    default: '#3b82f6',
    dark: '#1d4ed8',
  },
} as const;

// ============================================
// THEME MODES
// ============================================

/**
 * Light theme color tokens
 */
export const lightTheme = {
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  foreground: {
    primary: '#171717',
    secondary: '#525252',
    tertiary: '#737373',
    muted: '#a3a3a3',
    inverted: '#ffffff',
  },
  border: {
    light: '#e5e5e5',
    default: '#d4d4d4',
    strong: '#a3a3a3',
    focus: primaryColors[500],
  },
  shadow: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    primary: '0 4px 14px 0 rgba(22, 163, 74, 0.25)',
    primaryLg: '0 10px 25px -5px rgba(22, 163, 74, 0.3)',
  },
  selection: {
    background: primaryColors[200],
    foreground: primaryColors[900],
  },
  scrollbar: {
    track: '#f3f4f6',
    thumb: neutralColors[400],
    thumbHover: primaryColors[500],
  },
} as const;

/**
 * Dark theme color tokens
 */
export const darkTheme = {
  background: {
    primary: '#0a0a0a',
    secondary: '#171717',
    tertiary: '#262626',
    elevated: '#1f1f1f',
    overlay: 'rgba(0, 0, 0, 0.75)',
  },
  foreground: {
    primary: '#ededed',
    secondary: '#a3a3a3',
    tertiary: '#737373',
    muted: '#525252',
    inverted: '#0a0a0a',
  },
  border: {
    light: '#262626',
    default: '#404040',
    strong: '#525252',
    focus: primaryColors[500],
  },
  shadow: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
    primary: '0 4px 14px 0 rgba(22, 163, 74, 0.3)',
    primaryLg: '0 10px 25px -5px rgba(22, 163, 74, 0.4)',
  },
  selection: {
    background: primaryColors[700],
    foreground: '#ffffff',
  },
  scrollbar: {
    track: '#262626',
    thumb: neutralColors[600],
    thumbHover: primaryColors[500],
  },
} as const;

// ============================================
// SPACING SYSTEM
// ============================================

/**
 * Spacing scale based on 4px base unit
 * Used for padding, margin, and gap values
 */
export const spacing = {
  0: '0',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
  36: '9rem',        // 144px
  40: '10rem',       // 160px
  44: '11rem',       // 176px
  48: '12rem',       // 192px
  52: '13rem',       // 208px
  56: '14rem',       // 224px
  60: '15rem',       // 240px
  64: '16rem',       // 256px
  72: '18rem',       // 288px
  80: '20rem',       // 320px
  96: '24rem',       // 384px
} as const;

// ============================================
// TYPOGRAPHY
// ============================================

/**
 * Font size scale
 */
export const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem' }],       // 12px
  sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
  base: ['1rem', { lineHeight: '1.5rem' }],      // 16px
  lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
  xl: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
  '5xl': ['3rem', { lineHeight: '1' }],          // 48px
  '6xl': ['3.75rem', { lineHeight: '1' }],       // 60px
  '7xl': ['4.5rem', { lineHeight: '1' }],        // 72px
  '8xl': ['6rem', { lineHeight: '1' }],          // 96px
  '9xl': ['8rem', { lineHeight: '1' }],          // 128px
} as const;

/**
 * Font weight values
 */
export const fontWeight = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

/**
 * Line height values
 */
export const lineHeight = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
} as const;

/**
 * Letter spacing values
 */
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

/**
 * Font family stacks
 */
export const fontFamily = {
  sans: [
    'var(--font-geist-sans)',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    '"Open Sans"',
    '"Helvetica Neue"',
    'sans-serif',
  ],
  mono: [
    'var(--font-geist-mono)',
    'ui-monospace',
    'SFMono-Regular',
    'Menlo',
    'Monaco',
    'Consolas',
    '"Liberation Mono"',
    '"Courier New"',
    'monospace',
  ],
} as const;

// ============================================
// BREAKPOINTS
// ============================================

/**
 * Responsive breakpoints (mobile-first)
 */
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Container max-widths for each breakpoint
 */
export const containers = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================
// BORDER RADIUS
// ============================================

/**
 * Border radius scale
 */
export const borderRadius = {
  none: '0',
  sm: '0.125rem',    // 2px
  default: '0.25rem', // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px',
} as const;

// ============================================
// Z-INDEX SCALE
// ============================================

/**
 * Z-index scale for layering elements
 */
export const zIndex = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modalBackdrop: '1040',
  modal: '1050',
  popover: '1060',
  tooltip: '1070',
  toast: '1080',
} as const;

// ============================================
// TRANSITIONS & ANIMATIONS
// ============================================

/**
 * Transition duration values
 */
export const transitionDuration = {
  75: '75ms',
  100: '100ms',
  150: '150ms',
  200: '200ms',
  300: '300ms',
  500: '500ms',
  700: '700ms',
  1000: '1000ms',
} as const;

/**
 * Easing functions
 */
export const transitionTimingFunction = {
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

/**
 * Animation presets
 */
export const animations = {
  fadeIn: 'fade-in 0.3s ease-out forwards',
  fadeInUp: 'fade-in-up 0.4s ease-out forwards',
  fadeInDown: 'fade-in-down 0.4s ease-out forwards',
  slideInLeft: 'slide-in-left 0.4s ease-out forwards',
  slideInRight: 'slide-in-right 0.4s ease-out forwards',
  scaleIn: 'scale-in 0.3s ease-out forwards',
  float: 'float 6s ease-in-out infinite',
  bounceSlow: 'bounce-slow 3s ease-in-out infinite',
  pulseSubtle: 'pulse-subtle 2s ease-in-out infinite',
  shimmer: 'shimmer 1.5s infinite',
  spinSlow: 'spin-slow 3s linear infinite',
} as const;

// ============================================
// THEME OBJECT
// ============================================

/**
 * Complete theme configuration object
 */
export const theme = {
  colors: {
    primary: primaryColors,
    secondary: secondaryColors,
    neutral: neutralColors,
    semantic: semanticColors,
  },
  modes: {
    light: lightTheme,
    dark: darkTheme,
  },
  spacing,
  typography: {
    fontSize,
    fontWeight,
    lineHeight,
    letterSpacing,
    fontFamily,
  },
  breakpoints,
  containers,
  borderRadius,
  zIndex,
  transitions: {
    duration: transitionDuration,
    timing: transitionTimingFunction,
  },
  animations,
} as const;

// ============================================
// TYPE DEFINITIONS
// ============================================

export type PrimaryColor = keyof typeof primaryColors;
export type SecondaryColor = keyof typeof secondaryColors;
export type NeutralColor = keyof typeof neutralColors;
export type SemanticColorType = keyof typeof semanticColors;
export type SemanticColorVariant = 'light' | 'default' | 'dark';

export type ThemeMode = 'light' | 'dark';
export type BackgroundVariant = keyof typeof lightTheme.background;
export type ForegroundVariant = keyof typeof lightTheme.foreground;
export type BorderVariant = keyof typeof lightTheme.border;
export type ShadowVariant = keyof typeof lightTheme.shadow;

export type SpacingValue = keyof typeof spacing;
export type FontSizeValue = keyof typeof fontSize;
export type FontWeightValue = keyof typeof fontWeight;
export type LineHeightValue = keyof typeof lineHeight;
export type LetterSpacingValue = keyof typeof letterSpacing;

export type Breakpoint = keyof typeof breakpoints;
export type BorderRadiusValue = keyof typeof borderRadius;
export type ZIndexValue = keyof typeof zIndex;
export type TransitionDurationValue = keyof typeof transitionDuration;
export type TransitionTimingValue = keyof typeof transitionTimingFunction;
export type AnimationValue = keyof typeof animations;

export type Theme = typeof theme;

// ============================================
// CSS VARIABLE HELPERS
// ============================================

/**
 * Generate CSS variable name from token path
 */
export function cssVar(name: string): string {
  return `var(--${name})`;
}

/**
 * Generate CSS variable with fallback
 */
export function cssVarWithFallback(name: string, fallback: string): string {
  return `var(--${name}, ${fallback})`;
}

/**
 * Get primary color value
 */
export function getPrimaryColor(shade: PrimaryColor): string {
  return primaryColors[shade];
}

/**
 * Get secondary color value
 */
export function getSecondaryColor(shade: SecondaryColor): string {
  return secondaryColors[shade];
}

/**
 * Get neutral color value
 */
export function getNeutralColor(shade: NeutralColor): string {
  return neutralColors[shade];
}

/**
 * Get semantic color value
 */
export function getSemanticColor(
  type: SemanticColorType,
  variant: SemanticColorVariant = 'default'
): string {
  return semanticColors[type][variant];
}

/**
 * Get spacing value
 */
export function getSpacing(value: SpacingValue): string {
  return spacing[value];
}

/**
 * Get breakpoint value
 */
export function getBreakpoint(bp: Breakpoint): string {
  return breakpoints[bp];
}

/**
 * Media query helper for breakpoints
 */
export function mediaQuery(bp: Breakpoint): string {
  return `@media (min-width: ${breakpoints[bp]})`;
}

// ============================================
// DARK MODE UTILITIES
// ============================================

/**
 * Check if dark mode is preferred by the system
 */
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Get the current theme mode from localStorage or system preference
 */
export function getThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';

  const stored = localStorage.getItem('theme-mode');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return prefersDarkMode() ? 'dark' : 'light';
}

/**
 * Set the theme mode and update the DOM
 */
export function setThemeMode(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem('theme-mode', mode);

  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/**
 * Toggle between light and dark mode
 */
export function toggleThemeMode(): ThemeMode {
  const current = getThemeMode();
  const next = current === 'light' ? 'dark' : 'light';
  setThemeMode(next);
  return next;
}

/**
 * Initialize theme mode on page load
 * Call this in your app's entry point
 */
export function initializeTheme(): void {
  const mode = getThemeMode();
  setThemeMode(mode);

  // Listen for system preference changes
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only update if no explicit preference is stored
      if (!localStorage.getItem('theme-mode')) {
        setThemeMode(e.matches ? 'dark' : 'light');
      }
    });
  }
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default theme;
