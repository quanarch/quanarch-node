/** Codes the quanar answers with; the client can rely on them. */
export const ERROR = {
  NOT_FOUND: 'not_found',
  UNAUTHENTICATED: 'unauthenticated',
  FORBIDDEN: 'forbidden',
  VALIDATION: 'validation_failed',
  RATE_LIMITED: 'rate_limited',
  BAD_REQUEST: 'bad_request',
  QUAN_UNAVAILABLE: 'quan_unavailable',
  QUAN_TIMEOUT: 'quan_timeout',
  QUAN_FAILED: 'quan_failed',
  INTERNAL: 'internal',
} as const;

export type ErrorCode = (typeof ERROR)[keyof typeof ERROR];
