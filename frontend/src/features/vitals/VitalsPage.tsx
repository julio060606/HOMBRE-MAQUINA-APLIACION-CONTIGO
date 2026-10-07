import { useState } from 'react';
import { PatientData, PageHeader } from '../../components/ui/PatientData';
import { useAuth } from '../../context/AuthContext';
import { MeasurementForm } from '../patient-app/MeasurementForm';
import { MeasurementCharts } from './MeasurementCharts';
export function VitalsPage() {
  const { user } = useAuth(); const [days, setDays] = useState(30);
  return <PatientData>{view => <>
    <PageHeader title="Gráficas y mediciones" description="Registros fechados y con procedencia. La última lectura se selecciona por fecha, sin valores de respaldo ficticios." />
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 mb-5 flex flex-wrap items-center gap-4 shadow-xs">
      <img
        src="/images/blood_pressure.jpg"
        alt="Control de presión arterial y pulso"
        className="w-24 h-20 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
      />
      <div className="flex-1 min-w-[220px]">
        <h3 className="font-heading font-bold text-slate-900 text-sm">Monitoreo Domiciliario de Signos Vitales</h3>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Presión arterial sistólica, diastólica y pulso registrados en casa. Las lecturas domésticas se mantienen separadas del peso y signos oficiales de la clínica.
        </p>
      </div>
    </div>
    <label className="block mb-5">Periodo <select className="input ml-2 max-w-xs" value={days} onChange={e => setDays(Number(e.target.value))}><option value={7}>Últimos 7 días</option><option value={30}>Últimos 30 días</option><option value={90}>Últimos 90 días</option></select></label>
    <MeasurementCharts view={view} days={days} />{user?.role === 'ROLE_PATIENT' && <div className="mt-5"><MeasurementForm actor={user} patientId={view.patient.id} /></div>}
  </>}</PatientData>;
}
