import type { AuthUser, PermissionDefinition } from 'shop-qua';

const declared = new Map<string, PermissionDefinition[]>();

/**
 * The permissions quans declare. The quanar knows what each permission means,
 * not who holds it: that comes in the token a quan asked for.
 */
export const permissionManager = {
  register(owner: string, permissions: PermissionDefinition[]) {
    for (const p of permissions) {
      if (!p.key.startsWith(`${owner}:`)) throw new Error(`${owner} may not declare ${p.key}: permissions start with ${owner}:`);
    }
    declared.set(owner, permissions);
  },

  remove(owner: string) {
    declared.delete(owner);
  },

  /** The required permissions the user lacks. */
  missing(user: AuthUser, required: string[]): string[] {
    return required.filter((p) => !user.permissions.includes(p));
  },

  all(): PermissionDefinition[] {
    return [...declared.values()].flat();
  },
};
