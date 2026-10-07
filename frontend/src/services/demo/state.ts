import { AlertEvent, Appointment, AuditEvent, BloodPressureLog, ClinicalProfile, ClinicalSettings,
  Medication, OperationReceipt, PairingRequest, Patient, PatientLink, PillIntake, StockMovement, User, WeightLog } from '../../types';
import { atLima, localDate, shiftDate } from '../../domain/time';
import { canAddDose, makeDoses } from '../../domain/tracking';

export const DEMO_ORGANIZATION = 'clinic_demo';
export const DEMO_USERS: User[] = [
  { id: 'caregiver_demo', name: 'Cuidador de demostración', email: 'cuidador@contigo.example', role: 'ROLE_CAREGIVER', organizationId: DEMO_ORGANIZATION },
  { id: 'patient_dacio', name: 'Dacio Ramos', email: 'dacio@contigo.example', role: 'ROLE_PATIENT', organizationId: DEMO_ORGANIZATION, patientId: 'pat_001' },
  { id: 'patient_rosa', name: 'Rosa Martínez', email: 'rosa@contigo.example', role: 'ROLE_PATIENT', organizationId: DEMO_ORGANIZATION, patientId: 'pat_002' },
  { id: 'caregiver_unlinked', name: 'Cuidador sin vínculo', email: 'sinvinculo@contigo.example', role: 'ROLE_CAREGIVER', organizationId: DEMO_ORGANIZATION },
];
export interface DemoState {
  schema: 1; lastGeneratedDate?: string; patients: Patient[]; medications: Medication[]; intakes: PillIntake[];
  pressures: BloodPressureLog[]; weights: WeightLog[]; movements: StockMovement[];
  appointments: Appointment[]; profiles: ClinicalProfile[]; settings: ClinicalSettings[];
  links: PatientLink[]; pairing: PairingRequest[]; alerts: AlertEvent[];
  audit: AuditEvent[]; operations: Record<string, OperationReceipt>;
}
export function seedDemo(now = new Date()): DemoState {
  const date = localDate(now), timestamp = now.toISOString();
  const patients: Patient[] = [
    { id: 'pat_001', fullName: 'Dacio Ramos', age: 78, relationship: 'Papá', medicalNotes: 'Ficha de prueba del programa de seguimiento.' },
    { id: 'pat_002', fullName: 'Rosa Martínez', age: 74, relationship: 'Mamá', medicalNotes: 'Paciente sintético para comprobar aislamiento.' },
  ].map(p => ({ ...p, organizationId: DEMO_ORGANIZATION, externalPatientId: `demo-${p.id}`,
    emergencyPhone: '', isOnline: false, lastSyncAt: timestamp, easyModeEnabled: true, voiceGuideEnabled: true }));
  const medications: Medication[] = [
    { id: 'med_001', patientId: 'pat_001', name: 'Losartán', dosage: '50 mg', times: ['08:00', '20:00'], unitsPerDose: 1, stockUnit: 'tabletas', imageUrl: '/images/losartan_pill.jpg', instructions: 'Tomar con agua en ayunas.' },
    { id: 'med_002', patientId: 'pat_001', name: 'Vitamina D3', dosage: '2000 UI', times: ['14:00'], unitsPerDose: 1, stockUnit: 'tabletas', imageUrl: '/images/vitamina_d3.jpg', instructions: 'Tomar con el almuerzo.' },
    { id: 'med_003', patientId: 'pat_002', name: 'Metformina', dosage: '850 mg', times: ['09:00'], unitsPerDose: 1, stockUnit: 'tabletas', imageUrl: '/images/metformina.jpg', instructions: 'Tomar con el desayuno.' },
  ].map(m => ({ ...m, organizationId: DEMO_ORGANIZATION, version: 1, externalPrescriptionId: `rx-${m.id}`,
    formFactor: 'TABLET', frequencyType: 'DAILY', startDate: shiftDate(date, -14), endDate: shiftDate(date, 76),
    durationDays: 90, instructions: m.instructions || 'Tomar según indicación médica.',
    isActive: true, source: 'CLINIC', syncedAt: timestamp }));
  const pressures: BloodPressureLog[] = Array.from({ length: 7 }, (_, i) => ({
    id: `bp_demo_${i}`, patientId: 'pat_001', organizationId: DEMO_ORGANIZATION,
    systolic: [123, 121, 126, 119, 124, 122, 120][i], diastolic: [81, 80, 83, 79, 82, 81, 80][i],
    pulse: 70 + i, recordedAt: atLima(shiftDate(date, -i - 1), '09:00'), receivedAt: timestamp,
    recordedVia: 'CLINICAL_IMPORT', source: 'CLINIC', actorId: 'clinic_provider_demo', status: 'UNCLASSIFIED',
    notes: 'Medición sintética del proveedor de prueba.',
  }));
  return {
    schema: 1, lastGeneratedDate: date, patients, medications, intakes: makeDoses(medications, date), pressures, weights: [],
    movements: medications.slice(0, 2).map((m, i) => ({ id: `supply_${m.id}`, patientId: m.patientId,
      medicationId: m.id, quantity: i === 0 ? 30 : 3, kind: 'INITIAL', unit: m.stockUnit!,
      reason: 'Dispensación clínica simulada', actorId: 'clinic_provider_demo', recordedAt: timestamp })),
    appointments: patients.flatMap((p, i) => [{ id: `appt_${p.id}`, externalId: `external-${p.id}`, patientId: p.id,
      organizationId: DEMO_ORGANIZATION, startsAt: atLima(shiftDate(date, 2 + i), '10:30'),
      specialty: i === 0 ? 'Geriatría' : 'Medicina general', doctor: 'Profesional de demostración',
      location: 'Consultorio de prueba · sede de demostración', status: 'SCHEDULED',
      instructions: 'Consultar las indicaciones proporcionadas por la clínica.', source: 'CLINIC' }]),
    profiles: patients.map((p, i) => ({ patientId: p.id, organizationId: DEMO_ORGANIZATION,
      heightCm: i === 0 ? 168 : 159, weightKg: i === 0 ? 72 : 61, measuredAt: atLima(shiftDate(date, -7), '10:00'),
      source: 'CLINIC', notes: p.medicalNotes || '' })),
    settings: patients.map(p => ({ patientId: p.id, notifyMissedDoseMinutes: 30, voiceVolumeLevel: 50,
      repeatAlarmCount: 1, voiceGuideEnabled: true, easyModeEnabled: true, highContrast: false, largeText: false })),
    links: patients.map(p => ({ patientId: p.id, userId: 'caregiver_demo', active: true, relationship: 'Hijo / Hija' })),
    pairing: [{ pin: '123456', patientId: 'pat_001', expiresAt: new Date(now.getTime() + 600000).toISOString() }],
    alerts: [], audit: [], operations: {},
  };
}
export function ensureDay(state: DemoState, now = new Date()): void {
  // Upgrade old local demo records only when their original prescription still matches.
  for (const dose of state.intakes) {
    if (dose.prescriptionVersion !== undefined) continue;
    const med = state.medications.find(m => m.patientId === dose.patientId && dose.id.startsWith(`${m.id}:${m.version}:`));
    if (med) { dose.prescriptionVersion = med.version; dose.unitsPerDose = med.unitsPerDose; dose.stockUnit = med.stockUnit; }
  }
  const existing = new Set(state.intakes.map(d => d.id));
  const today = localDate(now);
  let date = state.lastGeneratedDate ?? [...state.intakes].map(d => d.scheduledDate).sort().slice(-1)[0] ?? today;
  if (date > today) date = today;
  while (date <= today) {
    for (const dose of makeDoses(state.medications, date)) {
      if (!existing.has(dose.id) && canAddDose(state.intakes, dose)) { state.intakes.push(dose); existing.add(dose.id); }
    }
    date = shiftDate(date, 1);
  }
  state.lastGeneratedDate = today;
}
