import type { ApiDefinition } from '../api/index.js';
import type { EventSubscription } from '../event/index.js';
import type { ModelDefinition } from '../model/index.js';
import type { PermissionDefinition } from '../permission/index.js';

/** Everything a quan is, declared. The quanar's quan-registry turns it into a running quan. */
export interface QuanManifest {
  name: string;
  version: string;
  models?: ModelDefinition[];
  permissions?: PermissionDefinition[];
  apis: ApiDefinition[];
  events?: EventSubscription[];
  /** Runs once the quanar has created the models and opened the apis. */
  onMount?: () => void | Promise<void>;
  onUnmount?: () => void | Promise<void>;
}
