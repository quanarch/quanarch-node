import { QUAN_SOURCES } from '../../config';
import { appConfig } from '../../config';
import { HashMismatchError, QuanProcess, UnreachableError, apiManager, createLogger, fetchQuan, normalizePath, subscribe, verifyQuan } from '../../core';
import type { QuanSource } from '../../types';
import { errorMessage } from '../../utils';

const log = createLogger('quans');

type QuanState = 'mounted' | 'unreachable' | 'hash-mismatch' | 'failed' | 'crashed';

interface MountedQuan {
  source: QuanSource;
  codeHash: string;
  process: QuanProcess;
}

const mounted = new Map<string, MountedQuan>();
const states = new Map<string, { state: QuanState; detail?: string }>();

function setState(name: string, state: QuanState, detail?: string) {
  if (states.get(name)?.state !== state) log.warn(`${name}: ${state}`, detail);
  states.set(name, { state, detail });
}

async function unmount(name: string, reason: string) {
  const quan = mounted.get(name);
  if (!quan) return;
  apiManager.forget(name);
  mounted.delete(name);
  await quan.process.stop();
  log.warn(`${name} unmounted: ${reason}`);
}

async function mount(source: QuanSource, code: string, codeHash: string) {
  const process = new QuanProcess(source);
  const listens = await process.load(code);

  // A quan may only listen under its own name: /billing, /billing/:id
  for (const { path } of listens) {
    const p = normalizePath(path);
    if (p !== `/${source.name}` && !p.startsWith(`/${source.name}/`)) {
      process.kill();
      throw new Error(`${source.name} may not listen to ${p}: paths start with /${source.name}`);
    }
  }

  await unmount(source.name, 'a new build arrived');
  listens.forEach((l, i) => apiManager.listen(source.name, l.method, l.path, (req) => process.request(i, req)));
  mounted.set(source.name, { source, codeHash, process });
  states.set(source.name, { state: 'mounted' });

  // If its process falls, the quan is gone until the next sync brings it back.
  process.onExit((code) => {
    if (mounted.get(source.name)?.process !== process) return;
    apiManager.forget(source.name);
    mounted.delete(source.name);
    setState(source.name, 'crashed', `process exited with ${code}`);
  });

  log.info(`${source.name} mounted in pid ${process.pid}, listening to ${apiManager.listening(source.name).join(', ') || 'nothing'}`);
}

async function syncOne(source: QuanSource) {
  let code: string;
  let codeHash: string;
  try {
    code = await fetchQuan(source);
    codeHash = verifyQuan(source, code);
  } catch (error) {
    const state: QuanState = error instanceof UnreachableError ? 'unreachable' : error instanceof HashMismatchError ? 'hash-mismatch' : 'failed';
    setState(source.name, state, errorMessage(error));
    await unmount(source.name, state);
    return;
  }

  // The same code is already running: nothing to do.
  if (mounted.get(source.name)?.codeHash === codeHash) return;

  try {
    await mount(source, code, codeHash);
  } catch (error) {
    setState(source.name, 'failed', errorMessage(error));
    await unmount(source.name, 'failed');
  }
}

// One sync at a time per quan: an open and a change arriving together must not mount twice.
const queues = new Map<string, Promise<void>>();
function sync(source: QuanSource) {
  const next = (queues.get(source.name) ?? Promise.resolve()).then(() => syncOne(source));
  queues.set(source.name, next);
  return next;
}

const closers = new Map<string, () => void>();
const retries = new Map<string, NodeJS.Timeout>();

/** Follows a quan's event stream: load on open, reload on change, unmount on close. */
function watch(source: QuanSource) {
  if (!source.events) {
    void sync(source);
    return;
  }
  const events = source.events;
  const connect = () => {
    closers.set(
      source.name,
      subscribe(events, {
        onOpen: () => void sync(source),
        onEvent: (name) => {
          if (name === 'change') void sync(source);
        },
        onClose: async () => {
          setState(source.name, 'unreachable', `${events} closed`);
          await unmount(source.name, 'its event stream closed');
          retries.set(source.name, setTimeout(connect, appConfig.reconnectMs));
        },
      }),
    );
  };
  connect();
}

export const quanService = {
  start() {
    QUAN_SOURCES.forEach(watch);
  },

  status() {
    return QUAN_SOURCES.map((s) => ({
      name: s.name,
      quas: s.quas,
      ...(states.get(s.name) ?? { state: 'pending' }),
      pid: mounted.get(s.name)?.process.pid,
      listening: apiManager.listening(s.name),
    }));
  },

  async stop() {
    retries.forEach(clearTimeout);
    closers.forEach((close) => close());
    await Promise.all([...mounted.keys()].map((name) => unmount(name, 'quanar stopping')));
  },
};
