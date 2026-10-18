import { Router } from 'express';
import { SYSTEM_ROUTES } from '../../constants';
import { apiManager, eventManager, permissionManager, schemaManager } from '../../core';
import { quanService } from '../quan-service';

/** The quanar's own routes: its health, and what every quan declared. No business logic. */
export function systemRouter(): Router {
  const router = Router();
  router.get(SYSTEM_ROUTES.HEALTH, (_req, res) => {
    res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
  });
  router.get(SYSTEM_ROUTES.QUANS, (_req, res) => {
    res.json({
      quans: quanService.status(),
      apis: apiManager.describe(),
      models: schemaManager.describe(),
      permissions: permissionManager.all(),
      events: eventManager.describe(),
    });
  });
  return router;
}
