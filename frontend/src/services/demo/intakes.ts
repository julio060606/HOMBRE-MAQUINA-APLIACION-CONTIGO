import { ResponseInput } from '../contracts';
import { DemoState } from './state';
import { PillIntake, User } from '../../types';
import { authorize, ServiceError } from './permissions';

export function applyResponse(state: DemoState, actor: User, input: ResponseInput, now = new Date()): PillIntake {
  authorize(state, actor, input.patientId, 'patient');
  if (!input.operationId || !['TAKEN', 'NOT_TAKEN'].includes(input.response)) throw new ServiceError('Respuesta inválida.', 'INVALID');
  if (input.reason && input.reason.trim().length > 300) throw new ServiceError('El motivo no puede exceder 300 caracteres.', 'INVALID');
  const dose = state.intakes.find(d => d.id === input.doseId && d.patientId === input.patientId);
  if (!dose) throw new ServiceError('La dosis no está disponible.', 'NOT_FOUND');
  const key = `${actor.id}:response:${input.operationId}`;
  const fingerprint = JSON.stringify(input);
  const previous = state.operations[key];
  if (previous) {
    if (previous.fingerprint !== fingerprint) throw new ServiceError('La operación ya tiene otra respuesta.', 'CONFLICT');
    return dose;
  }
  if (dose.version !== input.expectedVersion) throw new ServiceError('La dosis cambió. Revise el registro actualizado.', 'CONFLICT');
  if (dose.status === 'CANCELLED') throw new ServiceError('La dosis fue cancelada por la clínica.', 'CONFLICT');
  const responded = dose.status === 'TAKEN' || dose.status === 'NOT_TAKEN';
  if (responded && (!input.correction || !input.reason?.trim())) {
    throw new ServiceError('Esta dosis ya tiene respuesta. Use la corrección con un motivo.', 'CONFLICT');
  }
  const timestamp = now.toISOString();
  const consumed = state.movements.filter(m => m.intakeId === dose.id).reduce((sum, m) => sum + m.quantity, 0);
  const nextConsumption = input.response === 'TAKEN' && dose.unitsPerDose && dose.unitsPerDose > 0 ? -dose.unitsPerDose : 0;
  const delta = nextConsumption - consumed;
  if (delta && dose.stockUnit) state.movements.push({
    id: crypto.randomUUID(), patientId: dose.patientId, medicationId: dose.medicationId,
    quantity: delta, kind: delta < 0 ? 'CONSUMPTION' : 'REVERSAL', unit: dose.stockUnit,
    reason: input.correction ? `Corrección: ${input.reason}` : 'Consumo estimado por toma declarada',
    actorId: actor.id, recordedAt: timestamp, intakeId: dose.id,
  });
  state.audit.push({ id: crypto.randomUUID(), patientId: dose.patientId, actorId: actor.id,
    kind: input.correction ? 'INTAKE_CORRECTED' : 'INTAKE_RECORDED', recordedAt: timestamp,
    detail: `${dose.medicationName}: ${dose.status} → ${input.response}${input.reason ? ` · ${input.reason}` : ''}` });
  dose.status = input.response; dose.respondedAt = timestamp;
  dose.takenAt = input.response === 'TAKEN' ? timestamp : undefined;
  dose.actorId = actor.id; dose.recordedVia = 'MANUAL_PATIENT'; dose.reason = input.reason;
  dose.version += 1;
  state.operations[key] = { fingerprint, resourceId: dose.id };
  return dose;
}
