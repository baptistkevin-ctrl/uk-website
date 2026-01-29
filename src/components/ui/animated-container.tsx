'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'
import {
  fadeAnimations,
  slideAnimations,
  scaleAnimations,
  getStaggerStyle,
  cardHoverEffects,
  buttonHoverEffects,
  pageTransitions,
  reducedMotion,
} from '@/lib/animations'

// ============================================================================
// TYPES
// ============================================================================

type AnimationVariant =
  | 'fade-in'
  | 'fade-in-up'
  | 'fade-in-down'
  | 'fade-in-left'
  | 'fade-in-right'
  | 'slide-in-up'
  | 'slide-in-down'
  | 'slide-in-left'
  | 'slide-in-right'
  | 'scale-in'
  | 'scale-in-bounce'
  | 'pop-in'

type TriggerMode = 'mount' | 'visible' | 'hover'

interface AnimatedContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The animation variant to use */
  animation?: AnimationVariant
  /** When to trigger the animation */
  trigger?: TriggerMode
  /** Delay before animation starts (in ms) */
  delay?: number
  /** Duration of the animation (in ms) */
  duration?: number
  /** Whether to animate only once or every time it enters viewport */
  once?: boolean
  /** Threshold for intersection observer (0-1) */
  threshold?: number
  /** Root margin for intersection observer */
  rootMargin?: string
  /** Disable animation */
  disabled?: boolean
  /** Children to render */
  children: React.ReactNode
}

interface StaggerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Base delay between items (in ms) */
  staggerDelay?: number
  /** Maximum total delay cap (in ms) */
  maxDelay?: number
  /** Animation to apply to children */
  animation?: AnimationVariant
  /** When to trigger the animation */
  trigger?: TriggerMode
  /** Whether to animate only once */
  once?: boolean
  /** Threshold for intersection observer */
  threshold?: number
  /** Children to render */
  children: React.ReactNode
}

interface HoverCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Hover effect variant */
  effect?: 'lift' | 'lift-more' | 'glow' | 'grow' | 'lift-grow' | 'border' | 'bg'
  /** Whether to include image zoom effect */
  imageZoom?: boolean
  /** Children to render */
  children: React.ReactNode
}

interface AnimatedButtonWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Button effect variant */
  effect?: 'press' | 'lift-press' | 'glow' | 'shine' | 'pulse'
  /** Children to render */
  children: React.ReactNode
}

interface PageTransitionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Transition variant */
  variant?: 'fade' | 'slide' | 'scale'
  /** Children to render */
  children: React.ReactNode
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Custom hook for intersection observer with animation trigger
 */
