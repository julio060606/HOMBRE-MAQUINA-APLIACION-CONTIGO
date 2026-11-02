import { useEffect, useId, useRef, useState } from 'react';
import { PhoneCall } from 'lucide-react';
import { User } from '../../types';
import { useAction } from '../../hooks/useAction';
import { serviceFor } from '../../services/apiClient';
import { speechService } from '../../services/speechService';

export function PatientHelp({ actor, patientId, voice }: { actor: User; patientId: string; voice: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const result = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const action = useAction();
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    else if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  useEffect(() => { if (recorded) result.current?.focus(); }, [recorded]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };
  return <>
    <button ref={trigger} type="button" className="btn-sos min-h-11 items-center gap-2" data-testid="patient-sos" aria-haspopup="dialog"
      onClick={() => { setRecorded(false); setOpen(true); }}><PhoneCall className="w-5 h-5 shrink-0" aria-hidden="true" /> SOS de prueba</button>
    <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId} className="patient-help-dialog rounded-2xl p-5 max-w-sm w-[calc(100%-2rem)] max-h-[85dvh] overflow-y-auto border-2 border-slate-700 bg-white text-slate-950"
      onCancel={event => { if (action.busy) event.preventDefault(); else close(); }} onClose={() => { setOpen(false); trigger.current?.focus(); }}>
      <h2 id={titleId} className="text-xl font-bold">SOS de demostración</h2>
      <p id={descriptionId} className="mt-3">Esta prueba registra una petición en Contigo. No llama a emergencias, no envía ubicación ni confirma que otra persona recibió el aviso.</p>
      {recorded ? <div className="space-y-3 mt-4">
        <p ref={result} tabIndex={-1} role="status" className="font-bold text-emerald-900">Petición de prueba registrada. No se contactó a servicios de emergencia.</p>
        <button type="button" className="btn-secondary w-full min-h-16" onClick={close}>Entendido, volver</button>
      </div> : <div className="space-y-3 mt-4">
        <p>Puedes cancelar antes de registrar. Una petición ya registrada permanece en el historial.</p>
        <button type="button" className="btn-secondary w-full min-h-16" disabled={action.busy} autoFocus onClick={close}>Cancelar y volver</button>
        <button type="button" className="btn-sos w-full min-h-16 items-center" data-testid="patient-sos-confirm" disabled={action.busy} onClick={async () => {
          if (await action.run(patientId, id => serviceFor(actor).sos(patientId, id))) {
            setRecorded(true);
            if (voice) speechService.speak('Petición de prueba registrada. No se contactó a servicios de emergencia.');
          }
        }}>{action.busy ? 'Registrando…' : 'Registrar petición de prueba'}</button>
        {action.error && <p role="alert">{action.error} Puedes volver a intentarlo o cancelar.</p>}
      </div>}
    </dialog>
  </>;
}
