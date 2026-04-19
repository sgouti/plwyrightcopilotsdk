/**
 * copilotAssertions.ts
 *
 * AI-powered assertion helpers designed for use inside Playwright tests.
 * Each function returns a boolean-friendly result so test code reads naturally:
 *
 *   const result = await assertImageContains(screenshotBase64, 'Add to cart');
 *   expect(result.present).toBe(true);
 */

import type { SessionEvent } from '@github/copilot-sdk';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { getActiveSession } from './copilotSession.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VisualAssertionResult {
  sessionId: string;
  checkedValue: string;
  present: boolean;
  reasoning: string;
  events: SessionEvent[];
}

type ResponseLike = { data?: { content?: string } };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function parsePresence(text: string): boolean {
  const normalized = text.toLowerCase();
  if (/present\s*:\s*no|not (present|visible|found)|absent|missing/.test(normalized)) {
    return false;
  }
  return /present\s*:\s*yes|value found|yes|visible/.test(normalized);
}

function base64ToBuffer(imageBase64: string): { buffer: Buffer; ext: string } {
  const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s);
  if (match) {
    const mime = match[1].toLowerCase();
    return {
      buffer: Buffer.from(match[2], 'base64'),
      ext: mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1] ?? 'png'
    };
  }
  return { buffer: Buffer.from(imageBase64, 'base64'), ext: 'png' };
}

async function saveTempImage(imageBase64: string): Promise<{ path: string; cleanup: () => Promise<void> }> {
  const { buffer, ext } = base64ToBuffer(imageBase64);
  const dir = await mkdtemp(join(tmpdir(), `copilot-assert-${randomUUID()}-`));
  const path = join(dir, `screenshot.${ext}`);
  await writeFile(path, buffer);
  return {
    path,
    cleanup: () => rm(dir, { recursive: true, force: true })
  };
}

// ---------------------------------------------------------------------------
// Public assertion API
// ---------------------------------------------------------------------------

/**
 * Assert that a base64-encoded screenshot contains a specific visible value.
 * Passes the image to Copilot via the shared session and returns a structured result.
 *
 * Typical usage:
 *   const screenshot = await page.screenshot({ encoding: 'base64' });
 *   const result = await assertImageContains(screenshot as string, 'Add to cart');
 *   expect(result.present).toBe(true);
 */
export async function assertImageContains(
  screenshotBase64: string,
  expectedValue: string,
  timeoutMs = 60_000
): Promise<VisualAssertionResult> {
  const session = await getActiveSession();
  const temp = await saveTempImage(screenshotBase64);

  try {
    const prompt = [
      'Look at the attached screenshot from a web application.',
      `Determine whether the following value is visible on screen: "${expectedValue}"`,
      'Respond starting with "Present: Yes" or "Present: No", then briefly explain.'
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
