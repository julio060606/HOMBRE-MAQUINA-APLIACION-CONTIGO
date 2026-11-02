import { ClinicalSyncState, ContigoService, PatientView, ResponseInput, PressureInput, SupplyInput } from '../contracts';
import { AlertEvent, BloodPressureLog, ClinicalSettings, Patient, PillIntake, WeightLog } from '../../types';
import { fetchAuthenticated, responseError } from './apiTransport';
import { emitApiChange } from './changeEvents';
export { ApiError } from './apiTransport';

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  const res = await fetchAuthenticated(path, { ...options, headers });
  if (!res.ok) throw await responseError(res);
  if (options.method && options.method !== 'GET') emitApiChange(path.startsWith('/links/') || path.startsWith('/pairing/') ? 'links' : 'data');
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return data as T;
}

export function createHttpService(): ContigoService {
  return {
    patients: () => fetchApi<Patient[]>('/patients'),

    view: async (patientId: string) => {
      const [view, clinicalSync] = await Promise.all([
        fetchApi<PatientView>(`/patients/${patientId}/dashboard`),
        fetchApi<ClinicalSyncState>(`/patients/${patientId}/clinical-sync`).catch(() => ({ status: 'UNKNOWN' as const })),
      ]);
      return { ...view, clinicalSync };
    },

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
