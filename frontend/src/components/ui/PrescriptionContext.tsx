/** Clinical provenance is supplied by the prescription source, never inferred from the medication name. */
export function PrescriptionContext({ diagnosis, doctor }: { diagnosis?: string; doctor?: string }) {
  return <dl className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-base">
    <div><dt className="font-semibold text-slate-700">Diagnóstico indicado en la receta</dt><dd className="mt-1 text-slate-900">{diagnosis?.trim() || 'No informado por la clínica ficticia'}</dd></div>
    <div><dt className="font-semibold text-slate-700">Médico prescriptor</dt><dd className="mt-1 text-slate-900">{doctor?.trim() || 'No informado por la clínica ficticia'}</dd></div>
  </dl>;
}
