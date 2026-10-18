import { log, type LocalMiddleware } from 'shop-qua';

/** Writes down who changed what, after the change went through. */
export const auditMiddleware: LocalMiddleware = async (req, next) => {
  const res = await next();
  if ((res.status ?? 200) < 400) log.info(`${req.user?.name ?? 'someone'} ${req.method} ${req.path}`, req.body);
  return res;
};
