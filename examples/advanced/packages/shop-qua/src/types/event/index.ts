export interface EventMeta {
  /** The quan that emitted it. */
  from: string;
  /** ISO time */
  at: string;
}

/** An event a quan listens to. Emitters and listeners never know each other's code. */
export interface EventSubscription<P = any> {
  /** <quan>.<name>, for example orders.placed */
  event: string;
  handler: (payload: P, meta: EventMeta) => void | Promise<void>;
}

export interface EventsCapability {
  /** The name must start with the emitting quan's name. */
  emit: (event: string, payload: unknown) => Promise<void>;
}
