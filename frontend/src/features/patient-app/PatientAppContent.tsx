import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Volume2,
  Heart,
  PhoneCall,
  Home,
  Pill,
  Activity,
  Calendar,
  HeartHandshake,
  UserCheck,
  CalendarDays,
} from 'lucide-react';
import { User } from '../../types';
import { usePatientView } from '../../hooks/usePatientView';
import { useAction } from '../../hooks/useAction';
import { serviceFor } from '../../services/apiClient';
import { speechService } from '../../services/speechService';
import { formatDate } from '../../domain/time';
import { Notice } from '../../components/ui/PatientData';
import { DoseCard } from './DoseCard';
import { MeasurementForm } from './MeasurementForm';
import { AppointmentList } from '../appointments/AppointmentList';
import { PatientSummary } from '../dashboard/PatientSummary';
import { MeasurementCharts } from '../vitals/MeasurementCharts';
import { PairingPanel } from './PairingPanel';
import { PatientSupplies } from './PatientSupplies';

export function PatientAppContent({
  actor,
  patientId,
  standalone = false,
}: {
  actor: User;
  patientId: string;
  standalone?: boolean;
}) {
  const query = usePatientView(patientId, actor);
  const [tab, setTab] = useState('home');
  const [confirmation, setConfirmation] = useState('');
  const action = useAction();
  const [sos, setSos] = useState(false);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => () => speechService.stop(), [actor.id, patientId]);
  useEffect(() => {
    body.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [tab, patientId, confirmation]);

  if (query.error) {
    return (
      <Notice error>
        {query.error.message}
        <button className="btn-secondary mt-3" onClick={() => void query.refetch()}>
          Reintentar
        </button>
      </Notice>
    );
  }

  if (!query.data) return <Notice>Cargando tu información…</Notice>;

  const view = query.data;
  const next = view.today.find(d => d.status === 'PENDING' || d.status === 'UNCONFIRMED');
  const appointment = view.appointments.find(
    a => a.status === 'SCHEDULED' && Date.parse(a.startsAt) >= Date.now()
  );
  const firstName = view.patient.fullName.split(' ')[0];


  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'treatment', label: 'Tratamiento', icon: Pill },
    { id: 'measure', label: 'Medición', icon: Activity },
    { id: 'appointments', label: 'Citas', icon: Calendar },
    { id: 'summary', label: 'Mi salud', icon: HeartHandshake },
    { id: 'caregiver', label: 'Mi cuidador', icon: UserCheck },
  ] as const;

  return (
    <div
      className={`patient-app ${view.settings.highContrast ? 'high-contrast' : ''} ${
        view.settings.largeText ? 'large-text' : ''
      }`}
    >
      <div
        ref={body}
        className="patient-body p-3.5 sm:p-4 space-y-4"
        role="region"
        aria-label="Contenido de la app paciente"
      >
        {/* Top Header Card: MODO FÁCIL ASISTIDO + Hola, {Name} + Speaker button (Image 2) */}
        <header className="bg-[#e7f7ef] border border-[#b8ecd6] rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[#0d6e53] font-black text-[11px] sm:text-xs tracking-wider uppercase block">
              MODO FÁCIL ASISTIDO
            </span>
            <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 mt-0.5">
              Hola, {firstName}
            </h1>
          </div>
          <button
            type="button"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1b6b55] hover:bg-[#155644] active:scale-95 text-white flex items-center justify-center shadow-sm cursor-pointer transition-transform shrink-0"
            aria-label="Escuchar información del tratamiento"
            onClick={() => {
              speechService.speak(
                `Hola ${firstName}. ${
                  next
                    ? `Dosis programada: ${next.medicationName}, ${next.dosage}, a las ${next.scheduledTime}.`
                    : 'No tienes dosis pendientes para hoy.'
                }`
              );
            }}
          >
            <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </header>

        {/* Confirmation banner */}
        {confirmation && (
          <div role="status" className="panel border-emerald-600 bg-emerald-50/90 p-4 rounded-2xl">
            <p className="font-semibold text-emerald-950 text-sm">{confirmation}</p>
            <button
              className="btn-secondary mt-2 w-full text-xs py-2"
              onClick={() => setConfirmation('')}
            >
              Entendido
            </button>
          </div>
        )}

        {/* Tab Content: Home */}
        {tab === 'home' && (
          <>
            {/* Main Pending Medication Card */}
            {next ? (
              <DoseCard
                key={next.id}
                dose={next}
                actor={actor}
                voice={view.settings.voiceGuideEnabled}
                onRecorded={setConfirmation}
              />
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                  <Pill className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-bold text-slate-900">Tratamiento al día</h3>
                <p className="text-slate-600 text-sm">
                  No hay dosis pendientes para este momento. Consulta el apartado Tratamiento para revisar tu historial.
                </p>
                <button
                  type="button"
                  className="btn-secondary w-full text-sm mt-3"
                  onClick={() => setTab('treatment')}
                >
                  Ver mis medicamentos de hoy
                </button>
              </div>
            )}

            {/* Registrar medición (Abre formulario real vacío) */}
            <article className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-heading font-extrabold text-slate-900 text-sm tracking-wide">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-100" />
                  <span>REGISTRAR MEDICIÓN</span>
                </div>
                <span className="text-slate-400 text-xs font-normal">Tensiómetro o balanza</span>
              </div>
              <button
                type="button"
                onClick={() => setTab('measure')}
                className="btn-primary w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Activity className="w-5 h-5 text-emerald-200" />
                <span>Ingresar lectura de presión o peso</span>
              </button>
            </article>

            {/* SOS Emergency Button */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-2">
              <p className="text-xs text-slate-500 text-center font-medium">
                Petición de auxilio de demostración · No contacta servicios de emergencia reales
              </p>
              <button
                type="button"
                className="w-full py-3.5 px-5 rounded-2xl bg-[#e11d48] hover:bg-[#be123c] active:scale-[0.99] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-rose-600/25 transition-all cursor-pointer tracking-wide"
                disabled={action.busy}
                data-testid="patient-sos"
                onClick={async () => {
                  if (await action.run(patientId, id => serviceFor(actor).sos(patientId, id))) {
                    setSos(true);
                    setConfirmation('Petición de auxilio SOS registrada en el sistema.');
                    if (view.settings.voiceGuideEnabled) {
                      speechService.speak('Petición de auxilio SOS registrada.');
                    }
                  }
                }}
              >
                <PhoneCall className="w-5 h-5 shrink-0" />
                <span>🚨 BOTÓN DE AUXILIO SOS</span>
              </button>
              {sos && (
                <p className="mt-2 text-xs text-rose-800 text-center font-semibold" role="status">
                  Petición de auxilio registrada en el panel de supervisión.
                </p>
              )}
              {action.error && (
                <p role="alert" className="text-rose-700 text-xs mt-2 text-center">
                  {action.error}
                </p>
              )}
            </section>

            {/* Optional next appointment shortcut card */}
            {appointment && (
              <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium">Próxima cita</p>
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {formatDate(appointment.startsAt)} · {appointment.specialty}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs font-semibold text-forest-800 hover:underline shrink-0 ml-2"
                  onClick={() => setTab('appointments')}
                >
                  Ver citas
                </button>
              </section>
            )}
          </>
        )}

        {/* Tab Content: Treatment */}
        {tab === 'treatment' && (
          <div className="space-y-4">
            <h2 className="section-title">Mi tratamiento de hoy</h2>
            {view.today.length ? (
              view.today.map(d => (
                <DoseCard
                  key={d.id}
                  dose={d}
                  actor={actor}
                  voice={view.settings.voiceGuideEnabled}
                  onRecorded={setConfirmation}
                />
              ))
            ) : (
              <Notice>No tienes dosis programadas hoy.</Notice>
            )}
          </div>
        )}

        {/* Tab Content: Measure */}
        {tab === 'measure' && <MeasurementForm actor={actor} patientId={patientId} />}

        {/* Tab Content: Appointments */}
        {tab === 'appointments' && <AppointmentList appointments={view.appointments} />}

        {/* Tab Content: Health Summary */}
        {tab === 'summary' && (
          <div className="space-y-5">
            <PatientSummary view={view} compact />
            <PatientSupplies view={view} />
            <MeasurementCharts view={view} />
          </div>
        )}

        {/* Tab Content: Caregiver */}
        {tab === 'caregiver' && <PairingPanel actor={actor} patientId={patientId} />}

        {standalone && (
          <Link to="/dashboard" className="btn-secondary w-full text-center block text-sm">
            Ver mi dashboard completo
          </Link>
        )}
      </div>

      {/* Modern Ergonomic Bottom Mobile Navigation */}
      <nav
        className="patient-navigation bg-white border-t border-slate-200/90 px-1 py-1.5 flex items-center justify-around shrink-0 shadow-lg"
        aria-label="Navegación del paciente"
      >
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-xs transition-all cursor-pointer ${
                active
                  ? 'text-[#1b6b55] bg-emerald-50/90 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              aria-current={active ? 'page' : undefined}
              onClick={() => setTab(id)}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${active ? 'text-[#1b6b55]' : 'text-slate-400'}`} />
              <span className="text-[10px] sm:text-[11px] leading-tight truncate w-full text-center">
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
