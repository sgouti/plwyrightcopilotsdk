import type { Locator, Page } from '@playwright/test';

/**
 * CartPage encapsulates the shopping cart screen (/cart.html).
 */
export class CartPage {
  /** Name of the first item currently in the cart. */
  readonly firstItemName: Locator;

  /** "Remove" button for the first cart item. */
  readonly removeButton: Locator;

  constructor(private readonly page: Page) {
    this.firstItemName = page.locator('.inventory_item_name').first();
    this.removeButton = page.getByRole('button', { name: 'Remove' });
  }

  /** Proceeds to the checkout information screen. */
  async checkout(): Promise<void> {
    await this.page.getByRole('button', { name: 'Checkout' }).click();
  }
}
