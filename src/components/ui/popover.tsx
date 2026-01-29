'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'

type PopoverPosition = 'top' | 'right' | 'bottom' | 'left'
type PopoverAlign = 'start' | 'center' | 'end'

interface PopoverProps {
  /** The content to display in the popover */
  children: React.ReactNode
  /** Whether the popover is open (controlled mode) */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Initial open state (uncontrolled mode) */
  defaultOpen?: boolean
}

interface PopoverTriggerProps {
  children: React.ReactElement
  asChild?: boolean
}

interface PopoverContentProps {
  children: React.ReactNode
  /** Position of the popover relative to the trigger */
  position?: PopoverPosition
  /** Alignment of the popover */
  align?: PopoverAlign
  /** Offset from the trigger element in pixels */
  sideOffset?: number
  /** Additional class name */
  className?: string
  /** Whether to show the arrow */
  showArrow?: boolean
  /** Callback when escape key is pressed */
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  /** Callback when clicking outside the popover */
  onPointerDownOutside?: (event: PointerEvent) => void
}

interface PopoverContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
  contentId: string
}

const PopoverContext = React.createContext<PopoverContextValue | null>(null)

function usePopoverContext() {
  const context = React.useContext(PopoverContext)
  if (!context) {
    throw new Error('Popover components must be used within a Popover')
  }
  return context
}

const ARROW_SIZE = 8

const getPositionStyles = (
  position: PopoverPosition,
  align: PopoverAlign,
  triggerRect: DOMRect,
  contentRect: DOMRect,
  sideOffset: number
): { content: { top: number; left: number }; arrow: { top: number; left: number } } => {
  const scrollX = window.scrollX
  const scrollY = window.scrollY

  let contentTop = 0
  let contentLeft = 0
  let arrowTop = 0
  let arrowLeft = 0

  // Calculate base position
  switch (position) {
    case 'top':
      contentTop = triggerRect.top + scrollY - contentRect.height - sideOffset - ARROW_SIZE
      arrowTop = contentRect.height - 1
      break
    case 'bottom':
      contentTop = triggerRect.bottom + scrollY + sideOffset + ARROW_SIZE
      arrowTop = -ARROW_SIZE * 2 + 1
      break
    case 'left':
      contentLeft = triggerRect.left + scrollX - contentRect.width - sideOffset - ARROW_SIZE
      arrowLeft = contentRect.width - 1
      break
    case 'right':
      contentLeft = triggerRect.right + scrollX + sideOffset + ARROW_SIZE
      arrowLeft = -ARROW_SIZE * 2 + 1
      break
  }

  // Calculate alignment for top/bottom positions
  if (position === 'top' || position === 'bottom') {
    switch (align) {
      case 'start':
        contentLeft = triggerRect.left + scrollX
        arrowLeft = Math.min(triggerRect.width / 2, contentRect.width / 2) - ARROW_SIZE
        break
      case 'center':
        contentLeft = triggerRect.left + scrollX + (triggerRect.width - contentRect.width) / 2
        arrowLeft = contentRect.width / 2 - ARROW_SIZE
        break
      case 'end':
        contentLeft = triggerRect.right + scrollX - contentRect.width
        arrowLeft = contentRect.width - Math.min(triggerRect.width / 2, contentRect.width / 2) - ARROW_SIZE
        break
    }
  }

  // Calculate alignment for left/right positions
  if (position === 'left' || position === 'right') {
    switch (align) {
      case 'start':
        contentTop = triggerRect.top + scrollY
        arrowTop = Math.min(triggerRect.height / 2, contentRect.height / 2) - ARROW_SIZE
        break
      case 'center':
        contentTop = triggerRect.top + scrollY + (triggerRect.height - contentRect.height) / 2
        arrowTop = contentRect.height / 2 - ARROW_SIZE
        break
      case 'end':
        contentTop = triggerRect.bottom + scrollY - contentRect.height
        arrowTop = contentRect.height - Math.min(triggerRect.height / 2, contentRect.height / 2) - ARROW_SIZE
        break
    }
  }

  return {
    content: { top: contentTop, left: contentLeft },
    arrow: { top: arrowTop, left: arrowLeft },
  }
}

const arrowDirectionClasses: Record<PopoverPosition, string> = {
  top: 'border-l-transparent border-r-transparent border-b-transparent border-t-white',
  bottom: 'border-l-transparent border-r-transparent border-t-transparent border-b-white',
  left: 'border-t-transparent border-b-transparent border-r-transparent border-l-white',
  right: 'border-t-transparent border-b-transparent border-l-transparent border-r-white',
}

export function Popover({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  defaultOpen = false,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const triggerRef = React.useRef<HTMLElement>(null)
  const contentId = React.useId()

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const onOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(newOpen)
      }
      controlledOnOpenChange?.(newOpen)
    },
    [isControlled, controlledOnOpenChange]
  )

  const value = React.useMemo(
    () => ({
      open,
      onOpenChange,
      triggerRef,
      contentId,
    }),
    [open, onOpenChange, contentId]
  )

  return (
    <PopoverContext.Provider value={value}>
      {children}
    </PopoverContext.Provider>
  )
}

