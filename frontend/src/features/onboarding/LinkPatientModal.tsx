import React, { useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { patientService } from '../../services/apiClient';
import { Smartphone, X, CheckCircle2, ShieldCheck } from 'lucide-react';

interface LinkPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LinkPatientModal: React.FC<LinkPatientModalProps> = ({ isOpen, onClose }) => {
  const { setActivePatient, reloadPatients, linkNewPatient } = usePatient();
  const [pin, setPin] = useState('');
  const [relationship, setRelationship] = useState('Hijo / Hija');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) {
      setError('El código PIN debe tener exactamente 6 dígitos.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      await linkNewPatient(pin);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Código de vinculación inválido o expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 font-sans">
      <div className="bg-white max-w-md w-full p-6 shadow-xl border border-slate-300 relative animate-in fade-in duration-150">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 bg-emerald-50 text-forest-700 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-medium text-base text-slate-950">Vincular Teléfono del Paciente</h3>
            <span className="text-[10px] text-slate-400 font-light">Sincronización segura mediante PIN</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 font-light leading-relaxed mb-4">
          Abre la aplicación CONTIGO en el celular del adulto mayor, ve a la sección <strong>"Vincular Cuidador"</strong> e introduce el código de 6 dígitos que aparece en su pantalla.
        </p>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLink} className="space-y-4">
          <div>
            <label className="block text-[10px] font-heading font-semibold text-slate-700 uppercase tracking-widest mb-1">
              Código PIN de 6 Dígitos
            </label>
            <input
              type="text"
              maxLength={6}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              data-testid="input-link-pin"
              className="w-full px-4 py-3 border border-slate-300 text-center font-mono text-xl tracking-[0.4em] font-semibold text-slate-900 focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none bg-slate-50"
            />
            <span className="text-[10px] text-slate-400 font-light block text-center mt-1">
              Ejemplo de demostración: usa <strong className="font-mono text-slate-700">123456</strong>
            </span>
          </div>

          <div>
            <label className="block text-[10px] font-heading font-semibold text-slate-700 uppercase tracking-widest mb-1">
              Parentesco con el Paciente
            </label>
            <select
              value={relationship}
              onChange={e => setRelationship(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 text-xs font-heading font-medium text-slate-800 focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none"
            >
              <option value="Hijo / Hija">Hijo / Hija</option>
              <option value="Cónyuge / Pareja">Cónyuge / Pareja</option>
              <option value="Nieto / Nieta">Nieto / Nieta</option>
              <option value="Enfermero(a) / Cuidador Profesional">Enfermero(a) / Cuidador Profesional</option>
              <option value="Hermano(a)">Hermano(a)</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              data-testid="btn-submit-link-patient"
              className="w-full bg-forest-700 hover:bg-forest-800 text-white font-heading font-medium text-xs uppercase tracking-wider py-3.5 transition shadow-sm"
            >
              <span>{isLoading ? 'Conectando...' : 'Completar Vinculación'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
