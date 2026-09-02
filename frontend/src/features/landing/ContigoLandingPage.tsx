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
  Volume2
} from 'lucide-react';

export const ContigoLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 flex flex-col justify-between font-sans selection:bg-emerald-100 selection:text-emerald-950">
      
      {/* 1. NAVBAR - Mismo logo limpio, sin menú central de distracción, con las 2 opciones clave */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Vectorial de CONTIGO */}
          <Link to="/landing" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-forest-700 flex items-center justify-center text-white shadow-sm transition-all group-hover:bg-forest-800">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter">
                <path d="M12 2v20M2 12h20" />
                <rect x="5" y="5" width="14" height="14" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-semibold text-lg text-slate-950 tracking-wider uppercase leading-none">
                CONTIGO
              </span>
              <span className="text-[10px] text-forest-700 font-heading font-medium tracking-widest uppercase mt-0.5">
                Teleasistencia Senior
              </span>
            </div>
          </Link>

          {/* Opciones del Navbar: Enlace a Clínica + Botón Acceso Cuidador */}
          <div className="flex items-center space-x-6">
            <Link
              to="/clinic"
              className="text-xs font-heading font-medium text-slate-600 hover:text-slate-950 hidden sm:inline-block uppercase tracking-wider transition-colors"
            >
              ← Portal Centro Médico
            </Link>

            <Link
              to="/login"
              data-testid="btn-landing-login-web"
              className="bg-forest-700 hover:bg-forest-800 text-white font-heading font-medium text-xs uppercase tracking-wider px-6 py-3 transition-all flex items-center gap-2 shadow-sm"
            >
              <Monitor className="w-3.5 h-3.5 text-emerald-300" />
              <span>Acceso Cuidador (Web)</span>
            </Link>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION - Light Typography, Dual Showcase, Mobile Mockup Placeholder */}
      <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Columna Izquierda: Slogan, Subtítulo y CTAs */}
          <div className="lg:col-span-7 space-y-6">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100 text-forest-900 border border-emerald-300 text-xs font-heading font-semibold uppercase tracking-widest">
              <Shield className="w-4 h-4 text-forest-700" /> Diseño Centrado en la Tercera Edad
            </div>

            <h1 className="text-4xl sm:text-6xl font-heading font-light text-slate-950 tracking-tight leading-[1.15]">
              Cuidar a quienes más quieres nunca fue <span className="font-normal text-forest-700">tan simple.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 font-light leading-relaxed max-w-xl">
              Una plataforma integral y sincronizada: una <strong>aplicación móvil ultra accesible</strong> para el adulto mayor con voz y fotos de pastillas, conectada a un <strong>portal web de monitoreo</strong> para que la familia y médicos supervisen su salud desde cualquier lugar.
            </p>

            {/* Acciones Principales (Entrar a Web vs Descargar App) */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                to="/login"
                data-testid="btn-hero-access-web"
                className="bg-forest-700 hover:bg-forest-800 text-white font-heading font-medium text-xs sm:text-sm uppercase tracking-wider px-8 py-4 shadow-lg transition-all flex items-center justify-center gap-3 group"
              >
                <Monitor className="w-4 h-4 text-emerald-300" />
                <span>Entrar al Portal Cuidador</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </Link>

              <a
                href="#descargar-app"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Descarga simulada: APK Contigo Paciente v1.0 para Android.');
                }}
                data-testid="btn-hero-download-app"
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-heading font-medium text-xs sm:text-sm uppercase tracking-wider px-6 py-4 transition flex items-center justify-center gap-3 shadow-sm"
              >
                <Smartphone className="w-4 h-4 text-forest-700" />
                <span>Descargar App Paciente</span>
                <Download className="w-4 h-4 text-slate-400" />
              </a>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500 font-light">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-forest-700" /> Sin contraseñas para el adulto mayor
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-forest-700" /> Lectura por voz y botones grandes
              </span>
            </div>

          </div>

          {/* Columna Derecha: Mockup Visual del Celular (Placeholder Reemplazable) */}
          <div className="lg:col-span-5 flex justify-center">
            
            {/* 
              ========================================================================================
              📌 INSTRUCCIÓN PARA REEMPLAZAR LA IMAGEN DEL CELULAR EN LA LANDING:
              Cambia la URL en el atributo 'src' de la etiqueta <img> abajo por tu imagen real
              (ej: '/assets/mockup_paciente.png' o enlace de Figma).
              ========================================================================================
            */}
            <div className="w-72 sm:w-80 bg-slate-950 p-3 shadow-2xl border-2 border-slate-800 relative group">
              <div className="relative aspect-[9/16] overflow-hidden bg-slate-900">
                <img 
                  src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=700&auto=format&fit=crop&q=80" 
                  alt="App Contigo - Captura del Celular" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                
                {/* Overlay simulado de la interfaz */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-5 text-white">
                  <div className="flex items-center justify-between pb-1 border-b border-white/20 mb-2">
                    <span className="font-heading font-bold text-xs text-emerald-400">CONTIGO</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-950 font-heading font-bold px-2 py-0.5">En línea</span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-light">Paciente: Dacio Ramos (78 años)</div>
                  <div className="text-xs font-heading font-bold text-white mt-1">Próxima pastilla: Losartán 50mg</div>
                  <div className="text-[10px] text-emerald-300 flex items-center gap-1 mt-1 font-light">
                    <Volume2 className="w-3 h-3" /> Asistencia por voz activa
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. SECCIÓN: CARACTERÍSTICAS PRINCIPALES (Tarjetas Rectangulares con Fotos Reales) */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="text-[11px] font-heading font-semibold text-forest-700 uppercase tracking-widest block mb-1">
              Innovación en Telecuidado
            </span>
            <h2 className="text-3xl font-heading font-light text-slate-950 tracking-tight">
              Funcionalidades pensadas para la tranquilidad de tu hogar
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-light mt-2">
              Tecnología accesible que elimina la ansiedad tecnológica en adultos mayores y empodera a sus cuidadores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden group">
              <div className="h-44 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80" 
                  alt="Pastillero Digital" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                <span className="absolute bottom-3 left-3 text-white font-heading font-medium text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-emerald-400" /> Pastillero con Foto
                </span>
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  El adulto mayor reconoce su medicina mediante fotografías reales en pantalla, reduciendo al 0% el error farmacológico.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden group">
              <div className="h-44 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80" 
                  alt="Presión Arterial" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                <span className="absolute bottom-3 left-3 text-white font-heading font-medium text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-400" /> Presión y Signos Vitales
                </span>
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  Registro por voz o botones grandes con cálculo automático de tendencias y alertas si los valores salen del rango médico.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden group">
              <div className="h-44 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80" 
                  alt="Alertas Inmediatas" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                <span className="absolute bottom-3 left-3 text-white font-heading font-medium text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" /> Alertas de Omisión
                </span>
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  Si tu familiar no confirma su pastilla tras 30 minutos de la alarma, el cuidador recibe un aviso directo en su navegador.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden group">
              <div className="h-44 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=600&auto=format&fit=crop&q=80" 
                  alt="Reporte PDF" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                <span className="absolute bottom-3 left-3 text-white font-heading font-medium text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-400" /> Reportes Médicos PDF
                </span>
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  Generación de informes clínicos oficiales listos para imprimir o enviar al cardiólogo con historial de tomas y promedios.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. SECCIÓN: DUALIDAD PACIENTE (MÓVIL) VS CUIDADOR (WEB) */}
      <section className="py-20 bg-slate-100 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            
            {/* Lado Paciente */}
            <div className="lg:col-span-6 bg-white border border-slate-200 p-8 sm:p-10 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-forest-700 text-[10px] font-heading font-semibold uppercase tracking-wider border border-emerald-200">
                  <Smartphone className="w-3.5 h-3.5" /> Para el Adulto Mayor
                </div>
                <h3 className="text-2xl font-heading font-light text-slate-950">
                  Aplicación Móvil Simple, Clara e Invasiva
                </h3>
                <p className="text-xs text-slate-600 font-light leading-relaxed">
                  Diseñada bajo normas WCAG 2.1 AAA. No requiere contraseñas, cuenta con lectura en voz alta de cada pantalla, botones gigantes y alarmas exactas que suenan sin conexión a internet.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 mt-6 space-y-2 text-xs text-slate-700 font-light">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-forest-700" />
                  <span>Botón de auxilio inmediato para emergencias.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-forest-700" />
                  <span>Confirmación con botón de "Ya tomé" o "Posponer".</span>
                </div>
              </div>
            </div>

            {/* Lado Cuidador */}
            <div className="lg:col-span-6 bg-slate-900 text-white border border-slate-800 p-8 sm:p-10 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900 text-blue-200 text-[10px] font-heading font-semibold uppercase tracking-wider border border-blue-700">
                  <Monitor className="w-3.5 h-3.5" /> Para el Cuidador / Familiar
                </div>
                <h3 className="text-2xl font-heading font-light text-white">
                  Portal Web de Gestión y Monitoreo 24/7
                </h3>
                <p className="text-xs text-slate-300 font-light leading-relaxed">
                  Permite administrar múltiples pacientes, programar recetas médicas complejas con teclado de computadora, ver gráficos biométricos en tiempo real y exportar reportes en PDF.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-800 mt-6 space-y-2 text-xs text-slate-300 font-light">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Configuración de umbrales clínicos de presión crítica.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Sincronización instantánea mediante WebSockets y Cloud.</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. FOOTER DE CONTIGO - Zero Curvature, Multi-Column */}
      <footer className="bg-slate-950 text-slate-400 font-sans pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-forest-700 flex items-center justify-center text-white">
                  <Heart className="w-4 h-4 fill-current text-emerald-300" />
                </div>
                <span className="text-lg font-heading font-medium text-white tracking-wider uppercase">
                  CONTIGO
                </span>
              </div>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                Ecosistema de teleasistencia médica y control de salud para el adulto mayor y sus cuidadores.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-heading font-medium text-white uppercase tracking-wider">Plataformas</h4>
              <ul className="space-y-2 text-slate-400 font-light">
                <li><Link to="/login" className="hover:text-white transition">Portal Web del Cuidador</Link></li>
                <li><a href="#descargar" onClick={e => { e.preventDefault(); alert('Descarga de App Paciente'); }} className="hover:text-white transition">App Paciente (Android)</a></li>
                <li><Link to="/clinic" className="hover:text-white transition">Centro Médico Aliado</Link></li>
              </ul>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-heading font-medium text-white uppercase tracking-wider">Módulos</h4>
              <ul className="space-y-2 text-slate-400 font-light">
                <li><Link to="/login" className="hover:text-white transition">Pastillero con Foto</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Monitoreo de Presión</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Generador de Reportes PDF</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Botón de Auxilio y Alertas</Link></li>
              </ul>
            </div>

            <div className="space-y-3 text-xs">
              <h4 className="font-heading font-medium text-white uppercase tracking-wider">Seguridad y Cumplimiento</h4>
              <p className="text-xs text-slate-400 font-light leading-relaxed">
                Desarrollado bajo estándares de accesibilidad universal WCAG 2.1 AAA y principios de Interacción Humano-Computadora (IHM).
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
