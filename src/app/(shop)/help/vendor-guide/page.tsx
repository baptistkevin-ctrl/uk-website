'use client'

import Link from 'next/link'
import {
  Store,
  Package,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Settings,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  HelpCircle,
  MessageCircle,
  BookOpen,
  Truck,
  Tag,
  Star,
  Users,
  TrendingUp,
  Shield,
} from 'lucide-react'

const guideCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <Store className="w-6 h-6" />,
    color: 'emerald',
    articles: [
      {
        title: 'Setting Up Your Vendor Account',
        content: `
          <p>Welcome to our marketplace! Here's how to get your vendor account set up:</p>
          <ol>
            <li><strong>Apply to Sell:</strong> Visit the "Become a Seller" page and complete the application form with your business details.</li>
            <li><strong>Verification:</strong> Our team will review your application within 3-5 business days.</li>
            <li><strong>Complete Onboarding:</strong> Once approved, you'll be guided through setting up your store profile and payment details.</li>
            <li><strong>Connect Stripe:</strong> Complete the Stripe Connect onboarding to receive payments directly to your bank account.</li>
          </ol>
        `
      },
      {
        title: 'Understanding Your Dashboard',
        content: `
          <p>Your vendor dashboard is your command center for managing your business:</p>
          <ul>
            <li><strong>Dashboard:</strong> Overview of sales, orders, and key metrics</li>
            <li><strong>Products:</strong> Add, edit, and manage your product listings</li>
            <li><strong>Orders:</strong> View and process customer orders</li>
            <li><strong>Analytics:</strong> Detailed insights into your store performance</li>
            <li><strong>Payouts:</strong> Track your earnings and payment history</li>
            <li><strong>Settings:</strong> Update your store profile and preferences</li>
          </ul>
        `
      },
      {
        title: 'Store Profile Best Practices',
        content: `
          <p>A complete store profile builds trust with customers:</p>
          <ul>
            <li><strong>Business Name:</strong> Use a clear, memorable name</li>
            <li><strong>Logo:</strong> Upload a professional logo (recommended 400x400px)</li>
            <li><strong>Description:</strong> Tell customers about your business and what makes you unique</li>
            <li><strong>Contact Info:</strong> Provide accurate contact details for customer inquiries</li>
            <li><strong>Business Address:</strong> Required for invoicing and trust</li>
          </ul>
        `
      },
    ]
  },
  {
    id: 'products',
    title: 'Managing Products',
    icon: <Package className="w-6 h-6" />,
    color: 'blue',
    articles: [
      {
        title: 'Adding Your First Product',
        content: `
          <p>Follow these steps to add a product:</p>
          <ol>
            <li>Navigate to Products > Add New Product</li>
            <li>Enter the product name, description, and pricing</li>
            <li>Select the appropriate category</li>
            <li>Upload high-quality product images (minimum 800x800px recommended)</li>
            <li>Set inventory quantity and SKU</li>
            <li>Add any variations (size, flavour, etc.) if applicable</li>
            <li>Click "Save" to publish or "Save as Draft" to review later</li>
          </ol>
        `
      },
      {
        title: 'Product Photography Tips',
        content: `
          <p>Great photos sell products. Here are some tips:</p>
          <ul>
            <li><strong>Lighting:</strong> Use natural light or soft box lighting</li>
            <li><strong>Background:</strong> Clean white or neutral backgrounds work best</li>
            <li><strong>Multiple Angles:</strong> Show front, back, sides, and close-up details</li>
            <li><strong>Resolution:</strong> Upload high-resolution images (minimum 800x800px)</li>
            <li><strong>Consistency:</strong> Maintain consistent style across all product images</li>
          </ul>
        `
      },
      {
        title: 'Writing Product Descriptions',
        content: `
          <p>Effective descriptions drive sales:</p>
          <ul>
            <li><strong>Key Features:</strong> List the most important features first</li>
            <li><strong>Benefits:</strong> Explain how the product helps the customer</li>
            <li><strong>Specifications:</strong> Include size, weight, ingredients, etc.</li>
            <li><strong>Keywords:</strong> Use relevant keywords for search visibility</li>
            <li><strong>Formatting:</strong> Use bullet points for easy scanning</li>
          </ul>
        `
      },
      {
        title: 'Inventory Management',
        content: `
          <p>Keep your inventory accurate to avoid overselling:</p>
          <ul>
            <li><strong>Stock Tracking:</strong> Update quantities after each sale</li>
            <li><strong>Low Stock Alerts:</strong> Set alerts to notify you when stock is low</li>
            <li><strong>Out of Stock:</strong> Products automatically hide when stock reaches zero</li>
            <li><strong>Bulk Updates:</strong> Use the import/export feature for bulk inventory updates</li>
          </ul>
        `
      },
    ]
  },
  {
    id: 'orders',
    title: 'Processing Orders',
    icon: <ShoppingCart className="w-6 h-6" />,
    color: 'purple',
    articles: [
      {
        title: 'Order Workflow',
        content: `
          <p>Understanding order statuses:</p>
          <ul>
            <li><strong>Pending:</strong> New order awaiting processing</li>
            <li><strong>Processing:</strong> Order is being prepared</li>
            <li><strong>Shipped:</strong> Order has been dispatched</li>
            <li><strong>Delivered:</strong> Order successfully delivered</li>
            <li><strong>Cancelled:</strong> Order was cancelled</li>
          </ul>
          <p>Process orders promptly to maintain good customer satisfaction ratings.</p>
        `
      },
      {
        title: 'Printing Invoices',
        content: `
          <p>Generate professional invoices for your orders:</p>
          <ol>
            <li>Go to Orders and select an order</li>
            <li>Click the "Print Invoice" button</li>
            <li>A printable invoice will be generated with all order details</li>
            <li>Include the invoice in your shipment for the customer</li>
          </ol>
        `
      },
      {
        title: 'Handling Refunds',
        content: `
          <p>If a customer requests a refund:</p>
          <ol>
            <li>Review the refund request in your orders</li>
            <li>Contact the customer if clarification is needed</li>
            <li>Process the refund through the order details</li>
            <li>The refund amount will be deducted from your next payout</li>
          </ol>
        `
      },
    ]
  },
  {
    id: 'shipping',
    title: 'Shipping & Delivery',
    icon: <Truck className="w-6 h-6" />,
    color: 'orange',
    articles: [
      {
        title: 'Setting Shipping Options',
        content: `
          <p>Configure your shipping settings:</p>
          <ul>
            <li><strong>Shipping Rates:</strong> Set flat rate or weight-based shipping</li>
            <li><strong>Free Shipping:</strong> Offer free shipping above a certain order value</li>
            <li><strong>Delivery Areas:</strong> Specify which areas you ship to</li>
            <li><strong>Processing Time:</strong> Set realistic processing times</li>
          </ul>
        `
      },
      {
        title: 'Packaging Guidelines',
        content: `
          <p>Proper packaging ensures products arrive safely:</p>
          <ul>
            <li>Use appropriate box sizes to minimise movement</li>
            <li>Include sufficient padding for fragile items</li>
            <li>Seal packages securely</li>
            <li>Include packing slip and invoice</li>
            <li>Consider eco-friendly packaging options</li>
          </ul>
        `
      },
    ]
  },
  {
    id: 'payments',
    title: 'Payments & Payouts',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'green',
    articles: [
      {
        title: 'Understanding Fees',
        content: `
          <p>Our fee structure:</p>
          <ul>
            <li><strong>Commission:</strong> 10-15% per sale (varies by category)</li>
            <li><strong>Payment Processing:</strong> Included in commission</li>
            <li><strong>No Monthly Fees:</strong> You only pay when you make sales</li>
          </ul>
          <p>All fees are automatically deducted before payout.</p>
        `
      },
      {
        title: 'Payout Schedule',
        content: `
          <p>How payouts work:</p>
          <ul>
            <li>Payouts are processed weekly</li>
            <li>Minimum payout threshold: £10</li>
            <li>Funds are sent to your connected bank account via Stripe</li>
            <li>Allow 2-3 business days for funds to arrive</li>
          </ul>
        `
      },
      {
        title: 'Tax Information',
        content: `
          <p>Important tax considerations:</p>
          <ul>
            <li>You are responsible for reporting your sales income</li>
            <li>VAT-registered vendors should add their VAT number</li>
            <li>Download sales reports for your accounting needs</li>
            <li>Consult with a tax professional for specific advice</li>
          </ul>
        `
      },
    ]
  },
  {
    id: 'performance',
    title: 'Growing Your Sales',
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'pink',
    articles: [
      {
        title: 'Optimising Listings',
        content: `
          <p>Improve your product visibility:</p>
          <ul>
            <li><strong>Keywords:</strong> Use relevant search terms in titles and descriptions</li>
            <li><strong>Categories:</strong> Select the most accurate category</li>
            <li><strong>Images:</strong> High-quality images get more clicks</li>
            <li><strong>Pricing:</strong> Competitive pricing attracts buyers</li>
            <li><strong>Reviews:</strong> Encourage satisfied customers to leave reviews</li>
          </ul>
        `
      },
      {
        title: 'Using Analytics',
        content: `
          <p>Monitor your performance:</p>
          <ul>
            <li><strong>Views:</strong> Track how many people see your products</li>
            <li><strong>Conversion Rate:</strong> Views to sales ratio</li>
            <li><strong>Top Products:</strong> Identify your best sellers</li>
            <li><strong>Revenue Trends:</strong> Track growth over time</li>
          </ul>
        `
      },
      {
        title: 'Customer Service Tips',
        content: `
          <p>Great service leads to repeat customers:</p>
          <ul>
            <li>Respond to inquiries within 24 hours</li>
            <li>Be professional and courteous</li>
            <li>Resolve issues promptly</li>
            <li>Follow up after delivery</li>
            <li>Ask for reviews from satisfied customers</li>
          </ul>
        `
      },
    ]
  },
]

