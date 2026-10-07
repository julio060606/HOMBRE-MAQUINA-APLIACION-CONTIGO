import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePatient } from '../../context/PatientContext';
import { usePatientView } from '../../hooks/usePatientView';
import { DEMO_USERS } from '../../services/demo/state';
import { resetDemoData } from '../../services/demo/repository';
import { ENV } from '../../config/env';
import { Notice, PageHeader } from '../../components/ui/PatientData';
import { PhoneDeviceFrame } from '../../components/simulator/PhoneDeviceFrame';
import { PatientAppContent } from '../patient-app/PatientAppContent';
import { PatientSummary } from '../dashboard/PatientSummary';
import { formatDate } from '../../domain/time';
import { useAction } from '../../hooks/useAction';
import { simulateClinicalRefresh } from '../../services/demo/clinicalProvider';
export function PatientSimulatorPage() {
  const { activePatient } = usePatient(); const view = usePatientView();
  const [width, setWidth] = useState(390), action = useAction();
  if (!ENV.USE_MOCKS) return <Notice error>El laboratorio solo está disponible en modo demo.</Notice>;
  if (!activePatient) return <Notice>Seleccione un paciente autorizado en la barra superior.</Notice>;
  const actor = DEMO_USERS.find(u => u.role === 'ROLE_PATIENT' && u.patientId === activePatient.id);
  if (!actor) return <Notice error>No hay un actor paciente de prueba para este registro.</Notice>;
  return <><PageHeader title="Laboratorio de la app paciente" description="Prueba una app funcional y consulta el mismo estado como cuidador. Esta vista trabaja exclusivamente con datos sintéticos." />
    <section className="panel flex flex-wrap gap-4 items-center mb-6"><label>Ancho del teléfono <select className="input ml-2 max-w-28" value={width} onChange={e => setWidth(Number(e.target.value))}>{[360,390,430].map(n => <option key={n} value={n}>{n} px</option>)}</select></label>
      <Link to="/login" target="_blank" rel="noopener noreferrer" className="btn-secondary">Abrir otra pestaña y entrar como paciente</Link>
      <button className="btn-secondary" disabled={action.busy} data-testid="lab-clinic-refresh" onClick={() => void action.run(`clinic:${activePatient.id}`, () => simulateClinicalRefresh(activePatient.id))}>Simular actualización de la clínica</button>
      <button className="btn-secondary" disabled={action.busy} onClick={() => { if (window.confirm('¿Reiniciar únicamente los datos sintéticos de la demostración? Esto elimina sus registros de prueba.')) void action.run('reset', () => resetDemoData()); }}>Reiniciar demostración</button>
      {action.error && <p role="alert">{action.error}</p>}
    </section><div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
      <section className="min-w-0">
        <h2 className="section-title mb-3">Paciente: {activePatient.fullName}</h2>
        <PhoneDeviceFrame width={width}>
          <PatientAppContent key={activePatient.id} actor={actor} patientId={activePatient.id} />
        </PhoneDeviceFrame>
      </section>
      <section className="min-w-0"><h2 className="section-title mb-3">Vista del cuidador</h2>{view.data ? <PatientSummary view={view.data} compact /> : <Notice>{view.error?.message || 'Cargando seguimiento…'}</Notice>}
        <div className="panel mt-5"><h2 className="section-title">Eventos registrados</h2><ul className="mt-4 space-y-3 text-sm">{view.data?.audit.map(event => <li key={event.id}><strong>{event.kind}</strong><p>{event.detail}</p><p className="text-slate-600">{formatDate(event.recordedAt)} · {event.actorId}</p></li>)}</ul>{!view.data?.audit.length && <p className="mt-3 text-slate-600">Registre una toma o medición para ver su evento.</p>}</div>
      </section>
    </div>
  </>;
}
