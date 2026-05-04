import { readFile } from 'node:fs/promises';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FailureLocation {
  filePath: string;
  line: number;
  column: number;
  methodName?: string;
}

export interface FailureContext extends FailureLocation {
  methodSource: string;
  remainderSource: string;
}

export interface ExtractedError {
  message: string;
  context: FailureContext | undefined;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extracts a structured error with source context from any thrown value.
 *
 * @example
 *   } catch (err) {
 *     const { message, context } = await extractError(err);
 *     console.log(message, context?.methodSource);
 *   }
 */
export async function extractError(error: unknown): Promise<ExtractedError> {
  const err = toError(error);
  return { message: err.message, context: await getFailureContext(err) };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function getFailureLocation(error: Error): FailureLocation | undefined {
  for (const line of (error.stack ?? '').split(/\r?\n/)) {
    const match =
      line.match(/at (.+?) \((.*\.ts):(\d+):(\d+)\)/) ??
      line.match(/at (.*\.ts):(\d+):(\d+)/);

    if (!match) continue;

    return match.length === 5
      ? { methodName: match[1].split('.').pop(), filePath: match[2], line: +match[3], column: +match[4] }
      : { filePath: match[1], line: +match[2], column: +match[3] };
  }
  return undefined;
}

const sourceCache = new Map<string, Promise<string>>();

async function getSource(filePath: string): Promise<string> {
  if (!sourceCache.has(filePath)) sourceCache.set(filePath, readFile(filePath, 'utf8'));
  return sourceCache.get(filePath)!;
}

function clip(value: string, limit = 1200): string {
  return value.length > limit ? `${value.slice(0, limit)}\n...` : value;
}

function extractMethodSource(source: string, methodName: string | undefined, failedLine: number) {
  const lines  = source.split(/\r?\n/);
  const sigIdx = methodName ? source.indexOf(`${methodName}(`) : -1;

  if (sigIdx === -1) {
    return {
      methodSource:    clip(source),
      remainderSource: clip(lines.slice(Math.max(failedLine - 1, 0)).join('\n')),
    };
  }

  const bodyStart = source.indexOf('{', sigIdx);
  if (bodyStart === -1) {
    const methodSource = clip(source.slice(sigIdx));
    return { methodSource, remainderSource: methodSource };
  }

  let depth = 0;
  for (let i = bodyStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') depth--;
    if (depth === 0) {
      const methodSource   = source.slice(sigIdx, i + 1);
      const fnStartLine    = source.slice(0, sigIdx).split(/\r?\n/).length;
      const relFailed      = Math.max(failedLine - fnStartLine, 0);
      const remainderSource = methodSource.split(/\r?\n/).slice(relFailed).join('\n') || methodSource;
      return { methodSource: clip(methodSource), remainderSource: clip(remainderSource) };
    }
  }

  const methodSource = source.slice(sigIdx);
  return { methodSource: clip(methodSource), remainderSource: clip(methodSource) };
}

async function getFailureContext(error: Error): Promise<FailureContext | undefined> {
  const location = getFailureLocation(error);
  if (!location) return undefined;

  const source = await getSource(location.filePath);
  const { methodSource, remainderSource } = extractMethodSource(source, location.methodName, location.line);

  return { ...location, methodSource, remainderSource };
}
