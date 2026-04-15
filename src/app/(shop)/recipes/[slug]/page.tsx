import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { RECIPES } from '@/data/recipes'
import { RecipeDetail } from './RecipeDetail'

interface RecipePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: RecipePageProps): Promise<Metadata> {
  const { slug } = await params
  const recipe = RECIPES.find((r) => r.slug === slug)

  if (!recipe) {
    return { title: 'Recipe Not Found' }
  }

  return {
    title: recipe.title,
    description: recipe.description,
  }
}

export function generateStaticParams() {
  return RECIPES.map((recipe) => ({ slug: recipe.slug }))
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = await params
  const recipe = RECIPES.find((r) => r.slug === slug)

  if (!recipe) {
    notFound()
  }

  return <RecipeDetail recipe={recipe} />
}
