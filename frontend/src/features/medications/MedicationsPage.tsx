import { PatientData, PageHeader } from '../../components/ui/PatientData';
import { MedicationImage } from '../../components/ui/MedicationImage';
import { SupplyForm } from './SupplyForm';
import { formatDate } from '../../domain/time';
export function MedicationsPage() {
  return <PatientData>{view => <><PageHeader title="Tratamiento y existencias" description="Recetas de origen clínico. La cantidad disponible es una estimación basada en dispensación, conteos y tomas declaradas." />
    <div className="grid xl:grid-cols-2 gap-5">{view.medications.map(m => {
      const stock = view.supplies.find(s => s.medicationId === m.id)!;
      return <article key={m.id} className="panel"><div className="flex flex-wrap justify-between gap-3"><h2 className="section-title">{m.name}</h2><span className="badge badge-neutral">{m.isActive ? 'Vigente en clínica' : 'Suspendido por clínica'}</span></div>
        <p className="text-lg font-semibold mt-3">{m.dosage} · {m.times.join(' / ')}</p><p className="text-slate-600 mt-2">{m.instructions}</p>
        <div className="my-4"><MedicationImage url={m.imageUrl} name={m.name} /></div>
        <p className="text-sm text-slate-600">Vigencia: {formatDate(m.startDate, false)} — {m.endDate ? formatDate(m.endDate, false) : 'Sin fecha final informada'}.</p>
        <p className="text-sm text-slate-600 mt-1">Fuente: clínica simulada · actualización {formatDate(m.syncedAt)}.</p>
        <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4"><h3 className="font-semibold">Cantidad disponible</h3>
          <p className="text-xl font-bold mt-2">{stock.quantity === null ? 'Cantidad no registrada' : stock.state === 'DISCREPANCY' ? 'Conteo requiere revisión' : `${stock.quantity} ${stock.unit}`}</p>
          <p className="text-sm text-slate-600 mt-2">{stock.daysRemaining === null ? 'No se puede estimar cobertura con los datos actuales.' : `Cobertura estimada: ${stock.daysRemaining} días según la pauta fija.`}</p>
          {['LOW','EMPTY','DISCREPANCY'].includes(stock.state) && <p className="mt-2 font-semibold text-amber-900">{stock.state === 'EMPTY' ? 'Sin unidades registradas. El tratamiento sigue vigente.' : stock.state === 'DISCREPANCY' ? 'La toma declarada no coincide con el conteo. Revise las existencias.' : 'Pocas unidades: revise la reposición.'}</p>}
        </section><SupplyForm medication={m} />
      </article>;
    })}</div>{!view.medications.length && <section className="panel">La clínica no ha proporcionado recetas para este paciente.</section>}
  </>}</PatientData>;
}
