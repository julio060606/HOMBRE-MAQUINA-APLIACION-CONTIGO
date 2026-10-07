import { z } from 'zod';
import { ContigoService, PatientView } from '../contracts';
import { ClinicalSettings, User } from '../../types';
import { localDate, newestFirst } from '../../domain/time';
import { doseState, supplyFor } from '../../domain/tracking';
import { movementInput, pressureInput, weightInput } from '../../domain/validation';
import { demoRepository, DemoRepository } from './repository';
import { authorize, ServiceError } from './permissions';
import { applyResponse } from './intakes';
import { DEMO_USERS } from './state';

const preferencesSchema = z.object({
  notifyMissedDoseMinutes: z.number().int().min(5).max(180), voiceVolumeLevel: z.number().min(0).max(100),
  repeatAlarmCount: z.number().int().min(1).max(5), voiceGuideEnabled: z.boolean(), easyModeEnabled: z.boolean(),
  highContrast: z.boolean(), largeText: z.boolean(),
});
export function createDemoService(actor: User, repository: DemoRepository = demoRepository): ContigoService {
  const transaction = repository.transact.bind(repository);
  return {
    patients: () => transaction(state => state.patients.filter(p => {
      try { authorize(state, actor, p.id); return true; } catch { return false; }
    })),
    view: patientId => transaction(state => {
      const patient = authorize(state, actor, patientId);
      const scope = <T extends { patientId: string }>(values: T[]) => values.filter(v => v.patientId === patientId);
      const settings = state.settings.find(s => s.patientId === patientId)!;
      const history = scope(state.intakes).map(d => doseState(d, Date.now(), settings.notifyMissedDoseMinutes));
      const today = history.filter(d => d.scheduledDate === localDate()).sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
      const medications = scope(state.medications), movements = scope(state.movements);
      const pendingAlerts = today.filter(d => d.status === 'UNCONFIRMED').map(d => ({
        id: `unconfirmed:${d.id}`, patientId, patientName: patient.fullName, type: 'MISSED_MEDICATION' as const,
        title: `Sin confirmar: ${d.medicationName}`, description: `Dosis de ${d.scheduledTime}. No indica que el paciente afirmó no tomarla.`,
        timestamp: d.scheduledAt, severity: 'WARNING' as const, isResolved: false,
      }));
      const view: PatientView = { patient, medications, today, history, movements,
        pressures: newestFirst(scope(state.pressures)), weights: newestFirst(scope(state.weights)),
        supplies: medications.map(m => supplyFor(m, movements)),
        appointments: scope(state.appointments).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
        profile: state.profiles.find(p => p.patientId === patientId) ?? null, settings,
        alerts: [...scope(state.alerts), ...pendingAlerts].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
        audit: scope(state.audit).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)).slice(0, 30),
      };
      return view;
    }),
    respond: input => transaction(state => applyResponse(state, actor, input), true),
    pressure: (patientId, input, operationId) => transaction(state => {
      authorize(state, actor, patientId, 'patient');
      const value = pressureInput.parse(input);
      const key = `${actor.id}:pressure:${operationId}`, fingerprint = JSON.stringify({ patientId, ...value });
      if (state.operations[key]) {
        if (state.operations[key].fingerprint !== fingerprint) throw new ServiceError('Operación repetida con otros datos.', 'CONFLICT');
        return state.pressures.find(v => v.id === state.operations[key].resourceId)!;
      }
      const record = { ...value, id: crypto.randomUUID(), patientId, organizationId: actor.organizationId,
        actorId: actor.id, receivedAt: new Date().toISOString(), recordedVia: 'MANUAL_PATIENT' as const,
        source: 'HOME' as const, status: 'UNCLASSIFIED' as const };
      state.pressures.push(record);
      state.operations[key] = { fingerprint, resourceId: record.id };
      state.audit.push({ id: crypto.randomUUID(), patientId, actorId: actor.id, kind: 'MEASUREMENT_RECORDED',
        recordedAt: record.receivedAt, detail: `Presión ${value.systolic}/${value.diastolic} mmHg · registro doméstico` });
      return record;
    }, true),
    weight: (patientId, weightKg, operationId) => transaction(state => {
      authorize(state, actor, patientId, 'patient');
      const key = `${actor.id}:weight:${operationId}`, fingerprint = JSON.stringify({ patientId, weightKg });
      if (state.operations[key]) {
        if (state.operations[key].fingerprint !== fingerprint) throw new ServiceError('Operación repetida con otros datos.', 'CONFLICT');
        return state.weights.find(v => v.id === state.operations[key].resourceId)!;
      }
      const value = weightInput.parse({ weightKg, recordedAt: new Date().toISOString() });
      const record = { ...value, id: crypto.randomUUID(), patientId, organizationId: actor.organizationId, actorId: actor.id, source: 'HOME' as const };
      state.weights.push(record); state.operations[key] = { fingerprint, resourceId: record.id };
      state.audit.push({ id: crypto.randomUUID(), patientId, actorId: actor.id, kind: 'MEASUREMENT_RECORDED',
        recordedAt: record.recordedAt, detail: `Peso doméstico ${weightKg} kg` });
      return record;
    }, true),
    moveSupply: (patientId, medicationId, input, operationId) => transaction(state => {
      authorize(state, actor, patientId, 'caregiver');
      const value = movementInput.parse(input), key = `${actor.id}:stock:${operationId}`;
      const fingerprint = JSON.stringify({ patientId, medicationId, ...value });
      if (state.operations[key]) {
        if (state.operations[key].fingerprint !== fingerprint) throw new ServiceError('Reposición repetida con otros datos.', 'CONFLICT');
        return;
      }
      const med = state.medications.find(m => m.id === medicationId && m.patientId === patientId);
      if (!med?.stockUnit) throw new ServiceError('No existe una unidad física de inventario definida.', 'INVALID');
      const current = supplyFor(med, state.movements);
      if (current.quantity === null && value.kind === 'RESTOCK') throw new ServiceError('Primero registre el conteo físico disponible.', 'INVALID');
      const quantity = value.kind === 'ADJUSTMENT' ? value.quantity - state.movements.filter(m => m.medicationId === medicationId && m.patientId === patientId).reduce((sum, m) => sum + m.quantity, 0) : value.quantity;
      const id = crypto.randomUUID();
      state.movements.push({ id, patientId, medicationId, quantity, unit: med.stockUnit,
        kind: current.quantity === null ? 'INITIAL' : value.kind, reason: value.reason,
        actorId: actor.id, recordedAt: new Date().toISOString() });
      state.operations[key] = { fingerprint, resourceId: id };
      state.audit.push({ id: crypto.randomUUID(), patientId, actorId: actor.id, kind: 'SUPPLY_UPDATED',
        recordedAt: new Date().toISOString(), detail: `${med.name}: ${value.kind === 'RESTOCK' ? 'Reposición' : 'Conteo físico'} ${value.quantity} ${med.stockUnit} · ${value.reason}` });
    }, true),
    preferences: (patientId, value: ClinicalSettings) => transaction(state => {
      authorize(state, actor, patientId);
      const parsed = preferencesSchema.parse(value);
      const index = state.settings.findIndex(s => s.patientId === patientId);
      if (index < 0) throw new ServiceError('No hay preferencias para este paciente.', 'NOT_FOUND');
      state.settings[index] = { patientId, ...parsed };
    }, true),
    sos: (patientId, operationId) => transaction(state => {
      const patient = authorize(state, actor, patientId, 'patient');
      const key = `${actor.id}:sos:${operationId}`;
      if (state.operations[key]) {
        if (state.operations[key].fingerprint !== patientId) throw new ServiceError('Operación repetida con otros datos.', 'CONFLICT');
        return state.alerts.find(a => a.id === state.operations[key].resourceId)!;
      }
      const alert = { id: crypto.randomUUID(), patientId, patientName: patient.fullName, type: 'PANIC_BUTTON' as const,
        title: 'Petición de ayuda de demostración', description: 'Registrada en el panel de prueba. No contacta servicios de emergencia ni envía ubicación.',
        timestamp: new Date().toISOString(), severity: 'CRITICAL' as const, isResolved: false };
      state.alerts.push(alert); state.operations[key] = { fingerprint: patientId, resourceId: alert.id };
      state.audit.push({ id: crypto.randomUUID(), patientId, actorId: actor.id, kind: 'DEMO_HELP_REQUESTED',
        recordedAt: alert.timestamp, detail: 'Solicitud local de ayuda de demostración' });
      return alert;
    }, true),
    pair: (pin, relationship) => transaction(state => {
      if (actor.role !== 'ROLE_CAREGIVER') throw new ServiceError('Solo el cuidador puede reclamar una vinculación.', 'FORBIDDEN');
      if (!/^\d{6}$/.test(pin) || !relationship.trim()) throw new ServiceError('Ingrese PIN y parentesco válidos.', 'INVALID');
      const request = state.pairing.find(p => p.pin === pin && !p.claimedBy && Date.parse(p.expiresAt) > Date.now());
      const patient = state.patients.find(p => p.id === request?.patientId && p.organizationId === actor.organizationId);
      if (!request || !patient) throw new ServiceError('Código inválido, utilizado o expirado.', 'INVALID');
      request.claimedBy = actor.id;
      const link = state.links.find(l => l.patientId === patient.id && l.userId === actor.id);
      if (link) { link.active = true; link.relationship = relationship; }
      else state.links.push({ patientId: patient.id, userId: actor.id, active: true, relationship });
      state.audit.push({ id: crypto.randomUUID(), patientId: patient.id, actorId: actor.id, kind: 'CAREGIVER_LINKED',
        recordedAt: new Date().toISOString(), detail: `Vínculo de demostración: ${relationship}` });
      return patient;
    }, 'links'),
    generatePin: patientId => transaction(state => {
      authorize(state, actor, patientId, 'patient');
      // Generating a new code revokes earlier unused codes for this patient.
      state.pairing = state.pairing.filter(p => p.patientId !== patientId || p.claimedBy);
      let pin: string;
      do { pin = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0'); }
      while (state.pairing.some(p => p.pin === pin && !p.claimedBy));
      const request = { pin, patientId, expiresAt: new Date(Date.now() + 600000).toISOString() };
      state.pairing.push(request);
      return { pin, expiresAt: request.expiresAt };
    }, true),
    caregivers: patientId => transaction(state => {
      authorize(state, actor, patientId, 'patient');
      return state.links.filter(l => l.patientId === patientId && l.active).map(l => ({
        userId: l.userId, name: DEMO_USERS.find(u => u.id === l.userId)?.name ?? 'Cuidador de prueba', relationship: l.relationship,
      }));
    }),
    revokeLink: (patientId, caregiverId) => transaction(state => {
      authorize(state, actor, patientId, 'patient');
      const link = state.links.find(l => l.patientId === patientId && l.userId === caregiverId);
      if (!link) throw new ServiceError('Vínculo no encontrado.', 'NOT_FOUND');
      if (!link.active) return;
      link.active = false;
      state.audit.push({ id: crypto.randomUUID(), patientId, actorId: actor.id, kind: 'LINK_REVOKED',
        recordedAt: new Date().toISOString(), detail: `Acceso retirado al cuidador demo ${caregiverId}` });
    }, 'links'),
  };
}
