import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class AdminPage extends BasePage {
  readonly navigation: Locator
  readonly sidebarLinks: Locator

  constructor(page: Page) {
    super(page)
    this.navigation = page.locator('nav, aside, [role="navigation"]')
    this.sidebarLinks = page.locator('nav a, aside a')
  }

  async goto(path: string = '/admin') {
    await this.page.goto(path)
    await this.waitForNavigation()
  }

  async expectAccessibleOrRedirect(pathFragment: string) {
    await this.expectProtectedRoute(pathFragment)
  }

  async isAuthenticated(): Promise<boolean> {
    return !await this.isOnLoginPage()
  }

  async expectPageContent() {
    if (await this.isAuthenticated()) {
      await this.expectMainContentVisible()
    }
  }
}
