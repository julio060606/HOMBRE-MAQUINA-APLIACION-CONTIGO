import { DEMO_USERS } from './state';
import { User } from '../../types';
import { ENV } from '../../config/env';
const KEY = 'contigo-demo-actor-v1';
export function readDemoUser(): User | null {
  if (!ENV.USE_MOCKS || typeof sessionStorage === 'undefined') return null;
  try { return DEMO_USERS.find(u => u.id === sessionStorage.getItem(KEY)) ?? null; } catch { return null; }
}
export function selectDemoUser(id: string): User {
  if (!ENV.USE_MOCKS) throw new Error('El acceso de demostración está deshabilitado.');
  const user = DEMO_USERS.find(u => u.id === id);
  if (!user) throw new Error('Cuenta de prueba inválida.');
  try { sessionStorage.setItem(KEY, user.id); } catch { throw new Error('El navegador no permite guardar esta sesión demo. Habilite el almacenamiento del sitio.'); }
  return user;
}
export function clearDemoUser() { try { sessionStorage.removeItem(KEY); } catch { /* The in-memory session is cleared by AuthProvider. */ } }
