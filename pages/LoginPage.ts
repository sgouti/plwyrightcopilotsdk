import type { Page } from '@playwright/test';

/**
 * LoginPage encapsulates all interactions with the SauceDemo login screen.
 * Credentials are the public demo values and are safe to use in tests directly.
 */
export class LoginPage {
  private static readonly DEFAULT_USER = 'standard_user';
  private static readonly DEFAULT_PASS = 'secret_sauce';

  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async login(username: string, password: string): Promise<void> {
    await this.page.getByPlaceholder('Username').fill(username);
    await this.page.getByPlaceholder('Password').fill(password);
    await this.page.getByRole('button', { name: 'Login' }).click();
  }

  /** Navigate to the root URL and sign in with the standard demo account. */
  async loginAsStandardUser(): Promise<void> {
    await this.goto();
    await this.login(LoginPage.DEFAULT_USER, LoginPage.DEFAULT_PASS);
  }
}
