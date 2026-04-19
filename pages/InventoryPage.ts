import type { Locator, Page } from '@playwright/test';

/**
 * InventoryPage encapsulates the product listing screen (/inventory.html).
 */
export class InventoryPage {
  /** "Products" heading — visible once login succeeds. */
  readonly title: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByText('Products');
  }

  /** Clicks "Add to cart" on the first product in the list. */
  async addFirstItemToCart(): Promise<void> {
    await this.page.getByRole('button', { name: 'Add to cart' }).first().click();
  }

  /** Navigates to the cart via the persistent header cart icon. */
  async openCart(): Promise<void> {
    await this.page.locator('.shopping_cart_link').click();
  }
}
