import { FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Terms & Conditions</h1>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 text-lg mb-8">
              Last updated: January 2025
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 mb-4">
                Welcome to MegaMart UK. These terms and conditions govern your use of our website and services. By accessing or using our platform, you agree to be bound by these terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Orders and Payments</h2>
              <p className="text-gray-600 mb-4">
                All orders placed through our website are subject to acceptance and availability. We reserve the right to refuse or cancel any order at our discretion. Payment must be made at the time of placing your order.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Delivery</h2>
              <p className="text-gray-600 mb-4">
                We aim to deliver your order within the selected time slot. Delivery times are estimates and may vary due to circumstances beyond our control. Someone must be available to receive the delivery at the specified address.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Product Information</h2>
              <p className="text-gray-600 mb-4">
                We strive to ensure all product information, including prices and descriptions, is accurate. However, errors may occur. We reserve the right to correct any errors and update information without prior notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Substitutions</h2>
              <p className="text-gray-600 mb-4">
                If an item you ordered is unavailable, we may substitute it with a similar product of equal or greater value. You can opt out of substitutions in your account settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Limitation of Liability</h2>
              <p className="text-gray-600 mb-4">
                To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Changes to Terms</h2>
              <p className="text-gray-600 mb-4">
                We may update these terms from time to time. Continued use of our services after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
              <p className="text-gray-600">
                If you have any questions about these terms, please contact us at support@megamartuk.co.uk
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
