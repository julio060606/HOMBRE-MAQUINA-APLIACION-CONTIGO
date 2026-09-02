import React, { useEffect, useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { vitalsService } from '../../services/apiClient';
import { BloodPressureLog } from '../../types';
import { 
  Activity, 
  Plus, 
  TrendingUp, 
  Heart, 
  CheckCircle2, 
  X 
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
  const [logs, setLogs] = useState<BloodPressureLog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Manual Entry Form
  const [systolic, setSystolic] = useState(120);
  const [diastolic, setDiastolic] = useState(80);
  const [pulse, setPulse] = useState(72);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!activePatient) return;
    vitalsService.getBloodPressureLogs(activePatient.id).then(setLogs);
  }, [activePatient]);

  if (!activePatient) return null;

  const chartData = [...logs].reverse().map(l => ({
    date: new Date(l.recordedAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }),
    sistolica: l.systolic,
    diastolica: l.diastolic,
    pulso: l.pulse || 70,
  }));

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    await vitalsService.addBloodPressureLog({
      patientId: activePatient.id,
      systolic,
      diastolic,
      pulse,
      recordedAt: new Date().toISOString(),
      recordedVia: 'CAREGIVER_WEB',
      notes,
    });
    const updated = await vitalsService.getBloodPressureLogs(activePatient.id);
    setLogs(updated);
    setIsModalOpen(false);
    setNotes('');
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-light text-slate-950 tracking-tight">
            Registros y Tendencias de Presión Arterial
          </h1>
          <p className="text-xs text-slate-500 font-light mt-1">
            Histórico biométrico de {activePatient.fullName}. Monitoreo continuo de presión sistólica, diastólica y pulso.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          data-testid="btn-add-manual-vitals"
          className="bg-forest-700 hover:bg-forest-800 text-white text-xs font-heading font-medium uppercase tracking-wider px-6 py-3 shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Medición Manual</span>
        </button>
      </div>

      {/* Gráfico Interactivo de Presión Arterial (0 curvatura) */}
      <div className="bg-white p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-heading font-medium text-base text-slate-950 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-forest-700" />
              Evolución de Presión Arterial (Sistólica / Diastólica)
            </h3>
            <p className="text-xs text-slate-500 font-light">Líneas de referencia indican el estándar médico normotenso (120/80 mmHg).</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-heading font-semibold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-rose-600">
              <span className="w-2.5 h-2.5 bg-rose-600 inline-block"></span> Sistólica
            </span>
            <span className="flex items-center gap-1.5 text-blue-600">
              <span className="w-2.5 h-2.5 bg-blue-600 inline-block"></span> Diastólica
            </span>
          </div>
        </div>

        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Inter' }} />
              <YAxis domain={[50, 160]} tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Inter' }} />
              <Tooltip 
                contentStyle={{ border: '1px solid #cbd5e1', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontFamily: 'Plus Jakarta Sans', fontSize: 12 }} 
              />
              <ReferenceLine y={120} stroke="#16a34a" strokeDasharray="3 3" label={{ value: '120 Óptimo', fill: '#16a34a', fontSize: 10, fontFamily: 'Plus Jakarta Sans' }} />
              <ReferenceLine y={80} stroke="#2563eb" strokeDasharray="3 3" label={{ value: '80 Óptimo', fill: '#2563eb', fontSize: 10, fontFamily: 'Plus Jakarta Sans' }} />
              <Line type="monotone" dataKey="sistolica" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="diastolica" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de Registros Detallados (0 curvatura) */}
      <div className="bg-white p-6 border border-slate-200 shadow-sm">
        <h3 className="font-heading font-medium text-base text-slate-950 mb-4 pb-3 border-b border-slate-100">
          Histórico Cronológico de Mediciones
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] font-heading font-semibold text-slate-400 uppercase tracking-widest bg-slate-50">
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Presión (mmHg)</th>
                <th className="py-3 px-4">Pulso (bpm)</th>
                <th className="py-3 px-4">Canal de Registro</th>
                <th className="py-3 px-4">Estado Clínico</th>
                <th className="py-3 px-4">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {new Date(log.recordedAt).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 font-heading font-semibold text-slate-950 text-sm">
                    {log.systolic} / {log.diastolic}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {log.pulse || 72} bpm
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-light">
                    {log.recordedVia === 'VOICE_PATIENT' ? '🎤 Voz Móvil' : '💻 Teclado Cuidador'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-heading font-semibold uppercase tracking-wider px-2 py-0.5 ${
                      log.status === 'NORMAL' 
                        ? 'bg-emerald-100 text-forest-900 border border-emerald-300' 
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {log.status === 'NORMAL' ? 'Normal' : 'Elevada'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-light italic">
                    {log.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Registro Manual */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white max-w-md w-full p-6 shadow-xl border border-slate-300 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-heading font-medium text-slate-950">Registrar Signos Vitales</h3>
              <p className="text-xs text-slate-500 font-light">Ingresa la medición tomada con tensiómetro de brazo o muñeca.</p>
            </div>

            <form onSubmit={handleAddLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-heading font-medium text-slate-700 uppercase tracking-wider mb-1">
                    Sistólica (Alta)
                  </label>
                  <input
                    type="number"
                    required
                    min={60}
                    max={240}
                    value={systolic}
                    onChange={e => setSystolic(Number(e.target.value))}
                    data-testid="input-systolic"
                    className="w-full px-4 py-2.5 border border-slate-300 text-base font-heading font-bold text-center focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-heading font-medium text-slate-700 uppercase tracking-wider mb-1">
                    Diastólica (Baja)
                  </label>
                  <input
                    type="number"
                    required
                    min={40}
                    max={160}
                    value={diastolic}
                    onChange={e => setDiastolic(Number(e.target.value))}
                    data-testid="input-diastolic"
                    className="w-full px-4 py-2.5 border border-slate-300 text-base font-heading font-bold text-center focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-medium text-slate-700 uppercase tracking-wider mb-1">
                  Pulso (BPM)
                </label>
                <input
                  type="number"
                  min={40}
                  max={200}
                  value={pulse}
                  onChange={e => setPulse(Number(e.target.value))}
                  data-testid="input-pulse"
                  className="w-full px-4 py-2.5 border border-slate-300 text-sm font-heading font-semibold text-center focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-medium text-slate-700 uppercase tracking-wider mb-1">
                  Notas / Observaciones
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ej: Medición post-almuerzo"
                  className="w-full px-4 py-2.5 border border-slate-300 text-xs focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  data-testid="btn-save-vitals"
                  className="w-full bg-forest-700 hover:bg-forest-800 text-white font-heading font-medium text-xs uppercase tracking-wider py-3.5 transition shadow-sm"
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
