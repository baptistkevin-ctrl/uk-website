'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  HelpCircle,
  Search,
  ShoppingCart,
  Truck,
  CreditCard,
  RotateCcw,
  User,
  Store,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Phone,
  Mail,
  Clock,
} from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

interface FAQCategory {
  id: string
  title: string
  icon: React.ReactNode
  description: string
  faqs: FAQItem[]
}

const faqCategories: FAQCategory[] = [
  {
    id: 'orders',
    title: 'Orders & Checkout',
    icon: <ShoppingCart className="w-6 h-6" />,
    description: 'Questions about placing orders, cart, and checkout',
    faqs: [
      {
        question: 'How do I place an order?',
        answer: 'Simply browse our products, add items to your cart, and proceed to checkout. You can create an account or checkout as a guest. Enter your delivery details, select a payment method, and confirm your order.'
      },
      {
        question: 'Can I modify or cancel my order?',
        answer: 'You can modify or cancel your order within 30 minutes of placing it. After this window, please contact our customer support team for assistance. Once an order is dispatched, it cannot be cancelled.'
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit and debit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, and Google Pay. All payments are securely processed through Stripe.'
      },
      {
        question: 'Is there a minimum order value?',
        answer: 'The minimum order value is £15 for delivery. There is no minimum for click and collect orders.'
      },
      {
        question: 'How do I apply a discount code?',
        answer: 'Enter your discount code in the "Promo Code" field at checkout. Click "Apply" to see the discount reflected in your order total before completing payment.'
      },
    ]
  },
  {
    id: 'delivery',
    title: 'Delivery & Shipping',
    icon: <Truck className="w-6 h-6" />,
    description: 'Information about shipping, delivery times, and tracking',
    faqs: [
      {
        question: 'What are your delivery options?',
        answer: 'We offer Standard Delivery (2-3 business days, £3.99), Express Delivery (next business day, £6.99), and Same Day Delivery for orders placed before 12pm (£9.99). Free standard delivery on orders over £50.'
      },
      {
        question: 'Do you deliver to my area?',
        answer: 'We currently deliver across the United Kingdom mainland. Enter your postcode at checkout to confirm delivery availability and options for your area. Some remote areas may have limited delivery options.'
      },
      {
        question: 'How can I track my order?',
        answer: 'Once your order is dispatched, you will receive an email with tracking information. You can also track your order by logging into your account and viewing your order history.'
      },
      {
        question: 'What happens if I miss my delivery?',
        answer: 'If you miss a delivery, the courier will leave a card with instructions. Most carriers will attempt redelivery the next business day or leave the parcel at a nearby collection point.'
      },
      {
        question: 'Can I change my delivery address?',
        answer: 'You can change your delivery address before the order is dispatched. Please contact customer support as soon as possible with your order number and new address.'
      },
    ]
  },
  {
    id: 'returns',
    title: 'Returns & Refunds',
    icon: <RotateCcw className="w-6 h-6" />,
    description: 'Our return policy and refund process',
    faqs: [
      {
        question: 'What is your return policy?',
        answer: 'We offer a 14-day return policy for non-perishable items in their original, unopened condition. Perishable goods can be returned within 24 hours of delivery if there are quality issues.'
      },
      {
        question: 'How do I return an item?',
        answer: 'Log into your account, go to Order History, select the order and item you wish to return, and follow the prompts. You will receive a prepaid return label via email.'
      },
      {
        question: 'When will I receive my refund?',
        answer: 'Refunds are processed within 5-7 business days after we receive the returned item. The refund will be credited to your original payment method.'
      },
      {
        question: 'What if my item arrived damaged?',
        answer: 'We apologise for any damaged items. Please take photos of the damage and contact us within 24 hours of delivery. We will arrange a replacement or full refund.'
      },
      {
        question: 'Can I exchange an item?',
        answer: 'We do not offer direct exchanges. Please return the unwanted item for a refund and place a new order for the item you want.'
      },
    ]
  },
  {
    id: 'payments',
    title: 'Payments & Security',
    icon: <CreditCard className="w-6 h-6" />,
    description: 'Payment methods, security, and billing',
    faqs: [
      {
        question: 'Is my payment information secure?',
        answer: 'Yes, absolutely. We use industry-standard SSL encryption and all payments are processed through Stripe, a PCI-compliant payment provider. We never store your full card details on our servers.'
      },
      {
        question: 'Why was my payment declined?',
        answer: 'Payments can be declined for various reasons including insufficient funds, incorrect card details, or security flags from your bank. Please verify your details and try again, or use an alternative payment method.'
      },
      {
        question: 'When is my card charged?',
        answer: 'Your card is charged when you complete the checkout process. If an item is out of stock after ordering, we will refund the relevant amount.'
      },
      {
        question: 'Do you offer payment plans?',
        answer: 'Currently, we do not offer payment plans or buy-now-pay-later options. All orders must be paid in full at checkout.'
      },
    ]
  },
  {
    id: 'account',
    title: 'Account & Profile',
    icon: <User className="w-6 h-6" />,
    description: 'Managing your account and preferences',
    faqs: [
      {
        question: 'How do I create an account?',
        answer: 'Click "Sign Up" in the header and enter your email address and password. You can also sign up using your Google account for faster registration.'
      },
      {
        question: 'I forgot my password. What should I do?',
        answer: 'Click "Sign In" and then "Forgot Password". Enter your email address and we will send you a link to reset your password.'
      },
      {
        question: 'How do I update my account details?',
        answer: 'Log into your account and go to "Account Settings". Here you can update your name, email, password, delivery addresses, and communication preferences.'
      },
      {
        question: 'How do I delete my account?',
        answer: 'To delete your account, please contact our customer support team. Note that deleting your account will remove all your order history and saved preferences.'
      },
    ]
  },
  {
    id: 'vendors',
    title: 'Selling on Our Platform',
    icon: <Store className="w-6 h-6" />,
    description: 'Information for vendors and sellers',
    faqs: [
      {
        question: 'How can I sell on your platform?',
        answer: 'We welcome quality vendors! Click "Become a Seller" in the footer and complete the vendor application form. Our team will review your application within 3-5 business days.'
      },
      {
        question: 'What are the requirements to become a vendor?',
        answer: 'Vendors must have a registered UK business, appropriate food handling certifications (if selling food products), and meet our quality standards. Full details are provided in the application.'
      },
      {
        question: 'What fees do vendors pay?',
        answer: 'We charge a commission of 10-15% per sale depending on category, plus a small monthly platform fee. Detailed fee structure is provided upon application approval.'
      },
      {
        question: 'How do vendor payouts work?',
        answer: 'Vendor earnings are paid out weekly via bank transfer. You can view your earnings and payout history in the vendor dashboard.'
      },
    ]
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>('orders')
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  const toggleQuestion = (categoryId: string, questionIndex: number) => {
    const key = `${categoryId}-${questionIndex}`
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedQuestions(newExpanded)
  }

  // Filter FAQs based on search
  const filteredCategories = searchQuery
    ? faqCategories.map(category => ({
        ...category,
        faqs: category.faqs.filter(
          faq =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.faqs.length > 0)
    : faqCategories

  const totalResults = filteredCategories.reduce((sum, cat) => sum + cat.faqs.length, 0)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Help Center</h1>
            <p className="text-blue-100 max-w-2xl mx-auto mb-8">
              Find answers to common questions or get in touch with our support team
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              {searchQuery && (
                <p className="mt-3 text-blue-100 text-sm">
                  Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{searchQuery}"
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 -mt-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Live Chat</h3>
            <p className="text-sm text-slate-500 mb-4">Chat with our support team for instant help</p>
            <button className="text-emerald-600 font-medium text-sm hover:underline">
              Start Chat
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Email Support</h3>
            <p className="text-sm text-slate-500 mb-4">Get a response within 24 hours</p>
            <Link href="/contact" className="text-blue-600 font-medium text-sm hover:underline">
              Contact Us
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Phone Support</h3>
            <p className="text-sm text-slate-500 mb-4">Mon-Fri, 9am-6pm GMT</p>
            <a href="tel:+441onal234567890" className="text-purple-600 font-medium text-sm hover:underline">
              0800 123 4567
            </a>
          </div>
        </div>

        {/* FAQ Categories */}
        {searchQuery ? (
          // Search Results View
          <div className="space-y-6">
            {filteredCategories.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-semibold text-slate-900 mb-2">No results found</h3>
                <p className="text-slate-500 mb-6">
                  Try different keywords or browse the categories below
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-emerald-600 font-medium hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div key={category.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="text-emerald-600">{category.icon}</div>
                      <h3 className="font-semibold text-slate-900">{category.title}</h3>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {category.faqs.map((faq, index) => (
                      <div key={index} className="p-4">
                        <button
                          onClick={() => toggleQuestion(category.id, index)}
                          className="w-full text-left flex items-start gap-3"
                        >
                          <ChevronDown
                            className={`w-5 h-5 text-slate-400 mt-0.5 transition-transform flex-shrink-0 ${
                              expandedQuestions.has(`${category.id}-${index}`) ? 'rotate-180' : ''
                            }`}
                          />
                          <span className="font-medium text-slate-900">{faq.question}</span>
                        </button>
                        {expandedQuestions.has(`${category.id}-${index}`) && (
                          <div className="mt-3 ml-8 text-slate-600 text-sm leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Category View
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Category List */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Categories</h2>
              <div className="space-y-2">
                {faqCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setExpandedCategory(category.id)}
                    className={`w-full text-left p-4 rounded-xl transition-colors ${
                      expandedCategory === category.id
                        ? 'bg-emerald-50 border-2 border-emerald-200'
                        : 'bg-white border border-slate-200 hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={expandedCategory === category.id ? 'text-emerald-600' : 'text-slate-400'}>
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium ${
                          expandedCategory === category.id ? 'text-emerald-700' : 'text-slate-900'
                        }`}>
                          {category.title}
                        </h3>
                        <p className="text-sm text-slate-500">{category.faqs.length} articles</p>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${
                        expandedCategory === category.id ? 'text-emerald-600' : 'text-slate-300'
                      }`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ Content */}
            <div className="lg:col-span-2">
              {expandedCategory && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {(() => {
                    const category = faqCategories.find(c => c.id === expandedCategory)
                    if (!category) return null

                    return (
                      <>
                        <div className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="text-emerald-600">{category.icon}</div>
                            <div>
                              <h2 className="text-xl font-semibold text-slate-900">{category.title}</h2>
                              <p className="text-sm text-slate-500">{category.description}</p>
                            </div>
                          </div>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {category.faqs.map((faq, index) => (
                            <div key={index} className="p-6">
                              <button
                                onClick={() => toggleQuestion(category.id, index)}
                                className="w-full text-left flex items-start gap-3"
                              >
                                <ChevronDown
                                  className={`w-5 h-5 text-emerald-500 mt-0.5 transition-transform flex-shrink-0 ${
                                    expandedQuestions.has(`${category.id}-${index}`) ? 'rotate-180' : ''
                                  }`}
                                />
                                <span className="font-medium text-slate-900">{faq.question}</span>
                              </button>
                              {expandedQuestions.has(`${category.id}-${index}`) && (
                                <div className="mt-4 ml-8 text-slate-600 leading-relaxed">
                                  {faq.answer}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Still Need Help Section */}
        <div className="mt-12 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Still need help?</h2>
          <p className="text-slate-300 mb-6 max-w-xl mx-auto">
            Can't find what you're looking for? Our support team is here to help you with any questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl font-medium hover:bg-slate-100 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Contact Support
            </Link>
            <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors">
              <MessageCircle className="w-5 h-5" />
              Start Live Chat
            </button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>Average response time: 2 hours</span>
          </div>
        </div>
      </div>
    </div>
  )
}
