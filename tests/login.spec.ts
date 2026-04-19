import { expect, test } from '../fixtures/index.js';
import { CLIExecute } from '../helper/cli-cdp/CLIExecute.js';

test('login with valid credentials', async ({ page, loginPage, inventoryPage }) => {
  await loginPage.loginAsStandardUser();
  await CLIExecute("click '#add-to-cart-sauce-labs-backpack'");
  await expect(page).toHaveURL(/inventory.html/);
  await expect(inventoryPage.title).toBeVisible();
});
