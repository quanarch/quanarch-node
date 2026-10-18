import { METHOD, type ApiDefinition } from 'shop-qua';
import { PERMISSIONS, ROUTES } from '../../constants';
import { createProductHandler, getProductHandler, listProductsHandler, restockProductHandler, updateProductHandler } from '../../handlers';
import { catchErrorsMiddleware, loadProductMiddleware } from '../../middlewares';
import { createProductValidation, listProductsValidation, restockValidation, updateProductValidation } from '../../validations';

export const productApis: ApiDefinition[] = [
  {
    endpoint: ROUTES.LIST,
    method: METHOD.GET,
    validation: listProductsValidation,
    handler: listProductsHandler,
    description: 'The catalogue; managers also see inactive products',
  },
  {
    endpoint: ROUTES.ONE,
    method: METHOD.GET,
    middlewares: [loadProductMiddleware],
    handler: getProductHandler,
    description: 'One product',
  },
  {
    endpoint: ROUTES.LIST,
    method: METHOD.POST,
    permissions: [PERMISSIONS.MANAGE],
    middlewares: [catchErrorsMiddleware],
    validation: createProductValidation,
    handler: createProductHandler,
    description: 'Add a product',
  },
  {
    endpoint: ROUTES.ONE,
    method: METHOD.PATCH,
    permissions: [PERMISSIONS.MANAGE],
    middlewares: [catchErrorsMiddleware, loadProductMiddleware],
    validation: updateProductValidation,
    handler: updateProductHandler,
    description: 'Change a product',
  },
  {
    endpoint: ROUTES.RESTOCK,
    method: METHOD.POST,
    permissions: [PERMISSIONS.MANAGE],
    middlewares: [catchErrorsMiddleware, loadProductMiddleware],
    validation: restockValidation,
    handler: restockProductHandler,
    description: 'Add stock',
  },
];
