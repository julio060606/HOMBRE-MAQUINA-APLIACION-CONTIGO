import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, CalendarDays, Check, CheckCircle2, ChevronRight, CircleAlert, Clock3, FileHeart, HeartPulse, Package, Pill, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { PatientView } from '../../services/contracts';
import { BloodPressureLog, DoseStatus, PillIntake } from '../../types';
import { adherence } from '../../domain/tracking';
import { formatDate, newestFirst, withinPeriod } from '../../domain/time';
import { DOSE_LABELS } from '../../components/ui/DoseList';
import styles from './Dashboard.module.css';

const date = (value?: string, time = true) => value && Number.isFinite(Date.parse(value)) ? formatDate(value, time) : 'Fecha no disponible';
const doseTone: Record<DoseStatus, string> = { TAKEN: styles.taken, NOT_TAKEN: styles.notTaken, PENDING: styles.pending, UNCONFIRMED: styles.unconfirmed, CANCELLED: styles.cancelled };
const shortDate = (value: string) => new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));

function DoseRow({ dose }: { dose: PillIntake }) {
  return <li className={styles.doseRow}><div className={styles.doseTime}><Clock3 size={15} aria-hidden="true" /><time dateTime={dose.scheduledAt}>{dose.scheduledTime}</time></div><div className={styles.doseInfo}><strong>{dose.medicationName}</strong><span>{dose.dosage}</span>{dose.respondedAt && <small>Registrada: {date(dose.respondedAt)}</small>}</div><span className={`${styles.doseBadge} ${doseTone[dose.status]}`}>{dose.status === 'TAKEN' ? <CheckCircle2 size={15} aria-hidden="true" /> : dose.status === 'NOT_TAKEN' ? <X size={15} aria-hidden="true" /> : <Clock3 size={15} aria-hidden="true" />}{DOSE_LABELS[dose.status]}</span></li>;
}

function PressureOverview({ readings }: { readings: BloodPressureLog[] }) {
  const [days, setDays] = useState(7);
  const id = useId();
  const entries = readings.filter(p => withinPeriod(p.recordedAt, days)).sort((a, b) => Date.parse(a.recordedAt) - Date.parse(b.recordedAt));
  const values = entries.flatMap(p => [p.systolic, p.diastolic]);
  const minimum = values.length ? Math.floor((Math.min(...values) - 10) / 10) * 10 : 0;
  const maximum = values.length ? Math.ceil((Math.max(...values) + 10) / 10) * 10 : 100;
  const first = entries[0];
  const last = entries[entries.length - 1];
  const start = first ? Date.parse(first.recordedAt) : 0;
  const duration = last ? Math.max(1, Date.parse(last.recordedAt) - start) : 1;
  const x = (p: BloodPressureLog) => entries.length === 1 ? 50 : 5 + (Date.parse(p.recordedAt) - start) / duration * 90;
  const y = (v: number) => 10 + (maximum - v) / (maximum - minimum) * 80;
  return <section className={styles.card} aria-labelledby={`${id}-heading`}>
    <div className={styles.cardHeading}><div><h2 id={`${id}-heading`}>Presión registrada</h2><p>Lecturas guardadas · mmHg</p></div><div className={styles.segmented} aria-label="Periodo de mediciones">{[7, 30].map(value => <button key={value} type="button" aria-pressed={days === value} onClick={() => setDays(value)}>{value} días</button>)}</div></div>
    {entries.length ? <>
      <div className={styles.chartLegend}><span><i className={styles.systolicSwatch} />Sistólica</span><span><i className={styles.diastolicSwatch} />Diastólica</span><span className={styles.readingCount}>{entries.length} {entries.length === 1 ? 'lectura' : 'lecturas'}</span></div>
      <div className={styles.chart} role="img" aria-label={`Presión arterial de los últimos ${days} días. ${entries.length} lecturas. Última: ${last.systolic} sobre ${last.diastolic} mmHg. Valores exactos disponibles en las lecturas recientes.`}>
        <div className={styles.chartAxis} aria-hidden="true"><span>{maximum}</span><span>{(maximum + minimum) / 2}</span><span>{minimum}</span></div>
        <div className={styles.plot} aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">{[10, 50, 90].map(position => <line key={position} x1="0" x2="100" y1={position} y2={position} className={styles.gridLine} />)}{(['systolic', 'diastolic'] as const).map(key => <polyline key={key} points={entries.map(p => `${x(p)},${y(p[key])}`).join(' ')} fill="none" className={key === 'systolic' ? styles.systolicLine : styles.diastolicLine} />)}</svg>{entries.map(p => <span key={p.id}>{(['systolic', 'diastolic'] as const).map(key => <i key={key} className={`${styles.chartDot} ${key === 'systolic' ? styles.systolicDot : styles.diastolicDot}`} style={{ left: `${x(p)}%`, top: `${y(p[key])}%` }} />)}</span>)}</div>
      </div>
      <div className={styles.chartDates}><span>{shortDate(first.recordedAt)}</span>{entries.length > 1 && <span>{shortDate(last.recordedAt)}</span>}</div>
      <details className={styles.readingDetails}><summary>Ver lecturas recientes <ChevronRight size={16} aria-hidden="true" /></summary><ul>{[...entries].reverse().slice(0, 5).map(p => <li key={p.id}><span>{date(p.recordedAt)}</span><strong>{p.systolic} / {p.diastolic} mmHg</strong><span>Origen: {p.source === 'HOME' ? 'casa' : 'clínica ficticia'} · Pulso: {p.pulse == null ? 'No registrado' : `${p.pulse} lpm`}</span></li>)}</ul>{entries.length > 5 && <p>Se muestran las últimas cinco lecturas. Consulta el historial en Gráficas y mediciones.</p>}</details>
    </> : <div className={styles.chartEmpty}><HeartPulse size={30} aria-hidden="true" /><strong>No hay lecturas en estos {days} días</strong><p>Las mediciones aparecerán aquí cuando el paciente las registre.</p></div>}
    <div className={styles.cardFooter}><span>Registros de seguimiento, sin interpretación clínica automática.</span><Link to="/vitals">Ver mediciones<ArrowRight size={16} aria-hidden="true" /></Link></div>
  </section>;
}

