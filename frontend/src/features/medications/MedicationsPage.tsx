import React, { useEffect, useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { useToast } from '../../context/ToastContext';
import { medicationService, syncEvents } from '../../services/apiClient';
import { Medication } from '../../types';
import { 
  Pill, 
  Plus, 
  Clock, 
  Calendar, 
  Image as ImageIcon, 
  Power, 
  X,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const MedicationsPage: React.FC = () => {
  const { activePatient } = usePatient();
  const toast = useToast();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const [formError, setFormError] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [times, setTimes] = useState('08:00');
  const [durationDays, setDurationDays] = useState(30);
  const [instructions, setInstructions] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=60');

  const loadMedications = () => {
    if (!activePatient) return;
    medicationService.getMedications(activePatient.id).then(setMedications);
  };

  useEffect(() => {
    loadMedications();
    const unsub = syncEvents.subscribe(loadMedications);
    return unsub;
  }, [activePatient]);

  if (!activePatient) return null;

  const handleToggle = async (id: string, currentStatus: boolean, medName: string) => {
    await medicationService.toggleMedicationStatus(id);
    toast.info(
      currentStatus ? 'Tratamiento Pausado' : 'Tratamiento Reactivado',
      `Se ${currentStatus ? 'pausó' : 'reactivó'} ${medName} para el paciente.`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Por favor ingrese el nombre del medicamento.');
      return;
    }

    if (!dosage.trim()) {
      setFormError('Por favor especifique la dosis (ej: 50 mg, 1 tableta).');
      return;
    }

    try {
      await medicationService.saveMedication({
        patientId: activePatient.id,
        name: name.trim(),
        dosage: dosage.trim(),
        formFactor: 'TABLET',
        imageUrl,
        times: [times],
        frequencyType: 'DAILY',
        durationDays,
        startDate: new Date().toISOString().split('T')[0],
        instructions: instructions.trim() || 'Tomar según prescripción médica.',
        isActive: true,
      });

      toast.success(
        'Prescripción Guardada',
        `${name} (${dosage}) fue programado y sincronizado con el móvil del paciente.`
      );

      setIsModalOpen(false);
      setName('');
      setDosage('');
      setInstructions('');
      setFormError(null);
    } catch {
      toast.error('Error al Guardar', 'No se pudo registrar la prescripción. Intente de nuevo.');
    }
  };

  // Filtrado y búsqueda
  const filteredMedications = medications.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          med.dosage.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          med.instructions?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'ACTIVE') return matchesSearch && med.isActive;
    if (statusFilter === 'PAUSED') return matchesSearch && !med.isActive;
    return matchesSearch;
  });

  const activeCount = medications.filter(m => m.isActive).length;
  const pausedCount = medications.filter(m => !m.isActive).length;

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
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
          data-testid="btn-add-medication-modal"
          className="inline-flex items-center justify-center gap-2 bg-forest-700 hover:bg-forest-800 text-white text-xs font-heading font-semibold uppercase tracking-wider px-5 py-3 rounded-2xl shadow-sm hover:shadow transition-all duration-200 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Medicamento</span>
        </button>
      </div>

      {/* Barra de Búsqueda y Pestañas de Filtro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre, dosis o indicación..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Filtros por Pestañas */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            Todos ({medications.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all ${
              statusFilter === 'ACTIVE'
                ? 'bg-forest-700 text-white shadow-xs'
                : 'bg-emerald-50 text-forest-800 hover:bg-emerald-100'
            }`}
          >
            Activos ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('PAUSED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-heading font-semibold transition-all ${
              statusFilter === 'PAUSED'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Pausados ({pausedCount})
          </button>
        </div>

      </div>

      {/* Grid de Tarjetas de Medicamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {filteredMedications.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
            <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-heading font-semibold text-slate-900 text-base">No se encontraron medicamentos</h3>
            <p className="text-xs text-slate-500 font-light mt-1">
              {searchTerm 
                ? `No hay coincidencias para "${searchTerm}". Intente con otro término o limpie el filtro.`
                : 'No hay fármacos registrados en esta categoría.'}
            </p>
          </div>
        ) : (
          filteredMedications.map(med => (
            <div 
              key={med.id} 
              data-testid={`card-medication-${med.id}`}
              className={`bg-white rounded-3xl p-6 border shadow-[0_2px_12px_rgba(0,0,0,0.025)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between ${
                med.isActive ? 'border-slate-100/90' : 'border-slate-200/60 opacity-75 bg-slate-50/40'
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
                    <span className="font-heading font-semibold text-slate-900 font-mono">
                      {med.times.join(', ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 font-light">
                      <Calendar className="w-3.5 h-3.5 text-forest-700" /> Duración:
                    </span>
                    <span className="font-heading font-medium text-slate-800">
                      {med.durationDays} días ({med.frequencyType === 'DAILY' ? 'Diario' : 'Días específicos'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón de Pausar / Reanudar Tratamiento */}
              <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-light">
                  {med.isActive ? 'Sincronizado con móvil' : 'Inactivo en móvil'}
                </span>
                
                <button
                  onClick={() => handleToggle(med.id, med.isActive, med.name)}
                  data-testid={`btn-toggle-medication-${med.id}`}
                  className={`inline-flex items-center gap-1.5 text-xs font-heading font-semibold px-3 py-1.5 rounded-xl border transition-colors ${
                    med.isActive 
                      ? 'border-amber-200 text-amber-700 hover:bg-amber-50' 
                      : 'border-emerald-200 text-forest-700 hover:bg-emerald-50'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{med.isActive ? 'Pausar' : 'Reanudar'}</span>
                </button>
              </div>
            </div>
          ))
        )}

      </div>

      {/* Modal: Recetar Nuevo Medicamento (Optimizado para teclado físico) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="font-heading font-semibold text-lg text-slate-900">
                  Recetar Nuevo Medicamento
                </h3>
                <p className="text-xs text-slate-500 font-light mt-0.5">
                  Ingrese los datos clínicos. Se sincronizará inmediatamente con el móvil de {activePatient.fullName}.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nombre del Medicamento *
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
                    Dosis *
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
                    Hora de Toma (Formato Directo) *
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
                  min="1"
                  max="365"
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
                  className="w-full bg-forest-700 hover:bg-forest-800 text-white font-heading font-semibold text-xs uppercase tracking-wider py-3.5 rounded-2xl transition-all shadow-sm hover:shadow active:scale-98"
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
