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
   * Base prompt for QA Assistant to analyze failure and generate Playwright CLI commands.
   */
  qaAssistantFailedStep: `
You are a QA Assistant specialized in Playwright automation. 
Your task is to analyze a failed automation step and generate Playwright CLI commands to complete the test.

INSTRUCTIONS:
1. Analyze the attached page snapshot and the error message.
2. Determine if the failure is due to flakiness or a real element change (e.g., locator no longer works).
3. Generate a sequence of Playwright CLI commands that:
   - Fixes or retries the failed step with a better locator if necessary.
   - Executes all the remaining actions mentioned in the context.
4. RULES for Locators:
   - Do NOT use 'ref' IDs for generating locators.
   - If the original Playwright locator uses non-standard CLI syntax like 'has:text' or 'nth=1', you MUST convert it to a valid XPath that the Playwright CLI can understand.
   - Example: Convert 'button:has-text("Submit")' to "//button[contains(text(), 'Submit')]".
   - Example: Convert 'div >> nth=1' to "(//div)[2]".
5. OUTPUT FORMAT:
   - Your response must be a JSON array of strings, where each string represents a Playwright CLI command.
   - Example: ["click '#createButton'", "fill '#name' 'John'", "click 'text=Submit'"]
   - Return ONLY the raw JSON array. No explanations, no markdown code blocks, just the array.
`.trim()
};
