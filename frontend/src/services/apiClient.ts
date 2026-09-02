import { ENV } from '../config/env';
import { 
  MOCK_PATIENTS, 
  MOCK_MEDICATIONS, 
  MOCK_TODAY_INTAKES, 
  MOCK_VITALS, 
  MOCK_ALERTS, 
  MOCK_SETTINGS,
  MOCK_USER 
} from './mocks/mockData';
import { Patient, Medication, PillIntake, BloodPressureLog, AlertEvent, ClinicalSettings } from '../types';

// Simulador de retardo de red para dar sensación realista
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Estado en memoria para permitir mutaciones durante la sesión de prueba
let patientsState = [...MOCK_PATIENTS];
let medicationsState = [...MOCK_MEDICATIONS];
let vitalsState = [...MOCK_VITALS];
let settingsState = { ...MOCK_SETTINGS };

export const patientService = {
  async getPatients(): Promise<Patient[]> {
    if (ENV.USE_MOCKS) {
      await delay();
      return patientsState;
    }
    const res = await fetch(`${ENV.API_BASE_URL}/patients`);
    return res.json();
  },

  async linkPatientByPin(pin: string): Promise<Patient> {
    if (ENV.USE_MOCKS) {
      await delay(500);
      const newPatient: Patient = {
        id: `pat_${Date.now()}`,
        fullName: 'Nuevo Paciente Vinculado',
        age: 76,
        emergencyPhone: '999888777',
        relationship: 'Familiar',
        isOnline: true,
        lastSyncAt: new Date().toISOString(),
        easyModeEnabled: true,
        voiceGuideEnabled: true,
      };
      patientsState.push(newPatient);
      return newPatient;
    }
    const res = await fetch(`${ENV.API_BASE_URL}/patients/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    return res.json();
  }
};

export const medicationService = {
  async getMedications(patientId: string): Promise<Medication[]> {
    if (ENV.USE_MOCKS) {
      await delay();
      return medicationsState.filter(m => m.patientId === patientId);
    }
    const res = await fetch(`${ENV.API_BASE_URL}/patients/${patientId}/medications`);
    return res.json();
  },

  async getTodayIntakes(patientId: string): Promise<PillIntake[]> {
    if (ENV.USE_MOCKS) {
      await delay();
      return MOCK_TODAY_INTAKES;
    }
    const res = await fetch(`${ENV.API_BASE_URL}/patients/${patientId}/intakes/today`);
    return res.json();
  },

  async saveMedication(med: Omit<Medication, 'id'>): Promise<Medication> {
    if (ENV.USE_MOCKS) {
      await delay(400);
      const newMed: Medication = {
        ...med,
        id: `med_${Date.now()}`,
      };
      medicationsState.unshift(newMed);
      return newMed;
    }
    const res = await fetch(`${ENV.API_BASE_URL}/medications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(med),
    });
    return res.json();
  },

  async toggleMedicationStatus(id: string): Promise<void> {
    if (ENV.USE_MOCKS) {
      await delay(200);
      medicationsState = medicationsState.map(m => 
        m.id === id ? { ...m, isActive: !m.isActive } : m
      );
      return;
    }
    await fetch(`${ENV.API_BASE_URL}/medications/${id}/toggle`, { method: 'PATCH' });
  }
};

export const vitalsService = {
  async getBloodPressureLogs(patientId: string): Promise<BloodPressureLog[]> {
    if (ENV.USE_MOCKS) {
      await delay();
      return vitalsState.filter(v => v.patientId === patientId);
    }
    const res = await fetch(`${ENV.API_BASE_URL}/patients/${patientId}/vitals`);
    return res.json();
  },

  async addBloodPressureLog(log: Omit<BloodPressureLog, 'id' | 'status'>): Promise<BloodPressureLog> {
    if (ENV.USE_MOCKS) {
      await delay(300);
      let status: 'NORMAL' | 'HIGH' | 'CRITICAL' = 'NORMAL';
      if (log.systolic > 140 || log.diastolic > 90) status = 'CRITICAL';
      else if (log.systolic > 130 || log.diastolic > 85) status = 'HIGH';

      const newLog: BloodPressureLog = {
        ...log,
        id: `bp_${Date.now()}`,
        status,
      };
      vitalsState.unshift(newLog);
      return newLog;
    }
    const res = await fetch(`${ENV.API_BASE_URL}/vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    });
    return res.json();
  }
};

export const alertService = {
  async getRecentAlerts(patientId: string): Promise<AlertEvent[]> {
    if (ENV.USE_MOCKS) {
      await delay();
      return MOCK_ALERTS;
    }
    const res = await fetch(`${ENV.API_BASE_URL}/patients/${patientId}/alerts`);
    return res.json();
  }
};

export const settingsService = {
  async getSettings(patientId: string): Promise<ClinicalSettings> {
    if (ENV.USE_MOCKS) {
      await delay();
      return settingsState;
    }
    const res = await fetch(`${ENV.API_BASE_URL}/patients/${patientId}/settings`);
    return res.json();
  },

  async updateSettings(settings: ClinicalSettings): Promise<ClinicalSettings> {
    if (ENV.USE_MOCKS) {
      await delay(400);
      settingsState = { ...settings };
      return settingsState;
    }
    const res = await fetch(`${ENV.API_BASE_URL}/patients/${settings.patientId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    return res.json();
  }
};
