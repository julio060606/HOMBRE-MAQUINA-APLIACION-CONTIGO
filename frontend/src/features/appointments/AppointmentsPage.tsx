import { useState } from 'react';
import { PatientData, PageHeader } from '../../components/ui/PatientData';
import { AppointmentList } from './AppointmentList';
export function AppointmentsPage() {
  const [filter, setFilter] = useState('upcoming');
  return <PatientData>{view => <><PageHeader title="Citas médicas" description={`Organiza el acompañamiento de ${view.patient.fullName} con las citas registradas por la clínica.`} />
    <label className="block mb-5">Mostrar <select className="input ml-3 max-w-xs" value={filter} onChange={e => setFilter(e.target.value)} data-testid="appointments-filter"><option value="upcoming">Próximas</option><option value="past">Pasadas</option><option value="cancelled">Canceladas</option><option value="all">Todas</option></select></label>
    <AppointmentList appointments={view.appointments.filter(a => filter === 'all' || (filter === 'cancelled' ? a.status === 'CANCELLED' : a.status !== 'CANCELLED' && (filter === 'upcoming' ? Date.parse(a.startsAt) >= Date.now() : Date.parse(a.startsAt) < Date.now())))} />
  </>}</PatientData>;
}
