# Project Instructions

## Overview

Playwright TypeScript end-to-end test suite for [SauceDemo](https://www.saucedemo.com/),
integrated with the GitHub Copilot SDK for AI-powered visual assertions and session management.

## Folder Structure

```
pages/            ← Page Object Model — one class per SauceDemo screen
  LoginPage.ts
  InventoryPage.ts
  CartPage.ts
  CheckoutPage.ts

fixtures/
  index.ts        ← Custom Playwright `test` that wires all page objects as fixtures

tests/            ← Spec files only — no page logic, no raw `page` calls
  login.spec.ts
  cart.spec.ts
  checkout.spec.ts

helper/copilot/   ← GitHub Copilot SDK layer
  copilotSession.ts     ← Session lifecycle: startSession / endSession / getActiveSession
  copilotActions.ts     ← Text prompt helpers: askCopilot / compareImages
  copilotAssertions.ts  ← AI visual assertions: assertImageContains

global-setup.ts         ← Starts the shared Copilot session before the test run
global-teardown.ts      ← Destroys the session after the test run
```

## Coding Rules

### Page Objects (`pages/`)
- One class per page/screen.
- Constructor signature: `constructor(private readonly page: Page)`.
- Expose stable locators as `readonly` Locator properties.
- Expose user actions as `async` methods.
- **No assertions inside page objects** — assertions belong in specs.

### Fixtures (`fixtures/index.ts`)
- All page objects are registered here.
- **Always import `test` and `expect` from `fixtures/index.js`**, not from `@playwright/test` directly.

### Specs (`tests/`)
- Destructure only the page objects the test actually needs.
- Use `page` fixture for raw operations (e.g., `page.screenshot()`).
- AI assertions via `assertImageContains` complement — never replace — DOM assertions.

### Copilot SDK Layer (`helper/copilot/`)
- A single shared `CopilotSession` is stored on `globalThis` and started in `global-setup.ts`.
- Never create additional sessions inside tests.
- Model is `gpt-5.4-mini` with streaming enabled.

## Locator Priority
1. `getByRole` — most resilient to UI changes
2. `getByLabel` / `getByPlaceholder` — for form fields
3. `getByText` — for visible content
4. CSS class selectors (e.g., `.shopping_cart_link`) — last resort only

## Environment
- SauceDemo credentials: `standard_user` / `secret_sauce` (public demo values — safe to commit).
- Copilot auth: `GIT_TOKEN` in `.env` (never commit `.env`).
- TypeScript: `module: NodeNext`, `noEmit: true`. All local imports **must** use `.js` extensions.
