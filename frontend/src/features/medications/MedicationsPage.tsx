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
    <div className="space-y-6 font-sans antialiased">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.025)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-heading font-medium text-forest-700 uppercase tracking-wider">
              Gestión Farmacológica Activa
            </span>
          </div>
          <h1 className="text-2xl font-heading font-semibold text-slate-900 tracking-tight">
            Pastillero y Programación de Recetas
          </h1>
          <p className="text-xs text-slate-500 font-light mt-1">
            Fármacos activos para <strong className="font-medium text-slate-700">{activePatient.fullName}</strong>. Sincronización instantánea con su dispositivo móvil.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          data-testid="btn-add-medication-modal"
          className="inline-flex items-center justify-center gap-2 bg-forest-700 hover:bg-forest-800 text-white text-xs font-heading font-semibold uppercase tracking-wider px-5 py-3 rounded-2xl shadow-sm hover:shadow transition-all duration-200 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Medicamento</span>
        </button>
      </div>

      {/* Grid de Tarjetas de Medicamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {medications.map(med => (
          <div 
            key={med.id} 
            data-testid={`card-medication-${med.id}`}
            className={`bg-white rounded-3xl p-6 border shadow-[0_2px_12px_rgba(0,0,0,0.025)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between ${
              med.isActive ? 'border-slate-100/90' : 'border-slate-200/60 opacity-70 bg-slate-50/40'
            }`}
          >
            <div>
              {/* Foto de la Pastilla + Estado */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 flex-shrink-0 flex items-center justify-center shadow-xs">
                  {med.imageUrl ? (
                    <img src={med.imageUrl} alt={med.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-heading font-semibold text-base text-slate-900 truncate">{med.name}</h3>
                    <span className={`text-[10px] font-heading font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ${
                      med.isActive 
                        ? 'bg-emerald-50 text-forest-800 border border-emerald-200/60' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {med.isActive ? 'ACTIVO' : 'PAUSADO'}
                    </span>
                  </div>
                  
                  <div className="text-xs font-heading font-semibold text-forest-700 mt-0.5">{med.dosage}</div>
                  
                  <p className="text-xs text-slate-500 font-light mt-1.5 line-clamp-2 leading-relaxed">
                    {med.instructions || 'Sin observaciones médicas registradas.'}
                  </p>
                </div>
              </div>

              {/* Horarios y Frecuencia */}
              <div className="bg-slate-50/70 rounded-2xl p-4 space-y-2.5 text-xs text-slate-700 border border-slate-100/80">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500 font-light">
                    <Clock className="w-3.5 h-3.5 text-forest-700" /> Horario(s):
                  </span>
                  <strong className="font-heading font-semibold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-100 shadow-xs">
                    {med.times.join(', ')}
                  </strong>
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
            <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-light">
                {med.durationDays ? `${med.durationDays} días prescritos` : 'Tratamiento continuo'}
              </span>

              <button
                onClick={() => handleToggle(med.id)}
                data-testid={`btn-toggle-med-${med.id}`}
                className={`text-xs font-heading font-medium tracking-wide py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs ${
                  med.isActive 
                    ? 'text-amber-800 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/60' 
                    : 'text-forest-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/60'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{med.isActive ? 'Pausar' : 'Reanudar'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Alta de Medicamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white max-w-lg w-full p-6 sm:p-7 rounded-3xl shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-forest-700 flex items-center justify-center mb-3">
                <Pill className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-slate-900">Recetar Nuevo Medicamento</h3>
              <p className="text-xs text-slate-500 font-light mt-0.5">
                Ingresa los datos del fármaco para programar las alertas asistidas del paciente.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nombre del Medicamento
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Losartán Potásico, Atorvastatina"
                  data-testid="input-med-name"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Dosis
                  </label>
                  <input
                    type="text"
                    required
                    value={dosage}
                    onChange={e => setDosage(e.target.value)}
                    placeholder="Ej: 50 mg, 1 tableta"
                    data-testid="input-med-dosage"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hora de Toma
                  </label>
                  <input
                    type="time"
                    required
                    value={times}
                    onChange={e => setTimes(e.target.value)}
                    data-testid="input-med-time"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Duración del Tratamiento (Días)
                </label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={e => setDurationDays(Number(e.target.value))}
                  placeholder="30"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Indicaciones Médicas
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="Ej: Tomar con alimentos después del desayuno"
                  data-testid="input-med-instructions"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Fotografía de Referencia (URL del Comprimido)
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  data-testid="btn-save-medication"
                  className="w-full bg-forest-700 hover:bg-forest-800 text-white font-heading font-semibold text-xs uppercase tracking-wider py-3.5 rounded-2xl transition-all shadow-sm hover:shadow"
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
