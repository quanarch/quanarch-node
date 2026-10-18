/** Value types a validation rule checks. */
export const RULE = {
  STRING: 'string',
  EMAIL: 'email',
  INTEGER: 'integer',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  ENUM: 'enum',
  ARRAY: 'array',
  OBJECT: 'object',
} as const;

export type RuleType = (typeof RULE)[keyof typeof RULE];