function useAnimationTrigger(
  trigger: TriggerMode,
  once: boolean,
  threshold: number,
  rootMargin: string
) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = React.useState(trigger === 'mount')
  const [hasAnimated, setHasAnimated] = React.useState(false)

  React.useEffect(() => {
    if (trigger !== 'visible' || (once && hasAnimated)) return

    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) {
            setHasAnimated(true)
            observer.unobserve(element)
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [trigger, once, hasAnimated, threshold, rootMargin])

  return { ref, isVisible }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getAnimationClass(variant: AnimationVariant): string {
  const animationMap: Record<AnimationVariant, string> = {
    'fade-in': fadeAnimations.fadeIn,
    'fade-in-up': fadeAnimations.fadeInUp,
    'fade-in-down': fadeAnimations.fadeInDown,
    'fade-in-left': fadeAnimations.fadeInLeft,
    'fade-in-right': fadeAnimations.fadeInRight,
    'slide-in-up': slideAnimations.slideInUp,
    'slide-in-down': slideAnimations.slideInDown,
    'slide-in-left': slideAnimations.slideInLeft,
    'slide-in-right': slideAnimations.slideInRight,
    'scale-in': scaleAnimations.scaleIn,
    'scale-in-bounce': scaleAnimations.scaleInBounce,
    'pop-in': scaleAnimations.popIn,
  }
  return animationMap[variant]
}

function getHoverClass(effect: HoverCardProps['effect']): string {
  const effectMap: Record<NonNullable<HoverCardProps['effect']>, string> = {
    lift: cardHoverEffects.lift,
    'lift-more': cardHoverEffects.liftMore,
    glow: cardHoverEffects.glow,
    grow: cardHoverEffects.grow,
    'lift-grow': cardHoverEffects.liftGrow,
    border: cardHoverEffects.borderHighlight,
    bg: cardHoverEffects.bgHighlight,
  }
  return effect ? effectMap[effect] : ''
}

function getButtonEffectClass(effect: AnimatedButtonWrapperProps['effect']): string {
  const effectMap: Record<NonNullable<AnimatedButtonWrapperProps['effect']>, string> = {
    press: buttonHoverEffects.press,
    'lift-press': buttonHoverEffects.liftPress,
    glow: buttonHoverEffects.glow,
    shine: buttonHoverEffects.shine,
    pulse: buttonHoverEffects.pulse,
  }
  return effect ? effectMap[effect] : ''
}

// ============================================================================
// COMPONENTS
// ============================================================================

/**
 * AnimatedContainer - Wrapper for animating elements with various effects
 *
 * @example
 * ```tsx
 * <AnimatedContainer animation="fade-in-up" trigger="visible">
 *   <ProductCard />
 * </AnimatedContainer>
 * ```
 */
export function AnimatedContainer({
  animation = 'fade-in',
  trigger = 'mount',
  delay = 0,
  duration,
  once = true,
  threshold = 0.1,
  rootMargin = '0px',
  disabled = false,
  className,
  style,
  children,
  ...props
}: AnimatedContainerProps) {
  const { ref, isVisible } = useAnimationTrigger(trigger, once, threshold, rootMargin)
  const [isHovered, setIsHovered] = React.useState(false)

  const shouldAnimate = disabled
    ? false
    : trigger === 'hover'
    ? isHovered
    : isVisible

  const animationClass = getAnimationClass(animation)

  const combinedStyle: React.CSSProperties = {
    ...style,
    ...(delay > 0 && { animationDelay: `${delay}ms` }),
    ...(duration && { animationDuration: `${duration}ms` }),
  }

  return (
    <div
      ref={ref}
      className={cn(
        'animation-fill-both',
        shouldAnimate ? animationClass : 'opacity-0',
        reducedMotion,
        className
      )}
      style={combinedStyle}
      onMouseEnter={trigger === 'hover' ? () => setIsHovered(true) : undefined}
      onMouseLeave={trigger === 'hover' ? () => setIsHovered(false) : undefined}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * StaggerContainer - Container that staggers animations for child elements
 *
 * @example
 * ```tsx
 * <StaggerContainer animation="fade-in-up" staggerDelay={75}>
 *   {products.map((product) => (
 *     <ProductCard key={product.id} product={product} />
 *   ))}
 * </StaggerContainer>
 * ```
 */
export function StaggerContainer({
  staggerDelay = 50,
  maxDelay = 500,
  animation = 'fade-in-up',
  trigger = 'visible',
  once = true,
  threshold = 0.1,
  className,
  children,
  ...props
}: StaggerContainerProps) {
  const { ref, isVisible } = useAnimationTrigger(trigger, once, threshold, '0px')
  const animationClass = getAnimationClass(animation)

  return (
    <div ref={ref} className={className} {...props}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child

        return (
          <div
            className={cn(
              'animation-fill-both',
              isVisible ? animationClass : 'opacity-0',
              reducedMotion
            )}
            style={getStaggerStyle(index, staggerDelay, maxDelay)}
          >
            {child}
          </div>
        )
      })}
    </div>
  )
}

/**
 * StaggerList - A more flexible stagger container that passes animation props to children
 *
 * @example
 * ```tsx
 * <StaggerList animation="slide-in-up" staggerDelay={100}>
 *   <li>Item 1</li>
 *   <li>Item 2</li>
 *   <li>Item 3</li>
 * </StaggerList>
 * ```
 */
export function StaggerList({
  staggerDelay = 50,
  maxDelay = 500,
  animation = 'fade-in-up',
  trigger = 'visible',
  once = true,
  threshold = 0.1,
  className,
  children,
  ...props
}: StaggerContainerProps) {
  const { ref, isVisible } = useAnimationTrigger(trigger, once, threshold, '0px')
  const animationClass = getAnimationClass(animation)

  return (
    <div ref={ref} className={className} {...props}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child

        // Clone the child and add animation classes/styles
        return React.cloneElement(child as React.ReactElement<{ className?: string; style?: React.CSSProperties }>, {
          className: cn(
            (child.props as { className?: string }).className,
            'animation-fill-both',
            isVisible ? animationClass : 'opacity-0',
            reducedMotion
          ),
          style: {
            ...(child.props as { style?: React.CSSProperties }).style,
            ...getStaggerStyle(index, staggerDelay, maxDelay),
          },
        })
      })}
    </div>
  )
}

/**
 * HoverCard - Card component with built-in hover effects
 *
 * @example
 * ```tsx
 * <HoverCard effect="lift-grow" imageZoom>
 *   <img src="/product.jpg" alt="Product" />
 *   <h3>Product Name</h3>
 * </HoverCard>
 * ```
 */
