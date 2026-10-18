import type { QuanSource } from '../../types';
import { apiManager } from '../api-manager';
import { eventManager } from '../event-manager';
import { createLogger } from '../logger';
import { permissionManager } from '../permission-manager';
import { QuanProcess } from '../quan-process';
import { schemaManager } from '../schema-manager';

const log = createLogger('registry');

interface Mounted {
  source: QuanSource;
  codeHash: string;
  process: QuanProcess;
}

const mounted = new Map<string, Mounted>();

/**
 * Turns what a quan declared into a running quan, through the managers:
 * its models become tables, its permissions become known, its apis are opened,
 * its subscriptions start receiving events, and only then does it start.
 */
export const quanRegistry = {
  async mount(source: QuanSource, code: string, codeHash: string, onCrash: (code: number | null) => void) {
    const process = new QuanProcess(source);
    try {
      const manifest = await process.load(code);
      if (manifest.name !== source.name) throw new Error(`the manifest says "${manifest.name}", the list says "${source.name}"`);

      await quanRegistry.unmount(source.name, `${manifest.version} arrived`);

      schemaManager.sync(source.name, manifest.models);
      permissionManager.register(source.name, manifest.permissions);
      apiManager.create(source.name, manifest.apis, (api, req) => process.request(api, req));
      eventManager.subscribe(source.name, manifest.events, (sub, payload, meta) => process.deliver(sub, payload, meta));
      mounted.set(source.name, { source, codeHash, process });
      await process.start();

      process.onExit((code) => {
        if (mounted.get(source.name)?.process !== process) return;
        quanRegistry.release(source.name);
        onCrash(code);
      });
      log.info(
        `${source.name}@${manifest.version} mounted in pid ${process.pid}: ${manifest.apis.length} apis, ${manifest.models.length} models, ${manifest.events.length} subscriptions`,
      );
    } catch (error) {
      process.kill();
      if (mounted.get(source.name)?.process === process) quanRegistry.release(source.name);
      throw error;
    }
  },

  async unmount(name: string, reason: string) {
    const quan = mounted.get(name);
    if (!quan) return;
    quanRegistry.release(name);
    await quan.process.stop();
    log.warn(`${name} unmounted: ${reason}`);
  },

  /** Takes a quan out of every manager. Its tables and rows stay. */
  release(name: string) {
    apiManager.remove(name);
    eventManager.forget(name);
    permissionManager.remove(name);
    schemaManager.remove(name);
    mounted.delete(name);
  },

  codeHash(name: string) {
    return mounted.get(name)?.codeHash;
  },

  pid(name: string) {
    return mounted.get(name)?.process.pid;
  },

  names() {
    return [...mounted.keys()];
  },
};
