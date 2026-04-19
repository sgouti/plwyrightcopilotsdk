import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname     = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(__dirname, 'portRegistry.json');

type Registry = Record<string, number>;

function read(): Registry {
  try { return JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8')) as Registry; }
  catch { return {}; }
}

function write(registry: Registry): void {
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
}

/**
 * Store the debug port for a worker.
 * Key is the worker index, not the PID, so entries never accumulate across runs.
 * Called from the browser fixture before any test action.
 */
export function registerPort(workerIndex: number, port: number): void {
  const registry = read();
  registry[String(workerIndex)] = port;
  write(registry);
}

/**
 * Retrieve the debug port registered for the current worker.
 * Throws immediately if the fixture has not registered a port yet.
 */
export function getPort(): number {
  const workerIndex = parseInt(process.env.TEST_WORKER_INDEX ?? '0', 10);
  const port        = read()[String(workerIndex)];
  if (port === undefined) {
    throw new Error(
      `No CDP port registered for worker ${workerIndex}. ` +
      `Ensure the browser fixture ran before calling CLIExecute.`
    );
  }
  return port;
}

/**
 * Reset the registry to an empty object.
 * Called from global-teardown so no stale entries survive between runs.
 */
export function clearRegistry(): void {
  write({});
}