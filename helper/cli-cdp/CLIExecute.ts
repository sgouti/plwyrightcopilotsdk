import { execSync } from 'node:child_process';
import { validateCommand } from './validator.js';
import { getPort } from './portManager.js';
import { writeLog } from './logger.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sessionName(): string {
  const idx = parseInt(process.env.TEST_WORKER_INDEX ?? '0', 10);
  return `test-worker-${idx}`;
}

/** Run a shell command; never throws — returns combined stdout+stderr. */
function run(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe', timeout: 30_000 });
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string };
    return `${e.stdout ?? ''}\n${e.stderr ?? ''}`;
  }
}

/** Returns true if playwright-cli output contains a soft error message. */
function hasError(output: string): boolean {
  const lower = output.toLowerCase();
  return (
    lower.includes('does not match any elements') ||
    lower.includes('error:')                       ||
    lower.includes('failed to')                    ||
    lower.includes('timed out')                    ||
    lower.includes('unexpected value')
  );
}

function captureSnapshot(session: string): string {
  const out = run(`playwright-cli -s=${session} snapshot`);
  return out.trim() || '[snapshot unavailable]';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Executes a playwright-cli command against the browser the fixture launched.
 * Re-attaches on every call so the CLI always targets the currently open page.
 *
 * @example
 *   await CLIExecute("click '#add-to-cart-sauce-labs-backpack'");
 *   await CLIExecute("fill '#user-name' 'standard_user'");
 *
 * @throws {Error} Command + output + DOM snapshot on failure.
 */
export async function CLIExecute(cmd: string): Promise<void> {
  validateCommand(cmd);

  const port    = getPort();
  const session = sessionName();

  // Re-attach on every call so the CLI sees the page currently open in Playwright.
  run(`playwright-cli attach --cdp http://localhost:${port} --session ${session}`);

  const command = `playwright-cli -s=${session} ${cmd.trim().replace(/'/g, '"')}`;
  const output  = run(command);

  if (!hasError(output)) {
    writeLog({ timestamp: new Date().toISOString(), cmd, port, status: 'success' });
    return;
  }

  const snap  = captureSnapshot(session);
  const error = [
    'CLIExecute FAILED',
    `Command : ${command}`,
    `Output  : ${output.trim()}`,
    `Snapshot: ${snap}`,
  ].join('\n\n');

  writeLog({ timestamp: new Date().toISOString(), cmd, port, status: 'failed', error });
  throw new Error(error);
}