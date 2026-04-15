import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Family Lists',
  description:
    'Create shared shopping lists with your household. Add items together and shop in one click.',
}

export default function FamilyListsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
