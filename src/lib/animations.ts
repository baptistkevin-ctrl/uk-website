/**
 * World-class animation utilities for the grocery store
 * Using CSS animations with Tailwind for smooth 60fps performance
 * Lightweight - no external animation libraries required
 */

// ============================================================================
// ANIMATION TIMING & EASING
// ============================================================================

/**
 * Professional easing functions for smooth animations
 * These follow material design and Apple HIG principles
 */
export const easings = {
  // Standard easing - for most animations
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // Emphasized decelerate - for entering elements
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  // Emphasized accelerate - for exiting elements
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
  // Spring-like bounce - for playful interactions
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  // Smooth elastic - for attention-grabbing
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  // Sharp - for quick micro-interactions
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
} as const

/**
 * Standard durations following best practices
 * Short: micro-interactions, Long: complex transitions
 */
export const durations = {
  instant: '75ms',
  fast: '150ms',
  normal: '200ms',
  moderate: '300ms',
  slow: '400ms',
  slower: '500ms',
  slowest: '700ms',
} as const

// ============================================================================
// TAILWIND ANIMATION CLASSES
// ============================================================================

/**
 * Fade animations - for opacity transitions
 */
export const fadeAnimations = {
  // Basic fade in
  fadeIn: 'animate-fade-in',
  fadeInFast: 'animate-fade-in-fast',
  fadeInSlow: 'animate-fade-in-slow',
  // Fade out
  fadeOut: 'animate-fade-out',
  // Fade with direction
  fadeInUp: 'animate-fade-in-up',
  fadeInDown: 'animate-fade-in-down',
  fadeInLeft: 'animate-fade-in-left',
  fadeInRight: 'animate-fade-in-right',
} as const

/**
 * Slide animations - for directional movement
 */
export const slideAnimations = {
  slideInUp: 'animate-slide-in-up',
  slideInDown: 'animate-slide-in-down',
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',
  slideOutUp: 'animate-slide-out-up',
  slideOutDown: 'animate-slide-out-down',
  slideOutLeft: 'animate-slide-out-left',
  slideOutRight: 'animate-slide-out-right',
} as const

/**
 * Scale animations - for zoom effects
 */
export const scaleAnimations = {
  scaleIn: 'animate-scale-in',
  scaleOut: 'animate-scale-out',
  scaleInBounce: 'animate-scale-in-bounce',
  popIn: 'animate-pop-in',
} as const

/**
 * Special animations - for unique effects
 */
export const specialAnimations = {
  shake: 'animate-shake',
  wiggle: 'animate-wiggle',
  pulse: 'animate-pulse-soft',
  heartbeat: 'animate-heartbeat',
  spin: 'animate-spin',
  ping: 'animate-ping',
  bounce: 'animate-bounce',
  float: 'animate-float',
  shimmer: 'animate-shimmer',
} as const

// ============================================================================
// HOVER EFFECTS
// ============================================================================

/**
 * Card hover effects - professional lift and glow effects
 */
export const cardHoverEffects = {
  // Subtle lift with shadow
  lift: 'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg',
  // More pronounced lift
  liftMore: 'transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl',
  // Glow effect
  glow: 'transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]',
  // Scale up slightly
  grow: 'transition-transform duration-300 ease-out hover:scale-[1.02]',
  // Combined lift and grow
  liftGrow: 'transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg',
  // Border highlight
  borderHighlight: 'transition-all duration-200 hover:border-green-500 hover:shadow-sm',
  // Subtle background change
  bgHighlight: 'transition-colors duration-200 hover:bg-gray-50',
  // Image zoom container
  imageZoom: 'overflow-hidden [&_img]:transition-transform [&_img]:duration-500 [&_img]:hover:scale-110',
} as const

/**
 * Button hover effects - tactile feedback
 */
export const buttonHoverEffects = {
  // Standard press effect
  press: 'transition-all duration-150 active:scale-95',
  // Lift on hover, press on click
  liftPress: 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm',
  // Glow effect for primary buttons
  glow: 'transition-all duration-200 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]',
  // Shine sweep effect
  shine: 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-transform before:duration-500 hover:before:translate-x-full',
  // Scale pulse
  pulse: 'transition-transform duration-200 hover:scale-105 active:scale-95',
  // Ring focus effect
  ring: 'focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2',
} as const

/**
 * Link hover effects
 */
export const linkHoverEffects = {
  // Underline animation
  underline: 'relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-full',
  // Color transition
  colorShift: 'transition-colors duration-200 hover:text-green-600',
  // Underline slide
  underlineSlide: 'relative after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-0 after:-translate-x-1/2 after:bg-green-500 after:transition-all after:duration-300 hover:after:w-full',
} as const

