import { expect, it } from 'vitest';
import { normalizeSosMessage } from './sosMessage';

it('mantiene texto español y saltos de línea pero rechaza controles invisibles como el backend', () => {
  expect(normalizeSosMessage('  Por favor, escríbeme.\nNo puedo hablar.  ')).toBe('Por favor, escríbeme.\nNo puedo hablar.');
  expect(() => normalizeSosMessage('Mensaje\u0000oculto')).toThrow('caracteres de control');
  expect(() => normalizeSosMessage('Mensaje\u0085oculto')).toThrow('caracteres de control');
});
