export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** A request as the quanar hands it to a quan. */
export interface QuanRequest {
  method: HttpMethod;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
  body: unknown;
}

export interface QuanResponse<T = unknown> {
  status?: number;
  body?: T;
}

export type Handler = (req: QuanRequest) => QuanResponse | Promise<QuanResponse>;

export type Row = { id: string } & Record<string, unknown>;

/** Where a quan lives and which quas are plugged into it. */
export interface QuanSource {
  name: string;
  url: string;
  /**
   * An event stream that says "a new build is ready" with a change event. The quanar loads the quan
   * when the stream opens, reloads it on change and unmounts it the moment the stream closes.
   * Without it the quan is loaded once, at start.
   */
  events?: string;
  /** SHA-256 of the file. When set, a file that does not match is never run. */
  hash?: string;
  /** The cables. Only these quas exist for the quan; asking for anything else fails. */
  quas: string[];
}

/** What a quan asked the quanar to listen to. The handler stays in the quan's process. */
export interface Listen {
  method: HttpMethod;
  path: string;
}

/** quanar → quan process */
export type ToQuan =
  | { type: 'load'; name: string; code: string; quas: string[] }
  | { type: 'request'; id: number; route: number; req: QuanRequest }
  | { type: 'result'; id: number; value?: unknown; error?: string }
  | { type: 'unmount' };

/** quan process → quanar */
export type FromQuan =
  | { type: 'loaded'; listens: Listen[] }
  | { type: 'load-failed'; error: string }
  | { type: 'response'; id: number; res?: QuanResponse; error?: string }
  | { type: 'call'; id: number; capability: string; args: unknown[] }
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string };
