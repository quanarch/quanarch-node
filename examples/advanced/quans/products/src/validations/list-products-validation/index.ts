import { RULE, type ValidationRules } from 'shop-qua';

export const listProductsValidation: ValidationRules = {
  query: {
    search: { type: RULE.STRING, max: 60 },
    limit: { type: RULE.INTEGER, min: 1, max: 100 },
    offset: { type: RULE.INTEGER, min: 0 },
  },
};
