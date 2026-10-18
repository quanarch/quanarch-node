import { RULE, type ValidationRules } from 'shop-qua';

export const registerValidation: ValidationRules = {
  body: {
    email: { type: RULE.EMAIL, required: true, max: 120 },
    name: { type: RULE.STRING, required: true, min: 2, max: 60 },
    password: { type: RULE.STRING, required: true, min: 8, max: 100 },
  },
};
