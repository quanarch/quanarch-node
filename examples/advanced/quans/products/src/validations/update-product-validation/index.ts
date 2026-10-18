import { RULE, type ValidationRules } from 'shop-qua';

export const updateProductValidation: ValidationRules = {
  body: {
    name: { type: RULE.STRING, min: 2, max: 80 },
    description: { type: RULE.STRING, max: 1000 },
    price: { type: RULE.NUMBER, min: 0.01, max: 100000 },
    active: { type: RULE.BOOLEAN },
  },
};
