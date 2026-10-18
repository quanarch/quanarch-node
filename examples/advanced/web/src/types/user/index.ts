export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  createdAt: string;
}

export interface Session {
  token: string;
  expiresAt: string;
  user: User;
  permissions: string[];
}
