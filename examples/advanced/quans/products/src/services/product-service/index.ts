import { db, type Changes, type Row } from 'shop-qua';
import { MODELS } from '../../constants';
import type { Product } from '../../types';
import { AppError } from '../../utils';

const products = () => db.model<Product>(MODELS.PRODUCTS);

export const productService = {
  /** Active products for everyone; a manager may ask for the inactive ones too. */
  list(options: { search?: string; limit?: number; offset?: number; all: boolean }) {
    return products().find({
      where: { ...(options.all ? {} : { active: true }), ...(options.search ? { name: { like: `%${options.search}%` } } : {}) },
      orderBy: { name: 'asc' },
      limit: options.limit ?? 50,
      offset: options.offset ?? 0,
    });
  },

  async create(input: Pick<Product, 'name' | 'price'> & Partial<Product>): Promise<Row<Product>> {
    if (await products().findOne({ name: input.name })) throw new AppError(409, 'name_taken', 'A product with this name exists');
    return products().create({ name: input.name, description: input.description, price: input.price, stock: input.stock ?? 0, active: true });
  },

  async update(id: string, changes: Changes<Product>): Promise<Row<Product>> {
    const product = await products().updateById(id, changes);
    if (!product) throw new AppError(404, 'product_not_found', 'No such product');
    return product;
  },

  async restock(id: string, quantity: number): Promise<Row<Product>> {
    return productService.update(id, { stock: { increment: quantity } });
  },
};
