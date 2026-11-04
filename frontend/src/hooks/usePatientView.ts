import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { usePatient } from '../context/PatientContext';
import { User } from '../types';
import { serviceFor, subscribeToEvents } from '../services/apiClient';
import { getReadingPreferences } from '../services/accessibilityPreferences';
import { useReadingPreferences } from './useReadingPreferences';

export function useDemoSynchronization() {
  const client = useQueryClient();
  const { activePatient } = usePatient();
  const { user } = useAuth();
  const { pauseUpdates } = useReadingPreferences();
  const previouslyPaused = useRef(pauseUpdates);

  useEffect(() => {
    if (pauseUpdates && !previouslyPaused.current) {
      // Discard an ordinary refresh already in flight, while allowing initial page loads.
      void client.cancelQueries({ queryKey: ['patient-view'], predicate: query => query.state.data !== undefined });
      void client.cancelQueries({ queryKey: ['patients'], predicate: query => query.state.data !== undefined });
    }
    if (!pauseUpdates && previouslyPaused.current) {
      void client.invalidateQueries({ queryKey: ['patient-view'] });
      void client.invalidateQueries({ queryKey: ['patients'] });
    }
    previouslyPaused.current = pauseUpdates;
  }, [client, pauseUpdates]);

  useEffect(() => {
    if (!activePatient?.id) return;

    const unsubscribe = subscribeToEvents(activePatient.id, (eventType, _data, source) => {
      if (eventType === 'REVOKED' || eventType === 'ACCESS_DENIED' || eventType === 'links') {
        void client.resetQueries({ queryKey: ['patient-view'] });
        void client.resetQueries({ queryKey: ['patients'] });
        void client.invalidateQueries({ queryKey: ['patient-caregivers'] });
        return;
      }
      if (!getReadingPreferences().pauseUpdates || source === 'local') {
        void client.invalidateQueries({ queryKey: ['patient-view'] });
        void client.invalidateQueries({ queryKey: ['patient-caregivers'] });
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
  const { pauseUpdates } = useReadingPreferences();
  return useQuery({ queryKey: ['patient-view', actor?.id, actor?.organizationId, id], enabled: !!actor && !!id,
    queryFn: () => serviceFor(actor!).view(id!), retry: false, refetchInterval: pauseUpdates ? false : 30000,
    refetchOnWindowFocus: !pauseUpdates, refetchOnReconnect: !pauseUpdates, refetchOnMount: !pauseUpdates, staleTime: 0 });
}
