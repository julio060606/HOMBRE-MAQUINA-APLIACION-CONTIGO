import { useState } from 'react';
import { Medication } from '../../types';
import { serviceFor } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useAction } from '../../hooks/useAction';
export function SupplyForm({ medication }: { medication: Medication }) {
  const { user } = useAuth(); const action = useAction();
  const [kind, setKind] = useState<'RESTOCK'|'ADJUSTMENT'>('RESTOCK'), [quantity, setQuantity] = useState(''), [reason, setReason] = useState('');
  const [saved, setSaved] = useState(false);
  if (user?.role !== 'ROLE_CAREGIVER') return null;
  return <details className="mt-5 border-t border-slate-200 pt-4"><summary className="text-forest-800 cursor-pointer font-semibold">Registrar reposición o conteo físico</summary>
    <form className="grid gap-3 mt-4" onSubmit={async e => {
      e.preventDefault(); setSaved(false);
      const input = { kind, quantity: quantity.trim() ? Number(quantity) : NaN, reason };
      if (await action.run(JSON.stringify(input), id => serviceFor(user).moveSupply(medication.patientId, medication.id, input, id))) { setQuantity(''); setReason(''); setSaved(true); }
    }}>
      <label>Operación<select className="input mt-1" value={kind} onChange={e => setKind(e.target.value as typeof kind)}><option value="RESTOCK">Agregar cantidad comprada o recibida</option><option value="ADJUSTMENT">Registrar cantidad física disponible</option></select></label>
      <label>Cantidad en {medication.stockUnit}<input className="input mt-1" type="number" min="0" step="any" required value={quantity} onChange={e => setQuantity(e.target.value)} data-testid={`supply-quantity-${medication.id}`} /></label>
      <label>Motivo<input className="input mt-1" required minLength={3} maxLength={300} value={reason} onChange={e => setReason(e.target.value)} data-testid={`supply-reason-${medication.id}`} /></label>
      <p className="text-sm text-slate-600">El conteo físico indica la cantidad que tiene ahora. Esta operación no modifica la receta.</p>
      {action.error && <p role="alert" className="text-rose-800">{action.error}</p>}{saved && <p role="status" className="text-forest-800">Movimiento guardado en la demostración.</p>}
      <button className="btn-primary" disabled={action.busy} data-testid={`supply-save-${medication.id}`}>{action.busy ? 'Guardando…' : 'Guardar movimiento'}</button>
    </form>
  </details>;
}
