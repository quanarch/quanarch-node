export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  active: boolean;
}

export interface NewProduct {
  name: string;
  description?: string;
  price: number;
  stock: number;
}
