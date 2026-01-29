/**
 * Accessibility Utilities for UK Grocery Store
 *
 * This module provides comprehensive accessibility helpers following WCAG 2.1 AA guidelines.
 * These utilities ensure the application is usable by people with disabilities including
 * those using screen readers, keyboard-only navigation, and assistive technologies.
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface FocusTrapOptions {
  /** The container element to trap focus within */
  container: HTMLElement
  /** Element to focus when trap is activated (defaults to first focusable) */
  initialFocus?: HTMLElement | null
  /** Element to return focus to when trap is deactivated */
  returnFocus?: HTMLElement | null
  /** Whether to allow escape key to deactivate the trap */
  escapeDeactivates?: boolean
  /** Callback when escape is pressed */
  onEscape?: () => void
  /** Whether clicking outside should deactivate the trap */
  clickOutsideDeactivates?: boolean
  /** Callback when clicking outside */
  onClickOutside?: () => void
}

export interface KeyboardNavigationOptions {
  /** Enable arrow key navigation for list items */
  enableArrowKeys?: boolean
  /** Enable Home/End key navigation */
  enableHomeEnd?: boolean
  /** Enable type-ahead search */
  enableTypeAhead?: boolean
  /** Orientation for arrow key navigation */
  orientation?: 'horizontal' | 'vertical' | 'both'
  /** Whether navigation should wrap around */
  wrap?: boolean
  /** Callback when an item is selected */
  onSelect?: (element: HTMLElement, index: number) => void
}

export interface LiveRegionOptions {
  /** Politeness level for screen reader announcement */
  politeness?: 'polite' | 'assertive' | 'off'
  /** Whether the region is atomic (read as a whole) */
  atomic?: boolean
  /** Relevant types of changes to announce */
  relevant?: ('additions' | 'removals' | 'text' | 'all')[]
}

// ============================================================================
// Focus Management Utilities
// ============================================================================

/**
 * Selector for all focusable elements within a container
 * Includes interactive elements, elements with tabindex, and custom focusable elements
 */
export const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
  'audio[controls]',
  'video[controls]',
  'details > summary:first-of-type',
  'iframe',
  'object',
  'embed',
].join(', ')

/**
 * Gets all focusable elements within a container
 * @param container - The container element to search within
 * @param includeDisabled - Whether to include disabled elements
 * @returns Array of focusable HTMLElements
 */
export function getFocusableElements(
  container: HTMLElement,
  includeDisabled = false
): HTMLElement[] {
  const selector = includeDisabled
    ? FOCUSABLE_SELECTOR.replace(/:not\(\[disabled\]\)/g, '')
    : FOCUSABLE_SELECTOR

  const elements = Array.from(container.querySelectorAll<HTMLElement>(selector))

  return elements.filter((element) => {
    // Check visibility
    if (element.offsetParent === null && element.tagName !== 'BODY') {
      const style = getComputedStyle(element)
      if (style.position !== 'fixed' && style.position !== 'sticky') {
        return false
      }
    }

    // Check if element is truly visible
    const rect = element.getBoundingClientRect()
    if (rect.width === 0 && rect.height === 0) {
      return false
    }

    return true
  })
}

/**
 * Gets the first focusable element within a container
 * @param container - The container element to search within
 * @returns The first focusable element or null
 */
export function getFirstFocusable(container: HTMLElement): HTMLElement | null {
  const focusableElements = getFocusableElements(container)
  return focusableElements[0] || null
}

/**
 * Gets the last focusable element within a container
 * @param container - The container element to search within
 * @returns The last focusable element or null
 */
export function getLastFocusable(container: HTMLElement): HTMLElement | null {
  const focusableElements = getFocusableElements(container)
  return focusableElements[focusableElements.length - 1] || null
}

/**
 * Focuses an element with a fallback for elements that can't normally receive focus
 * @param element - The element to focus
 * @param options - Focus options
 */
export function focusElement(
  element: HTMLElement | null,
  options?: FocusOptions
): void {
  if (!element) return

  // Make element programmatically focusable if needed
  if (!element.hasAttribute('tabindex')) {
    const originalTabIndex = element.getAttribute('tabindex')
    element.setAttribute('tabindex', '-1')
    element.focus(options)

    // Restore original tabindex after blur
    const handleBlur = () => {
      if (originalTabIndex !== null) {
        element.setAttribute('tabindex', originalTabIndex)
      } else {
        element.removeAttribute('tabindex')
      }
      element.removeEventListener('blur', handleBlur)
    }
    element.addEventListener('blur', handleBlur)
  } else {
    element.focus(options)
  }
}

