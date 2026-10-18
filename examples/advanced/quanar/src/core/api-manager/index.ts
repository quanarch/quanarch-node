import express, { type NextFunction, type Request, type RequestHandler, type Response, type Router } from 'express';
import { MIDDLEWARE, type ApiRequest, type ApiResponse } from 'shop-qua';
import { STATUS } from '../../constants';
import type { ApiMeta } from '../../types';
import { middlewareManager } from '../middleware-manager';

type Invoke = (api: number, req: ApiRequest) => Promise<ApiResponse>;

const routers = new Map<string, Router>();
const listing = new Map<string, ApiMeta[]>();

/** Headers that stay with the quanar: a quan never sees the token. */
const PRIVATE_HEADERS = new Set(['authorization', 'cookie']);

function forward(index: number, api: ApiMeta, invoke: Invoke): RequestHandler {
  return async (req, res) => {
    const { requestId, user } = middlewareManager.contextOf(res);
    const request: ApiRequest = {
      requestId,
      method: api.method,
      path: req.path,
      params: { ...req.params } as Record<string, string>,
      query: (res.locals.query ?? req.query) as Record<string, string>,
      headers: Object.fromEntries(Object.entries(req.headers).filter(([k]) => !PRIVATE_HEADERS.has(k)).map(([k, v]) => [k, String(v)])),
      body: req.body ?? null,
      user,
      locals: {},
    };
    const answer = await invoke(index, request);
    res.status(answer.status ?? STATUS.OK);
    if (answer.headers) res.set(answer.headers);
    if (answer.body === undefined) res.end();
    else res.json(answer.body);
  };
}

/**
 * Opens the apis quans declare. Each quan gets its own router, built in one pass over
 * its apis: the quanar's middlewares, then authentication and permissions, then
 * validation, and only then the quan. Removing a quan drops its router at once.
 */
export const apiManager = {
  create(owner: string, apis: ApiMeta[], invoke: Invoke) {
    const router = express.Router();
    apis.forEach((api, index) => {
      if (api.endpoint !== `/${owner}` && !api.endpoint.startsWith(`/${owner}/`)) {
        throw new Error(`${owner} may not listen to ${api.endpoint}: endpoints start with /${owner}`);
      }
      const key = `${api.method} ${api.endpoint}`;
      const chain: RequestHandler[] = [
        ...api.middlewares.filter((m) => !(api.permissions.length && m === MIDDLEWARE.AUTHENTICATE)).map((m) => middlewareManager.resolve(m, key)),
        ...(api.permissions.length ? middlewareManager.permit(api.permissions) : []),
        ...(api.validation ? [middlewareManager.validate(api.validation)] : []),
        forward(index, api, invoke),
      ];
      router[api.method.toLowerCase() as 'get'](api.endpoint, ...chain);
    });
    routers.set(owner, router);
    listing.set(owner, apis);
  },

  remove(owner: string) {
    routers.delete(owner);
    listing.delete(owner);
  },

  /** One handler in front of every quan's router; the set of routers changes while the server runs. */
  dispatcher(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      const list = [...routers.values()];
      let i = 0;
      const step = (error?: unknown) => {
        if (error) return next(error);
        const router = list[i++];
        if (!router) return next();
        router(req, res, step);
      };
      step();
    };
  },

  describe() {
    return Object.fromEntries(
      [...listing].map(([owner, apis]) => [
        owner,
        apis.map(({ method, endpoint, permissions, middlewares, description, validation }) => ({
          method,
          endpoint,
          permissions,
          middlewares,
          validated: !!validation,
          description,
        })),
      ]),
    );
  },
};
