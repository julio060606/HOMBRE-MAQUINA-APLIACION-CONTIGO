import { ENV } from '../../config/env';
import { User } from '../../types';
import { getAuthToken } from './tokenStorage';
import { ApiError, ApiSessionDto, clearApiSession, fetchAuthenticated, isApiUser, readStoredApiUser, responseError, storeApiSession, storeApiUser } from './apiTransport';
export type LoginResponseDto = ApiSessionDto;

export async function loginWithApi(email: string, password: string): Promise<User> {
  let response: Response;
  try {
    response = await fetch(`${ENV.API_BASE_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
  } catch { throw new ApiError(0, 'No se pudo conectar al servidor de CONTIGO. Comprueba la conexión y vuelve a intentarlo.'); }
  if (!response.ok) throw await responseError(response);
  return storeApiSession(await response.json());
}

export async function loadApiUser(): Promise<User> {
  const response = await fetchAuthenticated('/auth/me');
  if (!response.ok) throw await responseError(response);
  const user: unknown = await response.json();
  if (!isApiUser(user)) throw new ApiError(502, 'No se pudo recuperar el perfil de la sesión.');
  const currentUser = readStoredApiUser();
  if (!getAuthToken() || (currentUser && currentUser.id !== user.id)) throw new ApiError(401, 'La sesión cambió. Vuelve a iniciar sesión.');
  storeApiUser(user);
  return user;
}

export async function logoutApi(): Promise<void> {
  const token = getAuthToken();
  // Clear this browser immediately; an earlier logout response must not erase a later login.
  clearApiSession();
  if (!token) return;
  try {
    await fetch(`${ENV.API_BASE_URL}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  } catch { /* The local session is closed even when the server is unreachable. */ }
}

export const getStoredApiUser = readStoredApiUser;
