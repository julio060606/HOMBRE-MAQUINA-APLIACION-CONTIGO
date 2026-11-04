import { useSyncExternalStore } from 'react';
import { DEFAULT_READING_PREFERENCES, getReadingPreferences, subscribeReadingPreferences } from '../services/accessibilityPreferences';

export function useReadingPreferences() {
  return useSyncExternalStore(subscribeReadingPreferences, getReadingPreferences, () => DEFAULT_READING_PREFERENCES);
}
