import { useEffect, useId, useRef, useState } from 'react';
import { Clock, CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { PillIntake, User } from '../../types';
import { DOSE_LABELS } from '../../components/ui/DoseList';
import { MedicationImage } from '../../components/ui/MedicationImage';
import { PrescriptionContext } from '../../components/ui/PrescriptionContext';
import { serviceFor } from '../../services/apiClient';
import { useAction } from '../../hooks/useAction';
import { speechService } from '../../services/speechService';

export function DoseCard({
  dose,
  actor,
  voice = false,
  onRecorded,
}: {
  dose: PillIntake;
  actor: User;
  voice?: boolean;
  onRecorded?: (message: string) => void;
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
    const input = {
      patientId: dose.patientId,
      doseId: dose.id,
      response,
      expectedVersion: dose.version,
      ...(correcting ? { correction: true, reason } : {}),
    };
    const success = await action.run(JSON.stringify(input), operationId =>
      serviceFor(actor).respond({ ...input, operationId })
    );
    if (success) {
      setCorrecting(false);
      setReason('');
      onRecorded?.(
        `${dose.medicationName}, ${dose.scheduledTime}: ${
          response === 'TAKEN' ? 'registraste que la tomaste' : 'registraste que no la tomaste'
        }.`
      );
      if (voice) {
        speechService.speak(
          response === 'TAKEN' ? 'Tu toma quedó registrada.' : 'Registramos que no tomaste esta dosis.'
        );
      }
    }
  }

  return (
    <article
      className="bg-white rounded-3xl border border-slate-100/90 shadow-sm p-4 sm:p-5 space-y-4 transition-all"
      data-testid={`dose-${dose.id}`}
      aria-labelledby={titleId}
      aria-busy={action.busy}
    >
      {/* Top row: scheduled time pill badge & optional status */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="inline-flex flex-wrap max-w-full min-w-0 items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm">
          <Clock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
          <span className="whitespace-nowrap">{dose.scheduledTime}</span>
        </div>
        {dose.status !== 'PENDING' && (
          <span
            className={`badge max-w-full ${
              dose.status === 'TAKEN'
                ? 'badge-good'
                : dose.status === 'NOT_TAKEN'
                ? 'badge-negative'
                : 'badge-neutral'
            }`}
            style={{ overflowWrap: 'anywhere' }}
          >
            {DOSE_LABELS[dose.status]}
          </span>
        )}
      </div>

      {/* Medication image with real photo badge */}
      <MedicationImage name={dose.medicationName} url={dose.imageUrl} />

      {/* Details: Title, dosage, instructions */}
      <div className="space-y-1">
        <h3 id={titleId} className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 tracking-tight">
          {dose.medicationName}
        </h3>
        <p className="text-slate-700 font-semibold text-sm">
          Dosis recetada: {dose.dosage}
        </p>
        {dose.instructions && (
          <p className="text-slate-500 text-sm leading-relaxed pt-0.5">
            {dose.instructions}
          </p>
        )}
      </div>

      <PrescriptionContext diagnosis={dose.diagnosis} doctor={dose.doctor} />

      {/* Status banner if already responded */}
      {responded && !correcting && (
        <div className={`rounded-2xl p-3 flex flex-wrap gap-3 items-center justify-between border ${dose.status === 'TAKEN' ? 'bg-emerald-50 border-emerald-300' : 'bg-rose-50 border-rose-300'}`}>
          <div className="flex items-center gap-2">
            {dose.status === 'TAKEN' ? <CheckCircle2 className="w-5 h-5 text-emerald-800 shrink-0" aria-hidden="true" /> : <XCircle className="w-5 h-5 text-rose-800 shrink-0" aria-hidden="true" />}
            <span className="text-slate-950 font-bold text-sm" role="status">
              {dose.status === 'TAKEN' ? 'Toma confirmada' : 'Marcada como no tomada'}
            </span>
          </div>
          <button
            type="button"
            ref={correctionButton}
            className="btn-secondary min-h-11 max-w-full flex flex-wrap items-center gap-2 cursor-pointer"
            aria-label={`Corregir respuesta de ${dose.medicationName} de las ${dose.scheduledTime}`}
            onClick={() => setCorrecting(true)}
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>Corregir</span>
          </button>
        </div>
      )}

      {/* Correction form */}
      {correcting && (
        <label className="block bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="font-semibold text-slate-700">Motivo de la corrección (obligatorio)</span>
          <input
            ref={reasonInput}
            className="input mt-1.5 text-sm"
            value={reason}
            required
            maxLength={300}
            aria-describedby={correctionHintId}
            onChange={e => setReason(e.target.value)}
            placeholder="Explique el motivo del cambio"
          />
          <span id={correctionHintId} className="block mt-2">Escribe por qué cambias tu respuesta. Después elige la respuesta correcta. Puedes cancelar para conservar el registro anterior.</span>
        </label>
      )}

      {/* Action buttons with equal accessibility and high visibility */}
      {(!responded || correcting) && dose.status !== 'CANCELLED' && (
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              className="w-full min-h-[64px] py-3.5 px-5 rounded-2xl bg-[#1b6b55] hover:bg-[#155644] active:scale-[0.99] text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 transition-all cursor-pointer disabled:opacity-50"
              disabled={action.busy || (correcting && !reason.trim())}
              onClick={() => void respond('TAKEN')}
              data-testid="dose-taken"
              aria-label={`Ya la tomé: ${dose.medicationName}, ${dose.scheduledTime}`}
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{action.busy ? 'Guardando…' : 'Ya la tomé'}</span>
            </button>

            <button
              type="button"
              className="w-full min-h-[64px] py-3.5 px-5 rounded-2xl bg-white hover:bg-rose-50 active:scale-[0.99] text-rose-800 font-bold text-base border-2 border-rose-300 hover:border-rose-400 flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              disabled={action.busy || (correcting && !reason.trim())}
              onClick={() => void respond('NOT_TAKEN')}
              data-testid="dose-not-taken"
              aria-label={`No la tomé: ${dose.medicationName}, ${dose.scheduledTime}`}
            >
              <span>No la tomé</span>
            </button>
          </div>

          {correcting && (
            <div className="flex justify-center">
              <button
                type="button"
                className="btn-secondary min-h-11"
                onClick={() => { setCorrecting(false); setReason(''); requestAnimationFrame(() => correctionButton.current?.focus()); }}
              >
                Cancelar corrección
              </button>
            </div>
          )}
        </div>
      )}

      {action.error && (
        <p role="alert" className="text-rose-700 text-xs font-semibold">
          {action.error}
        </p>
      )}
    </article>
  );
}
