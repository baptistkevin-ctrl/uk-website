'use client'

import * as React from 'react'
import {
  createFocusTrap,
  getFocusableElements,
  getFirstFocusable,
  getLastFocusable,
  focusElement,
  type FocusTrapOptions,
} from '@/lib/accessibility'

/**
 * Props for the FocusTrap component
 */
export interface FocusTrapProps {
  /**
   * Whether the focus trap is active
   */
  active?: boolean
  /**
   * The content to render within the focus trap
   */
  children: React.ReactNode
  /**
   * Element to focus when trap is activated
   * Can be a ref to an element or a CSS selector
   */
  initialFocus?: React.RefObject<HTMLElement | null> | string
  /**
   * Element to return focus to when trap is deactivated
   * If not provided, focuses the element that was focused before activation
   */
  returnFocus?: React.RefObject<HTMLElement | null> | boolean
  /**
   * Whether pressing Escape should deactivate the trap
   */
  escapeDeactivates?: boolean
  /**
   * Callback when Escape is pressed (only if escapeDeactivates is true)
   */
  onEscape?: () => void
  /**
   * Whether clicking outside the trap should deactivate it
   */
  clickOutsideDeactivates?: boolean
  /**
   * Callback when clicking outside the trap
   */
  onClickOutside?: () => void
  /**
   * Whether to pause scrolling on the body when trap is active
   */
  lockScroll?: boolean
  /**
   * CSS class name for the container
   */
  className?: string
  /**
   * Whether to auto-focus the first focusable element
   */
  autoFocus?: boolean
  /**
   * Callback when focus is trapped (after activation)
   */
  onActivate?: () => void
  /**
   * Callback when focus trap is released
   */
  onDeactivate?: () => void
}

/**
 * FocusTrap Component
 *
 * Traps keyboard focus within a container element, essential for modal dialogs,
 * dropdown menus, and other overlay components to maintain accessibility.
 *
 * Follows WCAG 2.1 AA Success Criterion 2.4.3: Focus Order
 *
 * @example Basic modal usage
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false)
 *
 * return (
 *   <Dialog open={isOpen}>
 *     <FocusTrap
 *       active={isOpen}
 *       escapeDeactivates
 *       onEscape={() => setIsOpen(false)}
 *     >
 *       <DialogContent>
 *         <h2>Modal Title</h2>
 *         <button onClick={() => setIsOpen(false)}>Close</button>
 *       </DialogContent>
 *     </FocusTrap>
 *   </Dialog>
 * )
 * ```
 *
 * @example With initial focus
 * ```tsx
 * const submitButtonRef = useRef<HTMLButtonElement>(null)
 *
 * <FocusTrap
 *   active={isOpen}
 *   initialFocus={submitButtonRef}
 *   escapeDeactivates
 *   onEscape={closeModal}
 * >
 *   <form>
 *     <input type="text" />
 *     <button ref={submitButtonRef} type="submit">Submit</button>
 *   </form>
 * </FocusTrap>
 * ```
 */
export function FocusTrap({
  active = true,
  children,
  initialFocus,
  returnFocus = true,
  escapeDeactivates = true,
  onEscape,
  clickOutsideDeactivates = false,
  onClickOutside,
  lockScroll = false,
  className,
  autoFocus = true,
  onActivate,
  onDeactivate,
}: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null)
  const trapRef = React.useRef<ReturnType<typeof createFocusTrap> | null>(null)

  // Store the previously focused element when mounting
  React.useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement
  }, [])

  // Handle scroll lock
  React.useEffect(() => {
    if (active && lockScroll) {
      const originalOverflow = document.body.style.overflow
      const originalPaddingRight = document.body.style.paddingRight

      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

      document.body.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }

      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.paddingRight = originalPaddingRight
      }
    }
  }, [active, lockScroll])

  // Create and manage focus trap
  React.useEffect(() => {
    const container = containerRef.current
    if (!container || !active) {
      // Deactivate if becoming inactive
      if (trapRef.current?.isActive) {
        trapRef.current.deactivate()
        onDeactivate?.()
      }
      return
    }

    // Resolve initial focus element
    let initialFocusElement: HTMLElement | null = null
    if (initialFocus) {
      if (typeof initialFocus === 'string') {
        initialFocusElement = container.querySelector<HTMLElement>(initialFocus)
      } else if (initialFocus.current) {
        initialFocusElement = initialFocus.current
      }
    }

    // Resolve return focus element
    let returnFocusElement: HTMLElement | null = null
    if (returnFocus === true) {
      returnFocusElement = previouslyFocusedRef.current
    } else if (returnFocus && typeof returnFocus !== 'boolean') {
      returnFocusElement = returnFocus.current || null
    }

    // Create focus trap
    trapRef.current = createFocusTrap({
      container,
      initialFocus: autoFocus ? initialFocusElement : null,
      returnFocus: returnFocusElement,
      escapeDeactivates,
      onEscape,
      clickOutsideDeactivates,
      onClickOutside,
    })

    trapRef.current.activate()
    onActivate?.()

    return () => {
      if (trapRef.current?.isActive) {
        trapRef.current.deactivate()
        onDeactivate?.()
      }
    }
  }, [
    active,
    initialFocus,
    returnFocus,
    escapeDeactivates,
    onEscape,
    clickOutsideDeactivates,
    onClickOutside,
    autoFocus,
    onActivate,
    onDeactivate,
  ])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

