/**
 * fixtures/index.ts
 *
 * Extends the base Playwright `test` with all SauceDemo page objects.
 * Also overrides the built-in `browser` worker fixture to:
 *  - Launch Chromium with --remote-debugging-port=<9222 + workerIndex>
 *  - Register that port in portRegistry.json so CLIExecute can share the session
 *
 * All spec files must import `test` and `expect` from HERE.
 */

import { test as base, chromium } from '@playwright/test';
import type { Browser } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { InventoryPage } from '../pages/InventoryPage.js';
import { CartPage } from '../pages/CartPage.js';
import { CheckoutPage } from '../pages/CheckoutPage.js';
import { registerPort } from '../helper/cli-cdp/portManager.js';

// Base debug port — each worker gets BASE + workerIndex so parallel runs
// never collide on the same CDP endpoint.
const DEBUG_BASE_PORT = 9222;

export type AppFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

export type WorkerFixtures = {
  browser: Browser;
};

export const test = base.extend<AppFixtures, WorkerFixtures>({
  /**
   * Override the built-in browser fixture (worker-scoped).
   * Launches Chromium with --remote-debugging-port so playwright-cli
   * over CDP can attach to the same browser instance the tests use.
   */
  browser: [async ({}, use, workerInfo) => {
    const debugPort   = DEBUG_BASE_PORT + workerInfo.workerIndex;
    const sessionName = `test-worker-${workerInfo.workerIndex}`;

    // Register port under worker index (not PID) so the registry stays clean.
    registerPort(workerInfo.workerIndex, debugPort);

    const browser = await chromium.launch({
      headless: false,
      args: [`--remote-debugging-port=${debugPort}`],
    });

    // Do NOT attach playwright-cli here — the browser has no real page yet.
    // CLIExecute re-attaches itself before every command so it always targets
    // the currently active test page.

    await use(browser);
    await browser.close();
  }, { scope: 'worker' }],

  loginPage:    async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage:     async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
});

export { expect } from '@playwright/test';
