import { PERMISSIONS, ROLES, type Role } from '../../constants';

/**
 * What each role may do, across the shop. Other quans declare their permissions;
 * deciding who holds them is this quan's business, so the list lives here.
 */
export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [ROLES.ADMIN]: [PERMISSIONS.READ, PERMISSIONS.MANAGE, 'products:manage', 'orders:create', 'orders:read', 'orders:read-all'],
  [ROLES.CUSTOMER]: ['orders:create', 'orders:read'],
};
