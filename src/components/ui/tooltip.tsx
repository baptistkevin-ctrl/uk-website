'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils/cn'

type TooltipPosition = 'top' | 'right' | 'bottom' | 'left'

interface TooltipProps {
  /** The content to display in the tooltip */
  content: React.ReactNode
  /** The element that triggers the tooltip */
  children: React.ReactElement
  /** Position of the tooltip relative to the trigger */
  position?: TooltipPosition
  /** Delay in milliseconds before showing the tooltip */
  delay?: number
  /** Additional class name for the tooltip content */
  className?: string
  /** Whether the tooltip is disabled */
  disabled?: boolean
  /** Offset from the trigger element in pixels */
  offset?: number
}

interface TooltipState {
  isVisible: boolean
  coords: { top: number; left: number }
  arrowCoords: { top: number; left: number }
}

const ARROW_SIZE = 6

const getPositionStyles = (
  position: TooltipPosition,
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  offset: number
): { tooltip: { top: number; left: number }; arrow: { top: number; left: number } } => {
  const scrollX = window.scrollX
  const scrollY = window.scrollY

  let tooltipTop = 0
  let tooltipLeft = 0
  let arrowTop = 0
  let arrowLeft = 0

  switch (position) {
    case 'top':
      tooltipTop = triggerRect.top + scrollY - tooltipRect.height - offset - ARROW_SIZE
      tooltipLeft = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2
      arrowTop = tooltipRect.height - 1
      arrowLeft = tooltipRect.width / 2 - ARROW_SIZE
      break
    case 'bottom':
      tooltipTop = triggerRect.bottom + scrollY + offset + ARROW_SIZE
      tooltipLeft = triggerRect.left + scrollX + (triggerRect.width - tooltipRect.width) / 2
      arrowTop = -ARROW_SIZE * 2 + 1
      arrowLeft = tooltipRect.width / 2 - ARROW_SIZE
      break
    case 'left':
      tooltipTop = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2
      tooltipLeft = triggerRect.left + scrollX - tooltipRect.width - offset - ARROW_SIZE
      arrowTop = tooltipRect.height / 2 - ARROW_SIZE
      arrowLeft = tooltipRect.width - 1
      break
    case 'right':
      tooltipTop = triggerRect.top + scrollY + (triggerRect.height - tooltipRect.height) / 2
      tooltipLeft = triggerRect.right + scrollX + offset + ARROW_SIZE
      arrowTop = tooltipRect.height / 2 - ARROW_SIZE
      arrowLeft = -ARROW_SIZE * 2 + 1
      break
  }

  return {
    tooltip: { top: tooltipTop, left: tooltipLeft },
    arrow: { top: arrowTop, left: arrowLeft },
  }
}

const arrowDirectionClasses: Record<TooltipPosition, string> = {
  top: 'border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
  bottom: 'border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
  left: 'border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
  right: 'border-t-transparent border-b-transparent border-l-transparent border-r-gray-900',
}

export const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      children,
      position = 'top',
      delay = 200,
      className,
      disabled = false,
      offset = 4,
    },
    ref
  ) => {
    const [state, setState] = React.useState<TooltipState>({
      isVisible: false,
      coords: { top: 0, left: 0 },
      arrowCoords: { top: 0, left: 0 },
    })
    const [isMounted, setIsMounted] = React.useState(false)

    const triggerRef = React.useRef<HTMLElement>(null)
    const tooltipRef = React.useRef<HTMLDivElement>(null)
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const tooltipId = React.useId()

    React.useEffect(() => {
      setIsMounted(true)
      return () => setIsMounted(false)
    }, [])

    const updatePosition = React.useCallback(() => {
      if (!triggerRef.current || !tooltipRef.current) return

      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()

      const { tooltip, arrow } = getPositionStyles(
        position,
        triggerRect,
        tooltipRect,
        offset
      )

      setState((prev) => ({
        ...prev,
        coords: tooltip,
        arrowCoords: arrow,
      }))
    }, [position, offset])

    const showTooltip = React.useCallback(() => {
      if (disabled) return

      timeoutRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, isVisible: true }))
      }, delay)
    }, [delay, disabled])

    const hideTooltip = React.useCallback(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      setState((prev) => ({ ...prev, isVisible: false }))
    }, [])

    React.useEffect(() => {
      if (state.isVisible) {
        // Use requestAnimationFrame to ensure tooltip is rendered before measuring
        requestAnimationFrame(() => {
          updatePosition()
        })
      }
    }, [state.isVisible, updatePosition])

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }, [])

    // Clone the child element to attach event handlers and ref
    const childProps = children.props as any
    const trigger = React.cloneElement(children, {
      ref: triggerRef,
      onMouseEnter: (e: React.MouseEvent) => {
        showTooltip()
        childProps.onMouseEnter?.(e)
      },
      onMouseLeave: (e: React.MouseEvent) => {
        hideTooltip()
        childProps.onMouseLeave?.(e)
      },
      onFocus: (e: React.FocusEvent) => {
        showTooltip()
        childProps.onFocus?.(e)
      },
      onBlur: (e: React.FocusEvent) => {
        hideTooltip()
        childProps.onBlur?.(e)
      },
      'aria-describedby': state.isVisible ? tooltipId : undefined,
    } as any)

    const tooltipContent = (
      <div
        ref={(node) => {
          tooltipRef.current = node
          if (typeof ref === 'function') {
            ref(node)
          } else if (ref) {
            ref.current = node
          }
        }}
        id={tooltipId}
        role="tooltip"
        className={cn(
          'fixed z-[9999] px-3 py-1.5 text-sm font-medium text-white bg-gray-900 rounded-md shadow-lg',
          'transition-opacity duration-150 ease-in-out',
          state.isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
          className
        )}
        style={{
          top: state.coords.top,
          left: state.coords.left,
        }}
      >
        {content}
        {/* Arrow */}
        <span
          className={cn(
            'absolute w-0 h-0 border-solid',
            arrowDirectionClasses[position]
          )}
          style={{
            top: state.arrowCoords.top,
            left: state.arrowCoords.left,
            borderWidth: ARROW_SIZE,
          }}
          aria-hidden="true"
        />
      </div>
    )

    return (
      <>
        {trigger}
        {isMounted && state.isVisible && createPortal(tooltipContent, document.body)}
      </>
    )
  }
)

Tooltip.displayName = 'Tooltip'

// TooltipProvider for context-based tooltip configuration
interface TooltipContextValue {
  delay: number
  disabled: boolean
}

const TooltipContext = React.createContext<TooltipContextValue>({
  delay: 200,
  disabled: false,
})

interface TooltipProviderProps {
  children: React.ReactNode
  delay?: number
  disabled?: boolean
}

export function TooltipProvider({
  children,
  delay = 200,
  disabled = false,
}: TooltipProviderProps) {
  const value = React.useMemo(
    () => ({ delay, disabled }),
    [delay, disabled]
  )

  return (
    <TooltipContext.Provider value={value}>
      {children}
    </TooltipContext.Provider>
  )
}

export function useTooltipContext() {
  return React.useContext(TooltipContext)
}

export { type TooltipPosition, type TooltipProps }
