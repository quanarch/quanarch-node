import type { Handler, Row } from 'shop-qua';
import { orderService } from '../../services';
import type { Order } from '../../types';

export const cancelOrderHandler: Handler = async (req) => ({ body: await orderService.cancel(req.locals.order as Row<Order>) });
