import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { usePatient } from '../../context/PatientContext';
import { useAction } from '../../hooks/useAction';
export function LinkPatientModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { linkNewPatient } = usePatient(), action = useAction();
  const [pin, setPin] = useState(''), [relationship, setRelationship] = useState('Hijo / Hija');
  return <Dialog open={isOpen} onClose={action.busy ? undefined : onClose} aria-labelledby="pairing-dialog-title" fullWidth maxWidth="sm">
    <DialogTitle id="pairing-dialog-title">Vincular a un paciente</DialogTitle>
    <form onSubmit={async e => { e.preventDefault(); if (await action.run(`${pin}:${relationship}`, () => linkNewPatient(pin, relationship))) { setPin(''); onClose(); } }}>
      <DialogContent><p className="text-slate-600 mb-5">El paciente genera un código en su app, en «Mi cuidador». Introduce ese código para vincularte a su registro existente.</p>
        <label className="block mb-5">PIN de 6 dígitos<input autoFocus required pattern="[0-9]{6}" inputMode="numeric" autoComplete="off" className="input mt-2 text-2xl font-mono tracking-widest" maxLength={6} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} data-testid="input-link-pin" /></label>
        <label className="block">Parentesco<select className="input mt-2" value={relationship} onChange={e => setRelationship(e.target.value)} data-testid="link-relationship">{['Hijo / Hija','Cónyuge / Pareja','Nieto / Nieta','Cuidador profesional','Hermano(a)'].map(r => <option key={r}>{r}</option>)}</select></label>
        {action.error && <p role="alert" className="text-rose-800 mt-4">{action.error}</p>}
        <p className="text-sm text-slate-600 mt-4">El código caduca a los 10 minutos y se utiliza una sola vez. Esta vinculación pertenece al entorno de demostración.</p>
      </DialogContent><DialogActions><button type="button" className="btn-secondary" disabled={action.busy} onClick={onClose}>Cancelar</button><button type="submit" className="btn-primary" disabled={action.busy} data-testid="btn-submit-link-patient">{action.busy ? 'Vinculando…' : 'Vincular paciente'}</button></DialogActions>
    </form>
  </Dialog>;
}
