import express, { type ErrorRequestHandler, type Router } from 'express';
import { appConfig } from '../../config';
import { ERROR, STATUS } from '../../constants';
import { HttpError, errorMessage, toHttpError } from '../../utils';
import { apiManager } from '../api-manager';
import { createLogger } from '../logger';
import { middlewareManager } from '../middleware-manager';

const log = createLogger('http');

const errors: ErrorRequestHandler = (error, req, res, _next) => {
  const http =
    (error as { type?: string }).type === 'entity.parse.failed'
      ? new HttpError(STATUS.BAD_REQUEST, ERROR.BAD_REQUEST, 'The body is not valid JSON')
      : toHttpError(error);
  if (http.status >= STATUS.INTERNAL) log.error(`${req.method} ${req.originalUrl} failed`, errorMessage(error));
  res.status(http.status).json({ error: { code: http.code, message: http.message, details: http.details }, requestId: res.locals.requestId });
};

/** The quanar's HTTP server: its own routes, then whatever the quans asked it to listen to. */
export function createApp(system: Router) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');
  app.use(middlewareManager.context);
  app.use((req, res, next) => {
    const started = Date.now();
    res.on('finish', () => {
      const who = res.locals.user ? ` (${(res.locals.user as { id: string }).id.slice(0, 8)})` : '';
      log.info(`${req.method} ${req.originalUrl} → ${res.statusCode} ${Date.now() - started}ms${who}`);
    });
    next();
  });
  app.use(express.json({ limit: appConfig.bodyLimit }));
  app.use(system);
  app.use(apiManager.dispatcher());
  app.use((req, _res, next) => next(new HttpError(STATUS.NOT_FOUND, ERROR.NOT_FOUND, `Nobody listens to ${req.method} ${req.path}`)));
  app.use(errors);
  return app;
}
