import { fork, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import type { ApiRequest, ApiResponse, EventMeta } from 'shop-qua';
import { appConfig } from '../../config';
import { ERROR, STATUS } from '../../constants';
import type { FromQuan, ManifestMeta, QuanSource, ToQuan } from '../../types';
import { HttpError, errorMessage } from '../../utils';
import { createLogger } from '../logger';
import { pluggedCapabilities } from '../qua-core';

const HOST = path.join(__dirname, 'quan-host.cjs');

type Waiting = { resolve: (value: any) => void; reject: (e: Error) => void; timer: NodeJS.Timeout };

/**
 * One quan in its own process: the permission model is on, the environment is empty,
 * memory is limited. The quanar talks to it only through messages.
 */
export class QuanProcess {
  private child: ChildProcess;
  private nextId = 0;
  private waiting = new Map<number, Waiting>();
  private log;
  private capabilities;
  private exitListeners: ((code: number | null) => void)[] = [];

  constructor(private source: QuanSource) {
    this.log = createLogger(source.name);
    this.capabilities = pluggedCapabilities(source.name, source.quas);
    this.child = fork(HOST, [], {
      env: {},
      execArgv: ['--permission', `--allow-fs-read=${HOST}`, `--max-old-space-size=${appConfig.quanMemoryMb}`],
      stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    });
    this.child.on('message', (m: FromQuan) => this.onMessage(m));
    this.child.on('exit', (code) => {
      for (const w of this.waiting.values()) {
        clearTimeout(w.timer);
        w.reject(new HttpError(STATUS.SERVICE_UNAVAILABLE, ERROR.QUAN_UNAVAILABLE, `${source.name} stopped`));
      }
      this.waiting.clear();
      this.exitListeners.forEach((l) => l(code));
    });
  }

  get pid() {
    return this.child.pid;
  }

  onExit(listener: (code: number | null) => void) {
    this.exitListeners.push(listener);
  }

  /** Sends the code in and waits for everything the quan declared. */
  load(code: string): Promise<ManifestMeta> {
    return this.once('loaded', 'load-failed', { type: 'load', name: this.source.name, code, quas: this.source.quas }, (m) =>
      m.type === 'loaded' ? m.manifest : new Error(m.type === 'load-failed' ? m.error : 'load failed'),
    );
  }

  /** Lets the quan run its onMount, once its models and apis are in place. */
  start(): Promise<void> {
    return this.once('started', 'started', { type: 'start' }, (m) => (m.type === 'started' && m.error ? new Error(m.error) : undefined));
  }

  request(api: number, req: ApiRequest): Promise<ApiResponse> {
    return this.ask({ type: 'request', id: 0, api, req }, () => {
      this.log.error(`no answer to ${req.method} ${req.path} in ${appConfig.requestTimeoutMs}ms, stopping it`);
      this.kill();
      return new HttpError(STATUS.GATEWAY_TIMEOUT, ERROR.QUAN_TIMEOUT, `${this.source.name} did not answer`);
    });
  }

  deliver(subscription: number, payload: unknown, meta: EventMeta): Promise<void> {
    return this.ask({ type: 'event', id: 0, subscription, payload, meta }, () => new Error(`${this.source.name} did not handle the event in time`));
  }

  /** Asks the quan to clean up, then makes sure its process is gone. */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.child.exitCode !== null) return resolve();
      const timer = setTimeout(() => this.kill(), 2000);
      this.child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
      this.post({ type: 'unmount' });
    });
  }

  kill() {
    if (this.child.exitCode === null) this.child.kill('SIGKILL');
  }

  private once<T>(ok: FromQuan['type'], fail: FromQuan['type'], message: ToQuan, read: (m: FromQuan) => T | Error): Promise<Exclude<T, Error>> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.kill();
        reject(new Error(`${this.source.name} did not answer ${message.type} in ${appConfig.loadTimeoutMs}ms`));
      }, appConfig.loadTimeoutMs);
      const onMessage = (m: FromQuan) => {
        if (m.type !== ok && m.type !== fail) return;
        clearTimeout(timer);
        this.child.off('message', onMessage);
        const value = read(m);
        if (value instanceof Error) reject(value);
        else resolve(value as Exclude<T, Error>);
      };
      this.child.on('message', onMessage);
      this.post(message);
    });
  }

  private ask<T>(message: Extract<ToQuan, { id: number }>, onTimeout: () => Error): Promise<T> {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiting.delete(id);
        reject(onTimeout());
      }, appConfig.requestTimeoutMs);
      this.waiting.set(id, { resolve, reject, timer });
      this.post({ ...message, id });
    });
  }

  private settle(id: number, error: string | undefined, value: unknown) {
    const w = this.waiting.get(id);
    if (!w) return;
    clearTimeout(w.timer);
    this.waiting.delete(id);
    if (error) w.reject(new HttpError(STATUS.INTERNAL, ERROR.QUAN_FAILED, error));
    else w.resolve(value);
  }

  private post(message: ToQuan) {
    if (this.child.connected) this.child.send(message);
  }

  private async onMessage(m: FromQuan) {
    switch (m.type) {
      case 'log':
        this.log[m.level](m.message, m.data);
        return;
      case 'response':
        this.settle(m.id, m.error, m.res ?? {});
        return;
      case 'delivered':
        this.settle(m.id, m.error, undefined);
        return;
      case 'call': {
        const capability = this.capabilities[m.capability];
        if (!capability) {
          this.post({ type: 'result', id: m.id, error: `${m.capability} is not plugged into ${this.source.name}` });
          return;
        }
        try {
          this.post({ type: 'result', id: m.id, value: await capability(...m.args) });
        } catch (error) {
          this.post({ type: 'result', id: m.id, error: errorMessage(error) });
        }
      }
    }
  }
}
