export const ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
