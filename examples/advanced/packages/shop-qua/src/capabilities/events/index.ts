import { getQuanarCore } from '../../state/index.js';
import type { EventsCapability } from '../../types/index.js';

export const events: EventsCapability = {
  emit: (event, payload) => getQuanarCore().events.emit(event, payload),
};
