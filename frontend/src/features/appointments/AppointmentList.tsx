import { Appointment } from '../../types';
import { CalendarDays, CheckCircle2, ChevronDown, Clock3, MapPin, Stethoscope, XCircle } from 'lucide-react';
import { formatDate, localDate, PATIENT_ZONE } from '../../domain/time';
import styles from './AppointmentList.module.css';

const appointmentTime = new Intl.DateTimeFormat('es-PE', { timeZone: PATIENT_ZONE, hour: '2-digit', minute: '2-digit', hour12: false });

export function AppointmentList({ appointments, headingLevel = 2 }: { appointments: Appointment[]; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  if (!appointments.length) return <p className={styles.empty}>No hay citas en esta categoría.</p>;
  return <div className={styles.list}>{appointments.map(a => <article key={a.id} className={styles.card}>
    <div className={styles.heading}>
      <Heading>{a.specialty}</Heading>
      <span className={`${styles.status} ${a.status === 'CANCELLED' ? styles.cancelled : a.status === 'COMPLETED' ? styles.completed : ''}`}>
        {a.status === 'CANCELLED' ? <XCircle size={16} aria-hidden="true" /> : a.status === 'COMPLETED' ? <CheckCircle2 size={16} aria-hidden="true" /> : <CalendarDays size={16} aria-hidden="true" />}
        {a.status === 'CANCELLED' ? 'Cancelada' : a.status === 'COMPLETED' ? 'Atendida' : 'Programada'}
      </span>
    </div>
    <dl className={styles.schedule}>
      <div><dt><CalendarDays size={17} aria-hidden="true" />Fecha</dt><dd><time dateTime={localDate(a.startsAt)}>{formatDate(a.startsAt, false)}</time></dd></div>
      <div><dt><Clock3 size={17} aria-hidden="true" />Hora</dt><dd><time dateTime={a.startsAt}>{appointmentTime.format(new Date(a.startsAt))}</time><span className={styles.timeZone}>hora de Lima</span></dd></div>
    </dl>
    <div className={styles.meta}>
      <p><Stethoscope size={18} aria-hidden="true" /><span><span className="sr-only">Médico: </span>{a.doctor}</span></p>
      <p><MapPin size={18} aria-hidden="true" /><span><span className="sr-only">Lugar: </span>{a.location}</span></p>
    </div>
    {a.instructions && <div className={styles.instructions}><p>Para tu cita</p><p>{a.instructions}</p></div>}
    <details className={styles.origin}><summary><span>Sobre esta cita</span><ChevronDown size={17} aria-hidden="true" /></summary><p>Origen: clínica ficticia del proyecto · datos sintéticos. Contigo consulta esta cita; no la reprograma.</p></details>
  </article>)}</div>;
}