export function PopoverTrigger({ children, asChild = true }: PopoverTriggerProps) {
  const { open, onOpenChange, triggerRef, contentId } = usePopoverContext()

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      onOpenChange(!open)
    },
    [open, onOpenChange]
  )

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onOpenChange(!open)
      }
    },
    [open, onOpenChange]
  )

  if (asChild) {
    const childProps = children.props as any
    return React.cloneElement(children, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent) => {
        handleClick(e)
        childProps.onClick?.(e)
      },
      onKeyDown: (e: React.KeyboardEvent) => {
        handleKeyDown(e)
        childProps.onKeyDown?.(e)
      },
      'aria-expanded': open,
      'aria-haspopup': 'dialog',
      'aria-controls': open ? contentId : undefined,
    } as any)
  }

  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls={open ? contentId : undefined}
    >
      {children}
    </button>
  )
}

export function PopoverContent({
  children,
  position = 'bottom',
  align = 'center',
  sideOffset = 4,
  className,
  showArrow = true,
  onEscapeKeyDown,
  onPointerDownOutside,
}: PopoverContentProps) {
  const { open, onOpenChange, triggerRef, contentId } = usePopoverContext()
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = React.useState(false)
  const [coords, setCoords] = React.useState({ top: 0, left: 0 })
  const [arrowCoords, setArrowCoords] = React.useState({ top: 0, left: 0 })
  const [isPositioned, setIsPositioned] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  // Update position when open changes
  const updatePosition = React.useCallback(() => {
    if (!triggerRef.current || !contentRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const contentRect = contentRef.current.getBoundingClientRect()

    const { content, arrow } = getPositionStyles(
      position,
      align,
      triggerRect,
      contentRect,
      sideOffset
    )

    setCoords(content)
    setArrowCoords(arrow)
    setIsPositioned(true)
  }, [position, align, sideOffset, triggerRef])

  React.useEffect(() => {
    if (open) {
      setIsPositioned(false)
      requestAnimationFrame(() => {
        updatePosition()
      })
    }
  }, [open, updatePosition])

  // Handle escape key
  React.useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscapeKeyDown?.(event)
        if (!event.defaultPrevented) {
          onOpenChange(false)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange, onEscapeKeyDown])

  // Handle click outside
  React.useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      const isInsideContent = contentRef.current?.contains(target)
      const isInsideTrigger = triggerRef.current?.contains(target)

      if (!isInsideContent && !isInsideTrigger) {
        onPointerDownOutside?.(event)
        if (!event.defaultPrevented) {
          onOpenChange(false)
        }
      }
    }

    // Use setTimeout to avoid closing immediately when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('pointerdown', handlePointerDown)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [open, onOpenChange, triggerRef, onPointerDownOutside])

  // Focus management
  React.useEffect(() => {
    if (!open || !contentRef.current) return

    // Store the element that was focused before opening
    const previouslyFocused = document.activeElement as HTMLElement

    // Focus the first focusable element inside the popover
    const focusableElements = contentRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstFocusable = focusableElements[0]

    if (firstFocusable) {
      requestAnimationFrame(() => {
        firstFocusable.focus()
      })
    }

    return () => {
      // Restore focus when closing
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus()
      }
    }
  }, [open])

  // Focus trap
  React.useEffect(() => {
    if (!open || !contentRef.current) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = contentRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (!focusableElements || focusableElements.length === 0) return

      const firstFocusable = focusableElements[0]
      const lastFocusable = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === firstFocusable) {
          event.preventDefault()
          lastFocusable.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          event.preventDefault()
          firstFocusable.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  if (!isMounted || !open) return null

  const content = (
    <div
      ref={contentRef}
      id={contentId}
      role="dialog"
      aria-modal="true"
      className={cn(
        'fixed z-50 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg',
        'transition-all duration-150 ease-in-out',
        'outline-none',
        isPositioned ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        className
      )}
      style={{
        top: coords.top,
        left: coords.left,
      }}
    >
      {children}
      {/* Arrow */}
      {showArrow && (
        <span
          className={cn(
            'absolute w-0 h-0 border-solid',
            arrowDirectionClasses[position]
          )}
          style={{
            top: arrowCoords.top,
            left: arrowCoords.left,
            borderWidth: ARROW_SIZE,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  )

  return createPortal(content, document.body)
}

// Additional compound components for structured content
interface PopoverHeaderProps {
  children: React.ReactNode
  className?: string
}

export function PopoverHeader({ children, className }: PopoverHeaderProps) {
  return (
    <div className={cn('mb-2 font-semibold text-gray-900', className)}>
      {children}
    </div>
  )
}

interface PopoverDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function PopoverDescription({ children, className }: PopoverDescriptionProps) {
  return (
    <p className={cn('text-sm text-gray-600', className)}>
      {children}
    </p>
  )
}

interface PopoverFooterProps {
  children: React.ReactNode
  className?: string
}

export function PopoverFooter({ children, className }: PopoverFooterProps) {
  return (
    <div className={cn('mt-4 flex justify-end gap-2', className)}>
      {children}
    </div>
  )
}

interface PopoverCloseProps {
  children: React.ReactElement
  asChild?: boolean
}

export function PopoverClose({ children, asChild = true }: PopoverCloseProps) {
  const { onOpenChange } = usePopoverContext()

  const handleClick = React.useCallback(() => {
    onOpenChange(false)
  }, [onOpenChange])

  if (asChild) {
    const childProps = children.props as any
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        handleClick()
        childProps.onClick?.(e)
      },
    } as any)
  }

  return (
    <button onClick={handleClick}>
      {children}
    </button>
  )
}

export { type PopoverPosition, type PopoverAlign, type PopoverProps, type PopoverContentProps }
