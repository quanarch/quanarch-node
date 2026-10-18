import type { PermissionDefinition } from 'shop-qua';
import { PERMISSIONS } from '../../constants';

export const userPermissions: PermissionDefinition[] = [
  { key: PERMISSIONS.READ, description: 'See every user' },
  { key: PERMISSIONS.MANAGE, description: 'Change what a user may do' },
];
