'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp, Search, X, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// ============================================================================
// Base Select Components (Radix UI based)
// ============================================================================

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    variant?: 'default' | 'outline' | 'ghost'
    size?: 'sm' | 'default' | 'lg'
  }
>(({ className, children, variant = 'default', size = 'default', ...props }, ref) => {
  const sizeStyles = {
    sm: 'h-8 px-2.5 text-xs',
    default: 'h-10 px-3 text-sm',
    lg: 'h-12 px-4 text-base',
  }

  const variantStyles = {
    default:
      'border-gray-300 bg-white hover:border-gray-400 focus:border-green-500 focus:ring-green-500',
    outline:
      'border-gray-300 bg-transparent hover:bg-gray-50 focus:border-green-500 focus:ring-green-500',
    ghost:
      'border-transparent bg-transparent hover:bg-gray-100 focus:bg-gray-100 focus:ring-gray-500',
  }

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        // Base styles
        'flex w-full items-center justify-between gap-2 rounded-lg border',
        // Ring styles
        'ring-offset-white focus:outline-none focus:ring-2 focus:ring-offset-2',
        // Transitions
        'transition-all duration-200 ease-out',
        // Placeholder and text styles
        'placeholder:text-gray-400 [&>span]:line-clamp-1 [&>span]:text-left',
        // Disabled state
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-gray-300',
        // Dark mode
        'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50',
        'dark:focus:border-green-500 dark:focus:ring-green-500/30',
        // Open state
        'data-[state=open]:border-green-500 data-[state=open]:ring-2 data-[state=open]:ring-green-500/20',
        // Size and variant
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 data-[state=open]:rotate-180" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1.5',
      'bg-gradient-to-b from-white to-transparent dark:from-gray-900',
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4 text-gray-500" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1.5',
      'bg-gradient-to-t from-white to-transparent dark:from-gray-900',
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4 text-gray-500" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        // Base styles
        'relative z-50 max-h-[320px] min-w-[8rem] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl',
        // Dark mode
        'dark:border-gray-700 dark:bg-gray-900',
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
        'duration-200 ease-out',
        // Popper position adjustments
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1.5',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      'px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400',
      className
    )}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    icon?: LucideIcon
    description?: string
  }
