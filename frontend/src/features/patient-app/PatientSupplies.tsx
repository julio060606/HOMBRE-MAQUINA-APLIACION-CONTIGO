import { PatientView } from '../../services/contracts';
export function PatientSupplies({ view }: { view: PatientView }) {
  return <section className="panel space-y-4"><h2 className="section-title">Mis medicamentos disponibles</h2>
    <p className="text-slate-600">Cantidad estimada según conteos, reposiciones y tomas declaradas.</p>
    {!view.medications.length && <p>No hay recetas recibidas de la clínica.</p>}
    {view.medications.map(m => {
      const stock = view.supplies.find(s => s.medicationId === m.id);
      return <div key={m.id} className="border-t border-slate-200 pt-3">
        <h3 className="font-semibold">{m.name}</h3>
        <p>{stock?.quantity === null || stock?.quantity === undefined ? 'Cantidad sin registrar' : stock.quantity < 0 ? 'Conteo pendiente de revisión' : `${stock.quantity} ${stock.unit}`}</p>
        {stock?.daysRemaining !== null && stock?.daysRemaining !== undefined && <p className="text-sm">Cobertura estimada: {stock.daysRemaining} días con la pauta fija.</p>}
        {stock?.state === 'EMPTY' && <p className="font-semibold">Sin unidades registradas. Pide a tu cuidador que revise la reposición.</p>}
        {stock?.state === 'LOW' && <p className="font-semibold">Quedan pocas unidades; revisa la reposición con tu cuidador.</p>}
        {stock?.state === 'DISCREPANCY' && <p>Las tomas declaradas y el conteo requieren revisión.</p>}
      </div>;
    })}
  </section>;
}
