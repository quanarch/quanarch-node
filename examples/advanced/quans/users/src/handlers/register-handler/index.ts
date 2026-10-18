import type { Handler } from 'shop-qua';
import { userService } from '../../services';
import type { RegisterInput } from '../../types';

export const registerHandler: Handler<RegisterInput> = async (req) => ({ status: 201, body: await userService.register(req.body) });
