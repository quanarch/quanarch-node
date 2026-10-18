import type { QuanResponse } from '../../types';
import { SYSTEM_ROUTES } from '../../constants';
import { quanService } from '../quan-service';

/** The quanar's own routes: its health and the state of its quans. No business logic. */
export function systemHandler(method: string, path: string): QuanResponse | null {
  if (method !== 'GET') return null;
  if (path === SYSTEM_ROUTES.HEALTH) return { body: { status: 'ok', uptime: Math.round(process.uptime()) } };
  if (path === SYSTEM_ROUTES.QUANS) return { body: quanService.status() };
  return null;
}
