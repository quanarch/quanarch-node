import { auth, db, events, log, type Row } from 'shop-qua';
import { DEFAULT_ADMIN, ROLE_PERMISSIONS } from '../../config';
import { EVENTS, MODELS, ROLES, type Role } from '../../constants';
import type { PublicUser, RegisterInput, User } from '../../types';
import { AppError } from '../../utils';

const users = () => db.model<User>(MODELS.USERS);

const toPublic = ({ id, email, name, role, createdAt }: Row<User>): PublicUser => ({ id, email, name, role, createdAt });

/** The same answer for a wrong email and a wrong password: which one was wrong is not told. */
const WRONG_CREDENTIALS = new AppError(401, 'wrong_credentials', 'Email or password is wrong');

export const userService = {
  async register(input: RegisterInput): Promise<PublicUser> {
    const email = input.email.toLowerCase();
    if (await users().findOne({ email })) throw new AppError(409, 'email_taken', 'This email is already registered');
    const user = await users().create({
      email,
      name: input.name.trim(),
      passwordHash: await auth.hashPassword(input.password),
      role: ROLES.CUSTOMER,
    });
    await events.emit(EVENTS.REGISTERED, { userId: user.id, email: user.email });
    return toPublic(user);
  },

  async login(email: string, password: string) {
    const user = await users().findOne({ email: email.toLowerCase() });
    if (!user || !(await auth.verifyPassword(password, user.passwordHash))) throw WRONG_CREDENTIALS;
    const { token, expiresAt } = await auth.issueToken({ sub: user.id, name: user.name, permissions: ROLE_PERMISSIONS[user.role] });
    return { token, expiresAt, user: toPublic(user), permissions: ROLE_PERMISSIONS[user.role] };
  },

  async me(id: string): Promise<PublicUser> {
    const user = await users().findById(id);
    if (!user) throw new AppError(404, 'user_not_found', 'This user no longer exists');
    return toPublic(user);
  },

  async list(): Promise<PublicUser[]> {
    return (await users().find({ orderBy: { createdAt: 'asc' } })).map(toPublic);
  },

  async setRole(id: string, role: Role, by: string): Promise<PublicUser> {
    if (id === by) throw new AppError(409, 'own_role', 'You cannot change your own role');
    const user = await users().updateById(id, { role });
    if (!user) throw new AppError(404, 'user_not_found', 'No such user');
    return toPublic(user);
  },

  /** On the very first start there is nobody to manage the shop: an admin is created. */
  async ensureAdmin() {
    if ((await users().count()) > 0) return;
    await users().create({
      email: DEFAULT_ADMIN.email,
      name: DEFAULT_ADMIN.name,
      passwordHash: await auth.hashPassword(DEFAULT_ADMIN.password),
      role: ROLES.ADMIN,
    });
    log.warn(`created ${DEFAULT_ADMIN.email} with the default password; change it`);
  },
};
