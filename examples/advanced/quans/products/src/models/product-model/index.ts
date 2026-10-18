import { FIELD, type ModelDefinition } from 'shop-qua';
import { MODELS } from '../../constants';

export const productModel: ModelDefinition = {
  name: MODELS.PRODUCTS,
  fields: {
    name: { type: FIELD.STRING, required: true, unique: true },
    description: { type: FIELD.TEXT },
    price: { type: FIELD.NUMBER, required: true },
    stock: { type: FIELD.INTEGER, required: true, default: 0 },
    active: { type: FIELD.BOOLEAN, required: true, default: true, index: true },
  },
};
