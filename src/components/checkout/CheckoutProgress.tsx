'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Step = 'delivery' | 'payment' | 'review'

interface CheckoutProgressProps {
  current: Step
}

const steps: { key: Step; label: string }[] = [
  { key: 'delivery', label: 'Delivery' },
  { key: 'payment', label: 'Payment' },
  { key: 'review', label: 'Review' },
]

function getStepState(
  stepKey: Step,
  current: Step
): 'done' | 'active' | 'upcoming' {
  const order: Step[] = ['delivery', 'payment', 'review']
  const currentIndex = order.indexOf(current)
  const stepIndex = order.indexOf(stepKey)

  if (stepIndex < currentIndex) return 'done'
  if (stepIndex === currentIndex) return 'active'
  return 'upcoming'
}

export function CheckoutProgress({ current }: CheckoutProgressProps) {
  return (
    <nav aria-label="Checkout progress" className="flex items-center justify-center">
      {steps.map((step, index) => {
        const state = getStepState(step.key, current)

        return (
          <div key={step.key} className="flex items-center">
            {/* Connector line before step (skip first) */}
            {index > 0 && (
              <div
                className={cn(
                  'h-0.5 w-16 sm:w-24 transition-colors duration-300',
                  state === 'upcoming'
                    ? 'bg-(--color-border)'
                    : 'bg-(--brand-primary)'
                )}
              />
            )}

            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300',
                  state === 'done' &&
                    'bg-(--color-success) text-white',
                  state === 'active' &&
                    'bg-(--brand-amber) text-white shadow-(--shadow-amber)',
                  state === 'upcoming' &&
                    'border-2 border-(--color-border) text-(--color-text-muted)'
                )}
              >
                {state === 'done' ? (
                  <Check size={18} strokeWidth={2.5} />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'text-xs font-medium transition-colors duration-300',
                  state === 'done' && 'text-(--color-success)',
                  state === 'active' && 'text-foreground',
                  state === 'upcoming' && 'text-(--color-text-muted)'
                )}
              >
                {step.label}
              </span>
            </div>
          </div>
        )
      })}
    </nav>
  )
}
