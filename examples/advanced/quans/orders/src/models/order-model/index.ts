import { FIELD, type ModelDefinition } from 'shop-qua';
import { MODELS, STATUS } from '../../constants';

export const orderModel: ModelDefinition = {
  name: MODELS.ORDERS,
  fields: {
    userId: { type: FIELD.STRING, required: true, index: true },
    status: { type: FIELD.ENUM, values: Object.values(STATUS), required: true, default: STATUS.PENDING },
    items: { type: FIELD.JSON, required: true },
    lines: { type: FIELD.JSON },
    total: { type: FIELD.NUMBER },
    reason: { type: FIELD.STRING },
  },
  indexes: [['userId', 'status']],
};
