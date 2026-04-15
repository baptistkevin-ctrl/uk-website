import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Subscribe & Save',
  description:
    'Save 10% on regular deliveries. Set your frequency, pause or skip anytime.',
}

export default function SubscriptionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
