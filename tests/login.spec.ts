import { expect, test } from '../fixtures/index';

test('login with valid credentials', async ({ page, loginPage, inventoryPage, cli }) => {
  await loginPage.loginAsStandardUser();
  await cli.execute("click '#add-to-cart-sauce-labs-backpack'");
  await cli.execute("click '#shopping_cart_container'");
  await expect(page).toHaveURL(/cart.html/);
  await expect(inventoryPage.title).toBeVisible();
});
