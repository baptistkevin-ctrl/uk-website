import type { Metadata } from "next"
import { ShieldCheck, Filter, Bell } from "lucide-react"
import { Container } from "@/components/layout/Container"
import { Breadcrumb } from "@/components/ui/Breadcrumb"
import { DietaryProfileSetup } from "@/components/dietary/DietaryProfileSetup"

export const metadata: Metadata = {
  title: "Dietary Preferences",
  description:
    "Set your dietary preferences and allergen filters. We will personalise your shopping experience and warn you about unsuitable products.",
  openGraph: {
    title: "Dietary Preferences | UK Grocery Store",
    description:
      "Customise your grocery shopping with dietary filters, allergen warnings, and personalised product recommendations.",
  },
}

const HOW_IT_WORKS = [
  {
    icon: Filter,
    title: "Smart Filtering",
    description:
      "Products that conflict with your dietary profile are clearly flagged throughout the store so you can shop with confidence.",
  },
  {
    icon: ShieldCheck,
    title: "Allergen Warnings",
    description:
      "Warning badges appear on product cards and detail pages when a product contains any of your specified allergens.",
  },
  {
    icon: Bell,
    title: "Recipe Adjustments",
    description:
      "Recipes automatically adjust serving sizes based on your household and highlight ingredients that may not suit your diet.",
  },
]

export default function DietarySetupPage() {
  return (
    <Container size="md" className="py-8 lg:py-12">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Dietary Preferences" },
        ]}
        className="mb-6"
      />

      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
          Set Your Dietary Preferences
        </h1>
        <p className="mt-3 max-w-2xl text-(--color-text-secondary)">
          We will filter products and warn you about allergens across the entire
          store. Your preferences are saved automatically and can be updated at
          any time.
        </p>
      </div>

      <DietaryProfileSetup />

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
    </Container>
  )
}
