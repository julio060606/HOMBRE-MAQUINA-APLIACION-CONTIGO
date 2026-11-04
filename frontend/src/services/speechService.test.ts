import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DEFAULT_READING_PREFERENCES, setReadingPreferences } from './accessibilityPreferences';
import { speechService } from './speechService';

const speak = vi.fn(), cancel = vi.fn();
beforeEach(() => {
  vi.useFakeTimers();
  const stored = new Map<string, string>();
  vi.stubGlobal('window', {
    localStorage: { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => stored.set(key, value) },
    dispatchEvent: () => true,
    speechSynthesis: { speak, cancel, getVoices: () => [] },
  });
  vi.stubGlobal('SpeechSynthesisUtterance', class { constructor(public text: string) {} });
  setReadingPreferences(DEFAULT_READING_PREFERENCES);
});
afterEach(() => { speechService.stop(); setReadingPreferences(DEFAULT_READING_PREFERENCES); vi.clearAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); });

it('bloquea nuevas lecturas en modo sin sonido', () => {
  setReadingPreferences({ ...DEFAULT_READING_PREFERENCES, silent: true });
  speechService.speak('Mensaje visible');
  vi.runAllTimers();
  expect(speak).not.toHaveBeenCalled();
});
it('cancela también una lectura pendiente cuando se activa el silencio', () => {
  speechService.speak('Mensaje pendiente');
  setReadingPreferences({ ...DEFAULT_READING_PREFERENCES, silent: true });
  vi.runAllTimers();
  expect(speak).not.toHaveBeenCalled();
});
it('permite volver a leer cuando el usuario desactiva el silencio', () => {
  speechService.speak('Mensaje solicitado');
  vi.runAllTimers();
  expect(speak).toHaveBeenCalledOnce();
  expect(speak.mock.calls[0][0].text).toBe('Mensaje solicitado');
});
