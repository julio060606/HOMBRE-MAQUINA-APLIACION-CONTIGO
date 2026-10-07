export type UserRole = 'ROLE_CAREGIVER' | 'ROLE_PATIENT' | 'ROLE_CLINIC_ADMIN' | 'ROLE_SUPER_ADMIN';
export interface User {
  id: string; email: string; name: string; role: UserRole;
  organizationId: string; patientId?: string;
}
export interface Patient {
  id: string; organizationId: string; externalPatientId: string;
  fullName: string; age: number; emergencyPhone: string; medicalNotes?: string;
  relationship: string; isOnline: boolean; lastSyncAt: string;
  easyModeEnabled: boolean; voiceGuideEnabled: boolean;
}
export interface Medication {
  id: string; patientId: string; organizationId: string; externalPrescriptionId: string;
  version: number; name: string; dosage: string;
  formFactor: 'TABLET' | 'CAPSULE' | 'LIQUID' | 'DROPS' | 'INJECTION';
  imageUrl?: string; times: string[];
  frequencyType: 'DAILY' | 'SPECIFIC_DAYS' | 'INTERVAL'; specificDays?: number[];
  durationDays?: number; startDate: string; endDate?: string;
  instructions?: string; isActive: boolean;
  source: 'CLINIC'; syncedAt: string; unitsPerDose?: number; stockUnit?: string; effectiveFrom?: string;
}
export interface Appointment {
  id: string; patientId: string; organizationId: string; externalId: string;
  startsAt: string; specialty: string; doctor: string; location: string;
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED'; instructions: string; source: 'CLINIC';
}
export interface ClinicalProfile {
  patientId: string; organizationId: string; heightCm?: number; weightKg?: number;
  measuredAt: string; source: 'CLINIC'; notes: string;
}
export interface PatientLink { patientId: string; userId: string; active: boolean; relationship: string }
export interface PairingRequest { pin: string; patientId: string; expiresAt: string; claimedBy?: string }
