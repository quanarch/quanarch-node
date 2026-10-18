import { randomUUID } from 'node:crypto';
import type { SQLInputValue } from 'node:sqlite';
import { FIELD, type DbOperation, type FieldDefinition, type FindOptions, type ModelDefinition, type Where } from 'shop-qua';
import { nowIso } from '../../utils';
import { database } from '../database';
import { schemaManager, tableName } from '../schema-manager';

const MAX_LIMIT = 500;
const OPERATORS: Record<string, string> = { eq: '=', ne: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=', like: 'LIKE' };

/** A problem with an operation itself: the quan sent something its model does not allow. */
export class DbError extends Error {}

const quote = (name: string) => `"${name}"`;
type Row = Record<string, unknown>;

function fieldOf(model: ModelDefinition, name: string): FieldDefinition {
  const field = schemaManager.field(model, name);
  if (!field) throw new DbError(`${model.name} has no field ${name}`);
  return field;
}

function encode(model: ModelDefinition, name: string, value: unknown): SQLInputValue {
  if (value === null || value === undefined) return null;
  const field = fieldOf(model, name);
  switch (field.type) {
    case FIELD.BOOLEAN:
      if (typeof value !== 'boolean') throw new DbError(`${model.name}.${name} must be true or false`);
      return value ? 1 : 0;
    case FIELD.INTEGER:
    case FIELD.NUMBER:
      if (typeof value !== 'number' || Number.isNaN(value)) throw new DbError(`${model.name}.${name} must be a number`);
      if (field.type === FIELD.INTEGER && !Number.isInteger(value)) throw new DbError(`${model.name}.${name} must be a whole number`);
      return value;
    case FIELD.JSON:
      return JSON.stringify(value);
    case FIELD.ENUM:
      if (!field.values?.includes(String(value))) throw new DbError(`${model.name}.${name} must be one of ${field.values?.join(', ')}`);
      return String(value);
    default:
      if (typeof value !== 'string') throw new DbError(`${model.name}.${name} must be text`);
      return value;
  }
}

function decode(model: ModelDefinition, row: Row): Row {
  const out: Row = {};
  for (const [name, value] of Object.entries(row)) {
    const field = schemaManager.field(model, name);
    if (value === null || !field) out[name] = value;
    else if (field.type === FIELD.BOOLEAN) out[name] = value === 1;
    else if (field.type === FIELD.JSON) out[name] = JSON.parse(String(value));
    else out[name] = value;
  }
  return out;
}

function whereClause(model: ModelDefinition, where: Where | undefined, params: SQLInputValue[]): string {
  const parts: string[] = [];
  for (const [name, condition] of Object.entries(where ?? {})) {
    if (condition === undefined) continue;
    fieldOf(model, name);
    const column = quote(name);
    if (condition === null) {
      parts.push(`${column} IS NULL`);
    } else if (typeof condition === 'object' && !Array.isArray(condition)) {
      for (const [op, value] of Object.entries(condition as Record<string, unknown>)) {
        if (op === 'in') {
          const list = value as unknown[];
          if (!Array.isArray(list) || list.length === 0) {
            parts.push('0');
            continue;
          }
          parts.push(`${column} IN (${list.map(() => '?').join(', ')})`);
          list.forEach((v) => params.push(encode(model, name, v)));
        } else if (OPERATORS[op]) {
          parts.push(`${column} ${OPERATORS[op]} ?`);
          params.push(op === 'like' ? String(value) : encode(model, name, value));
        } else {
          throw new DbError(`unknown operator ${op}`);
        }
      }
    } else {
      parts.push(`${column} = ?`);
      params.push(encode(model, name, condition));
    }
  }
  return parts.length ? ` WHERE ${parts.join(' AND ')}` : '';
}

function findSql(model: ModelDefinition, table: string, options: FindOptions, params: SQLInputValue[]): string {
  let sql = `SELECT * FROM ${quote(table)}${whereClause(model, options.where, params)}`;
  const order = Object.entries(options.orderBy ?? {});
  if (order.length) {
    sql += ` ORDER BY ${order
      .map(([f, dir]) => {
        fieldOf(model, f);
        return `${quote(f)} ${dir === 'desc' ? 'DESC' : 'ASC'}`;
      })
      .join(', ')}`;
  }
  sql += ' LIMIT ? OFFSET ?';
  params.push(Math.min(options.limit ?? MAX_LIMIT, MAX_LIMIT), options.offset ?? 0);
  return sql;
}

function execute(owner: string, op: DbOperation): unknown {
  const model = schemaManager.model(owner, op.model);
  const table = tableName(owner, op.model);
  const params: SQLInputValue[] = [];

  switch (op.action) {
    case 'find':
      return (database.prepare(findSql(model, table, op.options ?? {}, params)).all(...params) as Row[]).map((r) => decode(model, r));

    case 'findOne': {
      const row = database.prepare(findSql(model, table, { where: op.where, limit: 1 }, params)).get(...params) as Row | undefined;
      return row ? decode(model, row) : null;
    }

    case 'count': {
      const row = database.prepare(`SELECT COUNT(*) AS n FROM ${quote(table)}${whereClause(model, op.where, params)}`).get(...params) as { n: number };
      return row.n;
    }

    case 'create': {
      const data: Row = { ...op.data };
      for (const [name, field] of Object.entries(model.fields)) {
        if (data[name] === undefined && field.default !== undefined) data[name] = field.default;
        if (field.required && (data[name] === undefined || data[name] === null)) throw new DbError(`${model.name}.${name} is required`);
      }
      const now = nowIso();
      const row: Row = { id: randomUUID(), ...data, createdAt: now, updatedAt: now };
      const names = Object.keys(row);
      database
        .prepare(`INSERT INTO ${quote(table)} (${names.map(quote).join(', ')}) VALUES (${names.map(() => '?').join(', ')})`)
        .run(...names.map((n) => encode(model, n, row[n])));
      return decode(model, database.prepare(`SELECT * FROM ${quote(table)} WHERE "id" = ?`).get(row.id as string) as Row);
    }

    case 'update': {
      const sets: string[] = [];
      for (const [name, value] of Object.entries(op.data)) {
        if (name === 'id' || name === 'createdAt' || name === 'updatedAt') throw new DbError(`${name} cannot be changed`);
        if (value && typeof value === 'object' && ('increment' in value || 'decrement' in value)) {
          const field = fieldOf(model, name);
          if (field.type !== FIELD.INTEGER && field.type !== FIELD.NUMBER) throw new DbError(`${model.name}.${name} is not a number`);
          const by = 'increment' in value ? Number(value.increment) : -Number(value.decrement);
          sets.push(`${quote(name)} = ${quote(name)} + ?`);
          params.push(by);
        } else {
          sets.push(`${quote(name)} = ?`);
          params.push(encode(model, name, value));
        }
      }
      sets.push('"updatedAt" = ?');
      params.push(nowIso());
      const result = database.prepare(`UPDATE ${quote(table)} SET ${sets.join(', ')}${whereClause(model, op.where, params)}`).run(...params);
      const changes = Number(result.changes);
      if (op.expect !== undefined && changes !== op.expect) throw new DbError(`expected ${op.expect} ${model.name} to change, ${changes} did`);
      return changes;
    }

    case 'delete': {
      const result = database.prepare(`DELETE FROM ${quote(table)}${whereClause(model, op.where, params)}`).run(...params);
      const changes = Number(result.changes);
      if (op.expect !== undefined && changes !== op.expect) throw new DbError(`expected ${op.expect} ${model.name} to be deleted, ${changes} were`);
      return changes;
    }
  }
}

/** Turns SQLite's messages into ones a quan can act on. */
function explain(owner: string, error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  const unique = /UNIQUE constraint failed: [^.]+\.(\w+)/.exec(message);
  if (unique) throw new DbError(`${unique[1]} must be unique`);
  if (error instanceof DbError) throw error;
  throw new DbError(`${owner}: ${message}`);
}

/**
 * Runs the operations quans send, against their own tables only. Every value goes in
 * as a parameter, every name is checked against the model, booleans and json are
 * turned back into what the quan stored.
 */
export const dbManager = {
  run(owner: string, op: DbOperation): unknown {
    try {
      return execute(owner, op);
    } catch (error) {
      explain(owner, error);
    }
  },

  transaction(owner: string, ops: DbOperation[]): unknown[] {
    database.exec('BEGIN IMMEDIATE');
    try {
      const results = ops.map((op) => execute(owner, op));
      database.exec('COMMIT');
      return results;
    } catch (error) {
      database.exec('ROLLBACK');
      explain(owner, error);
    }
  },
};
