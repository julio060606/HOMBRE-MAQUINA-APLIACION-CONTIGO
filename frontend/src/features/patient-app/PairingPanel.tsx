import { useState } from 'react';
import { User } from '../../types';
import { serviceFor } from '../../services/apiClient';
import { useAction } from '../../hooks/useAction';
import { formatDate } from '../../domain/time';
import { useQuery } from '@tanstack/react-query';
export function PairingPanel({ actor, patientId }: { actor: User; patientId: string }) {
  const [code, setCode] = useState<{ pin: string; expiresAt: string } | null>(null), action = useAction();
  const links = useQuery({ queryKey: ['patient-caregivers', actor.id, actor.organizationId, patientId],
    queryFn: () => serviceFor(actor).caregivers(patientId), staleTime: 0, retry: false });
  return <section className="panel space-y-4"><h2 className="section-title">Vincular a mi cuidador</h2>
    <p>Genera un código y compártelo con tu familiar para que pueda consultar tu seguimiento en esta demostración.</p>
    <button className="btn-primary w-full" disabled={action.busy} data-testid="patient-generate-pin" onClick={() => void action.run(patientId, async () => { setCode(await serviceFor(actor).generatePin(patientId)); })}>{action.busy ? 'Generando…' : 'Generar un código de 10 minutos'}</button>
    {code && <div role="status"><p className="text-3xl font-mono font-bold tracking-widest text-center p-4 bg-forest-50 text-forest-950" data-testid="patient-pairing-pin">{code.pin}</p><p className="mt-3">Válido hasta {formatDate(code.expiresAt)}. Se utiliza una sola vez. Un nuevo código invalida el anterior.</p></div>}
    {action.error && <p role="alert" className="text-rose-800">{action.error}</p>}
    <h3 className="font-semibold border-t border-slate-200 pt-4">Cuidadores vinculados</h3>
    {links.error && <p role="alert">{links.error.message}</p>}
    {links.isPending && <p role="status">Consultando vínculos…</p>}
    {links.data?.map(link => <div key={link.userId} className="space-y-2"><p>{link.name} · {link.relationship}</p>
      <button className="btn-secondary w-full" disabled={action.busy} data-testid={`revoke-${link.userId}`} onClick={() => void action.run(`revoke:${link.userId}`, () => serviceFor(actor).revokeLink(patientId, link.userId))}>Retirar acceso de {link.name}</button>
    </div>)}
    {links.data?.length === 0 && <p>No tienes un cuidador vinculado en la demostración.</p>}
  </section>;
}
