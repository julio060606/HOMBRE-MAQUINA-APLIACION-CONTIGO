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
let intakesState = [...MOCK_TODAY_INTAKES];
let vitalsState = [...MOCK_VITALS];
let alertsState = [...MOCK_ALERTS];
let settingsState = { ...MOCK_SETTINGS };

type SyncListener = () => void;
const syncListeners = new Set<SyncListener>();

export const syncEvents = {
  subscribe(fn: SyncListener) {
    syncListeners.add(fn);
    return () => {
      syncListeners.delete(fn);
    };
  },
  emit() {
    syncListeners.forEach(fn => {
      try {
        fn();
      } catch (e) {
        console.error('Error in sync listener', e);
      }
    });
  }
};

export const resetDemoData = () => {
  patientsState = [...MOCK_PATIENTS];
  medicationsState = [...MOCK_MEDICATIONS];
  intakesState = [...MOCK_TODAY_INTAKES];
  vitalsState = [...MOCK_VITALS];
  alertsState = [...MOCK_ALERTS];
  settingsState = { ...MOCK_SETTINGS };
  syncEvents.emit();
};

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
      syncEvents.emit();
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
      return intakesState;
    }
    const res = await fetch(`${ENV.API_BASE_URL}/patients/${patientId}/intakes/today`);
    return res.json();
  },

  async confirmIntake(intakeId: string, confirmedVia: 'MANUAL_PATIENT' | 'VOICE_PATIENT' = 'MANUAL_PATIENT'): Promise<PillIntake> {
    if (ENV.USE_MOCKS) {
      await delay(250);
      intakesState = intakesState.map(i => 
        i.id === intakeId 
          ? { ...i, status: 'TAKEN' as const, takenAt: new Date().toISOString() } 
          : i
      );
      syncEvents.emit();
      return intakesState.find(i => i.id === intakeId)!;
    }
    const res = await fetch(`${ENV.API_BASE_URL}/intakes/${intakeId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmedVia })
    });
    return res.json();
  },

  async saveMedication(med: Omit<Medication, 'id'>): Promise<Medication> {
    if (ENV.USE_MOCKS) {
      await delay(300);
      const newMed: Medication = {
        ...med,
        id: `med_${Date.now()}`,
      };
      medicationsState.unshift(newMed);
      
      // También agregamos una toma para hoy si es diaria
      if (med.times && med.times.length > 0) {
        intakesState.push({
          id: `intake_${Date.now()}`,
          medicationId: newMed.id,
          medicationName: newMed.name,
          dosage: newMed.dosage,
          imageUrl: newMed.imageUrl,
          scheduledTime: med.times[0],
          scheduledDate: new Date().toISOString().split('T')[0],
          status: 'PENDING',
          instructions: newMed.instructions,
        });
      }
      
      syncEvents.emit();
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
      syncEvents.emit();
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

      // Si es alta o crítica, emitimos una alerta médica automática
      if (status !== 'NORMAL') {
        const patient = patientsState.find(p => p.id === log.patientId);
        alertsState.unshift({
          id: `alert_bp_${Date.now()}`,
          patientId: log.patientId,
          patientName: patient?.fullName || 'Dacio Ramos',
          type: 'CRITICAL_VITALS',
          severity: status === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          title: `Presión ${status === 'CRITICAL' ? 'Crítica' : 'Elevada'}: ${log.systolic}/${log.diastolic} mmHg`,
          description: `Se registró una lectura fuera del rango estándar (120/80 mmHg). Monitorear al paciente.`,
          timestamp: new Date().toISOString(),
          isResolved: false,
        });
      }

      syncEvents.emit();
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
      return alertsState.filter(a => a.patientId === patientId);
    }
    const res = await fetch(`${ENV.API_BASE_URL}/patients/${patientId}/alerts`);
    return res.json();
  },

  async triggerSosAlert(patientId: string, notes?: string): Promise<AlertEvent> {
    if (ENV.USE_MOCKS) {
      await delay(200);
      const patient = patientsState.find(p => p.id === patientId);
      const newAlert: AlertEvent = {
        id: `alert_sos_${Date.now()}`,
        patientId,
        patientName: patient?.fullName || 'Dacio Ramos',
        type: 'PANIC_BUTTON',
        severity: 'CRITICAL',
        title: '¡ALERTA DE AUXILIO SOS ACTIVADA!',
        description: notes || 'El paciente presionó el botón de emergencia SOS en su dispositivo móvil.',
        timestamp: new Date().toISOString(),
        isResolved: false,
      };
      alertsState.unshift(newAlert);
      syncEvents.emit();
      return newAlert;
    }
    const res = await fetch(`${ENV.API_BASE_URL}/alerts/sos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, notes })
    });
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
      await delay(300);
      settingsState = { ...settings };
      syncEvents.emit();
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
