import { useEffect, useId, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing, MessageSquare, PhoneIncoming, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePatient } from '../../context/PatientContext';
import { ENV } from '../../config/env';
import { subscribeToEvents } from '../../services/apiClient';
import { errorMessage } from '../../hooks/useAction';
import { ApiError } from '../../services/http/apiTransport';
import { LiveSupportConversation } from './LiveSupportConversation';
import { supportApi, SupportSession } from './supportApi';
import styles from './SupportInbox.module.css';

export function SupportInbox() {
  const { user } = useAuth();
  const { patients } = usePatient();
  const client = useQueryClient();
  const [selected, setSelected] = useState<SupportSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const patientIds = patients.map(patient => patient.id).sort().join(',');
  const query = useQuery({
    queryKey: ['support-inbox', user?.id, user?.organizationId, patientIds],
    enabled: !!user && !ENV.USE_MOCKS && user.role !== 'ROLE_PATIENT' && patients.length > 0,
    queryFn: async ({ signal }) => (await Promise.all(patients.map(patient => supportApi.list(patient.id, signal)))).flat(),
    retry: false, refetchInterval: 3000, refetchIntervalInBackground: true,
  });

  useEffect(() => {
    if (!user || ENV.USE_MOCKS || user.role === 'ROLE_PATIENT') return;
    const stops = patients.map(patient => subscribeToEvents(patient.id, type => {
      void client.invalidateQueries({ queryKey: ['support-inbox'] });
      if (type === 'REVOKED' || type === 'links') void client.invalidateQueries({ queryKey: ['patients'] });
    }));
    return () => stops.forEach(stop => stop());
  }, [client, patients, user]);

  useEffect(() => {
    if (selected && !dialog.current?.open) { dialog.current?.showModal(); title.current?.focus(); }
    if (!selected && dialog.current?.open) dialog.current.close();
  }, [selected]);

  if (!user || ENV.USE_MOCKS || user.role === 'ROLE_PATIENT') return null;
  const active = (query.data ?? []).filter(session => session.status !== 'ENDED');
  const waiting = active.filter(session => session.status === 'WAITING');

  async function attend(session: SupportSession, button: HTMLButtonElement) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); trigger.current = button;
    try {
      const accepted = session.status === 'ACCEPTED' ? session : await supportApi.accept(session.patientId, session.id);
      setSelected(accepted);
      void client.invalidateQueries({ queryKey: ['support-inbox'] });
      void client.invalidateQueries({ queryKey: ['patient-view'] });
    } catch (cause) { setError(errorMessage(cause)); void query.refetch(); }
    finally { lock.current = false; setBusy(false); }
  }

  async function close() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      if (selected && selected.status !== 'ENDED') await supportApi.end(selected.patientId, selected.id);
      setSelected(null); trigger.current?.focus();
      void client.invalidateQueries({ queryKey: ['support-inbox'] });
    } catch (cause) {
      if (cause instanceof ApiError && [401, 403, 404].includes(cause.status)) { setSelected(null); trigger.current?.focus(); void client.invalidateQueries({ queryKey: ['patients'] }); }
      else setError(`${errorMessage(cause)} Intenta finalizar de nuevo.`);
    }
    finally { lock.current = false; setBusy(false); }
  }

  return <>
    <section className={`${styles.inbox} ${waiting.length ? styles.urgent : ''} ${!active.length && !query.error ? styles.idle : ''}`} aria-labelledby={`${id}-inbox`} data-testid="support-inbox">
      <div className={styles.heading}><BellRing size={22} aria-hidden="true" /><div><h2 id={`${id}-inbox`}>Solicitudes SOS</h2><p role="status" aria-live="polite">{query.error ? 'No se pudo actualizar. Comprueba la conexión.' : waiting.length ? `${waiting.length} ${waiting.length === 1 ? 'paciente espera' : 'pacientes esperan'} respuesta` : active.length ? 'Conversaciones en atención' : query.isPending && patients.length ? 'Comprobando solicitudes…' : 'Sin solicitudes abiertas'}</p></div><span className={styles.demo}>Clínica de demostración</span></div>
      {query.error && <button type="button" className={styles.secondary} onClick={() => void query.refetch()}>Actualizar solicitudes</button>}
      {active.length > 0 && <ul className={styles.list}>{active.map(session => <li key={session.id} data-testid="support-request" data-session-id={session.id}>
        <div className={styles.requestInfo}><span className={styles.requestIcon} aria-hidden="true"><PhoneIncoming size={22} /></span><div><strong>{session.patientName || patients.find(patient => patient.id === session.patientId)?.fullName || 'Paciente'}</strong><p>{session.status === 'WAITING' ? 'Pide ayuda · voz o mensajes' : `Atiende: ${session.responderName || 'equipo de apoyo'}`}</p><time dateTime={session.createdAt}>{new Intl.DateTimeFormat('es-PE', { timeZone:'America/Lima', hour:'2-digit', minute:'2-digit' }).format(new Date(session.createdAt))}</time></div></div>
        {(session.status === 'WAITING' || session.responderId === user.id) && <button type="button" className={styles.attend} data-testid="support-accept" disabled={busy} onClick={event => void attend(session, event.currentTarget)}><MessageSquare size={19} aria-hidden="true" />{session.status === 'WAITING' ? 'Atender solicitud' : 'Volver a conversar'}</button>}
      </li>)}</ul>}
      {error && !selected && <p role="alert" className={styles.error}>{error}</p>}
    </section>
    <dialog ref={dialog} className={styles.dialog} data-testid="support-dialog" aria-labelledby={`${id}-title`} onCancel={event => { event.preventDefault(); void close(); }} onClose={() => setSelected(null)}>
      <header className={styles.dialogHeader}><div><p>Clínica de demostración</p><h2 ref={title} tabIndex={-1} id={`${id}-title`}>Atender a {selected?.patientName || 'paciente'}</h2></div><button type="button" className={styles.close} aria-label="Finalizar atención y cerrar" disabled={busy} onClick={() => void close()}><X size={22} aria-hidden="true" /></button></header>
      {selected && <LiveSupportConversation key={selected.id} sessionId={selected.id} patientId={selected.patientId} actor={user} stopping={busy} onEnded={() => setSelected(current => current ? { ...current, status:'ENDED' } : current)} />}
      {error && selected && <p role="alert" className={styles.error}>{error}</p>}
      <button type="button" className={styles.secondary} disabled={busy} onClick={() => void close()}>{busy ? 'Finalizando…' : selected?.status === 'ENDED' ? 'Cerrar conversación' : 'Finalizar atención y cerrar'}</button>
    </dialog>
  </>;
}
