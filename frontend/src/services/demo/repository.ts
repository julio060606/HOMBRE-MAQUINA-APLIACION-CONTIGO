import { DemoState, ensureDay, seedDemo } from './state';

type Change = 'data' | 'links';
type Listener = (change: Change) => void;
const listeners = new Set<Listener>();
let channel: BroadcastChannel | undefined;
let connection: Promise<IDBDatabase> | undefined;
let listening = false;
function receive(change: Change = 'data') { listeners.forEach(fn => fn(change)); }
function connectEvents() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('contigo-demo-v1');
    channel.onmessage = event => receive(event.data === 'links' ? 'links' : 'data');
  }
  window.addEventListener('storage', event => { if (event.key === 'contigo-demo-change') receive(event.newValue?.startsWith('links:') ? 'links' : 'data'); });
}
export const syncEvents = {
  subscribe(fn: Listener) { connectEvents(); listeners.add(fn); return () => { listeners.delete(fn); }; },
  emit(change: Change = 'data') {
    connectEvents(); receive(change);
    if (channel) channel.postMessage(change);
    else if (typeof localStorage !== 'undefined') {
      try { localStorage.setItem('contigo-demo-change', `${change}:${crypto.randomUUID()}`); } catch { /* IndexedDB remains the source. */ }
    }
  },
};
function database(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('El navegador no permite usar el almacenamiento de la demostración.'));
  if (!connection) connection = new Promise((resolve, reject) => {
    const request = indexedDB.open('contigo-synthetic-demo', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('datasets');
    request.onerror = () => { connection = undefined; reject(new Error('No se pudo abrir el almacenamiento de demostración.')); };
    request.onblocked = () => { connection = undefined; reject(new Error('Cierre otra pestaña antigua para actualizar la demostración.')); };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => { db.close(); connection = undefined; };
      resolve(db);
    };
  });
  return connection;
}
export interface DemoRepository {
  transact<T>(fn: (state: DemoState) => T, changed?: boolean | 'links'): Promise<T>;
}
export const demoRepository: DemoRepository = {
  async transact<T>(fn: (state: DemoState) => T, changed: boolean | 'links' = false): Promise<T> {
    const db = await database();
    return new Promise<T>((resolve, reject) => {
      // One read/write transaction serializes competing tabs, including intake + stock.
      const tx = db.transaction('datasets', 'readwrite');
      const store = tx.objectStore('datasets');
      const request = store.get('default');
      let output: T, failure: unknown;
      request.onsuccess = () => {
        try {
          const state: DemoState = request.result ?? seedDemo();
          if (state.schema !== 1) throw new Error('Versión de datos demo no compatible.');
          ensureDay(state);
          output = fn(state);
          store.put(state, 'default');
        } catch (error) { failure = error; tx.abort(); }
      };
      tx.oncomplete = () => { resolve(structuredClone(output)); if (changed) syncEvents.emit(changed === 'links' ? 'links' : 'data'); };
      tx.onabort = tx.onerror = () => reject(failure ?? new Error('No se pudo guardar la operación. Intente nuevamente.'));
    });
  },
};
export async function resetDemoData(): Promise<void> {
  await demoRepository.transact(state => { Object.assign(state, seedDemo()); }, 'links');
}
export async function closeDemoDatabase(): Promise<void> {
  if (connection) (await connection).close();
  connection = undefined;
}
