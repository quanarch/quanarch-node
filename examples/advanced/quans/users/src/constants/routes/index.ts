/** Every endpoint starts with the quan's name. */
export const ROUTES = {
  REGISTER: '/users/register',
  LOGIN: '/users/login',
  ME: '/users/me',
  LIST: '/users',
  ROLE: '/users/:id/role',
} as const;
