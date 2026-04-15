import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Community Recipes',
  description:
    'Discover and share recipes with the UK Grocery community. Vote on your favourites and shop ingredients in one click.',
}

export default function CommunityRecipesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
