import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import { User } from '../../types';
import { usePatientView } from '../../hooks/usePatientView';
import { speechService } from '../../services/speechService';
import { Notice } from '../../components/ui/PatientData';
import { DoseCard } from './DoseCard';
import { MeasurementForm } from './MeasurementForm';
import { PatientHelp } from './PatientHelp';
import { AppointmentList } from '../appointments/AppointmentList';
import { upcomingAppointments } from '../../domain/appointments';
import { ClinicalSyncNotice } from '../../components/ui/ClinicalSyncNotice';

export function PatientAppContent({ actor, patientId }: { actor: User; patientId: string }) {
  const query = usePatientView(patientId, actor);
  const [confirmation, setConfirmation] = useState('');
  const body = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const confirmationRef = useRef<HTMLDivElement>(null);
  const responses = useRef<HTMLDetailsElement>(null);
  const contentId = useId();
  const medicationHeadingId = useId();
  const measurementHeadingId = useId();
  const appointmentHeadingId = useId();

  useEffect(() => () => speechService.stop(), [actor.id, patientId]);
  useEffect(() => { body.current?.scrollTo({ top: 0, behavior: 'instant' }); }, [patientId]);
  useEffect(() => { if (confirmation) confirmationRef.current?.focus(); }, [confirmation]);

  if (query.error) return <Notice error>
    {query.error.message}
    <button className="btn-secondary mt-3 min-h-11" onClick={() => void query.refetch()}>Reintentar</button>
  </Notice>;
  if (!query.data) return <Notice>Cargando tu información…</Notice>;

  const view = query.data;
  const next = view.today.find(dose => dose.status === 'PENDING' || dose.status === 'UNCONFIRMED');
  const recorded = view.today.filter(dose => dose.status === 'TAKEN' || dose.status === 'NOT_TAKEN');
  const firstName = view.patient.fullName.split(' ')[0];
  const appointments = upcomingAppointments(view.appointments);

  const reviewResponse = () => {
    if (!responses.current) return;
    responses.current.open = true;
    responses.current.querySelector('summary')?.focus();
  };

  return <div className={`patient-app ${view.settings.highContrast ? 'high-contrast' : ''} ${view.settings.largeText ? 'large-text' : ''}`}>
    <a className="sr-only focus:not-sr-only focus:p-3 focus:bg-white" href={`#${contentId}`} onClick={() => heading.current?.focus()}>Ir al contenido del paciente</a>
    <div className="patient-tools grid grid-cols-1 p-3 bg-white border-b border-slate-300 shrink-0">
      <PatientHelp actor={actor} patientId={patientId} voice={view.settings.voiceGuideEnabled} />
    </div>
    <div ref={body} id={contentId} className="patient-body p-3.5 sm:p-4 space-y-5" role="region" aria-label="Medicamentos, mediciones y citas del paciente">
      <header className="bg-[#e7f7ef] border border-[#b8ecd6] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-heading font-extrabold text-slate-900">Hola, {firstName}</h1>
        <button type="button" className="btn-primary min-h-11" onClick={() => speechService.speak(`Hola ${firstName}. ${next ? `Dosis programada: ${next.medicationName}, ${next.dosage}, a las ${next.scheduledTime}.` : 'No tienes dosis pendientes para hoy.'}`)}>
          <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /><span>Escuchar</span>
        </button>
      </header>
      {confirmation && <div ref={confirmationRef} tabIndex={-1} role="status" aria-live="polite" className="panel border-emerald-600 bg-emerald-50 p-4 space-y-3">
        <p className="font-semibold text-emerald-950">{confirmation}</p>
        <p>Si te equivocaste, puedes corregir la respuesta en «Tomas registradas hoy».</p>
        <button className="btn-secondary w-full min-h-11" onClick={reviewResponse}>Revisar mi respuesta</button>
        <button className="btn-secondary w-full min-h-11" onClick={() => { setConfirmation(''); heading.current?.focus(); }}>Entendido</button>
      </div>}
      <ClinicalSyncNotice state={view.clinicalSync} />
      <section className="space-y-4" aria-labelledby={medicationHeadingId}>
        <h2 ref={heading} id={medicationHeadingId} tabIndex={-1} className="section-title">Mis medicamentos</h2>
        {next ? <DoseCard key={next.id} dose={next} actor={actor} voice={view.settings.voiceGuideEnabled} onRecorded={setConfirmation} /> : <Notice>No tienes dosis pendientes para hoy.</Notice>}
        <details ref={responses} className="panel space-y-3">
          <summary className="font-semibold text-forest-800 cursor-pointer">Tomas registradas hoy</summary>
          {recorded.length ? recorded.map(dose => <DoseCard key={dose.id} dose={dose} actor={actor} voice={view.settings.voiceGuideEnabled} onRecorded={setConfirmation} />) : <p>Todavía no has registrado respuestas de toma hoy.</p>}
        </details>
      </section>
      <section className="space-y-4" aria-labelledby={measurementHeadingId}>
        <h2 id={measurementHeadingId} className="section-title">Mis mediciones</h2>
        <MeasurementForm actor={actor} patientId={patientId} />
      </section>
      <section className="space-y-4" aria-labelledby={appointmentHeadingId} data-testid="patient-appointments">
        <h2 id={appointmentHeadingId} className="section-title">Mis próximas citas</h2>
        <p className="text-slate-700">Estas citas fueron programadas por la clínica ficticia del proyecto.</p>
        {appointments.length ? <AppointmentList appointments={appointments} headingLevel={3} /> : <Notice>No tienes citas próximas programadas.</Notice>}
      </section>
      <Link to="/accesibilidad" className="underline block py-3">Accesibilidad y limitaciones conocidas</Link>
    </div>
  </div>;
}
