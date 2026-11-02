import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseServerEvent, subscribeToApiEvents } from './eventStream';
import { clearTokens, setAuthToken } from './tokenStorage';
import { ENV } from '../../config/env';

const streamResponse = (...chunks: string[]) => new Response(new ReadableStream<Uint8Array>({
  start(controller) { chunks.forEach(chunk => controller.enqueue(new TextEncoder().encode(chunk))); controller.close(); },
}), { headers: { 'Content-Type': 'text/event-stream' } });

describe('authenticated cross-device server events', () => {
  let stop: (() => void) | undefined;
  beforeEach(() => { clearTokens(); setAuthToken('session-storage-jwt'); vi.useFakeTimers(); });
  afterEach(() => { stop?.(); stop = undefined; clearTokens(); vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('parses CRLF and multiline SSE payloads while ignoring keepalive comments', () => {
    expect(parseServerEvent(': keepalive')).toBeNull();
    expect(parseServerEvent('event: MEASUREMENT_RECORDED\r\ndata: {"patientId":"pat_001",\r\ndata: "value":72}')).toEqual({
      type: 'MEASUREMENT_RECORDED', data: { patientId: 'pat_001', value: 72 },
    });
  });

  it('authenticates with a header, scopes events, handles fragmented frames and reconnects after clean EOF', async () => {
    const fetch = vi.fn().mockImplementation(() => streamResponse(
      ': heartbeat\r\n\r\nevent: MEASUREMENT_RECORDED\r\ndata: {"patientId":"pat_',
      '001","value":72}\r\n\r\nevent: DOSE_RECORDED\r\ndata: {"patientId":"pat_002"}\r\n\r\n',
    ));
    vi.stubGlobal('fetch', fetch);
    const onEvent = vi.fn();
    stop = subscribeToApiEvents('pat_001', onEvent);
    await vi.advanceTimersByTimeAsync(0);
    expect(onEvent).toHaveBeenCalledExactlyOnceWith('MEASUREMENT_RECORDED', { patientId: 'pat_001', value: 72 });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${ENV.API_BASE_URL}/events/stream?patientId=pat_001`);
    expect(url).not.toContain('jwt');
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer session-storage-jwt');
    expect(new Headers(init.headers).get('Accept')).toBe('text/event-stream');
    await vi.advanceTimersByTimeAsync(3000);
    expect(fetch).toHaveBeenCalledTimes(2);
    stop();
    await vi.advanceTimersByTimeAsync(10000);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('reopens with the renewed token and cancels its owned request on logout', async () => {
    const fetch = vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    }));
    vi.stubGlobal('fetch', fetch);
    const events = vi.fn();
    stop = subscribeToApiEvents('pat_001', events);
    expect(fetch).toHaveBeenCalledTimes(1);
    setAuthToken('renewed-jwt');
    await vi.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(new Headers(fetch.mock.calls[1][1].headers).get('Authorization')).toBe('Bearer renewed-jwt');
    clearTokens();
    await vi.advanceTimersByTimeAsync(10000);
    expect(fetch.mock.calls[1][1].signal?.aborted).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(events).not.toHaveBeenCalled();
  });

  it('stops retrying an unauthorized patient subscription', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 403 }));
    vi.stubGlobal('fetch', fetch);
    const events = vi.fn();
    stop = subscribeToApiEvents('pat_002', events);
    await vi.advanceTimersByTimeAsync(0);
    expect(events).toHaveBeenCalledWith('ACCESS_DENIED');
    await vi.advanceTimersByTimeAsync(10000);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
