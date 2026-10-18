import type { OrderLine } from '../order';

/** What products.reserved and products.rejected carry, as this quan reads it. */
export interface ReservedEvent {
  orderId: string;
  total: number;
  lines: OrderLine[];
}

export interface RejectedEvent {
  orderId: string;
  reason: string;
}
