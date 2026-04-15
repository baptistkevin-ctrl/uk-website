import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rewards & Achievements',
  description: 'Track your loyalty level, streaks, badges, and challenges.',
}

export default function LoyaltyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
