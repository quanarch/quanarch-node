import type { QuanManifest } from 'shop-qua';
import { orderApis } from './apis';
import { QUAN_NAME } from './constants';
import { productEvents } from './events';
import { orderModel } from './models';
import { orderPermissions } from './permissions';

const manifest: QuanManifest = {
  name: QUAN_NAME,
  version: '1.0.0',
  models: [orderModel],
  permissions: orderPermissions,
  apis: orderApis,
  events: productEvents,
};

export default manifest;
