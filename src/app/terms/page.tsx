import { FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="bg-(--color-surface) rounded-2xl shadow-sm border border-(--color-border) px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-(--brand-primary-light) rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-(--brand-primary)" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Terms & Conditions</h1>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-(--color-text-secondary) text-lg mb-8">
              Last updated: January 2025
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Introduction</h2>
              <p className="text-(--color-text-secondary) mb-4">
                Welcome to UK Grocery Store. These terms and conditions govern your use of our website and services. By accessing or using our platform, you agree to be bound by these terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Orders and Payments</h2>
              <p className="text-(--color-text-secondary) mb-4">
                All orders placed through our website are subject to acceptance and availability. We reserve the right to refuse or cancel any order at our discretion. Payment must be made at the time of placing your order.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Delivery</h2>
              <p className="text-(--color-text-secondary) mb-4">
                We aim to deliver your order within the selected time slot. Delivery times are estimates and may vary due to circumstances beyond our control. Someone must be available to receive the delivery at the specified address.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Product Information</h2>
              <p className="text-(--color-text-secondary) mb-4">
                We strive to ensure all product information, including prices and descriptions, is accurate. However, errors may occur. We reserve the right to correct any errors and update information without prior notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Substitutions</h2>
              <p className="text-(--color-text-secondary) mb-4">
                If an item you ordered is unavailable, we may substitute it with a similar product of equal or greater value. You can opt out of substitutions in your account settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Limitation of Liability</h2>
              <p className="text-(--color-text-secondary) mb-4">
                To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Changes to Terms</h2>
              <p className="text-(--color-text-secondary) mb-4">
                We may update these terms from time to time. Continued use of our services after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Contact Us</h2>
              <p className="text-(--color-text-secondary)">
                If you have any questions about these terms, please contact us at support@ukgrocerystore.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
