import { RULE, type ValidationRules } from 'shop-qua';

export const placeOrderValidation: ValidationRules = {
  body: {
    items: {
      type: RULE.ARRAY,
      required: true,
      min: 1,
      max: 20,
      items: {
        type: RULE.OBJECT,
        fields: {
          productId: { type: RULE.STRING, required: true },
          quantity: { type: RULE.INTEGER, required: true, min: 1, max: 100 },
        },
      },
    },
  },
};
