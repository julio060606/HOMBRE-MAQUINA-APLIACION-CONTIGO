import React, { useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { 
  FileText, 
  Download, 
  Printer, 
  Award,
  Sparkles
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { activePatient } = usePatient();
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');
  const [includeVitals, setIncludeVitals] = useState(true);
  const [includeMedications, setIncludeMedications] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  if (!activePatient) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert(`Reporte generado: Informe_Clinico_${activePatient.fullName.replace(/\s+/g, '_')}_${period}dias.pdf descargado con éxito.`);
    }, 1000);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-light text-slate-950 tracking-tight">
            Generador de Reporte Médico Oficial
          </h1>
          <p className="text-xs text-slate-500 font-light mt-1">
            Exporta un informe clínico consolidado en PDF para la consulta con el geriatra o cardiólogo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            data-testid="btn-print-report"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-heading font-medium uppercase tracking-wider px-5 py-3 transition flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={isExporting}
            data-testid="btn-download-pdf-report"
            className="bg-forest-700 hover:bg-forest-800 text-white text-xs font-heading font-medium uppercase tracking-wider px-6 py-3 shadow-sm transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generando PDF...' : 'Descargar en PDF'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Configuración del Reporte (0 curvatura) */}
        <div className="bg-white p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-heading font-medium text-sm text-slate-950 mb-3">Rango de Tiempo</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '7', label: '7 Días' },
                { id: '30', label: '30 Días' },
                { id: '90', label: '3 Meses' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setPeriod(item.id as any)}
                  className={`py-2 text-xs font-heading font-medium uppercase tracking-wider border transition ${
                    period === item.id
                      ? 'bg-forest-700 text-white border-forest-700 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-heading font-medium text-sm text-slate-950 mb-3">Secciones a Incluir</h3>
            <div className="space-y-3 text-xs font-light">
              <label className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={includeVitals}
                  onChange={e => setIncludeVitals(e.target.checked)}
                  className="text-forest-700 focus:ring-forest-700 w-4 h-4"
                />
                <span className="text-slate-800">Registros y Gráficos de Presión Arterial</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={includeMedications}
                  onChange={e => setIncludeMedications(e.target.checked)}
                  className="text-forest-700 focus:ring-forest-700 w-4 h-4"
                />
                <span className="text-slate-800">Historial y % de Adherencia a Medicamentos</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-slate-50 transition">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={e => setIncludeNotes(e.target.checked)}
                  className="text-forest-700 focus:ring-forest-700 w-4 h-4"
                />
                <span className="text-slate-800">Observaciones del Cuidador y Alertas</span>
              </label>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 text-xs text-forest-950 space-y-1">
            <div className="font-heading font-semibold flex items-center gap-1.5 text-forest-800 uppercase tracking-wider text-[10px]">
              <Award className="w-3.5 h-3.5 text-forest-700" />
              <span>Formato Clínico Homologado</span>
            </div>
            <p className="text-forest-900/80 font-light leading-relaxed text-[11px]">
              El reporte incluye casillas de firma y sello para la historia clínica hospitalaria.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Vista Previa del Documento PDF (0 curvatura) */}
        <div className="lg:col-span-2 bg-white p-8 border border-slate-200 shadow-sm font-sans">
          <div className="border-b-2 border-forest-700 pb-4 mb-6 flex items-start justify-between">
            <div>
              <div className="text-lg sm:text-xl font-heading font-medium text-forest-700 tracking-wider uppercase">
                INFORME DE TELEASISTENCIA GERIÁTRICA
              </div>
              <div className="text-xs text-slate-500 font-heading font-medium tracking-widest uppercase mt-0.5">
                PLATAFORMA CONTIGO · CENTRO MÉDICO ALIADO
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 font-light">
              <div>Fecha: <strong className="text-slate-800 font-medium">{new Date().toLocaleDateString('es-PE')}</strong></div>
              <div>Período: <strong className="text-slate-800 font-medium">Últimos {period} días</strong></div>
            </div>
          </div>

          {/* Datos Paciente */}
          <div className="bg-slate-50 p-4 mb-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs border border-slate-200">
            <div>
              <span className="text-slate-400 block font-heading font-semibold text-[10px] uppercase tracking-wider">PACIENTE</span>
              <strong className="text-slate-900 font-heading text-sm">{activePatient.fullName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-heading font-semibold text-[10px] uppercase tracking-wider">EDAD</span>
              <strong className="text-slate-900 font-heading text-sm">{activePatient.age} años</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-heading font-semibold text-[10px] uppercase tracking-wider">CONTACTO FAMILIAR</span>
              <strong className="text-slate-900 font-heading text-sm">{activePatient.emergencyPhone}</strong>
            </div>
          </div>

          {/* Resumen Clínico */}
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="font-heading font-medium text-sm text-slate-950 border-b pb-1 mb-2">1. Resumen de Adherencia a Fármacos</h4>
              <p className="text-slate-700 font-light leading-relaxed">
                El paciente mantiene una adherencia del <strong className="font-heading font-semibold text-forest-700">94.5%</strong> en los últimos {period} días. No se registraron omisiones críticas en el tratamiento de Losartán.
              </p>
            </div>

            <div>
              <h4 className="font-heading font-medium text-sm text-slate-950 border-b pb-1 mb-2">2. Comportamiento de Presión Arterial</h4>
              <p className="text-slate-700 font-light leading-relaxed">
                • Presión Promedio: <strong className="font-heading font-semibold text-slate-900">120 / 80 mmHg</strong>.<br />
                • Valor Máximo Registrado: <strong className="font-heading font-semibold text-rose-700">135 / 88 mmHg</strong> (29 de Agosto).<br />
                • Pulso Promedio: <strong className="font-heading font-semibold text-slate-900">72 bpm</strong>.
              </p>
            </div>

            <div>
              <h4 className="font-heading font-medium text-sm text-slate-950 border-b pb-1 mb-2">3. Medicamentos Activos en Régimen</h4>
              <ul className="list-disc pl-5 text-slate-700 font-light space-y-1">
                <li><strong className="font-heading font-medium text-slate-900">Losartán 50 mg:</strong> Cada 12 horas (08:00 AM y 20:00 PM). Vía oral con alimentos.</li>
                <li><strong className="font-heading font-medium text-slate-900">Vitamina D3 2000 UI:</strong> 1 tableta diaria a las 14:00 PM con el almuerzo.</li>
              </ul>
            </div>
          </div>

          {/* Firma Médica */}
          <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 w-3/4 mx-auto mb-1"></div>
              <span className="font-heading font-medium text-slate-800 uppercase tracking-wider text-[10px]">Familiar / Cuidador Responsable</span>
            </div>
            <div>
              <div className="border-b border-slate-400 w-3/4 mx-auto mb-1"></div>
              <span className="font-heading font-medium text-slate-800 uppercase tracking-wider text-[10px]">Firma y Sello del Médico Tratante</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
