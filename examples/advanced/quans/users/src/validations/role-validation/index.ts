import { RULE, type ValidationRules } from 'shop-qua';
import { ROLES } from '../../constants';

export const roleValidation: ValidationRules = {
  body: {
    role: { type: RULE.ENUM, values: Object.values(ROLES), required: true },
  },
};
