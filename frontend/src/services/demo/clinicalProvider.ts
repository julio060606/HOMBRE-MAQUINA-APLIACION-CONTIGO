import { z } from 'zod';
import { Appointment, ClinicalProfile, Medication, User } from '../../types';
import { canAddDose, makeDoses } from '../../domain/tracking';
import { localDate } from '../../domain/time';
import { DemoState, DEMO_ORGANIZATION } from './state';
import { demoRepository } from './repository';
import { ServiceError } from './permissions';
import { ENV } from '../../config/env';

export interface ClinicalUpdate {
  patientId: string; organizationId: string; medications: Medication[];
  appointments: Appointment[]; profile?: ClinicalProfile;
}
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
  const parsed = new Date(`${v}T12:00:00Z`); return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(v);
}, 'Fecha clínica inválida.');
const timestamp = z.string().datetime({ offset: true });
const scope = { patientId: z.string().min(1), organizationId: z.string().min(1), source: z.literal('CLINIC') };
const medicationSchema = z.object({
  ...scope, id: z.string().min(1), externalPrescriptionId: z.string().min(1), version: z.number().int().positive(),
  name: z.string().trim().min(1).max(200), dosage: z.string().trim().min(1).max(200),
  formFactor: z.enum(['TABLET','CAPSULE','LIQUID','DROPS','INJECTION']),
  imageUrl: z.string().trim().refine(v => !v || v.startsWith('/') || /^https?:\/\//.test(v), 'URL de imagen clínica inválida.').optional(),
  times: z.array(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)).min(1).max(24),
  frequencyType: z.enum(['DAILY','SPECIFIC_DAYS','INTERVAL']), specificDays: z.array(z.number().int().min(1).max(7)).optional(),
  durationDays: z.number().int().positive().optional(), startDate: date, endDate: date.optional(),
  instructions: z.string().max(1000).optional(), isActive: z.boolean(), syncedAt: timestamp,
  unitsPerDose: z.number().finite().positive().optional(), stockUnit: z.string().trim().min(1).optional(),
  effectiveFrom: timestamp.optional(),
}).superRefine((m, ctx) => {
  if (new Set(m.times).size !== m.times.length) ctx.addIssue({ code: 'custom', message: 'Hay horarios duplicados.' });
  if (m.endDate && m.endDate < m.startDate) ctx.addIssue({ code: 'custom', message: 'Vigencia clínica incoherente.' });
  if (m.frequencyType === 'INTERVAL') ctx.addIssue({ code: 'custom', message: 'La pauta por intervalo requiere un anclaje clínico; este adaptador demo no la soporta.' });
  if (m.frequencyType === 'SPECIFIC_DAYS' && !m.specificDays?.length) ctx.addIssue({ code: 'custom', message: 'Faltan los días indicados por la clínica.' });
  if (m.unitsPerDose && !m.stockUnit) ctx.addIssue({ code: 'custom', message: 'Falta la unidad de inventario.' });
});
const appointmentSchema = z.object({ ...scope, id: z.string().min(1), externalId: z.string().min(1), startsAt: timestamp,
  specialty: z.string().min(1), doctor: z.string().min(1), location: z.string().min(1),
  status: z.enum(['SCHEDULED','CANCELLED','COMPLETED']), instructions: z.string().max(1000) });
const profileSchema = z.object({ ...scope, heightCm: z.number().finite().positive().max(300).optional(),
  weightKg: z.number().finite().positive().max(1000).optional(), measuredAt: timestamp, notes: z.string().max(3000) });
const updateSchema = z.object({ patientId: z.string().min(1), organizationId: z.string().min(1),
  medications: z.array(medicationSchema), appointments: z.array(appointmentSchema), profile: profileSchema.optional() });
const prescriptionContent = (m: Medication) => JSON.stringify([m.name, m.dosage, m.formFactor, m.imageUrl, m.times,
  m.frequencyType, m.specificDays, m.startDate, m.endDate, m.instructions, m.isActive, m.unitsPerDose, m.stockUnit]);

