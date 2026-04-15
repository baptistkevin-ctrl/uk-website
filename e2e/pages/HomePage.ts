import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class HomePage extends BasePage {
  readonly heroSection: Locator
  readonly categoryLinks: Locator

  constructor(page: Page) {
    super(page)
    this.heroSection = page.locator(
      '[data-testid="hero-section"], section'
    ).first()
    this.categoryLinks = page.locator(
      'a[href*="categories"], a[href*="category"]'
    )
  }

  async goto() {
    await this.page.goto('/')
    await this.waitForPageLoad()
  }

  async search(query: string) {
    if (await this.searchInput.isVisible()) {
      await this.searchInput.fill(query)
      await this.searchInput.press('Enter')
      await this.page.waitForURL(/search|products/)
    }
  }

  async expectHeroVisible() {
    await expect(this.heroSection).toBeVisible()
  }

  async expectCategoriesPresent() {
    const count = await this.categoryLinks.count()
    expect(count).toBeGreaterThan(0)
  }
}
