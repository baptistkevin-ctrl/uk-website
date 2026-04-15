import type { Metadata } from 'next'
import { Cookie } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'Learn how UK Grocery Store uses cookies to improve your shopping experience, including essential, analytics, and preference cookies.',
  alternates: { canonical: 'https://ukgrocerystore.com/cookies' },
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="bg-(--color-surface) rounded-2xl shadow-sm border border-(--color-border) px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-(--brand-primary-light) rounded-xl flex items-center justify-center">
              <Cookie className="h-6 w-6 text-(--brand-primary)" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Cookie Policy</h1>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-(--color-text-secondary) text-lg mb-8">
              Last updated: January 2025
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">What Are Cookies?</h2>
              <p className="text-(--color-text-secondary) mb-4">
                Cookies are small text files stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">Types of Cookies We Use</h2>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Essential Cookies</h3>
              <p className="text-(--color-text-secondary) mb-4">
                These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and account access.
              </p>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Analytics Cookies</h3>
              <p className="text-(--color-text-secondary) mb-4">
                We use analytics cookies to understand how visitors interact with our website. This helps us improve our services and user experience.
              </p>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Functional Cookies</h3>
              <p className="text-(--color-text-secondary) mb-4">
                These cookies remember your preferences and choices, such as your delivery address and shopping cart contents.
              </p>

              <h3 className="text-lg font-medium text-foreground mt-6 mb-3">Marketing Cookies</h3>
              <p className="text-(--color-text-secondary) mb-4">
                With your consent, we may use marketing cookies to show you relevant advertisements and measure the effectiveness of our campaigns.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">Managing Cookies</h2>
              <p className="text-(--color-text-secondary) mb-4">
                You can control and manage cookies through your browser settings. Please note that removing or blocking certain cookies may impact your experience on our website.
              </p>
              <p className="text-(--color-text-secondary) mb-4">
                Most browsers allow you to:
              </p>
              <ul className="list-disc pl-6 text-(--color-text-secondary) space-y-2">
                <li>View what cookies are stored and delete them individually</li>
                <li>Block third-party cookies</li>
                <li>Block cookies from specific sites</li>
                <li>Block all cookies</li>
                <li>Delete all cookies when you close your browser</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">Contact Us</h2>
              <p className="text-(--color-text-secondary)">
                If you have questions about our use of cookies, please contact us at privacy@ukgrocerystore.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
