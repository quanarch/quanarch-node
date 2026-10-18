import type { FieldType } from '../../constants/index.js';

export interface FieldDefinition {
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  index?: boolean;
  default?: string | number | boolean;
  /** For enum. */
  values?: readonly string[];
}

/**
 * A table the quan owns, described as data. The quanar creates and migrates it;
 * id, createdAt and updatedAt are added to every model.
 */
export interface ModelDefinition {
  name: string;
  fields: Record<string, FieldDefinition>;
  /** Indexes over several fields. */
  indexes?: string[][];
}
