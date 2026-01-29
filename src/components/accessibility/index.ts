/**
 * Accessibility Components for UK Grocery Store
 *
 * This module exports all accessibility-related React components following
 * WCAG 2.1 AA guidelines. These components ensure the application is usable
 * by people with disabilities including those using screen readers,
 * keyboard-only navigation, and other assistive technologies.
 */

// Import components explicitly for re-export
import {
  SkipLink as SkipLinkComponent,
  SkipLinks as SkipLinksComponent,
  SkipLinkTarget as SkipLinkTargetComponent,
  SkipLinkProvider as SkipLinkProviderComponent,
  useSkipLinkShortcuts,
  SKIP_LINK_TARGETS,
  DEFAULT_SKIP_LINKS,
} from './skip-link'

// Re-export components with explicit values
export const SkipLink = SkipLinkComponent
export const SkipLinks = SkipLinksComponent
export const SkipLinkTarget = SkipLinkTargetComponent
export const SkipLinkProvider = SkipLinkProviderComponent

// Re-export hooks and constants
export { useSkipLinkShortcuts, SKIP_LINK_TARGETS, DEFAULT_SKIP_LINKS }

// Re-export types
export type {
  SkipLinkProps,
  SkipLinksProps,
  SkipLinkTargetProps,
  SkipLinkProviderProps,
  SkipLinkConfig,
  SkipLinkTargetId,
} from './skip-link'

// Focus Trap Components and Hooks
export {
  FocusTrap,
  useFocusTrap,
  useFocusScope,
  useFocusRestore,
  useFocusWithin,
  createFocusTrap,
  getFocusableElements,
  getFirstFocusable,
  getLastFocusable,
  focusElement,
  FOCUSABLE_SELECTOR,
} from './focus-trap'

export type {
  FocusTrapProps,
  FocusTrapOptions,
} from './focus-trap'
