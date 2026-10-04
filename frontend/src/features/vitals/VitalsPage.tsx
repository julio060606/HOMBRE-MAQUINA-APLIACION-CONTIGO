import React, { useEffect, useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { useToast } from '../../context/ToastContext';
import { vitalsService, syncEvents } from '../../services/apiClient';
import { BloodPressureLog } from '../../types';
import { 
  Activity, 
  Plus, 
  TrendingUp, 
  Heart, 
  CheckCircle2, 
  AlertTriangle,
  Calendar,
  X,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';

export const VitalsPage: React.FC = () => {
  const { activePatient } = usePatient();
  const toast = useToast();
  const [logs, setLogs] = useState<BloodPressureLog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<'7D' | '30D' | 'ALL'>('7D');
  const [formError, setFormError] = useState<string | null>(null);
  
  // Manual Entry Form
  const [systolic, setSystolic] = useState(120);
  const [diastolic, setDiastolic] = useState(80);
  const [pulse, setPulse] = useState(72);
  const [notes, setNotes] = useState('');

  const loadVitals = () => {
    if (!activePatient) return;
    vitalsService.getBloodPressureLogs(activePatient.id).then(setLogs);
  };

  useEffect(() => {
    loadVitals();
    const unsub = syncEvents.subscribe(loadVitals);
    return unsub;
  }, [activePatient]);

  if (!activePatient) return null;

  // Filtrado por período
  const filteredLogs = logs.filter(log => {
    if (periodFilter === 'ALL') return true;
    const daysAgo = (Date.now() - new Date(log.recordedAt).getTime()) / (1000 * 3600 * 24);
    if (periodFilter === '7D') return daysAgo <= 7;
    if (periodFilter === '30D') return daysAgo <= 30;
    return true;
  });

  const chartData = [...filteredLogs].reverse().map(l => ({
    date: new Date(l.recordedAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
    time: new Date(l.recordedAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    sistolica: l.systolic,
    diastolica: l.diastolic,
    pulso: l.pulse || 70,
  }));

  const latestLog = logs[0] || null;
  const isLatestNormal = latestLog ? (latestLog.systolic <= 130 && latestLog.diastolic <= 85) : true;

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (systolic < 70 || systolic > 240) {
      setFormError('La presión sistólica debe encontrarse entre 70 y 240 mmHg.');
      return;
    }

    if (diastolic < 40 || diastolic > 150) {
      setFormError('La presión diastólica debe encontrarse entre 40 y 150 mmHg.');
      return;
    }

    if (pulse < 40 || pulse > 200) {
      setFormError('El pulso cardíaco debe encontrarse entre 40 y 200 bpm.');
      return;
    }

    try {
      const newLog = await vitalsService.addBloodPressureLog({
        patientId: activePatient.id,
        systolic,
        diastolic,
        pulse,
        recordedAt: new Date().toISOString(),
        recordedVia: 'CAREGIVER_WEB',
        notes: notes.trim() || 'Registro manual desde portal web',
      });

      if (newLog.status === 'CRITICAL' || newLog.status === 'HIGH') {
        toast.warning(
          'Presión Fuera de Rango Registrada',
          `Se registró ${systolic}/${diastolic} mmHg (Elevada). Se generó aviso clínico preventivo.`
        );
      } else {
        toast.success(
          'Medición Registrada con Éxito',
          `Presión ${systolic}/${diastolic} mmHg y pulso de ${pulse} bpm guardados correctamente.`
        );
      }

      setIsModalOpen(false);
      setNotes('');
      setFormError(null);
    } catch {
      toast.error('Error al Guardar', 'No se pudo guardar la medición biométrica.');
    }
  };

  return (
    <div className="space-y-6 font-sans antialiased">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.025)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-heading font-medium text-forest-700 uppercase tracking-wider">
              Telemetría y Signos Vitales
            </span>
          </div>
          <h1 className="text-2xl font-heading font-semibold text-slate-900 tracking-tight">
            Presión Arterial y Frecuencia Cardíaca
          </h1>
          <p className="text-xs text-slate-500 font-light mt-1">
            Histórico biométrico de <strong className="font-medium text-slate-700">{activePatient.fullName}</strong>. Líneas de referencia médicas en 120/80 mmHg.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
          data-testid="btn-add-bp-modal"
          className="inline-flex items-center justify-center gap-2 bg-forest-700 hover:bg-forest-800 text-white text-xs font-heading font-semibold uppercase tracking-wider px-5 py-3 rounded-2xl shadow-sm hover:shadow transition-all duration-200 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Medición Manual</span>
        </button>
      </div>

      {/* Tarjeta de Resumen Clínico Actual */}
      {latestLog && (
        <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
          isLatestNormal 
            ? 'bg-emerald-50/40 border-emerald-200/80' 
            : 'bg-rose-50/50 border-rose-200'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isLatestNormal ? 'bg-emerald-100 text-forest-700' : 'bg-rose-100 text-rose-700'
            }`}>
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-slate-400">
                Última Lectura Registrada
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-heading font-bold text-slate-900">
                  {latestLog.systolic} / {latestLog.diastolic}
                </span>
                <span className="text-xs text-slate-500 font-light">mmHg</span>
                <span className="text-slate-300 mx-1">·</span>
                <span className="text-sm font-heading font-semibold text-slate-700">
                  {latestLog.pulse || 72} bpm
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-heading font-semibold border ${
              isLatestNormal 
                ? 'bg-white text-emerald-800 border-emerald-300' 
                : 'bg-white text-rose-800 border-rose-300'
            }`}>
              {isLatestNormal ? '✓ Estado Normal' : '⚠ Fuera de Rango Estándar'}
            </span>
            <span className="text-xs text-slate-400 font-light hidden lg:inline">
              Canal: {latestLog.recordedVia === 'VOICE_PATIENT' ? 'Voz desde Móvil' : 'Web Cuidador'}
            </span>
          </div>
        </div>
      )}

      {/* Gráfico Evolutivo de Presión Arterial (Recharts) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.025)]">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900">
              Tendencia de Presión Arterial
            </h3>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Comparativa evolutiva de Presión Sistólica (Rojo) vs. Diastólica (Azul)
            </p>
          </div>

          {/* Filtro por Pestañas */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setPeriodFilter('7D')}
              className={`px-3 py-1 rounded-lg text-xs font-heading font-semibold transition-all ${
                periodFilter === '7D' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => setPeriodFilter('30D')}
              className={`px-3 py-1 rounded-lg text-xs font-heading font-semibold transition-all ${
                periodFilter === '30D' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Últimos 30 días
            </button>
            <button
              onClick={() => setPeriodFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-heading font-semibold transition-all ${
                periodFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todo
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              No hay lecturas registradas para este período.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} />
                <YAxis domain={[50, 160]} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} unit=" mmHg" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                
                {/* Líneas de Referencia Médica (Umbrales) */}
                <ReferenceLine y={120} stroke="#10B981" strokeDasharray="4 4" label={{ value: 'Norma Sistólica (120)', fill: '#10B981', fontSize: 10, position: 'right' }} />
                <ReferenceLine y={80} stroke="#3B82F6" strokeDasharray="4 4" label={{ value: 'Norma Diastólica (80)', fill: '#3B82F6', fontSize: 10, position: 'right' }} />

                <Line type="monotone" dataKey="sistolica" name="Sistólica" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4, fill: '#EF4444' }} />
                <Line type="monotone" dataKey="diastolica" name="Diastólica" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4, fill: '#3B82F6' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* Histórico Cronológico en Tabla */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.025)]">
        <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900 mb-4">
          Registro Histórico de Mediciones
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-heading font-semibold uppercase text-[10px]">
                <th className="pb-3">Fecha y Hora</th>
                <th className="pb-3">Presión (mmHg)</th>
                <th className="pb-3">Pulso (bpm)</th>
                <th className="pb-3">Canal de Entrada</th>
                <th className="pb-3">Estado Clínico</th>
                <th className="pb-3">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 font-medium text-slate-900">
                    {new Date(log.recordedAt).toLocaleString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 font-heading font-semibold text-slate-800">
                    {log.systolic} / {log.diastolic}
                  </td>
                  <td className="py-3 text-slate-600">
                    {log.pulse ? `${log.pulse} bpm` : '—'}
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      {log.recordedVia === 'VOICE_PATIENT' ? '🎤 Voz (Móvil)' : '💻 Web Cuidador'}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-heading font-semibold px-2.5 py-0.5 rounded-full ${
                      log.status === 'NORMAL' 
                        ? 'bg-emerald-50 text-forest-700' 
                        : log.status === 'HIGH' 
                        ? 'bg-amber-50 text-amber-800' 
                        : 'bg-rose-50 text-rose-700'
                    }`}>
                      {log.status === 'NORMAL' ? 'NORMAL' : log.status === 'HIGH' ? 'ELEVADA' : 'CRÍTICA'}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500 font-light truncate max-w-xs">
                    {log.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Registro Manual de Presión */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="font-heading font-semibold text-lg text-slate-900">
                  Registrar Medición Manual
                </h3>
                <p className="text-xs text-slate-500 font-light mt-0.5">
                  Ingrese la lectura tomada con tensiómetro para {activePatient.fullName}.
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

            <form onSubmit={handleAddLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Sistólica (mmHg) *
                  </label>
                  <input
                    type="number"
                    required
                    min="70"
                    max="240"
                    value={systolic}
                    onChange={e => setSystolic(Number(e.target.value))}
                    data-testid="input-systolic"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-heading font-semibold focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Normal: ~120</span>
                </div>

                <div>
                  <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Diastólica (mmHg) *
                  </label>
                  <input
                    type="number"
                    required
                    min="40"
                    max="150"
                    value={diastolic}
                    onChange={e => setDiastolic(Number(e.target.value))}
                    data-testid="input-diastolic"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-heading font-semibold focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Normal: ~80</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Frecuencia Cardíaca (bpm)
                </label>
                <input
                  type="number"
                  min="40"
                  max="200"
                  value={pulse}
                  onChange={e => setPulse(Number(e.target.value))}
                  data-testid="input-pulse"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-heading font-semibold focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Rango en reposo: 60 - 90 bpm</span>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Observaciones Clínicas (Opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ej: Tomada en reposo después del almuerzo"
                  data-testid="input-vitals-notes"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  data-testid="btn-save-vitals"
                  className="w-full bg-forest-700 hover:bg-forest-800 text-white font-heading font-semibold text-xs uppercase tracking-wider py-3.5 rounded-2xl transition-all shadow-sm hover:shadow active:scale-98"
                >
                  Guardar Medición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
