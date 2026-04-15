import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meal Planner',
  description:
    'Plan your weekly meals and auto-generate a shopping list. One-click add all ingredients to your basket.',
}

export default function MealPlannerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