export default function VendorGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-(--brand-dark) text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-white/50 text-sm mb-4">
            <Link href="/help" className="hover:text-white">Help Center</Link>
            <ArrowRight className="w-4 h-4" />
            <span>Seller Guide</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-(--color-surface)/20 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Seller Guide</h1>
              <p className="text-white/70 mt-2">
                Everything you need to know to succeed as a vendor on our platform
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12 -mt-8">
          {guideCategories.map((category) => (
            <a
              key={category.id}
              href={`#${category.id}`}
              className="bg-(--color-surface) rounded-xl border border-(--color-border) p-4 text-center hover:border-(--brand-primary) hover:shadow-md transition-all"
            >
              <div className={`w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                category.color === 'emerald' ? 'bg-(--brand-primary-light) text-(--brand-primary)' :
                category.color === 'blue' ? 'bg-(--color-info-bg) text-(--color-info)' :
                category.color === 'purple' ? 'bg-(--color-info-bg) text-(--color-info)' :
                category.color === 'orange' ? 'bg-(--brand-amber-soft) text-(--brand-amber)' :
                category.color === 'green' ? 'bg-(--brand-primary-light) text-(--brand-primary)' :
                'bg-(--color-error-bg) text-(--color-error)'
              }`}>
                {category.icon}
              </div>
              <span className="text-sm font-medium text-(--color-text-secondary)">{category.title}</span>
            </a>
          ))}
        </div>

        {/* Guide Sections */}
        <div className="space-y-12">
          {guideCategories.map((category) => (
            <section key={category.id} id={category.id} className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  category.color === 'emerald' ? 'bg-(--brand-primary-light) text-(--brand-primary)' :
                  category.color === 'blue' ? 'bg-(--color-info-bg) text-(--color-info)' :
                  category.color === 'purple' ? 'bg-(--color-info-bg) text-(--color-info)' :
                  category.color === 'orange' ? 'bg-(--brand-amber-soft) text-(--brand-amber)' :
                  category.color === 'green' ? 'bg-(--brand-primary-light) text-(--brand-primary)' :
                  'bg-(--color-error-bg) text-(--color-error)'
                }`}>
                  {category.icon}
                </div>
                <h2 className="text-2xl font-bold text-foreground">{category.title}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.articles.map((article, index) => (
                  <div
                    key={index}
                    className="bg-(--color-surface) rounded-xl border border-(--color-border) p-6 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-foreground mb-3">{article.title}</h3>
                    <div
                      className="text-sm text-(--color-text-secondary) prose prose-sm max-w-none
                        [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:space-y-1
                        [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:space-y-1
                        [&_strong]:text-(--color-text-secondary)"
                      dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Need Help Section */}
        <div className="mt-16 bg-(--brand-dark) rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Need More Help?</h2>
          <p className="text-white/70 mb-6 max-w-xl mx-auto">
            Our vendor support team is here to help you succeed. Reach out anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact?from=vendor"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-(--color-surface) text-(--brand-primary) rounded-xl font-medium hover:bg-(--color-surface)/90 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Contact Vendor Support
            </Link>
            <Link
              href="/help"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-(--brand-primary) text-white rounded-xl font-medium hover:bg-(--brand-primary-hover) transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              Visit Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
