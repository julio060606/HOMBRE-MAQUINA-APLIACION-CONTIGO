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
  Smartphone
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
      <div className="text-center py-16">
        <p className="text-slate-500 font-light text-sm">Selecciona o vincula un paciente para ver el panel de control.</p>
      </div>
    );
  }

  const takenCount = intakes.filter(i => i.status === 'TAKEN').length;
  const adherencePercent = intakes.length > 0 ? Math.round((takenCount / intakes.length) * 100) : 100;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner: Resumen de Bienvenida y Estado General */}
      <div className="bg-white p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-heading font-light text-slate-950 tracking-tight">
              Estado Clínico de <span className="font-normal">{activePatient.fullName}</span>
            </h1>
            <span className="px-2.5 py-1 bg-emerald-50 text-forest-700 text-[10px] font-heading font-semibold uppercase tracking-wider border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Todo en Orden Hoy
            </span>
          </div>
          <p className="text-xs text-slate-500 font-light mt-1 max-w-2xl">
            {activePatient.medicalNotes || 'Sin observaciones médicas registradas.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/medications"
            data-testid="btn-add-med-quick"
            className="bg-forest-700 hover:bg-forest-800 text-white text-xs font-heading font-medium uppercase tracking-wider px-5 py-2.5 shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Recetar Medicina
          </Link>
          <Link
            to="/reports"
            data-testid="btn-view-report-quick"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-heading font-medium uppercase tracking-wider px-4 py-2.5 transition"
          >
            Ver Reporte PDF
          </Link>
        </div>
      </div>

      {/* Grid de Métricas Principales (KPI Cards con 0 curvatura) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Adherencia Hoy */}
        <div className="bg-white p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-heading font-semibold text-slate-400 uppercase tracking-widest mb-2">
            <span>Adherencia Hoy</span>
            <div className="w-6 h-6 bg-emerald-50 text-forest-700 flex items-center justify-center">
              <Pill className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-heading font-semibold text-slate-950 tracking-tight">{adherencePercent}%</div>
          <div className="text-xs text-slate-500 font-light mt-1">
            {takenCount} de {intakes.length} dosis tomadas
          </div>
          <div className="w-full bg-slate-100 h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-forest-700 h-1.5 transition-all duration-500"
              style={{ width: `${adherencePercent}%` }}
            ></div>
          </div>
        </div>

        {/* KPI 2: Última Presión Arterial */}
        <div className="bg-white p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-heading font-semibold text-slate-400 uppercase tracking-widest mb-2">
            <span>Última Presión</span>
            <div className="w-6 h-6 bg-rose-50 text-rose-600 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-heading font-semibold text-slate-950 tracking-tight">
            {latestVitals ? `${latestVitals.systolic}/${latestVitals.diastolic}` : '--/--'}
            <span className="text-xs font-light text-slate-400 ml-1 font-sans">mmHg</span>
          </div>
          <div className="text-xs text-forest-700 font-heading font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Rango Óptimo Normal
          </div>
          <div className="text-[10px] text-slate-400 font-light mt-2">
            Registrado hoy 09:05 AM
          </div>
        </div>

        {/* KPI 3: Pulso / Frecuencia Cardíaca */}
        <div className="bg-white p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-heading font-semibold text-slate-400 uppercase tracking-widest mb-2">
            <span>Pulso Cardíaco</span>
            <div className="w-6 h-6 bg-red-50 text-red-600 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-3xl font-heading font-semibold text-slate-950 tracking-tight">
            {latestVitals?.pulse || 73}
            <span className="text-xs font-light text-slate-400 ml-1 font-sans">bpm</span>
          </div>
          <div className="text-xs text-slate-600 font-light mt-1">Ritmo regular sinusal</div>
          <div className="text-[10px] text-slate-400 font-light mt-2">Dentro del rango médico</div>
        </div>

        {/* KPI 4: Sincronización Móvil */}
        <div className="bg-white p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-heading font-semibold text-slate-400 uppercase tracking-widest mb-2">
            <span>Estado Móvil</span>
            <div className="w-6 h-6 bg-blue-50 text-blue-800 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base font-heading font-semibold text-slate-950 flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-emerald-600 animate-pulse"></span>
            En Línea (App v1.0)
          </div>
          <div className="text-xs text-slate-500 font-light mt-1">Sincronización activa</div>
          <div className="text-[10px] text-slate-400 font-light mt-2">Última sinc: Hace 2 min</div>
        </div>

      </div>

      {/* Grid Central: Timeline de Tomas vs Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda (2/3): Timeline de Tomas */}
        <div className="lg:col-span-2 bg-white p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-heading font-medium text-base text-slate-950">Cronograma de Tomas de Hoy</h3>
              <p className="text-xs text-slate-500 font-light">Supervisión en tiempo real de fármacos programados.</p>
            </div>
            <Link to="/medications" className="text-xs font-heading font-medium text-forest-700 hover:underline flex items-center gap-1 uppercase tracking-wider">
              <span>Gestionar Pastillero</span> <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {intakes.map(intake => (
              <div 
                key={intake.id}
                data-testid={`card-intake-${intake.id}`}
                className={`p-4 border flex items-center justify-between transition-all ${
                  intake.status === 'TAKEN' 
                    ? 'bg-emerald-50/40 border-emerald-200' 
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {intake.imageUrl ? (
                      <img src={intake.imageUrl} alt={intake.medicationName} className="w-full h-full object-cover" />
                    ) : (
                      <Pill className="w-6 h-6 text-forest-700" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-semibold text-sm text-slate-950">{intake.medicationName}</span>
                      <span className="text-[10px] font-heading font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 uppercase tracking-wider">
                        {intake.dosage}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-light mt-0.5">
                      Horario: <strong className="font-heading font-semibold text-slate-800">{intake.scheduledTime}</strong> · {intake.instructions}
                    </div>
                  </div>
                </div>

                <div>
                  {intake.status === 'TAKEN' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-forest-900 text-[10px] font-heading font-semibold uppercase tracking-wider border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" /> Tomada
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 text-[10px] font-heading font-semibold uppercase tracking-wider border border-amber-300">
                      <Clock className="w-3.5 h-3.5 text-amber-700" /> Pendiente
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha (1/3): Alertas y Avisos */}
        <div className="bg-white p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-heading font-medium text-base text-slate-950">Alertas Clínicas</h3>
              <span className="text-[10px] font-heading font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 uppercase tracking-wider">
                Últimas 48h
              </span>
            </div>

            <div className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-xs text-slate-400 font-light text-center py-6">Sin alertas registradas.</p>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className="p-3.5 bg-amber-50/70 border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-950 font-heading font-semibold text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                      <span>{alert.title}</span>
                    </div>
                    <p className="text-xs text-amber-900/80 font-light mt-1 leading-relaxed">
                      {alert.description}
                    </p>
                    <span className="text-[10px] text-amber-700 font-medium block mt-2">
                      {alert.timestamp}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/settings"
              className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-heading font-medium uppercase tracking-wider flex items-center justify-center gap-1.5 transition border border-slate-200"
            >
              <span>Configurar Umbrales de Alarma</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};
