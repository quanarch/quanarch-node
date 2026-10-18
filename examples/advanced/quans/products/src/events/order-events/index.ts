import type { EventSubscription } from 'shop-qua';
import { LISTENS } from '../../constants';
import { stockService } from '../../services';
import type { OrderEvent } from '../../types';

export const orderEvents: EventSubscription<OrderEvent>[] = [
  { event: LISTENS.ORDER_PLACED, handler: (order) => stockService.reserve(order) },
  { event: LISTENS.ORDER_CANCELLED, handler: (order) => stockService.release(order) },
];
