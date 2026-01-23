'use client'

import { useState } from 'react'
import { HelpCircle, ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'What are your delivery hours?',
    answer: 'We deliver 7 days a week, with time slots available from 8am to 10pm. You can choose your preferred delivery slot during checkout.'
  },
  {
    question: 'What is the minimum order value?',
    answer: 'There is no minimum order value. However, orders under £40 will incur a delivery fee. Orders over £50 qualify for free delivery.'
  },
  {
    question: 'How do I track my order?',
    answer: 'Once your order is dispatched, you\'ll receive an email with a tracking link. You can also track your order by visiting the "Track Order" page and entering your order number.'
  },
  {
    question: 'What if an item is out of stock?',
    answer: 'If an item is unavailable, we\'ll substitute it with a similar product of equal or greater value. You can opt out of substitutions in your account settings or during checkout.'
  },
  {
    question: 'Can I change or cancel my order?',
    answer: 'You can modify or cancel your order up to 2 hours before your scheduled delivery time. Visit "My Orders" in your account to make changes.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit and debit cards (Visa, Mastercard, American Express), as well as Apple Pay and Google Pay.'
  },
  {
    question: 'How do I return a product?',
    answer: 'If you\'re not satisfied with any product, please contact us within 24 hours of delivery. We\'ll arrange a refund or replacement for eligible items.'
  },
  {
    question: 'Do you deliver to my area?',
    answer: 'We currently deliver across the UK. Enter your postcode during checkout to confirm delivery availability to your area.'
  },
  {
    question: 'Are your products fresh?',
    answer: 'Yes! We source our products from trusted suppliers and ensure all items meet our strict quality standards. Fresh produce is delivered with at least 3-5 days before expiry.'
  },
  {
    question: 'How do I create an account?',
    answer: 'Click "Sign In" in the top right corner of the page, then select "Create Account". You\'ll need to provide your email address and create a password.'
  }
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <HelpCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h1>
              <p className="text-gray-500 mt-1">Find answers to common questions</p>
            </div>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openIndex === index && (
                  <div className="px-5 pb-5 pt-0">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 bg-emerald-50 rounded-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Still have questions?</h2>
            <p className="text-gray-600 mb-4">
              Can't find what you're looking for? Our customer support team is here to help.
            </p>
            <a
              href="mailto:support@freshgroceries.co.uk"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
