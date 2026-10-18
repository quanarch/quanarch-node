import type { Handler, HttpMethod } from '../../types';
import { matchPath } from '../../utils';

interface Listener {
  owner: string;
  method: HttpMethod;
  path: string;
  handler: Handler;
}

const listeners: Listener[] = [];

/** "/notes" or "notes" → "/notes" */
export function normalizePath(path: string): string {
  return '/' + path.replace(/^\/+/, '').replace(/\/+$/, '');
}

/**
 * The quanar's listener table. Quans ask it to listen to a method and a path through the qua;
 * when a request comes, it finds whose it is and hands it over.
 */
export const apiManager = {
  listen(owner: string, method: HttpMethod, path: string, handler: Handler) {
    listeners.push({ owner, method, path: normalizePath(path), handler });
  },

  /** Stops listening to everything a quan asked for. */
  forget(owner: string) {
    for (let i = listeners.length - 1; i >= 0; i--) if (listeners[i].owner === owner) listeners.splice(i, 1);
  },

  find(method: HttpMethod, path: string) {
    for (const listener of listeners) {
      if (listener.method !== method) continue;
      const params = matchPath(listener.path, path);
      if (params) return { ...listener, params };
    }
    return null;
  },

  listening(owner: string) {
    return listeners.filter((l) => l.owner === owner).map((l) => `${l.method} ${l.path}`);
  },
};
