'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AlertTriangle, Info, CheckCircle, Trash2, AlertCircle } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'
import { buttonVariants } from './button'

// Alert dialog variants
type AlertDialogVariant = 'default' | 'destructive' | 'warning' | 'success' | 'info'

// Alert dialog size variants
const alertDialogContentVariants = cva(
  'fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white shadow-2xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
  {
    variants: {
      size: {
        sm: 'max-w-sm rounded-lg p-4',
        md: 'max-w-md rounded-lg p-6',
        lg: 'max-w-lg rounded-lg p-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

// Variant styles for the icon container
const iconContainerVariants = cva(
  'mx-auto flex h-12 w-12 items-center justify-center rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-600',
        destructive: 'bg-red-100 text-red-600',
        warning: 'bg-amber-100 text-amber-600',
        success: 'bg-green-100 text-green-600',
        info: 'bg-blue-100 text-blue-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

// Variant icons
const variantIcons: Record<AlertDialogVariant, React.ElementType> = {
  default: AlertCircle,
  destructive: Trash2,
  warning: AlertTriangle,
  success: CheckCircle,
  info: Info,
}

// Context for variant
interface AlertDialogContextValue {
  variant?: AlertDialogVariant
}

const AlertDialogContext = React.createContext<AlertDialogContextValue>({})

// Root component - uses Dialog primitive with alertdialog role
interface AlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: AlertDialogVariant
  children?: React.ReactNode
}

const AlertDialog = ({ variant = 'default', ...props }: AlertDialogProps) => (
  <AlertDialogContext.Provider value={{ variant }}>
    <DialogPrimitive.Root {...props} />
  </AlertDialogContext.Provider>
)
AlertDialog.displayName = 'AlertDialog'

const AlertDialogTrigger = DialogPrimitive.Trigger
AlertDialogTrigger.displayName = 'AlertDialogTrigger'

const AlertDialogPortal = DialogPrimitive.Portal

// Overlay with smooth animation
const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'duration-300',
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = 'AlertDialogOverlay'

// Content with size variants - uses alertdialog role for proper accessibility
interface AlertDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof alertDialogContentVariants> {}

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  AlertDialogContentProps
>(({ className, size, children, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      role="alertdialog"
      aria-modal="true"
      className={cn(alertDialogContentVariants({ size }), 'border-gray-200', className)}
      // Prevent closing on overlay click for alert dialogs
      onInteractOutside={(e) => e.preventDefault()}
      // Prevent closing on escape for alert dialogs (user must explicitly choose)
      onEscapeKeyDown={(e) => e.preventDefault()}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </AlertDialogPortal>
))
AlertDialogContent.displayName = 'AlertDialogContent'

// Header with centered layout option
interface AlertDialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  centered?: boolean
}

const AlertDialogHeader = ({
  className,
  centered = true,
  ...props
}: AlertDialogHeaderProps) => (
  <div
    className={cn(
      'flex flex-col gap-2',
      centered && 'items-center text-center',
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = 'AlertDialogHeader'

// Icon component for visual feedback
interface AlertDialogIconProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertDialogVariant
  icon?: React.ElementType
}

const AlertDialogIcon = ({
  className,
  variant: variantProp,
  icon: IconProp,
  ...props
}: AlertDialogIconProps) => {
  const context = React.useContext(AlertDialogContext)
  const variant = variantProp ?? context.variant ?? 'default'
  const Icon = IconProp ?? variantIcons[variant]

  return (
    <div className={cn(iconContainerVariants({ variant }), className)} {...props}>
      <Icon className="h-6 w-6" aria-hidden="true" />
    </div>
  )
}
AlertDialogIcon.displayName = 'AlertDialogIcon'

// Footer with proper button alignment
interface AlertDialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  stacked?: boolean
}

const AlertDialogFooter = ({
  className,
  stacked = false,
  ...props
}: AlertDialogFooterProps) => (
  <div
    className={cn(
      'flex gap-3 pt-2',
      stacked ? 'flex-col-reverse' : 'flex-col-reverse sm:flex-row sm:justify-center',
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = 'AlertDialogFooter'

// Title
const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-gray-900', className)}
    {...props}
  />
))
AlertDialogTitle.displayName = 'AlertDialogTitle'

// Description
const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-gray-500 leading-relaxed', className)}
    {...props}
  />
))
AlertDialogDescription.displayName = 'AlertDialogDescription'

// Action button with variant support
interface AlertDialogActionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive'
  asChild?: boolean
}

const AlertDialogAction = React.forwardRef<
  HTMLButtonElement,
  AlertDialogActionProps
>(({ className, variant, asChild = false, ...props }, ref) => {
  const context = React.useContext(AlertDialogContext)
  const buttonVariant = variant ?? (context.variant === 'destructive' ? 'destructive' : 'default')

  return (
    <DialogPrimitive.Close asChild>
      <button
        ref={ref}
        className={cn(buttonVariants({ variant: buttonVariant }), className)}
        {...props}
      />
    </DialogPrimitive.Close>
  )
})
AlertDialogAction.displayName = 'AlertDialogAction'

// Cancel button
const AlertDialogCancel = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Close asChild>
    <button
      ref={ref}
      className={cn(buttonVariants({ variant: 'outline' }), className)}
      {...props}
    />
  </DialogPrimitive.Close>
))
AlertDialogCancel.displayName = 'AlertDialogCancel'

// Convenient pre-built confirmation dialog
interface ConfirmDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: AlertDialogVariant
  size?: VariantProps<typeof alertDialogContentVariants>['size']
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
  trigger?: React.ReactNode
  icon?: React.ElementType
  loading?: boolean
}

const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  size = 'md',
  onConfirm,
  onCancel,
  trigger,
  icon,
  loading = false,
}: ConfirmDialogProps) => {
  const [isLoading, setIsLoading] = React.useState(false)
  const [internalOpen, setInternalOpen] = React.useState(false)

  // Use controlled or uncontrolled state
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange ?? setInternalOpen

  const handleConfirm = async () => {
    if (onConfirm) {
      try {
        setIsLoading(true)
        await onConfirm()
        setIsOpen(false)
      } finally {
        setIsLoading(false)
      }
    } else {
      setIsOpen(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    setIsOpen(false)
  }

  const isActionLoading = loading || isLoading

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen} variant={variant}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent size={size}>
        <AlertDialogHeader>
          <AlertDialogIcon icon={icon} />
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <button
            onClick={handleCancel}
            disabled={isActionLoading}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isActionLoading}
            className={cn(
              buttonVariants({ variant: variant === 'destructive' ? 'destructive' : 'default' }),
              isActionLoading && 'opacity-70 cursor-not-allowed'
            )}
          >
            {isActionLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
ConfirmDialog.displayName = 'ConfirmDialog'

// Destructive confirm dialog shorthand
interface DeleteDialogProps extends Omit<ConfirmDialogProps, 'variant'> {
  itemName?: string
}

const DeleteDialog = ({
  title = 'Delete item',
  description,
  confirmLabel = 'Delete',
  itemName,
  ...props
}: DeleteDialogProps) => (
  <ConfirmDialog
    title={title}
    description={description ?? (itemName ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.` : 'Are you sure you want to delete this item? This action cannot be undone.')}
    confirmLabel={confirmLabel}
    variant="destructive"
    {...props}
  />
)
DeleteDialog.displayName = 'DeleteDialog'

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  ConfirmDialog,
  DeleteDialog,
  alertDialogContentVariants,
  iconContainerVariants,
}

export type { AlertDialogVariant, AlertDialogContentProps, ConfirmDialogProps, DeleteDialogProps }
