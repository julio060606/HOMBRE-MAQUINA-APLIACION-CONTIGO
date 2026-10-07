import { ReactNode } from 'react';
import { usePatient } from '../../context/PatientContext';
import { usePatientView } from '../../hooks/usePatientView';
import { PatientView } from '../../services/contracts';
export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <div role={error ? 'alert' : 'status'} className={`panel ${error ? 'border-rose-300 text-rose-900' : 'text-slate-600'}`}>{children}</div>;
}
export function PatientData({ children }: { children: (view: PatientView) => ReactNode }) {
  const context = usePatient(); const query = usePatientView();
  if (context.error || query.error) return <Notice error>{context.error?.message || query.error?.message} <button className="btn-secondary mt-3" onClick={() => { void context.reloadPatients(); void query.refetch(); }}>Reintentar</button></Notice>;
  if (context.isLoading || (context.activePatient && query.isPending)) return <Notice>Cargando información autorizada…</Notice>;
  if (!context.activePatient) return <Notice>No tiene pacientes vinculados. Use «Vincular paciente» o cambie de cuenta de prueba.</Notice>;
  return query.data ? <>{children(query.data)}</> : <Notice>No hay información disponible.</Notice>;
}
export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <header className="flex flex-wrap justify-between gap-4 items-start mb-6"><div><h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-950">{title}</h1><p className="text-slate-600 mt-2 max-w-2xl">{description}</p></div>{action}</header>;
}
