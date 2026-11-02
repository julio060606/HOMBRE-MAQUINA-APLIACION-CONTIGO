import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '../types';
import { clearDemoUser, readDemoUser, selectDemoUser } from '../services/demo/session';
import { AuthContext } from './AuthState';
import { ENV } from '../config/env';
import { getStoredApiUser, loadApiUser, loginWithApi, logoutApi } from '../services/http/authApi';
import { getAuthToken, getRefreshToken, subscribeAuthToken } from '../services/http/tokenStorage';
export { useAuth } from './AuthState';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (ENV.USE_MOCKS) {
      return readDemoUser();
    }
    return getStoredApiUser();
  });
  const client = useQueryClient();
  useEffect(() => {
    if (ENV.USE_MOCKS) return;
    let active = true;
    const unsubscribe = subscribeAuthToken(() => {
      if (!getAuthToken() && active) { setUser(null); void client.cancelQueries(); client.clear(); }
    });
    if (getAuthToken() || getRefreshToken()) {
      void loadApiUser().then(value => { if (active && getAuthToken() && getStoredApiUser()?.id === value.id) setUser(value); }).catch(() => {
        // Network errors remain visible on data requests. An invalid JWT clears the session in transport.
      });
    }
    return () => { active = false; unsubscribe(); };
  }, [client]);

  const enterDemo = (id: string) => {
    if (!ENV.USE_MOCKS) {
      throw new Error('El modo demostración está deshabilitado en modo API.');
    }
    const value = selectDemoUser(id);
    void client.cancelQueries();
    client.clear();
    setUser(value);
    return value;
  };

  const login = async (email: string, password: string) => {
    void client.cancelQueries();
    client.clear();
    const loggedIn = await loginWithApi(email, password);
    setUser(loggedIn);
    return loggedIn;
  };

  const logout = () => {
    if (ENV.USE_MOCKS) {
      clearDemoUser();
    } else {
      void logoutApi();
    }
    void client.cancelQueries();
    client.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, enterDemo, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