/**
 * Hook for creating a focus trap programmatically
 *
 * @param options - Focus trap options
 * @returns Object with containerRef, activate, deactivate, and isActive
 *
 * @example
 * ```tsx
 * function CustomModal({ isOpen, onClose }) {
 *   const { containerRef, isActive } = useFocusTrap({
 *     active: isOpen,
 *     escapeDeactivates: true,
 *     onEscape: onClose,
 *   })
 *
 *   return (
 *     <div ref={containerRef}>
 *       <h2>Modal Content</h2>
 *       <button onClick={onClose}>Close</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useFocusTrap(
  options: {
    active?: boolean
    initialFocus?: React.RefObject<HTMLElement | null> | string
    escapeDeactivates?: boolean
    onEscape?: () => void
    clickOutsideDeactivates?: boolean
    onClickOutside?: () => void
    autoFocus?: boolean
  } = {}
): {
  containerRef: React.RefObject<HTMLDivElement | null>
  activate: () => void
  deactivate: () => void
  isActive: boolean
} {
  const {
    active = false,
    initialFocus,
    escapeDeactivates = true,
    onEscape,
    clickOutsideDeactivates = false,
    onClickOutside,
    autoFocus = true,
  } = options

  const containerRef = React.useRef<HTMLDivElement>(null)
  const trapRef = React.useRef<ReturnType<typeof createFocusTrap> | null>(null)
  const [isActive, setIsActive] = React.useState(false)

  const activate = React.useCallback(() => {
    const container = containerRef.current
    if (!container) return

    // Resolve initial focus element
    let initialFocusElement: HTMLElement | null = null
    if (initialFocus) {
      if (typeof initialFocus === 'string') {
        initialFocusElement = container.querySelector<HTMLElement>(initialFocus)
      } else if (initialFocus.current) {
        initialFocusElement = initialFocus.current
      }
    }

    trapRef.current = createFocusTrap({
      container,
      initialFocus: autoFocus ? initialFocusElement : null,
      escapeDeactivates,
      onEscape,
      clickOutsideDeactivates,
      onClickOutside,
    })

    trapRef.current.activate()
    setIsActive(true)
  }, [initialFocus, escapeDeactivates, onEscape, clickOutsideDeactivates, onClickOutside, autoFocus])

  const deactivate = React.useCallback(() => {
    if (trapRef.current?.isActive) {
      trapRef.current.deactivate()
      setIsActive(false)
    }
  }, [])

  // Auto-activate/deactivate based on active prop
  React.useEffect(() => {
    if (active) {
      activate()
    } else {
      deactivate()
    }

    return () => {
      deactivate()
    }
  }, [active, activate, deactivate])

  return {
    containerRef,
    activate,
    deactivate,
    isActive,
  }
}

/**
 * Hook for managing focus within a container
 * Provides utilities for focus management without trapping
 *
 * @example
 * ```tsx
 * function Menu() {
 *   const { containerRef, focusFirst, focusLast, getFocusable } = useFocusScope()
 *
 *   useEffect(() => {
 *     if (isOpen) {
 *       focusFirst()
 *     }
 *   }, [isOpen])
 *
 *   return <div ref={containerRef}>{menuItems}</div>
 * }
 * ```
 */
