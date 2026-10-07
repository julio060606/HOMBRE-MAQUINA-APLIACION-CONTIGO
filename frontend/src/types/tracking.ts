export type DoseStatus = 'TAKEN' | 'NOT_TAKEN' | 'PENDING' | 'UNCONFIRMED' | 'CANCELLED';
export type InputChannel = 'MANUAL_PATIENT' | 'VOICE_PATIENT';
export interface PillIntake {
  id: string; patientId: string; organizationId: string; medicationId: string;
  medicationName: string; dosage: string; imageUrl?: string;
  scheduledTime: string; scheduledDate: string; scheduledAt: string;
  takenAt?: string; respondedAt?: string; status: DoseStatus; instructions?: string;
  version: number; prescriptionVersion?: number; unitsPerDose?: number; stockUnit?: string;
  actorId?: string; recordedVia?: InputChannel; reason?: string;
}
export interface BloodPressureLog {
  id: string; patientId: string; organizationId: string; systolic: number; diastolic: number;
  pulse?: number | null; recordedAt: string; receivedAt: string; actorId: string;
  recordedVia: InputChannel | 'CLINICAL_IMPORT'; source: 'HOME' | 'CLINIC';
  status: 'UNCLASSIFIED'; notes?: string;
}
export interface WeightLog {
  id: string; patientId: string; organizationId: string; weightKg: number;
  recordedAt: string; actorId: string; source: 'HOME';
}
export interface StockMovement {
  id: string; patientId: string; medicationId: string; quantity: number;
  kind: 'INITIAL' | 'RESTOCK' | 'ADJUSTMENT' | 'CONSUMPTION' | 'REVERSAL';
  unit: string; reason: string; actorId: string; recordedAt: string; intakeId?: string;
}
export interface Supply {
  medicationId: string; patientId: string; unit: string;
  quantity: number | null; daysRemaining: number | null;
  state: 'UNKNOWN' | 'AVAILABLE' | 'LOW' | 'EMPTY' | 'DISCREPANCY';
}
export interface AlertEvent {
  id: string; patientId: string; patientName: string;
  type: 'MISSED_MEDICATION' | 'PANIC_BUTTON'; title: string; description: string;
  timestamp: string; severity: 'WARNING' | 'CRITICAL' | 'INFO'; isResolved: boolean;
}
export interface ClinicalSettings {
  patientId: string; notifyMissedDoseMinutes: number; voiceVolumeLevel: number;
  repeatAlarmCount: number; voiceGuideEnabled: boolean; easyModeEnabled: boolean;
  highContrast: boolean; largeText: boolean;
}
export interface AuditEvent {
  id: string; patientId: string; actorId: string; kind: string;
  recordedAt: string; detail: string;
}
export interface OperationReceipt { fingerprint: string; resourceId: string }
