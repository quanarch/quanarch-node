import { appConfig } from '../../config';
import type { QuanSource } from '../../types';
import { sha256Hex } from '../../utils';

export class UnreachableError extends Error {}
export class HashMismatchError extends Error {}

/** Downloads a quan's code as text. Nothing runs yet. */
export async function fetchQuan(source: QuanSource): Promise<string> {
  let response: Response;
  try {
    response = await fetch(source.url, { cache: 'no-store', signal: AbortSignal.timeout(appConfig.fetchTimeoutMs) });
  } catch {
    throw new UnreachableError(`${source.url} could not be reached`);
  }
  if (!response.ok) throw new UnreachableError(`${source.url} answered ${response.status}`);
  return response.text();
}

/** Returns the code's hash; throws when the list expects another one. */
export function verifyQuan(source: QuanSource, code: string): string {
  const actual = sha256Hex(code);
  if (source.hash && actual !== source.hash) {
    throw new HashMismatchError(`expected ${source.hash.slice(0, 12)}…, got ${actual.slice(0, 12)}…`);
  }
  return actual;
}
