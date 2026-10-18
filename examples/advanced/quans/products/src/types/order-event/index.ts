/** What orders.placed and orders.cancelled carry, as this quan reads it. */
export interface OrderEvent {
  orderId: string;
  items: { productId: string; quantity: number }[];
}
