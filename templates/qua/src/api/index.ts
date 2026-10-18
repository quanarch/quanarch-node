import { getQuanarCore } from '../state/index.js';
import type { ApiManager } from '../types/index.js';

// Thin forwarders: the quan says what to listen to, the quanar's api-manager listens.
export const api: ApiManager = {
  get: (path, handler) => getQuanarCore().api.get(path, handler),
  post: (path, handler) => getQuanarCore().api.post(path, handler),
  put: (path, handler) => getQuanarCore().api.put(path, handler),
  patch: (path, handler) => getQuanarCore().api.patch(path, handler),
  delete: (path, handler) => getQuanarCore().api.delete(path, handler),
};
