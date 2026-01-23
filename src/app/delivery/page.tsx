import { Truck, Clock, MapPin, Package, CheckCircle } from 'lucide-react'

export default function DeliveryPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Truck className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Delivery Information</h1>
              <p className="text-gray-500 mt-1">Everything you need to know about our delivery service</p>
            </div>
          </div>

          {/* Delivery highlights */}
          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            <div className="bg-emerald-50 rounded-xl p-5 text-center">
              <Clock className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">7 Days a Week</h3>
              <p className="text-sm text-gray-600 mt-1">8am - 10pm delivery slots</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-5 text-center">
              <Package className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">Free Over £50</h3>
              <p className="text-sm text-gray-600 mt-1">On qualifying orders</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-5 text-center">
              <MapPin className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900">UK Wide</h3>
              <p className="text-sm text-gray-600 mt-1">Delivering nationwide</p>
            </div>
          </div>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Slots</h2>
              <p className="text-gray-600 mb-4">
                We offer convenient 2-hour delivery windows throughout the day. Choose the time that works best for you during checkout.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  Morning: 8am - 12pm
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  Afternoon: 12pm - 6pm
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                  Evening: 6pm - 10pm
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Charges</h2>
              <div className="bg-gray-50 rounded-xl p-5">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 font-semibold text-gray-900">Order Value</th>
                      <th className="text-right py-3 font-semibold text-gray-900">Delivery Fee</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b border-gray-100">
                      <td className="py-3">Under £40</td>
                      <td className="text-right py-3">£4.99</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3">£40 - £50</td>
                      <td className="text-right py-3">£2.99</td>
                    </tr>
                    <tr>
                      <td className="py-3 font-medium text-emerald-600">Over £50</td>
                      <td className="text-right py-3 font-medium text-emerald-600">FREE</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What to Expect</h2>
              <ol className="space-y-4 text-gray-600">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-semibold">1</span>
                  <div>
                    <strong className="text-gray-900">Order Confirmation</strong>
                    <p>You'll receive an email confirming your order and delivery slot.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-semibold">2</span>
                  <div>
                    <strong className="text-gray-900">Dispatch Notification</strong>
                    <p>We'll notify you when your order is on its way with tracking details.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-semibold">3</span>
                  <div>
                    <strong className="text-gray-900">Delivery</strong>
                    <p>Our driver will deliver to your door within your chosen time slot.</p>
                  </div>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Tips</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Ensure someone is available to receive the delivery</li>
                <li>Provide accurate delivery instructions for the driver</li>
                <li>Check your order as soon as possible after delivery</li>
                <li>Store chilled and frozen items promptly</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
