import type { PermissionDefinition } from 'shop-qua';
import { PERMISSIONS } from '../../constants';

export const orderPermissions: PermissionDefinition[] = [
  { key: PERMISSIONS.CREATE, description: 'Place orders' },
  { key: PERMISSIONS.READ, description: 'See and cancel your own orders' },
  { key: PERMISSIONS.READ_ALL, description: "See everyone's orders" },
];
