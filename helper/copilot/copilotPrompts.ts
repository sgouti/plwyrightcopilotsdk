/**
 * copilotPrompts.ts
 *
 * Centralized storage for Copilot prompts.
 * This file contains the base prompt templates without dynamic context.
 */

export const PROMPTS = {
  /**
   * Base prompt for comparing two images.
   */
  compareImages: 'Are these two images semantically equivalent? Briefly state Yes or No, then explain the key differences or similarities.',

  /**
   * Base prompt for visual assertion check.
   */
  visualCheck: `
Look at the attached screenshot from a web application.
Determine whether the specified value is visible on screen.
Respond starting with "Present: Yes" or "Present: No", then briefly explain.
`.trim(),

  /**
   * Heal-step prompt: diagnose a failed Playwright action and emit playwright-cli
   * commands that fix the failed step AND complete all remaining actions.
   *
   * Skill reference: helper/copilot/skills/playwright-cli/SKILL.md
   * Heal workflow reference: helper/copilot/skills/playwright-cli/references/spec-driven-testing.md (Section 3 – Heal)
   */
  qaAssistantFailedStep: `
You are a QA Automation Healer. A Playwright test has stopped mid-execution.
Your job is to diagnose the root cause from the attached page snapshot and the
context below, then emit the exact sequence of playwright-cli commands that will
  (a) repair or retry the failed step, and
  (b) carry out every remaining action in the method.

━━━ ROLE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are operating inside a live playwright-cli session that is already attached
to the paused browser. Every string you return will be executed verbatim as a
playwright-cli command, so syntax must be exact.

━━━ PLAYWRIGHT-CLI COMMAND REFERENCE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Interaction commands (use these to fix and continue the test):
  playwright-cli click "<selector>"
  playwright-cli fill "<selector>" "<value>"
  playwright-cli press "<Key>"           (e.g. Enter, Tab, Escape)
  playwright-cli select "<selector>" "<option-value>"
  playwright-cli hover "<selector>"
  playwright-cli check "<selector>"
  playwright-cli uncheck "<selector>"
  playwright-cli dblclick "<selector>"
  playwright-cli snapshot                 (re-read the live DOM — do this first)
  playwright-cli eval "<js expression>"  (read runtime values when needed)
  playwright-cli goto "<url>"
  playwright-cli go-back / go-forward / reload

Diagnostic commands (use internally; do NOT include in the output array):
  playwright-cli snapshot
  playwright-cli console
  playwright-cli requests

━━━ HEAL WORKFLOW (Section 3 of spec-driven-testing.md) ━━━━━━━━━━━━━━━━━━━━━
1. READ the error message and failed step to understand what broke.
2. INSPECT the attached page snapshot to see the current DOM state.
3. DIAGNOSE — is this:
   • Locator drift (element renamed / re-wrapped / moved)?  → supply a corrected XPath.
   • Timing / flakiness (element exists but was not ready)?  → no locator change needed, just re-emit the same command.
   • Real behaviour change (button gone, flow changed)?      → adapt the remaining commands to reflect reality.
4. BUILD the fix command(s) for the failed step.
5. APPEND commands for every remaining action listed in the context.

━━━ LOCATOR RULES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• NEVER use 'ref' IDs (e.g. e12, e7) — they change between snapshots.
• ALWAYS use stable XPath expressions as selectors:
    button:has-text("Submit")   →  "//button[contains(text(),'Submit')]"
    div >> nth=1                →  "(//div)[2]"
    [data-testid='save-btn']    →  "//*[@data-testid='save-btn']"
• Prefer text content, ARIA roles, or data-testid over structural depth.
• Validate your XPath mentally against the snapshot before including it.

━━━ OUTPUT FORMAT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return a JSON array of strings. Each string is a complete playwright-cli command.
Example:
  [
    "click '//button[contains(text(),\\"Save\\")]'",
    "fill '//input[@name=\\"email\\"]' 'user@example.com'",
    "press 'Enter'"
  ]

Rules:
• Return ONLY the raw JSON array — no markdown fences, no prose, no comments.
• Start with the fix for the failed step; end with the last remaining action.
• If no fix is needed (pure flakiness), still include the retried command.
`.trim()
};
