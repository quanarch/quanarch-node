import { RULE, type Rule, type ValidationIssue, type ValidationRules } from 'shop-qua';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Input {
  params: Record<string, unknown>;
  query: Record<string, unknown>;
  body: unknown;
}

/** Query and path values arrive as text; a rule that wants a number or a boolean reads them as one. */
function coerce(rule: Rule, value: unknown): unknown {
  if (typeof value !== 'string') return value;
  if (rule.type === RULE.INTEGER || rule.type === RULE.NUMBER) return value.trim() === '' ? value : Number(value);
  if (rule.type === RULE.BOOLEAN) return value === 'true' ? true : value === 'false' ? false : value;
  return value;
}

function check(rule: Rule, value: unknown, path: string, issues: ValidationIssue[]): void {
  if (value === undefined || value === null || value === '') {
    if (rule.required) issues.push({ path, message: 'is required' });
    return;
  }
  const fail = (message: string): void => {
    issues.push({ path, message });
  };

  switch (rule.type) {
    case RULE.STRING:
    case RULE.EMAIL:
    case RULE.ENUM: {
      if (typeof value !== 'string') return fail('must be text');
      if (rule.type === RULE.EMAIL && !EMAIL.test(value)) return fail('must be an email address');
      if (rule.type === RULE.ENUM && !rule.values?.includes(value)) return fail(`must be one of ${rule.values?.join(', ')}`);
      if (rule.min !== undefined && value.length < rule.min) fail(`must be at least ${rule.min} characters`);
      if (rule.max !== undefined && value.length > rule.max) fail(`must be at most ${rule.max} characters`);
      if (rule.pattern && !new RegExp(rule.pattern).test(value)) fail('has the wrong format');
      return;
    }
    case RULE.INTEGER:
    case RULE.NUMBER: {
      if (typeof value !== 'number' || Number.isNaN(value)) return fail('must be a number');
      if (rule.type === RULE.INTEGER && !Number.isInteger(value)) return fail('must be a whole number');
      if (rule.min !== undefined && value < rule.min) fail(`must be at least ${rule.min}`);
      if (rule.max !== undefined && value > rule.max) fail(`must be at most ${rule.max}`);
      return;
    }
    case RULE.BOOLEAN:
      if (typeof value !== 'boolean') fail('must be true or false');
      return;
    case RULE.ARRAY: {
      if (!Array.isArray(value)) return fail('must be a list');
      if (rule.min !== undefined && value.length < rule.min) fail(`must have at least ${rule.min} item${rule.min === 1 ? '' : 's'}`);
      if (rule.max !== undefined && value.length > rule.max) fail(`must have at most ${rule.max} item${rule.max === 1 ? '' : 's'}`);
      if (rule.items) value.forEach((item, i) => check(rule.items!, item, `${path}[${i}]`, issues));
      return;
    }
    case RULE.OBJECT: {
      if (typeof value !== 'object' || Array.isArray(value)) return fail('must be an object');
      if (rule.fields) checkFields(rule.fields, value as Record<string, unknown>, path, issues);
      return;
    }
  }
}

function checkFields(fields: Record<string, Rule>, source: Record<string, unknown>, prefix: string, issues: ValidationIssue[]) {
  for (const [name, rule] of Object.entries(fields)) {
    const path = prefix ? `${prefix}.${name}` : name;
    source[name] = coerce(rule, source[name]);
    check(rule, source[name], path, issues);
  }
}

/**
 * Checks a request against the rules an api declared, as data. Text values from the
 * path and query are turned into numbers and booleans where a rule asks for them, so the
 * quan receives them already typed.
 */
export const validationManager = {
  validate(rules: ValidationRules, input: Input): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    if (rules.params) checkFields(rules.params, input.params, 'params', issues);
    if (rules.query) checkFields(rules.query, input.query, 'query', issues);
    if (rules.body) {
      if (typeof input.body !== 'object' || input.body === null || Array.isArray(input.body)) {
        issues.push({ path: 'body', message: 'must be a JSON object' });
      } else {
        checkFields(rules.body, input.body as Record<string, unknown>, 'body', issues);
      }
    }
    return issues;
  },
};
