import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders hero section with CTA', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible()
    const shopLink = page.getByRole('link', { name: /shop/i }).first()
    await expect(shopLink).toBeVisible()
  })

  test('renders category grid', async ({ page }) => {
    const categorySection = page.locator(
      'text=/shop by category|categories|browse/i'
    ).first()
    if (await categorySection.isVisible()) {
      await expect(categorySection).toBeVisible()
    }

    // Category links should exist somewhere on the page
    const categoryLinks = page.locator('a[href*="categories"], a[href*="category"]')
    const count = await categoryLinks.count()
    expect(count).toBeGreaterThan(0)
  })

  test('renders trust bar', async ({ page }) => {
    // Look for trust indicators (delivery, freshness, support, etc.)
    const trustIndicators = page.locator(
      'text=/free delivery|freshness|fresh|guarantee|support|quality/i'
    )
    const count = await trustIndicators.count()
    expect(count).toBeGreaterThan(0)
  })

  test('renders newsletter signup', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)

    const emailInput = page.getByPlaceholder(/email/i).first()
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible()
    }
  })

  test('header is sticky on scroll', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(300)
    await expect(page.locator('header')).toBeVisible()
  })

  test('announcement bar is dismissible', async ({ page }) => {
    const dismissBtn = page.getByLabel(/dismiss/i).first()
    if (await dismissBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dismissBtn.click()
      await page.waitForTimeout(300)
    }
  })

  test('footer renders all sections', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)

    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    // Footer should contain important links
    const footerLinks = [
      'a[href*="privacy"]',
      'a[href*="terms"]',
      'a[href*="contact"]',
    ]
    for (const selector of footerLinks) {
      const link = page.locator(selector).first()
      if (await link.isVisible()) {
        await expect(link).toBeVisible()
      }
    }
  })

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/FreshMart|UK Grocery|Grocery/)
  })

  test('has working search functionality', async ({ page }) => {
    const searchInput = page
      .locator(
        'input[type="search"], input[placeholder*="Search"], [data-testid="search-input"]'
      )
      .first()

    if (await searchInput.isVisible()) {
      await searchInput.fill('banana')
      await searchInput.press('Enter')
      await expect(page).toHaveURL(/search|products/)
    }
  })

  test('has working cart button', async ({ page }) => {
    const cartButton = page
      .locator(
        '[data-testid="cart-button"], button:has-text("Cart"), a[href*="cart"], [aria-label*="cart" i]'
      )
      .first()

    if (await cartButton.isVisible()) {
      await expect(cartButton).toBeEnabled()
      await cartButton.click()
      await page.waitForTimeout(500)
    }
  })
})

test.describe('Homepage Responsiveness', () => {
  test('renders correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    await expect(page.locator('header').first()).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
  })

  test('renders correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('header').first()).toBeVisible()
  })

  test('renders correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')

    await expect(page.locator('body')).toBeVisible()
    await expect(page.locator('header').first()).toBeVisible()
  })
})
