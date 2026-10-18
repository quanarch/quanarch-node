import type { Product } from '../product';

export type OrderStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';

export interface OrderLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: { productId: string; quantity: number }[];
  lines?: OrderLine[];
  total?: number;
  reason?: string;
  createdAt: string;
}

export interface CartLine {
  product: Product;
  quantity: number;
}
