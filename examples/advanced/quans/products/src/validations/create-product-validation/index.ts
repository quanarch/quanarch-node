import { RULE, type ValidationRules } from 'shop-qua';

export const createProductValidation: ValidationRules = {
  body: {
    name: { type: RULE.STRING, required: true, min: 2, max: 80 },
    description: { type: RULE.STRING, max: 1000 },
    price: { type: RULE.NUMBER, required: true, min: 0.01, max: 100000 },
    stock: { type: RULE.INTEGER, min: 0, max: 100000 },
  },
};