export function PatientSummary({ view, compact = false }: { view: PatientView; compact?: boolean }) {
  const [doseFilter, setDoseFilter] = useState<'all' | 'pending'>('all');
  const id = useId();
  const metric = adherence(view.today);
  const latest = newestFirst(view.pressures)[0];
  const appointment = [...view.appointments].filter(a => a.status === 'SCHEDULED' && Date.parse(a.startsAt) >= Date.now()).sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0];
  const supplies = view.supplies.filter(s => s.state !== 'AVAILABLE');
  const alerts = view.alerts.filter(a => !a.isResolved).sort((a, b) => (a.severity === 'CRITICAL' ? -1 : b.severity === 'CRITICAL' ? 1 : Date.parse(b.timestamp) - Date.parse(a.timestamp)));
  const pending = view.today.filter(d => d.status === 'PENDING' || d.status === 'UNCONFIRMED');
  const cancelled = view.today.filter(d => d.status === 'CANCELLED');
  const doses = [...(doseFilter === 'pending' ? pending : view.today.filter(d => d.status !== 'CANCELLED'))].sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));
  const updated = view.clinicalSync?.status === 'SYNCED';
  const photo = view.patient.id === 'pat_001' ? '/images/dacio_avatar.jpg' : view.patient.id === 'pat_002' ? '/images/rosa_avatar.jpg' : undefined;
  const initials = view.patient.fullName.split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('');
  return <div className={`${styles.summary} ${compact ? styles.compact : ''}`}>
    {!compact && <section className={styles.patientCard} aria-label="Paciente en seguimiento"><div className={styles.patientIdentity}>{photo ? <img src={photo} alt="" className={styles.patientAvatar} /> : <span className={styles.initials} aria-hidden="true">{initials}</span>}<div><div className={styles.patientName}><h2>{view.patient.fullName}</h2><span>{view.patient.relationship || 'Paciente'}</span></div><p>{view.patient.age} años · Acompañamiento en casa</p><Link to="/clinical-profile">Ver ficha clínica<ChevronRight size={16} aria-hidden="true" /></Link></div></div><div className={styles.syncSummary}><span className={`${styles.syncBadge} ${!updated ? styles.syncPending : ''}`}>{updated ? <CheckCircle2 size={15} aria-hidden="true" /> : <RefreshCw size={15} aria-hidden="true" />}{updated ? 'Datos clínicos actualizados' : 'Actualización sin verificar'}</span><p>Última carga: {date(view.clinicalSync?.lastSuccessfulSyncAt || view.patient.lastSyncAt)}</p></div></section>}

    <div className={styles.metricGrid}>
      <section className={`${styles.metricCard} ${styles.adherenceCard}`} aria-label="Adherencia declarada"><div className={styles.metricLabel}><span>Adherencia declarada</span><span className={styles.metricIcon}><Pill size={19} aria-hidden="true" /></span></div><div className={styles.metricValue}><strong>{metric.duePercent === null ? '—' : `${metric.duePercent}%`}</strong></div><p>{metric.due ? `Sobre ${metric.due} dosis cuyo horario ya llegó.` : 'Todavía no hay dosis evaluables.'}</p><div className={styles.metricFoot}><span>{metric.taken} de {metric.total} tomas confirmadas hoy</span><Check size={16} aria-hidden="true" /></div></section>
      <section className={styles.metricCard} aria-label="Última presión"><div className={styles.metricLabel}><span>Última presión</span><span className={styles.metricIcon}><Activity size={19} aria-hidden="true" /></span></div><div className={styles.metricValue}><strong>{latest ? `${latest.systolic}/${latest.diastolic}` : 'Sin datos'}</strong>{latest && <span>mmHg</span>}</div><p>Pulso: {latest?.pulse != null ? `${latest.pulse} lpm` : 'No registrado'}</p><div className={styles.metricFoot}><span>{latest ? `${shortDate(latest.recordedAt)} · ${latest.source === 'HOME' ? 'Casa' : 'Clínica ficticia'}` : 'Sin mediciones registradas'}</span><HeartPulse size={16} aria-hidden="true" /></div></section>
      <section className={styles.metricCard} aria-label="Próxima cita"><div className={styles.metricLabel}><span>Próxima cita</span><span className={`${styles.metricIcon} ${styles.blueIcon}`}><CalendarDays size={19} aria-hidden="true" /></span></div><div className={`${styles.metricValue} ${styles.dateValue}`}><strong>{appointment ? new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', day: 'numeric', month: 'short' }).format(new Date(appointment.startsAt)) : 'Sin citas'}</strong></div><p>{appointment ? `${appointment.specialty} · ${new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(appointment.startsAt))}` : 'No hay próximas citas programadas.'}</p><div className={styles.metricFoot}><Link to="/appointments">Ver agenda<ArrowRight size={15} aria-hidden="true" /></Link></div></section>
      <section className={styles.metricCard} aria-label="Existencias por revisar"><div className={styles.metricLabel}><span>Existencias por revisar</span><span className={`${styles.metricIcon} ${supplies.length ? styles.amberIcon : ''}`}><Package size={19} aria-hidden="true" /></span></div><div className={styles.metricValue}><strong>{supplies.length}</strong><span>{supplies.length === 1 ? 'medicamento' : 'medicamentos'}</span></div><p>{supplies.length ? 'Cantidad baja, discrepancia o conteo pendiente.' : 'Sin avisos de existencias.'}</p><div className={styles.metricFoot}><Link to="/medications">Revisar tratamiento<ArrowRight size={15} aria-hidden="true" /></Link></div></section>
    </div>

    <div className={styles.contentGrid}><div className={styles.mainColumn}>
      <section className={styles.card} aria-labelledby={`${id}-doses`}><div className={styles.cardHeading}><div><h2 id={`${id}-doses`}>Tratamiento de hoy</h2><p>{metric.taken} de {metric.total} dosis declaradas como tomadas</p></div><div className={styles.segmented} aria-label="Filtrar dosis"><button type="button" aria-pressed={doseFilter === 'all'} onClick={() => setDoseFilter('all')}>Todas</button><button type="button" aria-pressed={doseFilter === 'pending'} onClick={() => setDoseFilter('pending')}>Por confirmar<span>{pending.length}</span></button></div></div>
        <div className={styles.doseProgress}><span>Avance del día</span><strong>{metric.dayPercent === null ? 'Sin programación' : `${metric.dayPercent}%`}</strong><div className={styles.progressTrack} role="progressbar" aria-label="Tomas confirmadas del día" aria-valuemin={0} aria-valuemax={metric.total || 1} aria-valuenow={metric.taken} aria-valuetext={`${metric.taken} de ${metric.total} dosis declaradas como tomadas`}><span style={{ width: `${metric.dayPercent ?? 0}%` }} /></div></div>
        {doses.length ? <ol className={styles.doseList}>{doses.map(dose => <DoseRow key={dose.id} dose={dose} />)}</ol> : <div className={styles.inlineEmpty}><Pill size={24} aria-hidden="true" /><p>{doseFilter === 'pending' ? 'No hay dosis por confirmar en esta jornada.' : 'No hay dosis programadas para esta jornada.'}</p></div>}
        {cancelled.length > 0 && <details className={styles.archivedDoses}><summary>{cancelled.length} {cancelled.length === 1 ? 'dosis cancelada' : 'dosis canceladas'} por la clínica<ChevronRight size={16} aria-hidden="true" /></summary><p>Se conservan para consultar los cambios de receta.</p><ol className={styles.doseList}>{cancelled.map(dose => <DoseRow key={dose.id} dose={dose} />)}</ol></details>}
        <div className={styles.cardFooter}><span>Las respuestas son declaraciones del paciente.</span><Link to="/medications">Ver tratamiento<ArrowRight size={16} aria-hidden="true" /></Link></div>
      </section>
      <PressureOverview key={view.patient.id} readings={view.pressures} />
    </div><div className={styles.sideColumn}>
      <section className={styles.card} aria-labelledby={`${id}-appointment`}><div className={styles.cardHeading}><div><h2 id={`${id}-appointment`}>Próxima consulta</h2><p>Agenda de la clínica</p></div><CalendarDays className={styles.headingIcon} size={22} aria-hidden="true" /></div>{appointment ? <div className={styles.appointmentBody}><div className={styles.appointmentDate}><span>{new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', day: '2-digit' }).format(new Date(appointment.startsAt))}</span><div><strong>{appointment.specialty}</strong><p>{date(appointment.startsAt)}</p></div></div><dl className={styles.appointmentFacts}><div><dt>Médico</dt><dd>{appointment.doctor}</dd></div><div><dt>Lugar</dt><dd>{appointment.location}</dd></div></dl><Link className={styles.outlineAction} to="/appointments">Ver citas del paciente<ArrowRight size={16} aria-hidden="true" /></Link></div> : <div className={styles.inlineEmpty}><CalendarDays size={24} aria-hidden="true" /><p>No hay citas próximas programadas.</p></div>}</section>
      <section className={styles.card} aria-labelledby={`${id}-attention`}><div className={styles.cardHeading}><div><h2 id={`${id}-attention`}>Para revisar</h2><p>Avisos de seguimiento</p></div><span className={styles.attentionCount}>{alerts.length + supplies.length}</span></div><div className={styles.attentionList}>{supplies.slice(0, 3).map(supply => {
        const medication = view.medications.find(m => m.id === supply.medicationId);
        const description = supply.state === 'UNKNOWN' ? 'Conteo inicial sin registrar.' : supply.state === 'DISCREPANCY' ? 'Hay una discrepancia en el conteo.' : supply.state === 'EMPTY' ? 'Sin unidades disponibles.' : `${supply.quantity} ${supply.unit} disponibles${supply.daysRemaining == null ? '.' : ` · estimación: ${supply.daysRemaining} días.`}`;
        return <article className={styles.stockNotice} key={supply.medicationId}><span className={styles.noticeIcon}><Package size={18} aria-hidden="true" /></span><div><h3>{medication?.name || 'Medicamento'}</h3><p>{description}</p><Link to="/medications">Revisar existencias<ChevronRight size={15} aria-hidden="true" /></Link></div></article>;
      })}{alerts.slice(0, 3).map(alert => <article key={alert.id} className={`${styles.stockNotice} ${alert.severity === 'CRITICAL' ? styles.criticalNotice : ''}`}><span className={styles.noticeIcon}><CircleAlert size={18} aria-hidden="true" /></span><div><h3>{alert.title}</h3><p>{alert.description}</p><small>{date(alert.timestamp)}</small></div></article>)}{!supplies.length && !alerts.length && <div className={styles.noAlerts}><ShieldCheck size={27} aria-hidden="true" /><strong>No hay avisos pendientes</strong><p>Los nuevos avisos aparecerán aquí con los registros del paciente.</p></div>}</div></section>
      <Link to="/reports" className={styles.reportCard}><span><FileHeart size={24} aria-hidden="true" /></span><div><strong>Un resumen para la consulta</strong><p>Revisa el informe de seguimiento.</p></div><ArrowRight size={18} aria-hidden="true" /></Link>
    </div></div>
  </div>;
}
