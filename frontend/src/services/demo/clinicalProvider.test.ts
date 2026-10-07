import 'fake-indexeddb/auto';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyClinicalUpdate, ClinicalUpdate } from './clinicalProvider';
import { closeDemoDatabase, demoRepository, resetDemoData } from './repository';
import { createDemoService } from './service';
import { DEMO_USERS } from './state';
const actor = { ...DEMO_USERS[0], id: 'clinic_provider_demo', role: 'ROLE_CLINIC_ADMIN' as const };
const patient = createDemoService(DEMO_USERS[1]);
beforeEach(async () => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-07T15:00:00Z')); await resetDemoData(); });
afterAll(async () => { vi.useRealTimers(); await closeDemoDatabase(); });
const sync = (update: ClinicalUpdate) => demoRepository.transact(state => applyClinicalUpdate(state, actor, update), true);
async function update(): Promise<ClinicalUpdate> {
  const view = await patient.view('pat_001');
  return { patientId: 'pat_001', organizationId: actor.organizationId, medications: [{ ...view.medications[0], version: 2, dosage: 'Indicación sintética actualizada', unitsPerDose: 2 }], appointments: view.appointments, profile: view.profile ?? undefined };
}
describe('origen clínico y cambios de receta', () => {
  it('preserva respuestas e inventario, cancela solo dosis futuras y genera la nueva pauta', async () => {
    const old = (await patient.view('pat_001')).today[0];
    await patient.respond({ patientId: 'pat_001', doseId: old.id, response: 'TAKEN', expectedVersion: 1, operationId: 'take' });
    await sync(await update());
    const view = await patient.view('pat_001');
    expect(view.today.find(d => d.id === old.id)).toMatchObject({ status: 'TAKEN', dosage: '50 mg', unitsPerDose: 1 });
    expect(view.today.filter(d => d.medicationId === 'med_001' && d.status === 'CANCELLED')).toHaveLength(1);
    const next = view.today.find(d => d.prescriptionVersion === 2)!;
    expect(next.scheduledTime).toBe('20:00'); expect(next.unitsPerDose).toBe(2);
    await patient.respond({ patientId: 'pat_001', doseId: next.id, response: 'TAKEN', expectedVersion: 1, operationId: 'new-take' });
    expect((await patient.view('pat_001')).supplies[0].quantity).toBe(27);
    const preserved = (await patient.view('pat_001')).today.find(d => d.id === old.id)!;
    await patient.respond({ patientId: 'pat_001', doseId: old.id, response: 'NOT_TAKEN', expectedVersion: preserved.version, operationId: 'correct-old', correction: true, reason: 'Error de registro' });
    expect((await patient.view('pat_001')).supplies[0].quantity).toBe(28);
  });
  it('no borra dosis pasadas sin confirmar ni recrea horarios previos con nueva versión', async () => {
    await sync(await update());
    const view = await patient.view('pat_001');
    expect(view.today.filter(d => d.medicationId === 'med_001' && d.scheduledTime === '08:00')).toHaveLength(1);
    expect(view.today.find(d => d.scheduledTime === '08:00')?.status).toBe('UNCONFIRMED');
  });
  it('no duplica una dosis futura que ya tenía respuesta', async () => {
    const dose = (await patient.view('pat_001')).today.find(d => d.scheduledTime === '20:00')!;
    await patient.respond({ patientId: 'pat_001', doseId: dose.id, response: 'TAKEN', expectedVersion: 1, operationId: 'future' });
    await sync(await update());
    expect((await patient.view('pat_001')).today.filter(d => d.scheduledTime === '20:00')).toHaveLength(1);
    expect((await patient.view('pat_001')).supplies[0].quantity).toBe(29);
  });
  it('la misma importación es idempotente y una versión antigua no revierte la receta', async () => {
    const incoming = await update(); await sync(incoming); await sync(incoming);
    const before = await patient.view('pat_001');
    await sync({ ...incoming, medications: [{ ...incoming.medications[0], version: 1 }] });
    const after = await patient.view('pat_001');
    expect(after.today).toEqual(before.today); expect(after.medications[0].version).toBe(2);
  });
  it('rechaza cambios sin nueva versión y revierte una importación incoherente', async () => {
    const incoming = await update(); incoming.medications[0].version = 1;
    await expect(sync(incoming)).rejects.toMatchObject({ code: 'CONFLICT' });
    incoming.medications[0].version = 2; incoming.appointments[0].patientId = 'pat_002';
    await expect(sync(incoming)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect((await patient.view('pat_001')).medications[0].version).toBe(1);
  });
  it('rechaza cambios de unidad física y horarios clínicos inválidos', async () => {
    const incoming = await update(); incoming.medications[0].stockUnit = 'ml';
    await expect(sync(incoming)).rejects.toMatchObject({ code: 'CONFLICT' });
    incoming.medications[0].stockUnit = 'tabletas'; incoming.medications[0].times = ['25:00'];
    await expect(sync(incoming)).rejects.toThrow();
  });
  it('el cuidador no importa datos clínicos y la clínica tampoco accede a otro tenant', async () => {
    const incoming = await update();
    await expect(demoRepository.transact(state => applyClinicalUpdate(state, DEMO_USERS[0], incoming), true)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(demoRepository.transact(state => applyClinicalUpdate(state, { ...actor, organizationId: 'other' }, incoming), true)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
  it('actualiza ficha y estado de cita conservando el registro doméstico', async () => {
    await patient.weight('pat_001', 70, 'weight');
    const incoming = await update(); incoming.medications = []; incoming.profile!.weightKg = 69; incoming.appointments[0].status = 'CANCELLED';
    await sync(incoming);
    const view = await patient.view('pat_001');
    expect(view.profile?.weightKg).toBe(69); expect(view.weights[0].weightKg).toBe(70);
    expect(view.appointments[0].status).toBe('CANCELLED');
  });
});
