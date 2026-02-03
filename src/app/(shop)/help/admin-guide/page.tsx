'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Store,
  Settings,
  BarChart3,
  Shield,
  ArrowRight,
  BookOpen,
  HelpCircle,
  MessageCircle,
  FileText,
  Tag,
  Truck,
  Mail,
  Upload,
  History,
  Bell,
  Gift,
  Headphones,
  Bot,
} from 'lucide-react'

const guideCategories = [
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    icon: <LayoutDashboard className="w-6 h-6" />,
    color: 'emerald',
    articles: [
      {
        title: 'Understanding Your Dashboard',
        content: `
          <p>The admin dashboard provides a comprehensive overview of your marketplace:</p>
          <ul>
            <li><strong>Revenue Metrics:</strong> Total revenue, monthly revenue, and trends</li>
            <li><strong>Order Statistics:</strong> Total orders, pending, processing, and completed</li>
            <li><strong>User Growth:</strong> Total customers and new registrations</li>
            <li><strong>System Health:</strong> Monitor API, database, and CDN status</li>
            <li><strong>Recent Activity:</strong> Latest orders, reviews, and new users</li>
          </ul>
        `
      },
      {
        title: 'Key Performance Indicators',
        content: `
          <p>Monitor these KPIs for business health:</p>
          <ul>
            <li><strong>Conversion Rate:</strong> Visitor to customer ratio</li>
            <li><strong>Average Order Value:</strong> Revenue per order</li>
            <li><strong>Fulfillment Rate:</strong> Order completion percentage</li>
            <li><strong>Customer Satisfaction:</strong> Average review rating</li>
          </ul>
        `
      },
    ]
  },
  {
    id: 'products',
    title: 'Product Management',
    icon: <Package className="w-6 h-6" />,
    color: 'blue',
    articles: [
      {
        title: 'Managing Products',
        content: `
          <p>Admin product management features:</p>
          <ul>
            <li><strong>View All Products:</strong> See products from all vendors</li>
            <li><strong>Approve/Reject:</strong> Review vendor product submissions</li>
            <li><strong>Edit Products:</strong> Modify any product details</li>
            <li><strong>Feature Products:</strong> Highlight products on homepage</li>
            <li><strong>Bulk Actions:</strong> Update multiple products at once</li>
          </ul>
        `
      },
      {
        title: 'Category Management',
        content: `
          <p>Organise your product catalog:</p>
          <ul>
            <li>Create and edit categories</li>
            <li>Set category images and icons</li>
            <li>Arrange category hierarchy</li>
            <li>Manage category visibility</li>
          </ul>
        `
      },
      {
        title: 'Stock Alerts',
        content: `
          <p>Monitor inventory levels:</p>
          <ul>
            <li>Configure low stock thresholds</li>
            <li>Receive notifications for out-of-stock items</li>
            <li>View all low-stock products in one place</li>
            <li>Contact vendors about restocking</li>
          </ul>
        `
      },
    ]
  },
  {
    id: 'orders',
    title: 'Order Management',
    icon: <ShoppingCart className="w-6 h-6" />,
    color: 'purple',
    articles: [
      {
        title: 'Processing Orders',
        content: `
          <p>Order management workflow:</p>
          <ul>
            <li><strong>View Orders:</strong> See all orders with filtering options</li>
            <li><strong>Order Status:</strong> Update status (pending, processing, shipped, delivered)</li>
            <li><strong>Order Details:</strong> View customer info, items, and shipping details</li>
            <li><strong>Invoices:</strong> Generate and download order invoices</li>
            <li><strong>Refunds:</strong> Process refund requests</li>
          </ul>
        `
      },
      {
        title: 'Abandoned Carts',
        content: `
          <p>Recover lost sales:</p>
          <ul>
            <li>View abandoned cart statistics</li>
            <li>See cart contents and values</li>
            <li>Send recovery emails to customers</li>
            <li>Track recovery success rate</li>
          </ul>
        `
      },
    ]
  },
  {
    id: 'vendors',
    title: 'Vendor Management',
    icon: <Store className="w-6 h-6" />,
    color: 'orange',
    articles: [
      {
        title: 'Managing Vendors',
        content: `
          <p>Vendor administration:</p>
          <ul>
            <li><strong>Vendor List:</strong> View all registered vendors</li>
            <li><strong>Performance:</strong> Track vendor sales and ratings</li>
            <li><strong>Commission:</strong> Set and adjust commission rates</li>
            <li><strong>Status:</strong> Activate, suspend, or remove vendors</li>
          </ul>
        `
      },
      {
        title: 'Vendor Applications',
        content: `
          <p>Review new vendor applications:</p>
          <ul>
            <li>View pending applications</li>
            <li>Review business documentation</li>
            <li>Approve or reject applications</li>
            <li>Send feedback to applicants</li>
          </ul>
        `
      },
    ]
  },
  {
    id: 'users',
    title: 'User Management',
    icon: <Users className="w-6 h-6" />,
    color: 'pink',
    articles: [
      {
        title: 'Managing Users',
        content: `
          <p>User administration features:</p>
          <ul>
            <li><strong>User List:</strong> View all registered customers</li>
            <li><strong>User Details:</strong> View profile, orders, and activity</li>
            <li><strong>Roles:</strong> Assign admin or moderator roles</li>
            <li><strong>Status:</strong> Suspend or reactivate accounts</li>
          </ul>
        `
      },
      {
        title: 'Team Management',
        content: `
          <p>Manage your admin team:</p>
          <ul>
            <li>Add new team members</li>
            <li>Assign roles and permissions</li>
            <li>Track admin activity</li>
            <li>Remove team access when needed</li>
          </ul>
        `
      },
    ]
  },
  {
    id: 'marketing',
    title: 'Marketing & Promotions',
    icon: <Tag className="w-6 h-6" />,
    color: 'green',
    articles: [
      {
        title: 'Managing Coupons',
        content: `
          <p>Create and manage discount codes:</p>
          <ul>
            <li>Create percentage or fixed amount discounts</li>
            <li>Set usage limits and expiry dates</li>
            <li>Restrict to specific products or categories</li>
            <li>Track coupon performance</li>
          </ul>
        `
      },
      {
        title: 'Multi-Buy Offers',
        content: `
          <p>Set up promotional offers:</p>
          <ul>
            <li>Create "Buy X Get Y" deals</li>
            <li>Set bundle discounts</li>
            <li>Schedule promotional periods</li>
            <li>Feature deals on homepage</li>
          </ul>
        `
      },
      {
        title: 'Gift Cards',
        content: `
          <p>Manage gift card system:</p>
          <ul>
            <li>Issue new gift cards</li>
            <li>Track redemptions</li>
            <li>Set denominations</li>
            <li>View gift card balance history</li>
          </ul>
        `
      },
      {
        title: 'Hero Slides',
        content: `
          <p>Manage homepage banners:</p>
          <ul>
            <li>Create eye-catching hero slides</li>
            <li>Set slide order and timing</li>
            <li>Link to promotions or categories</li>
            <li>Schedule slide display periods</li>
          </ul>
        `
      },
    ]
  },
  {
    id: 'support',
    title: 'Customer Support',
    icon: <Headphones className="w-6 h-6" />,
    color: 'cyan',
    articles: [
      {
        title: 'Live Support',
        content: `
          <p>Real-time customer assistance:</p>
          <ul>
            <li>View active chat sessions</li>
            <li>Respond to customer inquiries</li>
            <li>Transfer chats to team members</li>
            <li>View chat history</li>
          </ul>
        `
      },
      {
        title: 'Product Q&A',
        content: `
          <p>Manage customer questions:</p>
          <ul>
            <li>View pending questions</li>
            <li>Publish answers</li>
            <li>Forward to vendors</li>
            <li>Moderate inappropriate content</li>
          </ul>
        `
      },
      {
        title: 'AI Chatbot',
        content: `
          <p>Configure automated support:</p>
          <ul>
            <li>Train chatbot responses</li>
            <li>Set up FAQ auto-replies</li>
            <li>Review chatbot conversations</li>
            <li>Improve AI accuracy over time</li>
          </ul>
        `
      },
    ]
  },
  {
    id: 'settings',
    title: 'System Settings',
    icon: <Settings className="w-6 h-6" />,
    color: 'slate',
    articles: [
      {
        title: 'General Settings',
        content: `
          <p>Configure platform settings:</p>
          <ul>
            <li>Store name and branding</li>
            <li>Contact information</li>
            <li>Currency and tax settings</li>
            <li>Email notifications</li>
          </ul>
        `
      },
      {
        title: 'Delivery Settings',
        content: `
          <p>Configure shipping options:</p>
          <ul>
            <li>Delivery zones and rates</li>
            <li>Free delivery thresholds</li>
            <li>Delivery time slots</li>
            <li>Carrier integrations</li>
          </ul>
        `
      },
      {
        title: 'Email Templates',
        content: `
          <p>Customise email communications:</p>
          <ul>
            <li>Order confirmation emails</li>
            <li>Shipping notifications</li>
            <li>Welcome emails</li>
            <li>Password reset emails</li>
          </ul>
        `
      },
      {
        title: 'Activity Logs',
        content: `
          <p>Monitor system activity:</p>
          <ul>
            <li>View all admin actions</li>
            <li>Track changes to products and orders</li>
            <li>Monitor login activity</li>
            <li>Export logs for auditing</li>
          </ul>
        `
      },
    ]
  },
]

