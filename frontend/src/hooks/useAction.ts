import { useRef, useState } from 'react';
import { ZodError } from 'zod';
export function errorMessage(error: unknown): string {
  if (error instanceof ZodError) return error.issues.find(i => i.code === 'custom')?.message || 'Revise los campos: ingrese números válidos, la unidad y un motivo cuando corresponda.';
  return error instanceof Error ? error.message : 'No se pudo completar la operación.';
}
export function useAction() {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false), operation = useRef<{ fingerprint: string; id: string }>();
  async function run(fingerprint: string, execute: (id: string) => Promise<unknown>): Promise<boolean> {
    if (lock.current) return false;
    lock.current = true; setBusy(true); setError('');
    if (operation.current?.fingerprint !== fingerprint) operation.current = { fingerprint, id: crypto.randomUUID() };
    try { await execute(operation.current!.id); operation.current = undefined; return true; }
    catch (e) { setError(errorMessage(e)); return false; }
    finally { lock.current = false; setBusy(false); }
  }
  return { run, busy, error };
}
