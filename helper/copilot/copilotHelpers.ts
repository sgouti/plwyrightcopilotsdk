/**
 * copilotHelpers.ts
 *
 * Internal utility functions and shared types for Copilot actions.
 */

import type { SessionEvent } from '@github/copilot-sdk';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CopilotResponse {
  sessionId: string;
  answer: string;
  events: SessionEvent[];
}

export interface VisualAssertionResult {
  sessionId: string;
  checkedValue: string;
  present: boolean;
  reasoning: string;
  events: SessionEvent[];
}

export type ResponseLike = { data?: { content?: string } };

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Parses the AI response to determine if a value was found.
 */
export function parsePresence(text: string): boolean {
  const normalized = text.toLowerCase();
  if (/present\s*:\s*no|not (present|visible|found)|absent|missing/.test(normalized)) {
    return false;
  }
  return /present\s*:\s*yes|value found|yes|visible/.test(normalized);
}

/**
 * Converts a base64 string to a Buffer and detects the extension.
 */
export function base64ToBuffer(imageBase64: string): { buffer: Buffer; ext: string } {
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

/**
 * Saves a base64 image to a temporary file and returns the path and a cleanup function.
 */
export async function saveTempImage(imageBase64: string): Promise<{ path: string; cleanup: () => Promise<void> }> {
  const { buffer, ext } = base64ToBuffer(imageBase64);
  const dir = await mkdtemp(join(tmpdir(), `copilot-action-${randomUUID()}-`));
  const path = join(dir, `screenshot.${ext}`);
  await writeFile(path, buffer);
  return {
    path,
    cleanup: () => rm(dir, { recursive: true, force: true })
  };
}
