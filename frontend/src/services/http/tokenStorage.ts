const TOKEN_KEY = 'contigo_api_token';
const REFRESH_KEY = 'contigo_api_refresh_token';

let inMemoryToken: string | null = null;
let inMemoryRefreshToken: string | null = null;
let sessionRevision = 0;
let sessionGeneration = 0;
const tokenListeners = new Set<() => void>();
export function getAuthSessionRevision(): number { return sessionRevision; }
export function getAuthSessionGeneration(): number { return sessionGeneration; }
export function beginAuthSession(): void { sessionGeneration += 1; sessionRevision += 1; }
export function subscribeAuthToken(listener: () => void): () => void {
  tokenListeners.add(listener);
  return () => { tokenListeners.delete(listener); };
}

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
      return window.sessionStorage.getItem(TOKEN_KEY);
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
  tokenListeners.forEach(listener => listener());
}

export function getRefreshToken(): string | null {
  if (hasWindowSessionStorage()) {
    try {
      return window.sessionStorage.getItem(REFRESH_KEY);
    } catch {
      // fallback to memory
    }
  }
  return inMemoryRefreshToken;
}

export function setRefreshToken(token: string | null): void {
  if (getRefreshToken() !== token) sessionRevision += 1;
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
  sessionGeneration += 1;
  sessionRevision += 1;
  setRefreshToken(null);
  setAuthToken(null);
}

