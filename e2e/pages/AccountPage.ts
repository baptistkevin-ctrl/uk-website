import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class AccountPage extends BasePage {
  readonly accountNav: Locator
  readonly ordersLink: Locator

  constructor(page: Page) {
    super(page)
    this.accountNav = page.locator('nav, aside, [role="navigation"]')
    this.ordersLink = page.locator('a[href*="orders"]').first()
  }

  async goto(path: string = '/account') {
    await this.page.goto(path)
    await this.waitForNavigation()
  }

  async isAuthenticated(): Promise<boolean> {
    return !await this.isOnLoginPage()
  }

  async expectAccessibleOrRedirect(pathFragment: string) {
    await this.expectProtectedRoute(pathFragment)
  }

  async expectPageContent() {
    if (await this.isAuthenticated()) {
      await this.expectMainContentVisible()
    }
  }
}
