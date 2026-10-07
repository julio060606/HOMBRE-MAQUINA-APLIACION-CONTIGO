const TOKEN_KEY = 'contigo_api_token';
const REFRESH_KEY = 'contigo_api_refresh_token';

let inMemoryToken: string | null = null;
let inMemoryRefreshToken: string | null = null;

function hasWindowSessionStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
  } catch {
    return false;
  }
}

export function getAuthToken(): string | null {
  if (hasWindowSessionStorage()) {
    try {
      const val = window.sessionStorage.getItem(TOKEN_KEY);
      if (val !== null) return val;
    } catch {
      // fallback to memory
    }
  }
  return inMemoryToken;
}

export function setAuthToken(token: string | null): void {
  inMemoryToken = token;
  if (hasWindowSessionStorage()) {
    try {
      if (token) {
        window.sessionStorage.setItem(TOKEN_KEY, token);
      } else {
        window.sessionStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // fallback to memory
    }
  }
}

export function getRefreshToken(): string | null {
  if (hasWindowSessionStorage()) {
    try {
      const val = window.sessionStorage.getItem(REFRESH_KEY);
      if (val !== null) return val;
    } catch {
      // fallback to memory
    }
  }
  return inMemoryRefreshToken;
}

export function setRefreshToken(token: string | null): void {
  inMemoryRefreshToken = token;
  if (hasWindowSessionStorage()) {
    try {
      if (token) {
        window.sessionStorage.setItem(REFRESH_KEY, token);
      } else {
        window.sessionStorage.removeItem(REFRESH_KEY);
      }
    } catch {
      // fallback to memory
    }
  }
}

export function clearTokens(): void {
  setAuthToken(null);
  setRefreshToken(null);
}

