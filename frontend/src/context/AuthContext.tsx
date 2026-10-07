import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '../types';
import { clearDemoUser, readDemoUser, selectDemoUser } from '../services/demo/session';
import { AuthContext } from './AuthState';
import { ENV } from '../config/env';
import { getStoredApiUser, loginWithApi, logoutApi } from '../services/http/authApi';
export { useAuth } from './AuthState';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (ENV.USE_MOCKS) {
      return readDemoUser();
    }
    return getStoredApiUser();
  });
  const client = useQueryClient();

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

