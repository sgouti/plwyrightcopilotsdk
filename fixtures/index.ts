import { test as base, chromium, expect } from '@playwright/test';
import type { Browser } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { registerPort } from '../helper/cli-cdp/portManager';
import { CLISession } from '../helper/cli-cdp/CLIExecute';

const DEBUG_BASE_PORT = 9222;

export type AppFixtures = { cli: CLISession; loginPage: LoginPage; inventoryPage: InventoryPage; cartPage: CartPage; checkoutPage: CheckoutPage };
export type WorkerFixtures = { browser: Browser };

export const test = base.extend<AppFixtures, WorkerFixtures>({
  browser: [async ({ }, use, { workerIndex }) => {
    const port = DEBUG_BASE_PORT + workerIndex;
    registerPort(workerIndex, port);
    const browser = await chromium.launch({ headless: false, args: [`--remote-debugging-port=${port}`] });
    await use(browser);
    await browser.close();
  }, { scope: 'worker' }],

  cli: async ({ }, use, testInfo) => use(new CLISession(testInfo.workerIndex)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
});

export { expect };
