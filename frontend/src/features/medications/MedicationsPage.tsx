import React, { useEffect, useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { medicationService } from '../../services/apiClient';
import { Medication } from '../../types';
import { 
  Pill, 
  Plus, 
  Clock, 
  Calendar, 
  Image as ImageIcon, 
  Power, 
  X
} from 'lucide-react';

export const MedicationsPage: React.FC = () => {
  const { activePatient } = usePatient();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [times, setTimes] = useState('08:00');
  const [durationDays, setDurationDays] = useState(30);
  const [instructions, setInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=60');

  useEffect(() => {
    if (!activePatient) return;
    medicationService.getMedications(activePatient.id).then(setMedications);
  }, [activePatient]);

  if (!activePatient) return null;

  const handleToggle = async (id: string) => {
    await medicationService.toggleMedicationStatus(id);
    const updated = await medicationService.getMedications(activePatient.id);
    setMedications(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await medicationService.saveMedication({
      patientId: activePatient.id,
      name,
      dosage,
      formFactor: 'TABLET',
      imageUrl,
      times: [times],
      frequencyType: 'DAILY',
      durationDays,
      startDate: new Date().toISOString().split('T')[0],
      instructions,
      isActive: true,
    });
    const updated = await medicationService.getMedications(activePatient.id);
    setMedications(updated);
    setIsModalOpen(false);
    setName('');
    setDosage('');
    setInstructions('');
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-light text-slate-950 tracking-tight">
            Pastillero y Programación de Recetas
          </h1>
          <p className="text-xs text-slate-500 font-light mt-1">
            Fármacos activos para {activePatient.fullName}. Sincronización en tiempo real con el teléfono del paciente.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          data-testid="btn-add-medication-modal"
          className="bg-forest-700 hover:bg-forest-800 text-white text-xs font-heading font-medium uppercase tracking-wider px-6 py-3 shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Medicamento</span>
        </button>
      </div>

      {/* Grid de Tarjetas de Medicamentos (0 curvatura) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medications.map(med => (
          <div 
            key={med.id} 
            data-testid={`card-medication-${med.id}`}
            className={`bg-white p-5 border shadow-sm flex flex-col justify-between transition-all ${
              med.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50/50'
            }`}
          >
            <div>
              {/* Foto de la Pastilla + Estado */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="w-20 h-20 bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0 flex items-center justify-center">
                  {med.imageUrl ? (
                    <img src={med.imageUrl} alt={med.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-semibold text-sm text-slate-950">{med.name}</h3>
                    <span className={`text-[9px] font-heading font-semibold px-2 py-0.5 uppercase tracking-wider ${
                      med.isActive ? 'bg-emerald-100 text-forest-900 border border-emerald-300' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {med.isActive ? 'ACTIVO' : 'PAUSADO'}
                    </span>
                  </div>
                  <div className="text-xs font-heading font-medium text-forest-700 mt-0.5">{med.dosage}</div>
                  <p className="text-xs text-slate-500 font-light mt-1 line-clamp-2 leading-relaxed">
                    {med.instructions || 'Sin observaciones médicas.'}
                  </p>
                </div>
              </div>

              {/* Horarios y Frecuencia */}
              <div className="bg-slate-50 p-3.5 space-y-2 text-xs text-slate-700 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500 font-light">
                    <Clock className="w-3.5 h-3.5 text-forest-700" /> Horario(s):
                  </span>
                  <strong className="font-heading font-semibold text-slate-900">{med.times.join(', ')}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500 font-light">
                    <Calendar className="w-3.5 h-3.5 text-forest-700" /> Frecuencia:
                  </span>
                  <span className="font-medium text-slate-800">
                    {med.frequencyType === 'DAILY' ? 'Todos los días' : 'Días específicos'}
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => handleToggle(med.id)}
                data-testid={`btn-toggle-med-${med.id}`}
                className={`text-xs font-heading font-medium uppercase tracking-wider py-1.5 px-3.5 transition flex items-center gap-1.5 ${
                  med.isActive 
                    ? 'text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300' 
                    : 'text-forest-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{med.isActive ? 'Pausar Tratamiento' : 'Reanudar'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Alta de Medicamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white max-w-lg w-full p-6 shadow-xl border border-slate-300 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-heading font-medium text-slate-950">Recetar Nuevo Medicamento</h3>
              <p className="text-xs text-slate-500 font-light">Completa los datos del fármaco para programar las alarmas del paciente.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-heading font-medium text-slate-700 uppercase tracking-wider mb-1">
                  Nombre del Medicamento
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Losartán, Enalapril, Vitamina C"
                  data-testid="input-med-name"
                  className="w-full px-4 py-2.5 border border-slate-300 text-xs focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-heading font-medium text-slate-700 uppercase tracking-wider mb-1">
                    Dosis
                  </label>
                  <input
                    type="text"
                    required
                    value={dosage}
                    onChange={e => setDosage(e.target.value)}
                    placeholder="Ej: 50 mg, 1 tableta"
                    data-testid="input-med-dosage"
                    className="w-full px-4 py-2.5 border border-slate-300 text-xs focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-heading font-medium text-slate-700 uppercase tracking-wider mb-1">
                    Hora de Toma
                  </label>
                  <input
                    type="time"
                    required
                    value={times}
                    onChange={e => setTimes(e.target.value)}
                    data-testid="input-med-time"
                    className="w-full px-4 py-2.5 border border-slate-300 text-xs font-mono focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-medium text-slate-700 uppercase tracking-wider mb-1">
                  Duración (Días)
                </label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={e => setDurationDays(Number(e.target.value))}
                  placeholder="30"
                  className="w-full px-4 py-2.5 border border-slate-300 text-xs focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-medium text-slate-700 uppercase tracking-wider mb-1">
                  Indicaciones Médicas
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="Ej: Tomar con alimentos después del almuerzo"
                  data-testid="input-med-instructions"
                  className="w-full px-4 py-2.5 border border-slate-300 text-xs focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-medium text-slate-700 uppercase tracking-wider mb-1">
                  Fotografía de Referencia (URL de Imagen)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-slate-300 text-xs text-slate-600 focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  data-testid="btn-save-medication"
                  className="w-full bg-forest-700 hover:bg-forest-800 text-white font-heading font-medium text-xs uppercase tracking-wider py-3.5 transition shadow-sm"
                >
                  Guardar y Sincronizar con el Móvil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
