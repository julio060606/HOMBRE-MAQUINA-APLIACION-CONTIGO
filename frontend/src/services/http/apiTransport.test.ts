import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ENV } from '../../config/env';
import { User } from '../../types';
import { clearApiSession, fetchAuthenticated, readStoredApiUser, refreshApiSession, storeApiSession } from './apiTransport';
import { getAuthToken, getRefreshToken } from './tokenStorage';
import { loginWithApi, logoutApi } from './authApi';

const caregiver: User = { id: 'caregiver_demo', name: 'Cuidador sintético', email: 'cuidador@contigo.example', role: 'ROLE_CAREGIVER', organizationId: 'clinic_demo' };
const session = (token = 'jwt-old', refreshToken = 'refresh-old') => ({ token, refreshToken, user: caregiver });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

describe('authenticated central API sessions', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) };
    vi.stubGlobal('sessionStorage', storage);
    vi.stubGlobal('window', { sessionStorage: storage });
    clearApiSession();
  });
  afterEach(() => { clearApiSession(); vi.unstubAllGlobals(); });

  it('uses the API login response role and tokens, rejecting an incomplete patient session', async () => {
    const patient = { ...caregiver, id: 'patient_dacio', role: 'ROLE_PATIENT', patientId: 'pat_001' };
    const fetch = vi.fn().mockResolvedValue(json({ ...session(), user: patient }));
    vi.stubGlobal('fetch', fetch);
    expect(await loginWithApi(' dacio@contigo.example ', 'password')).toEqual(patient);
    expect(readStoredApiUser()).toEqual(patient);
    expect(getAuthToken()).toBe('jwt-old');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ email: 'dacio@contigo.example', password: 'password' });
    expect(() => storeApiSession({ ...session(), user: { ...patient, patientId: undefined } })).toThrow('sesión incompleta');
  });

  it('renews an expired JWT once for concurrent requests and retries with the new Bearer token', async () => {
    storeApiSession(session());
    const renewal = deferred<Response>();
    const fetch = vi.fn(async (url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return renewal.promise;
      return new Headers(init.headers).get('Authorization') === 'Bearer jwt-old' ? json({}, 401) : json({ ok: true });
    });
    vi.stubGlobal('fetch', fetch);
    const requests = [fetchAuthenticated('/patients'), fetchAuthenticated('/patients/pat_001/dashboard')];
    await vi.waitFor(() => expect(fetch.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'))).toHaveLength(1));
    renewal.resolve(json(session('jwt-new', 'refresh-new')));
    const results = await Promise.all(requests);
    expect(results.every(response => response.ok)).toBe(true);
    expect(getAuthToken()).toBe('jwt-new');
    expect(getRefreshToken()).toBe('refresh-new');
    expect(fetch.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'))).toHaveLength(1);
    expect(fetch.mock.calls.filter(([, init]) => new Headers(init.headers).get('Authorization') === 'Bearer jwt-new')).toHaveLength(2);
  });

  it('retains authorization failures as 403 and never refreshes or supplies local data', async () => {
    storeApiSession(session());
    const fetch = vi.fn().mockResolvedValue(json({ message: 'Sin vínculo' }, 403));
    vi.stubGlobal('fetch', fetch);
    expect((await fetchAuthenticated('/patients/pat_002/dashboard')).status).toBe(403);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(getAuthToken()).toBe('jwt-old');
  });

  it('does not resurrect a session if logout happens while the refresh body is being decoded', async () => {
    storeApiSession(session());
    const body = deferred<unknown>();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => body.promise }));
    const pending = refreshApiSession();
    const rejected = expect(pending).rejects.toThrow('sesión cambió');
    await Promise.resolve();
    clearApiSession();
    body.resolve(session('jwt-new', 'refresh-new'));
    await rejected;
    expect(getAuthToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(readStoredApiUser()).toBeNull();
  });

  it('cancels the old request after renewal without clearing the renewed session', async () => {
    storeApiSession(session());
    const controller = new AbortController();
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.endsWith('/auth/refresh')) { controller.abort(); return json(session('jwt-new', 'refresh-new')); }
      return json({}, 401);
    }));
    await expect(fetchAuthenticated('/events/stream?patientId=pat_001', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(getAuthToken()).toBe('jwt-new');
  });

  it('clears an expired refresh token instead of falling back to mocks', async () => {
    storeApiSession(session());
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ message: 'Refresh vencido' }, 401)));
    await expect(fetchAuthenticated('/patients')).rejects.toThrow('Refresh vencido');
    expect(getAuthToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('does not erase a newer login when an earlier logout response arrives', async () => {
    storeApiSession(session());
    const delayed = deferred<Response>();
    const fetch = vi.fn().mockReturnValue(delayed.promise);
    vi.stubGlobal('fetch', fetch);
    const pending = logoutApi();
    expect(getAuthToken()).toBeNull();
    storeApiSession(session('jwt-next', 'refresh-next'));
    delayed.resolve(new Response(null, { status: 204 }));
    await pending;
    expect(getAuthToken()).toBe('jwt-next');
    expect(fetch.mock.calls[0][0]).toBe(`${ENV.API_BASE_URL}/auth/logout`);
  });

  it('never replays a request made by the previous session under a newly logged-in account', async () => {
    storeApiSession(session());
    const delayed = deferred<Response>();
    const fetch = vi.fn().mockReturnValue(delayed.promise);
    vi.stubGlobal('fetch', fetch);
    const pending = fetchAuthenticated('/patients/pat_001/measurements/weight', { method: 'POST', body: '{"weightKg":72}' });
    const rejected = expect(pending).rejects.toThrow('sesión cambió');
    storeApiSession({ ...session('jwt-next', 'refresh-next'), user: { ...caregiver, id: 'another-caregiver' } });
    delayed.resolve(json({}, 401));
    await rejected;
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(getAuthToken()).toBe('jwt-next');
  });
});
