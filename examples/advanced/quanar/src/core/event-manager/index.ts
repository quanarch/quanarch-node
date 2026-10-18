import type { EventMeta } from 'shop-qua';
import { errorMessage, nowIso } from '../../utils';
import { createLogger } from '../logger';

const log = createLogger('events');

type Deliver = (subscription: number, payload: unknown, meta: EventMeta) => Promise<void>;

const listeners = new Map<string, { events: string[]; deliver: Deliver }>();

/**
 * Carries events between quans. An emitter does not know who listens; a listener does
 * not know who emits. Delivery is at most once: a quan that is not mounted misses it.
 */
export const eventManager = {
  subscribe(owner: string, events: string[], deliver: Deliver) {
    listeners.set(owner, { events, deliver });
  },

  forget(owner: string) {
    listeners.delete(owner);
  },

  /** Returns how many subscriptions it reached. */
  publish(from: string, event: string, payload: unknown): number {
    if (!event.startsWith(`${from}.`)) throw new Error(`${from} may not emit ${event}: events start with ${from}.`);
    const meta: EventMeta = { from, at: nowIso() };
    let reached = 0;
    for (const [owner, { events, deliver }] of listeners) {
      events.forEach((name, subscription) => {
        if (name !== event) return;
        reached++;
        deliver(subscription, payload, meta).catch((error) => log.error(`${owner} failed on ${event}`, errorMessage(error)));
      });
    }
    log.info(`${event} from ${from} → ${reached} listener${reached === 1 ? '' : 's'}`);
    return reached;
  },

  describe() {
    return Object.fromEntries([...listeners].map(([owner, { events }]) => [owner, events]));
  },
};
