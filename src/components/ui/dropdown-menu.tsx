'use client'

import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { Check, ChevronRight, Circle, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ============================================================================
// Root Components
// ============================================================================

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger> & {
    variant?: 'default' | 'outline' | 'ghost' | 'subtle'
  }
>(({ className, variant = 'default', children, ...props }, ref) => {
  const variantStyles = {
    default:
      'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    outline:
      'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    ghost:
      'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    subtle:
      'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500',
  }

  return (
    <DropdownMenuPrimitive.Trigger
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium',
        'transition-all duration-200 ease-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=open]:ring-2 data-[state=open]:ring-offset-2',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Trigger>
  )
})
DropdownMenuTrigger.displayName = DropdownMenuPrimitive.Trigger.displayName

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

// ============================================================================
// Content Components
// ============================================================================

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
    showArrow?: boolean
  }
>(({ className, sideOffset = 8, showArrow = false, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        // Base styles
        'z-50 min-w-[12rem] overflow-hidden rounded-lg border border-gray-200 bg-white p-1.5 text-gray-950 shadow-xl',
        // Dark mode support
        'dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50',
        // Animation - enter
        'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
        // Animation - exit
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        // Slide animations based on side
        'data-[side=bottom]:slide-in-from-top-2',
        'data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2',
        'data-[side=top]:slide-in-from-bottom-2',
        // Custom transition
        'duration-200 ease-out',
        className
      )}
      {...props}
    >
      {showArrow && (
        <DropdownMenuPrimitive.Arrow className="fill-white stroke-gray-200 dark:fill-gray-900 dark:stroke-gray-800" />
      )}
      {children}
    </DropdownMenuPrimitive.Content>
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      // Base styles
      'z-50 min-w-[10rem] overflow-hidden rounded-lg border border-gray-200 bg-white p-1.5 text-gray-950 shadow-xl',
      // Dark mode
      'dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50',
      // Animation - enter
      'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
      // Animation - exit
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
      // Slide animations
      'data-[side=bottom]:slide-in-from-top-2',
      'data-[side=left]:slide-in-from-right-2',
      'data-[side=right]:slide-in-from-left-2',
      'data-[side=top]:slide-in-from-bottom-2',
      // Transition
      'duration-150 ease-out',
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

// ============================================================================
// Item Components
// ============================================================================

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
    icon?: LucideIcon
    shortcut?: string
    destructive?: boolean
  }
>(({ className, inset, icon: Icon, shortcut, destructive, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      // Base styles
      'group relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none',
      // Transitions
      'transition-colors duration-150 ease-out',
      // Focus/hover states
      'focus:bg-gray-100 focus:text-gray-900',
      'dark:focus:bg-gray-800 dark:focus:text-gray-50',
      // Destructive variant
      destructive && 'text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950 dark:focus:text-red-300',
      // Disabled state
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      // Highlighted state (keyboard navigation)
      'data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900',
      'dark:data-[highlighted]:bg-gray-800 dark:data-[highlighted]:text-gray-50',
      // Inset padding for alignment with checkbox/radio items
      inset && 'pl-9',
      className
    )}
    {...props}
  >
    {Icon && (
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 text-gray-500 transition-colors',
          'group-focus:text-gray-700 dark:text-gray-400 dark:group-focus:text-gray-300',
          destructive && 'text-red-500 group-focus:text-red-600 dark:text-red-400 dark:group-focus:text-red-300'
        )}
      />
    )}
    <span className="flex-1">{children}</span>
    {shortcut && (
      <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut>
    )}
  </DropdownMenuPrimitive.Item>
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
    icon?: LucideIcon
  }
