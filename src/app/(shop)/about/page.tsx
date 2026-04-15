import type { Metadata } from 'next'
import {
  Leaf,
  Recycle,
  Heart,
  Award,
  Zap,
  ShieldCheck,
} from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Breadcrumb } from '@/components/ui/Breadcrumb'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about UK Grocery Store — our mission to deliver the freshest groceries from British farms straight to your door.',
  openGraph: {
    title: 'About Us | UK Grocery Store',
    description:
      'Fresh groceries, delivered with care since 2024. Discover our story, mission, and the values that drive everything we do.',
  },
}

const values = [
  {
    icon: Leaf,
    title: 'Freshness',
    description:
      'Every product is sourced daily from trusted British farms and suppliers to guarantee peak freshness.',
  },
  {
    icon: Recycle,
    title: 'Sustainability',
    description:
      'Eco-friendly packaging, reduced food waste, and carbon-neutral delivery across all our routes.',
  },
  {
    icon: Heart,
    title: 'Community',
    description:
      'We partner with local producers and donate surplus food to community kitchens every week.',
  },
  {
    icon: Award,
    title: 'Quality',
    description:
      'Rigorous quality checks at every stage — from farm to warehouse to your kitchen table.',
  },
  {
    icon: Zap,
    title: 'Convenience',
    description:
      'Order in minutes, choose your delivery slot, and get everything you need in one shop.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust',
    description:
      'Transparent pricing, honest product descriptions, and a no-questions-asked returns policy.',
  },
]

const stats = [
  { value: '50,000+', label: 'Customers' },
  { value: '5,000+', label: 'Products' },
  { value: '200+', label: 'British Farms' },
  { value: '4.9\u2605', label: 'Rating' },
]

export default function AboutPage() {
  return (
    <div className="bg-background min-h-screen">
      <Container size="lg" className="py-8 lg:py-12">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'About Us' },
            ]}
            className="mb-6"
          />

          {/* Hero */}
          <div className="mb-12 text-center">
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-foreground">
              About UK Grocery Store
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-(--color-text-secondary)">
              Fresh groceries, delivered with care since 2024.
            </p>
          </div>

          {/* Mission */}
          <section className="grid items-center gap-8 lg:grid-cols-2">
            {/* Image placeholder */}
            <div className="aspect-4/3 rounded-2xl bg-(--color-elevated)" />

            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Our Mission
              </h2>
              <p className="mt-4 leading-relaxed text-(--color-text-secondary)">
                We started UK Grocery Store with a simple belief: everyone
                deserves access to fresh, high-quality groceries without the
                hassle of crowded supermarkets. By connecting you directly with
                British farms and artisan producers, we cut out the middlemen and
                deliver food that is fresher, fairer, and better for the planet.
              </p>
              <ul className="mt-4 space-y-2 text-(--color-text-secondary)">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-(--brand-primary)" />
                  Source directly from over 200 British farms
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-(--brand-primary)" />
                  Deliver within 24 hours of harvest where possible
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-(--brand-primary)" />
                  Reduce food miles and support the local economy
                </li>
              </ul>
            </div>
          </section>

          {/* Values */}
          <section className="mt-12">
            <h2 className="mb-6 text-center font-display text-2xl font-semibold text-foreground">
              What We Stand For
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="rounded-xl border border-(--color-border) bg-(--color-surface) p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-(--brand-primary-light)">
                    <v.icon className="h-6 w-6 text-(--brand-primary)" />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">
                    {v.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-(--color-text-secondary)">
                    {v.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Stats */}
          <section className="mt-12 border-y border-(--color-border) py-8">
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="font-display text-2xl font-bold text-(--brand-primary) lg:text-3xl">
                    {s.value}
                  </p>
                  <p className="mt-1 text-sm text-(--color-text-muted)">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </Container>
    </div>
  )
}
