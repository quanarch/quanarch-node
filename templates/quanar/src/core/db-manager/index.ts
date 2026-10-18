import { randomUUID } from 'node:crypto';
import type { Row } from '../../types';

// table → id → row. Kept in memory; replace this file to use a real database.
const tables = new Map<string, Map<string, Row>>();

function table(name: string) {
  if (!tables.has(name)) tables.set(name, new Map());
  return tables.get(name)!;
}

/** The quanar's database. It knows no tables in advance: the quan names them. */
export const dbManager = {
  async create(name: string, data: Record<string, unknown>): Promise<Row> {
    const row: Row = { ...data, id: randomUUID() };
    table(name).set(row.id, row);
    return row;
  },
  async list(name: string): Promise<Row[]> {
    return [...table(name).values()];
  },
  async get(name: string, id: string): Promise<Row | null> {
    return table(name).get(id) ?? null;
  },
  async update(name: string, id: string, data: Record<string, unknown>): Promise<Row | null> {
    const row = table(name).get(id);
    if (!row) return null;
    const next: Row = { ...row, ...data, id };
    table(name).set(id, next);
    return next;
  },
  async remove(name: string, id: string): Promise<boolean> {
    return table(name).delete(id);
  },
};