>(({ className, inset, icon: Icon, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      // Base styles
      'group flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none',
      // Transitions
      'transition-colors duration-150 ease-out',
      // Focus/hover states
      'focus:bg-gray-100 focus:text-gray-900',
      'dark:focus:bg-gray-800 dark:focus:text-gray-50',
      // Open state
      'data-[state=open]:bg-gray-100 dark:data-[state=open]:bg-gray-800',
      // Highlighted state
      'data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900',
      'dark:data-[highlighted]:bg-gray-800 dark:data-[highlighted]:text-gray-50',
      // Inset
      inset && 'pl-9',
      className
    )}
    {...props}
  >
    {Icon && (
      <Icon className="h-4 w-4 shrink-0 text-gray-500 group-focus:text-gray-700 dark:text-gray-400 dark:group-focus:text-gray-300" />
    )}
    <span className="flex-1">{children}</span>
    <ChevronRight className="h-4 w-4 text-gray-400 transition-transform duration-200 group-data-[state=open]:rotate-90" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

// ============================================================================
// Checkbox and Radio Items
// ============================================================================

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      // Base styles
      'group relative flex cursor-pointer select-none items-center gap-2 rounded-md py-2 pl-9 pr-2.5 text-sm outline-none',
      // Transitions
      'transition-colors duration-150 ease-out',
      // Focus/hover states
      'focus:bg-gray-100 focus:text-gray-900',
      'dark:focus:bg-gray-800 dark:focus:text-gray-50',
      // Disabled state
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      // Highlighted state
      'data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900',
      'dark:data-[highlighted]:bg-gray-800 dark:data-[highlighted]:text-gray-50',
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator className="animate-in zoom-in-50 duration-150">
        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    <span className="flex-1">{children}</span>
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      // Base styles
      'group relative flex cursor-pointer select-none items-center gap-2 rounded-md py-2 pl-9 pr-2.5 text-sm outline-none',
      // Transitions
      'transition-colors duration-150 ease-out',
      // Focus/hover states
      'focus:bg-gray-100 focus:text-gray-900',
      'dark:focus:bg-gray-800 dark:focus:text-gray-50',
      // Disabled state
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      // Highlighted state
      'data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900',
      'dark:data-[highlighted]:bg-gray-800 dark:data-[highlighted]:text-gray-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator className="animate-in zoom-in-50 duration-150">
        <Circle className="h-2.5 w-2.5 fill-green-600 text-green-600 dark:fill-green-400 dark:text-green-400" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    <span className="flex-1">{children}</span>
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

// ============================================================================
// Label, Separator, and Shortcut Components
// ============================================================================

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400',
      inset && 'pl-9',
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('-mx-1.5 my-1.5 h-px bg-gray-200 dark:bg-gray-700', className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        'ml-auto text-xs tracking-wide text-gray-400 dark:text-gray-500',
        'rounded bg-gray-100 px-1.5 py-0.5 font-mono',
        'dark:bg-gray-800',
        className
      )}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut'

// ============================================================================
// Enhanced Components - IconMenuItem with description
// ============================================================================

interface DropdownMenuIconItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  icon: LucideIcon
  label: string
  description?: string
  shortcut?: string
  destructive?: boolean
}

const DropdownMenuIconItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownMenuIconItemProps
>(({ className, icon: Icon, label, description, shortcut, destructive, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      // Base styles
      'group relative flex cursor-pointer select-none items-start gap-3 rounded-md px-2.5 py-2.5 text-sm outline-none',
      // Transitions
      'transition-colors duration-150 ease-out',
      // Focus/hover states
      'focus:bg-gray-100 dark:focus:bg-gray-800',
      // Destructive variant
      destructive && 'focus:bg-red-50 dark:focus:bg-red-950',
      // Disabled state
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <div
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-100 transition-colors',
        'group-focus:bg-gray-200 dark:bg-gray-800 dark:group-focus:bg-gray-700',
        destructive && 'bg-red-100 group-focus:bg-red-200 dark:bg-red-900 dark:group-focus:bg-red-800'
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 text-gray-600 dark:text-gray-300',
          destructive && 'text-red-600 dark:text-red-400'
        )}
      />
    </div>
    <div className="flex flex-1 flex-col gap-0.5">
      <span
        className={cn(
          'font-medium text-gray-900 dark:text-gray-50',
          destructive && 'text-red-600 dark:text-red-400'
        )}
      >
        {label}
      </span>
      {description && (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </span>
      )}
    </div>
    {shortcut && (
      <DropdownMenuShortcut className="self-center">{shortcut}</DropdownMenuShortcut>
    )}
  </DropdownMenuPrimitive.Item>
))
DropdownMenuIconItem.displayName = 'DropdownMenuIconItem'

// ============================================================================
// Header Component for menu sections
// ============================================================================

interface DropdownMenuHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon
  title: string
  subtitle?: string
}

const DropdownMenuHeader = React.forwardRef<HTMLDivElement, DropdownMenuHeaderProps>(
  ({ className, icon: Icon, title, subtitle, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-3 border-b border-gray-200 px-3 py-3 dark:border-gray-700',
        className
      )}
      {...props}
    >
      {Icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </div>
      )}
      <div className="flex flex-col">
        <span className="font-semibold text-gray-900 dark:text-gray-50">{title}</span>
        {subtitle && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</span>
        )}
      </div>
    </div>
  )
)
DropdownMenuHeader.displayName = 'DropdownMenuHeader'

// ============================================================================
// Footer Component for action buttons
// ============================================================================

const DropdownMenuFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-end gap-2 border-t border-gray-200 px-3 py-2 dark:border-gray-700',
      className
    )}
    {...props}
  >
    {children}
  </div>
))
DropdownMenuFooter.displayName = 'DropdownMenuFooter'

// ============================================================================
// Custom Hook for keyboard shortcuts
// ============================================================================

export function useDropdownMenuShortcut(
  key: string,
  callback: () => void,
  modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean } = {}
) {
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const matchesModifiers =
        (!modifiers.ctrl || event.ctrlKey) &&
        (!modifiers.shift || event.shiftKey) &&
        (!modifiers.alt || event.altKey) &&
        (!modifiers.meta || event.metaKey)

      if (event.key.toLowerCase() === key.toLowerCase() && matchesModifiers) {
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [key, callback, modifiers])
}

// ============================================================================
// Exports
// ============================================================================

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  // Enhanced components
  DropdownMenuIconItem,
  DropdownMenuHeader,
  DropdownMenuFooter,
}
