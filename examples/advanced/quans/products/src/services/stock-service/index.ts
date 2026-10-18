import { db, events, log, type DbOperation } from 'shop-qua';
import { EVENTS, LOW_STOCK, MODELS } from '../../constants';
import type { OrderEvent, Product, Reservation, ReservedLine } from '../../types';

const products = () => db.model<Product>(MODELS.PRODUCTS);
const reservations = () => db.model<Reservation>(MODELS.RESERVATIONS);

/** The same product asked twice in one order is one line. */
function merge(items: OrderEvent['items']) {
  const quantities = new Map<string, number>();
  for (const { productId, quantity } of items) quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
}

/**
 * Takes stock for orders and gives it back. Orders never touch this quan's tables:
 * they say an order was placed, and hear back whether it could be served.
 */
export const stockService = {
  async reserve({ orderId, items }: OrderEvent) {
    if (await reservations().findOne({ orderId })) return;
    const reject = (reason: string) => events.emit(EVENTS.REJECTED, { orderId, reason });

    const wanted = merge(items);
    const found = await products().find({ where: { id: { in: wanted.map((w) => w.productId) }, active: true } });
    const byId = new Map(found.map((p) => [p.id, p]));
    const unknown = wanted.find((w) => !byId.has(w.productId));
    if (unknown) return reject(`product ${unknown.productId} is not sold`);

    const lines: ReservedLine[] = wanted.map(({ productId, quantity }) => {
      const p = byId.get(productId)!;
      return { productId, name: p.name, price: p.price, quantity };
    });
    const total = Math.round(lines.reduce((sum, l) => sum + l.price * l.quantity, 0) * 100) / 100;

    // Every line or none: an update that finds less stock than asked changes no row, and the batch rolls back.
    const take: DbOperation[] = lines.map((l) => ({
      action: 'update',
      model: MODELS.PRODUCTS,
      where: { id: l.productId, stock: { gte: l.quantity } },
      data: { stock: { decrement: l.quantity } },
      expect: 1,
    }));
    try {
      await db.transaction([...take, { action: 'create', model: MODELS.RESERVATIONS, data: { orderId, items: lines, total } }]);
    } catch {
      const short = lines.filter((l) => byId.get(l.productId)!.stock < l.quantity).map((l) => l.name);
      return reject(short.length ? `not enough ${short.join(', ')}` : 'stock changed, try again');
    }

    await events.emit(EVENTS.RESERVED, { orderId, total, lines });
    for (const p of await products().find({ where: { id: { in: lines.map((l) => l.productId) }, stock: { lt: LOW_STOCK } } })) {
      await events.emit(EVENTS.STOCK_LOW, { productId: p.id, name: p.name, stock: p.stock });
    }
  },

  async release({ orderId }: Pick<OrderEvent, 'orderId'>) {
    const reservation = await reservations().findOne({ orderId });
    if (!reservation) return;
    await db.transaction([
      ...reservation.items.map(
        (l): DbOperation => ({ action: 'update', model: MODELS.PRODUCTS, where: { id: l.productId }, data: { stock: { increment: l.quantity } } }),
      ),
      { action: 'delete', model: MODELS.RESERVATIONS, where: { orderId }, expect: 1 },
    ]);
    log.info(`gave back the stock of order ${orderId}`);
  },
};
