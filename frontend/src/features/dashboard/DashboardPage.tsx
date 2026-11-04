import { useState } from 'react';
import { CalendarDays, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { PatientData } from '../../components/ui/PatientData';
import { PatientSummary } from './PatientSummary';
import styles from './Dashboard.module.css';

export function DashboardPage() {
  const client = useQueryClient();
  const [refreshing,setRefreshing] = useState(false);
  const [result,setResult] = useState('');
  const today = new Intl.DateTimeFormat('es-PE',{timeZone:'America/Lima',day:'numeric',month:'long'}).format(new Date());
  async function refresh() {
    if (refreshing) return;
    setRefreshing(true); setResult('');
    try {
      await client.refetchQueries({queryKey:['patient-view'],type:'active'},{throwOnError:true});
      setResult('Resumen actualizado.');
    } catch { setResult('No se pudo actualizar. Comprueba tu conexión y vuelve a intentarlo.'); }
    finally { setRefreshing(false); }
  }
  return <PatientData>{view=><div className={styles.page} data-testid="caregiver-dashboard">
    <header className={styles.pageHeading}><div><p className={styles.eyebrow}>Seguimiento diario</p><h1>Resumen del día</h1><p className={styles.introduction}>Lo importante para acompañar a {view.patient.fullName.split(' ')[0]}.</p></div><div className={styles.pageActions}><span><CalendarDays size={17} aria-hidden="true" />{today}</span><button type="button" disabled={refreshing} onClick={()=>void refresh()}><RefreshCw size={17} aria-hidden="true" className={refreshing?styles.spinner:undefined} />{refreshing?'Actualizando…':'Actualizar'}</button></div></header>
    <p role="status" className={result?styles.refreshResult:'sr-only'}>{result}</p>
    <PatientSummary key={view.patient.id} view={view} />
  </div>}</PatientData>;
}
