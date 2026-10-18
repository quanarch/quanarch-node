import { db, events, log, type AuthUser, type Row } from 'shop-qua';
import { CANCELLABLE, EVENTS, MODELS, PERMISSIONS, STATUS, type OrderStatus } from '../../constants';
import type { Order, OrderItem, RejectedEvent, ReservedEvent } from '../../types';
import { AppError } from '../../utils';

const orders = () => db.model<Order>(MODELS.ORDERS);

/**
 * Orders never read the products' tables. An order is placed as pending and announced;
 * products answer with an event, and the order follows.
 */
export const orderService = {
  async place(userId: string, items: OrderItem[]): Promise<Row<Order>> {
    const order = await orders().create({ userId, status: STATUS.PENDING, items });
    await events.emit(EVENTS.PLACED, { orderId: order.id, items });
    return order;
  },

  list(user: AuthUser, status?: OrderStatus) {
    const all = user.permissions.includes(PERMISSIONS.READ_ALL);
    return orders().find({ where: { ...(all ? {} : { userId: user.id }), ...(status ? { status } : {}) }, orderBy: { createdAt: 'desc' } });
  },

  async cancel(order: Row<Order>): Promise<Row<Order>> {
    if (!CANCELLABLE.includes(order.status)) throw new AppError(409, 'not_cancellable', `A ${order.status} order cannot be cancelled`);
    const changed = await orders().update({ id: order.id, status: { in: CANCELLABLE } }, { status: STATUS.CANCELLED });
    if (changed === 0) throw new AppError(409, 'not_cancellable', 'The order changed meanwhile, look again');
    await events.emit(EVENTS.CANCELLED, { orderId: order.id, items: order.items });
    return (await orders().findById(order.id))!;
  },

  async confirm({ orderId, total, lines }: ReservedEvent) {
    const changed = await orders().update({ id: orderId, status: STATUS.PENDING }, { status: STATUS.CONFIRMED, total, lines });
    // Cancelled before the stock was taken: give it back.
    if (changed === 0) await events.emit(EVENTS.CANCELLED, { orderId, items: lines });
    else log.info(`order ${orderId} confirmed, ${total}`);
  },

  async reject({ orderId, reason }: RejectedEvent) {
    await orders().update({ id: orderId, status: STATUS.PENDING }, { status: STATUS.REJECTED, reason });
  },
};
