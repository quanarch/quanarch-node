export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** A request as a quan sees it. The quanar's HTTP server never reaches the quan. */
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

/**
 * The quanar's listener. A quan does not serve anything itself:
 * api.get('/notes', handler) asks the quanar to listen to GET /notes and hand the request over.
 */
export interface ApiManager {
  get: (path: string, handler: Handler) => void;
  post: (path: string, handler: Handler) => void;
  put: (path: string, handler: Handler) => void;
  patch: (path: string, handler: Handler) => void;
  delete: (path: string, handler: Handler) => void;
}

export type Row = { id: string } & Record<string, unknown>;

/** The quanar's database. General methods only: the quan names the table. */
export interface DbManager {
  create: (table: string, data: Record<string, unknown>) => Promise<Row>;
  list: (table: string) => Promise<Row[]>;
  get: (table: string, id: string) => Promise<Row | null>;
  update: (table: string, id: string, data: Record<string, unknown>) => Promise<Row | null>;
  remove: (table: string, id: string) => Promise<boolean>;
}

/** What the quanar implements and plugs in with init(). */
export interface QuanarCore {
  api: ApiManager;
  db: DbManager;
}
