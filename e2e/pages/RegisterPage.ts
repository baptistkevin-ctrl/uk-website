import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class RegisterPage extends BasePage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly nameInput: Locator
  readonly submitButton: Locator
  readonly loginLink: Locator

  constructor(page: Page) {
    super(page)
    this.emailInput = page.locator('input[type="email"], input[name="email"]')
    this.passwordInput = page.locator('input[type="password"], input[name="password"]').first()
    this.nameInput = page.locator(
      'input[name="name"], input[name="full_name"], input[name="fullName"], input[placeholder*="name" i]'
    ).first()
    this.submitButton = page.locator('button[type="submit"]').first()
    this.loginLink = page.locator(
      'a[href*="login"], a:has-text("Sign in"), a:has-text("Login")'
    ).first()
  }

  async goto() {
    await this.page.goto('/register')
    await this.waitForPageLoad()
  }

  async expectFormVisible() {
    await expect(this.emailInput).toBeVisible()
    await expect(this.passwordInput).toBeVisible()
  }

  async expectStillOnRegisterPage() {
    expect(this.page.url()).toContain('register')
  }
}
