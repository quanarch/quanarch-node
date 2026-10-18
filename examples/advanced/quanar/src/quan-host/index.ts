/**
 * The quan's own process. The quanar starts one per quan with the permission model on and an
 * empty environment: no file system, no child processes, no workers, no native addons. This file
 * is quanar code; the quan arrives as text, declares what it is, and only sees its quas.
 */
import vm from 'node:vm';
import * as ShopQua from 'shop-qua';
import type { ApiDefinition, ApiRequest, ApiResponse, EventSubscription, LocalMiddleware, QuanarMiddleware, QuanManifest } from 'shop-qua';
import type { FromQuan, ManifestMeta, ToQuan } from '../types';

const send = (message: FromQuan) => process.send!(message);
const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

// ---- capability calls go back to the quanar ----

let nextCall = 0;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

function call(capability: string, args: unknown[]): Promise<any> {
  const id = ++nextCall;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    send({ type: 'call', id, capability, args });
  });
}

const QUAS: Record<string, { module: unknown; plug: () => void }> = {
  'shop-qua': {
    module: ShopQua,
    plug: () =>
      ShopQua.init({
        db: {
          run: (op) => call('shop-qua:db.run', [op]),
          transaction: (ops) => call('shop-qua:db.transaction', [ops]),
        },
        auth: {
          issueToken: (claims) => call('shop-qua:auth.issueToken', [claims]),
          hashPassword: (password) => call('shop-qua:auth.hashPassword', [password]),
          verifyPassword: (password, hash) => call('shop-qua:auth.verifyPassword', [password, hash]),
        },
        events: {
          emit: (event, payload) => call('shop-qua:events.emit', [event, payload]),
        },
        log: {
          info: (message, data) => send({ type: 'log', level: 'info', message, data }),
          warn: (message, data) => send({ type: 'log', level: 'warn', message, data }),
          error: (message, data) => send({ type: 'log', level: 'error', message, data }),
        },
      }),
  },
};

// ---- walls the permission model does not cover ----

function closeWalls() {
  for (const name of ['mainModule', 'argv', 'execArgv', 'execPath'] as const) {
    Object.defineProperty(process, name, { value: undefined, configurable: false });
  }
  const blocked = new Set(['net', 'http', 'https', 'http2', 'tls', 'dgram', 'dns', 'fs', 'child_process', 'worker_threads', 'cluster', 'vm', 'inspector', 'module', 'repl']);
  const original = process.getBuiltinModule.bind(process);
  process.getBuiltinModule = ((id: string) => {
    if (blocked.has(id.replace(/^node:/, ''))) throw new Error(`"${id}" is not available to quans`);
    return original(id);
  }) as typeof process.getBuiltinModule;
  for (const name of ['fetch', 'WebSocket', 'EventSource', 'Request', 'Response', 'Headers', 'FormData']) {
    delete (globalThis as Record<string, unknown>)[name];
  }
}

// ---- the quan ----

let manifest: QuanManifest;
const locals: LocalMiddleware[][] = [];

function load(name: string, code: string, quas: string[]): ManifestMeta {
  for (const qua of quas) QUAS[qua]?.plug();
  closeWalls();

  const quanRequire = (id: string): unknown => {
    if (quas.includes(id) && QUAS[id]) return QUAS[id].module;
    throw new Error(`${name} asked for "${id}", but it is not plugged in. Plugged: ${quas.join(', ') || 'nothing'}`);
  };
  const module = { exports: {} as Record<string, unknown> };
  vm.compileFunction(code, ['exports', 'require', 'module'], { filename: `quan:${name}` })(module.exports, quanRequire, module);

  const found = (module.exports.default ?? module.exports.manifest) as QuanManifest | undefined;
  if (!found?.name || !Array.isArray(found.apis)) throw new Error(`${name} exports no manifest`);
  manifest = found;

  // The code stays here; the quanar gets what each api declares.
  const apis = manifest.apis.map((api: ApiDefinition) => {
    const middlewares = api.middlewares ?? [];
    locals.push(middlewares.filter((m): m is LocalMiddleware => typeof m === 'function'));
    return {
      endpoint: api.endpoint,
      method: api.method,
      middlewares: middlewares.filter((m): m is QuanarMiddleware => typeof m === 'string'),
      permissions: api.permissions ?? [],
      validation: api.validation,
      description: api.description,
      localMiddlewares: locals[locals.length - 1].length,
    };
  });
  return {
    name: manifest.name,
    version: manifest.version,
    models: manifest.models ?? [],
    permissions: manifest.permissions ?? [],
    apis,
    events: (manifest.events ?? []).map((e: EventSubscription) => e.event),
  };
}

/** The quan's own middlewares, then its handler. A middleware may answer without calling next. */
function handle(index: number, req: ApiRequest): Promise<ApiResponse> {
  const chain = locals[index];
  const run = (i: number): Promise<ApiResponse> =>
    i < chain.length ? Promise.resolve(chain[i](req, () => run(i + 1))) : Promise.resolve(manifest.apis[index].handler(req));
  return run(0);
}

process.on('message', async (message: ToQuan) => {
  switch (message.type) {
    case 'load':
      try {
        send({ type: 'loaded', manifest: load(message.name, message.code, message.quas) });
      } catch (error) {
        send({ type: 'load-failed', error: errorText(error) });
      }
      return;

    case 'start':
      try {
        await manifest.onMount?.();
        send({ type: 'started' });
      } catch (error) {
        send({ type: 'started', error: errorText(error) });
      }
      return;

    case 'request':
      try {
        send({ type: 'response', id: message.id, res: await handle(message.api, message.req) });
      } catch (error) {
        send({ type: 'response', id: message.id, error: errorText(error) });
      }
      return;

    case 'event':
      try {
        await manifest.events![message.subscription].handler(message.payload, message.meta);
        send({ type: 'delivered', id: message.id });
      } catch (error) {
        send({ type: 'delivered', id: message.id, error: errorText(error) });
      }
      return;

    case 'result': {
      const waiting = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) waiting?.reject(new Error(message.error));
      else waiting?.resolve(message.value);
      return;
    }

    case 'unmount':
      try {
        await manifest?.onUnmount?.();
      } finally {
        process.exit(0);
      }
  }
});

process.on('uncaughtException', (error) => {
  send({ type: 'log', level: 'error', message: `crashed: ${error.message}` });
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  send({ type: 'log', level: 'error', message: `crashed: ${errorText(reason)}` });
  process.exit(1);
});
