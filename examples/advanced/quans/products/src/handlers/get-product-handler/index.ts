import type { Handler } from 'shop-qua';

export const getProductHandler: Handler = (req) => ({ body: req.locals.product });
