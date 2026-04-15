import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { GiftCardPurchaseForm } from '@/components/gift-cards/gift-card-purchase-form'
import { GiftCardBalance } from '@/components/gift-cards/gift-card-balance'
import { Gift, CreditCard, Mail, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Gift Cards | UK Grocery',
  description: 'Give the gift of fresh groceries with a UK Grocery gift card'
}

export const dynamic = 'force-dynamic'

export default async function GiftCardsPage() {
  const supabase = await createClient()

  // Get gift card designs
  const { data: designs } = await supabase
    .from('gift_card_designs')
    .select('*')
    .eq('is_active', true)
    .order('order_index')

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-(--brand-dark) text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 bg-(--color-surface)/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Gift className="h-10 w-10" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">UK Grocery Gift Cards</h1>
            <p className="text-xl text-white/70">
              Give the gift of fresh groceries to someone special
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-(--color-surface) rounded-xl p-6 shadow-sm border border-(--color-border) text-center">
              <div className="w-12 h-12 bg-(--brand-primary-light) rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-(--brand-primary)" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Instant Delivery</h3>
              <p className="text-sm text-(--color-text-muted)">
                Send via email instantly or schedule for a special date
              </p>
            </div>
            <div className="bg-(--color-surface) rounded-xl p-6 shadow-sm border border-(--color-border) text-center">
              <div className="w-12 h-12 bg-(--brand-primary-light) rounded-xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-6 w-6 text-(--brand-primary)" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Any Amount</h3>
              <p className="text-sm text-(--color-text-muted)">
                Choose any value from £5 to £500
              </p>
            </div>
            <div className="bg-(--color-surface) rounded-xl p-6 shadow-sm border border-(--color-border) text-center">
              <div className="w-12 h-12 bg-(--brand-primary-light) rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-(--brand-primary)" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Never Expires</h3>
              <p className="text-sm text-(--color-text-muted)">
                Valid for 12 months from purchase date
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Purchase Form */}
            <div className="lg:col-span-2">
              <div className="bg-(--color-surface) rounded-2xl shadow-sm border border-(--color-border) p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">
                  Purchase a Gift Card
                </h2>
                <GiftCardPurchaseForm
                  designs={designs || []}
                  isLoggedIn={!!user}
                  userEmail={user?.email}
                />
              </div>
            </div>

            {/* Check Balance */}
            <div>
              <div className="bg-(--color-surface) rounded-2xl shadow-sm border border-(--color-border) p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">
                  Check Your Balance
                </h2>
                <GiftCardBalance />
              </div>

              {/* FAQ */}
              <div className="bg-(--color-elevated) rounded-2xl p-6 mt-6">
                <h3 className="font-semibold text-foreground mb-4">Common Questions</h3>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-(--color-text-secondary)">How do I use my gift card?</p>
                    <p className="text-(--color-text-muted) mt-1">
                      Enter your gift card code at checkout to apply the balance to your order.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-(--color-text-secondary)">Can I use multiple gift cards?</p>
                    <p className="text-(--color-text-muted) mt-1">
                      Yes! You can combine multiple gift cards on a single order.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-(--color-text-secondary)">What if my order is more than my balance?</p>
                    <p className="text-(--color-text-muted) mt-1">
                      You can pay the remaining amount with another payment method.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
