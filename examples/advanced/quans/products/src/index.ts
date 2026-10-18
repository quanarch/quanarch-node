import type { QuanManifest } from 'shop-qua';
import { productApis } from './apis';
import { QUAN_NAME } from './constants';
import { orderEvents } from './events';
import { productModel, reservationModel } from './models';
import { productPermissions } from './permissions';

const manifest: QuanManifest = {
  name: QUAN_NAME,
  version: '1.0.0',
  models: [productModel, reservationModel],
  permissions: productPermissions,
  apis: productApis,
  events: orderEvents,
};

export default manifest;
