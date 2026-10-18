import { getQuanarCore } from '../../state/index.js';
import type { AuthCapability } from '../../types/index.js';

export const auth: AuthCapability = {
  issueToken: (claims) => getQuanarCore().auth.issueToken(claims),
  hashPassword: (password) => getQuanarCore().auth.hashPassword(password),
  verifyPassword: (password, hash) => getQuanarCore().auth.verifyPassword(password, hash),
};
