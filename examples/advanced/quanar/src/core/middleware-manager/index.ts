import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import { MIDDLEWARE, type AuthUser, type QuanarMiddleware, type ValidationRules } from 'shop-qua';
import { appConfig } from '../../config';
import { ERROR, STATUS } from '../../constants';
import { HttpError } from '../../utils';
import { authManager } from '../auth-manager';
import { permissionManager } from '../permission-manager';
import { validationManager } from '../validation-manager';

/** What the quanar knows about a request, kept in res.locals. */
export interface RequestContext {
  requestId: string;
  user: AuthUser | null;
}

const context = (res: { locals: Record<string, unknown> }) => res.locals as unknown as RequestContext;

const authenticate: RequestHandler = (_req, res, next) => {
  if (!context(res).user) return next(new HttpError(STATUS.UNAUTHORIZED, ERROR.UNAUTHENTICATED, 'Sign in first'));
  next();
};

/** A fixed window per client and api. */
function rateLimit(key: string): RequestHandler {
  const windows = new Map<string, { start: number; count: number }>();
  return (req, _res, next) => {
    const now = Date.now();
    const client = `${req.ip}:${key}`;
    const w = windows.get(client);
    if (!w || now - w.start > appConfig.rateLimit.windowMs) {
      windows.set(client, { start: now, count: 1 });
      return next();
    }
    if (++w.count > appConfig.rateLimit.max) return next(new HttpError(STATUS.TOO_MANY_REQUESTS, ERROR.RATE_LIMITED, 'Too many requests, try again later'));
    next();
  };
}

/**
 * The quanar's middlewares. Quans name them; this is where a name becomes code,
 * so a quan can never bring its own authentication or skip a check.
 */
export const middlewareManager = {
  /** Runs on every request: an id, and the user if the token is valid. */
  context: ((req, res, next) => {
    const requestId = req.get('x-request-id') ?? randomUUID();
    const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
    const ctx: RequestContext = { requestId, user: token ? authManager.verifyToken(token) : null };
    Object.assign(res.locals, ctx);
    res.set('x-request-id', requestId);
    next();
  }) as RequestHandler,

  resolve(name: QuanarMiddleware, key: string): RequestHandler {
    switch (name) {
      case MIDDLEWARE.AUTHENTICATE:
        return authenticate;
      case MIDDLEWARE.RATE_LIMIT:
        return rateLimit(key);
      default:
        throw new Error(`the quanar has no middleware "${name}"`);
    }
  },

  permit(required: string[]): RequestHandler[] {
    return [
      authenticate,
      (_req, res, next) => {
        const missing = permissionManager.missing(context(res).user!, required);
        if (missing.length) return next(new HttpError(STATUS.FORBIDDEN, ERROR.FORBIDDEN, `Needs ${missing.join(', ')}`, { missing }));
        next();
      },
    ];
  },

  validate(rules: ValidationRules): RequestHandler {
    return (req, _res, next) => {
      const query = { ...(req.query as Record<string, unknown>) };
      const issues = validationManager.validate(rules, { params: req.params, query, body: req.body });
      if (issues.length) return next(new HttpError(STATUS.UNPROCESSABLE, ERROR.VALIDATION, 'The request is not valid', { issues }));
      // Express 5 keeps req.query read-only; the coerced copy travels in locals.
      _res.locals.query = query;
      next();
    };
  },

  contextOf: context,
};
