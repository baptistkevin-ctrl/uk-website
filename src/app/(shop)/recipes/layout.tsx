import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Recipes',
  description:
    'Browse delicious recipes and add all ingredients to your basket in one click.',
}

export default function RecipesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