>(({ className, children, icon: Icon, description, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      // Base styles
      'relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-9 pr-2.5 text-sm outline-none',
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
      <SelectPrimitive.ItemIndicator className="animate-in zoom-in-50 duration-150">
        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <div className="flex items-center gap-2.5">
      {Icon && <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
      <div className="flex flex-col">
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        {description && (
          <span className="text-xs text-gray-500 dark:text-gray-400">{description}</span>
        )}
      </div>
    </div>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1.5 my-1.5 h-px bg-gray-200 dark:bg-gray-700', className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

// ============================================================================
// Searchable Select Component
// ============================================================================

interface SearchableSelectOption {
  value: string
  label: string
  description?: string
  icon?: LucideIcon
  disabled?: boolean
  group?: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  size?: 'sm' | 'default' | 'lg'
}

const SearchableSelect = React.forwardRef<HTMLDivElement, SearchableSelectProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = 'Select an option...',
      searchPlaceholder = 'Search...',
      emptyText = 'No results found.',
      disabled = false,
      className,
      size = 'default',
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const [highlightedIndex, setHighlightedIndex] = React.useState(0)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const listRef = React.useRef<HTMLDivElement>(null)

    const filteredOptions = React.useMemo(() => {
      if (!search) return options
      const searchLower = search.toLowerCase()
      return options.filter(
        (option) =>
          option.label.toLowerCase().includes(searchLower) ||
          option.description?.toLowerCase().includes(searchLower)
      )
    }, [options, search])

    const selectedOption = options.find((opt) => opt.value === value)

    // Group options
    const groupedOptions = React.useMemo(() => {
      const groups: Record<string, SearchableSelectOption[]> = {}
      filteredOptions.forEach((option) => {
        const groupName = option.group || ''
        if (!groups[groupName]) groups[groupName] = []
        groups[groupName].push(option)
      })
      return groups
    }, [filteredOptions])

    const handleSelect = (optionValue: string) => {
      onValueChange?.(optionValue)
      setOpen(false)
      setSearch('')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault()
          setOpen(true)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
          break
        case 'Enter':
          e.preventDefault()
          if (filteredOptions[highlightedIndex] && !filteredOptions[highlightedIndex].disabled) {
            handleSelect(filteredOptions[highlightedIndex].value)
          }
          break
        case 'Escape':
          e.preventDefault()
          setOpen(false)
          setSearch('')
          break
        case 'Home':
          e.preventDefault()
          setHighlightedIndex(0)
          break
        case 'End':
          e.preventDefault()
          setHighlightedIndex(filteredOptions.length - 1)
          break
      }
    }

    // Scroll highlighted option into view
    React.useEffect(() => {
      if (open && listRef.current) {
        const highlightedElement = listRef.current.querySelector(
          `[data-index="${highlightedIndex}"]`
        )
        highlightedElement?.scrollIntoView({ block: 'nearest' })
      }
    }, [highlightedIndex, open])

    // Focus input when opening
    React.useEffect(() => {
      if (open && inputRef.current) {
        inputRef.current.focus()
      }
    }, [open])

    // Reset highlighted index when search changes
    React.useEffect(() => {
      setHighlightedIndex(0)
    }, [search])

    const sizeStyles = {
      sm: 'h-8 px-2.5 text-xs',
      default: 'h-10 px-3 text-sm',
      lg: 'h-12 px-4 text-base',
    }

    return (
      <div ref={ref} className={cn('relative', className)}>
        {/* Trigger */}
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls="searchable-select-listbox"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          onKeyDown={handleKeyDown}
          className={cn(
            // Base styles
            'flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white',
            // Ring styles
            'ring-offset-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
            // Transitions
            'transition-all duration-200 ease-out',
            // Hover state
            'hover:border-gray-400',
            // Disabled state
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Dark mode
            'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50',
            // Open state
            open && 'border-green-500 ring-2 ring-green-500/20',
            sizeStyles[size]
          )}
        >
          <span className={cn('truncate', !selectedOption && 'text-gray-400')}>
            {selectedOption ? (
              <span className="flex items-center gap-2">
                {selectedOption.icon && (
                  <selectedOption.icon className="h-4 w-4 text-gray-500" />
                )}
                {selectedOption.label}
              </span>
            ) : (
              placeholder
            )}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setOpen(false)
                setSearch('')
              }}
            />

            {/* Content */}
            <div
              className={cn(
                'absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl',
                'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200',
                'dark:border-gray-700 dark:bg-gray-900'
              )}
            >
              {/* Search Input */}
              <div className="border-b border-gray-200 p-2 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={searchPlaceholder}
                    className={cn(
                      'w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-8 text-sm outline-none',
                      'placeholder:text-gray-400',
                      'focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-500/20',
                      'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50',
                      'dark:placeholder:text-gray-500 dark:focus:bg-gray-900'
                    )}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Options List */}
              <div
                ref={listRef}
                role="listbox"
                id="searchable-select-listbox"
                aria-activedescendant={
                  filteredOptions[highlightedIndex]
                    ? `option-${filteredOptions[highlightedIndex].value}`
                    : undefined
                }
                className="max-h-[240px] overflow-y-auto p-1.5"
              >
                {filteredOptions.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    {emptyText}
                  </div>
                ) : (
                  Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
                    <div key={groupName || 'ungrouped'}>
                      {groupName && (
                        <div className="px-2.5 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          {groupName}
                        </div>
                      )}
                      {groupOptions.map((option) => {
                        const index = filteredOptions.indexOf(option)
                        const Icon = option.icon
                        return (
                          <div
                            key={option.value}
                            id={`option-${option.value}`}
                            role="option"
                            aria-selected={value === option.value}
                            aria-disabled={option.disabled}
                            data-index={index}
                            onClick={() => !option.disabled && handleSelect(option.value)}
                            className={cn(
                              'relative flex cursor-pointer select-none items-center gap-2.5 rounded-md py-2 pl-9 pr-2.5 text-sm',
                              'transition-colors duration-150',
                              index === highlightedIndex && 'bg-gray-100 dark:bg-gray-800',
                              value === option.value && 'text-green-600 dark:text-green-400',
                              option.disabled && 'pointer-events-none opacity-50'
                            )}
                          >
                            {value === option.value && (
                              <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
                                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                              </span>
                            )}
                            {Icon && <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
                            <div className="flex flex-col">
                              <span>{option.label}</span>
                              {option.description && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {option.description}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }
)
SearchableSelect.displayName = 'SearchableSelect'

// ============================================================================
// Multi-Select Component
// ============================================================================

interface MultiSelectProps {
  options: SearchableSelectOption[]
  value?: string[]
  onValueChange?: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  size?: 'sm' | 'default' | 'lg'
  maxItems?: number
  maxDisplayedItems?: number
}

const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  (
    {
      options,
      value = [],
      onValueChange,
      placeholder = 'Select options...',
      searchPlaceholder = 'Search...',
      emptyText = 'No results found.',
      disabled = false,
      className,
      size = 'default',
      maxItems,
      maxDisplayedItems = 3,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const [highlightedIndex, setHighlightedIndex] = React.useState(0)
    const inputRef = React.useRef<HTMLInputElement>(null)
    const listRef = React.useRef<HTMLDivElement>(null)

    const filteredOptions = React.useMemo(() => {
      if (!search) return options
      const searchLower = search.toLowerCase()
      return options.filter(
        (option) =>
          option.label.toLowerCase().includes(searchLower) ||
          option.description?.toLowerCase().includes(searchLower)
      )
    }, [options, search])

    const selectedOptions = options.filter((opt) => value.includes(opt.value))

    const handleToggle = (optionValue: string) => {
      const isSelected = value.includes(optionValue)
      let newValue: string[]

      if (isSelected) {
        newValue = value.filter((v) => v !== optionValue)
      } else {
        if (maxItems && value.length >= maxItems) return
        newValue = [...value, optionValue]
      }

      onValueChange?.(newValue)
    }

    const handleRemove = (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation()
      onValueChange?.(value.filter((v) => v !== optionValue))
    }

    const handleClearAll = (e: React.MouseEvent) => {
      e.stopPropagation()
      onValueChange?.([])
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault()
          setOpen(true)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev))
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (filteredOptions[highlightedIndex] && !filteredOptions[highlightedIndex].disabled) {
            handleToggle(filteredOptions[highlightedIndex].value)
          }
          break
        case 'Escape':
          e.preventDefault()
          setOpen(false)
          setSearch('')
          break
        case 'Backspace':
          if (!search && value.length > 0) {
            e.preventDefault()
            onValueChange?.(value.slice(0, -1))
          }
          break
      }
    }

    // Scroll highlighted option into view
    React.useEffect(() => {
      if (open && listRef.current) {
        const highlightedElement = listRef.current.querySelector(
          `[data-index="${highlightedIndex}"]`
        )
        highlightedElement?.scrollIntoView({ block: 'nearest' })
      }
    }, [highlightedIndex, open])

    // Focus input when opening
    React.useEffect(() => {
      if (open && inputRef.current) {
        inputRef.current.focus()
      }
    }, [open])

    // Reset highlighted index when search changes
    React.useEffect(() => {
      setHighlightedIndex(0)
    }, [search])

    const sizeStyles = {
      sm: 'min-h-[2rem] px-2 py-1 text-xs',
      default: 'min-h-[2.5rem] px-2.5 py-1.5 text-sm',
      lg: 'min-h-[3rem] px-3 py-2 text-base',
    }

    const badgeSizeStyles = {
      sm: 'px-1.5 py-0 text-[10px]',
      default: 'px-2 py-0.5 text-xs',
      lg: 'px-2.5 py-1 text-sm',
    }

    return (
      <div ref={ref} className={cn('relative', className)}>
        {/* Trigger */}
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          onKeyDown={handleKeyDown}
          className={cn(
            // Base styles
            'flex w-full flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 bg-white',
            // Ring styles
            'ring-offset-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
            // Transitions
            'transition-all duration-200 ease-out',
            // Hover state
            'hover:border-gray-400',
            // Disabled state
            'disabled:cursor-not-allowed disabled:opacity-50',
            // Dark mode
            'dark:border-gray-700 dark:bg-gray-900 dark:text-gray-50',
            // Open state
            open && 'border-green-500 ring-2 ring-green-500/20',
            sizeStyles[size]
          )}
        >
          {selectedOptions.length === 0 ? (
            <span className="text-gray-400">{placeholder}</span>
          ) : (
            <>
              {selectedOptions.slice(0, maxDisplayedItems).map((option) => (
                <span
                  key={option.value}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md bg-green-100 font-medium text-green-800',
                    'dark:bg-green-900 dark:text-green-200',
                    badgeSizeStyles[size]
                  )}
                >
                  {option.label}
                  <button
                    type="button"
                    onClick={(e) => handleRemove(option.value, e)}
                    className="rounded-full p-0.5 hover:bg-green-200 dark:hover:bg-green-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {selectedOptions.length > maxDisplayedItems && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-md bg-gray-100 font-medium text-gray-600',
                    'dark:bg-gray-800 dark:text-gray-300',
                    badgeSizeStyles[size]
                  )}
                >
                  +{selectedOptions.length - maxDisplayedItems} more
                </span>
              )}
            </>
          )}

          <div className="ml-auto flex items-center gap-1">
            {value.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200',
                open && 'rotate-180'
              )}
            />
          </div>
        </button>

        {/* Dropdown */}
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setOpen(false)
                setSearch('')
              }}
            />

            {/* Content */}
            <div
              className={cn(
                'absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl',
                'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200',
                'dark:border-gray-700 dark:bg-gray-900'
              )}
            >
              {/* Search Input */}
              <div className="border-b border-gray-200 p-2 dark:border-gray-700">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={searchPlaceholder}
                    className={cn(
                      'w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-8 text-sm outline-none',
                      'placeholder:text-gray-400',
                      'focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-500/20',
                      'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50',
                      'dark:placeholder:text-gray-500 dark:focus:bg-gray-900'
                    )}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Selection Info */}
              {value.length > 0 && (
                <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2 dark:border-gray-700">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {value.length} selected
                    {maxItems && ` (max ${maxItems})`}
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Options List */}
              <div
                ref={listRef}
                role="listbox"
                aria-multiselectable="true"
                className="max-h-[240px] overflow-y-auto p-1.5"
              >
                {filteredOptions.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    {emptyText}
                  </div>
                ) : (
                  filteredOptions.map((option, index) => {
                    const isSelected = value.includes(option.value)
                    const Icon = option.icon
                    const isDisabled =
                      option.disabled ||
                      (!isSelected && maxItems !== undefined && value.length >= maxItems)

                    return (
                      <div
                        key={option.value}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={isDisabled}
                        data-index={index}
                        onClick={() => !isDisabled && handleToggle(option.value)}
                        className={cn(
                          'relative flex cursor-pointer select-none items-center gap-2.5 rounded-md py-2 pl-9 pr-2.5 text-sm',
                          'transition-colors duration-150',
                          index === highlightedIndex && 'bg-gray-100 dark:bg-gray-800',
                          isSelected && 'text-green-600 dark:text-green-400',
                          isDisabled && 'pointer-events-none opacity-50'
                        )}
                      >
                        <span className="absolute left-2.5 flex h-4 w-4 items-center justify-center">
                          <div
                            className={cn(
                              'flex h-4 w-4 items-center justify-center rounded border-2 transition-colors',
                              isSelected
                                ? 'border-green-600 bg-green-600 dark:border-green-400 dark:bg-green-400'
                                : 'border-gray-300 dark:border-gray-600'
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white dark:text-gray-900" />}
                          </div>
                        </span>
                        {Icon && <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          {option.description && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {option.description}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }
)
MultiSelect.displayName = 'MultiSelect'

// ============================================================================
// Exports
// ============================================================================

export {
  // Radix-based components
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  // Enhanced custom components
  SearchableSelect,
  MultiSelect,
}

// Export types
export type { SearchableSelectOption, SearchableSelectProps, MultiSelectProps }
