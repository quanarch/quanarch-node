import { getQuanarCore } from '../../state/index.js';
import type { Logger } from '../../types/index.js';

export const log: Logger = {
  info: (message, data) => getQuanarCore().log.info(message, data),
  warn: (message, data) => getQuanarCore().log.warn(message, data),
  error: (message, data) => getQuanarCore().log.error(message, data),
};
