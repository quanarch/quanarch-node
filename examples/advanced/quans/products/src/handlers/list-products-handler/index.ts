import type { Handler } from 'shop-qua';
import { PERMISSIONS } from '../../constants';
import { productService } from '../../services';

export const listProductsHandler: Handler = async (req) => {
  const query = req.query as unknown as { search?: string; limit?: number; offset?: number };
  const all = !!req.user?.permissions.includes(PERMISSIONS.MANAGE);
  return { body: await productService.list({ ...query, all }) };
};
