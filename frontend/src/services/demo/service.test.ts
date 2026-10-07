import 'fake-indexeddb/auto';
import { beforeEach, afterAll, describe, expect, it, vi } from 'vitest';
import { DEMO_USERS } from './state';
import { closeDemoDatabase, demoRepository, resetDemoData } from './repository';
import { createDemoService } from './service';
import { ResponseInput } from '../contracts';
const patient = createDemoService(DEMO_USERS[1]), rosa = createDemoService(DEMO_USERS[2]);
const caregiver = createDemoService(DEMO_USERS[0]), unlinked = createDemoService(DEMO_USERS[3]);
const patientId = 'pat_001';
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-07T15:00:00Z'));
  await resetDemoData();
});
afterAll(async () => { vi.useRealTimers(); await closeDemoDatabase(); });
async function response(overrides: Partial<ResponseInput> = {}): Promise<ResponseInput> {
  const view = await patient.view(patientId), dose = view.today[0];
  return { patientId, doseId: dose.id, expectedVersion: dose.version, response: 'TAKEN', operationId: crypto.randomUUID(), ...overrides };
}
describe('aislamiento de pacientes y permisos', () => {
  it('solo devuelve pacientes propios o con vínculo activo', async () => {
    expect((await patient.patients()).map(p => p.id)).toEqual([patientId]);
    expect(await unlinked.patients()).toEqual([]);
    expect(await caregiver.patients()).toHaveLength(2);
    await expect(patient.view('pat_002')).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(unlinked.view(patientId)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
  it('rechaza acceso por otra clínica aunque coincida el identificador', async () => {
    const otherClinic = createDemoService({ ...DEMO_USERS[1], organizationId: 'other_clinic' });
    await expect(otherClinic.view(patientId)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
  it('el cuidador no responde dosis ni registra lecturas del paciente', async () => {
    await expect(caregiver.respond(await response())).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(caregiver.pressure(patientId, { systolic: 120, diastolic: 80, recordedAt: new Date().toISOString() }, 'bp')).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(patient.moveSupply(patientId, 'med_001', { kind: 'RESTOCK', quantity: 10, reason: 'Compra' }, 'stock')).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
  it('mantiene separados registros, existencias y preferencias', async () => {
    await patient.respond(await response());
    const before = await rosa.view('pat_002');
    await patient.preferences(patientId, { ...(await patient.view(patientId)).settings, largeText: true });
    expect((await rosa.view('pat_002')).settings.largeText).toBe(false);
    expect((await rosa.view('pat_002')).today).toEqual(before.today);
    expect(before.supplies[0].quantity).toBeNull();
  });
});
describe('transacciones de toma e inventario', () => {
  it('persiste la toma y descuenta una sola unidad aunque se reintente', async () => {
    const input = await response(); await patient.respond(input); await patient.respond(input);
    await closeDemoDatabase(); // Reopen the actual IndexedDB repository.
    const view = await caregiver.view(patientId);
    expect(view.today[0]).toMatchObject({ status: 'TAKEN', version: 2, actorId: 'patient_dacio' });
    expect(view.supplies[0].quantity).toBe(29);
    expect(view.movements.filter(m => m.kind === 'CONSUMPTION')).toHaveLength(1);
    expect(view.audit.filter(a => a.kind === 'INTAKE_RECORDED')).toHaveLength(1);
  });
  it('rechaza una clave reutilizada con otros datos', async () => {
    const input = await response(); await patient.respond(input);
    await expect(patient.respond({ ...input, response: 'NOT_TAKEN' })).rejects.toMatchObject({ code: 'CONFLICT' });
    expect((await patient.view(patientId)).supplies[0].quantity).toBe(29);
  });
  it('serializa respuestas concurrentes y evita doble consumo', async () => {
    const first = await response(), second = { ...first, operationId: crypto.randomUUID() };
    const results = await Promise.allSettled([patient.respond(first), patient.respond(second)]);
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(r => r.status === 'rejected')).toHaveLength(1);
    expect((await patient.view(patientId)).supplies[0].quantity).toBe(29);
  });
  it('registra una negativa sin descontar y exige motivo para corregir', async () => {
    await patient.respond(await response({ response: 'NOT_TAKEN' }));
    expect((await patient.view(patientId)).supplies[0].quantity).toBe(30);
    await expect(patient.respond(await response())).rejects.toMatchObject({ code: 'CONFLICT' });
    await patient.respond(await response({ correction: true, reason: 'Error al pulsar el botón' }));
    expect((await patient.view(patientId)).supplies[0].quantity).toBe(29);
  });
  it('revierte el consumo al corregir una toma y deja auditoría', async () => {
    await patient.respond(await response());
    await patient.respond(await response({ response: 'NOT_TAKEN', correction: true, reason: 'Registré otra dosis' }));
    const view = await patient.view(patientId);
    expect(view.supplies[0].quantity).toBe(30);
    expect(view.movements.filter(m => m.kind === 'REVERSAL')).toHaveLength(1);
    expect(view.audit.some(a => a.kind === 'INTAKE_CORRECTED')).toBe(true);
  });
  it('aborta una transacción fallida sin guardar estado parcial', async () => {
    await expect(demoRepository.transact(state => { state.movements[0].quantity = 999; throw new Error('Falla de prueba'); }, true)).rejects.toThrow('Falla de prueba');
    expect((await patient.view(patientId)).supplies[0].quantity).toBe(30);
  });
  it('ajusta correctamente el primer conteo incluso con consumo previo desconocido', async () => {
    const dose = (await rosa.view('pat_002')).today[0];
    await rosa.respond({ patientId: 'pat_002', doseId: dose.id, response: 'TAKEN', operationId: 'r-taken', expectedVersion: 1 });
    expect((await rosa.view('pat_002')).supplies[0].quantity).toBeNull();
    await expect(caregiver.moveSupply('pat_002', 'med_003', { kind: 'RESTOCK', quantity: 5, reason: 'Compra' }, 'r-restock')).rejects.toMatchObject({ code: 'INVALID' });
    await caregiver.moveSupply('pat_002', 'med_003', { kind: 'ADJUSTMENT', quantity: 5, reason: 'Conteo físico' }, 'r-initial');
    expect((await rosa.view('pat_002')).supplies[0].quantity).toBe(5);
  });
  it('reposición idempotente y conteo absoluto no alteran la receta', async () => {
    const before = await patient.view(patientId), input = { kind: 'RESTOCK' as const, quantity: 10, reason: 'Compra de prueba' };
    await caregiver.moveSupply(patientId, 'med_001', input, 'restock'); await caregiver.moveSupply(patientId, 'med_001', input, 'restock');
    expect((await patient.view(patientId)).supplies[0].quantity).toBe(40);
    await caregiver.moveSupply(patientId, 'med_001', { kind: 'ADJUSTMENT', quantity: 0, reason: 'Conteo físico vacío' }, 'empty');
    const after = await patient.view(patientId);
    expect(after.supplies[0]).toMatchObject({ state: 'EMPTY', quantity: 0 });
    expect(after.medications).toEqual(before.medications);
  });
});
describe('mediciones, vinculación e historial', () => {
  it('guarda presión idempotente, sin pulso inventado ni normalidad automática', async () => {
    const input = { systolic: 128, diastolic: 81, recordedAt: new Date().toISOString() };
    const first = await patient.pressure(patientId, input, 'pressure');
    expect(await patient.pressure(patientId, input, 'pressure')).toEqual(first);
    expect(first).toMatchObject({ source: 'HOME', status: 'UNCLASSIFIED' });
    expect(first.pulse).toBeUndefined();
    expect((await caregiver.view(patientId)).pressures).toHaveLength(8);
    await expect(patient.pressure(patientId, { ...input, systolic: 130 }, 'pressure')).rejects.toMatchObject({ code: 'CONFLICT' });
  });
  it('rechaza lecturas incorrectas y conserva el peso clínico al registrar peso doméstico', async () => {
    await expect(patient.pressure(patientId, { systolic: 70, diastolic: 120, recordedAt: new Date().toISOString() }, 'bad')).rejects.toThrow();
    const before = await patient.view(patientId);
    await patient.weight(patientId, 71.5, 'weight'); await patient.weight(patientId, 71.5, 'weight');
    const after = await patient.view(patientId);
    expect(after.profile).toEqual(before.profile); expect(after.weights).toHaveLength(1);
  });
  it('el PIN vincula un paciente existente, caduca y no puede reutilizarse', async () => {
    const code = await patient.generatePin(patientId);
    expect(code.pin).toMatch(/^\d{6}$/);
    await unlinked.pair(code.pin, 'Familiar');
    expect(await unlinked.patients()).toHaveLength(1);
    expect((await caregiver.patients())).toHaveLength(2);
    await expect(unlinked.pair(code.pin, 'Familiar')).rejects.toMatchObject({ code: 'INVALID' });
    const next = await rosa.generatePin('pat_002'); vi.setSystemTime(new Date('2026-10-07T15:11:00Z'));
    await expect(unlinked.pair(next.pin, 'Familiar')).rejects.toMatchObject({ code: 'INVALID' });
  });
  it('un código nuevo invalida el anterior y el cuidador no lo genera', async () => {
    const old = await patient.generatePin(patientId), next = await patient.generatePin(patientId);
    if (old.pin !== next.pin) await expect(unlinked.pair(old.pin, 'Familiar')).rejects.toMatchObject({ code: 'INVALID' });
    await expect(caregiver.generatePin(patientId)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await unlinked.pair(next.pin, 'Familiar');
  });
  it('mantiene respuestas anteriores tras cambiar de día y genera los días intermedios', async () => {
    await patient.respond(await response()); vi.setSystemTime(new Date('2026-10-10T15:00:00Z'));
    const view = await patient.view(patientId);
    expect(view.today).toHaveLength(3); expect(view.history).toHaveLength(12);
    expect(view.history.filter(d => d.status === 'TAKEN')).toHaveLength(1);
    expect(view.supplies[0].quantity).toBe(29);
  });
  it('no registra dos SOS cuando se reintenta la misma operación', async () => {
    await patient.sos(patientId, 'sos'); await patient.sos(patientId, 'sos');
    expect((await caregiver.view(patientId)).alerts.filter(a => a.type === 'PANIC_BUTTON')).toHaveLength(1);
  });
  it('el paciente revoca un vínculo y retira el acceso a consultas y escritura', async () => {
    expect(await patient.caregivers(patientId)).toHaveLength(1);
    await expect(caregiver.revokeLink(patientId, 'caregiver_demo')).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await patient.revokeLink(patientId, 'caregiver_demo');
    expect(await patient.caregivers(patientId)).toHaveLength(0);
    expect((await caregiver.patients()).map(p => p.id)).toEqual(['pat_002']);
    await expect(caregiver.view(patientId)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(caregiver.moveSupply(patientId, 'med_001', { kind: 'RESTOCK', quantity: 3, reason: 'Reposición' }, 'revoked')).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
