import type { Handler } from 'shop-qua';
import { userService } from '../../services';

export const meHandler: Handler = async (req) => ({ body: await userService.me(req.user!.id) });
