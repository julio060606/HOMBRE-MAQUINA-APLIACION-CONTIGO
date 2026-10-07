import { PatientData, PageHeader } from '../../components/ui/PatientData';
import { formatDate } from '../../domain/time';
export function ClinicalProfilePage() {
  return <PatientData>{view => <><PageHeader title="Ficha clínica" description="Información de origen clínico. Los registros en casa conservan su propia procedencia y fecha." />
    <section className="panel"><h2 className="section-title">{view.patient.fullName}</h2><p className="mt-2">{view.patient.age} años · paciente de demostración</p><p className="text-slate-600 mt-2">{view.profile?.notes}</p>
      <dl className="grid sm:grid-cols-3 gap-5 mt-6"><div><dt className="eyebrow">Talla en clínica</dt><dd className="metric">{view.profile?.heightCm !== undefined ? `${view.profile.heightCm} cm` : 'No registrada'}</dd></div><div><dt className="eyebrow">Peso en clínica</dt><dd className="metric">{view.profile?.weightKg !== undefined ? `${view.profile.weightKg} kg` : 'No registrado'}</dd></div><div><dt className="eyebrow">Fecha de evaluación</dt><dd className="mt-3 font-semibold">{view.profile ? formatDate(view.profile.measuredAt) : 'Sin evaluación'}</dd></div></dl>
    </section><section className="panel mt-5"><h2 className="section-title">Último peso registrado en casa</h2><p className="mt-3">{view.weights[0] ? `${view.weights[0].weightKg} kg · ${formatDate(view.weights[0].recordedAt)}` : 'El paciente aún no registró su peso en casa.'}</p></section>
  </>}</PatientData>;
}
