import { expect, test } from '../fixtures/index';
import { visualCheck } from '../helper/copilot/copilotActions';

test('complete checkout for one item', async ({ page, loginPage, inventoryPage, cartPage, checkoutPage }) => {
  await loginPage.loginAsStandardUser();
  await inventoryPage.addFirstItemToCart();
  await inventoryPage.openCart();
  await cartPage.checkout();
  await checkoutPage.fillShippingInfo('Test', 'User', '12345');
  await checkoutPage.continue();
  await checkoutPage.finish();

  // DOM assertion
  await expect(checkoutPage.confirmationMessage).toBeVisible();

  // AI-powered visual assertion — confirms the message is rendered in the
  // actual screenshot, not just present in the DOM.
  const screenshotBuffer = await page.screenshot();
  const screenshotBase64 = screenshotBuffer.toString('base64');
  const aiCheck = await visualCheck(screenshotBase64, 'Thank you for your order!');
  expect(aiCheck.present, `Copilot visual check failed: ${aiCheck.reasoning}`).toBe(true);
});
