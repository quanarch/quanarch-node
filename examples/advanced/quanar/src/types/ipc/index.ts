import type { ApiRequest, ApiResponse, EventMeta } from 'shop-qua';
import type { ManifestMeta } from '../quan-meta';

/** quanar → quan process */
export type ToQuan =
  | { type: 'load'; name: string; code: string; quas: string[] }
  | { type: 'start' }
  | { type: 'request'; id: number; api: number; req: ApiRequest }
  | { type: 'event'; id: number; subscription: number; payload: unknown; meta: EventMeta }
  | { type: 'result'; id: number; value?: unknown; error?: string }
  | { type: 'unmount' };

/** quan process → quanar */
export type FromQuan =
  | { type: 'loaded'; manifest: ManifestMeta }
  | { type: 'load-failed'; error: string }
  | { type: 'started'; error?: string }
  | { type: 'response'; id: number; res?: ApiResponse; error?: string }
  | { type: 'delivered'; id: number; error?: string }
  | { type: 'call'; id: number; capability: string; args: unknown[] }
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string; data?: unknown };
