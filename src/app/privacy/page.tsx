import { Shield } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="bg-(--color-surface) rounded-2xl shadow-sm border border-(--color-border) px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-(--brand-primary-light) rounded-xl flex items-center justify-center">
              <Shield className="h-6 w-6 text-(--brand-primary)" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-(--color-text-secondary) text-lg mb-8">
              Last updated: January 2025
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
              <p className="text-(--color-text-secondary) mb-4">
                We collect information you provide directly to us, including your name, email address, postal address, phone number, and payment information when you create an account or place an order.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
              <p className="text-(--color-text-secondary) mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 text-(--color-text-secondary) space-y-2">
                <li>Process and deliver your orders</li>
                <li>Send order confirmations and updates</li>
                <li>Respond to your comments and questions</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Improve our services and develop new features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Information Sharing</h2>
              <p className="text-(--color-text-secondary) mb-4">
                We do not sell your personal information. We may share your information with service providers who assist us in operating our business, such as payment processors and delivery partners.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Data Security</h2>
              <p className="text-(--color-text-secondary) mb-4">
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Your Rights</h2>
              <p className="text-(--color-text-secondary) mb-4">Under GDPR, you have the right to:</p>
              <ul className="list-disc pl-6 text-(--color-text-secondary) space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing of your data</li>
                <li>Data portability</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Data Retention</h2>
              <p className="text-(--color-text-secondary) mb-4">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Contact Us</h2>
              <p className="text-(--color-text-secondary)">
                For any privacy-related questions or to exercise your rights, contact us at privacy@ukgrocerystore.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
