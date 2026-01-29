import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/utils/format'
import { format } from 'date-fns'
import { Printer, Download, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface InvoicePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: InvoicePageProps): Promise<Metadata> {
  return {
    title: 'Invoice | FreshMart'
  }
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?redirect=/account/invoices/${id}` as any)
  }

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      items:invoice_items(
        *,
        product:products(name, sku, image_url)
      ),
      order:orders(
        id,
        order_number,
        created_at,
        payment_method
      )
    `)
    .eq('id', id)
    .single()

  if (error || !invoice) {
    notFound()
  }

  // Check ownership
  if (invoice.user_id !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      notFound()
    }
  }

  const billingAddress = invoice.billing_address as {
    line1?: string
    line2?: string
    city?: string
    postcode?: string
    country?: string
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="container mx-auto px-4">
        {/* Actions Bar - Hidden in print */}
        <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
          <Link
            href="/account/orders"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Invoice Document */}
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 print:shadow-none print:border-none">
          <div className="p-8 print:p-12">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-emerald-600 mb-2">FreshMart</h1>
                <p className="text-gray-500">Fresh Groceries Delivered</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">INVOICE</h2>
                <p className="text-gray-600 font-mono">{invoice.invoice_number}</p>
              </div>
            </div>

            {/* Invoice Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
                <p className="font-semibold text-gray-900">{invoice.billing_name}</p>
                {invoice.company_name && (
                  <p className="text-gray-700">{invoice.company_name}</p>
                )}
                <p className="text-gray-600">{invoice.billing_email}</p>
                {invoice.billing_phone && (
                  <p className="text-gray-600">{invoice.billing_phone}</p>
                )}
                <div className="mt-2 text-gray-600">
                  {billingAddress?.line1 && <p>{billingAddress.line1}</p>}
                  {billingAddress?.line2 && <p>{billingAddress.line2}</p>}
                  {billingAddress?.city && (
                    <p>
                      {billingAddress.city}
                      {billingAddress?.postcode && `, ${billingAddress.postcode}`}
                    </p>
                  )}
                </div>
                {invoice.company_vat_number && (
                  <p className="mt-2 text-gray-600">VAT: {invoice.company_vat_number}</p>
                )}
              </div>
              <div className="text-right">
                <div className="inline-block text-left">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <span className="text-gray-500">Invoice Date:</span>
                    <span className="font-medium text-gray-900">
                      {format(new Date(invoice.issue_date), 'dd MMM yyyy')}
                    </span>

                    {invoice.due_date && (
                      <>
                        <span className="text-gray-500">Due Date:</span>
                        <span className="font-medium text-gray-900">
                          {format(new Date(invoice.due_date), 'dd MMM yyyy')}
                        </span>
                      </>
                    )}

                    <span className="text-gray-500">Order Number:</span>
                    <span className="font-medium text-gray-900">
                      {invoice.order?.order_number || '-'}
                    </span>

                    <span className="text-gray-500">Status:</span>
                    <span className={`font-medium ${
                      invoice.status === 'paid'
                        ? 'text-emerald-600'
                        : invoice.status === 'cancelled'
                          ? 'text-red-600'
                          : 'text-amber-600'
                    }`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-sm font-semibold text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="text-center py-3 text-sm font-semibold text-gray-500 uppercase">
                    Qty
                  </th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-500 uppercase">
                    Unit Price
                  </th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-500 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: any) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-4">
                      <p className="font-medium text-gray-900">{item.description}</p>
                      {item.product?.sku && (
                        <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                      )}
                    </td>
                    <td className="py-4 text-center text-gray-700">
                      {item.quantity}
                    </td>
                    <td className="py-4 text-right text-gray-700">
                      {formatPrice(item.unit_price_pence)}
                    </td>
                    <td className="py-4 text-right font-medium text-gray-900">
                      {formatPrice(item.total_pence)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2 text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(invoice.subtotal_pence)}</span>
                </div>
                {invoice.discount_pence > 0 && (
                  <div className="flex justify-between py-2 text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatPrice(invoice.discount_pence)}</span>
                  </div>
                )}
                {invoice.shipping_pence > 0 && (
                  <div className="flex justify-between py-2 text-gray-600">
                    <span>Shipping</span>
                    <span>{formatPrice(invoice.shipping_pence)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 text-gray-600">
                  <span>VAT ({invoice.vat_rate}%)</span>
                  <span>{formatPrice(invoice.vat_amount_pence)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-900 font-bold text-lg text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(invoice.total_pence)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Payment Information</h4>
                  <p className="text-sm text-gray-600">
                    Payment Method: {invoice.order?.payment_method || 'Card'}
                  </p>
                  {invoice.paid_date && (
                    <p className="text-sm text-gray-600">
                      Paid on: {format(new Date(invoice.paid_date), 'dd MMM yyyy')}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Company Details</h4>
                  <p className="text-sm text-gray-600">FreshMart Ltd</p>
                  <p className="text-sm text-gray-600">123 Grocery Lane, London, UK</p>
                  <p className="text-sm text-gray-600">VAT: GB123456789</p>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-600">{invoice.notes}</p>
                </div>
              )}

              <p className="mt-8 text-center text-sm text-gray-400">
                Thank you for shopping with FreshMart!
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
