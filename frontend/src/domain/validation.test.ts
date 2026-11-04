import { describe, expect, it } from 'vitest';
import { movementInput } from './validation';

describe('errores de movimientos asociados al campo', () => {
  it('identifica solo Motivo cuando la cantidad es válida', () => {
    const result = movementInput.safeParse({ kind: 'RESTOCK', quantity: 5, reason: 'x' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.flatten().fieldErrors).toEqual({ reason: ['Escribe un motivo de al menos 3 caracteres.'] });
  });
  it('asocia una reposición de cero a Cantidad y permite un conteo de cero', () => {
    const result = movementInput.safeParse({ kind: 'RESTOCK', quantity: 0, reason: 'Conteo físico' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].path).toEqual(['quantity']);
    expect(movementInput.safeParse({ kind: 'ADJUSTMENT', quantity: 0, reason: 'Conteo físico' }).success).toBe(true);
  });
  it('conserva ambos errores independientes', () => {
    const result = movementInput.safeParse({ kind: 'RESTOCK', quantity: -1, reason: ' ' });
    expect(result.success).toBe(false);
    if (!result.success) expect(Object.keys(result.error.flatten().fieldErrors)).toEqual(['quantity', 'reason']);
  });
});
