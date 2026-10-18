/** Events this quan emits. */
export const EVENTS = {
  PLACED: 'orders.placed',
  CANCELLED: 'orders.cancelled',
} as const;

/** Events of other quans this quan listens to. */
export const LISTENS = {
  RESERVED: 'products.reserved',
  REJECTED: 'products.rejected',
} as const;
