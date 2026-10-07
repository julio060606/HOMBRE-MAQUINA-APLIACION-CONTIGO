import { ENV } from '../../config/env';
import { User } from '../../types';
import { setAuthToken, setRefreshToken, clearTokens, getRefreshToken } from './tokenStorage';

export interface LoginResponseDto {
  token: string;
  refreshToken: string;
  user: User;
}

export async function loginWithApi(email: string, password: string): Promise<User> {
  const res = await fetch(`${ENV.API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(errorData?.message || `Error de autenticación (${res.status})`);
  }

  const data = (await res.json()) as LoginResponseDto;
  setAuthToken(data.token);
  setRefreshToken(data.refreshToken);
  try {
    sessionStorage.setItem('contigo_api_user', JSON.stringify(data.user));
  } catch {
    // sessionStorage fallback
  }
  return data.user;
}

export async function logoutApi(): Promise<void> {
  const token = sessionStorage.getItem('contigo_api_token');
  const refreshToken = getRefreshToken();
  try {
    if (token) {
      await fetch(`${ENV.API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch {
    // network error on logout can be ignored
  } finally {
    clearTokens();
    try {
      sessionStorage.removeItem('contigo_api_user');
    } catch {
      // sessionStorage fallback
    }
  }
}

export function getStoredApiUser(): User | null {
  try {
    const raw = sessionStorage.getItem('contigo_api_user');
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
