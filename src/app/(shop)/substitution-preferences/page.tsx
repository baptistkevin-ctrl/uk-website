import type { Metadata } from 'next'
import { Sparkles, Brain, ShieldCheck } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { SubstitutionPreferencesForm } from '@/components/substitutions/SubstitutionPreferencesForm'

export const metadata: Metadata = {
  title: 'Smart Substitution Settings',
  description:
    'Control how we suggest alternatives when items are out of stock. Set your brand, price, and dietary preferences for smarter substitutions.',
  openGraph: {
    title: 'Smart Substitution Settings | UK Grocery Store',
    description:
      'Personalise your substitution preferences for a better shopping experience when items are unavailable.',
  },
}

const HOW_IT_WORKS = [
  {
    icon: Brain,
    title: 'Smart Matching',
    description:
      'Our algorithm analyses category, brand, price, size, and dietary compatibility to calculate a match score for every alternative.',
  },
  {
    icon: Sparkles,
    title: 'Personalised Ranking',
    description:
      'Your preferences shape how alternatives are ranked. Same brand, cheapest price, or closest match — you decide what matters most.',
  },
  {
    icon: ShieldCheck,
    title: 'Dietary Safety',
    description:
      'With strict mode enabled, we never suggest substitutes that conflict with your dietary profile or allergen list.',
  },
]

export default function SubstitutionPreferencesPage() {
  return (
    <Container size="md" className="py-8 lg:py-12">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Substitution Preferences' },
        ]}
        className="mb-6"
      />

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
          Smart Substitution Settings
        </h1>
        <p className="mt-3 max-w-2xl text-(--color-text-secondary)">
          Control how we suggest alternatives when items are out of stock. Your
          preferences are saved automatically and apply to all future orders.
        </p>
      </div>

      <SubstitutionPreferencesForm />

      {/* How it works */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-foreground">
          How it works
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HOW_IT_WORKS.map((item) => {
            const Icon = item.icon

            return (
              <div
                key={item.title}
                className="rounded-xl border border-(--color-border) bg-(--color-surface) p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-(--brand-primary)/10">
                  <Icon className="h-5 w-5 text-(--brand-primary)" />
                </div>
                <h3 className="font-display text-sm font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-(--color-text-muted)">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Scoring explanation */}
      <section className="mt-10 rounded-xl border border-(--color-border) bg-(--color-elevated) p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Understanding the Match Score
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-(--color-text-muted)">
          Each substitute receives a score from 0 to 100 based on how closely it
          matches the original product. The score is calculated from multiple
          factors:
        </p>
        <ul className="mt-4 space-y-2 text-sm text-(--color-text-secondary)">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-success)" />
            <span>
              <strong className="text-foreground">80-100%</strong> — Excellent
              match. Same category, similar price and size, often the same brand.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--brand-amber)" />
            <span>
              <strong className="text-foreground">60-79%</strong> — Good match.
              Same category but may differ in brand, size, or price.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-(--color-error)" />
            <span>
              <strong className="text-foreground">Below 60%</strong> — Partial
              match. Consider reviewing carefully before accepting.
            </span>
          </li>
        </ul>
      </section>
    </Container>
  )
}
