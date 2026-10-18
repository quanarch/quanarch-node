export type Row<T = Record<string, unknown>> = T & { id: string; createdAt: string; updatedAt: string };

export type Comparison<V> = {
  eq?: V;
  ne?: V;
  gt?: V;
  gte?: V;
  lt?: V;
  lte?: V;
  in?: V[];
  like?: string;
};

export type Where<T = Record<string, unknown>> = {
  [K in keyof T | 'id']?: (K extends keyof T ? T[K] : string) | Comparison<K extends keyof T ? T[K] : string>;
};

/** A value to set, or a change to apply to a number in place. */
export type Change<V> = V | { increment: number } | { decrement: number };

export type Changes<T> = { [K in keyof T]?: Change<T[K]> };

export interface FindOptions<T = Record<string, unknown>> {
  where?: Where<T>;
  orderBy?: { [K in keyof T | 'createdAt' | 'updatedAt']?: 'asc' | 'desc' };
  limit?: number;
  offset?: number;
}

/** One database operation, as data: it crosses from the quan's process to the quanar. */
export type DbOperation =
  | { action: 'find'; model: string; options?: FindOptions }
  | { action: 'findOne'; model: string; where: Where }
  | { action: 'count'; model: string; where?: Where }
  | { action: 'create'; model: string; data: Record<string, unknown> }
  | { action: 'update'; model: string; where: Where; data: Record<string, unknown>; expect?: number }
  | { action: 'delete'; model: string; where: Where; expect?: number };

/** The quanar's database, seen through a quan: only that quan's models exist. */
export interface DbCapability {
  run: (operation: DbOperation) => Promise<unknown>;
  /** Runs every operation or none. An update or delete with expect fails the whole batch when it touches another number of rows. */
  transaction: (operations: DbOperation[]) => Promise<unknown[]>;
}

export interface Repository<T> {
  find: (options?: FindOptions<T>) => Promise<Row<T>[]>;
  findOne: (where: Where<T>) => Promise<Row<T> | null>;
  findById: (id: string) => Promise<Row<T> | null>;
  count: (where?: Where<T>) => Promise<number>;
  create: (data: T) => Promise<Row<T>>;
  /** Returns how many rows changed. */
  update: (where: Where<T>, data: Changes<T>) => Promise<number>;
  updateById: (id: string, data: Changes<T>) => Promise<Row<T> | null>;
  delete: (where: Where<T>) => Promise<number>;
}
