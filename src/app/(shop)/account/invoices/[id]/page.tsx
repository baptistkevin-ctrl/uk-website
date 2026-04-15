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
    title: 'Invoice | UK Grocery'
  }
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login?redirect=/account/invoices/' + id)
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
    <div className="min-h-screen bg-(--color-elevated) py-8 print:bg-(--color-surface) print:py-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Actions Bar - Hidden in print */}
        <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
          <Link
            href="/account/orders"
            className="flex items-center gap-2 text-(--color-text-secondary) hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 bg-(--color-surface) border border-(--color-border) rounded-lg hover:bg-background"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 bg-(--brand-primary) text-white rounded-lg hover:bg-(--brand-primary-hover)"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Invoice Document */}
        <div className="max-w-4xl mx-auto bg-(--color-surface) rounded-lg shadow-sm border border-(--color-border) print:shadow-none print:border-none">
          <div className="p-8 print:p-12">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-(--brand-primary) mb-2">UK Grocery</h1>
                <p className="text-(--color-text-muted)">Fresh Groceries Delivered</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-foreground mb-1">INVOICE</h2>
                <p className="text-(--color-text-secondary) font-mono">{invoice.invoice_number}</p>
              </div>
            </div>

            {/* Invoice Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-semibold text-(--color-text-muted) uppercase mb-2">Bill To</h3>
                <p className="font-semibold text-foreground">{invoice.billing_name}</p>
                {invoice.company_name && (
                  <p className="text-foreground">{invoice.company_name}</p>
                )}
                <p className="text-(--color-text-secondary)">{invoice.billing_email}</p>
                {invoice.billing_phone && (
                  <p className="text-(--color-text-secondary)">{invoice.billing_phone}</p>
                )}
                <div className="mt-2 text-(--color-text-secondary)">
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
                  <p className="mt-2 text-(--color-text-secondary)">VAT: {invoice.company_vat_number}</p>
                )}
              </div>
              <div className="text-right">
                <div className="inline-block text-left">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <span className="text-(--color-text-muted)">Invoice Date:</span>
                    <span className="font-medium text-foreground">
                      {format(new Date(invoice.issue_date), 'dd MMM yyyy')}
                    </span>

                    {invoice.due_date && (
                      <>
                        <span className="text-(--color-text-muted)">Due Date:</span>
                        <span className="font-medium text-foreground">
                          {format(new Date(invoice.due_date), 'dd MMM yyyy')}
                        </span>
                      </>
                    )}

                    <span className="text-(--color-text-muted)">Order Number:</span>
                    <span className="font-medium text-foreground">
                      {invoice.order?.order_number || '-'}
                    </span>

                    <span className="text-(--color-text-muted)">Status:</span>
                    <span className={`font-medium ${
                      invoice.status === 'paid'
                        ? 'text-(--brand-primary)'
                        : invoice.status === 'cancelled'
                          ? 'text-(--color-error)'
                          : 'text-(--brand-amber)'
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
                <tr className="border-b border-(--color-border)">
                  <th className="text-left py-3 text-sm font-semibold text-(--color-text-muted) uppercase">
                    Description
                  </th>
                  <th className="text-center py-3 text-sm font-semibold text-(--color-text-muted) uppercase">
                    Qty
                  </th>
                  <th className="text-right py-3 text-sm font-semibold text-(--color-text-muted) uppercase">
                    Unit Price
                  </th>
                  <th className="text-right py-3 text-sm font-semibold text-(--color-text-muted) uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: any) => (
                  <tr key={item.id} className="border-b border-(--color-border)">
                    <td className="py-4">
                      <p className="font-medium text-foreground">{item.description}</p>
                      {item.product?.sku && (
                        <p className="text-sm text-(--color-text-muted)">SKU: {item.product.sku}</p>
                      )}
                    </td>
                    <td className="py-4 text-center text-foreground">
                      {item.quantity}
                    </td>
                    <td className="py-4 text-right text-foreground">
                      {formatPrice(item.unit_price_pence)}
                    </td>
                    <td className="py-4 text-right font-medium text-foreground">
                      {formatPrice(item.total_pence)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2 text-(--color-text-secondary)">
                  <span>Subtotal</span>
                  <span>{formatPrice(invoice.subtotal_pence)}</span>
                </div>
                {invoice.discount_pence > 0 && (
                  <div className="flex justify-between py-2 text-(--brand-primary)">
                    <span>Discount</span>
                    <span>-{formatPrice(invoice.discount_pence)}</span>
                  </div>
                )}
                {invoice.shipping_pence > 0 && (
                  <div className="flex justify-between py-2 text-(--color-text-secondary)">
                    <span>Shipping</span>
                    <span>{formatPrice(invoice.shipping_pence)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 text-(--color-text-secondary)">
                  <span>VAT ({invoice.vat_rate}%)</span>
                  <span>{formatPrice(invoice.vat_amount_pence)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-gray-900 font-bold text-lg text-foreground">
                  <span>Total</span>
                  <span>{formatPrice(invoice.total_pence)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-(--color-border)">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Payment Information</h4>
                  <p className="text-sm text-(--color-text-secondary)">
                    Payment Method: {invoice.order?.payment_method || 'Card'}
                  </p>
                  {invoice.paid_date && (
                    <p className="text-sm text-(--color-text-secondary)">
                      Paid on: {format(new Date(invoice.paid_date), 'dd MMM yyyy')}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Company Details</h4>
                  <p className="text-sm text-(--color-text-secondary)">UK Grocery Store Ltd</p>
                  <p className="text-sm text-(--color-text-secondary)">123 Grocery Lane, London, UK</p>
                  <p className="text-sm text-(--color-text-secondary)">VAT: GB123456789</p>
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-6">
                  <h4 className="font-semibold text-foreground mb-2">Notes</h4>
                  <p className="text-sm text-(--color-text-secondary)">{invoice.notes}</p>
                </div>
              )}

              <p className="mt-8 text-center text-sm text-(--color-text-disabled)">
                Thank you for shopping with UK Grocery!
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
