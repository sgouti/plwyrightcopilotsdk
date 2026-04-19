import { execSync } from 'node:child_process';
import { endSession } from './helper/copilot/copilotSession.js';
import { clearRegistry } from './helper/cli-cdp/portManager.js';

export default async function globalTeardown(): Promise<void> {
  await endSession();

  // Kill every playwright-cli session opened during the run.
  try {
    execSync('playwright-cli close-all', { stdio: 'ignore', timeout: 10_000 });
  } catch { /* no sessions were open — safe to ignore */ }

  // Reset the port registry so stale entries never accumulate.
  clearRegistry();
}
