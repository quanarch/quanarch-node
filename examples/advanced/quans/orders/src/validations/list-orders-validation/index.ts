import { RULE, type ValidationRules } from 'shop-qua';
import { STATUS } from '../../constants';

export const listOrdersValidation: ValidationRules = {
  query: {
    status: { type: RULE.ENUM, values: Object.values(STATUS) },
  },
};
