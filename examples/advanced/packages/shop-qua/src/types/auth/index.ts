/** Who is calling, as the quanar read it from the request's token. */
export interface AuthUser {
  /** The subject the token was issued for, usually a user id. */
  id: string;
  name?: string;
  permissions: string[];
}

/** What a quan asks the quanar to put in a token. */
export interface TokenClaims {
  sub: string;
  name?: string;
  permissions: string[];
}

export interface IssuedToken {
  token: string;
  /** ISO time */
  expiresAt: string;
}

/** Identity work the quanar does: signing and checking secrets never leave it. */
export interface AuthCapability {
  issueToken: (claims: TokenClaims) => Promise<IssuedToken>;
  hashPassword: (password: string) => Promise<string>;
  verifyPassword: (password: string, hash: string) => Promise<boolean>;
}