// ============================================================================
// STAGGER ANIMATION DELAYS
// ============================================================================

/**
 * Stagger delay classes for list animations
 * Use with intersection observer for scroll-triggered animations
 */
export const staggerDelays = {
  delay0: 'animation-delay-0',
  delay1: 'animation-delay-75',
  delay2: 'animation-delay-100',
  delay3: 'animation-delay-150',
  delay4: 'animation-delay-200',
  delay5: 'animation-delay-250',
  delay6: 'animation-delay-300',
  delay7: 'animation-delay-350',
  delay8: 'animation-delay-400',
  delay9: 'animation-delay-450',
  delay10: 'animation-delay-500',
} as const

/**
 * Generate stagger delay style based on index
 * @param index - The item index in the list
 * @param baseDelay - Base delay in milliseconds (default: 50)
 * @param maxDelay - Maximum delay cap in milliseconds (default: 500)
 */
export function getStaggerDelay(index: number, baseDelay = 50, maxDelay = 500): string {
  const delay = Math.min(index * baseDelay, maxDelay)
  return `${delay}ms`
}

/**
 * Generate stagger delay inline style object
 */
export function getStaggerStyle(index: number, baseDelay = 50, maxDelay = 500): React.CSSProperties {
  return {
    animationDelay: getStaggerDelay(index, baseDelay, maxDelay),
  }
}

// ============================================================================
// ANIMATION FILL MODES
// ============================================================================

export const fillModes = {
  forwards: 'animation-fill-forwards',
  backwards: 'animation-fill-backwards',
  both: 'animation-fill-both',
  none: 'animation-fill-none',
} as const

// ============================================================================
// PAGE TRANSITION CLASSES
// ============================================================================

/**
 * Page transition animations
 */
export const pageTransitions = {
  // Fade page transition
  fadeEnter: 'animate-page-fade-in',
  fadeExit: 'animate-page-fade-out',
  // Slide page transition
  slideEnter: 'animate-page-slide-in',
  slideExit: 'animate-page-slide-out',
  // Scale page transition
  scaleEnter: 'animate-page-scale-in',
  scaleExit: 'animate-page-scale-out',
} as const

// ============================================================================
// REDUCED MOTION SUPPORT
// ============================================================================

/**
 * Class to disable animations for users who prefer reduced motion
 */
export const reducedMotion = 'motion-reduce:animate-none motion-reduce:transition-none'

/**
 * Wrap animation classes with reduced motion support
 */
export function withReducedMotion(animationClass: string): string {
  return `${animationClass} ${reducedMotion}`
}

// ============================================================================
// SKELETON LOADING ANIMATIONS
// ============================================================================

export const skeletonAnimations = {
  pulse: 'animate-pulse',
  shimmer: 'animate-shimmer',
  wave: 'animate-skeleton-wave',
} as const

// ============================================================================
// COMBINED ANIMATION PRESETS
// ============================================================================

/**
 * Pre-built animation combinations for common use cases
 */
export const animationPresets = {
  // Product card - lift with image zoom
  productCard: `${cardHoverEffects.liftGrow} ${cardHoverEffects.imageZoom}`,
  // Category card - subtle lift
  categoryCard: cardHoverEffects.lift,
  // CTA button - glow with press
  ctaButton: `${buttonHoverEffects.glow} ${buttonHoverEffects.press}`,
  // Navigation link - underline slide
  navLink: linkHoverEffects.underlineSlide,
  // Cart item - subtle background
  cartItem: cardHoverEffects.bgHighlight,
  // Featured product - more dramatic lift
  featuredCard: cardHoverEffects.liftMore,
  // Quick action button
  quickAction: `${buttonHoverEffects.liftPress} ${buttonHoverEffects.ring}`,
} as const

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type EasingType = keyof typeof easings
export type DurationType = keyof typeof durations
export type FadeAnimationType = keyof typeof fadeAnimations
export type SlideAnimationType = keyof typeof slideAnimations
export type ScaleAnimationType = keyof typeof scaleAnimations
export type SpecialAnimationType = keyof typeof specialAnimations
export type CardHoverType = keyof typeof cardHoverEffects
export type ButtonHoverType = keyof typeof buttonHoverEffects
export type LinkHoverType = keyof typeof linkHoverEffects
export type StaggerDelayType = keyof typeof staggerDelays
export type PageTransitionType = keyof typeof pageTransitions
