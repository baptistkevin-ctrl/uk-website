import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="relative mb-6">
        {/* Decorative rings */}
        <div className="absolute inset-0 -m-4 rounded-full bg-(--brand-primary)/5 animate-pulse" />
        <div className="absolute inset-0 -m-8 rounded-full bg-(--brand-primary)/3" />
        <div className="relative h-16 w-16 rounded-2xl bg-(--color-elevated) flex items-center justify-center">
          <Icon className="h-8 w-8 text-(--color-text-disabled)" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-(--color-text-muted) max-w-sm mb-6">{description}</p>

      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button className="bg-(--brand-primary) hover:bg-(--brand-primary-hover)">
            {actionLabel}
          </Button>
        </Link>
      )}

      {actionLabel && onAction && !actionHref && (
        <Button onClick={onAction} className="bg-(--brand-primary) hover:bg-(--brand-primary-hover)">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
