import { useEffect, useId, useRef, useState } from 'react';
import { PhoneCall, ShieldAlert, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { User } from '../../types';
import { ENV } from '../../config/env';
import { errorMessage } from '../../hooks/useAction';
import { useAppDialogFrame } from '../../hooks/useAppDialogFrame';
import { requestVibration } from '../../services/accessibleFeedback';
import { ApiError } from '../../services/http/apiTransport';
import { DemoPatientHelp } from './DemoPatientHelp';
import { LiveSupportConversation } from '../support/LiveSupportConversation';
import { supportApi, SupportSession } from '../support/supportApi';
import styles from './PatientHelp.module.css';

type Props = { actor: User; patientId: string; voice: boolean };

export function PatientHelp(props: Props) {
  return ENV.USE_MOCKS ? <DemoPatientHelp {...props} /> : <ConnectedPatientHelp key={`${props.actor.id}:${props.patientId}`} {...props} />;
}

function ConnectedPatientHelp({ actor, patientId }: Props) {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SupportSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const operation = useRef<string>();
  const lock = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const client = useQueryClient();
  const id = useId();
  useAppDialogFrame(dialog, open);

  useEffect(() => {
    if (open && !dialog.current?.open) { dialog.current?.showModal(); heading.current?.focus(); }
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);

  async function requestHelp() {
    if (lock.current) return;
    setOpen(true);
    if (session && session.status !== 'ENDED') return;
    lock.current = true;
    setBusy(true); setError('');
    operation.current ??= crypto.randomUUID();
    try {
      const created = await supportApi.create(patientId, operation.current);
      setSession(created); operation.current = undefined;
      requestVibration();
      void client.invalidateQueries({ queryKey: ['patient-view'] });
    } catch (cause) { setError(errorMessage(cause)); }
    finally { lock.current = false; setBusy(false); }
  }

  async function close() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (session && session.status !== 'ENDED') setSession(await supportApi.end(patientId, session.id));
      setOpen(false); trigger.current?.focus();
    } catch (cause) {
      if (cause instanceof ApiError && [401, 403, 404].includes(cause.status)) { setSession(null); setOpen(false); trigger.current?.focus(); }
      else setError(`${errorMessage(cause)} La solicitud sigue abierta. Vuelve a intentar finalizar.`);
    }
    finally { lock.current = false; setBusy(false); }
  }

  return <>
    <button ref={trigger} type="button" className={styles.trigger} data-testid="patient-sos" aria-haspopup="dialog" onClick={() => void requestHelp()}>
      <span className={styles.triggerIcon} aria-hidden="true"><ShieldAlert size={27} /></span>
      <span><strong>SOS · Pedir ayuda</strong><small>Avisar y comunicarme</small></span>
      <PhoneCall size={23} aria-hidden="true" />
    </button>
    <dialog ref={dialog} data-testid="sos-dialog" className={styles.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
      onCancel={event => { event.preventDefault(); void close(); }}
      onClose={() => { setOpen(false); trigger.current?.focus(); }}>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>Clínica de demostración</p><h2 ref={heading} tabIndex={-1} id={`${id}-title`}>Pedir ayuda</h2></div>
        <button type="button" className={styles.close} aria-label="Finalizar solicitud y cerrar" disabled={busy} onClick={() => void close()}><X size={22} aria-hidden="true" /></button>
      </header>
      <p id={`${id}-description`} className={styles.description}>Tu solicitud avisa al dashboard. Una persona conectada puede responder por voz o por escrito.</p>
      {busy && !session && <p role="status" className={styles.status}>Enviando tu solicitud…</p>}
      {error && <div role="alert" className={styles.error}><p>{error}</p>{!session && <button type="button" disabled={busy} onClick={() => void requestHelp()}>Reintentar envío</button>}</div>}
      {open && session && <LiveSupportConversation key={session.id} sessionId={session.id} patientId={patientId} actor={actor} stopping={busy}
        onEnded={() => setSession(current => current ? { ...current, status: 'ENDED' } : current)} />}
      <footer className={styles.footer}>
        <button type="button" className={styles.back} data-testid="support-end" disabled={busy} onClick={() => void close()}>{busy && session ? 'Finalizando…' : session && session.status !== 'ENDED' ? 'Finalizar y volver' : 'Volver a la aplicación'}</button>
        <p>Prototipo académico. No contacta servicios de emergencia.</p>
      </footer>
    </dialog>
  </>;
}
