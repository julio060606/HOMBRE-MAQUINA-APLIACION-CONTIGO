import { Appointment } from '../../types';
import { formatDate } from '../../domain/time';
export function AppointmentList({ appointments }: { appointments: Appointment[] }) {
  if (!appointments.length) return <p className="text-slate-600">No hay citas en esta categoría.</p>;
  return <div className="grid gap-4">{appointments.map(a => <article key={a.id} className="panel">
    <div className="flex flex-wrap justify-between gap-3"><h2 className="section-title">{a.specialty}</h2><span className="badge badge-neutral">{a.status === 'CANCELLED' ? 'Cancelada' : a.status === 'COMPLETED' ? 'Atendida' : 'Programada'}</span></div>
    <p className="text-xl font-semibold mt-3">{formatDate(a.startsAt)} <span className="text-sm font-normal">· hora de Lima</span></p>
    <p className="mt-2">{a.doctor}</p><p className="text-slate-600 mt-1">{a.location}</p>
    <p className="text-slate-600 mt-4">{a.instructions}</p><p className="text-sm text-slate-500 mt-3">Origen: clínica de demostración. Contigo consulta esta cita; no la reprograma.</p>
  </article>)}</div>;
}
