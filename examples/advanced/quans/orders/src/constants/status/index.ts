export const STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = (typeof STATUS)[keyof typeof STATUS];

/** An order can be cancelled until it is closed. */
export const CANCELLABLE: OrderStatus[] = [STATUS.PENDING, STATUS.CONFIRMED];
