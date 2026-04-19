/**
 * copilotActions.ts
 *
 * QA-friendly helpers for sending prompts and collecting Copilot responses.
 * All functions reuse the single shared session managed by copilotSession.ts.
 */

import type { SessionEvent } from '@github/copilot-sdk';
import { getActiveSession } from './copilotSession.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CopilotResponse {
  sessionId: string;
  answer: string;
  events: SessionEvent[];
}

type ResponseLike = { data?: { content?: string } };

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

/**
 * Ask Copilot a question and return a structured response.
 * The simplest entry point for a text-only interaction.
 *
 * @example
 * const result = await askCopilot('Is the login page accessible?');
 * console.log(result.answer);
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
 * Compare two images (as file paths) and ask Copilot whether they are
 * semantically equivalent. Returns the full structured response.
 *
 * @example
 * const result = await compareImages('/tmp/before.png', '/tmp/after.png');
 * console.log(result.answer);
 */
export async function compareImages(
  imagePathA: string,
  imagePathB: string,
  timeoutMs = 60_000
): Promise<CopilotResponse> {
  const session = await getActiveSession();
  const response = await session.sendAndWait(
    {
      prompt: 'Are these two images semantically equivalent? Briefly state Yes or No, then explain the key differences or similarities.',
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
