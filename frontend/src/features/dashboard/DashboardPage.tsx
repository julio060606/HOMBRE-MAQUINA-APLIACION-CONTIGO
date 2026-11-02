import { CalendarDays, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PatientData } from '../../components/ui/PatientData';
import { PatientSummary } from './PatientSummary';
import styles from './Dashboard.module.css';
export function DashboardPage() {
  const today = new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  return <PatientData>{view => <div className={styles.page}><header className={styles.pageHeading}><div><p className={styles.eyebrow}>TU ESPACIO DE CUIDADO</p><h1>Seguimiento de {view.patient.fullName}</h1><p className={styles.introduction}>Lo importante de su día, en un solo lugar.</p></div><div className={styles.pageActions}><span><CalendarDays size={16} aria-hidden="true" />{today}</span><Link to="/reports"><FileText size={17} aria-hidden="true" />Ver informe</Link></div></header><PatientSummary key={view.patient.id} view={view} /></div>}</PatientData>;
}
