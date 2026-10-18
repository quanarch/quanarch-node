import type { Role } from '../../constants';

export interface User {
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
}

/** A user as anyone outside this quan sees it: never the password hash. */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}
