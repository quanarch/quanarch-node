import { RULE, type ValidationRules } from 'shop-qua';

export const restockValidation: ValidationRules = {
  body: {
    quantity: { type: RULE.INTEGER, required: true, min: 1, max: 10000 },
  },
};
