import type { Locator, Page } from '@playwright/test';

/**
 * CheckoutPage covers both the information step (/checkout-step-one.html)
 * and the overview + confirmation screens that follow.
 */
export class CheckoutPage {
  /** Order confirmation message shown on the final screen. */
  readonly confirmationMessage: Locator;

  constructor(private readonly page: Page) {
    this.confirmationMessage = page.getByText('Thank you for your order!');
  }

  async fillShippingInfo(firstName: string, lastName: string, zip: string): Promise<void> {
    await this.page.getByPlaceholder('First Name').fill(firstName);
    await this.page.getByPlaceholder('Last Name').fill(lastName);
    await this.page.getByPlaceholder('Zip/Postal Code').fill(zip);
  }

  async continue(): Promise<void> {
    await this.page.getByRole('button', { name: 'Continue' }).click();
  }

  async finish(): Promise<void> {
    await this.page.getByRole('button', { name: 'Finish' }).click();
  }
}
