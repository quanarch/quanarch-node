import type { AuthCapability } from '../auth/index.js';
import type { DbCapability } from '../db/index.js';
import type { EventsCapability } from '../event/index.js';

export interface Logger {
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
}

/** What the quanar implements and plugs in with init(). */
export interface QuanarCore {
  db: DbCapability;
  auth: AuthCapability;
  events: EventsCapability;
  log: Logger;
}
