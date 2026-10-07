import { Patient, User } from '../../types';
import { DemoState } from './state';
export class ServiceError extends Error {
  constructor(message: string, public code: 'FORBIDDEN' | 'CONFLICT' | 'INVALID' | 'NOT_FOUND') { super(message); }
}
export function authorize(state: DemoState, actor: User, patientId: string, write: 'read' | 'patient' | 'caregiver' = 'read'): Patient {
  const patient = state.patients.find(p => p.id === patientId && p.organizationId === actor.organizationId);
  const own = actor.role === 'ROLE_PATIENT' && actor.patientId === patientId;
  const linked = actor.role === 'ROLE_CAREGIVER' && state.links.some(l => l.patientId === patientId && l.userId === actor.id && l.active);
  if (!patient || !(own || linked) || (write === 'patient' && !own) || (write === 'caregiver' && !linked)) {
    throw new ServiceError('No tiene permiso para esta información o acción.', 'FORBIDDEN');
  }
  return patient;
}
