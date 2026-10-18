import { fork, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { appConfig } from '../../config';
import { STATUS } from '../../constants';
import type { FromQuan, Listen, QuanRequest, QuanResponse, QuanSource, ToQuan } from '../../types';
import { errorMessage } from '../../utils';
import { createLogger } from '../logger';
import { pluggedCapabilities } from '../qua-core';

const HOST = path.join(__dirname, 'quan-host.cjs');

/**
 * One quan in its own process: the permission model is on, the environment is empty,
 * memory is limited. The quanar talks to it only through messages.
 */
export class QuanProcess {
  private child: ChildProcess;
  private nextId = 0;
  private waiting = new Map<number, { resolve: (r: QuanResponse) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }>();
  private log;
  private capabilities;
  private exitListeners: ((code: number | null) => void)[] = [];

  constructor(private source: QuanSource) {
    this.log = createLogger(source.name);
    this.capabilities = pluggedCapabilities(source.quas);
    this.child = fork(HOST, [], {
      env: {},
      execArgv: ['--permission', `--allow-fs-read=${HOST}`, `--max-old-space-size=${appConfig.quanMemoryMb}`],
      stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    });
    this.child.on('message', (m: FromQuan) => this.onMessage(m));
    this.child.on('exit', (code) => {
      for (const w of this.waiting.values()) {
        clearTimeout(w.timer);
        w.reject(Object.assign(new Error(`${source.name} stopped`), { status: STATUS.SERVICE_UNAVAILABLE }));
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

  /** Sends the code into the quan's process and waits for what it asked the quanar to listen to. */
  load(code: string): Promise<Listen[]> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.kill();
        reject(new Error(`${this.source.name} did not load in ${appConfig.loadTimeoutMs}ms`));
      }, appConfig.loadTimeoutMs);
      const onMessage = (m: FromQuan) => {
        if (m.type !== 'loaded' && m.type !== 'load-failed') return;
        clearTimeout(timer);
        this.child.off('message', onMessage);
        if (m.type === 'loaded') resolve(m.listens);
        else {
          this.kill();
          reject(new Error(m.error));
        }
      };
      this.child.on('message', onMessage);
      this.post({ type: 'load', name: this.source.name, code, quas: this.source.quas });
    });
  }

  /** Hands a request to the handler the quan registered for it. */
  request(route: number, req: QuanRequest): Promise<QuanResponse> {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      // A quan stuck in a loop is shut down; its process goes, the quanar stays.
      const timer = setTimeout(() => {
        this.waiting.delete(id);
        this.log.error(`no answer in ${appConfig.requestTimeoutMs}ms, stopping it`);
        this.kill();
        reject(Object.assign(new Error(`${this.source.name} did not answer`), { status: STATUS.GATEWAY_TIMEOUT }));
      }, appConfig.requestTimeoutMs);
      this.waiting.set(id, { resolve, reject, timer });
      this.post({ type: 'request', id, route, req });
    });
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

  private post(message: ToQuan) {
    if (this.child.connected) this.child.send(message);
  }

  private async onMessage(m: FromQuan) {
    if (m.type === 'log') {
      this.log[m.level](m.message);
    } else if (m.type === 'response') {
      const w = this.waiting.get(m.id);
      if (!w) return;
      clearTimeout(w.timer);
      this.waiting.delete(m.id);
      if (m.error) w.reject(new Error(m.error));
      else w.resolve(m.res ?? {});
    } else if (m.type === 'call') {
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
