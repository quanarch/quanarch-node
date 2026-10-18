import type { Handler } from 'shop-qua';
import { orderService } from '../../services';
import type { OrderItem } from '../../types';

/** 202: the order is taken, its fate is decided when products answer. */
export const placeOrderHandler: Handler<{ items: OrderItem[] }> = async (req) => ({
  status: 202,
  body: await orderService.place(req.user!.id, req.body.items),
});
