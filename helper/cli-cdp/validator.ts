const ALLOWED: ReadonlySet<string> = new Set([
  'click',
  'fill',
  'press',
  'type',
  'check',
  'select',
  'reload',
]);

/**
 * Validates that the leading verb of a CLI command is in the allowed list.
 * Throws synchronously so failures surface before any I/O is attempted.
 */
export function validateCommand(cmd: string): void {
  const verb = cmd.trim().split(/\s+/)[0]?.toLowerCase() ?? '';

  if (!ALLOWED.has(verb)) {
    throw new Error(
      `CLIExecute validation failed: command "${verb}" is not allowed.\n` +
      `Allowed commands: ${[...ALLOWED].join(', ')}`
    );
  }
}