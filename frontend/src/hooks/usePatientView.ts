import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { usePatient } from '../context/PatientContext';
import { User } from '../types';
import { serviceFor, subscribeToEvents } from '../services/apiClient';

export function useDemoSynchronization() {
  const client = useQueryClient();
  const { activePatient } = usePatient();
  const { user } = useAuth();

  useEffect(() => {
    if (!activePatient?.id) return;

    const unsubscribe = subscribeToEvents(activePatient.id, (eventType) => {
      void client.invalidateQueries({ queryKey: ['patient-view'] });
      void client.invalidateQueries({ queryKey: ['patient-caregivers'] });
      if (eventType === 'REVOKED' || eventType === 'links') {
        void client.resetQueries({ queryKey: ['patients'] });
        void client.invalidateQueries({ queryKey: ['patient-view'] });
      }
    });

    return unsubscribe;
  }, [client, activePatient?.id, user?.id]);
}
export function usePatientView(patientId?: string, actorOverride?: User) {
  const { user } = useAuth();
  const { activePatient } = usePatient();
  const actor = actorOverride ?? user;
  const id = patientId ?? activePatient?.id;
  return useQuery({ queryKey: ['patient-view', actor?.id, actor?.organizationId, id], enabled: !!actor && !!id,
    queryFn: () => serviceFor(actor!).view(id!), retry: false, refetchInterval: 30000, staleTime: 0 });
}
