import type { RuleType } from '../../constants/index.js';

/** One value's rule. The quanar checks it before the request reaches the quan. */
export interface Rule {
  type: RuleType;
  required?: boolean;
  /** Length for strings and arrays, value for numbers. */
  min?: number;
  max?: number;
  /** A regular expression a string must match. */
  pattern?: string;
  /** For enum. */
  values?: readonly string[];
  /** For array: the rule of each item. */
  items?: Rule;
  /** For object: the rule of each field. */
  fields?: Record<string, Rule>;
}

export interface ValidationRules {
  params?: Record<string, Rule>;
  query?: Record<string, Rule>;
  body?: Record<string, Rule>;
}

/** A failed rule, as the quanar answers it with 422. */
export interface ValidationIssue {
  path: string;
  message: string;
}
