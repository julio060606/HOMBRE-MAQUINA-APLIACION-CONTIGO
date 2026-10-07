import { createContext, useContext } from 'react';
import { Patient } from '../types';

export interface PatientContextType {
  patients: Patient[];
  activePatient: Patient | null;
  setActivePatient: (patient: Patient) => void;
  reloadPatients: () => Promise<void>;
  linkNewPatient: (pin: string, relationship?: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function usePatient() {
  const value = useContext(PatientContext);
  if (!value) throw new Error('PatientProvider no está disponible.');
  return value;
}
