import { getQuanarCore } from '../../state/index.js';
import type { DbOperation, Repository, Row } from '../../types/index.js';

type Data = Record<string, unknown>;

/**
 * The quan's view of the quanar's database. model() gives a typed repository whose
 * every call becomes one DbOperation; the quanar runs it against the quan's own tables.
 */
export const db = {
  model<T>(model: string): Repository<T> {
    const run = <R>(operation: DbOperation) => getQuanarCore().db.run(operation) as Promise<R>;
    return {
      find: (options) => run<Row<T>[]>({ action: 'find', model, options: options as never }),
      findOne: (where) => run<Row<T> | null>({ action: 'findOne', model, where: where as never }),
      findById: (id) => run<Row<T> | null>({ action: 'findOne', model, where: { id } }),
      count: (where) => run<number>({ action: 'count', model, where: where as never }),
      create: (data) => run<Row<T>>({ action: 'create', model, data: data as Data }),
      update: (where, data) => run<number>({ action: 'update', model, where: where as never, data: data as Data }),
      updateById: async (id, data) => {
        await run<number>({ action: 'update', model, where: { id }, data: data as Data });
        return run<Row<T> | null>({ action: 'findOne', model, where: { id } });
      },
      delete: (where) => run<number>({ action: 'delete', model, where: where as never }),
    };
  },

  /** Runs every operation or none. */
  transaction: (operations: DbOperation[]) => getQuanarCore().db.transaction(operations),
};
