import { FIELD, type FieldDefinition, type FieldType, type ModelDefinition } from 'shop-qua';
import { database } from '../database';
import { createLogger } from '../logger';

const log = createLogger('schema');

const NAME = /^[a-z][a-z0-9_]*$/;
const RESERVED = ['id', 'createdAt', 'updatedAt'];
const COLUMN: Record<FieldType, string> = {
  [FIELD.STRING]: 'TEXT',
  [FIELD.TEXT]: 'TEXT',
  [FIELD.ENUM]: 'TEXT',
  [FIELD.DATETIME]: 'TEXT',
  [FIELD.JSON]: 'TEXT',
  [FIELD.INTEGER]: 'INTEGER',
  [FIELD.BOOLEAN]: 'INTEGER',
  [FIELD.NUMBER]: 'REAL',
};

// owner → model name → definition
const registry = new Map<string, Map<string, ModelDefinition>>();

const quote = (name: string) => `"${name}"`;

/** Every quan's tables live in the same database, each under its own prefix. */
export function tableName(owner: string, model: string): string {
  return `${owner.replace(/-/g, '_')}__${model}`;
}

function check(owner: string, model: ModelDefinition) {
  if (!NAME.test(model.name)) throw new Error(`${owner}: model name "${model.name}" must be lowercase letters, digits and _`);
  for (const [field, def] of Object.entries(model.fields)) {
    if (RESERVED.includes(field)) throw new Error(`${owner}.${model.name}: ${field} is added by the quanar`);
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(field)) throw new Error(`${owner}.${model.name}: field name "${field}" is not allowed`);
    if (!(def.type in COLUMN)) throw new Error(`${owner}.${model.name}.${field}: unknown type ${def.type}`);
    if (def.type === FIELD.ENUM && !def.values?.length) throw new Error(`${owner}.${model.name}.${field}: an enum needs values`);
  }
  for (const index of model.indexes ?? []) {
    for (const field of index) {
      if (!(field in model.fields) && !RESERVED.includes(field)) throw new Error(`${owner}.${model.name}: index over unknown field ${field}`);
    }
  }
}

/**
 * Turns the models a quan declares into tables, and keeps them in step: a new model
 * becomes a table, a new field a column, a unique or indexed field an index. Nothing
 * is ever dropped, so a quan going away or coming back never loses data.
 */
export const schemaManager = {
  sync(owner: string, models: ModelDefinition[]) {
    models.forEach((m) => check(owner, m));
    const changes: string[] = [];

    for (const model of models) {
      const table = tableName(owner, model.name);
      const existing = database.prepare(`PRAGMA table_info(${quote(table)})`).all() as { name: string }[];

      if (existing.length === 0) {
        const columns = Object.entries(model.fields).map(([f, d]) => `${quote(f)} ${COLUMN[d.type]}`);
        database.exec(
          `CREATE TABLE ${quote(table)} ("id" TEXT PRIMARY KEY, ${columns.join(', ')}${columns.length ? ', ' : ''}"createdAt" TEXT NOT NULL, "updatedAt" TEXT NOT NULL)`,
        );
        changes.push(`created ${table}`);
      } else {
        const have = new Set(existing.map((c) => c.name));
        for (const [field, def] of Object.entries(model.fields)) {
          if (have.has(field)) continue;
          database.exec(`ALTER TABLE ${quote(table)} ADD COLUMN ${quote(field)} ${COLUMN[def.type]}`);
          changes.push(`added ${table}.${field}`);
        }
      }

      const indexes: [string[], boolean][] = [
        ...Object.entries(model.fields)
          .filter(([, d]) => d.unique || d.index)
          .map(([f, d]) => [[f], !!d.unique] as [string[], boolean]),
        ...(model.indexes ?? []).map((fields) => [fields, false] as [string[], boolean]),
      ];
      for (const [fields, unique] of indexes) {
        const name = `${table}__${fields.join('_')}${unique ? '__unique' : ''}`;
        database.exec(`CREATE ${unique ? 'UNIQUE ' : ''}INDEX IF NOT EXISTS ${quote(name)} ON ${quote(table)} (${fields.map(quote).join(', ')})`);
      }
    }

    registry.set(owner, new Map(models.map((m) => [m.name, m])));
    if (changes.length) log.info(`${owner}: ${changes.join(', ')}`);
  },

  remove(owner: string) {
    registry.delete(owner);
  },

  /** A model of the quan, or an error: a quan can only reach its own tables. */
  model(owner: string, name: string): ModelDefinition {
    const model = registry.get(owner)?.get(name);
    if (!model) throw new Error(`${owner} has no model ${name}`);
    return model;
  },

  field(model: ModelDefinition, name: string): FieldDefinition | undefined {
    if (name === 'id' || name === 'createdAt' || name === 'updatedAt') return { type: FIELD.STRING };
    return model.fields[name];
  },

  describe() {
    return Object.fromEntries([...registry].map(([owner, models]) => [owner, [...models.values()]]));
  },
};
