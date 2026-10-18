import type { Handler } from 'shop-qua';
import { productService } from '../../services';

export const restockProductHandler: Handler<{ quantity: number }> = async (req) => ({
  body: await productService.restock(req.params.id, req.body.quantity),
});
