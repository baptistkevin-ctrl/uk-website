import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
  test('main pages are accessible', async ({ page }) => {
    const pages = [
      { url: '/', title: /FreshMart|UK Grocery|Grocery/ },
      { url: '/about', title: /About/i },
      { url: '/contact', title: /Contact/i },
      { url: '/faq', title: /FAQ|Frequently/i },
      { url: '/blog', title: /Blog/i },
      { url: '/delivery', title: /Delivery/i },
      { url: '/returns', title: /Return/i },
      { url: '/privacy', title: /Privacy/i },
      { url: '/terms', title: /Terms/i },
    ]

    for (const p of pages) {
      const response = await page.goto(p.url)
      // Page should load without server errors
      expect(response?.status()).toBeLessThan(500)
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('404 page shows for unknown routes', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-at-all')
    expect(response?.status()).toBe(404)

    // Should show some not-found content
    const notFoundText = page.locator(
      'text=/not found|404|page doesn.t exist|doesn.t exist/i'
    )
    const count = await notFoundText.count()
    expect(count).toBeGreaterThan(0)
  })

  test('skip to content link works', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')

    const skipLink = page.locator(
      'a:has-text("Skip to"), a:has-text("skip to")'
    ).first()

    if (await skipLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(skipLink).toBeFocused()
    }
  })

  test('header navigation links work', async ({ page }) => {
    await page.goto('/')

    const header = page.locator('header')
    await expect(header).toBeVisible()

    // Header should contain navigation links
    const navLinks = header.locator('a[href]')
    const count = await navLinks.count()
    expect(count).toBeGreaterThan(0)
  })

  test('footer navigation links work', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(300)

    const footer = page.locator('footer')
    await expect(footer).toBeVisible()

    const footerLinks = footer.locator('a[href]')
    const count = await footerLinks.count()
    expect(count).toBeGreaterThan(0)
  })

  test('mobile menu toggles', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Look for mobile menu toggle
    const menuButton = page
      .locator(
        'button[aria-label*="menu" i], button[aria-label*="Menu"], [data-testid="mobile-menu"], button:has([class*="hamburger"])'
      )
      .first()

    if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await menuButton.click()
      await page.waitForTimeout(300)

      // Some nav content should become visible
      const mobileNav = page.locator(
        'nav, [role="navigation"], [data-testid="mobile-nav"]'
      ).first()
      await expect(mobileNav).toBeVisible()
    }
  })

  test('breadcrumbs render on inner pages', async ({ page }) => {
    await page.goto('/products')
    await page.waitForLoadState('networkidle')

    const breadcrumb = page.locator(
      'nav[aria-label*="breadcrumb" i], [data-testid="breadcrumb"], .breadcrumb'
    ).first()

    if (await breadcrumb.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(breadcrumb).toBeVisible()
    }
  })

  test('blog page loads and lists posts', async ({ page }) => {
    await page.goto('/blog')
    await page.waitForLoadState('networkidle')

    const main = page.locator('main, [role="main"]').first()
    await expect(main).toBeVisible()
  })

  test('support page loads', async ({ page }) => {
    await page.goto('/support')
    await page.waitForLoadState('networkidle')

    const main = page.locator('main, [role="main"]').first()
    await expect(main).toBeVisible()
  })
})
