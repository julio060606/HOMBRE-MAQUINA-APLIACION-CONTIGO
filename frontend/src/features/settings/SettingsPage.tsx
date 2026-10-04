import React, { useEffect, useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { settingsService, resetDemoData } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import { ClinicalSettings } from '../../types';
import { 
  Sliders, 
  Shield, 
  Bell, 
  Smartphone, 
  Download, 
  Save, 
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { activePatient } = usePatient();
  const toast = useToast();
  const [settings, setSettings] = useState<ClinicalSettings | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!activePatient) return;
    settingsService.getSettings(activePatient.id).then(setSettings);
  }, [activePatient]);

  if (!activePatient || !settings) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await settingsService.updateSettings(settings);
    setIsSaved(true);
    toast.success('Configuración Sincronizada', 'Los umbrales clínicos y reglas de alarma se guardaron correctamente.');
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleResetData = () => {
    if (window.confirm('¿Desea restablecer todos los datos simulados de prueba (medicamentos, tomas y presiones)?')) {
      resetDemoData();
      toast.info('Datos Restablecidos', 'Se restablecieron los datos de demostración a su estado inicial.');
    }
  };

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      patient: activePatient,
      settings: settings,
      exportedAt: new Date().toISOString(),
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `contigo_backup_${activePatient.fullName.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Copia de Seguridad Creada', 'Archivo de respaldo JSON exportado con éxito.');
  };

  return (
    <div className="space-y-6 font-sans antialiased">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.025)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-forest-600 animate-pulse"></span>
            <span className="text-xs font-heading font-medium text-forest-700 uppercase tracking-wider">
              Control Clínico y Telemetría
            </span>
          </div>
          <h1 className="text-2xl font-heading font-semibold text-slate-900 tracking-tight">
            Ajustes Clínicos y Configuración del Paciente
          </h1>
          <p className="text-xs text-slate-500 font-light mt-1">
            Configuración de umbrales médicos, alertas de omisión y control remoto de accesibilidad para <strong className="font-medium text-slate-700">{activePatient.fullName}</strong>.
          </p>
        </div>

        {isSaved && (
          <div className="bg-emerald-50 text-forest-800 text-xs font-heading font-semibold uppercase tracking-wider px-4 py-2.5 rounded-2xl flex items-center gap-2 border border-emerald-200/80 shadow-xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-forest-700" />
            <span>Configuración Sincronizada</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Bloque 1: Umbrales Clínicos de Presión */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.025)]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-base text-slate-900">Rangos de Presión Indicados por el Médico</h3>
              <p className="text-xs text-slate-400 font-light mt-0.5">El sistema disparará alertas si la medición del paciente supera estos valores pautados.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100/80">
              <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Sistólica Máx. (mmHg)
              </label>
              <input
                type="number"
                value={settings.systolicMaxNormal}
                onChange={e => setSettings({ ...settings, systolicMaxNormal: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-heading font-bold text-slate-900 bg-white focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all"
              />
            </div>

            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100/80">
              <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Sistólica Mín. (mmHg)
              </label>
              <input
                type="number"
                value={settings.systolicMinNormal}
                onChange={e => setSettings({ ...settings, systolicMinNormal: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-heading font-bold text-slate-900 bg-white focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all"
              />
            </div>

            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100/80">
              <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Diastólica Máx. (mmHg)
              </label>
              <input
                type="number"
                value={settings.diastolicMaxNormal}
                onChange={e => setSettings({ ...settings, diastolicMaxNormal: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-heading font-bold text-slate-900 bg-white focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all"
              />
            </div>

            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100/80">
              <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Diastólica Mín. (mmHg)
              </label>
              <input
                type="number"
                value={settings.diastolicMinNormal}
                onChange={e => setSettings({ ...settings, diastolicMinNormal: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-heading font-bold text-slate-900 bg-white focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Bloque 2: Reglas de Alertas y Notificaciones */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.025)]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-base text-slate-900">Notificaciones y Alertas al Cuidador</h3>
              <p className="text-xs text-slate-400 font-light mt-0.5">Configura cuándo y cómo recibir avisos en el navegador o dispositivo móvil.</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/70 border border-slate-100/80 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="pr-4">
                <span className="font-heading font-semibold text-slate-900 text-xs uppercase tracking-wider block">
                  Aviso Inmediato por Signos Vitales Críticos
                </span>
                <span className="text-slate-500 font-light mt-0.5 block">
                  Emitir alerta prioritaria en el dashboard si la presión sale de los rangos médicos seguros.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyOnOutOfRange}
                onChange={e => setSettings({ ...settings, notifyOnOutOfRange: e.target.checked })}
                className="w-5 h-5 rounded text-forest-700 focus:ring-forest-700/20 cursor-pointer flex-shrink-0"
              />
            </label>

            <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-heading font-semibold text-slate-900 text-xs uppercase tracking-wider block">
                  Alerta por Omisión de Medicamento
                </span>
                <span className="text-slate-500 font-light mt-0.5 block">
                  Tiempo de tolerancia antes de notificar al cuidador si el paciente no confirma la toma.
                </span>
              </div>
              <select
                value={settings.notifyMissedDoseMinutes}
                onChange={e => setSettings({ ...settings, notifyMissedDoseMinutes: Number(e.target.value) })}
                className="px-4 py-2.5 rounded-xl border border-slate-200 font-heading font-semibold text-slate-900 text-xs bg-white focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 focus:outline-none transition-all flex-shrink-0"
              >
                <option value={15}>15 minutos después</option>
                <option value={30}>30 minutos después</option>
                <option value={60}>1 hora después</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bloque 3: Control Remoto de Accesibilidad Móvil */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.025)]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-forest-700 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-base text-slate-900">Control Remoto de Accesibilidad Móvil</h3>
              <p className="text-xs text-slate-400 font-light mt-0.5">Configura la experiencia visual y auditiva en el celular del paciente de forma remota.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-between gap-3">
              <div>
                <strong className="text-forest-950 font-heading font-semibold block text-xs uppercase tracking-wider">
                  Modo Fácil (Ultra Accesible)
                </strong>
                <span className="text-forest-900/80 text-[11px] font-light mt-0.5 block">
                  Agranda botones a 64px+ y simplifica textos en el dispositivo del paciente.
                </span>
              </div>
              <input
                type="checkbox"
                defaultChecked={activePatient.easyModeEnabled}
                className="w-5 h-5 rounded text-forest-700 focus:ring-forest-700/20 cursor-pointer flex-shrink-0"
              />
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 flex items-center justify-between gap-3">
              <div>
                <strong className="text-forest-950 font-heading font-semibold block text-xs uppercase tracking-wider">
                  Lectura por Voz Automática (TTS)
                </strong>
                <span className="text-forest-900/80 text-[11px] font-light mt-0.5 block">
                  El celular lee en voz alta cada pantalla al abrirse para el adulto mayor.
                </span>
              </div>
              <input
                type="checkbox"
                defaultChecked={activePatient.voiceGuideEnabled}
                className="w-5 h-5 rounded text-forest-700 focus:ring-forest-700/20 cursor-pointer flex-shrink-0"
              />
            </div>
          </div>
        </div>

        {/* Bloque 4: Respaldo y Exportación de Datos */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.025)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-semibold text-base text-slate-900">Copia de Seguridad y Exportación Cifrada</h3>
            <p className="text-xs text-slate-400 font-light mt-0.5">Descarga un respaldo local con todos los datos clínicos del paciente en formato JSON estandarizado.</p>
          </div>
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-heading font-medium uppercase tracking-wider px-5 py-3 rounded-2xl border border-slate-200/80 shadow-xs transition-all flex-shrink-0"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Descargar Copia (.JSON)</span>
          </button>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={handleResetData}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors"
            title="Restablece medicamentos, tomas y presiones al estado inicial de fábrica"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Datos de Demostración</span>
          </button>

          <button
            type="submit"
            data-testid="btn-save-settings"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-forest-700 hover:bg-forest-800 text-white font-heading font-semibold text-xs uppercase tracking-wider px-8 py-3.5 rounded-2xl shadow-sm hover:shadow transition-all duration-200 active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Ajustes y Sincronizar</span>
          </button>
        </div>

      </form>

    </div>
  );
};
