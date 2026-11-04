import { ENV } from '../../config/env';
import { fetchAuthenticated, responseError } from '../../services/http/apiTransport';
import { emitApiChange } from '../../services/http/changeEvents';

export type SupportSession = {
  id: string; patientId: string; patientName?: string; callerId: string; responderId?: string;
  responderName?: string; status: 'WAITING' | 'ACCEPTED' | 'ENDED'; createdAt: string;
  expiresAt: string; endedReason?: string; alertId: string;
};
export type SupportEventKind = 'TEXT' | 'OFFER' | 'ANSWER' | 'ICE';
export type SupportEvent = {
  id: number; senderId: string; senderName: string; kind: SupportEventKind; payload: string; createdAt: string;
};
export type SupportUpdate = { session: SupportSession; events: SupportEvent[] };
const base = (patientId: string) => `/patients/${encodeURIComponent(patientId)}/support-sessions`;
const room = (patientId: string, id: string) => `${base(patientId)}/${encodeURIComponent(id)}`;

export const supportOperationId = () => crypto.randomUUID();

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (ENV.USE_MOCKS) throw new Error('La conversación remota necesita el servidor de CONTIGO. No está disponible en el modo sin conexión.');
  const response = await fetchAuthenticated(path, {
    ...options, headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) throw await responseError(response);
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const supportApi = {
  list: (patientId: string, signal?: AbortSignal) => request<SupportSession[]>(base(patientId), { signal }),
  create: async (patientId: string, operationId: string, message?: string) => {
    const value = await request<SupportSession>(base(patientId), {
    method: 'POST', body: JSON.stringify({ operationId, ...(message?.trim() ? { message: message.trim() } : {}) }),
    });
    emitApiChange('data'); return value;
  },
  accept: async (patientId: string, id: string) => {
    const value = await request<SupportSession>(`${room(patientId, id)}/accept`, { method: 'POST' });
    emitApiChange('data'); return value;
  },
  events: (patientId: string, id: string, after = 0, signal?: AbortSignal) => request<SupportUpdate>(`${room(patientId, id)}/events?after=${after}`, { signal }),
  send: (patientId: string, id: string, kind: SupportEventKind, payload: string, operationId: string = supportOperationId()) => {
    if (kind === 'TEXT' && (!payload.trim() || payload.length > 1000)) return Promise.reject(new Error('Escribe un mensaje de hasta 1000 caracteres.'));
    return request<SupportEvent>(`${room(patientId, id)}/events`, {
      method: 'POST', body: JSON.stringify({ operationId, kind, payload: kind === 'TEXT' ? payload.trim() : payload }),
    });
  },
  end: async (patientId: string, id: string) => {
    const value = await request<SupportSession>(`${room(patientId, id)}/end`, { method: 'POST' });
    emitApiChange('data'); return value;
  },
  extend: (patientId: string, id: string, operationId: string) => request<SupportSession>(`${room(patientId, id)}/extend`, {
    method: 'POST', body: JSON.stringify({ operationId }),
  }),
};
