import { getQuanarCore } from '../state/index.js';
import type { DbManager } from '../types/index.js';

// Thin forwarders: the quan names the table, the quanar's db-manager stores.
export const db: DbManager = {
  create: (table, data) => getQuanarCore().db.create(table, data),
  list: (table) => getQuanarCore().db.list(table),
  get: (table, id) => getQuanarCore().db.get(table, id),
  update: (table, id, data) => getQuanarCore().db.update(table, id, data),
  remove: (table, id) => getQuanarCore().db.remove(table, id),
};
