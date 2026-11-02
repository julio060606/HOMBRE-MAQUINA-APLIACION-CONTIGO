import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, Baby, CalendarDays, Check, ChevronDown, ClipboardList, FileText, FlaskConical, Heart, HeartHandshake, Menu, Plus, ScanLine, Search, ShieldCheck, Smartphone, Sparkles, Stethoscope, Users, X } from 'lucide-react';
import styles from './ClinicPortalPage.module.css';

const navigation = [
  { href: '#especialidades', label: 'Especialidades' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#pacientes', label: 'Pacientes' },
  { href: '#contacto', label: 'Orientación' },
  { href: '#app-contigo', label: 'CONTIGO' },
];
const specialties = [
  { name: 'Medicina general', icon: Stethoscope, subtitle: 'El primer paso para cuidar de tu salud.', description: 'Consulta médica para evaluar tu estado de salud, resolver inquietudes y orientar la continuidad de tu atención.', topics: ['Consulta y evaluación general', 'Controles de salud', 'Orientación y derivación a especialidades'] },
  { name: 'Cardiología', icon: Heart, subtitle: 'Atención especializada para la salud del corazón.', description: 'Evaluación cardiovascular y seguimiento de pacientes, con una visión conjunta de sus antecedentes y controles.', topics: ['Consulta cardiológica', 'Evaluación cardiovascular', 'Seguimiento y controles'] },
  { name: 'Pediatría', icon: Baby, subtitle: 'Acompañamos el crecimiento de los más pequeños.', description: 'Atención de niños y adolescentes, con espacio para escuchar a sus familias y conversar sobre su desarrollo.', topics: ['Consulta pediátrica', 'Control de crecimiento y desarrollo', 'Orientación a madres, padres y cuidadores'] },
  { name: 'Ginecología', icon: Users, subtitle: 'Cuidado de la mujer en cada etapa.', description: 'Consulta ginecológica y controles de salud con una atención cercana, respetuosa y centrada en cada paciente.', topics: ['Consulta ginecológica', 'Controles preventivos', 'Salud de la mujer'] },
  { name: 'Geriatría', icon: HeartHandshake, subtitle: 'Atención integral para la persona adulta mayor.', description: 'Evaluación que considera la salud, la autonomía y el entorno familiar para acompañar las necesidades de cada persona.', topics: ['Valoración geriátrica', 'Seguimiento de la salud', 'Acompañamiento al paciente y su familia'] },
  { name: 'Dermatología', icon: Sparkles, subtitle: 'Cuidamos la salud de tu piel.', description: 'Evaluación de la piel, el cabello y las uñas, con orientación y seguimiento según las necesidades de la consulta.', topics: ['Consulta dermatológica', 'Evaluación de lesiones de la piel', 'Controles y seguimiento'] },
];
const services = [
  { icon: Stethoscope, title: 'Consulta externa', copy: 'Atención ambulatoria en medicina general y especialidades para tus consultas y controles de salud.', link: 'Ver especialidades', to: '#especialidades' },
  { icon: FlaskConical, title: 'Laboratorio clínico', copy: 'Análisis de laboratorio como apoyo a la evaluación médica y al seguimiento de tu salud.', link: 'Preparar mi visita', to: '#pacientes' },
  { icon: ScanLine, title: 'Diagnóstico por imágenes', copy: 'Estudios de apoyo al diagnóstico, coordinados de acuerdo con la orden de tu médico.', link: 'Consultar sobre exámenes', to: '#contacto' },
  { icon: ShieldCheck, title: 'Chequeos preventivos', copy: 'Evaluaciones de salud orientadas a la prevención y a la continuidad de tus controles médicos.', link: 'Orientación al paciente', to: '#contacto' },
];
const shortcuts = [
  { href: '#especialidades', icon: Stethoscope, title: 'Especialidades', description: 'Encuentra tu área de atención.' },
  { href: '#servicios', icon: FlaskConical, title: 'Servicios y exámenes', description: 'Conoce los servicios médicos.' },
  { href: '#pacientes', icon: CalendarDays, title: 'Antes de tu visita', description: 'Prepara tu próxima consulta.' },
  { href: '#app-contigo', icon: Smartphone, title: 'CONTIGO', description: 'Seguimiento desde casa.' },
];
const questions = [
  { question: '¿Qué información debo confirmar al coordinar una cita?', answer: 'Confirma la especialidad, el profesional, la sede, la fecha y la hora de atención. Consulta también la disponibilidad, los costos y las condiciones de tu seguro con admisión.' },
  { question: '¿Qué necesito para un examen de laboratorio o imágenes?', answer: 'Ten a mano la orden médica y consulta al servicio las indicaciones específicas de preparación, el lugar de atención y la forma de entrega de resultados.' },
  { question: '¿Puedo acudir con un acompañante?', answer: 'Consulta con admisión las condiciones de acompañamiento para tu servicio. Comunica si necesitas apoyo de accesibilidad o asistencia durante tu visita.' },
  { question: '¿Cómo continúo el seguimiento después de la consulta?', answer: 'Conserva tus indicaciones y resultados, y coordina el siguiente control según lo acordado con tu médico. CONTIGO permite registrar tomas y mediciones para el seguimiento en casa.' },
];
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();

export function ClinicPortalPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSpecialty, setActiveSpecialty] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const menuButton = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const query = normalize(searchTerm);
  const filteredSpecialties = specialties.map((item, index) => ({ ...item, index })).filter(item => normalize([item.name, item.subtitle, item.description, ...item.topics].join(' ')).includes(query));
  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);
  const closeMenu = () => setMenuOpen(false);
  const clearSearch = () => { setSearchTerm(''); searchInput.current?.focus(); };

  return <div className={styles.page}>
    <header className={styles.header}>
      <div className={`${styles.container} ${styles.headerInner}`}>
        <Link to="/clinic" className={styles.brand} aria-label="Clínica San Pablo, inicio" onClick={closeMenu}><span className={styles.brandMark}><Plus size={28} strokeWidth={2.5} aria-hidden="true" /></span><span><span className={styles.brandOverline}>Clínica</span><strong>San Pablo</strong></span></Link>
        <nav className={styles.desktopNav} aria-label="Navegación del portal">{navigation.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>
        <div className={styles.headerActions}><a href="#pacientes" className={styles.headerLogin}>Planificar visita<CalendarDays size={17} aria-hidden="true" /></a><button ref={menuButton} type="button" className={styles.menuButton} aria-expanded={menuOpen} aria-controls="clinic-mobile-navigation" aria-label={menuOpen ? 'Cerrar menú del portal' : 'Abrir menú del portal'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}</button></div>
      </div>
      <nav id="clinic-mobile-navigation" className={`${styles.mobileNav} ${menuOpen ? styles.mobileNavOpen : ''}`} aria-label="Navegación móvil del portal" hidden={!menuOpen}>{navigation.map(item => <a key={item.href} href={item.href} onClick={closeMenu}>{item.label}<ArrowRight size={18} aria-hidden="true" /></a>)}<Link to="/login" onClick={closeMenu}>Acceder a CONTIGO<ArrowRight size={18} aria-hidden="true" /></Link></nav>
    </header>

    <main>
      <section className={styles.hero} aria-labelledby="clinic-title">
        <figure className={styles.heroPhoto}><img src="/images/doctor_report.jpg" alt="Médico revisando información durante una consulta." width="1200" height="896" fetchPriority="high" /></figure>
        <div className={`${styles.container} ${styles.heroContent}`}><div className={styles.heroCopy}><p className={styles.eyebrow}><span className={styles.orangeLine} /> Clínica San Pablo</p><h1 id="clinic-title">Tu salud merece <span>una atención cercana.</span></h1><p className={styles.heroDescription}>Consulta médica, especialidades y servicios de diagnóstico para cuidar de ti y de tu familia en cada etapa de la vida.</p><div className={styles.heroActions}><a href="#especialidades" className={styles.primaryButton}>Ver especialidades<ArrowRight size={19} aria-hidden="true" /></a><a href="#pacientes" className={styles.secondaryButton}>Planificar mi visita<ArrowDown size={18} aria-hidden="true" /></a></div><p className={styles.heroSignature}><HeartHandshake size={21} aria-hidden="true" /> Una atención que empieza por escucharte.</p></div></div>
      </section>

      <nav className={`${styles.container} ${styles.quickLinks}`} aria-label="Accesos rápidos para pacientes">{shortcuts.map((item, index) => {
        const Icon = item.icon;
        return <a href={item.href} key={item.href} className={styles.quickCard}><span className={styles.quickIcon}><Icon size={28} strokeWidth={1.7} aria-hidden="true" /></span><span className={styles.quickText}><span className={styles.quickIndex}>0{index + 1}</span><strong>{item.title}</strong><span>{item.description}</span></span><ArrowRight className={styles.quickArrow} size={19} aria-hidden="true" /></a>;
      })}</nav>

      <section id="especialidades" className={`${styles.container} ${styles.specialtiesSection}`} aria-labelledby="specialties-title">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Nuestras especialidades</p><h2 id="specialties-title">Encuentra el cuidado<br className={styles.desktopBreak} /> que estás buscando.</h2></div><p>Conoce nuestras áreas de atención y encuentra la especialidad que buscas para tu próxima consulta.</p></div>
        <div className={styles.searchToolbar}><div role="search" aria-label="Buscador de especialidades" className={styles.searchBlock}><label htmlFor="clinic-specialty-search">Buscar una especialidad</label><div className={styles.searchField}><Search size={21} aria-hidden="true" /><input ref={searchInput} id="clinic-specialty-search" type="search" placeholder="Nombre o área de atención" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} aria-controls="clinic-specialty-results" />{searchTerm && <button type="button" onClick={clearSearch}><X size={17} aria-hidden="true" />Limpiar</button>}</div></div><p role="status" aria-live="polite" aria-atomic="true" className={styles.searchCount}>{filteredSpecialties.length ? <><strong>{String(filteredSpecialties.length).padStart(2, '0')}</strong><span>{filteredSpecialties.length === 1 ? 'especialidad encontrada' : query ? 'especialidades encontradas' : 'áreas de atención'}</span></> : 'No hay resultados para tu búsqueda.'}</p></div>
        <div id="clinic-specialty-results" className={styles.accordion}>{filteredSpecialties.map(item => {
          const open = activeSpecialty === item.index;
          const Icon = item.icon;
          return <div key={item.name} className={`${styles.specialtyItem} ${open ? styles.specialtyActive : ''}`}><h3><button id={`clinic-specialty-${item.index}`} type="button" aria-expanded={open} aria-controls={`clinic-specialty-panel-${item.index}`} onClick={() => setActiveSpecialty(open ? null : item.index)}><span className={styles.specialtyIcon}><Icon size={25} strokeWidth={1.7} aria-hidden="true" /></span><span>{item.name}</span><span className={styles.accordionToggle}><Plus className={open ? styles.plusOpen : ''} size={20} aria-hidden="true" /></span></button></h3><div id={`clinic-specialty-panel-${item.index}`} role="region" aria-labelledby={`clinic-specialty-${item.index}`} hidden={!open} className={styles.specialtyPanel}><p className={styles.specialtySubtitle}>{item.subtitle}</p><p>{item.description}</p><ul>{item.topics.map(topic => <li key={topic}><Check size={17} aria-hidden="true" />{topic}</li>)}</ul></div></div>;
        })}{!filteredSpecialties.length && <div className={styles.emptySearch}><span><Search size={30} aria-hidden="true" /></span><h3>No encontramos esa especialidad</h3><p>Prueba con otra palabra, como «corazón» o «piel», o consulta todas las áreas de atención.</p><button type="button" className={styles.secondaryButton} onClick={clearSearch}>Ver todas las especialidades<ArrowRight size={18} aria-hidden="true" /></button></div>}</div>
      </section>

      <section id="servicios" className={styles.servicesSection} aria-labelledby="services-title"><div className={styles.container}><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Nuestros servicios</p><h2 id="services-title">Tu atención, de principio a fin.</h2></div><p>Desde una consulta hasta los estudios de apoyo, conoce los servicios que acompañan tu atención médica.</p></div><div className={styles.serviceGrid}>{services.map((item, index) => {
        const Icon = item.icon;
        return <article key={item.title} className={styles.serviceCard}><div className={styles.serviceCardTop}><span className={styles.serviceIcon}><Icon size={30} strokeWidth={1.6} aria-hidden="true" /></span><span className={styles.serviceNumber}>0{index + 1}</span></div><h3>{item.title}</h3><p>{item.copy}</p><a href={item.to}>{item.link}<ArrowRight size={18} aria-hidden="true" /></a></article>;
      })}</div></div></section>

      <section id="elegirnos" className={`${styles.container} ${styles.approachSection}`} aria-labelledby="approach-title"><div className={styles.approachTitle}><p className={styles.eyebrow}>Nuestra forma de cuidar</p><h2 id="approach-title">Cercanía en cada paso.</h2><p>Cuidar tu salud también significa comprender tus inquietudes, explicarte cada paso y acompañarte en tus controles.</p></div><div className={styles.approachItems}>{[{ icon: HeartHandshake, title: 'Trato cercano y respetuoso', copy: 'Un espacio para conversar sobre tu salud, resolver dudas y expresar lo que necesitas.' }, { icon: FileText, title: 'Información clara', copy: 'Indicaciones comprensibles para conocer los siguientes pasos de tu atención.' }, { icon: Users, title: 'Acompañamiento familiar', copy: 'La familia y los cuidadores también forman parte del cuidado, según las preferencias de cada paciente.' }].map(item => {
        const Icon = item.icon;
        return <article key={item.title}><span><Icon size={31} strokeWidth={1.5} aria-hidden="true" /></span><h3>{item.title}</h3><p>{item.copy}</p></article>;
      })}</div></section>

      <section id="pacientes" className={styles.patientSection} aria-labelledby="patients-title"><div className={styles.container}><div className={styles.patientHeading}><div><p className={styles.eyebrow}>Antes de tu visita</p><h2 id="patients-title">Llega con tus preguntas.<br />Y con todo lo que necesitas.</h2></div><p>Ten a mano la información de tu atención para que puedas dedicar tu consulta a lo más importante: tu salud.</p></div><ol className={styles.visitSteps}><li><div className={styles.stepTop}><span>01</span><CalendarDays size={27} strokeWidth={1.6} aria-hidden="true" /></div><h3>Coordina tu atención</h3><p>Identifica la especialidad y confirma la fecha, la hora y la disponibilidad con el área de admisión.</p></li><li><div className={styles.stepTop}><span>02</span><ClipboardList size={27} strokeWidth={1.6} aria-hidden="true" /></div><h3>Prepara tus documentos</h3><p>Lleva tu documento de identidad, órdenes médicas y resultados anteriores relacionados con tu consulta. Si usas un seguro, verifica tu cobertura.</p></li><li><div className={styles.stepTop}><span>03</span><HeartHandshake size={27} strokeWidth={1.6} aria-hidden="true" /></div><h3>Conversa con tu médico</h3><p>Comparte tus inquietudes, tus antecedentes y los medicamentos que utilizas. Consulta las dudas que tengas sobre las indicaciones recibidas.</p></li></ol></div></section>

      <section id="contacto" className={`${styles.container} ${styles.patientSupport}`} aria-labelledby="support-title"><div className={styles.supportHeading}><p className={styles.eyebrow}>Atención al paciente</p><h2 id="support-title">Respuestas para<br />tu próxima visita.</h2><p>Información útil sobre consultas, exámenes y continuidad de tu atención.</p><a href="#pacientes" className={styles.textLink}>Ver guía de preparación<ArrowRight size={19} aria-hidden="true" /></a></div><div className={styles.faqList}>{questions.map(item => <details key={item.question} className={styles.faqItem}><summary><span>{item.question}</span><ChevronDown size={21} aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div></section>

      <section id="app-contigo" className={styles.contigoSection} aria-labelledby="contigo-title"><div className={`${styles.container} ${styles.contigoCard}`}><div className={styles.contigoCopy}><p className={styles.eyebrow}><Smartphone size={19} aria-hidden="true" /> Seguimiento en casa</p><h2 id="contigo-title">Tu cuidado continúa<br />con CONTIGO.</h2><p>Conoce nuestro espacio digital para registrar tomas de medicamentos y mediciones, y compartir el seguimiento con tu cuidador.</p><div className={styles.contigoActions}><Link to="/landing#hero" className={styles.primaryButton}>Conocer CONTIGO<ArrowRight size={19} aria-hidden="true" /></Link><Link to="/login" className={styles.textLink}>Ingresar a mi cuenta<ArrowRight size={18} aria-hidden="true" /></Link></div></div><div className={styles.roleCards} aria-label="Dos experiencias conectadas"><div className={styles.roleCard}><span className={styles.roleIcon}><Heart size={23} aria-hidden="true" /></span><div><p>Para el paciente</p><h3>Un paso a la vez.</h3><span>Consultar la dosis, registrar la toma y añadir mediciones.</span></div></div><div className={styles.roleCard}><span className={styles.roleIcon}><Users size={23} aria-hidden="true" /></span><div><p>Para el cuidador</p><h3>Una visión compartida.</h3><span>Revisar tratamiento, existencias y próximas citas.</span></div></div></div></div></section>
    </main>

    <footer className={styles.footer}><div className={`${styles.container} ${styles.footerTop}`}><div><Link to="/clinic" className={styles.brand}><span className={styles.brandMark}><Plus size={26} aria-hidden="true" /></span><span><span className={styles.brandOverline}>Clínica</span><strong>San Pablo</strong></span></Link><p>Atención cercana para cuidar de ti<br />y de quienes más quieres.</p></div><nav aria-label="Enlaces al pie del portal"><a href="#especialidades">Especialidades</a><a href="#servicios">Servicios médicos</a><a href="#pacientes">Antes de tu visita</a><a href="#contacto">Atención al paciente</a><Link to="/landing#hero">Plataforma CONTIGO</Link><Link to="/accessibility">Accesibilidad y ayuda</Link></nav></div><div className={`${styles.container} ${styles.footerBottom}`}><p>Clínica San Pablo · Cuidamos de ti y tu familia.</p><p>Prototipo académico con contenido e imágenes ilustrativos. No gestiona citas reales.</p></div></footer>
  </div>;
}
