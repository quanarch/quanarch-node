import type { Handler } from 'shop-qua';
import { userService } from '../../services';

export const loginHandler: Handler<{ email: string; password: string }> = async (req) => ({
  body: await userService.login(req.body.email, req.body.password),
});
