import { METHOD, MIDDLEWARE, type ApiDefinition } from 'shop-qua';
import { PERMISSIONS, ROUTES } from '../../constants';
import { listUsersHandler, loginHandler, meHandler, registerHandler, setRoleHandler } from '../../handlers';
import { auditMiddleware, catchErrorsMiddleware } from '../../middlewares';
import { loginValidation, registerValidation, roleValidation } from '../../validations';

export const userApis: ApiDefinition[] = [
  {
    endpoint: ROUTES.REGISTER,
    method: METHOD.POST,
    middlewares: [MIDDLEWARE.RATE_LIMIT, catchErrorsMiddleware],
    validation: registerValidation,
    handler: registerHandler,
    description: 'Create an account',
  },
  {
    endpoint: ROUTES.LOGIN,
    method: METHOD.POST,
    middlewares: [MIDDLEWARE.RATE_LIMIT, catchErrorsMiddleware],
    validation: loginValidation,
    handler: loginHandler,
    description: 'Sign in and get a token',
  },
  {
    endpoint: ROUTES.ME,
    method: METHOD.GET,
    middlewares: [MIDDLEWARE.AUTHENTICATE, catchErrorsMiddleware],
    handler: meHandler,
    description: 'The signed-in user',
  },
  {
    endpoint: ROUTES.LIST,
    method: METHOD.GET,
    permissions: [PERMISSIONS.READ],
    handler: listUsersHandler,
    description: 'Every user',
  },
  {
    endpoint: ROUTES.ROLE,
    method: METHOD.PUT,
    permissions: [PERMISSIONS.MANAGE],
    middlewares: [catchErrorsMiddleware, auditMiddleware],
    validation: roleValidation,
    handler: setRoleHandler,
    description: "Change a user's role",
  },
];
