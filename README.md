# Playwright Copilot SDK

This repository is a Playwright TypeScript automation framework built to support Copilot-assisted live test execution and true self-healing.

The current SauceDemo flows provide the working foundation. The longer-term goal is to let Copilot observe a live browser session, execute safe test actions, recover from UI drift, and improve reliability without manual rework.

## Goal

The main motto of this repository is simple:

**Use Copilot to power live execution, reduce brittle test maintenance, and move toward self-healing automation.**

## What is included today

- Playwright TypeScript tests for SauceDemo
- Page Object Model structure under `pages/`
- Shared fixtures under `fixtures/`
- Copilot SDK helpers under `helper/copilot/`
- CLI/CDP helper utilities under `helper/cli-cdp/`

## Current test flows

- Login flow
- Add-to-cart flow
- Checkout flow
- AI-backed screenshot validation in checkout

## Requirements

- Node.js
- Playwright
- `GIT_TOKEN` or `git_token` in `.env`

## Scripts

- `npm test`
- `npm run test:headed`
- `npm run test:debug`
- `npm run test:report`

## Copilot integration

Copilot session lifecycle is managed in `helper/copilot/copilotSession.ts` and shared across the suite. The helper layer is designed to evolve toward live browser actions, command execution through CDP, and self-healing flows.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow and coding expectations.
