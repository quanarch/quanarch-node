import { FIELD, type ModelDefinition } from 'shop-qua';
import { MODELS, ROLES } from '../../constants';

export const userModel: ModelDefinition = {
  name: MODELS.USERS,
  fields: {
    email: { type: FIELD.STRING, required: true, unique: true },
    name: { type: FIELD.STRING, required: true },
    passwordHash: { type: FIELD.STRING, required: true },
    role: { type: FIELD.ENUM, values: Object.values(ROLES), required: true, default: ROLES.CUSTOMER, index: true },
  },
};
