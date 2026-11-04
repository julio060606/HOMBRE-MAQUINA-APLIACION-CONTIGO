import { Link } from 'react-router-dom';
import { Activity, ArrowDown, ArrowRight, Check, ChevronRight, Clock3, HeartHandshake, Monitor, Pill, Smartphone, UsersRound, Volume2 } from 'lucide-react';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { useAuth } from '../../context/AuthContext';
import './ContigoLandingPage.css';

function ContigoBrand() {
  return <Link to="/landing" className="ct-brand" aria-label="CONTIGO, ir al inicio">
    <span className="ct-brand-mark"><HeartHandshake size={25} strokeWidth={1.8} aria-hidden="true" /></span>
    <span><strong>CONTIGO</strong><span className="ct-brand-description">Cuidarnos, cada día</span></span>
  </Link>;
}

function PatientPreview() {
  return <figure className="ct-hero-visual" aria-label="Vista ilustrativa de la app del paciente con datos de demostración">
    <div className="ct-visual-halo" aria-hidden="true" />
    <div className="ct-preview-note"><span className="ct-note-icon"><UsersRound size={22} aria-hidden="true" /></span><span>Cada persona,<br /><strong>su propio espacio.</strong></span></div>
    <div className="ct-phone" aria-hidden="true">
      <div className="ct-phone-top"><span>CONTIGO</span><span className="ct-phone-camera" /></div>
      <div className="ct-phone-greeting"><span>Qué gusto verte</span><strong>Hola, Dacio</strong></div>
      <div className="ct-preview-dose">
        <div className="ct-dose-time"><Clock3 size={17} /><span>08:00</span><span>Por confirmar</span></div>
        <div className="ct-dose-photo"><img src="/images/losartan_pill.jpg" alt="" width="120" height="82" /></div>
        <strong className="ct-dose-name">Losartán <span>50 mg</span></strong>
        <p>Revisa tu dosis y registra tu respuesta.</p>
        <span className="ct-preview-response ct-preview-positive"><Check size={19} />Ya la tomé</span>
        <span className="ct-preview-response ct-preview-negative">No la tomé</span>
      </div>
      <div className="ct-preview-measure"><span><Activity size={22} /></span><div><strong>Mis mediciones</strong><span>Registrar una lectura</span></div><ChevronRight size={20} /></div>
    </div>
    <figcaption>Vista ilustrativa · datos de demostración</figcaption>
  </figure>;
}