export function useFocusScope(): {
  containerRef: React.RefObject<HTMLDivElement | null>
  focusFirst: () => void
  focusLast: () => void
  focusNext: () => void
  focusPrevious: () => void
  getFocusable: () => HTMLElement[]
  hasFocusWithin: () => boolean
} {
  const containerRef = React.useRef<HTMLDivElement>(null)

  const getFocusable = React.useCallback(() => {
    if (!containerRef.current) return []
    return getFocusableElements(containerRef.current)
  }, [])

  const focusFirst = React.useCallback(() => {
    if (!containerRef.current) return
    const first = getFirstFocusable(containerRef.current)
    focusElement(first)
  }, [])

  const focusLast = React.useCallback(() => {
    if (!containerRef.current) return
    const last = getLastFocusable(containerRef.current)
    focusElement(last)
  }, [])

  const focusNext = React.useCallback(() => {
    if (!containerRef.current) return
    const focusable = getFocusableElements(containerRef.current)
    const currentIndex = focusable.findIndex((el) => el === document.activeElement)
    const nextIndex = (currentIndex + 1) % focusable.length
    focusElement(focusable[nextIndex])
  }, [])

  const focusPrevious = React.useCallback(() => {
    if (!containerRef.current) return
    const focusable = getFocusableElements(containerRef.current)
    const currentIndex = focusable.findIndex((el) => el === document.activeElement)
    const prevIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1
    focusElement(focusable[prevIndex])
  }, [])

  const hasFocusWithin = React.useCallback(() => {
    if (!containerRef.current) return false
    return containerRef.current.contains(document.activeElement)
  }, [])

  return {
    containerRef,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    getFocusable,
    hasFocusWithin,
  }
}

/**
 * Hook for managing focus restoration
 * Saves and restores focus when a component mounts/unmounts
 *
 * @param restoreOnUnmount - Whether to restore focus when component unmounts
 * @returns Object with save and restore functions
 *
 * @example
 * ```tsx
 * function Modal({ isOpen, onClose }) {
 *   const { save, restore } = useFocusRestore()
 *
 *   useEffect(() => {
 *     if (isOpen) {
 *       save()
 *     } else {
 *       restore()
 *     }
 *   }, [isOpen])
 *
 *   return isOpen ? <div>Modal content</div> : null
 * }
 * ```
 */
export function useFocusRestore(restoreOnUnmount = true): {
  save: () => void
  restore: () => void
  savedElement: HTMLElement | null
} {
  const savedRef = React.useRef<HTMLElement | null>(null)

  const save = React.useCallback(() => {
    savedRef.current = document.activeElement as HTMLElement
  }, [])

  const restore = React.useCallback(() => {
    if (savedRef.current) {
      focusElement(savedRef.current)
    }
  }, [])

  React.useEffect(() => {
    return () => {
      if (restoreOnUnmount && savedRef.current) {
        focusElement(savedRef.current)
      }
    }
  }, [restoreOnUnmount])

  return {
    save,
    restore,
    savedElement: savedRef.current,
  }
}

/**
 * Hook for detecting if focus is within a container
 *
 * @returns Object with containerRef and hasFocus state
 *
 * @example
 * ```tsx
 * function Dropdown() {
 *   const { containerRef, hasFocus } = useFocusWithin()
 *
 *   return (
 *     <div ref={containerRef} className={hasFocus ? 'focused' : ''}>
 *       <button>Trigger</button>
 *       <ul>...</ul>
 *     </div>
 *   )
 * }
 * ```
 */
export function useFocusWithin(): {
  containerRef: React.RefObject<HTMLDivElement | null>
  hasFocus: boolean
} {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [hasFocus, setHasFocus] = React.useState(false)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleFocusIn = () => setHasFocus(true)
    const handleFocusOut = (event: FocusEvent) => {
      // Check if focus is moving outside the container
      if (!container.contains(event.relatedTarget as Node)) {
        setHasFocus(false)
      }
    }

    container.addEventListener('focusin', handleFocusIn)
    container.addEventListener('focusout', handleFocusOut)

    return () => {
      container.removeEventListener('focusin', handleFocusIn)
      container.removeEventListener('focusout', handleFocusOut)
    }
  }, [])

  return { containerRef, hasFocus }
}

// Re-export utility functions for convenience
export {
  createFocusTrap,
  getFocusableElements,
  getFirstFocusable,
  getLastFocusable,
  focusElement,
  FOCUSABLE_SELECTOR,
} from '@/lib/accessibility'

export type { FocusTrapOptions }
