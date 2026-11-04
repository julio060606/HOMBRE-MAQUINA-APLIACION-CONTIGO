import { getReadingPreferences } from './accessibilityPreferences';

export function requestVibration(kind: 'success' | 'error' = 'success'): 'disabled' | 'unsupported' | 'requested' | 'blocked' {
  if (!getReadingPreferences().vibration) return 'disabled';
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return 'unsupported';
  try { return navigator.vibrate(kind === 'error' ? [100, 60, 100] : 120) ? 'requested' : 'blocked'; }
  catch { return 'blocked'; }
}
