import { FIELD, type ModelDefinition } from 'shop-qua';
import { MODELS } from '../../constants';

/** Stock taken for an order. One per order, so an event delivered twice takes it once. */
export const reservationModel: ModelDefinition = {
  name: MODELS.RESERVATIONS,
  fields: {
    orderId: { type: FIELD.STRING, required: true, unique: true },
    items: { type: FIELD.JSON, required: true },
    total: { type: FIELD.NUMBER, required: true },
  },
};
