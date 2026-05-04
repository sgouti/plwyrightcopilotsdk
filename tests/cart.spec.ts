import { expect, test } from '../fixtures/index';

test('add backpack to cart', async ({ loginPage, inventoryPage, cartPage }) => {
  await loginPage.loginAsStandardUser();
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();

  await expect(cartPage.firstItemName).toContainText('Sauce Labs Backpack');
  await expect(cartPage.removeButton).toBeVisible();
});
