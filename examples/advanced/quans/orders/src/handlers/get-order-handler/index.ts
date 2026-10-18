import type { Handler } from 'shop-qua';

export const getOrderHandler: Handler = (req) => ({ body: req.locals.order });
