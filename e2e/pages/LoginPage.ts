import { type Page, type Locator, expect } from '@playwright/test'
import { BasePage } from './BasePage'

export class LoginPage extends BasePage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly registerLink: Locator
  readonly forgotPasswordLink: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    super(page)
    this.emailInput = page.locator('input[type="email"], input[name="email"]')
    this.passwordInput = page.locator('input[type="password"], input[name="password"]')
    this.submitButton = page.locator(
      'button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), button:has-text("Log in")'
    ).first()
    this.registerLink = page.locator(
      'a[href*="register"], a:has-text("Register"), a:has-text("Sign up"), a:has-text("Create account")'
    ).first()
    this.forgotPasswordLink = page.locator(
      'a[href*="forgot"], a:has-text("Forgot"), a:has-text("Reset password")'
    ).first()
    this.errorMessage = page.locator(
      '[role="alert"], .error, .text-red-500, .text-destructive, [data-testid="error-message"]'
    ).first()
  }

  async goto() {
    await this.page.goto('/login')
    await this.waitForPageLoad()
  }

  async fillCredentials(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
  }

  async submit() {
    await this.submitButton.click()
  }

  async loginWith(email: string, password: string) {
    await this.fillCredentials(email, password)
    await this.submit()
  }

  async expectFormVisible() {
    await expect(this.emailInput).toBeVisible()
    await expect(this.passwordInput).toBeVisible()
    await expect(this.submitButton).toBeVisible()
  }

  async expectStillOnLoginPage() {
    expect(this.page.url()).toMatch(/login/)
  }

  async expectErrorVisible() {
    const hasError = await this.errorMessage.isVisible().catch(() => false)
    const hasErrorText = await this.page.locator('text=/invalid|error|incorrect|failed/i').count() > 0
    expect(hasError || hasErrorText).toBeTruthy()
  }
}
