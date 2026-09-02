import React, { useEffect, useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { settingsService } from '../../services/apiClient';
import { ClinicalSettings } from '../../types';
import { 
  Sliders, 
  Shield, 
  Bell, 
  Smartphone, 
  Download, 
  Save, 
  CheckCircle2
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { activePatient } = usePatient();
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
    setTimeout(() => setIsSaved(false), 2000);
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
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-light text-slate-950 tracking-tight">
            Ajustes Clínicos y Configuración del Paciente
          </h1>
          <p className="text-xs text-slate-500 font-light mt-1">
            Configuración de umbrales médicos, alertas de omisión y control remoto de accesibilidad.
          </p>
        </div>

        {isSaved && (
          <div className="bg-emerald-100 text-forest-900 text-xs font-heading font-semibold uppercase tracking-wider px-4 py-2 flex items-center gap-1.5 border border-emerald-300 shadow-sm animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-forest-700" /> Configuración Guardada y Sincronizada
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Bloque 1: Umbrales Clínicos (0 curvatura) */}
        <div className="bg-white p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5 mb-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 bg-rose-50 text-rose-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-medium text-base text-slate-950">Rangos de Presión Indicados por el Médico</h3>
              <p className="text-xs text-slate-500 font-light">El sistema disparará alertas si la medición del paciente supera estos valores.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-[11px] font-heading font-medium text-slate-700 uppercase tracking-wider mb-1">
                Sistólica Máxima Normal (mmHg)
              </label>
              <input
                type="number"
                value={settings.systolicMaxNormal}
                onChange={e => setSettings({ ...settings, systolicMaxNormal: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-slate-300 text-sm font-heading font-semibold text-slate-950 focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-heading font-medium text-slate-700 uppercase tracking-wider mb-1">
                Sistólica Mínima Normal (mmHg)
              </label>
              <input
                type="number"
                value={settings.systolicMinNormal}
                onChange={e => setSettings({ ...settings, systolicMinNormal: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-slate-300 text-sm font-heading font-semibold text-slate-950 focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-heading font-medium text-slate-700 uppercase tracking-wider mb-1">
                Diastólica Máxima Normal (mmHg)
              </label>
              <input
                type="number"
                value={settings.diastolicMaxNormal}
                onChange={e => setSettings({ ...settings, diastolicMaxNormal: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-slate-300 text-sm font-heading font-semibold text-slate-950 focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-heading font-medium text-slate-700 uppercase tracking-wider mb-1">
                Diastólica Mínima Normal (mmHg)
              </label>
              <input
                type="number"
                value={settings.diastolicMinNormal}
                onChange={e => setSettings({ ...settings, diastolicMinNormal: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-slate-300 text-sm font-heading font-semibold text-slate-950 focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bloque 2: Reglas de Alertas y Notificaciones (0 curvatura) */}
        <div className="bg-white p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5 mb-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-medium text-base text-slate-950">Notificaciones y Alertas al Cuidador</h3>
              <p className="text-xs text-slate-500 font-light">Configura cuándo y cómo recibir avisos en el navegador o celular.</p>
            </div>
          </div>

          <div className="space-y-3 mt-4 text-xs font-light">
            <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
              <div>
                <span className="font-heading font-medium text-slate-950 text-xs uppercase tracking-wider block">Aviso inmediato por Signos Vitales Críticos</span>
                <span className="text-slate-500">Emitir alerta sonora en el dashboard si la presión sale de los rangos médicos.</span>
              </div>
              <input
                type="checkbox"
                checked={settings.notifyOnOutOfRange}
                onChange={e => setSettings({ ...settings, notifyOnOutOfRange: e.target.checked })}
                className="w-4 h-4 text-forest-700 focus:ring-forest-700 cursor-pointer"
              />
            </label>

            <div className="p-3.5 bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-heading font-medium text-slate-950 text-xs uppercase tracking-wider block">Alerta por Omisión de Medicamento</span>
                <span className="text-slate-500">Tiempo de tolerancia antes de notificar al cuidador si el paciente no confirma la toma.</span>
              </div>
              <select
                value={settings.notifyMissedDoseMinutes}
                onChange={e => setSettings({ ...settings, notifyMissedDoseMinutes: Number(e.target.value) })}
                className="px-3.5 py-2 border border-slate-300 font-heading font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-forest-700 focus:border-forest-700 focus:outline-none"
              >
                <option value={15}>15 minutos después</option>
                <option value={30}>30 minutos después</option>
                <option value={60}>1 hora después</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bloque 3: Control Remoto de Accesibilidad Móvil (0 curvatura) */}
        <div className="bg-white p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5 mb-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 bg-emerald-50 text-forest-700 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-medium text-base text-slate-950">Control Remoto de Accesibilidad del Móvil</h3>
              <p className="text-xs text-slate-500 font-light">Configura la experiencia visual y auditiva en el celular del paciente desde aquí.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs font-light">
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
              <div>
                <strong className="text-forest-950 font-heading font-semibold block text-xs uppercase tracking-wider">Modo Fácil (Ultra Accesible)</strong>
                <span className="text-forest-900/80 text-[11px]">Agranda botones y simplifica los textos en el celular.</span>
              </div>
              <input
                type="checkbox"
                defaultChecked={activePatient.easyModeEnabled}
                className="w-4 h-4 text-forest-700 focus:ring-forest-700 cursor-pointer"
              />
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
              <div>
                <strong className="text-forest-950 font-heading font-semibold block text-xs uppercase tracking-wider">Lectura por Voz Automática</strong>
                <span className="text-forest-900/80 text-[11px]">El celular lee en voz alta cada pantalla al abrirse.</span>
              </div>
              <input
                type="checkbox"
                defaultChecked={activePatient.voiceGuideEnabled}
                className="w-4 h-4 text-forest-700 focus:ring-forest-700 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Bloque 4: Respaldo y Exportación de Datos */}
        <div className="bg-white p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-medium text-base text-slate-950">Copia de Seguridad y Exportación Cifrada</h3>
            <p className="text-xs text-slate-500 font-light">Descarga un respaldo con todos los datos clínicos del paciente en formato JSON.</p>
          </div>
          <button
            type="button"
            onClick={handleExportBackup}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-heading font-medium uppercase tracking-wider px-5 py-3 transition flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Copia (.JSON)</span>
          </button>
        </div>

        {/* Botón Guardar Cambios */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            data-testid="btn-save-settings"
            className="bg-forest-700 hover:bg-forest-800 text-white font-heading font-medium text-xs uppercase tracking-wider px-8 py-3.5 shadow-sm transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Ajustes y Sincronizar</span>
          </button>
        </div>

      </form>

    </div>
  );
};
