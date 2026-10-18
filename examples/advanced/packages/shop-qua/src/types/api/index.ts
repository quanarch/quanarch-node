import type { HttpMethod, QuanarMiddleware } from '../../constants/index.js';
import type { AuthUser } from '../auth/index.js';
import type { ValidationRules } from '../validation/index.js';

/** A request as the quan sees it: already authenticated, permitted and validated by the quanar. */
export interface ApiRequest<B = unknown> {
  requestId: string;
  method: HttpMethod;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: B;
  user: AuthUser | null;
  /** Filled by the quan's own middlewares for the handler that follows, for example a loaded row. */
  locals: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  status?: number;
  body?: T;
  headers?: Record<string, string>;
}

export type Handler<B = any> = (req: ApiRequest<B>) => ApiResponse | Promise<ApiResponse>;

/** A middleware of the quan itself. It runs in the quan, after the quanar's checks. */
export type LocalMiddleware = (req: ApiRequest, next: () => Promise<ApiResponse>) => ApiResponse | Promise<ApiResponse>;

/**
 * An api the quan asks the quanar to listen to. The quan declares it; the quanar's
 * api-manager opens the route, runs its middlewares, checks its permissions and
 * validation, and only then hands the request to the handler.
 */
export interface ApiDefinition<B = any> {
  /** Absolute and starts with the quan's name: /products, /products/:id */
  endpoint: string;
  method: HttpMethod;
  handler: Handler<B>;
  /** Names run in the quanar; functions run in the quan. Quanar ones always run first. */
  middlewares?: (QuanarMiddleware | LocalMiddleware)[];
  /** Every permission is required. Implies authentication. */
  permissions?: string[];
  validation?: ValidationRules;
  description?: string;
}
