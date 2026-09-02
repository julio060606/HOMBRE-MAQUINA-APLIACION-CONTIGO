import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  Award, 
  Phone, 
  Clock, 
  Smartphone, 
  MapPin, 
  FileText, 
  Stethoscope, 
  Activity, 
  CheckCircle2, 
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Quote,
  HeartPulse,
  Sparkles
} from 'lucide-react';

export const ClinicPortalPage: React.FC = () => {
  // Carrusel vertical del Hero
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  // Especialidad seleccionada para ver detalles expandidos
  const [activeSpecialty, setActiveSpecialty] = useState<number | null>(0);

  const heroSlides = [
    {
      id: 1,
      tag: 'NUEVA UNIDAD CLÍNICA',
      title: 'Cardiogeriatría y Monitoreo Continuo',
      desc: 'Diagnóstico precoz y seguimiento integral de patologías cardiovasculares en el adulto mayor.',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      tag: 'PROGRAMA PREVENTIVO',
      title: 'Chequeo Integral Senior 2026',
      desc: 'Evaluación geriátrica multidimensional con laboratorio de alta precisión y diagnóstico por imágenes.',
      image: 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: 3,
      tag: 'ASISTENCIA DOMICILIARIA',
      title: 'Laboratorio y Farmacia a Domicilio',
      desc: 'Toma de muestras y entrega puntual de tratamientos crónicos directamente en su hogar.',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroIndex(prev => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const specialtiesData = [
    {
      id: 0,
      name: 'Geriatría Integral',
      short: 'Atención especializada para la salud física, cognitiva y funcional del adulto mayor.',
      details: 'Nuestro equipo aborda síndromes de fragilidad, demencias, polifarmacia y rehabilitación motriz con protocolos avalados internacionalmente.',
      image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&auto=format&fit=crop&q=80',
      staffCount: 14,
      headDoctor: 'Dr. Alejandro Morales · CMP 34512',
    },
    {
      id: 1,
      name: 'Cardiología & Hemodinámica',
      short: 'Prevención, diagnóstico y tratamiento de arritmias, insuficiencia cardíaca e hipertensión.',
      details: 'Equipados con ecocardiografía 4D, ergometría computarizada y sala de cateterismo cardíaco 24/7.',
      image: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=800&auto=format&fit=crop&q=80',
      staffCount: 18,
      headDoctor: 'Dra. Patricia Valdivia · CMP 41209',
    },
    {
      id: 2,
      name: 'Neurología & Memoria',
      short: 'Diagnóstico precoz de trastornos neurodegenerativos y deterioro cognitivo.',
      details: 'Unidad de memoria especializada en Alzheimer, Parkinson y rehabilitación neuropsicológica personalizada.',
      image: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&auto=format&fit=crop&q=80',
      staffCount: 9,
      headDoctor: 'Dr. Fernando Castro · CMP 29871',
    },
    {
      id: 3,
      name: 'Medicina Interna',
      short: 'Manejo clínico global de enfermedades crónicas complejas y multimorbilidad.',
      details: 'Coordinación clínica entre distintas especialidades para tratamientos farmacológicos equilibrados y seguros.',
      image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&auto=format&fit=crop&q=80',
      staffCount: 22,
      headDoctor: 'Dra. Cecilia Ugarte · CMP 38714',
    },
  ];

  const insurers = [
    { name: 'Rímac Seguros' },
    { name: 'Pacífico Salud' },
    { name: 'Mapfre Perú' },
    { name: 'Sanitas EPS' },
    { name: 'La Positiva' },
    { name: 'Plan Salud EPS' },
  ];

  const sedesList = [
    {
      name: 'Sede Principal · San Borja',
      address: 'Av. Guardia Civil 450, San Borja',
      hours: 'Emergencias 24h · Consultas 07:00 - 21:00',
      phone: '(01) 610-8000',
      image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Sede Especialidades · San Isidro',
      address: 'Av. Javier Prado Este 1280, San Isidro',
      hours: 'Consultas y Procedimientos 08:00 - 20:00',
      phone: '(01) 610-8020',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Sede Centro Ambulatorio · Surco',
      address: 'Av. Primavera 620, Chacarilla, Surco',
      hours: 'Laboratorio y Consulta Senior 07:00 - 19:00',
      phone: '(01) 610-8040',
      image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=600&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-950">
      
      {/* 1. NAVBAR - Zero Curvature, Sample Vector Logo, Clean Divider */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Sample Vector Logo */}
          <Link to="/clinic" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-blue-900 flex items-center justify-center text-white shadow-sm transition-all group-hover:bg-blue-950">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter">
                <path d="M12 2v20M2 12h20" />
                <rect x="5" y="5" width="14" height="14" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-semibold text-lg text-slate-950 tracking-wider uppercase leading-none">
                CENTRO MÉDICO
              </span>
              <span className="text-[10px] text-blue-800 font-heading font-medium tracking-widest uppercase mt-0.5">
                Salud & Especialidades
              </span>
            </div>
          </Link>

          {/* Menú de Navegación */}
          <nav className="hidden lg:flex items-center space-x-8 text-xs font-heading font-medium text-slate-600 uppercase tracking-wider">
            <a href="#especialidades" className="hover:text-blue-900 transition-colors">Especialidades</a>
            <a href="#servicios" className="hover:text-blue-900 transition-colors">Nuestros Servicios</a>
            <a href="#elegirnos" className="hover:text-blue-900 transition-colors">Por Qué Elegirnos</a>
            <a href="#app-contigo" className="text-forest-700 hover:text-forest-800 font-semibold flex items-center gap-1.5 transition-colors">
              <Sparkles className="w-3.5 h-3.5 text-forest-700" />
              <span>App CONTIGO</span>
            </a>
            <a href="#sedes" className="hover:text-blue-900 transition-colors">Sedes</a>
          </nav>

          {/* Acciones Navbar: Usuario | Agendar Cita */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => alert('Portal del Paciente / Iniciar Sesión (Simulado).')}
              title="Mi Portal Clínico"
              className="p-2 text-slate-600 hover:text-blue-900 hover:bg-slate-100 transition flex items-center gap-2 text-xs font-heading font-medium tracking-wide uppercase"
            >
              <User className="w-4 h-4 text-blue-900" />
              <span className="hidden sm:inline">Mi Portal</span>
            </button>

            <span className="text-slate-300 font-light text-base select-none">|</span>

            <button
              onClick={() => alert('Módulo de Agendamiento de Citas (Simulado).')}
              className="bg-blue-900 hover:bg-blue-950 text-white font-heading font-medium text-xs uppercase tracking-wider px-6 py-3 transition-all flex items-center gap-2 shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Agendar Cita</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION - Elegante, Light Typography, Seamless Bottom Fade, Vertical News Cards */}
      <section className="relative min-h-[640px] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white overflow-hidden flex flex-col justify-between pt-16 pb-20">
        
        {/* Imagen de fondo sutil */}
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&auto=format&fit=crop&q=80')` }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Columna Izquierda: Slogan refinado y ligero */}
            <div className="lg:col-span-7 space-y-6">
              
              <h1 className="text-4xl sm:text-6xl font-heading font-light tracking-tight leading-[1.15] text-white">
                Estamos contigo para tu cuidado y el de <span className="font-normal text-blue-200">tu familia.</span>
              </h1>

              <p className="text-xl sm:text-2xl text-blue-100/90 font-heading font-light tracking-wide pt-2">
                ¿Qué se te ofrece hoy?
              </p>

              {/* Accesos Rápidos Rectangulares (0 curvatura) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 max-w-xl">
                <button 
                  onClick={() => alert('Buscador de especialistas médicos.')}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 p-4 text-left transition flex items-center gap-3 group"
                >
                  <Stethoscope className="w-5 h-5 text-blue-300 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-heading font-medium tracking-wide uppercase text-white">Buscar Médico</div>
                    <div className="text-[11px] text-blue-200/80 font-light">Especialidades</div>
                  </div>
                </button>

                <button 
                  onClick={() => alert('Consulta de resultados de laboratorio.')}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 p-4 text-left transition flex items-center gap-3 group"
                >
                  <FileText className="w-5 h-5 text-emerald-300 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-heading font-medium tracking-wide uppercase text-white">Resultados</div>
                    <div className="text-[11px] text-blue-200/80 font-light">Laboratorio Web</div>
                  </div>
                </button>

                <button 
                  onClick={() => alert('Central de Urgencias y Ambulancias 24h.')}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 p-4 text-left transition flex items-center gap-3 group"
                >
                  <Phone className="w-5 h-5 text-rose-300 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-heading font-medium tracking-wide uppercase text-white">Emergencias</div>
                    <div className="text-[11px] text-blue-200/80 font-light">Central 24 Horas</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Columna Derecha: Carrusel Vertical con Imágenes y Degradado Oscuro */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/80 backdrop-blur-md border border-white/15 p-4 shadow-2xl relative">
                
                {/* Cabecera del Slider */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <span className="text-[10px] font-heading font-semibold uppercase tracking-widest text-blue-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                    Destacados de la Semana
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setActiveHeroIndex(prev => (prev - 1 + heroSlides.length) % heroSlides.length)}
                      className="p-1 bg-white/10 hover:bg-white/20 text-white transition"
                      title="Anterior"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setActiveHeroIndex(prev => (prev + 1) % heroSlides.length)}
                      className="p-1 bg-white/10 hover:bg-white/20 text-white transition"
                      title="Siguiente"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tarjeta Vertical con Degradado Oscuro Integrado */}
                <div className="relative h-80 w-full overflow-hidden group">
                  <img 
                    src={heroSlides[activeHeroIndex].image} 
                    alt={heroSlides[activeHeroIndex].title}
                    className="w-full h-full object-cover transition-all duration-700 transform group-hover:scale-105"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex flex-col justify-end p-5">
                    <span className="text-[9px] font-heading font-semibold uppercase tracking-widest text-blue-300 mb-1">
                      {heroSlides[activeHeroIndex].tag}
                    </span>
                    <h3 className="font-heading font-medium text-base text-white leading-snug">
                      {heroSlides[activeHeroIndex].title}
                    </h3>
                    <p className="text-xs text-slate-300 font-light mt-1 line-clamp-2 leading-relaxed">
                      {heroSlides[activeHeroIndex].desc}
                    </p>

                    <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between">
                      <div className="flex gap-1">
                        {heroSlides.map((_, idx) => (
                          <span 
                            key={idx} 
                            className={`h-1 transition-all ${idx === activeHeroIndex ? 'w-6 bg-blue-400' : 'w-2 bg-white/30'}`}
                          />
                        ))}
                      </div>
                      <button 
                        onClick={() => alert(`Información sobre: ${heroSlides[activeHeroIndex].title}`)}
                        className="text-[11px] font-heading font-medium text-blue-200 hover:text-white uppercase tracking-wider flex items-center gap-1"
                      >
                        <span>Más información</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Degradado inferior que se funde en blanco */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-b from-transparent to-slate-50 pointer-events-none"></div>

      </section>

      {/* 3. SECCIÓN: ATENCIÓN MÉDICA (Título a la izquierda + Grid 2x2 a la derecha) */}
      <section id="servicios" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-28">
            <span className="text-[11px] font-heading font-semibold text-blue-800 uppercase tracking-widest block">
              Infraestructura & Especialidades
            </span>
            <h2 className="text-3xl sm:text-4xl font-heading font-light tracking-tight text-slate-950 leading-tight">
              Atención médica de alta complejidad y <span className="font-normal">calidez humana.</span>
            </h2>
            <p className="text-sm text-slate-600 font-light leading-relaxed pt-2">
              Contamos con tecnología diagnóstica de última generación y áreas clínicas diseñadas para garantizar la máxima seguridad y bienestar de nuestros pacientes en cada etapa.
            </p>

            <div className="pt-4">
              <button 
                onClick={() => alert('Descargar Catálogo de Servicios Clínicos.')}
                className="inline-flex items-center gap-2 text-xs font-heading font-semibold text-blue-900 hover:text-blue-950 uppercase tracking-wider border-b border-blue-900 pb-1"
              >
                <span>Descargar Guía de Servicios</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            <div className="bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between group">
              <div className="h-44 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80" 
                  alt="Consulta Externa" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent"></div>
                <span className="absolute bottom-3 left-3 text-white font-heading font-medium text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-300" /> Consulta Ambulatoria
                </span>
              </div>
              <div className="p-5 space-y-2">
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  Más de 40 consultorios médicos con horarios extendidos y gestión digital de recetas.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between group">
              <div className="h-44 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=600&auto=format&fit=crop&q=80" 
                  alt="Diagnóstico por Imágenes" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent"></div>
                <span className="absolute bottom-3 left-3 text-white font-heading font-medium text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-300" /> Diagnóstico por Imágenes
                </span>
              </div>
              <div className="p-5 space-y-2">
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  Resonador Magnético 3.0 Tesla y Tomógrafo Multicorte con resultados en línea.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between group">
              <div className="h-44 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80" 
                  alt="Emergencias 24h" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent"></div>
                <span className="absolute bottom-3 left-3 text-white font-heading font-medium text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-300" /> Emergencias 24 Horas
                </span>
              </div>
              <div className="p-5 space-y-2">
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  Unidades de trauma shock, sala de observación y ambulancias medicalizadas tipo III.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between group">
              <div className="h-44 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=600&auto=format&fit=crop&q=80" 
                  alt="Unidad Senior" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent"></div>
                <span className="absolute bottom-3 left-3 text-white font-heading font-medium text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-emerald-300" /> Centro Geriátrico Integral
                </span>
              </div>
              <div className="p-5 space-y-2">
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  Ambientes adaptados con accesibilidad ergonómica y atención multidisciplinaria.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. SECCIÓN: ESPECIALIDADES DESTACADAS CON DETALLE EXPANDIBLE INTERACTIVO */}
      <section id="especialidades" className="py-20 bg-slate-100 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-heading font-semibold text-blue-800 uppercase tracking-widest block mb-1">
              Cartera Médica Especializada
            </span>
            <h2 className="text-3xl font-heading font-light text-slate-950 tracking-tight">
              Especialidades Destacadas
            </h2>
            <p className="text-xs text-slate-500 font-light mt-2">
              Haz clic en cualquier especialidad para ver su staff, procedimientos y enfoque clínico.
            </p>
          </div>

          {/* Selector de Especialidades */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {specialtiesData.map((esp) => (
              <button
                key={esp.id}
                onClick={() => setActiveSpecialty(activeSpecialty === esp.id ? null : esp.id)}
                className={`p-4 text-left border transition-all ${
                  activeSpecialty === esp.id
                    ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                    : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-medium text-sm tracking-wide">{esp.name}</span>
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform ${activeSpecialty === esp.id ? 'rotate-90' : ''}`} />
                </div>
                <span className={`text-[10px] block mt-1 ${activeSpecialty === esp.id ? 'text-blue-200' : 'text-slate-400'}`}>
                  {esp.staffCount} Especialistas
                </span>
              </button>
            ))}
          </div>

          {/* Panel de Detalle Expandido */}
          {activeSpecialty !== null && (
            <div className="bg-white border border-slate-300 p-6 sm:p-8 shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-4 h-56 overflow-hidden">
                  <img 
                    src={specialtiesData[activeSpecialty].image} 
                    alt={specialtiesData[activeSpecialty].name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="lg:col-span-8 space-y-3">
                  <div className="text-xs font-heading font-semibold text-blue-800 uppercase tracking-wider">
                    {specialtiesData[activeSpecialty].headDoctor}
                  </div>
                  <h3 className="text-2xl font-heading font-medium text-slate-950">
                    {specialtiesData[activeSpecialty].name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-light leading-relaxed">
                    {specialtiesData[activeSpecialty].details}
                  </p>
                  <div className="pt-2 flex items-center gap-4">
                    <button 
                      onClick={() => alert(`Agendando consulta en ${specialtiesData[activeSpecialty].name}`)}
                      className="bg-blue-900 hover:bg-blue-950 text-white font-heading font-medium text-xs uppercase tracking-wider px-6 py-2.5 transition flex items-center gap-2"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Agendar Consulta</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 5. SECCIÓN: ¿POR QUÉ ELEGIRNOS? (Testimonio Médico + Certificación) */}
      <section id="elegirnos" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          <div className="lg:col-span-6 bg-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between border border-slate-800 relative overflow-hidden">
            <div className="space-y-6 relative z-10">
              <Quote className="w-10 h-10 text-blue-400 opacity-60" />
              <blockquote className="text-lg sm:text-xl font-heading font-light leading-relaxed text-slate-100">
                "Nuestra vocación no se limita a tratar enfermedades; acompañamos a cada paciente y a su entorno familiar con diagnósticos certeros, calidez y seguimiento médico continuo."
              </blockquote>
            </div>

            <div className="flex items-center space-x-4 pt-8 border-t border-slate-800 mt-6 relative z-10">
              <img 
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80" 
                alt="Dr. Roberto Santillán" 
                className="w-14 h-14 object-cover border-2 border-blue-500" 
              />
              <div>
                <h4 className="font-heading font-medium text-sm text-white">Dr. Roberto Santillán</h4>
                <p className="text-[11px] text-blue-300 font-light">Director del Departamento de Geriatría y Medicina Interna</p>
                <p className="text-[10px] text-slate-400 font-mono">CMP: 28419 · RNE: 14502</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white border border-slate-200 p-8 sm:p-10 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[11px] font-heading font-semibold text-blue-800 uppercase tracking-widest block">
                Acreditaciones & Calidad
              </span>
              <h3 className="text-2xl sm:text-3xl font-heading font-light text-slate-950">
                Estándares hospitalarios con validación internacional.
              </h3>
              <p className="text-xs text-slate-600 font-light leading-relaxed">
                Auditados bajo normativas internacionales de bioseguridad, control farmacológico y trato humanizado al paciente de la tercera edad.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-slate-100">
              <div className="p-4 bg-slate-50 border border-slate-200">
                <div className="text-2xl font-heading font-semibold text-blue-900">30+</div>
                <div className="text-xs font-heading font-medium text-slate-700 mt-1 uppercase tracking-wider">Años de Trayectoria</div>
                <p className="text-[10px] text-slate-400 font-light mt-0.5">Compromiso continuo con la salud peruana.</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200">
                <div className="text-2xl font-heading font-semibold text-forest-700">100%</div>
                <div className="text-xs font-heading font-medium text-slate-700 mt-1 uppercase tracking-wider">Médicos Colegiados</div>
                <p className="text-[10px] text-slate-400 font-light mt-0.5">Especialistas con posgrado internacional.</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. ⭐ SECCIÓN DE LA APP CONTIGO (A TODO LO ANCHO · Cuadro verde a la izquierda difuminado hacia la derecha con letras oscuras) */}
      <section 
        id="app-contigo" 
        className="w-full py-20 border-y border-slate-200 relative overflow-hidden bg-gradient-to-r from-forest-800 via-forest-700/70 via-forest-100/40 to-slate-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Izquierda: Imagen del celular con la App (Fondo verde profundo) */}
            <div className="lg:col-span-5 flex justify-center">
              
              {/* 
                ========================================================================================
                📌 INSTRUCCIÓN PARA REEMPLAZAR LA IMAGEN DEL CELULAR:
                Reemplaza la URL en el atributo 'src' de la etiqueta <img> de abajo con la ruta 
                de tu imagen de Figma o screenshot local (ej: '/assets/mockup_celular.png').
                ========================================================================================
              */}
              <div className="w-72 sm:w-80 bg-slate-950 p-3 shadow-2xl border-4 border-slate-800 relative group">
                <div className="relative aspect-[9/16] overflow-hidden bg-slate-900">
                  <img 
                    src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=700&auto=format&fit=crop&q=80" 
                    alt="App Contigo - Captura Móvil" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Overlay simulado de la interfaz Contigo */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent p-5 text-white">
                    <span className="text-[10px] font-heading font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                      CONTIGO PACIENTE v1.0
                    </span>
                    <h4 className="font-heading font-bold text-sm text-white">Interfaz Ultra-Accesible</h4>
                    <p className="text-[11px] text-slate-300 font-light mt-0.5">
                      Botones grandes, lectura por voz y confirmación visual con fotos de pastillas.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Derecha: Especificaciones de la App con LETRAS EN NEGRO / OSCURO */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-forest-700 text-white text-xs font-heading font-semibold uppercase tracking-widest shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" /> Lanzamiento Digital Exclusivo
              </div>

              <h2 className="text-3xl sm:text-5xl font-heading font-light text-slate-950 tracking-tight leading-tight">
                Lanzamos nuestra App de Teleasistencia: <span className="font-normal text-forest-700">CONTIGO</span>
              </h2>

              <p className="text-base sm:text-lg text-slate-700 font-light leading-relaxed">
                Supervisa las pastillas, signos vitales y emergencias de tus padres en tiempo real desde tu celular o navegador web, integrado de forma directa con nuestro centro médico.
              </p>

              {/* Especificaciones breves con texto oscuro de alto contraste */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-800 font-normal">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-forest-700 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">Pastillero interactivo con foto real de los fármacos.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-forest-700 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">Registro de presión arterial asistido por voz.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-forest-700 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">Botón de auxilio inmediato y alertas por omisión.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-forest-700 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">Generador de reportes en PDF para consulta médica.</span>
                </div>
              </div>

              {/* Botón hacia la landing oficial de Contigo */}
              <div className="pt-4">
                <Link
                  to="/landing"
                  data-testid="btn-go-to-contigo-landing-main"
                  className="inline-flex items-center gap-3 bg-forest-700 hover:bg-forest-800 text-white font-heading font-semibold text-xs sm:text-sm uppercase tracking-wider px-8 py-4 shadow-soft-lg transition-all group"
                >
                  <Smartphone className="w-4 h-4 text-emerald-300" />
                  <span>Conocer la Plataforma CONTIGO</span>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1.5 transition-transform" />
                </Link>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* 7. SECCIÓN: SEDES (Fotos reales y detalles de contacto) */}
      <section id="sedes" className="py-20 bg-slate-100/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-[11px] font-heading font-semibold text-blue-800 uppercase tracking-widest block mb-1">
                Presencia y Cobertura
              </span>
              <h2 className="text-3xl font-heading font-light text-slate-950 tracking-tight">
                Nuestras Sedes de Atención
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-light max-w-md">
              Infraestructura diseñada para ofrecer comodidad, accesibilidad y atención médica inmediata.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sedesList.map((sede, idx) => (
              <div key={idx} className="bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="h-48 overflow-hidden">
                  <img src={sede.image} alt={sede.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-5 space-y-3">
                  <h4 className="font-heading font-medium text-base text-slate-950">{sede.name}</h4>
                  <div className="space-y-1.5 text-xs text-slate-600 font-light">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-800 flex-shrink-0 mt-0.5" />
                      <span>{sede.address}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 text-blue-800 flex-shrink-0 mt-0.5" />
                      <span>{sede.hours}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="w-3.5 h-3.5 text-blue-800 flex-shrink-0 mt-0.5" />
                      <span>{sede.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. SECCIÓN: CONVENIOS CON ASEGURADORAS Y EPS */}
      <section className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[11px] font-heading font-semibold text-slate-400 uppercase tracking-widest mb-8">
            Convenios con las principales EPS y Compañías de Seguros
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 items-center">
            {insurers.map((ins, idx) => (
              <div 
                key={idx} 
                className="p-4 border border-slate-200 bg-slate-50 text-center font-heading font-medium text-xs text-slate-700 tracking-wider uppercase hover:border-blue-300 transition-colors"
              >
                {ins.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FOOTER INSTITUCIONAL COMPLETO */}
      <footer className="bg-slate-950 text-slate-400 font-sans pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
            
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-blue-900 flex items-center justify-center text-white">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 2v20M2 12h20" />
                  </svg>
                </div>
                <div>
                  <span className="text-lg font-heading font-medium text-white tracking-wider uppercase block">
                    CENTRO MÉDICO
                  </span>
                  <span className="text-[10px] text-blue-400 font-heading font-light tracking-widest uppercase">
                    RUC: 20458932101
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-light leading-relaxed max-w-sm">
                Comprometidos con la excelencia asistencial, la investigación médica y la humanización de la salud en el Perú.
              </p>
              <div className="pt-2 text-xs space-y-1.5 text-slate-400 font-light">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Av. Guardia Civil 450, San Borja, Lima</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Central de Emergencias: (01) 610-8000</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-heading font-medium text-white text-xs uppercase tracking-wider">Especialidades</h4>
              <ul className="space-y-2 text-slate-400 font-light">
                <li><a href="#especialidades" className="hover:text-white transition">Geriatría Integral</a></li>
                <li><a href="#especialidades" className="hover:text-white transition">Cardiología Clínica</a></li>
                <li><a href="#especialidades" className="hover:text-white transition">Neurología & Memoria</a></li>
                <li><a href="#especialidades" className="hover:text-white transition">Medicina Interna</a></li>
                <li><a href="#especialidades" className="hover:text-white transition">Rehabilitación Motriz</a></li>
              </ul>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-heading font-medium text-white text-xs uppercase tracking-wider">Servicios al Paciente</h4>
              <ul className="space-y-2 text-slate-400 font-light">
                <li><a href="#portal" onClick={e => { e.preventDefault(); alert('Portal de Paciente'); }} className="hover:text-white transition">Portal de Pacientes</a></li>
                <li><a href="#resultados" onClick={e => { e.preventDefault(); alert('Resultados en línea'); }} className="hover:text-white transition">Resultados de Laboratorio</a></li>
                <li><a href="#citas" onClick={e => { e.preventDefault(); alert('Reserva de citas'); }} className="hover:text-white transition">Reserva de Citas Web</a></li>
                <li><Link to="/landing" className="text-emerald-400 hover:text-emerald-300 transition">App CONTIGO</Link></li>
                <li><a href="#eps" onClick={e => { e.preventDefault(); alert('Coberturas EPS'); }} className="hover:text-white transition">Convenios EPS</a></li>
              </ul>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-heading font-medium text-white text-xs uppercase tracking-wider">Institucional</h4>
              <ul className="space-y-2 text-slate-400 font-light">
                <li><a href="#staff" className="hover:text-white transition">Staff Médico</a></li>
                <li><a href="#etica" onClick={e => { e.preventDefault(); alert('Comité de Ética'); }} className="hover:text-white transition">Comité de Ética Médica</a></li>
                <li><a href="#trabaja" onClick={e => { e.preventDefault(); alert('Bolsa de trabajo'); }} className="hover:text-white transition">Trabaja con Nosotros</a></li>
                <li><a href="#reclamos" onClick={e => { e.preventDefault(); alert('Libro de Reclamaciones'); }} className="text-amber-300 hover:text-amber-200 transition">📖 Libro de Reclamaciones</a></li>
                <li><a href="#privacidad" onClick={e => { e.preventDefault(); alert('Protección de datos'); }} className="hover:text-white transition">Protección de Datos</a></li>
              </ul>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-light">
            <p>© 2026 Centro Médico S.A. Todos los derechos reservados. Registrado ante SUSALUD.</p>
            <div className="flex items-center space-x-6 text-slate-400">
              <a href="#facebook" onClick={e => e.preventDefault()} className="hover:text-white transition">Facebook</a>
              <a href="#instagram" onClick={e => e.preventDefault()} className="hover:text-white transition">Instagram</a>
              <a href="#linkedin" onClick={e => e.preventDefault()} className="hover:text-white transition">LinkedIn</a>
              <a href="#youtube" onClick={e => e.preventDefault()} className="hover:text-white transition">YouTube</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
