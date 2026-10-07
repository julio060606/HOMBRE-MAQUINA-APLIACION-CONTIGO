import { ENV } from '../../config/env';
import { ContigoService, PatientView, ResponseInput, PressureInput, SupplyInput } from '../contracts';
import { AlertEvent, BloodPressureLog, ClinicalSettings, Patient, PillIntake, WeightLog } from '../../types';
import { getAuthToken } from './tokenStorage';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${ENV.API_BASE_URL}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new ApiError(0, `No se pudo conectar al servidor backend en ${url}. Compruebe que el servicio esté en ejecución.`);
  }

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errorData = data as { message?: string; details?: Record<string, string> } | null;
    const msg = errorData?.message || `Error del servidor HTTP ${res.status}`;
    throw new ApiError(res.status, msg, errorData?.details);
  }

  return data as T;
}

export function createHttpService(): ContigoService {
  return {
    patients: () => fetchApi<Patient[]>('/patients'),

    view: (patientId: string) => fetchApi<PatientView>(`/patients/${patientId}/dashboard`),

    respond: (input: ResponseInput) => {
      if (input.correction) {
        return fetchApi<PillIntake>(`/patients/${input.patientId}/intakes/${input.doseId}/corrections`, {
          method: 'POST',
          body: JSON.stringify({
            newStatus: input.response,
            reason: input.reason || 'Corrección solicitada',
            operationId: input.operationId,
          }),
        });
      }
      return fetchApi<PillIntake>(`/patients/${input.patientId}/doses/${input.doseId}/responses`, {
        method: 'POST',
        body: JSON.stringify({
          response: input.response,
          operationId: input.operationId,
          expectedDoseVersion: input.expectedVersion,
          reason: input.reason,
        }),
      });
    },

    pressure: (patientId: string, input: PressureInput, operationId: string) =>
      fetchApi<BloodPressureLog>(`/patients/${patientId}/measurements/pressure`, {
        method: 'POST',
        body: JSON.stringify({
          systolic: input.systolic,
          diastolic: input.diastolic,
          pulse: input.pulse,
          recordedAt: input.recordedAt,
          notes: input.notes,
          operationId,
        }),
      }),

    weight: (patientId: string, weightKg: number, operationId: string) =>
      fetchApi<WeightLog>(`/patients/${patientId}/measurements/weight`, {
        method: 'POST',
        body: JSON.stringify({ weightKg, operationId }),
      }),

    moveSupply: (patientId: string, medicationId: string, input: SupplyInput, operationId: string) =>
      fetchApi<void>(`/patients/${patientId}/supplies/${medicationId}/movements`, {
        method: 'POST',
        body: JSON.stringify({
          kind: input.kind,
          quantity: input.quantity,
          reason: input.reason,
          operationId,
        }),
      }),

    preferences: (patientId: string, value: ClinicalSettings) =>
      fetchApi<void>(`/patients/${patientId}/preferences`, {
        method: 'PATCH',
        body: JSON.stringify(value),
      }),

    sos: (patientId: string, operationId: string) =>
      fetchApi<AlertEvent>(`/patients/${patientId}/alerts/sos`, {
        method: 'POST',
        body: JSON.stringify({ operationId }),
      }),

    pair: (pin: string, relationship: string) =>
      fetchApi<Patient>('/pairing/claims', {
        method: 'POST',
        body: JSON.stringify({ pin, relationship }),
      }),

    generatePin: (patientId: string) =>
      fetchApi<{ pin: string; expiresAt: string }>('/pairing/requests', {
        method: 'POST',
        body: JSON.stringify({ patientId }),
      }),

    caregivers: (patientId: string) =>
      fetchApi<{ userId: string; name: string; relationship: string }[]>(`/patients/${patientId}/caregivers`),

    revokeLink: (patientId: string, caregiverId: string) =>
      fetchApi<void>(`/links/${patientId}/${caregiverId}`, {
        method: 'DELETE',
      }),
  };
}
