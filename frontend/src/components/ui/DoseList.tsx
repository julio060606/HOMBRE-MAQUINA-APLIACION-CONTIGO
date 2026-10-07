import { PillIntake } from '../../types';
import { formatDate } from '../../domain/time';
export const DOSE_LABELS: Record<PillIntake['status'], string> = {
  TAKEN: 'Tomada', NOT_TAKEN: 'No tomada', PENDING: 'Pendiente', UNCONFIRMED: 'Sin confirmar', CANCELLED: 'Cancelada por clínica',
};
export function DoseList({ doses }: { doses: PillIntake[] }) {
  if (!doses.length) return <p className="text-slate-600 py-4">No hay dosis programadas para esta jornada.</p>;
  return <ul className="divide-y divide-slate-100">{doses.map(d => <li key={d.id} className="py-4 flex flex-wrap gap-3 items-center justify-between">
    <div><span className="text-forest-800 font-semibold mr-3">{d.scheduledTime}</span><strong>{d.medicationName}</strong><p className="text-sm text-slate-600 mt-1">{d.dosage}{d.respondedAt ? ` · Registro: ${formatDate(d.respondedAt)}` : ''}</p></div>
    <span className={`badge ${d.status === 'TAKEN' ? 'badge-good' : d.status === 'NOT_TAKEN' ? 'badge-negative' : 'badge-neutral'}`}>{DOSE_LABELS[d.status]}</span>
  </li>)}</ul>;
}
