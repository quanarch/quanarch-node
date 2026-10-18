import type { Handler } from 'shop-qua';
import { productService } from '../../services';
import type { Product } from '../../types';

export const createProductHandler: Handler<Pick<Product, 'name' | 'price'> & Partial<Product>> = async (req) => ({
  status: 201,
  body: await productService.create(req.body),
});
