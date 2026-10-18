import type { Handler } from 'shop-qua';
import { userService } from '../../services';

export const listUsersHandler: Handler = async () => ({ body: await userService.list() });
