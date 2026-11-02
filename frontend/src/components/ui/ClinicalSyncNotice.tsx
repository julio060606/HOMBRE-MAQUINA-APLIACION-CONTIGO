import { ClinicalSyncState } from '../../services/contracts';
import { formatDate } from '../../domain/time';

export function ClinicalSyncNotice({ state }: { state?: ClinicalSyncState }) {
  if (!state || state.status === 'SYNCED') return null;
  return <div role="status" className="rounded-xl border border-amber-700 bg-amber-50 p-4 mb-5 text-amber-950">
    <p className="font-semibold">{state.status === 'FAILED' ? 'La última actualización desde la clínica ficticia falló.' : 'No se pudo verificar la actualización desde la clínica ficticia.'}</p>
    <p className="mt-2">Se muestran los datos guardados en CONTIGO. {state.lastSuccessfulSyncAt
      ? `Última actualización correcta: ${formatDate(state.lastSuccessfulSyncAt)}.` : 'La fecha de la última actualización correcta no está disponible.'}</p>
  </div>;
}
