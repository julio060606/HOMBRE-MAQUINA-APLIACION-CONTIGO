export const READING_OPTIONS_KEY = 'contigo-reading-options';
export const READING_OPTIONS_EVENT = 'contigo-reading-options-change';
export type ReadingPreferences = {
  contrast: boolean;
  scale: string;
  silent: boolean;
  vibration: boolean;
  reducedMotion: boolean;
  largeTargets: boolean;
  pauseUpdates: boolean;
};
export const DEFAULT_READING_PREFERENCES: ReadingPreferences = {
  contrast: false, scale: '100', silent: false, vibration: false, reducedMotion: false, largeTargets: false, pauseUpdates: false,
};

export function normalizeReadingPreferences(value: unknown): ReadingPreferences {
  const stored = value && typeof value === 'object' ? value as Partial<ReadingPreferences> : {};
  return {
    contrast: stored.contrast === true,
    scale: typeof stored.scale === 'string' && ['100', '125', '150', '200'].includes(stored.scale) ? stored.scale : '100',
    silent: stored.silent === true,
    vibration: stored.vibration === true,
    reducedMotion: stored.reducedMotion === true,
    largeTargets: stored.largeTargets === true,
    pauseUpdates: stored.pauseUpdates === true,
  };
}

let sessionPreferences = DEFAULT_READING_PREFERENCES;
let snapshot = DEFAULT_READING_PREFERENCES;
let sessionOnly = false;
export function getReadingPreferences(): ReadingPreferences {
  let next = sessionPreferences;
  try {
    if (typeof window !== 'undefined' && !sessionOnly) next = normalizeReadingPreferences(JSON.parse(window.localStorage.getItem(READING_OPTIONS_KEY) || 'null'));
  } catch { /* Session preferences remain usable when storage is unavailable. */ }
  if (JSON.stringify(next) !== JSON.stringify(snapshot)) snapshot = next;
  return snapshot;
}

export function setReadingPreferences(value: ReadingPreferences) {
  sessionPreferences = normalizeReadingPreferences(value);
  try { window.localStorage.setItem(READING_OPTIONS_KEY, JSON.stringify(sessionPreferences)); sessionOnly = false; } catch { sessionOnly = true; }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(READING_OPTIONS_EVENT));
}

export function subscribeReadingPreferences(onChange: () => void) {
  const storageChanged = (event: StorageEvent) => { if (!event.key || event.key === READING_OPTIONS_KEY) { sessionOnly = false; onChange(); } };
  window.addEventListener(READING_OPTIONS_EVENT, onChange);
  window.addEventListener('storage', storageChanged);
  return () => {
    window.removeEventListener(READING_OPTIONS_EVENT, onChange);
    window.removeEventListener('storage', storageChanged);
  };
}
