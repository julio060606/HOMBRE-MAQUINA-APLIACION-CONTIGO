import { PatientData, PageHeader } from '../../components/ui/PatientData';
import { PatientSummary } from './PatientSummary';
import { formatDate } from '../../domain/time';
export function DashboardPage() {
  return <PatientData>{view => <><PageHeader title={`Seguimiento de ${view.patient.fullName}`} description={`Datos clínicos de demostración · última carga de origen: ${formatDate(view.patient.lastSyncAt)}. La integración real con la clínica está pendiente.`} /><PatientSummary view={view} /></>}</PatientData>;
}
