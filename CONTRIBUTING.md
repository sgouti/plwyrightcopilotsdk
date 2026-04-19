# Contributing

Thanks for contributing to this repository.

## Contribution focus

This project is being shaped for Copilot-assisted live test execution and true self-healing automation. Contributions should support that direction by improving reliability, observability, and maintainability.

## How to contribute

1. Keep changes small and focused.
2. Prefer Playwright page objects and shared fixtures over raw test logic.
3. Use the Copilot helper layer for AI-driven actions, assertions, or validation.
4. Preserve deterministic behavior in parallel and CI runs.
5. Update tests and documentation when behavior changes.

## Code style

- Use TypeScript.
- Keep local imports using `.js` extensions.
- Follow the existing helper and Page Object Model structure.
- Avoid adding browser-launch logic inside helper utilities that are meant to attach to an existing session.

## Testing

Before opening a change, run:

- `npx tsc --noEmit`
- `npx playwright test`

If a change affects live execution or CDP behavior, include a focused validation step for that path.

## Design principle

The repository goal is not just test automation. It is Copilot-driven automation that can execute against a live browser, adapt to changes, and reduce manual maintenance over time.