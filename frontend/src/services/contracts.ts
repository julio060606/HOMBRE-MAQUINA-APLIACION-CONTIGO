import { AlertEvent, Appointment, AuditEvent, BloodPressureLog, ClinicalProfile, ClinicalSettings,
  Medication, Patient, PillIntake, StockMovement, Supply, WeightLog } from '../types';
export interface PatientView {
  patient: Patient; medications: Medication[]; today: PillIntake[]; history: PillIntake[];
  pressures: BloodPressureLog[]; weights: WeightLog[]; supplies: Supply[];
  movements: StockMovement[]; appointments: Appointment[]; profile: ClinicalProfile | null;
  settings: ClinicalSettings; alerts: AlertEvent[]; audit: AuditEvent[];
}
export interface ResponseInput {
  patientId: string; doseId: string; response: 'TAKEN' | 'NOT_TAKEN';
  operationId: string; expectedVersion: number; reason?: string; correction?: boolean;
}
export interface PressureInput { systolic: number; diastolic: number; pulse?: number; recordedAt: string; notes?: string }
export interface SupplyInput { kind: 'RESTOCK' | 'ADJUSTMENT'; quantity: number; reason: string }
export interface ContigoService {
  patients(): Promise<Patient[]>;
  view(patientId: string): Promise<PatientView>;
  respond(input: ResponseInput): Promise<PillIntake>;
  pressure(patientId: string, input: PressureInput, operationId: string): Promise<BloodPressureLog>;
  weight(patientId: string, weightKg: number, operationId: string): Promise<WeightLog>;
  moveSupply(patientId: string, medicationId: string, input: SupplyInput, operationId: string): Promise<void>;
  preferences(patientId: string, value: ClinicalSettings): Promise<void>;
  sos(patientId: string, operationId: string): Promise<AlertEvent>;
  pair(pin: string, relationship: string): Promise<Patient>;
  generatePin(patientId: string): Promise<{ pin: string; expiresAt: string }>;
  caregivers(patientId: string): Promise<{ userId: string; name: string; relationship: string }[]>;
  revokeLink(patientId: string, caregiverId: string): Promise<void>;
}