export function HoverCard({
  effect = 'lift',
  imageZoom = false,
  className,
  children,
  ...props
}: HoverCardProps) {
  return (
    <div
      className={cn(
        getHoverClass(effect),
        imageZoom && cardHoverEffects.imageZoom,
        reducedMotion,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * AnimatedButtonWrapper - Wrapper to add animation effects to buttons
 *
 * @example
 * ```tsx
 * <AnimatedButtonWrapper effect="lift-press">
 *   <Button>Click Me</Button>
 * </AnimatedButtonWrapper>
 * ```
 */
export function AnimatedButtonWrapper({
  effect = 'press',
  className,
  children,
  ...props
}: AnimatedButtonWrapperProps) {
  return (
    <div
      className={cn(
        'inline-block',
        getButtonEffectClass(effect),
        reducedMotion,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * PageTransition - Wrapper for page-level transitions
 *
 * @example
 * ```tsx
 * // In your layout or page component
 * <PageTransition variant="fade">
 *   {children}
 * </PageTransition>
 * ```
 */
export function PageTransition({
  variant = 'fade',
  className,
  children,
  ...props
}: PageTransitionProps) {
  const transitionMap: Record<NonNullable<PageTransitionProps['variant']>, string> = {
    fade: pageTransitions.fadeEnter,
    slide: pageTransitions.slideEnter,
    scale: pageTransitions.scaleEnter,
  }

  return (
    <div
      className={cn(
        transitionMap[variant],
        'animation-fill-both',
        reducedMotion,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * FadeIn - Simple fade-in wrapper with sensible defaults
 *
 * @example
 * ```tsx
 * <FadeIn delay={200}>
 *   <div>Content that fades in</div>
 * </FadeIn>
 * ```
 */
export function FadeIn({
  delay = 0,
  duration,
  className,
  children,
  ...props
}: Omit<AnimatedContainerProps, 'animation'>) {
  return (
    <AnimatedContainer
      animation="fade-in"
      delay={delay}
      duration={duration}
      className={className}
      {...props}
    >
      {children}
    </AnimatedContainer>
  )
}

/**
 * SlideIn - Simple slide-in wrapper with direction support
 *
 * @example
 * ```tsx
 * <SlideIn direction="up" delay={100}>
 *   <Card>Sliding content</Card>
 * </SlideIn>
 * ```
 */
interface SlideInProps extends Omit<AnimatedContainerProps, 'animation'> {
  direction?: 'up' | 'down' | 'left' | 'right'
}

export function SlideIn({
  direction = 'up',
  delay = 0,
  duration,
  className,
  children,
  ...props
}: SlideInProps) {
  const animationMap: Record<NonNullable<SlideInProps['direction']>, AnimationVariant> = {
    up: 'slide-in-up',
    down: 'slide-in-down',
    left: 'slide-in-left',
    right: 'slide-in-right',
  }

  return (
    <AnimatedContainer
      animation={animationMap[direction]}
      delay={delay}
      duration={duration}
      className={className}
      {...props}
    >
      {children}
    </AnimatedContainer>
  )
}

/**
 * ScaleIn - Simple scale-in wrapper
 *
 * @example
 * ```tsx
 * <ScaleIn bounce>
 *   <Modal>Content</Modal>
 * </ScaleIn>
 * ```
 */
interface ScaleInProps extends Omit<AnimatedContainerProps, 'animation'> {
  bounce?: boolean
}

export function ScaleIn({
  bounce = false,
  delay = 0,
  duration,
  className,
  children,
  ...props
}: ScaleInProps) {
  return (
    <AnimatedContainer
      animation={bounce ? 'scale-in-bounce' : 'scale-in'}
      delay={delay}
      duration={duration}
      className={className}
      {...props}
    >
      {children}
    </AnimatedContainer>
  )
}

// ============================================================================
// GRID COMPONENTS
// ============================================================================

/**
 * AnimatedGrid - Grid container with staggered child animations
 *
 * @example
 * ```tsx
 * <AnimatedGrid columns={3} gap={4}>
 *   {products.map((product) => (
 *     <ProductCard key={product.id} product={product} />
 *   ))}
 * </AnimatedGrid>
 * ```
 */
interface AnimatedGridProps extends StaggerContainerProps {
  /** Number of columns (responsive object or number) */
  columns?: number | { sm?: number; md?: number; lg?: number; xl?: number }
  /** Gap between items (in Tailwind spacing units) */
  gap?: number
}

export function AnimatedGrid({
  columns = 3,
  gap = 4,
  staggerDelay = 50,
  maxDelay = 500,
  animation = 'fade-in-up',
  trigger = 'visible',
  once = true,
  threshold = 0.1,
  className,
  children,
  ...props
}: AnimatedGridProps) {
  const gridClass = typeof columns === 'number'
    ? `grid-cols-${columns}`
    : cn(
        columns.sm && `sm:grid-cols-${columns.sm}`,
        columns.md && `md:grid-cols-${columns.md}`,
        columns.lg && `lg:grid-cols-${columns.lg}`,
        columns.xl && `xl:grid-cols-${columns.xl}`
      )

  return (
    <StaggerContainer
      staggerDelay={staggerDelay}
      maxDelay={maxDelay}
      animation={animation}
      trigger={trigger}
      once={once}
      threshold={threshold}
      className={cn('grid', gridClass, `gap-${gap}`, className)}
      {...props}
    >
      {children}
    </StaggerContainer>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  AnimatedContainerProps,
  StaggerContainerProps,
  HoverCardProps,
  AnimatedButtonWrapperProps,
  PageTransitionProps,
  SlideInProps,
  ScaleInProps,
  AnimatedGridProps,
  AnimationVariant,
  TriggerMode,
}
