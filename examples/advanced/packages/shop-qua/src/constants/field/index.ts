/** Column types of a model. The quanar turns them into its database's types. */
export const FIELD = {
  STRING: 'string',
  TEXT: 'text',
  INTEGER: 'integer',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATETIME: 'datetime',
  JSON: 'json',
  ENUM: 'enum',
} as const;

export type FieldType = (typeof FIELD)[keyof typeof FIELD];
