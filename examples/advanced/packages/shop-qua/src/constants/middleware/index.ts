/**
 * Middlewares the quanar provides. A quan names them in an api's middlewares;
 * they run in the quanar, before the request reaches the quan.
 */
export const MIDDLEWARE = {
  /** Answers 401 unless the request carries a valid token. */
  AUTHENTICATE: 'authenticate',
  /** Answers 429 when one client calls the api too often. */
  RATE_LIMIT: 'rate-limit',
} as const;

export type QuanarMiddleware = (typeof MIDDLEWARE)[keyof typeof MIDDLEWARE];
