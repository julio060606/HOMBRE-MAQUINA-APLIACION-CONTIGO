import { useEffect, useRef, useState } from 'react';
import { User } from '../../types';
import { serviceFor } from '../../services/apiClient';
import { useAction } from '../../hooks/useAction';
import { formatDate } from '../../domain/time';
import { useQuery } from '@tanstack/react-query';

type Caregiver = { userId: string; name: string; relationship: string };
export function PairingPanel({ actor, patientId }: { actor: User; patientId: string }) {
  const [code, setCode] = useState<{ pin: string; expiresAt: string } | null>(null);
  const [review, setReview] = useState<Caregiver | null>(null);
  const [message, setMessage] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const action = useAction();
  const links = useQuery({ queryKey: ['patient-caregivers', actor.id, actor.organizationId, patientId],
    queryFn: () => serviceFor(actor).caregivers(patientId), staleTime: 0, retry: false });

  useEffect(() => { if (review) reviewHeading.current?.focus(); }, [review]);
  return <section className="panel space-y-4">
    <h3 ref={heading} tabIndex={-1} className="section-title">Vincular a mi cuidador</h3>
    <p>Genera un código y compártelo con tu familiar para que pueda consultar tu seguimiento en esta demostración.</p>
    <button type="button" className="btn-primary w-full min-h-16" disabled={action.busy} data-testid="patient-generate-pin" onClick={() => void action.run(patientId, async () => { setCode(await serviceFor(actor).generatePin(patientId)); })}>{action.busy ? 'Generando…' : 'Generar un código de 10 minutos'}</button>
    {code && <div role="status"><p className="text-3xl font-mono font-bold tracking-widest text-center p-4 bg-forest-50 text-forest-950" data-testid="patient-pairing-pin"><output aria-label={`Código de vinculación: ${code.pin.split('').join(' ')}`}>{code.pin}</output></p><p className="mt-3">Válido hasta {formatDate(code.expiresAt)}. Se utiliza una sola vez. Si necesitas más tiempo, genera otro código; el anterior dejará de funcionar.</p></div>}
    {action.error && <p role="alert" className="text-rose-900">{action.error} Vuelve a intentarlo cuando tengas conexión.</p>}
    {message && <p role="status" className="font-semibold text-emerald-900">{message}</p>}
    <h4 className="font-semibold border-t border-slate-300 pt-4">Cuidadores vinculados</h4>
    {links.error && <div role="alert"><p>{links.error.message}</p><button type="button" className="btn-secondary min-h-11 mt-2" onClick={() => void links.refetch()}>Reintentar consulta de cuidadores</button></div>}
    {links.isPending && <p role="status">Consultando vínculos…</p>}
    {links.data?.map(link => <div key={link.userId} className="space-y-2">
      <p>{link.name} · {link.relationship}</p>
      <button type="button" className="btn-secondary w-full min-h-11" disabled={action.busy} data-testid={`revoke-${link.userId}`} onClick={() => { setMessage(''); setReview(link); }}>Retirar acceso de {link.name}</button>
    </div>)}
    {links.data?.length === 0 && <p>No tienes un cuidador vinculado en la demostración.</p>}
    {review && <section className="border-2 border-slate-700 rounded-xl p-3 space-y-3" aria-label="Revisión para retirar acceso">
      <h4 ref={reviewHeading} tabIndex={-1} className="font-bold">¿Retirar el acceso de {review.name}?</h4>
      <p>Esta persona dejará de consultar tu seguimiento. Puedes volver a vincularla con un código nuevo. Tus registros se conservan.</p>
      <button type="button" className="btn-secondary w-full min-h-11" disabled={action.busy} onClick={() => { setReview(null); requestAnimationFrame(() => heading.current?.focus()); }}>Cancelar y conservar acceso</button>
      <button type="button" className="btn-sos w-full min-h-16 items-center" disabled={action.busy} onClick={async () => {
        if (await action.run(`revoke:${review.userId}`, () => serviceFor(actor).revokeLink(patientId, review.userId))) {
          setMessage(`Se retiró el acceso de ${review.name}.`);
          setReview(null);
          void links.refetch();
          heading.current?.focus();
        }
      }}>{action.busy ? 'Retirando acceso…' : `Confirmar retiro de ${review.name}`}</button>
    </section>}
  </section>;
}