/** Domain of the synthetic provider. No direct connection to a clinic database exists here. */
export function applyClinicalUpdate(state: DemoState, actor: User, input: ClinicalUpdate, now = new Date()) {
  if (actor.role !== 'ROLE_CLINIC_ADMIN' || actor.organizationId !== input.organizationId) throw new ServiceError('Proveedor clínico no autorizado.', 'FORBIDDEN');
  const update = updateSchema.parse(input);
  if (!state.patients.some(p => p.id === update.patientId && p.organizationId === actor.organizationId)) throw new ServiceError('El paciente no pertenece a esta clínica.', 'FORBIDDEN');
  const records = [...update.medications, ...update.appointments, ...(update.profile ? [update.profile] : [])];
  if (records.some(r => r.patientId !== update.patientId || r.organizationId !== update.organizationId)) throw new ServiceError('La actualización contiene datos de otro paciente o clínica.', 'FORBIDDEN');
  if (new Set(update.medications.map(m => m.externalPrescriptionId)).size !== update.medications.length || new Set(update.medications.map(m => m.id)).size !== update.medications.length) throw new ServiceError('Recetas duplicadas en la actualización.', 'INVALID');
  let changed = 0;
  for (const incoming of update.medications) {
    const found = state.medications.find(m => m.externalPrescriptionId === incoming.externalPrescriptionId && m.organizationId === incoming.organizationId);
    if (state.medications.some(m => m.id === incoming.id && m !== found) || (found && (found.patientId !== update.patientId || found.id !== incoming.id))) throw new ServiceError('Identificadores clínicos incompatibles.', 'CONFLICT');
    if (found && incoming.version < found.version) continue;
    if (found && incoming.version === found.version) {
      if (prescriptionContent(found) !== prescriptionContent(incoming)) throw new ServiceError('Un cambio de receta requiere una nueva versión de origen.', 'CONFLICT');
      found.syncedAt = now.toISOString(); continue;
    }
    if (found && found.stockUnit !== incoming.stockUnit) throw new ServiceError('Un cambio de unidad física requiere otra receta e inventario.', 'CONFLICT');
    const medication: Medication = { ...incoming, effectiveFrom: now.toISOString(), syncedAt: now.toISOString() };
    if (found) {
      for (const dose of state.intakes.filter(d => d.medicationId === found.id && d.patientId === found.patientId)) {
        if (Date.parse(dose.scheduledAt) >= now.getTime() && ['PENDING','UNCONFIRMED'].includes(dose.status)) {
          dose.status = 'CANCELLED'; dose.version += 1;
        }
      }
      state.medications[state.medications.indexOf(found)] = medication;
    } else state.medications.push(medication);
    state.intakes.push(...makeDoses([medication], localDate(now)).filter(d => canAddDose(state.intakes, d)));
    changed += 1;
  }
  for (const appointment of update.appointments) {
    const found = state.appointments.find(a => a.externalId === appointment.externalId && a.organizationId === appointment.organizationId);
    if (state.appointments.some(a => a.id === appointment.id && a !== found) || (found && (found.patientId !== update.patientId || found.id !== appointment.id))) throw new ServiceError('Identificador de cita incompatible.', 'CONFLICT');
    if (found) state.appointments[state.appointments.indexOf(found)] = appointment;
    else state.appointments.push(appointment);
  }
  if (update.profile) {
    const index = state.profiles.findIndex(p => p.patientId === update.patientId);
    if (index < 0) state.profiles.push(update.profile); else state.profiles[index] = update.profile;
  }
  state.patients.find(p => p.id === update.patientId)!.lastSyncAt = now.toISOString();
  state.audit.push({ id: crypto.randomUUID(), patientId: update.patientId, actorId: actor.id, kind: 'CLINICAL_SYNC',
    recordedAt: now.toISOString(), detail: `Proveedor sintético: ${changed} recetas actualizadas, ${update.appointments.length} citas recibidas.` });
  return { changed };
}
const provider: User = { id: 'clinic_provider_demo', name: 'Proveedor sintético', email: 'proveedor@contigo.example', role: 'ROLE_CLINIC_ADMIN', organizationId: DEMO_ORGANIZATION };
export async function simulateClinicalRefresh(patientId: string) {
  if (!ENV.USE_MOCKS) throw new ServiceError('El proveedor sintético solo está disponible en modo demo.', 'FORBIDDEN');
  return demoRepository.transact(state => {
    const patient = state.patients.find(p => p.id === patientId);
    if (!patient) throw new ServiceError('Paciente demo no disponible.', 'NOT_FOUND');
    const medication = state.medications.find(m => m.patientId === patientId);
    const profile = state.profiles.find(p => p.patientId === patientId);
    return applyClinicalUpdate(state, provider, { patientId, organizationId: provider.organizationId,
      medications: medication ? [{ ...medication, version: medication.version + 1, instructions: `Actualización sintética de la clínica, versión ${medication.version + 1}. Solo para probar sincronización.` }] : [],
      appointments: state.appointments.filter(a => a.patientId === patientId), profile });
  }, true);
}
