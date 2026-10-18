import { ERROR, STATUS, type ErrorCode } from '../../constants';

/** An error that already knows how it should be answered. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function toHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  return new HttpError(STATUS.INTERNAL, ERROR.INTERNAL, 'Internal error');
}
