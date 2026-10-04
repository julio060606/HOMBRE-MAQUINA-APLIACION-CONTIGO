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
    <div className="space-y-6 font-sans antialiased">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.025)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-xs font-heading font-medium text-rose-700 uppercase tracking-wider">
              Monitoreo Cardiovascular
            </span>
          </div>
          <h1 className="text-2xl font-heading font-semibold text-slate-900 tracking-tight">
            Registros y Tendencias de Presión Arterial
          </h1>
          <p className="text-xs text-slate-500 font-light mt-1">
            Histórico biométrico de <strong className="font-medium text-slate-700">{activePatient.fullName}</strong>. Monitoreo continuo de presión sistólica, diastólica y pulso.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          data-testid="btn-add-manual-vitals"
          className="inline-flex items-center justify-center gap-2 bg-forest-700 hover:bg-forest-800 text-white text-xs font-heading font-semibold uppercase tracking-wider px-5 py-3 rounded-2xl shadow-sm hover:shadow transition-all duration-200 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Medición</span>
        </button>
      </div>

      {/* Gráfico Interactivo de Presión Arterial */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.025)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-forest-700" />
              <span>Evolución de Presión Arterial</span>
            </h3>
            <p className="text-xs text-slate-400 font-light mt-0.5">
              Líneas punteadas indican el umbral clínico óptimo (120/80 mmHg).
            </p>
          </div>
          
          <div className="flex items-center gap-3 text-xs font-heading font-semibold">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Sistólica</span>
            </span>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span>Diastólica</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Inter' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis domain={[50, 160]} tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #f1f5f9', 
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px -2px rgba(0,0,0,0.06)', 
                  fontFamily: 'Plus Jakarta Sans', 
                  fontSize: 12 
                }} 
              />
              <ReferenceLine y={120} stroke="#10b981" strokeDasharray="4 4" label={{ value: '120 Óptimo', fill: '#10b981', fontSize: 10, fontFamily: 'Plus Jakarta Sans' }} />
              <ReferenceLine y={80} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: '80 Óptimo', fill: '#3b82f6', fontSize: 10, fontFamily: 'Plus Jakarta Sans' }} />
              <Line type="monotone" dataKey="sistolica" stroke="#e11d48" strokeWidth={3} dot={{ r: 4, fill: '#e11d48', strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="diastolica" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de Registros Detallados */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.025)]">
        <div className="mb-6 pb-4 border-b border-slate-100">
          <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900">
            Histórico Cronológico de Mediciones
          </h3>
          <p className="text-xs text-slate-400 font-light mt-0.5">
            Registro secuencial de valores de presión arterial y frecuencia cardíaca
          </p>
        </div>
        
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-heading font-semibold text-slate-400 uppercase tracking-widest bg-slate-50/70">
                <th className="py-3.5 px-4">Fecha y Hora</th>
                <th className="py-3.5 px-4">Presión (mmHg)</th>
                <th className="py-3.5 px-4">Pulso</th>
                <th className="py-3.5 px-4">Canal</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {new Date(log.recordedAt).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-heading font-bold text-slate-900 text-sm">{log.systolic}/{log.diastolic}</span>
                    <span className="text-[10px] text-slate-400 ml-1">mmHg</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {log.pulse || 72} bpm
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-light">
                    {log.recordedVia === 'VOICE_PATIENT' ? '🎤 Voz Móvil' : '💻 Teclado Cuidador'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-heading font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      log.status === 'NORMAL' 
                        ? 'bg-emerald-50 text-forest-800 border border-emerald-200/60' 
                        : 'bg-amber-50 text-amber-800 border border-amber-200/60'
                    }`}>
                      {log.status === 'NORMAL' ? 'Normal' : 'Elevada'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-light italic">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white max-w-md w-full p-6 sm:p-7 rounded-3xl shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-slate-900">Registrar Signos Vitales</h3>
              <p className="text-xs text-slate-500 font-light mt-0.5">
                Ingresa la medición obtenida con el tensiómetro digital.
              </p>
            </div>

            <form onSubmit={handleAddLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-heading font-bold text-center focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-heading font-bold text-center focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pulso Cardíaco (BPM)
                </label>
                <input
                  type="number"
                  min={40}
                  max={200}
                  value={pulse}
                  onChange={e => setPulse(Number(e.target.value))}
                  data-testid="input-pulse"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-heading font-semibold text-center focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Notas / Contexto
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ej: Reposo previo de 10 min, sentado"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  data-testid="btn-save-vitals"
                  className="w-full bg-forest-700 hover:bg-forest-800 text-white font-heading font-semibold text-xs uppercase tracking-wider py-3.5 rounded-2xl transition-all shadow-sm hover:shadow"
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
