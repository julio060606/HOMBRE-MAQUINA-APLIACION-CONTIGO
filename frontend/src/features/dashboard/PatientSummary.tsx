import { Link } from 'react-router-dom';
import { PatientView } from '../../services/contracts';
import { adherence } from '../../domain/tracking';
import { formatDate } from '../../domain/time';
import { DoseList } from '../../components/ui/DoseList';
export function PatientSummary({ view, compact = false }: { view: PatientView; compact?: boolean }) {
  const metric = adherence(view.today), latest = view.pressures[0];
  const appointment = view.appointments.find(a => a.status === 'SCHEDULED' && Date.parse(a.startsAt) >= Date.now());
  const low = view.supplies.filter(s => ['LOW', 'EMPTY', 'DISCREPANCY'].includes(s.state));
  return <div className="space-y-5">
    {!compact && (
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
        <img
          src={view.patient.id === 'pat_002' ? '/images/rosa_avatar.jpg' : '/images/dacio_avatar.jpg'}
          alt={view.patient.fullName}
          className="w-16 h-16 rounded-2xl object-cover border-2 border-forest-600 shadow-sm shrink-0"
        />
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-heading font-bold text-slate-900">{view.patient.fullName}</h2>
            <span className="bg-forest-50 text-forest-800 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-forest-200/60">
              {view.patient.relationship || 'Familiar'}
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {view.patient.age} años · Programa de Acompañamiento Domiciliario San Pablo
          </p>
          {view.patient.medicalNotes && (
            <p className="text-xs text-slate-500 mt-0.5 italic">
              {view.patient.medicalNotes}
            </p>
          )}
        </div>
      </div>
    )}
    <div className={`grid gap-4 ${compact ? '' : 'sm:grid-cols-2 xl:grid-cols-4'}`}>
      <section className="panel"><p className="eyebrow">Adherencia declarada</p><p className="metric">{metric.duePercent === null ? 'Sin dosis evaluables' : `${metric.duePercent}%`}</p><p className="text-sm text-slate-600">El porcentaje evalúa {metric.due} dosis cuyo horario ya llegó. {metric.taken} de {metric.total} dosis del día declaradas como tomadas. Avance diario: {metric.dayPercent === null ? 'Sin programación' : `${metric.dayPercent}%`}.</p></section>
      <section className="panel"><p className="eyebrow">Última presión</p><p className="metric">{latest ? `${latest.systolic}/${latest.diastolic}` : 'Sin datos'}</p><p className="text-sm text-slate-600">{latest ? `mmHg · ${formatDate(latest.recordedAt)} · ${latest.source === 'HOME' ? 'Casa' : 'Clínica simulada'}` : 'Todavía no hay mediciones.'}</p><p className="mt-2 text-sm">Pulso: {latest?.pulse != null ? `${latest.pulse} lpm` : 'No registrado'}</p></section>
      <section className="panel"><p className="eyebrow">Próxima cita</p><p className="font-heading text-lg font-semibold mt-3">{appointment ? formatDate(appointment.startsAt) : 'Sin citas próximas'}</p><p className="text-sm text-slate-600 mt-2">{appointment?.specialty}</p>{!compact && <Link to="/appointments" className="text-forest-800 underline mt-3 inline-block">Ver citas</Link>}</section>
      <section className="panel"><p className="eyebrow">Existencias</p><p className="metric">{low.length} {low.length === 1 ? 'aviso' : 'avisos'}</p><p className="text-sm text-slate-600">{low.length ? 'Revise cantidad disponible o discrepancias de conteo.' : 'Consulte la cantidad de cada medicamento.'}</p>{!compact && <Link to="/medications" className="text-forest-800 underline mt-3 inline-block">Ver tratamiento</Link>}</section>
    </div>
    <section className="panel"><h2 className="section-title">Dosis de hoy</h2><p className="text-sm text-slate-600 mt-1">La confirmación expresa lo registrado por el paciente; no verifica la ingestión.</p><DoseList doses={view.today} /></section>
    <section className="panel"><h2 className="section-title">Avisos de seguimiento</h2>{view.alerts.length ? <ul className="space-y-3 mt-4">{view.alerts.map(a => <li key={a.id} className="border-l-4 border-amber-600 pl-3"><strong>{a.title}</strong><p className="text-sm text-slate-600 mt-1">{a.description}</p></li>)}</ul> : <p className="text-slate-600 mt-3">No hay avisos registrados.</p>}</section>
  </div>;
}