export function ContigoLandingPage() {
  const { user } = useAuth();
  const access = user ? user.role === 'ROLE_PATIENT' ? '/patient-app' : '/dashboard' : '/login';
  const accessLabel = user ? user.role === 'ROLE_PATIENT' ? 'Volver a mi aplicación' : 'Volver a mi panel' : 'Iniciar sesión';

  return <div className="contigo-landing">
    <PublicHeader />

    <main data-page-path="/landing">
      <section id="hero" className="ct-hero" aria-labelledby="contigo-hero-title">
        <div className="ct-container ct-hero-grid">
          <div className="ct-hero-copy">
            <p className="ct-eyebrow"><span aria-hidden="true" />Para cuidar en familia</p>
            <h1 id="contigo-hero-title">El cuidado diario,<br /><span>más cerca de ti.</span></h1>
            <p className="ct-hero-description">Una app sencilla para que las personas adultas mayores registren sus tomas y mediciones, y sus cuidadores puedan acompañar el seguimiento.</p>
            <div className="ct-hero-actions"><Link to={access} className="ct-button ct-button-primary" data-testid="btn-hero-access-web">{accessLabel}<ArrowRight size={20} aria-hidden="true" /></Link><Link to="#como-funciona" className="ct-button ct-button-outline">Cómo funciona<ArrowDown size={19} aria-hidden="true" /></Link></div>
            <div className="ct-hero-details"><span><Pill size={20} aria-hidden="true" />Medicamentos claros</span><span><Activity size={20} aria-hidden="true" />Mediciones en casa</span></div>
            <p className="ct-hero-footnote">Dos espacios conectados por el cuidado: paciente y cuidador.</p>
          </div>
          <PatientPreview />
        </div>
      </section>

      <section id="beneficios" className="ct-section ct-benefits" aria-labelledby="contigo-benefits-title">
        <span id="features" className="ct-anchor-alias" aria-hidden="true" />
        <div className="ct-container">
          <div className="ct-section-heading"><div><p className="ct-eyebrow">Lo importante, más claro</p><h2 id="contigo-benefits-title">Un poco de orden.<br />Más espacio para acompañar.</h2></div><p>La información de cada día, organizada para que cada persona encuentre lo que necesita.</p></div>
          <div className="ct-benefit-list">
            <article><span className="ct-feature-icon"><Pill size={27} aria-hidden="true" /></span><h3>Entender el tratamiento</h3><p>Nombre, dosis y horario juntos. El paciente registra si tomó su medicamento y puede corregir su respuesta.</p></article>
            <article><span className="ct-feature-icon"><Activity size={27} aria-hidden="true" /></span><h3>Registrar las mediciones</h3><p>Un espacio para anotar las lecturas de presión, pulso o peso obtenidas con el equipo de casa.</p></article>
            <article><span className="ct-feature-icon"><HeartHandshake size={27} aria-hidden="true" /></span><h3>Acompañar el seguimiento</h3><p>El cuidador consulta los registros, revisa existencias y organiza el acompañamiento a las citas.</p></article>
          </div>
        </div>
      </section>

      <section id="para-quien" className="ct-section ct-roles" aria-labelledby="contigo-roles-title">
        <span id="roles" className="ct-anchor-alias" aria-hidden="true" />
        <div className="ct-container ct-role-grid">
          <div className="ct-family-photo"><img src="/images/caregiver_senior.jpg" width="1200" height="896" loading="lazy" alt="Una persona adulta mayor y una familiar comparten un momento en casa" /><div className="ct-photo-caption"><HeartHandshake size={25} aria-hidden="true" /><span>El cuidado empieza<br /><strong>con estar presentes.</strong></span></div></div>
          <div className="ct-role-content"><p className="ct-eyebrow">Cada persona, su espacio</p><h2 id="contigo-roles-title">Pensada para quien recibe cuidado. Y para quien lo brinda.</h2>
            <article className="ct-role-item"><span className="ct-feature-icon"><Smartphone size={25} aria-hidden="true" /></span><div><h3>Para la persona adulta mayor</h3><p>Dos tareas cotidianas, a mano en su teléfono: registrar las tomas de medicamentos y sus mediciones.</p><ul><li><Check size={18} aria-hidden="true" />Medicamentos con dos respuestas claras.</li><li><Check size={18} aria-hidden="true" />Mediciones con revisión antes de guardar.</li></ul>{!user && <Link to="/login?cuenta=patient_dacio" className="ct-text-link">Entrar como paciente<ArrowRight size={18} aria-hidden="true" /></Link>}</div></article>
            <article className="ct-role-item"><span className="ct-feature-icon ct-icon-navy"><Monitor size={25} aria-hidden="true" /></span><div><h3>Para el cuidador</h3><p>Una vista de seguimiento para consultar lo registrado y preparar el acompañamiento.</p><ul><li><Check size={18} aria-hidden="true" />Tratamiento, existencias y próximas citas.</li><li><Check size={18} aria-hidden="true" />Gráficas y reportes de los registros disponibles.</li></ul>{!user && <Link to="/login?cuenta=caregiver_demo" className="ct-text-link">Entrar como cuidador<ArrowRight size={18} aria-hidden="true" /></Link>}</div></article>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="ct-section ct-how" aria-labelledby="contigo-how-title">
        <div className="ct-container"><div className="ct-section-heading"><div><p className="ct-eyebrow">Así funciona CONTIGO</p><h2 id="contigo-how-title">Empezar, paso a paso.</h2></div><Link className="ct-text-link" to={access}>{accessLabel}<ArrowRight size={19} aria-hidden="true" /></Link></div>
          <ol className="ct-steps">
            <li><span className="ct-step-number">01</span><h3>Entra a tu espacio</h3><p>Elige una cuenta de paciente o cuidador para conocer la aplicación con los datos de demostración.</p></li>
            <li><span className="ct-step-number">02</span><h3>Encuentra lo importante</h3><p>El paciente consulta su próxima dosis. El cuidador revisa el resumen de la persona seleccionada.</p></li>
            <li><span className="ct-step-number">03</span><h3>Acompaña el día a día</h3><p>El paciente registra sus tomas y lecturas. El cuidador consulta el seguimiento y las existencias.</p></li>
          </ol>
          <div className="ct-reading-feature"><span className="ct-feature-icon"><Volume2 size={29} aria-hidden="true" /></span><div><h3>Una lectura a tu manera.</h3><p>Texto ampliado, alto contraste y confirmaciones escritas. La lectura por voz es opcional.</p></div><Link to="/accessibility" className="ct-text-link">Accesibilidad y ayuda<ArrowRight size={19} aria-hidden="true" /></Link></div>
        </div>
      </section>

      <section className="ct-final-section" aria-labelledby="contigo-final-title"><div className="ct-container"><div className="ct-final-cta"><div><p>Un espacio para cuidar en familia</p><h2 id="contigo-final-title">Conoce CONTIGO.<br />Empieza con una demostración.</h2></div><Link to={access} className="ct-button ct-button-white">{accessLabel}<ArrowRight size={20} aria-hidden="true" /></Link></div></div></section>
    </main>

    <footer className="ct-footer"><div className="ct-container"><div className="ct-footer-top"><ContigoBrand /><nav aria-label="Enlaces al pie de CONTIGO"><Link to="#hero">Inicio</Link><Link to="#como-funciona">Cómo funciona</Link><Link to="/clinic">Portal de la clínica</Link><Link to="/accessibility">Accesibilidad</Link></nav></div><div className="ct-footer-bottom"><p>CONTIGO · Proyecto académico de seguimiento para paciente y cuidador.</p><p>La clínica ficticia del proyecto comparte recetas y citas con CONTIGO. Los datos son sintéticos y la pauta médica procede de la clínica.</p></div></div></footer>
  </div>;
}
