import type { Handler } from 'shop-qua';
import { productService } from '../../services';
import type { Product } from '../../types';

export const updateProductHandler: Handler<Partial<Pick<Product, 'name' | 'description' | 'price' | 'active'>>> = async (req) => ({
  body: await productService.update(req.params.id, req.body),
});
