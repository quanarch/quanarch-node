import type { PermissionDefinition } from 'shop-qua';
import { PERMISSIONS } from '../../constants';

export const productPermissions: PermissionDefinition[] = [{ key: PERMISSIONS.MANAGE, description: 'Add products, change them and their stock' }];
