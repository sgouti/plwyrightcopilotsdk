import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR   = join(__dirname, 'logs');
const LOG_FILE  = join(LOG_DIR, 'cli.log');

export interface LogEntry {
  timestamp: string;
  cmd:       string;
  port:      number;
  status:    'success' | 'failed';
  error?:    string;
}

/**
 * Appends a structured JSON log line to helper/cli-cdp/logs/cli.log.
 * Never throws  a logging failure must not break test execution.
 */
export function writeLog(entry: LogEntry): void {
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', 'utf-8');
  } catch {
    // Intentionally swallowed  logging is non-critical
  }
}