import { appConfig, readQuanSources } from '../../config';
import { HashMismatchError, UnreachableError, createLogger, fetchQuan, quanRegistry, subscribe, verifyQuan } from '../../core';
import type { QuanSource } from '../../types';
import { errorMessage } from '../../utils';

const log = createLogger('quans');

type QuanState = 'pending' | 'mounted' | 'unreachable' | 'hash-mismatch' | 'failed' | 'crashed';

const sources = readQuanSources();
const states = new Map<string, { state: QuanState; detail?: string }>();
const queues = new Map<string, Promise<void>>();
const closers = new Map<string, () => void>();
const retries = new Map<string, NodeJS.Timeout>();

function setState(name: string, state: QuanState, detail?: string) {
  if (states.get(name)?.state !== state && state !== 'mounted') log.warn(`${name}: ${state}`, detail);
  states.set(name, { state, detail });
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
    await quanRegistry.unmount(source.name, state);
    return;
  }
  if (quanRegistry.codeHash(source.name) === codeHash) return;

  try {
    await quanRegistry.mount(source, code, codeHash, (exit) => setState(source.name, 'crashed', `process exited with ${exit}`));
    setState(source.name, 'mounted');
  } catch (error) {
    setState(source.name, 'failed', errorMessage(error));
    await quanRegistry.unmount(source.name, 'failed');
  }
}

/** One sync at a time per quan. */
function sync(source: QuanSource) {
  const next = (queues.get(source.name) ?? Promise.resolve()).then(() => syncOne(source));
  queues.set(source.name, next);
  return next;
}

/** Follows a quan's event stream: load on open, reload on change, unmount on close. */
function watch(source: QuanSource) {
  states.set(source.name, { state: 'pending' });
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
          await quanRegistry.unmount(source.name, 'its event stream closed');
          retries.set(source.name, setTimeout(connect, appConfig.reconnectMs));
        },
      }),
    );
  };
  connect();
}

export const quanService = {
  start() {
    if (!sources.length) log.warn(`no quans listed in ${appConfig.quansFile}`);
    sources.forEach(watch);
  },

  status() {
    return sources.map((s) => ({ name: s.name, version: s.version, quas: s.quas, ...states.get(s.name), pid: quanRegistry.pid(s.name) }));
  },

  async stop() {
    retries.forEach(clearTimeout);
    closers.forEach((close) => close());
    await Promise.all(quanRegistry.names().map((name) => quanRegistry.unmount(name, 'quanar stopping')));
  },
};
