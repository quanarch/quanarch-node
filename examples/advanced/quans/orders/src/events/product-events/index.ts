import type { EventSubscription } from 'shop-qua';
import { LISTENS } from '../../constants';
import { orderService } from '../../services';
import type { RejectedEvent, ReservedEvent } from '../../types';

export const productEvents: EventSubscription[] = [
  { event: LISTENS.RESERVED, handler: (e: ReservedEvent) => orderService.confirm(e) },
  { event: LISTENS.REJECTED, handler: (e: RejectedEvent) => orderService.reject(e) },
];
