import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_READING_PREFERENCES, getReadingPreferences, normalizeReadingPreferences, READING_OPTIONS_KEY, setReadingPreferences, subscribeReadingPreferences } from './accessibilityPreferences';
import { requestVibration } from './accessibleFeedback';

describe('preferencias de acceso del dispositivo', () => {
  let stored: Map<string, string>;
  let surface: EventTarget & { localStorage: { getItem: ReturnType<typeof vi.fn>; setItem: ReturnType<typeof vi.fn> } };
  beforeEach(() => {
    stored = new Map();
    surface = Object.assign(new EventTarget(), { localStorage: {
      getItem: vi.fn((key: string) => stored.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => { stored.set(key, value); }),
    } });
    vi.stubGlobal('window', surface);
    setReadingPreferences(DEFAULT_READING_PREFERENCES);
  });
  afterEach(() => { setReadingPreferences(DEFAULT_READING_PREFERENCES); vi.unstubAllGlobals(); });

  it('conserva las preferencias antiguas y rechaza valores inesperados', () => {
    expect(normalizeReadingPreferences({ contrast: true, scale: '150' })).toEqual({ ...DEFAULT_READING_PREFERENCES, contrast: true, scale: '150' });
    expect(normalizeReadingPreferences({ scale: '900', silent: 'true', vibration: 1 })).toEqual(DEFAULT_READING_PREFERENCES);
  });
  it('notifica cambios y guarda solo opciones, sin texto de comunicación', () => {
    const changed = vi.fn();
    const unsubscribe = subscribeReadingPreferences(changed);
    setReadingPreferences({ ...DEFAULT_READING_PREFERENCES, silent: true, largeTargets: true });
    expect(changed).toHaveBeenCalledTimes(1);
    expect(getReadingPreferences().silent).toBe(true);
    expect(Object.keys(JSON.parse(stored.get(READING_OPTIONS_KEY)!))).toEqual(Object.keys(DEFAULT_READING_PREFERENCES));
    unsubscribe();
    setReadingPreferences(DEFAULT_READING_PREFERENCES);
    expect(changed).toHaveBeenCalledTimes(1);
  });
  it('mantiene los ajustes en sesión si el almacenamiento está bloqueado', () => {
    surface.localStorage.setItem.mockImplementationOnce(() => { throw new Error('Storage disabled'); });
    setReadingPreferences({ ...DEFAULT_READING_PREFERENCES, silent: true });
    expect(getReadingPreferences().silent).toBe(true);
  });
  it('recupera valores seguros cuando el JSON está dañado', () => {
    stored.set(READING_OPTIONS_KEY, '{invalid');
    expect(getReadingPreferences()).toEqual(DEFAULT_READING_PREFERENCES);
  });
  it('solicita vibración solo con consentimiento y tolera su ausencia o rechazo', () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal('navigator', { vibrate });
    expect(requestVibration()).toBe('disabled');
    expect(vibrate).not.toHaveBeenCalled();
    setReadingPreferences({ ...DEFAULT_READING_PREFERENCES, vibration: true });
    expect(requestVibration()).toBe('requested');
    expect(vibrate).toHaveBeenCalledWith(120);
    vibrate.mockReturnValueOnce(false);
    expect(requestVibration('error')).toBe('blocked');
    expect(vibrate).toHaveBeenLastCalledWith([100, 60, 100]);
    vibrate.mockImplementationOnce(() => { throw new Error('Blocked'); });
    expect(requestVibration()).toBe('blocked');
    vi.stubGlobal('navigator', {});
    expect(requestVibration()).toBe('unsupported');
  });
});
