import { useEffect, useId, useRef, useState } from 'react';
import { Clock, CheckCircle2, ChevronDown, RotateCcw, XCircle } from 'lucide-react';
import { PillIntake, User } from '../../types';
import { DOSE_LABELS } from '../../components/ui/DoseList';
import { MedicationImage } from '../../components/ui/MedicationImage';
import { PrescriptionContext } from '../../components/ui/PrescriptionContext';
import { serviceFor } from '../../services/apiClient';
import { useAction } from '../../hooks/useAction';
import { speechService } from '../../services/speechService';
import styles from './DoseCard.module.css';

export function DoseCard({ dose, actor, voice = false, onRecorded }: {
  dose: PillIntake; actor: User; voice?: boolean; onRecorded?: (message: string) => void;
}) {
  const action = useAction();
  const [correcting, setCorrecting] = useState(false);
  const [reason, setReason] = useState('');
  const reasonInput = useRef<HTMLInputElement>(null);
  const correctionButton = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const correctionHintId = useId();
  const responded = dose.status === 'TAKEN' || dose.status === 'NOT_TAKEN';
  useEffect(() => { if (correcting) reasonInput.current?.focus(); }, [correcting]);

  async function respond(response: 'TAKEN' | 'NOT_TAKEN') {
    const input = { patientId: dose.patientId, doseId: dose.id, response, expectedVersion: dose.version,
      ...(correcting ? { correction: true, reason } : {}) };
    const success = await action.run(JSON.stringify(input), operationId => serviceFor(actor).respond({ ...input, operationId }));
    if (success) {
      setCorrecting(false);
      setReason('');
      onRecorded?.(`${dose.medicationName}, ${dose.scheduledTime}: ${response === 'TAKEN' ? 'registraste que la tomaste' : 'registraste que no la tomaste'}.`);
      if (voice) speechService.speak(response === 'TAKEN' ? 'Tu toma quedó registrada.' : 'Registramos que no tomaste esta dosis.');
    }
  }

  return <article className={styles.card} data-testid={`dose-${dose.id}`} aria-labelledby={titleId} aria-busy={action.busy}>
    <div className={styles.topline}>
      <p className={styles.time}><Clock size={17} aria-hidden="true" /><span><span className="sr-only">Hora programada: </span>{dose.scheduledTime}</span></p>
      <span className={`${styles.status} ${dose.status === 'TAKEN' ? styles.taken : dose.status === 'NOT_TAKEN' ? styles.notTaken : ''}`}>
        {dose.status === 'TAKEN' && <CheckCircle2 size={16} aria-hidden="true" />}
        {dose.status === 'NOT_TAKEN' && <XCircle size={16} aria-hidden="true" />}
        {DOSE_LABELS[dose.status]}
      </span>
    </div>
    <div className={styles.identity}>
      <div className={styles.heading}><h3 id={titleId}>{dose.medicationName}</h3><p><span>Dosis recetada</span><strong>{dose.dosage}</strong></p></div>
      <figure className={styles.photo}>
        <div className={styles.thumbnail}><MedicationImage name={dose.medicationName} url={dose.imageUrl} badgeText="" /></div>
        <figcaption>Foto de referencia</figcaption>
      </figure>
    </div>
    {dose.instructions && <p className={styles.instructions}>{dose.instructions}</p>}

    {responded && !correcting && <div className={styles.recorded}>
      <p role="status">{dose.status === 'TAKEN' ? <CheckCircle2 size={20} aria-hidden="true" /> : <XCircle size={20} aria-hidden="true" />}{dose.status === 'TAKEN' ? 'Toma confirmada' : 'Marcada como no tomada'}</p>
      <button ref={correctionButton} type="button" className={styles.secondary} aria-label={`Corregir respuesta de ${dose.medicationName} de las ${dose.scheduledTime}`} onClick={() => setCorrecting(true)}><RotateCcw size={18} aria-hidden="true" />Corregir</button>
    </div>}

    {correcting && <label className={styles.correction}>
      <span>Motivo de la corrección (obligatorio)</span>
      <input ref={reasonInput} className="input" value={reason} required maxLength={300} aria-describedby={correctionHintId} onChange={event => setReason(event.target.value)} placeholder="Por qué quieres cambiar la respuesta" />
      <span id={correctionHintId} className={styles.hint}>Escribe el motivo y elige la respuesta correcta. Cancelar conserva tu registro anterior.</span>
    </label>}

    {(!responded || correcting) && dose.status !== 'CANCELLED' && <div className={styles.actions}>
      <button type="button" className={`${styles.takenAction} min-h-[64px]`} disabled={action.busy || (correcting && !reason.trim())} onClick={() => void respond('TAKEN')} data-testid="dose-taken" aria-label={`Ya la tomé: ${dose.medicationName}, ${dose.scheduledTime}`}><CheckCircle2 size={21} aria-hidden="true" /><span>{action.busy ? 'Guardando…' : 'Ya la tomé'}</span></button>
      <button type="button" className={`${styles.notTakenAction} min-h-[64px]`} disabled={action.busy || (correcting && !reason.trim())} onClick={() => void respond('NOT_TAKEN')} data-testid="dose-not-taken" aria-label={`No la tomé: ${dose.medicationName}, ${dose.scheduledTime}`}><XCircle size={21} aria-hidden="true" /><span>{action.busy ? 'Guardando…' : 'No la tomé'}</span></button>
      {correcting && <button type="button" className={styles.cancel} disabled={action.busy} onClick={() => { setCorrecting(false); setReason(''); requestAnimationFrame(() => correctionButton.current?.focus()); }}>Cancelar corrección</button>}
    </div>}
    {action.error && <p role="alert" className={styles.error}>{action.error}</p>}

    <details className={styles.details}>
      <summary><span>Ver detalles del medicamento</span><ChevronDown size={18} aria-hidden="true" /></summary>
      <div><PrescriptionContext diagnosis={dose.diagnosis} doctor={dose.doctor} /></div>
    </details>
  </article>;
}
