import React, { createContext, useContext, useState, useEffect } from 'react';
import { Patient } from '../types';
import { patientService } from '../services/apiClient';

interface PatientContextType {
  patients: Patient[];
  activePatient: Patient | null;
  setActivePatient: (patient: Patient) => void;
  reloadPatients: () => Promise<void>;
  linkNewPatient: (pin: string) => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);

  const reloadPatients = async () => {
    const data = await patientService.getPatients();
    setPatients(data);
    if (data.length > 0 && !activePatient) {
      setActivePatient(data[0]);
    }
  };

  useEffect(() => {
    reloadPatients();
  }, []);

  const linkNewPatient = async (pin: string) => {
    const newPat = await patientService.linkPatientByPin(pin);
    setPatients(prev => [...prev, newPat]);
    setActivePatient(newPat);
  };

  return (
    <PatientContext.Provider value={{ patients, activePatient, setActivePatient, reloadPatients, linkNewPatient }}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) throw new Error('usePatient must be used within a PatientProvider');
  return context;
};
