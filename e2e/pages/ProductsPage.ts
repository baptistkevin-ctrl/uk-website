import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class ProductsPage extends BasePage {
  readonly productCards: Locator
  readonly productLinks: Locator
  readonly addToCartButtons: Locator
  readonly categoryLinks: Locator

  constructor(page: Page) {
    super(page)
    this.productCards = page.locator(
      '[data-testid="product-card"], .product-card, article'
    )
    this.productLinks = page.locator('a[href*="/products/"]')
    this.addToCartButtons = page.locator(
      'button:has-text("Add to cart"), button:has-text("Add to Cart"), [data-testid="add-to-cart"]'
    )
    this.categoryLinks = page.locator('a[href*="/categories/"]')
  }

  async goto() {
    await this.page.goto('/products')
    await this.waitForPageLoad()
  }

  async clickFirstProduct() {
    const firstProduct = this.productLinks.first()
    if (await firstProduct.isVisible()) {
      await firstProduct.click()
      await this.page.waitForURL(/products\/[^/]+$/)
    }
  }

  async addFirstProductToCart() {
    const button = this.addToCartButtons.first()
    if (await button.isVisible()) {
      await button.click()
      await this.waitForNavigation()
    }
  }
}
