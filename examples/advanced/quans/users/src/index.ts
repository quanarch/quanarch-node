import type { QuanManifest } from 'shop-qua';
import { userApis } from './apis';
import { QUAN_NAME } from './constants';
import { userModel } from './models';
import { userPermissions } from './permissions';
import { userService } from './services';

const manifest: QuanManifest = {
  name: QUAN_NAME,
  version: '1.0.0',
  models: [userModel],
  permissions: userPermissions,
  apis: userApis,
  onMount: () => userService.ensureAdmin(),
};

export default manifest;
