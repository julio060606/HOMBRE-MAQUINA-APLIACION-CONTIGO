import { fetchAuthenticated } from './apiTransport';
import { getAuthToken, subscribeAuthToken } from './tokenStorage';

export interface ServerEvent { type: string; data: unknown }
export function parseServerEvent(block: string): ServerEvent | null {
  const lines = block.split(/\r?\n/);
  const payload = lines.filter(line => line.startsWith('data:')).map(line => line.slice(5).replace(/^ /, '')).join('\n');
  if (!payload) return null; // Ignore keepalive comments and empty frames.
  const type = lines.find(line => line.startsWith('event:'))?.slice(6).trim() || 'message';
  try { return { type, data: JSON.parse(payload) as unknown }; }
  catch { return { type, data: payload }; }
}

/** Authenticated SSE across devices; reconnecting always refetches the authoritative server snapshot. */
export function subscribeToApiEvents(patientId: string, onEvent: (type: string, data?: unknown) => void): () => void {
  let closed = false;
  let revision = 0;
  let active: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = (delay: number) => {
    if (timer) clearTimeout(timer);
    if (!closed && getAuthToken()) timer = setTimeout(() => { timer = undefined; void connect(); }, delay);
  };
  async function connect() {
    if (closed || !getAuthToken()) return;
    const currentRevision = ++revision;
    const controller = new AbortController();
    active = controller;
    let terminal = false;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      const response = await fetchAuthenticated(`/events/stream?patientId=${encodeURIComponent(patientId)}`, {
        headers: { Accept: 'text/event-stream' }, signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        terminal = response.status === 401 || response.status === 403;
        onEvent(terminal ? 'ACCESS_DENIED' : 'CONNECTION_ERROR');
        return;
      }
      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (!closed && currentRevision === revision) {
        const { value, done } = await reader.read();
        if (done || closed || currentRevision !== revision) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() || '';
        for (const block of blocks) {
          const event = parseServerEvent(block);
          if (!event) continue;
          const scope = event.data && typeof event.data === 'object' ? (event.data as { patientId?: string }).patientId : undefined;
          if (scope && scope !== patientId) continue;
          if (event.type === 'REVOKED') terminal = true;
          onEvent(event.type, event.data);
          if (terminal) return;
        }
      }
    } catch (error) {
      if (!closed && !controller.signal.aborted && currentRevision === revision) onEvent('CONNECTION_ERROR', {
        message: error instanceof Error ? error.message : 'La conexión de seguimiento se interrumpió.',
      });
    } finally {
      await reader?.cancel().catch(() => undefined);
      reader?.releaseLock();
      if (currentRevision === revision) {
        active = undefined;
        if (!terminal) schedule(3000); // Includes clean EOF and temporary server failures.
      }
    }
  }
  const unsubscribeToken = subscribeAuthToken(() => {
    revision += 1;
    active?.abort();
    active = undefined;
    if (timer) clearTimeout(timer);
    timer = undefined;
    schedule(0);
  });
  void connect();
  return () => {
    closed = true;
    revision += 1;
    unsubscribeToken();
    if (timer) clearTimeout(timer);
    active?.abort();
  };
}
