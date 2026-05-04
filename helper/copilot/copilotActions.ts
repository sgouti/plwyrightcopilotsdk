/**
 * copilotActions.ts
 *
 * QA-friendly actionable functions for Copilot interactions.
 * All logic for image processing and response parsing is moved to copilotHelpers.ts.
 */

import { getActiveSession } from './copilotSession.js';
import { PROMPTS } from './copilotPrompts.js';
import {
  parsePresence,
  saveTempImage,
  type CopilotResponse,
  type VisualAssertionResult,
  type ResponseLike
} from './copilotHelpers.js';
import { extractError } from './errorExtractor.js';

// ---------------------------------------------------------------------------
// Core Actions
// ---------------------------------------------------------------------------

/**
 * Ask Copilot a question and return a structured response.
 */
export async function askAction(
  prompt: string,
  timeoutMs = 60_000
): Promise<CopilotResponse> {
  const session = await getActiveSession();
  const response = await session.sendAndWait({ prompt }, timeoutMs) as unknown;
  const events = await session.getMessages();

  return {
    sessionId: session.sessionId,
    answer: (response as ResponseLike | null)?.data?.content ?? '',
    events
  };
}

/**
 * Compare two images and ask Copilot whether they are semantically equivalent.
 */
export async function compareImagesAction(
  imagePathA: string,
  imagePathB: string,
  timeoutMs = 60_000
): Promise<CopilotResponse> {
  const session = await getActiveSession();
  const response = await session.sendAndWait(
    {
      prompt: PROMPTS.compareImages,
      attachments: [
        { type: 'file', path: imagePathA, displayName: 'Image A' },
        { type: 'file', path: imagePathB, displayName: 'Image B' }
      ]
    },
    timeoutMs
  ) as unknown;

  const events = await session.getMessages();

  return {
    sessionId: session.sessionId,
    answer: (response as ResponseLike | null)?.data?.content ?? '',
    events
  };
}

/**
 * Perform a visual check on a base64-encoded screenshot to see if it contains a specific value.
 */
export async function visualCheckAction(
  screenshotBase64: string,
  expectedValue: string,
  timeoutMs = 60_000
): Promise<VisualAssertionResult> {
  const session = await getActiveSession();
  const temp = await saveTempImage(screenshotBase64);

  try {
    const prompt = [
      PROMPTS.visualCheck,
      '',
      `VALUE TO CHECK: "${expectedValue}"`
    ].join('\n');

    const response = await session.sendAndWait(
      {
        prompt,
        attachments: [{ type: 'file', path: temp.path, displayName: 'Screenshot' }]
      },
      timeoutMs
    ) as unknown;

    const reasoning = (response as ResponseLike | null)?.data?.content ?? '';
    const events = await session.getMessages();

    return {
      sessionId: session.sessionId,
      checkedValue: expectedValue,
      present: parsePresence(reasoning),
      reasoning,
      events
    };
  } finally {
    await temp.cleanup();
  }
}

// ---------------------------------------------------------------------------
// Heal action
// ---------------------------------------------------------------------------

/**
 * Single-parameter heal entry point.
 *
 * Pass the raw caught error (or just its message string) — this function
 * calls {@link extractError} internally to resolve:
 *   - `message`          – human-readable error message
 *   - `failedStep`       – source of the method that contained the failure
 *   - `remainingActions` – source lines from the failure point to end of method
 *
 * It then attaches a screenshot, builds the heal prompt, and asks Copilot to
 * return an ordered JSON array of playwright-cli commands.
 *
 * @param errorMessage The raw error thrown by the failed Playwright action.
 * @param screenshotBase64 Base64-encoded PNG screenshot taken at failure time.
 * @param timeoutMs Copilot request timeout (default 90 s).
 * @returns Ordered array of playwright-cli command strings ready for execution.
 */
export async function healerAction(
  errorMessage: unknown,
  screenshotBase64: string,
  timeoutMs = 90_000
): Promise<string[]> {
  // ── 1. Extract structured context from the error ─────────────────────────
  const { message, context } = await extractError(errorMessage);
  const failedStep       = context?.methodSource       ?? message;
  const remainingActions = context?.remainderSource     ?? '';

  // ── 2. Save screenshot to a temp file ────────────────────────────────────
  const session = await getActiveSession();
  const temp    = await saveTempImage(screenshotBase64);

  try {
    // ── 3. Build the heal prompt with extracted context ──────────────────
    const prompt = [
      PROMPTS.qaAssistantFailedStep,
      '',
      '━━━ CONTEXT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `Error Message      : ${message}`,
      `Failed Step Source : ${failedStep}`,
      `Remaining Actions  : ${remainingActions || '(none — this was the last action)'}`,
    ].join('\n');

    // ── 4. Send to Copilot AI agent ──────────────────────────────────────
    const response = await session.sendAndWait(
      {
        prompt,
        attachments: [{ type: 'file', path: temp.path, displayName: 'Page Snapshot' }]
      },
      timeoutMs
    ) as unknown;

    // ── 5. Parse and return the command array ────────────────────────────
    const content = (response as ResponseLike | null)?.data?.content ?? '[]';

    try {
      const commands = JSON.parse(content.trim().replace(/^```json\n?|\n?```$/g, ''));
      if (Array.isArray(commands)) return commands;
    } catch {
      console.error('[healerAction] Failed to parse heal commands from response:', content);
    }

    return [];
  } finally {
    await temp.cleanup();
  }
}
