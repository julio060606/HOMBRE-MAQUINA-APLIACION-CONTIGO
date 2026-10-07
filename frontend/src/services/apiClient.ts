import { ENV } from '../config/env';
import { User } from '../types';
import { ContigoService } from './contracts';
import { createDemoService } from './demo/service';
import { createHttpService } from './http/httpService';
import { syncEvents } from './demo/repository';
export { syncEvents, resetDemoData } from './demo/repository';

export function serviceFor(actor: User): ContigoService {
  if (!ENV.USE_MOCKS) {
    return createHttpService();
  }
  return createDemoService(actor);
}

export function subscribeToEvents(patientId: string, onEvent: (eventType: string, data?: unknown) => void): () => void {
  if (ENV.USE_MOCKS) {
    const unsub = (syncEvents as { subscribe: (cb: (ev: string) => void) => () => void }).subscribe(change => onEvent(change));
    return unsub;
  }

  const token = localStorage.getItem('contigo_access_token');
  if (!token) return () => {};

  const controller = new AbortController();
  const endpoint = `${ENV.API_BASE_URL}/events/subscribe?patientId=${encodeURIComponent(patientId)}`;

  async function startSSE() {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
        },
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const block of parts) {
          const eventMatch = block.match(/event:\s*(.+)/);
          const dataMatch = block.match(/data:\s*(.+)/);
          const eventType = eventMatch ? eventMatch[1].trim() : 'message';
          let parsedData: unknown = undefined;
          if (dataMatch) {
            try { parsedData = JSON.parse(dataMatch[1].trim()); } catch { parsedData = dataMatch[1].trim(); }
          }
          onEvent(eventType, parsedData);
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        setTimeout(() => {
          if (!controller.signal.aborted) {
            void startSSE();
          }
        }, 5000);
      }
    }
  }

  void startSSE();
  return () => controller.abort();
}
