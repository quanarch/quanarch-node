import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { AuthUser, IssuedToken, TokenClaims } from 'shop-qua';
import { appConfig } from '../../config';
import { createLogger } from '../logger';

const scrypt = promisify(scryptCb) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;
const log = createLogger('auth');

const secret = appConfig.jwtSecret ?? randomBytes(32).toString('hex');
if (!appConfig.jwtSecret) log.warn('JWT_SECRET is not set: a random secret is used and tokens will not survive a restart');

const b64url = (value: string | Buffer) => Buffer.from(value).toString('base64url');
const sign = (data: string) => createHmac('sha256', secret).update(data).digest('base64url');

interface Payload extends TokenClaims {
  iat: number;
  exp: number;
}

/**
 * Identity, without knowing any user. A quan proves who someone is however it likes
 * and asks for a token; the quanar signs it and, on every request, reads it back.
 */
export const authManager = {
  issueToken(claims: TokenClaims): IssuedToken {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + appConfig.tokenTtlSeconds;
    const payload: Payload = { sub: claims.sub, name: claims.name, permissions: [...claims.permissions], iat, exp };
    const body = `${b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64url(JSON.stringify(payload))}`;
    return { token: `${body}.${sign(body)}`, expiresAt: new Date(exp * 1000).toISOString() };
  },

  /** The user behind a token, or null when it is missing, forged or expired. */
  verifyToken(token: string): AuthUser | null {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;
    const expected = Buffer.from(sign(`${header}.${payload}`));
    const given = Buffer.from(signature);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
    try {
      const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Payload;
      if (claims.exp * 1000 < Date.now()) return null;
      return { id: claims.sub, name: claims.name, permissions: claims.permissions ?? [] };
    } catch {
      return null;
    }
  },

  async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const hash = await scrypt(password, salt, 64);
    return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
  },

  async verifyPassword(password: string, stored: string): Promise<boolean> {
    const [scheme, saltHex, hashHex] = stored.split('$');
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, 'hex');
    const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
    return timingSafeEqual(expected, actual);
  },
};
