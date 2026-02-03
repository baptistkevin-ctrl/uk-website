import { RotateCcw, CheckCircle, AlertCircle, Clock } from 'lucide-react'

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <RotateCcw className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Returns & Refunds</h1>
              <p className="text-gray-500 mt-1">Our hassle-free returns policy</p>
            </div>
          </div>

          {/* Key points */}
          <div className="bg-emerald-50 rounded-xl p-6 mb-10">
            <h2 className="font-semibold text-gray-900 mb-4">Our Promise</h2>
            <p className="text-gray-600">
              We want you to be completely satisfied with your order. If something isn't right, we'll make it right - whether that's a refund, replacement, or credit.
            </p>
          </div>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What Can Be Returned?</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Eligible for Return/Refund:</strong>
                    <ul className="text-gray-600 mt-2 space-y-1">
                      <li>Damaged or defective products</li>
                      <li>Wrong items delivered</li>
                      <li>Items past their use-by date on delivery</li>
                      <li>Missing items from your order</li>
                      <li>Poor quality fresh produce</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Not Eligible:</strong>
                    <ul className="text-gray-600 mt-2 space-y-1">
                      <li>Change of mind (for food safety reasons)</li>
                      <li>Items reported more than 24 hours after delivery</li>
                      <li>Products that have been opened and partially used</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Request a Refund</h2>
              <ol className="space-y-4 text-gray-600">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-semibold">1</span>
                  <div>
                    <strong className="text-gray-900">Report the Issue</strong>
                    <p>Contact us within 24 hours of delivery via email or your account.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-semibold">2</span>
                  <div>
                    <strong className="text-gray-900">Provide Details</strong>
                    <p>Include your order number and photos of the affected items.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-semibold">3</span>
                  <div>
                    <strong className="text-gray-900">Resolution</strong>
                    <p>We'll review your request and process a refund or replacement within 48 hours.</p>
                  </div>
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Refund Timeline</h2>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <Clock className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                <div className="text-gray-600">
                  <p>Once approved, refunds are processed within <strong className="text-gray-900">3-5 business days</strong>.</p>
                  <p className="mt-2">The refund will appear on the original payment method used for your order. Bank processing times may vary.</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Substitutions</h2>
              <p className="text-gray-600 mb-4">
                If we substitute an item and you're not happy with the replacement, you can return it for a full refund. Simply reject the substitution at delivery or contact us within 24 hours.
              </p>
              <p className="text-gray-600">
                You can opt out of substitutions entirely in your account settings or at checkout.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600 mb-4">
                Need help with a return or refund? Our customer service team is here to assist.
              </p>
              <div className="space-y-2 text-gray-600">
                <p><strong>Email:</strong> support@megamartuk.co.uk</p>
                <p><strong>Response time:</strong> Within 24 hours</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
