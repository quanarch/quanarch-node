import { METHOD, MIDDLEWARE, type ApiDefinition } from 'shop-qua';
import { PERMISSIONS, ROUTES } from '../../constants';
import { cancelOrderHandler, getOrderHandler, listOrdersHandler, placeOrderHandler } from '../../handlers';
import { catchErrorsMiddleware, ownOrderMiddleware } from '../../middlewares';
import { listOrdersValidation, placeOrderValidation } from '../../validations';

export const orderApis: ApiDefinition[] = [
  {
    endpoint: ROUTES.LIST,
    method: METHOD.POST,
    permissions: [PERMISSIONS.CREATE],
    middlewares: [MIDDLEWARE.RATE_LIMIT],
    validation: placeOrderValidation,
    handler: placeOrderHandler,
    description: 'Place an order; it is confirmed or rejected once products answer',
  },
  {
    endpoint: ROUTES.LIST,
    method: METHOD.GET,
    permissions: [PERMISSIONS.READ],
    validation: listOrdersValidation,
    handler: listOrdersHandler,
    description: 'Your orders, or everyone’s with orders:read-all',
  },
  {
    endpoint: ROUTES.ONE,
    method: METHOD.GET,
    permissions: [PERMISSIONS.READ],
    middlewares: [ownOrderMiddleware],
    handler: getOrderHandler,
    description: 'One order',
  },
  {
    endpoint: ROUTES.CANCEL,
    method: METHOD.POST,
    permissions: [PERMISSIONS.READ],
    middlewares: [catchErrorsMiddleware, ownOrderMiddleware],
    handler: cancelOrderHandler,
    description: 'Cancel an order; products give the stock back',
  },
];
