import { Cookie } from 'lucide-react'

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Cookie className="h-6 w-6 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Cookie Policy</h1>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 text-lg mb-8">
              Last updated: January 2025
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What Are Cookies?</h2>
              <p className="text-gray-600 mb-4">
                Cookies are small text files stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our site.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Types of Cookies We Use</h2>

              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Essential Cookies</h3>
              <p className="text-gray-600 mb-4">
                These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and account access.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Analytics Cookies</h3>
              <p className="text-gray-600 mb-4">
                We use analytics cookies to understand how visitors interact with our website. This helps us improve our services and user experience.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Functional Cookies</h3>
              <p className="text-gray-600 mb-4">
                These cookies remember your preferences and choices, such as your delivery address and shopping cart contents.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-6 mb-3">Marketing Cookies</h3>
              <p className="text-gray-600 mb-4">
                With your consent, we may use marketing cookies to show you relevant advertisements and measure the effectiveness of our campaigns.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Managing Cookies</h2>
              <p className="text-gray-600 mb-4">
                You can control and manage cookies through your browser settings. Please note that removing or blocking certain cookies may impact your experience on our website.
              </p>
              <p className="text-gray-600 mb-4">
                Most browsers allow you to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>View what cookies are stored and delete them individually</li>
                <li>Block third-party cookies</li>
                <li>Block cookies from specific sites</li>
                <li>Block all cookies</li>
                <li>Delete all cookies when you close your browser</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600">
                If you have questions about our use of cookies, please contact us at privacy@freshgroceries.co.uk
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
