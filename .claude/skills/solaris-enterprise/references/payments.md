# Payment & Billing Patterns

> For every Solaris project with money. Subscription lifecycle,
> Stripe Connect commissions, refunds, webhooks, failed payment recovery.

---

## 1. SUBSCRIPTION LIFECYCLE

```typescript
// src/services/subscription.service.ts

// The complete subscription state machine
type SubStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "paused"

const SUB_TRANSITIONS: Record<SubStatus, Partial<Record<string, SubStatus>>> = {
  trialing:    { ACTIVATE: "active", CANCEL: "canceled", EXPIRE: "incomplete" },
  active:      { PAYMENT_FAILED: "past_due", CANCEL: "canceled", PAUSE: "paused" },
  past_due:    { PAYMENT_SUCCEEDED: "active", CANCEL: "canceled" },
  canceled:    { RESUBSCRIBE: "active" },
  incomplete:  { PAYMENT_SUCCEEDED: "active", CANCEL: "canceled" },
  paused:      { RESUME: "active", CANCEL: "canceled" },
}

export const subscriptionService = {
  async create(userId: string, planId: string): Promise<Result<{ checkoutUrl: string }>> {
    // Prevent duplicate subscriptions
    const existing = await subRepository.findActiveByUserId(userId)
    if (existing) return fail("User already has an active subscription", "CONFLICT")

    // Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer(userId)

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      line_items: [{ price: await getStripePriceId(planId), quantity: 1 }],
      success_url: `${env.APP_URL}/dashboard?subscription=success`,
      cancel_url: `${env.APP_URL}/pricing?subscription=canceled`,
      metadata: { userId, planId },
      subscription_data: {
        trial_period_days: config.billing.trialDays,
        metadata: { userId, planId },
      },
    })

    return ok({ checkoutUrl: session.url! })
  },

  async handlePaymentFailed(stripeSubId: string): Promise<void> {
    const sub = await subRepository.findByStripeId(stripeSubId)
    if (!sub) return

    await subRepository.update(sub.id, { status: "past_due" })

    // Notify user
    const user = await userRepository.findById(sub.userId)
    if (user) {
      await emailService.send(user.email, "payment-failed", {
        updatePaymentUrl: `${env.APP_URL}/settings/billing`,
      })
    }

    // Schedule dunning: retry reminders at day 1, 3, 7
    await scheduleJob("payment-reminder", { userId: sub.userId, subId: sub.id }, { delay: "1d" })
    await scheduleJob("payment-reminder", { userId: sub.userId, subId: sub.id }, { delay: "3d" })
    await scheduleJob("payment-final-warning", { userId: sub.userId, subId: sub.id }, { delay: "7d" })

    logger.info("Payment failed — dunning started", { userId: sub.userId, subId: sub.id })
  },

  async cancel(userId: string): Promise<Result<void>> {
    const sub = await subRepository.findActiveByUserId(userId)
    if (!sub) return fail("No active subscription", "NOT_FOUND")

    // Cancel at period end (user keeps access until billing period ends)
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    await subRepository.update(sub.id, {
      cancelAt: sub.currentPeriodEnd,
    })

    await auditService.log({
      action: "subscription.cancel_requested",
      actor: { id: userId, type: "user" },
      resource: { type: "subscription", id: sub.id },
    })

    return ok(undefined)
  },
}
```

## 2. STRIPE CONNECT COMMISSION SPLITS

For marketplace apps where the platform takes a cut from vendors.

