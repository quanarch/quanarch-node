import type { DbOperation, TokenClaims } from 'shop-qua';
import { authManager } from '../auth-manager';
import { dbManager } from '../db-manager';
import { eventManager } from '../event-manager';

type Capability = (...args: any[]) => unknown;

/**
 * The quanar's side of shop-qua, bound to one quan: its database calls reach only its
 * tables, its events carry its name. A quan's process asks for a capability by name;
 * only the quas plugged into that quan can be reached.
 */
function shopQuaCore(owner: string): Record<string, Capability> {
  return {
    'db.run': (op: DbOperation) => dbManager.run(owner, op),
    'db.transaction': (ops: DbOperation[]) => dbManager.transaction(owner, ops),
    'auth.issueToken': (claims: TokenClaims) => authManager.issueToken(claims),
    'auth.hashPassword': (password: string) => authManager.hashPassword(password),
    'auth.verifyPassword': (password: string, hash: string) => authManager.verifyPassword(password, hash),
    'events.emit': (event: string, payload: unknown) => {
      eventManager.publish(owner, event, payload);
    },
  };
}

const QUA_CORES: Record<string, (owner: string) => Record<string, Capability>> = {
  'shop-qua': shopQuaCore,
};

export function pluggedCapabilities(owner: string, quas: string[]): Record<string, Capability> {
  const plugged: Record<string, Capability> = {};
  for (const qua of quas) for (const [name, fn] of Object.entries(QUA_CORES[qua]?.(owner) ?? {})) plugged[`${qua}:${name}`] = fn;
  return plugged;
}
