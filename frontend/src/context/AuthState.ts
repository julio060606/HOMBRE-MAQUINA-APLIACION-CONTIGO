import { createContext, useContext } from 'react';
import { User } from '../types';
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  enterDemo: (id: string) => User;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider no está disponible.');
  return value;
}
