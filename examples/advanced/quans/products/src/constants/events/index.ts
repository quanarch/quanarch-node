/** Events this quan emits. */
export const EVENTS = {
  RESERVED: 'products.reserved',
  REJECTED: 'products.rejected',
  STOCK_LOW: 'products.stock-low',
} as const;

/** Events of other quans this quan listens to. It knows their names, never their code. */
export const LISTENS = {
  ORDER_PLACED: 'orders.placed',
  ORDER_CANCELLED: 'orders.cancelled',
} as const;
