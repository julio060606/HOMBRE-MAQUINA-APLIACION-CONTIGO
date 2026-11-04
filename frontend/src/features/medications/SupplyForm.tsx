import { useEffect, useId, useRef, useState } from 'react';
import { Medication } from '../../types';
import { serviceFor } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useAction } from '../../hooks/useAction';
import { movementInput } from '../../domain/validation';
export function SupplyForm({ medication }: { medication: Medication }) {
  const { user } = useAuth(); const action = useAction();
  const [kind, setKind] = useState<'RESTOCK'|'ADJUSTMENT'>('RESTOCK'), [quantity, setQuantity] = useState(''), [reason, setReason] = useState('');
  const [saved, setSaved] = useState(false), [review, setReview] = useState(false);
  const [errors, setErrors] = useState<{ quantity?: string; reason?: string }>({});
  const heading = useRef<HTMLHeadingElement>(null), quantityField = useRef<HTMLInputElement>(null);
  const reasonField = useRef<HTMLInputElement>(null);
  const savedMessage = useRef<HTMLParagraphElement>(null);
  const id = useId();
  useEffect(() => { if (review) heading.current?.focus(); }, [review]);
  useEffect(() => { if (saved) savedMessage.current?.focus(); }, [saved]);
  if (user?.role !== 'ROLE_CAREGIVER') return null;
  const input = { kind, quantity: quantity.trim() ? Number(quantity) : NaN, reason };
  return <details className="mt-5 border-t border-slate-200 pt-4"><summary className="text-forest-800 cursor-pointer font-semibold">Registrar reposición o conteo físico</summary>
    <form className="grid gap-3 mt-4" noValidate onSubmit={e => {
      e.preventDefault(); setSaved(false);
      const result = movementInput.safeParse(input);
      if (!result.success) {
        const fields = result.error.flatten().fieldErrors;
        setErrors({ quantity: fields.quantity?.[0], reason: fields.reason?.[0] });
        (fields.quantity?.length ? quantityField : reasonField).current?.focus();
        return;
      }
      setErrors({}); setReview(true);
    }}>
      <p className="font-semibold">{review ? 'Paso 2 de 2: revisar y confirmar' : 'Paso 1 de 2: ingresar movimiento'}</p>
      {review ? <div className="space-y-3">
        <h3 ref={heading} tabIndex={-1} className="font-bold">Revisa el movimiento de {medication.name}</h3>
        <p>{kind === 'RESTOCK' ? 'Agregarás' : 'La cantidad disponible quedará en'} <strong>{quantity} {medication.stockUnit}</strong>.</p>
        <p>Motivo: {reason}</p><p>Al confirmar cambiará el registro de existencias. La receta no se modifica.</p>
        <button type="button" className="btn-secondary w-full" disabled={action.busy} onClick={() => { setReview(false); requestAnimationFrame(() => quantityField.current?.focus()); }}>Volver y corregir movimiento</button>
        <button type="button" className="btn-primary w-full" disabled={action.busy} data-testid={`supply-confirm-${medication.id}`} onClick={async () => {
          if (await action.run(JSON.stringify(input), operationId => serviceFor(user).moveSupply(medication.patientId, medication.id, input, operationId))) { setQuantity(''); setReason(''); setReview(false); setSaved(true); }
        }}>{action.busy ? 'Guardando…' : 'Confirmar y guardar movimiento'}</button>
      </div> : <>
      <label>Operación<select className="input mt-1" value={kind} onChange={e => { setKind(e.target.value as typeof kind); setErrors(current => ({ ...current, quantity: undefined })); setSaved(false); }}><option value="RESTOCK">Agregar cantidad comprada o recibida</option><option value="ADJUSTMENT">Registrar cantidad física disponible</option></select></label>
      <label>Cantidad en {medication.stockUnit}<input ref={quantityField} className="input mt-1" type="number" min="0" max="100000" step="any" required value={quantity} onChange={e => { setQuantity(e.target.value); setErrors(current => ({ ...current, quantity: undefined })); setSaved(false); }} aria-invalid={!!errors.quantity} aria-describedby={errors.quantity ? `${id}-quantity-error` : undefined} data-testid={`supply-quantity-${medication.id}`} /></label>
      {errors.quantity && <p id={`${id}-quantity-error`} role="alert" className="text-rose-900">{errors.quantity}</p>}
      <label>Motivo<input ref={reasonField} className="input mt-1" required minLength={3} maxLength={300} value={reason} onChange={e => { setReason(e.target.value); setErrors(current => ({ ...current, reason: undefined })); setSaved(false); }} aria-invalid={!!errors.reason} aria-describedby={`${id}-reason-hint${errors.reason ? ` ${id}-reason-error` : ''}`} data-testid={`supply-reason-${medication.id}`} /></label>
      <p id={`${id}-reason-hint`} className="text-sm text-slate-600">Escribe un motivo de 3 a 300 caracteres.</p>
      {errors.reason && <p id={`${id}-reason-error`} role="alert" className="text-rose-900">{errors.reason}</p>}
      <button className="btn-primary" data-testid={`supply-save-${medication.id}`}>Revisar movimiento</button>
      </>}
      <p className="text-sm text-slate-600">El conteo físico indica la cantidad que tiene ahora. La reposición agrega unidades. Esta operación no modifica la receta.</p>
      {action.error && <p role="alert" className="text-rose-800">{action.error}</p>}{saved && <p ref={savedMessage} tabIndex={-1} role="status" className="text-forest-800">Movimiento guardado en la demostración.</p>}
    </form>
  </details>;
}
