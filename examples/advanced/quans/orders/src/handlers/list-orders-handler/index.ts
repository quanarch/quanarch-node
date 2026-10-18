import type { Handler } from 'shop-qua';
import type { OrderStatus } from '../../constants';
import { orderService } from '../../services';

export const listOrdersHandler: Handler = async (req) => ({
  body: await orderService.list(req.user!, req.query.status as OrderStatus | undefined),
});
