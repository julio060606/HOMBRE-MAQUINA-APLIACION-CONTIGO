import { describe, it, expect } from 'vitest';
import { seedDemo, ensureDay } from '../services/demo/state';
import { adherence, doseState, makeDoses, supplyFor } from './tracking';
import { atLima, localDate, shiftDate } from './time';
import { pressureInput } from './validation';
const now = new Date('2026-10-07T15:00:00Z');
describe('calendario y adherencia', () => {
  it('usa la fecha de Lima en el límite del día UTC', () => {
    expect(localDate('2026-10-08T04:59:59Z')).toBe('2026-10-07');
    expect(localDate('2026-10-08T05:00:00Z')).toBe('2026-10-08');
    expect(atLima('2026-10-07', '20:00')).toBe('2026-10-08T01:00:00.000Z');
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('no confunde falta de confirmación con una negativa del paciente', () => {
    const dose = seedDemo(now).intakes[0];
    expect(doseState(dose, now.getTime()).status).toBe('UNCONFIRMED');
    expect(dose.status).toBe('PENDING');
    expect(doseState({ ...dose, status: 'NOT_TAKEN' }, now.getTime()).status).toBe('NOT_TAKEN');
  });
  it('excluye dosis futuras y canceladas de la adherencia evaluable', () => {
    const doses = seedDemo(now).intakes.filter(d => d.patientId === 'pat_001');
    doses[0].status = 'TAKEN';
    expect(adherence(doses, now.getTime())).toEqual({ total: 3, taken: 1, due: 1, duePercent: 100, dayPercent: 33 });
    doses[0].status = 'CANCELLED';
    expect(adherence(doses, now.getTime()).duePercent).toBeNull();
    expect(adherence([], now.getTime()).dayPercent).toBeNull();
  });
  it('respeta vigencia, días específicos y no inventa horarios de intervalos', () => {
    const med = seedDemo(now).medications[0];
    expect(makeDoses([{ ...med, frequencyType: 'SPECIFIC_DAYS', specificDays: [3] }], '2026-10-07')).toHaveLength(2);
    expect(makeDoses([{ ...med, frequencyType: 'SPECIFIC_DAYS', specificDays: [1] }], '2026-10-07')).toHaveLength(0);
    expect(makeDoses([{ ...med, frequencyType: 'INTERVAL' }], '2026-10-07')).toHaveLength(0);
    expect(makeDoses([{ ...med, endDate: '2026-10-06' }], '2026-10-07')).toHaveLength(0);
  });
  it('conserva el historial y genera los días intermedios una sola vez', () => {
    const state = seedDemo(now); state.intakes[0].status = 'TAKEN';
    ensureDay(state, new Date('2026-10-10T15:00:00Z')); ensureDay(state, new Date('2026-10-10T15:00:00Z'));
    expect(state.intakes).toHaveLength(16);
    expect(new Set(state.intakes.map(d => d.id)).size).toBe(16);
    expect(state.intakes[0].status).toBe('TAKEN');
  });
});
describe('existencias y validación de mediciones', () => {
  it('distingue desconocido, pocas unidades, agotado y discrepancia', () => {
    const state = seedDemo(now), med = state.medications[0], initial = state.movements[0];
    expect(supplyFor(med, []).state).toBe('UNKNOWN');
    expect(supplyFor(med, [initial]).daysRemaining).toBe(15);
    expect(supplyFor(med, [{ ...initial, quantity: 3 }]).state).toBe('LOW');
    expect(supplyFor(med, [{ ...initial, quantity: 0 }]).state).toBe('EMPTY');
    expect(supplyFor(med, [{ ...initial, quantity: -1 }])).toMatchObject({ state: 'DISCREPANCY', quantity: -1, daysRemaining: null });
  });
  it('no calcula días sin una conversión física y frecuencia diaria conocidas', () => {
    const state = seedDemo(now);
    expect(supplyFor({ ...state.medications[0], unitsPerDose: undefined }, state.movements).daysRemaining).toBeNull();
    expect(supplyFor({ ...state.medications[0], frequencyType: 'INTERVAL' }, state.movements).daysRemaining).toBeNull();
  });
  it('rechaza lecturas vacías o incoherentes sin asignar un diagnóstico', () => {
    const recordedAt = new Date().toISOString();
    expect(pressureInput.safeParse({ systolic: NaN, diastolic: 80, recordedAt }).success).toBe(false);
    expect(pressureInput.safeParse({ systolic: 80, diastolic: 120, recordedAt }).success).toBe(false);
    expect(pressureInput.safeParse({ systolic: 120, diastolic: 80, pulse: undefined, recordedAt }).success).toBe(true);
  });
});
