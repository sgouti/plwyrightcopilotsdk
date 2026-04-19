/**
 * copilotSession.ts
 *
 * Manages the shared Copilot session lifecycle for the entire test run.
 * One session is started before the suite and destroyed after it ends.
 *
 * Usage in tests — import getActiveSession() to reuse the session.
 */

import 'dotenv/config';
import type { CopilotClient, CopilotSession } from '@github/copilot-sdk';
import { CopilotClient as Client, approveAll } from '@github/copilot-sdk';

// ---------------------------------------------------------------------------
// Internal singleton state
// ---------------------------------------------------------------------------

interface SessionState {
  client: CopilotClient | null;
  session: CopilotSession | null;
}

const _state = globalThis as typeof globalThis & { __copilot?: SessionState };

function getState(): SessionState {
  if (!_state.__copilot) {
    _state.__copilot = { client: null, session: null };
  }
  return _state.__copilot;
}

// ---------------------------------------------------------------------------
// Public lifecycle API  (called from global-setup / global-teardown)
// ---------------------------------------------------------------------------

export async function startSession(): Promise<void> {
  const token = process.env.git_token ?? process.env.GIT_TOKEN;

  if (!token) {
    throw new Error(
      'Missing required env variable: set git_token or GIT_TOKEN before running tests.'
    );
  }

  const state = getState();
  if (state.client && state.session) return; // already running

  const client = new Client({
    githubToken: token
  });

  await client.start();

  const session = await client.createSession({
    onPermissionRequest: approveAll,
    model: 'gpt-5.4-mini',
    streaming: true
  });

  state.client = client;
  state.session = session;
}

export async function endSession(): Promise<void> {
  const state = getState();

  try {
    await state.session?.destroy();
  } finally {
    await state.client?.stop();
    state.session = null;
    state.client = null;
  }
}

// ---------------------------------------------------------------------------
// Public session accessor  (used by actions + assertions)
// ---------------------------------------------------------------------------

export async function getActiveSession(): Promise<CopilotSession> {
  const state = getState();

  if (!state.session) {
    await startSession();
  }

  if (!state.session) {
    throw new Error('Copilot session is not available. Check that startSession() ran in global setup.');
  }

  return state.session;
}
