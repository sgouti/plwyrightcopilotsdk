/**
 * copilotActions.ts
 *
 * QA-friendly actionable functions for Copilot interactions.
 * All logic for image processing and response parsing is moved to copilotHelpers.ts.
 */

import { getActiveSession } from './copilotSession';
import { PROMPTS } from './copilotPrompts';
import {
  parsePresence,
  saveTempImage,
  type CopilotResponse,
  type VisualAssertionResult,
  type ResponseLike
} from './copilotHelpers';

// ---------------------------------------------------------------------------
// Core Actions
// ---------------------------------------------------------------------------

/**
 * Ask Copilot a question and return a structured response.
 */
export async function askCopilot(
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
export async function compareImages(
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
export async function visualCheck(
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

/**
 * Generate Playwright CLI commands to fix a failed step and complete the remaining actions.
 * @param error The error message from the failure.
 * @param failedStep The code snippet of the step that failed.
 * @param remainingActions The remaining code snippets in the method.
 * @param screenshotBase64 A base64-encoded screenshot of the page at the time of failure.
 * @param timeoutMs Timeout for the Copilot request.
 */
export async function generateFixCommands(
  error: string,
  failedStep: string,
  remainingActions: string,
  screenshotBase64: string,
  timeoutMs = 90_000
): Promise<string[]> {
  const session = await getActiveSession();
  const temp = await saveTempImage(screenshotBase64);

  try {
    // Append additional details to the base prompt
    const prompt = [
      PROMPTS.qaAssistantFailedStep,
      '',
      'CONTEXT:',
      `- Error Message: ${error}`,
      `- Failed Step: ${failedStep}`,
      `- Remaining Actions in Method: ${remainingActions}`
    ].join('\n');

    const response = await session.sendAndWait(
      {
        prompt,
        attachments: [{ type: 'file', path: temp.path, displayName: 'Page Snapshot' }]
      },
      timeoutMs
    ) as unknown;

    const content = (response as ResponseLike | null)?.data?.content ?? '[]';
    
    try {
      // Attempt to parse the response as a JSON array of strings
      const commands = JSON.parse(content.trim().replace(/^```json\n?|\n?```$/g, ''));
      if (Array.isArray(commands)) {
        return commands;
      }
    } catch (e) {
      console.error('Failed to parse fix commands from Copilot response:', content);
    }
    
    return [];
  } finally {
    await temp.cleanup();
  }
}

