export async function register() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join('\n  ')}\n\nSee .env.example for reference.`
    )
  }

  const recommended = [
    'RESEND_API_KEY',
    'CRON_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
  ]

  const missingRecommended = recommended.filter((key) => !process.env[key])

  if (missingRecommended.length > 0) {
    console.warn(
      `[startup] Missing recommended env variables (some features will be disabled):\n  ${missingRecommended.join('\n  ')}`
    )
  }

  // Security: Validate CRON_SECRET strength
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && cronSecret.length < 32) {
    console.warn(
      '[security] CRON_SECRET is too short (< 32 chars). Generate a strong secret: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    )
  }

  // Security: Validate Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl && !supabaseUrl.startsWith('https://') && process.env.NODE_ENV === 'production') {
    console.warn('[security] NEXT_PUBLIC_SUPABASE_URL should use HTTPS in production')
  }

  // Security: Validate Stripe keys match environment
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (stripeKey && process.env.NODE_ENV === 'production' && stripeKey.startsWith('sk_test_')) {
    console.warn('[security] Using Stripe test key in production environment')
  }
}
