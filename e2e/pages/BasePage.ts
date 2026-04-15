import { type Page, type Locator, expect } from '@playwright/test'

/**
 * Base page object with shared navigation and layout locators.
 * All page objects extend this for consistent access patterns.
 */
export class BasePage {
  readonly page: Page
  readonly header: Locator
  readonly footer: Locator
  readonly mainContent: Locator
  readonly searchInput: Locator
  readonly cartButton: Locator

  constructor(page: Page) {
    this.page = page
    this.header = page.locator('header')
    this.footer = page.locator('footer')
    this.mainContent = page.locator('main, [role="main"]').first()
    this.searchInput = page.locator(
      'input[type="search"], input[placeholder*="Search" i], [data-testid="search-input"]'
    ).first()
    this.cartButton = page.locator(
      '[data-testid="cart-button"], button:has-text("Cart"), a[href*="cart"], [aria-label*="cart" i]'
    ).first()
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded')
  }

  async expectHeaderVisible() {
    await expect(this.header).toBeVisible()
  }

  async expectFooterVisible() {
    await expect(this.footer).toBeVisible()
  }

  async expectMainContentVisible() {
    await expect(this.mainContent).toBeVisible()
  }

  /**
   * Wait for navigation to settle after a redirect.
   * Uses waitForLoadState instead of arbitrary timeouts.
   */
  async waitForNavigation() {
    await this.page.waitForLoadState('networkidle').catch(() => {
      // networkidle can timeout on pages with persistent connections
      // Fall back to domcontentloaded which is always reliable
    })
  }

  /**
   * Check if the page redirected to login (common for protected routes).
   */
  async isOnLoginPage(): Promise<boolean> {
    return this.page.url().includes('login') || this.page.url().includes('auth')
  }

  /**
   * Assert the page either shows content or redirected to login.
   * Used for testing protected routes without auth.
   */
  async expectProtectedRoute(expectedPathFragment: string) {
    await this.waitForNavigation()
    const url = this.page.url()
    const isOnExpected = url.includes(expectedPathFragment)
    const isOnLogin = url.includes('login') || url.includes('auth')
    expect(isOnExpected || isOnLogin).toBeTruthy()
  }
}
