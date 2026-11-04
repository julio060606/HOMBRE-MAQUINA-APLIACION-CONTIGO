import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, CheckCircle2, ChevronRight, CircleAlert, Clock3, FileHeart, HeartPulse, Package, Pill, RefreshCw, ShieldCheck, X } from 'lucide-react';
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
    <div className={styles.cardHeading}><div><h2 id={`${id}-heading`}>Presión registrada</h2><p>Lecturas guardadas · mmHg</p></div><div className={styles.segmented} role="group" aria-label="Periodo de mediciones">{[7, 30].map(value => <button key={value} type="button" aria-pressed={days === value} onClick={() => setDays(value)}>{value} días</button>)}</div></div>
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
  const [doseFilter,setDoseFilter] = useState<'all'|'pending'>(()=>view.today.some(dose=>dose.status==='PENDING'||dose.status==='UNCONFIRMED')?'pending':'all');
  const id = useId();
  const metric = adherence(view.today);
  const latest = newestFirst(view.pressures)[0];
  const weight = newestFirst(view.weights)[0];
  const showWeight = !!weight && (!latest || Date.parse(weight.recordedAt)>Date.parse(latest.recordedAt));
  const measurement = showWeight ? weight : latest;
  const appointment = [...view.appointments].filter(item=>item.status==='SCHEDULED' && Date.parse(item.startsAt)>=Date.now()).sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt))[0];
  const supplies = view.supplies.filter(item=>item.state!=='AVAILABLE').sort((a,b)=>Number(b.state==='EMPTY')-Number(a.state==='EMPTY'));
  const alerts = view.alerts.filter(item=>!item.isResolved).sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp));
  const critical = alerts.filter(item=>item.severity==='CRITICAL');
  const otherAlerts = alerts.filter(item=>item.severity!=='CRITICAL');
  const reviewCount = supplies.length+otherAlerts.length;
  const pending = view.today.filter(item=>item.status==='PENDING' || item.status==='UNCONFIRMED');
  const cancelled = view.today.filter(item=>item.status==='CANCELLED');
  const doses = [...(doseFilter==='pending'?pending:view.today.filter(item=>item.status!=='CANCELLED'))].sort((a,b)=>Date.parse(a.scheduledAt)-Date.parse(b.scheduledAt));
  const updated = view.clinicalSync?.status==='SYNCED';
  const photo = view.patient.id==='pat_001'?'/images/dacio_avatar.jpg':view.patient.id==='pat_002'?'/images/rosa_avatar.jpg':undefined;
  const initials = view.patient.fullName.split(' ').filter(Boolean).slice(0,2).map(word=>word[0]).join('');
  const notice = (alert:PatientView['alerts'][number])=><article key={alert.id} className={`${styles.stockNotice} ${alert.severity==='CRITICAL'?styles.criticalNotice:''}`}><span className={styles.noticeIcon}><CircleAlert size={19} aria-hidden="true" /></span><div><h3>{alert.title}</h3><p>{alert.description}</p><time dateTime={alert.timestamp}>{date(alert.timestamp)}</time></div></article>;

  return <div className={`${styles.summary} ${compact?styles.compact:''}`}>
    {!compact && <section className={styles.patientCard} aria-label="Paciente en seguimiento"><div className={styles.patientIdentity}>{photo?<img src={photo} alt="" className={styles.patientAvatar} />:<span className={styles.initials} aria-hidden="true">{initials}</span>}<div><span className={styles.patientLabel}>Paciente seleccionado</span><div className={styles.patientName}><h2>{view.patient.fullName}</h2><span>{view.patient.relationship || 'Paciente'}</span></div><p>{view.patient.age} años</p></div></div><div className={styles.patientActions}><Link to="/clinical-profile">Ver ficha clínica<ArrowRight size={17} aria-hidden="true" /></Link><details className={styles.syncSummary}><summary className={`${styles.syncBadge} ${!updated?styles.syncPending:''}`}>{updated?<CheckCircle2 size={16} aria-hidden="true" />:<RefreshCw size={16} aria-hidden="true" />}{updated?'Datos sincronizados':'Revisar sincronización'}</summary><p>Última carga clínica: {date(view.clinicalSync?.lastSuccessfulSyncAt || view.patient.lastSyncAt)}</p></details></div></section>}

    {critical.length>0 && <section className={styles.priorityCard} aria-labelledby={`${id}-priority`} data-testid="dashboard-priority"><div className={styles.priorityHeading}><CircleAlert size={23} aria-hidden="true" /><div><h2 id={`${id}-priority`}>Avisos prioritarios</h2><p>{critical.length} {critical.length===1?'aviso necesita':'avisos necesitan'} revisión</p></div></div><div className={styles.priorityList}>{critical.map(notice)}</div></section>}

    <div className={styles.overviewGrid} aria-label="Lo esencial del seguimiento">
      <section className={`${styles.overviewCard} ${styles.treatmentOverview}`} aria-labelledby={`${id}-treatment`}><div className={styles.overviewLabel}><span><Pill size={21} aria-hidden="true" /></span><h2 id={`${id}-treatment`}>Tomas de hoy</h2></div><strong className={styles.overviewValue}>{metric.taken}<span> de {metric.total}</span></strong><p>Declaradas como tomadas</p><div className={styles.overviewBottom}><span className={pending.length?styles.pendingText:styles.completeText}>Sin responder hoy: {pending.length}</span><Link to="/medications">Ver tratamiento<ArrowRight size={17} aria-hidden="true" /></Link></div></section>
      <section className={styles.overviewCard} aria-labelledby={`${id}-measurement`}><div className={styles.overviewLabel}><span className={styles.blueIcon}><HeartPulse size={21} aria-hidden="true" /></span><h2 id={`${id}-measurement`}>Última medición</h2></div><strong className={styles.overviewValue}>{measurement ? showWeight?`${weight.weightKg.toLocaleString('es-PE')} kg`:`${latest.systolic} / ${latest.diastolic}`:'Sin registros'}</strong><p>{measurement?showWeight?'Peso registrado':'Presión · mmHg':'Las lecturas aparecerán aquí.'}</p><div className={styles.overviewBottom}>{latest && !showWeight && <span>Pulso: {latest.pulse == null ? 'No registrado' : `${latest.pulse} lpm`}</span>}{measurement && <time dateTime={measurement.recordedAt}>{date(measurement.recordedAt)}</time>}<Link to="/vitals">Ver mediciones<ArrowRight size={17} aria-hidden="true" /></Link></div></section>
      <section className={styles.overviewCard} aria-labelledby={`${id}-appointment`}><div className={styles.overviewLabel}><span className={styles.blueIcon}><CalendarDays size={21} aria-hidden="true" /></span><h2 id={`${id}-appointment`}>Próxima cita</h2></div><strong className={styles.overviewValue}>{appointment?new Intl.DateTimeFormat('es-PE',{timeZone:'America/Lima',day:'numeric',month:'short'}).format(new Date(appointment.startsAt)):'Sin citas'}</strong><p>{appointment?appointment.specialty:'No hay citas próximas.'}</p><div className={styles.overviewBottom}>{appointment && <time dateTime={appointment.startsAt}>{new Intl.DateTimeFormat('es-PE',{timeZone:'America/Lima',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(appointment.startsAt))}</time>}<Link to="/appointments">Ver citas<ArrowRight size={17} aria-hidden="true" /></Link></div></section>
    </div>

    <div className={styles.contentGrid}>
      <section className={styles.card} aria-labelledby={`${id}-doses`}><div className={styles.cardHeading}><div><h2 id={`${id}-doses`}>Medicamentos de hoy</h2><p>Respuestas registradas por el paciente.</p></div><div className={styles.segmented} role="group" aria-label="Filtrar dosis"><button type="button" aria-pressed={doseFilter==='pending'} onClick={()=>setDoseFilter('pending')}>Por confirmar<span>{pending.length}</span></button><button type="button" aria-pressed={doseFilter==='all'} onClick={()=>setDoseFilter('all')}>Todas</button></div></div>
        {doses.length?<ol className={styles.doseList}>{doses.map(dose=><DoseRow key={dose.id} dose={dose} />)}</ol>:<div className={styles.inlineEmpty}><CheckCircle2 size={28} aria-hidden="true" /><strong>{metric.total?'No hay tomas por confirmar':'No hay tomas programadas hoy'}</strong><p>{metric.total?'Puedes consultar las respuestas en «Todas».':'Consulta el tratamiento para ver sus horarios.'}</p></div>}
        {cancelled.length>0 && <details className={styles.archivedDoses}><summary>{cancelled.length} {cancelled.length===1?'dosis cancelada':'dosis canceladas'} por la clínica<ChevronRight size={17} aria-hidden="true" /></summary><p>Se conserva el historial de cambios de receta.</p><ol className={styles.doseList}>{cancelled.map(dose=><DoseRow key={dose.id} dose={dose} />)}</ol></details>}
        <div className={styles.cardFooter}><span>El cuidador consulta; el paciente registra.</span><Link to="/medications">Tratamiento completo<ArrowRight size={17} aria-hidden="true" /></Link></div>
      </section>
      <section className={styles.card} aria-labelledby={`${id}-review`} data-testid="dashboard-followups"><div className={styles.cardHeading}><div><h2 id={`${id}-review`}>Para revisar</h2><p>{reviewCount?`${reviewCount} ${reviewCount===1?'pendiente de seguimiento':'pendientes de seguimiento'}`:'Al día con los avisos disponibles.'}</p></div><span className={styles.attentionCount} aria-label={`${reviewCount} avisos adicionales`}>{reviewCount}</span></div><div className={styles.attentionList}>{supplies.map(supply=>{
        const medication=view.medications.find(item=>item.id===supply.medicationId);
        const description=supply.state==='UNKNOWN'?'Falta registrar cuántas unidades hay.':supply.state==='DISCREPANCY'?'El conteo no coincide. Revisa las unidades.':supply.state==='EMPTY'?'No quedan unidades disponibles.':`${supply.quantity} ${supply.unit} disponibles${supply.daysRemaining==null?'.':` · estimación: ${supply.daysRemaining} días.`}`;
        return <article className={styles.stockNotice} key={supply.medicationId}><span className={styles.noticeIcon}><Package size={19} aria-hidden="true" /></span><div><h3>{medication?.name || 'Medicamento'}</h3><p>{description}</p><Link to="/medications">Revisar existencias<ArrowRight size={16} aria-hidden="true" /></Link></div></article>;
      })}{otherAlerts.map(notice)}{!reviewCount && <div className={styles.noAlerts}><ShieldCheck size={30} aria-hidden="true" /><strong>Sin avisos adicionales</strong><p>Las solicitudes SOS y los avisos prioritarios aparecen por separado.</p></div>}</div></section>
    </div>

    <details className={styles.secondaryDetails}><summary><HeartPulse size={23} aria-hidden="true" /><span><strong>Mediciones y evolución</strong><span>{latest?`Última presión: ${latest.systolic} / ${latest.diastolic} mmHg`:'Consulta las lecturas de presión disponibles.'}</span></span><ChevronRight size={20} aria-hidden="true" /></summary><div className={styles.secondaryBody}><PressureOverview key={view.patient.id} readings={view.pressures} /></div></details>
    <Link to="/reports" className={styles.reportCard}><span><FileHeart size={25} aria-hidden="true" /></span><div><strong>Preparar un informe</strong><p>Reúne los registros para la próxima consulta.</p></div><ArrowRight size={19} aria-hidden="true" /></Link>
  </div>;
}