export default function AdminGuidePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
            <Link href="/help" className="hover:text-white">Help Center</Link>
            <ArrowRight className="w-4 h-4" />
            <span>Admin Guide</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Admin Guide</h1>
              <p className="text-slate-400 mt-2">
                Complete documentation for managing your UK Grocery Store platform
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-12 -mt-8">
          {guideCategories.map((category) => (
            <a
              key={category.id}
              href={`#${category.id}`}
              className="bg-white rounded-xl border border-slate-200 p-3 text-center hover:border-emerald-300 hover:shadow-md transition-all"
            >
              <div className={`w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                category.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                category.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                category.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                category.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                category.color === 'green' ? 'bg-green-100 text-green-600' :
                category.color === 'pink' ? 'bg-pink-100 text-pink-600' :
                category.color === 'cyan' ? 'bg-cyan-100 text-cyan-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                {category.icon}
              </div>
              <span className="text-xs font-medium text-slate-700">{category.title}</span>
            </a>
          ))}
        </div>

        {/* Guide Sections */}
        <div className="space-y-12">
          {guideCategories.map((category) => (
            <section key={category.id} id={category.id} className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  category.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                  category.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  category.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                  category.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                  category.color === 'green' ? 'bg-green-100 text-green-600' :
                  category.color === 'pink' ? 'bg-pink-100 text-pink-600' :
                  category.color === 'cyan' ? 'bg-cyan-100 text-cyan-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {category.icon}
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{category.title}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.articles.map((article, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-slate-900 mb-3">{article.title}</h3>
                    <div
                      className="text-sm text-slate-600 prose prose-sm prose-slate max-w-none
                        [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-4 [&>ul]:space-y-1
                        [&>ol]:list-decimal [&>ol]:pl-4 [&>ol]:space-y-1
                        [&_strong]:text-slate-700"
                      dangerouslySetInnerHTML={{ __html: article.content }}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Need Help Section */}
        <div className="mt-16 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">Need Technical Support?</h2>
          <p className="text-slate-400 mb-6 max-w-xl mx-auto">
            Our technical team is available to help with any platform issues.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:support@ukgrocery.com"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Email Support
            </a>
            <Link
              href="/help"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