// ============================================================================
// Focus Trap Implementation
// ============================================================================

/**
 * Creates a focus trap within a container element.
 * Essential for modal dialogs, dropdown menus, and other overlay components.
 *
 * @param options - Focus trap configuration options
 * @returns Object with activate, deactivate, and update methods
 *
 * @example
 * ```typescript
 * const trap = createFocusTrap({
 *   container: modalElement,
 *   escapeDeactivates: true,
 *   onEscape: () => closeModal()
 * })
 *
 * trap.activate()
 * // ... modal is open
 * trap.deactivate()
 * ```
 */
export function createFocusTrap(options: FocusTrapOptions) {
  const {
    container,
    initialFocus,
    returnFocus,
    escapeDeactivates = true,
    onEscape,
    clickOutsideDeactivates = false,
    onClickOutside,
  } = options

  let isActive = false
  let previouslyFocused: HTMLElement | null = null

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isActive) return

    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements(container)

      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement as HTMLElement

      if (event.shiftKey) {
        // Shift + Tab: Move focus backward
        if (activeElement === firstElement || !container.contains(activeElement)) {
          event.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab: Move focus forward
        if (activeElement === lastElement || !container.contains(activeElement)) {
          event.preventDefault()
          firstElement?.focus()
        }
      }
    }

    if (event.key === 'Escape' && escapeDeactivates) {
      event.preventDefault()
      event.stopPropagation()
      onEscape?.()
    }
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (!isActive || !clickOutsideDeactivates) return

    const target = event.target as Node
    if (!container.contains(target)) {
      event.preventDefault()
      onClickOutside?.()
    }
  }

  const handleFocusIn = (event: FocusEvent) => {
    if (!isActive) return

    const target = event.target as Node
    if (!container.contains(target)) {
      event.preventDefault()
      event.stopPropagation()

      const focusableElements = getFocusableElements(container)
      const firstElement = focusableElements[0]
      firstElement?.focus()
    }
  }

  return {
    /**
     * Activates the focus trap
     */
    activate() {
      if (isActive) return

      isActive = true
      previouslyFocused = (returnFocus || document.activeElement) as HTMLElement

      // Add event listeners
      document.addEventListener('keydown', handleKeyDown, true)
      document.addEventListener('click', handleClickOutside, true)
      document.addEventListener('focusin', handleFocusIn, true)

      // Set initial focus
      requestAnimationFrame(() => {
        if (initialFocus) {
          initialFocus.focus()
        } else {
          const firstFocusable = getFirstFocusable(container)
          firstFocusable?.focus()
        }
      })
    },

    /**
     * Deactivates the focus trap and returns focus to the previously focused element
     */
    deactivate() {
      if (!isActive) return

      isActive = false

      // Remove event listeners
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('click', handleClickOutside, true)
      document.removeEventListener('focusin', handleFocusIn, true)

      // Return focus to previously focused element
      requestAnimationFrame(() => {
        previouslyFocused?.focus()
      })
    },

    /**
     * Updates the focus trap with new options
     */
    update(newOptions: Partial<FocusTrapOptions>) {
      Object.assign(options, newOptions)
    },

    /**
     * Returns whether the trap is currently active
     */
    get isActive() {
      return isActive
    },
  }
}

// ============================================================================
// Keyboard Navigation Utilities
// ============================================================================

/**
 * Creates keyboard navigation handlers for list-like components
 * Useful for menus, listboxes, comboboxes, and similar components
 *
 * @param container - The container element
 * @param itemSelector - CSS selector for navigable items
 * @param options - Navigation options
 * @returns Cleanup function to remove event listeners
 *
 * @example
 * ```typescript
 * const cleanup = createKeyboardNavigation(
 *   menuElement,
 *   '[role="menuitem"]',
 *   {
 *     orientation: 'vertical',
 *     wrap: true,
 *     onSelect: (element) => element.click()
 *   }
 * )
 *
 * // When done:
 * cleanup()
 * ```
 */
