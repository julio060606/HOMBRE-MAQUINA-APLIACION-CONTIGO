import { ENV } from '../config/env';
import { User } from '../types';
import { ContigoService } from './contracts';
import { createDemoService } from './demo/service';
import { createHttpService } from './http/httpService';
import { subscribeToApiEvents } from './http/eventStream';
import { subscribeApiChanges } from './http/changeEvents';
import { syncEvents } from './demo/repository';
export { syncEvents, resetDemoData } from './demo/repository';

export function serviceFor(actor: User): ContigoService {
  return ENV.USE_MOCKS ? createDemoService(actor) : createHttpService();
}

export function subscribeToEvents(patientId: string, onEvent: (eventType: string, data?: unknown) => void): () => void {
  if (ENV.USE_MOCKS) return syncEvents.subscribe(change => onEvent(change));
  const stopRemote = subscribeToApiEvents(patientId, onEvent);
  const stopLocal = subscribeApiChanges(change => onEvent(change));
  return () => { stopRemote(); stopLocal(); };
}