```typescript
// src/services/commission.service.ts

export const commissionService = {
  async processOrderPayment(order: Order): Promise<Result<{ paymentIntentId: string }>> {
    const vendor = await vendorRepository.findById(order.vendorId)
    if (!vendor?.stripeAccountId) {
      return fail("Vendor not connected to Stripe", "VENDOR_NOT_CONNECTED")
    }

    // Calculate split
    const commissionRate = vendor.commissionRate || config.billing.commissionRate
    const platformFeeCents = Math.round(order.totalCents * commissionRate)
    const vendorAmountCents = order.totalCents - platformFeeCents

    // Create payment with automatic split
    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.totalCents,
      currency: "gbp",
      customer: order.stripeCustomerId,
      application_fee_amount: platformFeeCents,   // Platform takes this
      transfer_data: {
        destination: vendor.stripeAccountId,      // Vendor gets the rest
      },
      metadata: {
        orderId: order.id,
        vendorId: vendor.id,
        platformFeeCents: String(platformFeeCents),
        vendorAmountCents: String(vendorAmountCents),
      },
    }, {
      idempotencyKey: `order_payment_${order.id}`, // Safe to retry
    })

    // Record the split
    await commissionRepository.create({
      orderId: order.id,
      vendorId: vendor.id,
      orderTotalCents: order.totalCents,
      platformFeeCents,
      vendorAmountCents,
      commissionRate,
      stripePaymentIntentId: paymentIntent.id,
      status: "pending",
    })

    logger.info("Commission calculated", {
      orderId: order.id,
      total: order.totalCents,
      platform: platformFeeCents,
      vendor: vendorAmountCents,
      rate: commissionRate,
    })

    return ok({ paymentIntentId: paymentIntent.id })
  },

  async processRefund(orderId: string, amountCents: number, reason: string): Promise<Result<void>> {
    const commission = await commissionRepository.findByOrderId(orderId)
    if (!commission) return fail("Commission record not found", "NOT_FOUND")

    // Proportional refund of commission
    const refundRate = amountCents / commission.orderTotalCents
    const platformRefundCents = Math.round(commission.platformFeeCents * refundRate)

    await stripe.refunds.create({
      payment_intent: commission.stripePaymentIntentId,
      amount: amountCents,
      reverse_transfer: true,           // Also refund the vendor's portion
      refund_application_fee: true,     // Also refund our commission
      reason: "requested_by_customer",
      metadata: { orderId, reason },
    })

    await commissionRepository.update(commission.id, {
      status: amountCents === commission.orderTotalCents ? "refunded" : "partially_refunded",
      refundedAmountCents: amountCents,
    })

    return ok(undefined)
  },
}
```

## 3. WEBHOOK HANDLER (Bullet-Proof)

```typescript
// src/app/api/v1/webhooks/stripe/route.ts

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Idempotent — safe to process the same event twice
  const processed = await webhookRepository.findByEventId(event.id)
  if (processed) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  // Record that we're processing this event
  await webhookRepository.create({ eventId: event.id, type: event.type, status: "processing" })

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await subscriptionService.activateFromCheckout(event.data.object)
        break
      case "customer.subscription.updated":
        await subscriptionService.syncFromStripe(event.data.object)
        break
      case "customer.subscription.deleted":
        await subscriptionService.deactivate(event.data.object)
        break
      case "invoice.paid":
        await invoiceService.recordPayment(event.data.object)
        break
      case "invoice.payment_failed":
        await subscriptionService.handlePaymentFailed(event.data.object.subscription as string)
        break
      case "account.updated":
        await vendorService.syncStripeStatus(event.data.object)
        break
    }

    await webhookRepository.update(event.id, { status: "completed" })
  } catch (error) {
    await webhookRepository.update(event.id, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown",
    })
    throw error // Stripe will retry
  }

  return NextResponse.json({ received: true })
}
```

## 4. MONEY RULES (NEVER BREAK THESE)

```typescript
// All money is integer cents — NEVER float
// $19.99 = 1999
// £12.50 = 1250

// Rounding: always Math.round(), always on the final result
const tax = Math.round(subtotalCents * taxRate)
const discount = Math.round(subtotalCents * discountPercent)
const total = subtotalCents + tax - discount

// Display: always use Intl.NumberFormat
function formatMoney(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100)
}

// Commission: round platform fee, vendor gets the remainder
// This ensures amounts always add up exactly
const platformCents = Math.round(totalCents * rate)
const vendorCents = totalCents - platformCents  // NOT: Math.round(totalCents * (1 - rate))
```