export function createKeyboardNavigation(
  container: HTMLElement,
  itemSelector: string,
  options: KeyboardNavigationOptions = {}
): () => void {
  const {
    enableArrowKeys = true,
    enableHomeEnd = true,
    enableTypeAhead = false,
    orientation = 'vertical',
    wrap = true,
    onSelect,
  } = options

  let currentIndex = -1
  let typeAheadBuffer = ''
  let typeAheadTimeout: ReturnType<typeof setTimeout> | null = null

  const getItems = (): HTMLElement[] => {
    return Array.from(container.querySelectorAll<HTMLElement>(itemSelector))
      .filter((item) => {
        const style = getComputedStyle(item)
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          !item.hasAttribute('disabled') &&
          item.getAttribute('aria-disabled') !== 'true'
        )
      })
  }

  const focusItem = (index: number) => {
    const items = getItems()
    if (items.length === 0) return

    // Handle wrapping
    if (wrap) {
      index = ((index % items.length) + items.length) % items.length
    } else {
      index = Math.max(0, Math.min(index, items.length - 1))
    }

    currentIndex = index
    items[index]?.focus()
  }

  const handleTypeAhead = (char: string) => {
    if (!enableTypeAhead) return

    // Clear previous timeout
    if (typeAheadTimeout) {
      clearTimeout(typeAheadTimeout)
    }

    // Add character to buffer
    typeAheadBuffer += char.toLowerCase()

    // Find matching item
    const items = getItems()
    const matchIndex = items.findIndex((item) =>
      item.textContent?.toLowerCase().startsWith(typeAheadBuffer)
    )

    if (matchIndex !== -1) {
      focusItem(matchIndex)
    }

    // Clear buffer after delay
    typeAheadTimeout = setTimeout(() => {
      typeAheadBuffer = ''
    }, 500)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    const items = getItems()
    if (items.length === 0) return

    // Update current index based on active element
    const activeIndex = items.findIndex((item) => item === document.activeElement)
    if (activeIndex !== -1) {
      currentIndex = activeIndex
    }

    let handled = false

    if (enableArrowKeys) {
      if (
        (event.key === 'ArrowDown' && (orientation === 'vertical' || orientation === 'both')) ||
        (event.key === 'ArrowRight' && (orientation === 'horizontal' || orientation === 'both'))
      ) {
        focusItem(currentIndex + 1)
        handled = true
      } else if (
        (event.key === 'ArrowUp' && (orientation === 'vertical' || orientation === 'both')) ||
        (event.key === 'ArrowLeft' && (orientation === 'horizontal' || orientation === 'both'))
      ) {
        focusItem(currentIndex - 1)
        handled = true
      }
    }

    if (enableHomeEnd) {
      if (event.key === 'Home') {
        focusItem(0)
        handled = true
      } else if (event.key === 'End') {
        focusItem(items.length - 1)
        handled = true
      }
    }

    if (event.key === 'Enter' || event.key === ' ') {
      if (currentIndex >= 0 && currentIndex < items.length) {
        onSelect?.(items[currentIndex], currentIndex)
        handled = true
      }
    }

    // Type-ahead for printable characters
    if (enableTypeAhead && event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      handleTypeAhead(event.key)
      handled = true
    }

    if (handled) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  container.addEventListener('keydown', handleKeyDown)

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown)
    if (typeAheadTimeout) {
      clearTimeout(typeAheadTimeout)
    }
  }
}

/**
 * Manages roving tabindex for a group of elements
 * Only one element in the group has tabindex="0", others have tabindex="-1"
 *
 * @param container - The container element
 * @param itemSelector - CSS selector for items
 * @param initialIndex - Index of initially tabbable item (default: 0)
 * @returns Object with update and cleanup methods
 */
export function createRovingTabIndex(
  container: HTMLElement,
  itemSelector: string,
  initialIndex = 0
): { update: (index: number) => void; cleanup: () => void } {
  const getItems = () =>
    Array.from(container.querySelectorAll<HTMLElement>(itemSelector))

  const setTabIndex = (index: number) => {
    const items = getItems()
    items.forEach((item, i) => {
      item.setAttribute('tabindex', i === index ? '0' : '-1')
    })
  }

  // Initialize
  setTabIndex(initialIndex)

  const handleFocus = (event: FocusEvent) => {
    const target = event.target as HTMLElement
    const items = getItems()
    const index = items.indexOf(target)
    if (index !== -1) {
      setTabIndex(index)
    }
  }

  container.addEventListener('focusin', handleFocus)

  return {
    update: setTabIndex,
    cleanup: () => {
      container.removeEventListener('focusin', handleFocus)
    },
  }
}

// ============================================================================
// Skip Link Utilities
// ============================================================================

/**
 * Skip link target IDs used in the application
 */
