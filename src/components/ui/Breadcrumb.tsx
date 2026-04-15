import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex', className)}>
      <ol className="flex items-center gap-1.5">
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li
              key={item.label}
              className="flex items-center gap-1.5"
              aria-current={isLast ? 'page' : undefined}
            >
              {index > 0 && (
                <ChevronRight
                  size={14}
                  className="text-(--color-text-muted)"
                  aria-hidden="true"
                />
              )}

              {isLast ? (
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href!}
                  className="text-sm text-(--color-text-muted) transition-colors hover:text-(--brand-primary)"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
