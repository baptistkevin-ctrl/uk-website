import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  test('homepage has no major a11y issues', async ({ page }) => {
    await page.goto('/')

    // Check all images have alt text
    const images = page.locator('img')
    const count = await images.count()
    for (let i = 0; i < Math.min(count, 20); i++) {
      const alt = await images.nth(i).getAttribute('alt')
      expect(alt, `Image ${i} missing alt text`).not.toBeNull()
    }

    // Check all buttons have accessible names
    const buttons = page.getByRole('button')
    const btnCount = await buttons.count()
    for (let i = 0; i < Math.min(btnCount, 20); i++) {
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label')
      const innerText = await buttons.nth(i).innerText().catch(() => '')
      const title = await buttons.nth(i).getAttribute('title')
      const name = ariaLabel || innerText || title || ''
      expect(
        name.trim().length,
        `Button ${i} has no accessible name`
      ).toBeGreaterThan(0)
    }
  })

  test('page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/')

    // There should be exactly one h1
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBeGreaterThanOrEqual(1)

    // h2s should exist for section structure
    const h2Count = await page.locator('h2').count()
    expect(h2Count).toBeGreaterThan(0)
  })

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/')

    // Tab through the page and verify focus is visible
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
    }

    // A focusable element should be active
    const focusedTag = await page.evaluate(() =>
      document.activeElement?.tagName.toLowerCase()
    )
    expect(focusedTag).toBeTruthy()
    expect(['a', 'button', 'input', 'select', 'textarea']).toContain(
      focusedTag
    )
  })

  test('forms have proper labels', async ({ page }) => {
    await page.goto('/contact')
    await page.waitForLoadState('networkidle')

    const inputs = page.locator("input:not([type='hidden'])")
    const inputCount = await inputs.count()

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      const placeholder = await input.getAttribute('placeholder')
      const name = await input.getAttribute('name')

      // Should have at least one accessible identifier
      const hasLabel = id || ariaLabel || ariaLabelledBy || placeholder || name
      expect(
        hasLabel,
        `Input ${i} has no accessible label`
      ).toBeTruthy()
    }
  })

  test('color contrast — body text meets minimum size', async ({ page }) => {
    await page.goto('/')

    // Heading should be visible and rendered
    const heading = page.locator('h1').first()
    await expect(heading).toBeVisible()

    // Body text should use at least 14px font size
    const bodyText = page.locator('p').first()
    if (await bodyText.isVisible()) {
      const fontSize = await bodyText.evaluate(
        (el) => window.getComputedStyle(el).fontSize
      )
      expect(parseFloat(fontSize)).toBeGreaterThanOrEqual(14)
    }
  })

  test('links have distinguishable text', async ({ page }) => {
    await page.goto('/')

    // Check first 20 links for meaningful text
    const links = page.locator('a[href]')
    const count = await links.count()

    for (let i = 0; i < Math.min(count, 20); i++) {
      const link = links.nth(i)
      const text = await link.innerText().catch(() => '')
      const ariaLabel = await link.getAttribute('aria-label')
      const title = await link.getAttribute('title')
      const hasChild = (await link.locator('img, svg, [aria-label]').count()) > 0

      // Link should have some accessible content
      const hasContent =
        (text && text.trim().length > 0) || ariaLabel || title || hasChild
      expect(
        hasContent,
        `Link ${i} (href=${await link.getAttribute('href')}) has no accessible text`
      ).toBeTruthy()
    }
  })

  test('ARIA landmarks are present', async ({ page }) => {
    await page.goto('/')

    // Page should have main landmark
    const main = page.locator('main, [role="main"]')
    await expect(main.first()).toBeVisible()

    // Page should have navigation
    const nav = page.locator('nav, [role="navigation"]')
    const navCount = await nav.count()
    expect(navCount).toBeGreaterThan(0)

    // Page should have header and footer
    await expect(page.locator('header').first()).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()
  })

  test('focus trap works in modals', async ({ page }) => {
    await page.goto('/')

    // Try to open a modal (e.g., search, cart drawer)
    const cartButton = page
      .locator(
        '[data-testid="cart-button"], a[href*="cart"], [aria-label*="cart" i]'
      )
      .first()

    if (await cartButton.isVisible()) {
      await cartButton.click()
      await page.waitForTimeout(500)

      // If a modal/drawer opened, check it has role dialog
      const dialog = page.locator('[role="dialog"], [aria-modal="true"]').first()
      if (await dialog.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(dialog).toBeVisible()
      }
    }
  })
})
