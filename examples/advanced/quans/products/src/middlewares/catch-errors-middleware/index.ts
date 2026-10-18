import type { LocalMiddleware } from 'shop-qua';
import { AppError } from '../../utils';

/** Turns the failures this quan expects into answers; anything else is the quanar's 500. */
export const catchErrorsMiddleware: LocalMiddleware = async (req, next) => {
  try {
    return await next();
  } catch (error) {
    if (!(error instanceof AppError)) throw error;
    return { status: error.status, body: { error: { code: error.code, message: error.message }, requestId: req.requestId } };
  }
};
