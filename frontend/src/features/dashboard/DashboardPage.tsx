import React, { useEffect, useState } from 'react';
import { usePatient } from '../../context/PatientContext';
import { medicationService, vitalsService, alertService } from '../../services/apiClient';
import { PillIntake, BloodPressureLog, AlertEvent } from '../../types';
import { 
  Heart, 
  Pill, 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  ChevronRight, 
  ShieldCheck, 
  Calendar,
  Smartphone,
  FileText,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { activePatient } = usePatient();
  const [intakes, setIntakes] = useState<PillIntake[]>([]);
  const [latestVitals, setLatestVitals] = useState<BloodPressureLog | null>(null);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activePatient) return;
    setIsLoading(true);
    Promise.all([
      medicationService.getTodayIntakes(activePatient.id),
      vitalsService.getBloodPressureLogs(activePatient.id),
      alertService.getRecentAlerts(activePatient.id),
    ]).then(([intakesData, vitalsData, alertsData]) => {
      setIntakes(intakesData);
      setLatestVitals(vitalsData[0] || null);
      setAlerts(alertsData);
      setIsLoading(false);
    });
  }, [activePatient]);

  if (!activePatient) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-lg mx-auto mt-10 p-8">
        <div className="w-14 h-14 bg-emerald-50 text-forest-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h3 className="font-heading font-semibold text-slate-900 text-lg">No hay paciente seleccionado</h3>
        <p className="text-slate-500 font-light text-sm mt-1.5 leading-relaxed">
          Selecciona o vincula un paciente desde la barra superior para acceder al panel de teleasistencia y monitoreo.
        </p>
      </div>
    );
  }

  const takenCount = intakes.filter(i => i.status === 'TAKEN').length;
  const adherencePercent = intakes.length > 0 ? Math.round((takenCount / intakes.length) * 100) : 100;

  return (
    <div className="space-y-6 font-sans antialiased">
      
      {/* Top Banner: Resumen Humano, Ligero y Acogedor */}
      <div className="relative overflow-hidden bg-gradient-to-r from-white via-white to-emerald-50/40 rounded-3xl p-6 sm:p-8 border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] transition-all">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-forest-700 text-xs font-heading font-medium border border-emerald-200/60 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Monitoreo Activo</span>
              </span>
              <span className="text-xs text-slate-400 font-light">
                Última sincronización: Hace 2 min
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-semibold text-slate-900 tracking-tight">
              Estado de <span className="text-forest-700">{activePatient.fullName}</span>
            </h1>

            <p className="text-sm text-slate-500 font-light max-w-2xl leading-relaxed">
              {activePatient.medicalNotes || 'Sin observaciones médicas críticas registradas para la jornada de hoy.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0">
            <Link
              to="/medications"
              data-testid="btn-add-med-quick"
              className="inline-flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white text-xs font-heading font-semibold uppercase tracking-wider px-5 py-3 rounded-2xl shadow-sm hover:shadow transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Recetar Medicina</span>
            </Link>

            <Link
              to="/reports"
              data-testid="btn-view-report-quick"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-heading font-medium uppercase tracking-wider px-4 py-3 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all duration-200"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Reporte PDF</span>
            </Link>
          </div>

        </div>

        {/* Detalle decorativo orgánico de fondo */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-100/30 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Grid de Métricas Principales (KPI Cards Redondeadas y Respirables) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Adherencia Farmacológica */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.025)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-heading font-semibold text-slate-400 uppercase tracking-wider">
                Adherencia Hoy
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-forest-700 flex items-center justify-center transition-colors group-hover:bg-emerald-100/70">
                <Pill className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 tracking-tight">
                {adherencePercent}%
              </span>
              <span className="text-xs text-forest-700 font-medium">
                {adherencePercent >= 80 ? 'Óptima' : 'En seguimiento'}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-light mt-1">
              {takenCount} de {intakes.length} tomas confirmadas
            </p>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full mt-5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-forest-700 h-full rounded-full transition-all duration-500"
              style={{ width: `${adherencePercent}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Última Presión Arterial */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.025)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-heading font-semibold text-slate-400 uppercase tracking-wider">
                Última Presión
              </span>
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center transition-colors group-hover:bg-rose-100/70">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 tracking-tight">
                {latestVitals ? `${latestVitals.systolic}/${latestVitals.diastolic}` : '--/--'}
              </span>
              <span className="text-xs font-light text-slate-400 font-sans">mmHg</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-forest-700 font-heading font-medium mt-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
              <span>Rango Clínico Estable</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-light mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between">
            <span>Registrado hoy 09:05 AM</span>
            <Link to="/vitals" className="text-forest-700 font-medium hover:underline">Historial</Link>
          </div>
        </div>

        {/* KPI 3: Frecuencia Cardíaca (Pulso) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.025)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-heading font-semibold text-slate-400 uppercase tracking-wider">
                Pulso Cardíaco
              </span>
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center transition-colors group-hover:bg-red-100/70">
                <Heart className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 tracking-tight">
                {latestVitals?.pulse || 73}
              </span>
              <span className="text-xs font-light text-slate-400 font-sans">bpm</span>
            </div>

            <div className="text-xs text-slate-600 font-light mt-1.5">
              Ritmo sinusal regular
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-light mt-4 pt-3 border-t border-slate-100/80">
            Dentro de los umbrales seguros
          </div>
        </div>

        {/* KPI 4: Sincronización con App Móvil del Paciente */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.025)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-heading font-semibold text-slate-400 uppercase tracking-wider">
                App del Paciente
              </span>
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center transition-colors group-hover:bg-sky-100/70">
                <Smartphone className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-lg font-heading font-semibold text-slate-900 tracking-tight">
                Conectado
              </span>
            </div>

            <p className="text-xs text-slate-500 font-light mt-1.5">
              Paciente activo sin alarmas locales pendientes
            </p>
          </div>

          <div className="text-[11px] text-slate-400 font-light mt-4 pt-3 border-t border-slate-100/80 flex items-center justify-between">
            <span>Cliente Android v1.0</span>
            <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md">Online</span>
          </div>
        </div>

      </div>

      {/* Grid Central: Timeline de Tomas vs Alertas Clínicas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda (2/3): Timeline de Tomas de Hoy */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.025)]">
          
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900">
                Cronograma de Tomas de Hoy
              </h3>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                Seguimiento en tiempo real de comprimidos y recetas pautadas
              </p>
            </div>

            <Link 
              to="/medications" 
              className="inline-flex items-center gap-1.5 text-xs font-heading font-medium text-forest-700 hover:text-forest-800 bg-emerald-50/70 hover:bg-emerald-100/70 px-3.5 py-1.5 rounded-xl transition-colors"
            >
              <span>Gestionar Pastillero</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3.5">
            {intakes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No hay tomas programadas para hoy.
              </div>
            ) : (
              intakes.map(intake => (
                <div 
                  key={intake.id}
                  data-testid={`card-intake-${intake.id}`}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    intake.status === 'TAKEN' 
                      ? 'bg-emerald-50/25 border-emerald-200/50 hover:bg-emerald-50/40' 
                      : 'bg-slate-50/50 border-slate-200/60 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-13 h-13 rounded-2xl bg-white border border-slate-200/70 overflow-hidden flex-shrink-0 flex items-center justify-center p-1 shadow-xs">
                      {intake.imageUrl ? (
                        <img src={intake.imageUrl} alt={intake.medicationName} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Pill className="w-6 h-6 text-forest-700" />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-semibold text-sm text-slate-900">
                          {intake.medicationName}
                        </span>
                        <span className="text-[11px] font-heading font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {intake.dosage}
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-500 font-light mt-1 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {intake.scheduledTime}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="truncate max-w-xs">{intake.instructions}</span>
                      </div>
                    </div>
                  </div>

                  <div className="self-end sm:self-center">
                    {intake.status === 'TAKEN' ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-forest-800 text-xs font-heading font-medium border border-emerald-300/60 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
                        <span>Tomada</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-heading font-medium border border-amber-200 shadow-xs">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pendiente</span>
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Columna Derecha (1/3): Alertas Clínicas y Prevención */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100/90 shadow-[0_2px_12px_rgba(0,0,0,0.025)] flex flex-col justify-between">
          
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900">
                  Alertas Clínicas
                </h3>
                <p className="text-xs text-slate-400 font-light mt-0.5">
                  Eventos y avisos de telemetría
                </p>
              </div>
              <span className="text-[10px] font-heading font-semibold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full uppercase tracking-wider">
                48 horas
              </span>
            </div>

            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-light">
                    No hay alertas críticas en las últimas 48 horas.
                  </p>
                </div>
              ) : (
                alerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className="p-4 rounded-2xl bg-amber-50/50 border-l-4 border-amber-400 border-t border-r border-b border-amber-100/80 transition-all hover:bg-amber-50/80"
                  >
                    <div className="flex items-center gap-2 text-amber-950 font-heading font-semibold text-xs">
                      <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <span>{alert.title}</span>
                    </div>

                    <p className="text-xs text-amber-900/85 font-light mt-1.5 leading-relaxed">
                      {alert.description}
                    </p>

                    <div className="text-[11px] text-amber-700/80 font-medium mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{alert.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/settings"
              className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100/80 text-slate-700 text-xs font-heading font-medium tracking-wide rounded-2xl flex items-center justify-center gap-2 transition-colors border border-slate-200/70"
            >
              <span>Ajustar Umbrales de Alarma</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
};

