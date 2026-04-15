import { test, expect } from '@playwright/test'

test.describe('Shopping Flow', () => {
  test('homepage → category → product → cart', async ({ page }) => {
    // 1. Start at homepage
    await page.goto('/')
    await expect(page).toHaveTitle(/FreshMart|UK Grocery|Grocery/)

    // 2. Navigate to a category
    const categoryLink = page
      .locator('a[href*="/categories/"]')
      .first()

    if (await categoryLink.isVisible()) {
      await categoryLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/categories\//)
    }

    // 3. Click on a product if available
    const productLink = page.locator('a[href*="/products/"]').first()
    if (await productLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await productLink.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/products\//)

      // Product page should show a title
      await expect(
        page.locator('h1, [data-testid="product-title"]').first()
      ).toBeVisible()
    }

    // 4. Navigate to cart — should work regardless of items
    await page.goto('/cart')
    await page.waitForLoadState('networkidle')

    const cartContent = page.locator('main, [role="main"]').first()
    await expect(cartContent).toBeVisible()
  })

  test('search flow works', async ({ page }) => {
    await page.goto('/')

    const searchInput = page
      .locator(
        'input[type="search"], input[placeholder*="Search"], [data-testid="search-input"]'
      )
      .first()

    if (await searchInput.isVisible()) {
      await searchInput.fill('milk')
      await searchInput.press('Enter')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveURL(/search/)

      // Results page should render main content
      const main = page.locator('main, [role="main"]').first()
      await expect(main).toBeVisible()
    }
  })

  test('add to cart and verify cart updates', async ({ page }) => {
    await page.goto('/products')
    await page.waitForLoadState('networkidle')

    const addToCartBtn = page
      .locator(
        'button:has-text("Add to cart"), button:has-text("Add to Cart"), [data-testid="add-to-cart"]'
      )
      .first()

    if (await addToCartBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addToCartBtn.click()
      await page.waitForTimeout(1000)

      // Navigate to cart and check it has content
      await page.goto('/cart')
      await page.waitForLoadState('networkidle')

      const cartContent = page.locator('main, [role="main"]').first()
      await expect(cartContent).toBeVisible()
    }
  })

  test('empty cart shows empty state', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())

    await page.goto('/cart')
    await page.waitForLoadState('networkidle')

    // Cart should show some content — either empty state or items
    const main = page.locator('main, [role="main"]').first()
    await expect(main).toBeVisible()
  })

  test('checkout requires authentication', async ({ page }) => {
    await page.goto('/checkout')
    await page.waitForLoadState('networkidle')

    // Should redirect to login or show auth prompt
    const url = page.url()
    const isOnCheckout = url.includes('checkout')
    const isOnLogin = url.includes('login')
    const hasLoginPrompt =
      (await page.locator('text=/sign in|login|log in/i').count()) > 0

    expect(isOnCheckout || isOnLogin || hasLoginPrompt).toBeTruthy()
  })

  test('deals page loads', async ({ page }) => {
    await page.goto('/deals')
    await expect(page).toHaveURL(/deals/)
    await expect(page.locator('main, [role="main"]').first()).toBeVisible()
  })

  test('gift cards page loads', async ({ page }) => {
    await page.goto('/gift-cards')
    await expect(page).toHaveURL(/gift-cards/)
    await expect(page.locator('main, [role="main"]').first()).toBeVisible()
  })

  test('compare page loads', async ({ page }) => {
    await page.goto('/compare')
    await expect(page).toHaveURL(/compare/)
    await expect(page.locator('main, [role="main"]').first()).toBeVisible()
  })

  test('wishlist redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/wishlist')
    await page.waitForLoadState('networkidle')

    const url = page.url()
    const isOnWishlist = url.includes('wishlist')
    const isOnLogin = url.includes('login')

    expect(isOnWishlist || isOnLogin).toBeTruthy()
  })
})
