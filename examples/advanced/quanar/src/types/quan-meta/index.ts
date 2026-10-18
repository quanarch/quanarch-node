import type { HttpMethod, ModelDefinition, PermissionDefinition, QuanarMiddleware, ValidationRules } from 'shop-qua';

/** An api as the quanar keeps it: everything but the code, which stays in the quan's process. */
export interface ApiMeta {
  endpoint: string;
  method: HttpMethod;
  middlewares: QuanarMiddleware[];
  permissions: string[];
  validation?: ValidationRules;
  description?: string;
  /** How many of the quan's own middlewares run before its handler. */
  localMiddlewares: number;
}

/** What a quan declared, sent from its process once it has loaded. */
export interface ManifestMeta {
  name: string;
  version: string;
  models: ModelDefinition[];
  permissions: PermissionDefinition[];
  apis: ApiMeta[];
  /** The events it listens to, in the order of its subscriptions. */
  events: string[];
}
