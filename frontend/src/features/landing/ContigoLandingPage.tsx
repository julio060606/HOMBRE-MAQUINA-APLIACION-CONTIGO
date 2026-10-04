import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  Smartphone,
  Monitor,
  Pill,
  Activity,
  AlertTriangle,
  FileText,
  ArrowRight,
  Download,
  CheckCircle2,
  Shield,
  Volume2,
  Clock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const ContigoLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#FAFBFD] to-emerald-50/20 text-slate-900 flex flex-col justify-between font-sans selection:bg-emerald-100 selection:text-emerald-950 antialiased">

      {/* 1. NAVBAR - Limpio, translúcido con efecto blur */}
      <header className="bg-white/85 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* Logo Vectorial de CONTIGO con esquinas redondeadas */}
          <Link to="/landing" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-forest-700 rounded-2xl flex items-center justify-center text-white shadow-xs transition-all group-hover:bg-forest-800">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M2 12h20" />
                <rect x="5" y="5" width="14" height="14" rx="3" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-semibold text-lg text-slate-950 tracking-wider uppercase leading-none">
                CONTIGO
              </span>
              <span className="text-[10px] text-forest-700 font-heading font-medium tracking-widest uppercase mt-1">
                Teleasistencia Senior
              </span>
            </div>
          </Link>

          {/* Opciones del Navbar: Enlace a Clínica + Botón Acceso Cuidador */}
          <div className="flex items-center space-x-5">
            <Link
              to="/clinic"
              className="text-xs font-heading font-medium text-slate-600 hover:text-slate-950 hidden sm:inline-flex items-center gap-1 uppercase tracking-wider transition-colors px-3 py-2 rounded-xl hover:bg-slate-50"
            >
              <span>← Portal Centro Médico</span>
            </Link>

            <Link
              to="/login"
              data-testid="btn-landing-login-web"
              className="bg-forest-700 hover:bg-forest-800 text-white font-heading font-semibold text-xs uppercase tracking-wider px-6 py-3 rounded-2xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow"
            >
              <Monitor className="w-3.5 h-3.5 text-emerald-300" />
              <span>Acceso Cuidador (Web)</span>
            </Link>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION - Arquitectura de Alto Impacto (Full-Width, 2-Column Responsive Grid) */}
      <section id="hero" className="relative w-full bg-gradient-to-b from-white via-slate-50/40 to-white border-b border-slate-100 overflow-hidden">
        
        {/* Luces Difusas Ambientales de Fondo (Sutiles y Elegantes) */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute -top-20 left-1/4 w-[500px] h-[500px] bg-sky-100/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 xl:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 xl:gap-12 items-center">
            
            {/* Columna Izquierda: Mensaje Central, Beneficios y CTAs (Full width en móvil/tablet, 7 Columnas en Desktop) */}
            <div className="col-span-1 lg:col-span-7 space-y-6 sm:space-y-7 text-left max-w-2xl mx-auto lg:max-w-none">
              
              {/* Badge de Vanguardia */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-white/95 backdrop-blur-md rounded-full border border-emerald-200/90 shadow-2xs w-fit">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span className="text-xs font-heading font-semibold text-forest-800 tracking-wide uppercase">
                  Teleasistencia Geriátrica Inteligente
                </span>
                <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="hidden sm:inline-block text-[11px] font-heading font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  WCAG 2.1 AAA
                </span>
              </div>

              {/* Título de Alto Impacto (Jerarquía y Escala Editorial) */}
              <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-[54px] font-heading font-bold text-slate-950 tracking-tight leading-[1.1]">
                Cuidar a quienes más quieres nunca fue{' '}
                <span className="bg-gradient-to-r from-forest-700 via-emerald-600 to-teal-700 bg-clip-text text-transparent">
                  tan simple.
                </span>
              </h1>

              {/* Subtítulo Claro, Breve y Empático (Regla de los 3 Segundos) */}
              <p className="text-base sm:text-lg text-slate-600 font-light leading-relaxed max-w-xl">
                La primera plataforma integral que conecta la simplicidad del paciente mayor —con fotos reales de sus recetas y voz asistiva en español— con el monitoreo médico y familiar 24/7.
              </p>

              {/* Chips de Beneficios Clave (GOMS / IHM - 0 Fricción) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 max-w-lg">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-forest-700 flex items-center justify-center flex-shrink-0">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-heading font-bold text-slate-900">0% Confusión</div>
                    <div className="text-[10px] text-slate-500 font-light">Foto real del fármaco</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-heading font-bold text-slate-900">Signos Vitales</div>
                    <div className="text-[10px] text-slate-500 font-light">Alertas de presión</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-heading font-bold text-slate-900">Voz en Español</div>
                    <div className="text-[10px] text-slate-500 font-light">Asistencia auditiva</div>
                  </div>
                </div>
              </div>

              {/* Acciones Principales con Jerarquía Clara */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <Link
                  to="/login"
                  data-testid="btn-hero-access-web"
                  className="bg-forest-700 hover:bg-forest-800 text-white font-heading font-semibold text-xs sm:text-sm uppercase tracking-wider px-7 py-3.5 rounded-xl shadow-md shadow-forest-900/10 hover:shadow-lg hover:shadow-forest-900/20 transition-all duration-200 flex items-center justify-center gap-2.5 group"
                >
                  <Monitor className="w-4 h-4 text-emerald-300" />
                  <span>Entrar al Portal Cuidador</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href="#features"
                  data-testid="btn-hero-download-app"
                  className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-heading font-medium text-xs sm:text-sm uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow-2xs hover:border-slate-300"
                >
                  <Smartphone className="w-4 h-4 text-forest-700" />
                  <span>Ver Funcionalidades</span>
                </a>
              </div>

              {/* Prueba Social Médica y Familiar */}
              <div className="pt-2 flex items-center gap-3 text-xs text-slate-500 border-t border-slate-200/60 max-w-lg">
                <div className="flex -space-x-1.5 overflow-hidden">
                  <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Usuario" />
                  <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Usuario" />
                  <img className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80" alt="Usuario" />
                  <div className="inline-flex h-7 w-7 rounded-full ring-2 ring-white bg-emerald-100 text-forest-800 items-center justify-center font-heading font-bold text-[10px]">
                    +1.2k
                  </div>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center text-amber-500 font-bold text-xs">
                    ★★★★★ <span className="text-slate-800 font-heading font-bold ml-1.5">4.9 / 5.0</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-light">
                    Respaldado por familias y geriatras en todo el Perú
                  </div>
                </div>
              </div>

            </div>

            {/* Columna Derecha: Mockup Oficial del Celular 3D en Ultra-HD (Oculto en móvil/tablet < lg para priorizar la experiencia de usuario) */}
            <div className="hidden lg:flex lg:col-span-5 justify-center items-center relative select-none">
              
              {/* Aura y Gradiente de Enfoque */}
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/50 via-teal-50/40 to-sky-100/40 rounded-full blur-3xl scale-95 pointer-events-none -z-10" />

              {/* Render del Celular en Ultra-HD Retina con Elevación Natural */}
              <div className="relative w-full flex justify-center items-center transition-transform duration-500 hover:scale-[1.02]">
                <img 
                  src="/images/hero_phone_isolated.png" 
                  alt="Aplicación Móvil Paciente CONTIGO - Hola Don Dacio" 
                  loading="eager"
                  className="w-full max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-[460px] h-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.08)]"
                />
              </div>

            </div>

          </div>
        </div>

      </section>

      {/* 3. SECCIÓN: CARACTERÍSTICAS PRINCIPALES - Bento Cards con Micro-Interfaces Vivas */}
      <section className="py-20 sm:py-28 bg-white border-t border-slate-100 relative">

        {/* Luz difusa ambiental sutil */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-96 bg-emerald-50/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Cabecera de la Sección */}
          <div className="max-w-2xl mx-auto text-center mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-forest-800 text-xs font-heading font-semibold uppercase tracking-wider mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-forest-700" />
              <span>Innovación en Teleasistencia Geriátrica</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-heading font-bold text-slate-950 tracking-tight leading-tight">
              Funcionalidades pensadas para la{' '}
              <span className="bg-gradient-to-r from-forest-700 via-emerald-600 to-teal-700 bg-clip-text text-transparent">
                tranquilidad de tu hogar
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-light mt-3 leading-relaxed">
              Tecnología asistiva de alta precisión que elimina la ansiedad en el adulto mayor y le otorga serenidad absoluta a sus familiares.
            </p>
          </div>

          {/* Grid de 4 Pilares Ampliados (2x2 espacioso sin compresión) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 max-w-6xl mx-auto">

            {/* Tarjeta 1: Pastillero con Foto */}
            <div className="bg-gradient-to-b from-white to-slate-50/50 rounded-3xl p-7 sm:p-9 border border-slate-200/70 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_35px_rgba(15,76,58,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
              <div>

                {/* Imagen con Micro-UI de Toma y Badge Flotante */}
                <div className="h-60 sm:h-72 rounded-2xl overflow-hidden relative mb-6 bg-slate-100 shadow-inner">
                  <img
                    src="/images/pill_organizer.jpg"
                    alt="Pastillero Digital Organizado"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>

                  {/* Badge en píldora flotante */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-forest-800 text-[11px] font-heading font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs border border-white/60">
                    <Pill className="w-4 h-4 text-forest-700" />
                    <span>Pastillero Visual</span>
                  </div>

                  {/* Micro-Chip de Horario Ampliado */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl flex items-center justify-between text-xs shadow-sm">
                    <div className="flex items-center gap-2 font-heading font-bold text-slate-900">
                      <Clock className="w-4 h-4 text-forest-700" />
                      <span>Dosis: 08:00 AM</span>
                    </div>
                    <span className="text-xs bg-emerald-100 text-forest-800 font-semibold px-3 py-1 rounded-full">
                      Losartán 50mg
                    </span>
                  </div>
                </div>

                <h3 className="font-heading font-bold text-xl sm:text-2xl text-slate-900 mb-3 tracking-tight">
                  Pastillero con Foto Real
                </h3>

                <p className="text-sm sm:text-base text-slate-600 font-light leading-relaxed mb-6">
                  El adulto mayor reconoce su medicina mediante fotografías claras en pantalla. No requiere recordar nombres químicos complejos, reduciendo al 0% el error de dosificación.
                </p>

                {/* Barra de Adherencia Visual Ampliada */}
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs space-y-2">
                  <div className="flex justify-between text-xs font-heading font-semibold text-slate-700">
                    <span>Adherencia Semanal del Tratamiento</span>
                    <span className="text-forest-700 font-bold">94.5% Excelente</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-forest-600 rounded-full" style={{ width: '94.5%' }}></div>
                  </div>
                </div>

              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm text-forest-700 font-semibold">
                <span>Principio de Reconocimiento vs Recuerdo (IHM)</span>
                <span className="text-slate-400">→</span>
              </div>
            </div>

            {/* Tarjeta 2: Presión y Signos Vitales */}
            <div className="bg-gradient-to-b from-white to-slate-50/50 rounded-3xl p-7 sm:p-9 border border-slate-200/70 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_35px_rgba(37,99,235,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
              <div>

                {/* Imagen con Micro-UI de Curva ECG */}
                <div className="h-60 sm:h-72 rounded-2xl overflow-hidden relative mb-6 bg-slate-100 shadow-inner">
                  <img
                    src="/images/blood_pressure.jpg"
                    alt="Presión Arterial en el Hogar"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>

                  {/* Badge en píldora flotante */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-blue-800 text-[11px] font-heading font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs border border-white/60">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>Presión & Pulso</span>
                  </div>

                  {/* Micro-Chip de Lectura Biométrica Ampliado */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl flex items-center justify-between text-xs shadow-sm">
                    <div className="flex items-center gap-2 font-heading font-bold text-slate-900">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      <span>Lectura: 120 / 80 mmHg</span>
                    </div>
                    <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-3 py-1 rounded-full">
                      72 bpm · Normal
                    </span>
                  </div>
                </div>

                <h3 className="font-heading font-bold text-xl sm:text-2xl text-slate-900 mb-3 tracking-tight">
                  Presión y Signos Vitales
                </h3>

                <p className="text-sm sm:text-base text-slate-600 font-light leading-relaxed mb-6">
                  Registro por voz o teclado numérico simplificado. El sistema calcula tendencias automáticas en gráficos clínicos y detecta anomalías antes de que se conviertan en emergencias.
                </p>

                {/* Micro-Gráfico de Serie Temporal Ampliado */}
                <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs space-y-2">
                  <div className="flex justify-between text-xs font-heading font-semibold text-slate-700">
                    <span>Curva Sistólica / Diastólica</span>
                    <span className="text-blue-600 font-bold">Rango Estable</span>
                  </div>
                  <svg className="w-full h-5 text-blue-500" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <path d="M0 12 Q 25 5, 50 10 T 100 8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>

              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm text-blue-700 font-semibold">
                <span>Series de tiempo clínicas para el médico</span>
                <span className="text-slate-400">→</span>
              </div>
            </div>

            {/* Tarjeta 3: Alertas de Omisión */}
            <div className="bg-gradient-to-b from-white to-slate-50/50 rounded-3xl p-7 sm:p-9 border border-slate-200/70 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_35px_rgba(217,119,6,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
              <div>

                {/* Imagen con Micro-UI de Alerta Preventiva */}
                <div className="h-60 sm:h-72 rounded-2xl overflow-hidden relative mb-6 bg-slate-100 shadow-inner">
                  <img
                    src="/images/caregiver_senior.jpg"
                    alt="Acompañamiento y Alertas Cuidador"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>

                  {/* Badge en píldora flotante */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-amber-800 text-[11px] font-heading font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs border border-white/60">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Prevención Activa</span>
                  </div>

                  {/* Micro-Chip de Alerta Cuidador Ampliado */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl flex items-center justify-between text-xs shadow-sm">
                    <div className="flex items-center gap-2 font-heading font-bold text-slate-900">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>Aviso Silencioso al Cuidador</span>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-3 py-1 rounded-full">
                      Tolerancia: 30 min
                    </span>
                  </div>
                </div>

                <h3 className="font-heading font-bold text-xl sm:text-2xl text-slate-900 mb-3 tracking-tight">
                  Alertas por Omisión
                </h3>

                <p className="text-sm sm:text-base text-slate-600 font-light leading-relaxed mb-6">
                  Si el paciente no confirma su toma tras el tiempo pautado, el portal web del cuidador emite una alerta prioritaria, permitiendo una llamada preventiva a tiempo.
                </p>

                {/* Micro-Notificación de Ejemplo Ampliada */}
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/70 text-xs text-amber-950 space-y-1">
                  <div className="font-heading font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Dosis pendiente: Losartán 50mg (08:30 AM)</span>
                  </div>
                  <div className="text-amber-900/80 font-light">
                    Notificación preventiva emitida al panel web del familiar sin alarmar al paciente.
                  </div>
                </div>

              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm text-amber-700 font-semibold">
                <span>Ventana de tolerancia personalizable</span>
                <span className="text-slate-400">→</span>
              </div>
            </div>

            {/* Tarjeta 4: Reportes Médicos PDF */}
            <div className="bg-gradient-to-b from-white to-slate-50/50 rounded-3xl p-7 sm:p-9 border border-slate-200/70 shadow-[0_4px_25px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_35px_rgba(147,51,234,0.08)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group">
              <div>

                {/* Imagen con Micro-UI de Documento Clínico */}
                <div className="h-60 sm:h-72 rounded-2xl overflow-hidden relative mb-6 bg-slate-100 shadow-inner">
                  <img
                    src="/images/doctor_report.jpg"
                    alt="Reporte Médico y Consulta Clínica"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>

                  {/* Badge en píldora flotante */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-purple-800 text-[11px] font-heading font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs border border-white/60">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Ficha Oficial</span>
                  </div>

                  {/* Micro-Chip de Descarga Ampliado */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl flex items-center justify-between text-xs shadow-sm">
                    <div className="flex items-center gap-2 font-heading font-bold text-slate-900">
                      <Download className="w-4 h-4 text-purple-700" />
                      <span>Informe Mensual Completo</span>
                    </div>
                    <span className="text-xs bg-purple-100 text-purple-900 font-semibold px-3 py-1 rounded-full">
                      Listo para imprimir
                    </span>
                  </div>
                </div>

                <h3 className="font-heading font-bold text-xl sm:text-2xl text-slate-900 mb-3 tracking-tight">
                  Reportes Médicos en PDF
                </h3>

                <p className="text-sm sm:text-base text-slate-600 font-light leading-relaxed mb-6">
                  Exporta con un solo clic el informe consolidado para la consulta con el geriatra. Con casillas de firma médica, curvas biométricas y listado de fármacos activos.
                </p>

                {/* Sello de Homologación Micro Ampliado */}
                <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200/70 text-xs text-purple-950 space-y-1">
                  <div className="font-heading font-bold flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span>Formato Clínico Estándar Homologado</span>
                  </div>
                  <div className="text-purple-900/80 font-light">
                    Válido para adjuntar a la historia clínica en MINSA, EsSalud y centros privados.
                  </div>
                </div>

              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm text-purple-700 font-semibold">
                <span>Descarga directa en 1 clic</span>
                <span className="text-slate-400">→</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. SECCIÓN: DUALIDAD PACIENTE (MÓVIL) VS CUIDADOR (WEB) - Arquitectura de Interacción */}
      <section className="py-20 sm:py-28 bg-[#FAFBFD] border-t border-slate-100 relative overflow-hidden">

        {/* Luces difusas de fondo */}
        <div className="absolute top-1/4 -left-32 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Cabecera de la Sección */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-heading font-semibold uppercase tracking-wider mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-forest-700" />
              <span>Arquitectura Dual de Interacción</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-heading font-bold text-slate-950 tracking-tight leading-tight">
              Dos interfaces especializadas,{' '}
              <span className="bg-gradient-to-r from-forest-700 via-emerald-600 to-blue-700 bg-clip-text text-transparent">
                un solo objetivo
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-light mt-3 leading-relaxed">
              Separamos la <strong>extrema simplicidad sin barreras</strong> requerida por el adulto mayor de la <strong>alta productividad y control clínico</strong> que necesita el cuidador.
            </p>
          </div>

          {/* Grid de Comparativa con Previsualizaciones de UI */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

            {/* LADO PACIENTE: APLICACIÓN MÓVIL SENIOR */}
            <div className="lg:col-span-6 bg-gradient-to-b from-white to-emerald-50/40 border border-emerald-200/70 rounded-3xl p-7 sm:p-9 flex flex-col justify-between shadow-[0_4px_25px_rgba(15,76,58,0.04)] hover:shadow-[0_16px_35px_rgba(15,76,58,0.08)] transition-all duration-300 relative group">

              <div className="space-y-5">

                {/* Header de la Tarjeta Paciente */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100/80 text-forest-800 text-[11px] font-heading font-bold uppercase tracking-wider rounded-full border border-emerald-200">
                    <Smartphone className="w-3.5 h-3.5 text-forest-700" />
                    <span>Para el Adulto Mayor</span>
                  </div>
                  <span className="text-[10px] font-heading font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
                    WCAG 2.1 AAA
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">
                    App Móvil Simple, Clara e Inclusiva
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-light leading-relaxed mt-2">
                    Diseñada para personas con dificultades visuales, motrices o cognitivas. No requiere aprender contraseñas, no tiene menús laberínticos y funciona incluso sin internet.
                  </p>
                </div>

                {/* Micro-UI de Demostración: Botonera Gigante Accesible */}
                <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs space-y-3">
                  <div className="flex items-center justify-between text-[11px] border-b border-slate-100 pb-2">
                    <span className="font-heading font-bold text-slate-800">Simulación en Celular</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 font-semibold px-2 py-0.5 rounded-full">
                      Botones ≥64px
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Volume2 className="w-5 h-5 text-forest-700 animate-pulse" />
                        <div>
                          <div className="text-xs font-heading font-bold text-forest-950">Lectura por Voz Automática</div>
                          <div className="text-[10px] text-forest-800 font-light">Lee cada pastilla en español en voz alta</div>
                        </div>
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    </div>

                    <div className="bg-forest-700 text-white p-3.5 rounded-xl flex items-center justify-center gap-2 text-xs font-heading font-bold uppercase tracking-wider shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Botón Táctil: YA TOMÉ MI PASTILLA</span>
                    </div>
                  </div>
                </div>

                {/* Lista de Beneficios Específicos */}
                <div className="space-y-2.5 text-xs text-slate-700 pt-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-forest-700 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span><strong>Cero contraseñas:</strong> Vinculación por código numérico de 1 solo uso.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-forest-700 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span><strong>Alarmas infalibles:</strong> Suenan al volumen máximo incluso en modo silencio.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-forest-700 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span><strong>Botón SOS de auxilio:</strong> Envía alerta sonora inmediata al cuidador.</span>
                  </div>
                </div>

              </div>

              <div className="pt-6 border-t border-emerald-100 mt-6 flex items-center justify-between text-xs text-forest-800 font-heading font-semibold">
                <span>Experiencia sin frustración digital</span>
                <span className="text-forest-600">Fácil y asistido ✓</span>
              </div>

            </div>

            {/* LADO CUIDADOR: PORTAL WEB 24/7 */}
            <div className="lg:col-span-6 bg-slate-900 text-white border border-slate-800 rounded-3xl p-7 sm:p-9 flex flex-col justify-between shadow-[0_12px_40px_rgba(0,0,0,0.18)] hover:shadow-[0_16px_45px_rgba(30,58,138,0.25)] transition-all duration-300 relative group overflow-hidden">

              {/* Aura azul de fondo interna */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-5 relative z-10">

                {/* Header de la Tarjeta Cuidador */}
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-500/20 text-blue-300 text-[11px] font-heading font-bold uppercase tracking-wider rounded-full border border-blue-500/30">
                    <Monitor className="w-3.5 h-3.5 text-blue-300" />
                    <span>Para el Cuidador y Médicos</span>
                  </div>
                  <span className="text-[10px] font-heading font-bold text-blue-300 bg-blue-950 px-2.5 py-1 rounded-full border border-blue-800 shadow-2xs">
                    Modelo GOMS (74.6% + Rápido)
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-heading font-bold text-white tracking-tight">
                    Portal Web de Teleasistencia 24/7
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed mt-2">
                    Diseñado para la alta productividad de familiares y profesionales de salud. Permite programar tratamientos complejos con teclado de PC y supervisar en tiempo real.
                  </p>
                </div>

                {/* Micro-UI de Demostración: Widget del Cuidador */}
                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 shadow-inner space-y-3">
                  <div className="flex items-center justify-between text-[11px] border-b border-slate-800 pb-2">
                    <span className="font-heading font-bold text-slate-200">Panel de Control en Vivo</span>
                    <span className="text-[10px] text-blue-400 bg-blue-900/40 font-semibold px-2 py-0.5 rounded-full border border-blue-800/60">
                      Sincronizado vía Cloud
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-heading">Adherencia</div>
                      <div className="text-sm font-heading font-bold text-emerald-400 mt-0.5">94.5%</div>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-heading">Presión</div>
                      <div className="text-sm font-heading font-bold text-white mt-0.5">120/80</div>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-heading">Próx. Toma</div>
                      <div className="text-sm font-heading font-bold text-blue-300 mt-0.5">20:00 PM</div>
                    </div>
                  </div>
                </div>

                {/* Lista de Beneficios Específicos */}
                <div className="space-y-2.5 text-xs text-slate-300 pt-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-900/80 text-blue-400 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span><strong>Programación rápida:</strong> Carga de recetas con teclado físico y fotos.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-900/80 text-blue-400 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span><strong>Umbrales clínicos:</strong> Configura límites de presión sistólica y diastólica.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-900/80 text-blue-400 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span><strong>Reportes en 1 clic:</strong> Descarga PDF clínico para consultas médicas.</span>
                  </div>
                </div>

              </div>

              <div className="pt-6 border-t border-slate-800 mt-6 flex items-center justify-between text-xs text-slate-400 font-heading font-semibold relative z-10">
                <span>Gestión médica centralizada</span>
                <span className="text-blue-400">Control total 24/7 ✓</span>
              </div>

            </div>

          </div>

          {/* Banner de Sincronización en Tiempo Real (El Puente entre Ambos) */}
          <div className="mt-10 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-forest-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-base text-slate-900">
                  Sincronización Instantánea y Cifrada en la Nube
                </h4>
                <p className="text-xs text-slate-500 font-light mt-0.5">
                  Cualquier ajuste en la receta o alarma realizado desde la web se refleja en el celular del paciente en milisegundos mediante un PIN seguro de 6 dígitos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200/80 flex-shrink-0">
              <span className="text-[11px] font-heading font-semibold text-slate-600 uppercase tracking-wider">PIN Seguro:</span>
              <div className="flex gap-1.5 font-mono text-xs font-bold text-slate-900">
                <span className="w-6 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center">4</span>
                <span className="w-6 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center">8</span>
                <span className="w-6 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center">2</span>
                <span className="w-6 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center">9</span>
                <span className="w-6 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center">1</span>
                <span className="w-6 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center">0</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. FOOTER DE CONTIGO - Sobrio, Redondeado y Multi-Columna */}
      <footer className="bg-slate-950 text-slate-400 font-sans pt-16 pb-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800/80">

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-forest-700 rounded-xl flex items-center justify-center text-white shadow-xs">
                  <Heart className="w-4 h-4 fill-current text-emerald-300" />
                </div>
                <span className="text-lg font-heading font-semibold text-white tracking-wider uppercase">
                  CONTIGO
                </span>
              </div>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                Ecosistema de teleasistencia médica y control de salud para el adulto mayor y sus cuidadores.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-heading font-semibold text-white uppercase tracking-wider">Plataformas</h4>
              <ul className="space-y-2 text-slate-400 font-light">
                <li><Link to="/login" className="hover:text-emerald-300 transition">Portal Web del Cuidador</Link></li>
                <li><a href="#descargar" onClick={e => { e.preventDefault(); alert('Descarga de App Paciente'); }} className="hover:text-emerald-300 transition">App Paciente (Android)</a></li>
                <li><Link to="/clinic" className="hover:text-emerald-300 transition">Centro Médico Aliado</Link></li>
              </ul>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-heading font-semibold text-white uppercase tracking-wider">Módulos Clínicos</h4>
              <ul className="space-y-2 text-slate-400 font-light">
                <li><Link to="/login" className="hover:text-emerald-300 transition">Pastillero con Foto</Link></li>
                <li><Link to="/login" className="hover:text-emerald-300 transition">Monitoreo de Presión</Link></li>
                <li><Link to="/login" className="hover:text-emerald-300 transition">Generador de Reportes PDF</Link></li>
                <li><Link to="/login" className="hover:text-emerald-300 transition">Botón de Auxilio y Alertas</Link></li>
              </ul>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-heading font-semibold text-white uppercase tracking-wider">Seguridad y Cumplimiento</h4>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                Desarrollado bajo estándares de accesibilidad universal WCAG 2.1 AAA, Ley N° 29973 y Ley N° 29733 de Protección de Datos Personales en el Perú.
              </p>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-light">
            <p>© 2026 CONTIGO · Teleasistencia Médica. Todos los derechos reservados.</p>
            <div className="flex items-center space-x-6 text-slate-400">
              <Link to="/clinic" className="hover:text-white transition">Portal Clínica</Link>
              <Link to="/login" className="hover:text-white transition">Acceso Cuidador</Link>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
