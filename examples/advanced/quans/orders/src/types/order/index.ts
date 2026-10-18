import type { OrderStatus } from '../../constants';

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface OrderLine extends OrderItem {
  name: string;
  price: number;
}

export interface Order {
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  lines?: OrderLine[];
  total?: number;
  reason?: string;
}