export const SKIP_LINK_TARGETS = {
  MAIN_CONTENT: 'main-content',
  NAVIGATION: 'main-navigation',
  SEARCH: 'search-input',
  FOOTER: 'footer',
} as const

export type SkipLinkTarget = (typeof SKIP_LINK_TARGETS)[keyof typeof SKIP_LINK_TARGETS]

/**
 * Configuration for skip links
 */
export interface SkipLinkConfig {
  id: SkipLinkTarget
  label: string
  shortcut?: string
}

/**
 * Default skip link configurations
 */
export const DEFAULT_SKIP_LINKS: SkipLinkConfig[] = [
  { id: SKIP_LINK_TARGETS.MAIN_CONTENT, label: 'Skip to main content', shortcut: 'Alt+1' },
  { id: SKIP_LINK_TARGETS.NAVIGATION, label: 'Skip to navigation', shortcut: 'Alt+2' },
  { id: SKIP_LINK_TARGETS.SEARCH, label: 'Skip to search', shortcut: 'Alt+3' },
]

/**
 * Scrolls to and focuses a skip link target
 * @param targetId - The ID of the target element
 */
export function skipToTarget(targetId: string): void {
  const target = document.getElementById(targetId)
  if (!target) {
    console.warn(`Skip link target not found: ${targetId}`)
    return
  }

  // Scroll into view
  target.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // Focus the target
  focusElement(target)
}

// ============================================================================
// Screen Reader Utilities
// ============================================================================

/**
 * CSS class name for visually hidden but screen reader accessible content
 */
export const SR_ONLY_CLASS = 'sr-only'

/**
 * Inline styles for visually hidden content (for use without CSS)
 */
export const SR_ONLY_STYLES: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: '0',
}

/**
 * Creates or updates a live region for screen reader announcements
 * @param id - Unique identifier for the live region
 * @param options - Live region options
 * @returns Object with announce and remove methods
 *
 * @example
 * ```typescript
 * const announcer = createLiveRegion('cart-announcer', { politeness: 'polite' })
 * announcer.announce('Item added to cart')
 *
 * // Later:
 * announcer.remove()
 * ```
 */
export function createLiveRegion(
  id: string,
  options: LiveRegionOptions = {}
): { announce: (message: string, clear?: boolean) => void; remove: () => void } {
  const {
    politeness = 'polite',
    atomic = true,
    relevant = ['additions', 'text'],
  } = options

  let element = document.getElementById(id)

  if (!element) {
    element = document.createElement('div')
    element.id = id
    element.setAttribute('role', 'status')
    element.setAttribute('aria-live', politeness)
    element.setAttribute('aria-atomic', atomic.toString())
    element.setAttribute('aria-relevant', relevant.join(' '))
    Object.assign(element.style, SR_ONLY_STYLES)
    document.body.appendChild(element)
  }

  return {
    announce(message: string, clear = true) {
      if (!element) return

      if (clear) {
        element.textContent = ''
        // Force reflow for screen readers
        void element.offsetHeight
      }

      element.textContent = message
    },
    remove() {
      element?.remove()
    },
  }
}

/**
 * Announces a message to screen readers using a temporary live region
 * @param message - The message to announce
 * @param politeness - Politeness level (default: 'polite')
 */
export function announce(
  message: string,
  politeness: 'polite' | 'assertive' = 'polite'
): void {
  const id = `sr-announcement-${Date.now()}`
  const region = createLiveRegion(id, { politeness })

  // Slight delay to ensure screen reader picks up the announcement
  requestAnimationFrame(() => {
    region.announce(message)

    // Remove after announcement (give screen reader time to read)
    setTimeout(() => {
      region.remove()
    }, 3000)
  })
}

// ============================================================================
// ARIA Utilities
// ============================================================================

/**
 * Generates a unique ID for ARIA relationships
 * @param prefix - Optional prefix for the ID
 * @returns A unique ID string
 */
