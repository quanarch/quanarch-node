import { db, type LocalMiddleware } from 'shop-qua';
import { MODELS, PERMISSIONS } from '../../constants';
import type { Order } from '../../types';

/**
 * Loads the order of the path's :id for the handler. Someone else's order answers 404,
 * not 403: whether it exists is not told.
 */
export const ownOrderMiddleware: LocalMiddleware = async (req, next) => {
  const order = await db.model<Order>(MODELS.ORDERS).findById(req.params.id);
  const mine = order && (order.userId === req.user!.id || req.user!.permissions.includes(PERMISSIONS.READ_ALL));
  if (!mine) return { status: 404, body: { error: { code: 'order_not_found', message: 'No such order' }, requestId: req.requestId } };
  req.locals.order = order;
  return next();
};
