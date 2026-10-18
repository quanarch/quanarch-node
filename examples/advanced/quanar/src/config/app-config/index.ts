import path from 'node:path';

const root = path.resolve(__dirname, '..');

export const appConfig = {
  port: Number(process.env.PORT ?? 3000),
  dataDir: process.env.DATA_DIR ?? path.join(root, 'data'),
  /** Where the quans are listed: name, file, hash, event stream, quas. Written by the build. */
  quansFile: process.env.QUANS_FILE ?? path.join(root, 'data', 'quans.json'),
  databaseFile: process.env.DATABASE_FILE ?? path.join(root, 'data', 'shop.db'),
  /** Signs the tokens. Without it a random one is made, and tokens do not survive a restart. */
  jwtSecret: process.env.JWT_SECRET,
  tokenTtlSeconds: Number(process.env.TOKEN_TTL_SECONDS ?? 60 * 60 * 8),
  rateLimit: { windowMs: 60_000, max: Number(process.env.RATE_LIMIT_MAX ?? 30) },
  bodyLimit: '100kb',
  reconnectMs: 2000,
  fetchTimeoutMs: 3000,
  loadTimeoutMs: 5000,
  requestTimeoutMs: 10_000,
  quanMemoryMb: 128,
};
