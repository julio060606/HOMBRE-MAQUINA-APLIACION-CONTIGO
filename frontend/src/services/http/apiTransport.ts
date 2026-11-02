import { ENV } from '../../config/env';
import { User } from '../../types';
import { beginAuthSession, clearTokens, getAuthSessionGeneration, getAuthSessionRevision, getAuthToken, getRefreshToken, setAuthToken, setRefreshToken } from './tokenStorage';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
  }
}
export interface ApiSessionDto { token: string; refreshToken: string; user: User }
const USER_KEY = 'contigo_api_user';
let refreshInFlight: Promise<User> | undefined;
const roles = new Set(['ROLE_PATIENT', 'ROLE_CAREGIVER', 'ROLE_CLINIC_ADMIN', 'ROLE_SUPER_ADMIN']);

export function isApiUser(value: unknown): value is User {
  if (!value || typeof value !== 'object') return false;
  const user = value as Partial<User>;
  return typeof user.id === 'string' && !!user.id && typeof user.name === 'string'
    && typeof user.email === 'string' && typeof user.organizationId === 'string'
    && typeof user.role === 'string' && roles.has(user.role)
    && (user.role !== 'ROLE_PATIENT' || (typeof user.patientId === 'string' && !!user.patientId));
}
export function storeApiUser(user: User): void {
  try { sessionStorage.setItem(USER_KEY, JSON.stringify(user)); } catch { /* The active React session remains available. */ }
}
export function storeApiSession(value: unknown, renewal = false): User {
  const data = value as Partial<ApiSessionDto> | null;
  if (!data || typeof data.token !== 'string' || !data.token || typeof data.refreshToken !== 'string' || !data.refreshToken || !isApiUser(data.user)) {
    throw new ApiError(502, 'El servidor devolvió una sesión incompleta. Vuelve a iniciar sesión.');
  }
  if (!renewal) beginAuthSession();
  storeApiUser(data.user);
  setRefreshToken(data.refreshToken);
  setAuthToken(data.token);
  return data.user;
}
export function clearApiSession(): void {
  clearTokens();
  try { sessionStorage.removeItem(USER_KEY); } catch { /* Session storage may be unavailable. */ }
}
export function readStoredApiUser(): User | null {
  if (!getAuthToken() && !getRefreshToken()) return null;
  try {
    const data: unknown = JSON.parse(sessionStorage.getItem(USER_KEY) || 'null');
    return isApiUser(data) ? data : null;
  } catch { return null; }
}
export async function responseError(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => null) as { message?: string; details?: Record<string, string> } | null;
  return new ApiError(response.status, body?.message || (response.status === 401
    ? 'Tu sesión terminó. Inicia sesión para continuar.' : `No se pudo completar la solicitud (${response.status}).`), body?.details);
}

export async function refreshApiSession(): Promise<User> {
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new ApiError(401, 'Tu sesión terminó. Inicia sesión para continuar.');
  const revision = getAuthSessionRevision();
  const task = (async () => {
    let response: Response;
    try {
      response = await fetch(`${ENV.API_BASE_URL}/auth/refresh`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }),
      });
    } catch { throw new ApiError(0, 'No se pudo renovar la sesión. Comprueba la conexión y vuelve a intentarlo.'); }
    // A completed logout or a different login must never be undone by an older refresh response.
    if (getAuthSessionRevision() !== revision || getRefreshToken() !== refreshToken) {
      throw new ApiError(401, 'La sesión cambió mientras se renovaba. Vuelve a iniciar sesión.');
    }
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) clearApiSession();
      throw await responseError(response);
    }
    const data: unknown = await response.json();
    if (getAuthSessionRevision() !== revision || getRefreshToken() !== refreshToken) {
      throw new ApiError(401, 'La sesión cambió mientras se renovaba. Vuelve a iniciar sesión.');
    }
    return storeApiSession(data, true);
  })();
  refreshInFlight = task;
  try { return await task; }
  finally { if (refreshInFlight === task) refreshInFlight = undefined; }
}

/** Fetches only the configured API. A failed server request never falls back to local synthetic storage. */
export async function fetchAuthenticated(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const generation = getAuthSessionGeneration();
  const assertSameSession = () => {
    if (generation !== getAuthSessionGeneration()) throw new ApiError(401, 'La sesión cambió. Vuelve a realizar la acción con la cuenta actual.');
  };
  const send = async (accessToken: string | null) => {
    const headers = new Headers(options.headers);
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    else headers.delete('Authorization');
    try { return await fetch(`${ENV.API_BASE_URL}${path}`, { ...options, headers }); }
    catch (error) {
      if (options.signal?.aborted || (error instanceof Error && error.name === 'AbortError')) throw error;
      throw new ApiError(0, 'No se pudo conectar al servidor de CONTIGO. Comprueba la conexión y vuelve a intentarlo.');
    }
  };
  let response = await send(token);
  assertSameSession();
  if (response.status === 401 && getRefreshToken()) {
    // Concurrent requests that used an older JWT reuse the newly refreshed JWT.
    if (getAuthToken() === token) await refreshApiSession();
    assertSameSession();
    if (options.signal?.aborted) throw options.signal.reason || new DOMException('Solicitud cancelada.', 'AbortError');
    response = await send(getAuthToken());
    assertSameSession();
  }
  if (response.status === 401) clearApiSession();
  return response;
}
