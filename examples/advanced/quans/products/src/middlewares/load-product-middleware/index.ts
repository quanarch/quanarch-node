import { db, type LocalMiddleware } from 'shop-qua';
import { MODELS } from '../../constants';
import type { Product } from '../../types';

/** Finds the product of the path's :id for the handler, or answers 404 before it runs. */
export const loadProductMiddleware: LocalMiddleware = async (req, next) => {
  const product = await db.model<Product>(MODELS.PRODUCTS).findById(req.params.id);
  if (!product) return { status: 404, body: { error: { code: 'product_not_found', message: 'No such product' }, requestId: req.requestId } };
  req.locals.product = product;
  return next();
};
