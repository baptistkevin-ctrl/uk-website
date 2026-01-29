'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

// Dialog size variants
const dialogContentVariants = cva(
  'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white shadow-2xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
  {
    variants: {
      size: {
        sm: 'max-w-sm rounded-lg p-4',
        md: 'max-w-md rounded-lg p-6',
        lg: 'max-w-lg rounded-lg p-6',
        xl: 'max-w-xl rounded-xl p-6',
        '2xl': 'max-w-2xl rounded-xl p-8',
        '3xl': 'max-w-3xl rounded-xl p-8',
        '4xl': 'max-w-4xl rounded-2xl p-8',
        full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] h-full rounded-2xl p-8 overflow-hidden',
      },
    },
    defaultVariants: {
      size: 'lg',
    },
  }
)

// Context for dialog size
type DialogSize = VariantProps<typeof dialogContentVariants>['size']

interface DialogContextValue {
  size?: DialogSize
}

const DialogContext = React.createContext<DialogContextValue>({})

// Root Dialog with size context
interface DialogProps extends React.ComponentProps<typeof DialogPrimitive.Root> {
  size?: DialogSize
}

const Dialog = ({ size, ...props }: DialogProps) => (
  <DialogContext.Provider value={{ size }}>
    <DialogPrimitive.Root {...props} />
  </DialogContext.Provider>
)
Dialog.displayName = 'Dialog'

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

// Overlay with smooth fade animation
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'duration-300',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

// Content with size variants and enhanced accessibility
interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof dialogContentVariants> {
  showClose?: boolean
  onInteractOutside?: (event: Event) => void
  preventCloseOnOutsideClick?: boolean
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({
  className,
  children,
  size: sizeProp,
  showClose = true,
  preventCloseOnOutsideClick = false,
  onInteractOutside,
  ...props
}, ref) => {
  const context = React.useContext(DialogContext)
  const size = sizeProp ?? context.size ?? 'lg'

  const handleInteractOutside = React.useCallback(
    (event: Event) => {
      if (preventCloseOnOutsideClick) {
        event.preventDefault()
      }
      onInteractOutside?.(event)
    },
    [preventCloseOnOutsideClick, onInteractOutside]
  )

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(dialogContentVariants({ size }), className)}
        onInteractOutside={handleInteractOutside}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close
            className={cn(
              'absolute right-4 top-4 rounded-full p-1.5',
              'opacity-70 ring-offset-white transition-all duration-200',
              'hover:opacity-100 hover:bg-gray-100',
              'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
              'disabled:pointer-events-none',
              'data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500'
            )}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

// Header section with proper spacing
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col space-y-2 text-center sm:text-left',
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = 'DialogHeader'

// Body section for main content with scroll support
interface DialogBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  scrollable?: boolean
}

const DialogBody = ({
  className,
  scrollable = false,
  ...props
}: DialogBodyProps) => (
  <div
    className={cn(
      'flex-1',
      scrollable && 'overflow-y-auto max-h-[60vh] pr-2 -mr-2',
      className
    )}
    {...props}
  />
)
DialogBody.displayName = 'DialogBody'

// Footer section with proper alignment
interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right' | 'between'
}

const DialogFooter = ({
  className,
  align = 'right',
  ...props
}: DialogFooterProps) => (
  <div
    className={cn(
      'flex flex-col-reverse gap-2 pt-4 sm:flex-row',
      {
        'sm:justify-start': align === 'left',
        'sm:justify-center': align === 'center',
        'sm:justify-end': align === 'right',
        'sm:justify-between': align === 'between',
      },
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

// Title with enhanced styling
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight text-gray-900',
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

// Description with muted styling
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-gray-500 leading-relaxed', className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

// Helper component for creating accessible dialogs with proper structure
interface AccessibleDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: string
  size?: DialogSize
  children: React.ReactNode
  trigger?: React.ReactNode
  footer?: React.ReactNode
  showClose?: boolean
  preventCloseOnOutsideClick?: boolean
  className?: string
}

const AccessibleDialog = ({
  open,
  onOpenChange,
  title,
  description,
  size,
  children,
  trigger,
  footer,
  showClose = true,
  preventCloseOnOutsideClick = false,
  className,
}: AccessibleDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange} size={size}>
    {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
    <DialogContent
      showClose={showClose}
      preventCloseOnOutsideClick={preventCloseOnOutsideClick}
      className={className}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <DialogBody>{children}</DialogBody>
      {footer && <DialogFooter>{footer}</DialogFooter>}
    </DialogContent>
  </Dialog>
)
AccessibleDialog.displayName = 'AccessibleDialog'

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  AccessibleDialog,
  dialogContentVariants,
}

export type { DialogSize, DialogContentProps, DialogBodyProps, DialogFooterProps, AccessibleDialogProps }
