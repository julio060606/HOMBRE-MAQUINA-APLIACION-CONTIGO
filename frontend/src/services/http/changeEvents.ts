type ApiChange = 'data' | 'links';
const listeners = new Set<(change: ApiChange) => void>();
/** In-process cache invalidation after a successful API mutation, without storing clinical data locally. */
export function emitApiChange(change: ApiChange): void { listeners.forEach(listener => listener(change)); }
export function subscribeApiChanges(listener: (change: ApiChange) => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
