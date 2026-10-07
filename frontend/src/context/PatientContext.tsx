import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Patient } from '../types';
import { serviceFor } from '../services/apiClient';
import { useAuth } from './AuthContext';
import { PatientContext } from './PatientState';
export { usePatient } from './PatientState';
export const PatientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [selection, setSelection] = useState<{ userId: string; patientId: string } | null>(null);
  const query = useQuery({ queryKey: ['patients', user?.id, user?.organizationId], enabled: !!user,
    queryFn: () => serviceFor(user!).patients(), retry: false });
  const patients = user ? query.data ?? [] : [];
  const selectedId = selection && selection.userId === user?.id ? selection.patientId : user?.patientId;
  const activePatient = patients.find(p => p.id === selectedId) ?? patients[0] ?? null;
  useEffect(() => { if (!user) setSelection(null); }, [user]);
  const setActivePatient = (patient: Patient) => {
    if (!user || !patients.some(p => p.id === patient.id)) throw new Error('Paciente no autorizado.');
    setSelection({ userId: user.id, patientId: patient.id });
  };
  const reloadPatients = async () => { await query.refetch(); };
  const linkNewPatient = async (pin: string, relationship = 'Familiar') => {
    if (!user) throw new Error('Inicie sesión.');
    const patient = await serviceFor(user).pair(pin, relationship);
    await reloadPatients(); setSelection({ userId: user.id, patientId: patient.id });
  };
  return <PatientContext.Provider value={{ patients, activePatient, setActivePatient, reloadPatients, linkNewPatient,
    isLoading: !!user && query.isPending, error: query.error }}>{children}</PatientContext.Provider>;
};
