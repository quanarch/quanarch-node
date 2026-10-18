export interface Product {
  name: string;
  description?: string;
  price: number;
  stock: number;
  active: boolean;
}

export interface Reservation {
  orderId: string;
  items: ReservedLine[];
  total: number;
}

export interface ReservedLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}
