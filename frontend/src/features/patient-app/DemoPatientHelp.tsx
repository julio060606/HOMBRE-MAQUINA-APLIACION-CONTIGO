import { useEffect, useId, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { User } from '../../types';
import { useAction } from '../../hooks/useAction';
import { serviceFor } from '../../services/apiClient';
import { speechService } from '../../services/speechService';
import { normalizeSosMessage, SOS_MESSAGE_LIMIT } from '../../services/sosMessage';
import { useAppDialogFrame } from '../../hooks/useAppDialogFrame';

type PatientHelpProps = { actor: User; patientId: string; voice: boolean };
const quickMessages = ['Prefiero comunicarme por escrito', 'No puedo hablar en este momento', 'Necesito ayuda para usar la aplicación'];

export function DemoPatientHelp(props: PatientHelpProps) {
  return <PatientHelpDialog key={`${props.actor.id}:${props.patientId}`} {...props} />;
}

function PatientHelpDialog({ actor, patientId, voice }: PatientHelpProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const result = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [message, setMessage] = useState('');
  const [attempted, setAttempted] = useState(false);
  const action = useAction();
  const titleId = useId();
  const descriptionId = useId();
  const messageId = useId();
  const messageHintId = useId();

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    else if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  useEffect(() => { if (recorded) result.current?.focus(); }, [recorded]);
  useAppDialogFrame(dialog, open);

  const close = () => {
    setOpen(false);
    setMessage('');
    trigger.current?.focus();
  };
  return <>
    <button ref={trigger} type="button" className="btn-sos min-h-11 items-center gap-2" data-testid="patient-sos" aria-haspopup="dialog"
      onClick={() => { setRecorded(false); setMessage(''); setAttempted(false); setOpen(true); }}><MessageSquare className="w-5 h-5 shrink-0" aria-hidden="true" /> SOS de prueba</button>
    <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId} className="patient-help-dialog rounded-2xl p-5 max-w-sm w-[calc(100%-2rem)] max-h-[85dvh] overflow-y-auto border-2 border-slate-700 bg-white text-slate-950"
      onCancel={event => { if (action.busy) event.preventDefault(); else close(); }} onClose={() => { setOpen(false); setMessage(''); trigger.current?.focus(); }}>
      <h2 id={titleId} className="text-xl font-bold">SOS de demostración</h2>
      <p id={descriptionId} className="mt-3">Esta prueba registra una petición en Contigo. No llama a emergencias, no envía ubicación ni confirma que otra persona recibió el aviso.</p>
      {recorded ? <div className="space-y-3 mt-4">
        <p ref={result} tabIndex={-1} role="status" className="font-bold text-emerald-900">Petición de prueba registrada. No se contactó a servicios de emergencia.</p>
        {message.trim() && <div className="rounded-xl border border-slate-500 p-3"><p className="font-semibold">Mensaje registrado para tu cuidador</p><p className="whitespace-pre-wrap">{message.trim()}</p></div>}
        <button type="button" className="btn-secondary w-full min-h-16" onClick={close}>Entendido, volver</button>
      </div> : <div className="space-y-3 mt-4">
        <p>Puedes cancelar antes de registrar. Una petición ya registrada permanece en el historial.</p>
        <button type="button" className="btn-secondary w-full min-h-16" disabled={action.busy} autoFocus onClick={close}>Cancelar y volver</button>
        <p>Puedes escribir o elegir una frase; no necesitas hablar.</p>
        <fieldset disabled={action.busy} className="space-y-2 min-w-0">
          <legend className="font-semibold">Frases rápidas para el mensaje</legend>
          {quickMessages.map(text => <button key={text} type="button" className="btn-secondary w-full min-h-11 text-left" onClick={() => setMessage(text)}>{text}</button>)}
        </fieldset>
        <div className="space-y-2">
          <label htmlFor={messageId} className="font-semibold block">Mensaje para mi cuidador (opcional)</label>
          <textarea id={messageId} className="input min-h-28 resize-y" rows={3} maxLength={SOS_MESSAGE_LIMIT} value={message} disabled={action.busy} aria-describedby={messageHintId} onChange={event => setMessage(event.target.value)} />
          <p id={messageHintId} className="text-sm text-slate-700">{message.length} de {SOS_MESSAGE_LIMIT} caracteres. El texto queda en el aviso del panel; no confirma que tu cuidador lo haya leído.</p>
        </div>
        <button type="button" className="btn-sos w-full min-h-16 items-center" data-testid="patient-sos-confirm" disabled={action.busy} onClick={async () => {
          setAttempted(true);
          if (await action.run(JSON.stringify({ patientId, message: message.trim() }), id => serviceFor(actor).sos(patientId, id, normalizeSosMessage(message)))) {
            setRecorded(true);
            if (voice) speechService.speak('Petición de prueba registrada. No se contactó a servicios de emergencia.');
          }
        }}>{action.busy ? 'Registrando…' : 'Registrar petición de prueba'}</button>
        {attempted && action.error && <p role="alert">{action.error} Tu mensaje se conserva. Puedes volver a intentarlo o cancelar.</p>}
      </div>}
    </dialog>
  </>;
}
