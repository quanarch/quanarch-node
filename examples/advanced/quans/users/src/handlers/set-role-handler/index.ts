import type { Handler } from 'shop-qua';
import type { Role } from '../../constants';
import { userService } from '../../services';

export const setRoleHandler: Handler<{ role: Role }> = async (req) => ({
  body: await userService.setRole(req.params.id, req.body.role, req.user!.id),
});