export function generateId(prefix = 'aria'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Sets up ARIA relationship between a control and its description
 * @param control - The control element
 * @param description - The description element or text
 * @returns Cleanup function
 */
export function setupAriaDescribedBy(
  control: HTMLElement,
  description: HTMLElement | string
): () => void {
  const id = generateId('description')

  if (typeof description === 'string') {
    // Create a hidden element for the description
    const descElement = document.createElement('span')
    descElement.id = id
    descElement.textContent = description
    Object.assign(descElement.style, SR_ONLY_STYLES)
    control.parentElement?.appendChild(descElement)

    control.setAttribute('aria-describedby', id)

    return () => {
      control.removeAttribute('aria-describedby')
      descElement.remove()
    }
  } else {
    description.id = id
    control.setAttribute('aria-describedby', id)

    return () => {
      control.removeAttribute('aria-describedby')
    }
  }
}

/**
 * Sets up ARIA labelling for an element
 * @param element - The element to label
 * @param label - The label element or text
 * @returns Cleanup function
 */
export function setupAriaLabel(
  element: HTMLElement,
  label: HTMLElement | string
): () => void {
  if (typeof label === 'string') {
    element.setAttribute('aria-label', label)
    return () => {
      element.removeAttribute('aria-label')
    }
  } else {
    const id = label.id || generateId('label')
    label.id = id
    element.setAttribute('aria-labelledby', id)

    return () => {
      element.removeAttribute('aria-labelledby')
    }
  }
}

// ============================================================================
// Focus Visible Utilities
// ============================================================================

/**
 * Detects if the user is navigating with keyboard (for focus-visible polyfill)
 * @returns Object with current state and cleanup function
 */
export function detectKeyboardUser(): {
  isKeyboardUser: () => boolean
  cleanup: () => void
} {
  let keyboardUser = false

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      keyboardUser = true
      document.body.setAttribute('data-keyboard-user', 'true')
    }
  }

  const handleMouseDown = () => {
    keyboardUser = false
    document.body.removeAttribute('data-keyboard-user')
  }

  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('mousedown', handleMouseDown)

  return {
    isKeyboardUser: () => keyboardUser,
    cleanup: () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    },
  }
}

// ============================================================================
// Reduced Motion Utilities
// ============================================================================

/**
 * Checks if the user prefers reduced motion
 * @returns Boolean indicating user's preference
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Creates a listener for reduced motion preference changes
 * @param callback - Function to call when preference changes
 * @returns Cleanup function
 */
export function onReducedMotionChange(
  callback: (prefersReduced: boolean) => void
): () => void {
  if (typeof window === 'undefined') return () => {}

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

  const handler = (event: MediaQueryListEvent) => {
    callback(event.matches)
  }

  mediaQuery.addEventListener('change', handler)

  // Call immediately with current value
  callback(mediaQuery.matches)

  return () => {
    mediaQuery.removeEventListener('change', handler)
  }
}

// ============================================================================
// Color Contrast Utilities
// ============================================================================

/**
 * Checks if high contrast mode is active
 * @returns Boolean indicating if high contrast is enabled
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(prefers-contrast: more)').matches ||
    window.matchMedia('(-ms-high-contrast: active)').matches
  )
}

/**
 * Creates a listener for high contrast preference changes
 * @param callback - Function to call when preference changes
 * @returns Cleanup function
 */
export function onHighContrastChange(
  callback: (prefersHigh: boolean) => void
): () => void {
  if (typeof window === 'undefined') return () => {}

  const mediaQuery = window.matchMedia('(prefers-contrast: more)')

  const handler = (event: MediaQueryListEvent) => {
    callback(event.matches)
  }

  mediaQuery.addEventListener('change', handler)
  callback(mediaQuery.matches)

  return () => {
    mediaQuery.removeEventListener('change', handler)
  }
}

// ============================================================================
// Form Accessibility Utilities
// ============================================================================

/**
 * Sets up accessible error messaging for a form field
 * @param input - The input element
 * @param errorMessage - The error message
 * @returns Object with show, hide, and cleanup methods
 */
export function setupFieldError(
  input: HTMLElement,
  errorMessage: string
): { show: () => void; hide: () => void; cleanup: () => void } {
  const errorId = generateId('error')
  let errorElement: HTMLElement | null = null

  const show = () => {
    if (!errorElement) {
      errorElement = document.createElement('span')
      errorElement.id = errorId
      errorElement.setAttribute('role', 'alert')
      errorElement.className = 'text-red-600 text-sm mt-1'
      errorElement.textContent = errorMessage
      input.parentElement?.appendChild(errorElement)
    }

    input.setAttribute('aria-invalid', 'true')
    input.setAttribute('aria-describedby', errorId)
  }

  const hide = () => {
    input.setAttribute('aria-invalid', 'false')
    input.removeAttribute('aria-describedby')
    errorElement?.remove()
    errorElement = null
  }

  const cleanup = () => {
    hide()
  }

  return { show, hide, cleanup }
}

// Types are exported inline at their definition above
