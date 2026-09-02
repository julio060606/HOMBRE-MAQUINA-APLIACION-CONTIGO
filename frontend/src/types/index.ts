export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ROLE_CAREGIVER' | 'ROLE_CLINIC_ADMIN' | 'ROLE_SUPER_ADMIN';
  organizationId?: string;
}

export interface Patient {
  id: string;
  fullName: string;
  age: number;
  emergencyPhone: string;
  medicalNotes?: string;
  relationship: string;
  isOnline: boolean;
  lastSyncAt: string;
  easyModeEnabled: boolean;
  voiceGuideEnabled: boolean;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  formFactor: 'TABLET' | 'CAPSULE' | 'LIQUID' | 'DROPS' | 'INJECTION';
  imageUrl?: string;
  times: string[];
  frequencyType: 'DAILY' | 'SPECIFIC_DAYS' | 'INTERVAL';
  specificDays?: number[]; // 1 = Lunes, 7 = Domingo
  durationDays?: number;
  startDate: string;
  endDate?: string;
  instructions?: string;
  isActive: boolean;
}

export interface PillIntake {
  id: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  imageUrl?: string;
  scheduledTime: string;
  scheduledDate: string;
  takenAt?: string;
  status: 'TAKEN' | 'PENDING' | 'MISSED' | 'POSTPONED';
  instructions?: string;
}

export interface BloodPressureLog {
  id: string;
  patientId: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  recordedAt: string;
  recordedVia: 'MANUAL_PATIENT' | 'VOICE_PATIENT' | 'CAREGIVER_WEB';
  status: 'NORMAL' | 'HIGH' | 'CRITICAL';
  notes?: string;
}

export interface AlertEvent {
  id: string;
  patientId: string;
  patientName: string;
  type: 'MISSED_MEDICATION' | 'CRITICAL_VITALS' | 'PANIC_BUTTON';
  title: string;
  description: string;
  timestamp: string;
  severity: 'WARNING' | 'CRITICAL' | 'INFO';
  isResolved: boolean;
}

export interface ClinicalSettings {
  patientId: string;
  systolicMaxNormal: number;
  systolicMinNormal: number;
  diastolicMaxNormal: number;
  diastolicMinNormal: number;
  pulseMaxNormal: number;
  pulseMinNormal: number;
  notifyOnOutOfRange: boolean;
  notifyMissedDoseMinutes: number;
  voiceVolumeLevel: number;
  repeatAlarmCount: number;
}
