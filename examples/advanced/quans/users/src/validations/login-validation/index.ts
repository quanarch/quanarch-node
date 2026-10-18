import { RULE, type ValidationRules } from 'shop-qua';

export const loginValidation: ValidationRules = {
  body: {
    email: { type: RULE.EMAIL, required: true },
    password: { type: RULE.STRING, required: true, max: 100 },
  },
};
