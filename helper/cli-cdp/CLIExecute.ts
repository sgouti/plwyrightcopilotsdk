import { execSync } from 'node:child_process';
import { validateCommand } from './validator';
import { getPort } from './portManager';
import { writeLog } from './logger';

const ERROR_PATTERNS = ['does not match any elements', 'error:', 'failed to', 'timed out', 'unexpected value'];

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', timeout: 30_000 });
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string };
    return `${e.stdout ?? ''}\n${e.stderr ?? ''}`;
  }
}

export class CLISession {
  private readonly port: number;
  private readonly session: string;

  constructor(workerIndex: number) {
    this.port    = getPort(workerIndex);
    this.session = `test-worker-${workerIndex}`;
    run(`playwright-cli attach --cdp http://localhost:${this.port} --session ${this.session}`);
  }

  async execute(cmd: string): Promise<void> {
    validateCommand(cmd);
    const command = `playwright-cli -s=${this.session} ${cmd.trim().replace(/'/g, '"')}`;
    const output  = run(command);
    const failed  = ERROR_PATTERNS.some(p => output.toLowerCase().includes(p));
    const status  = failed ? 'failed' : 'success';

    writeLog({ timestamp: new Date().toISOString(), cmd, port: this.port, status });

    if (failed) {
      const snap = run(`playwright-cli -s=${this.session} snapshot`).trim() || '[snapshot unavailable]';
      throw new Error(['CLISession.execute FAILED', `Command: ${command}`, `Output: ${output.trim()}`, `Snapshot: ${snap}`].join('\n\n'));
    }
  }
}