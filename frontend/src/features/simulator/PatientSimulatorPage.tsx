import React, { useState, useEffect } from 'react';
import { usePatient } from '../../context/PatientContext';
import { useToast } from '../../context/ToastContext';
import { medicationService, vitalsService, alertService, syncEvents, resetDemoData } from '../../services/apiClient';
import { speechService, soundEffects } from '../../services/speechService';
import { PillIntake } from '../../types';
import { Link } from 'react-router-dom';
import { 
  Smartphone, 
  Volume2, 
  CheckCircle, 
  AlertTriangle, 
  Heart, 
  PhoneCall, 
  Wifi, 
  BatteryMedium, 
  ArrowRight, 
  RotateCcw, 
  ShieldCheck, 
  Eye, 
  Clock, 
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

export const PatientSimulatorPage: React.FC = () => {
  const { activePatient } = usePatient();
  const toast = useToast();
  const [intakes, setIntakes] = useState<PillIntake[]>([]);
  const [lastSpoken, setLastSpoken] = useState<string | null>(null);
  const [isSuccessAnimated, setIsSuccessAnimated] = useState(false);
  const [isSosSent, setIsSosSent] = useState(false);
  const [syncCount, setSyncCount] = useState(0);

  // Estado para gestión y selección de voz en español
  const [spanishVoices, setSpanishVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const loadData = () => {
    if (!activePatient) return;
    medicationService.getTodayIntakes(activePatient.id).then(setIntakes);
  };

  useEffect(() => {
    loadData();
    const unsub = syncEvents.subscribe(() => {
      loadData();
      setSyncCount(prev => prev + 1);
    });
    return unsub;
  }, [activePatient]);

  // Cargar y sincronizar voces en español disponibles en el navegador
  useEffect(() => {
    const syncVoices = () => {
      const spVoices = speechService.getSpanishVoices();
      setSpanishVoices(spVoices);
      setSelectedVoice(speechService.getSelectedVoice());
    };
    syncVoices();
    const unsubVoice = speechService.subscribe(syncVoices);
    return unsubVoice;
  }, []);

  if (!activePatient) {
    return (
      <div className="p-8 text-center text-slate-500 font-sans">
        Cargando información del paciente...
      </div>
    );
  }

  // Próxima dosis pendiente para mostrar en la pantalla asistiva
  const pendingIntake = intakes.find(i => i.status === 'PENDING') || intakes[0];

  const speakText = (text: string, playChime = false) => {
    setLastSpoken(text);
    speechService.speak(text, { playChimeBefore: playChime });
  };

  const handleTakePill = async (intakeToConfirm?: PillIntake) => {
    const target = intakeToConfirm || pendingIntake;
    if (!target) return;
    
    setIsSuccessAnimated(true);
    // Doble retroalimentación: campanilla médica suave + locución en español pausado
    speakText(
      `Muy bien, ${activePatient.fullName.split(' ')[0]}. Tu toma de ${target.medicationName} ha sido confirmada y enviada a tu familiar.`,
      true
    );
    
    await medicationService.confirmIntake(target.id, 'MANUAL_PATIENT');
    
    toast.success(
      '📱 Sincronización Móvil en Vivo',
      `${activePatient.fullName} confirmó la toma de ${target.medicationName} (${target.dosage}). El panel del cuidador se actualizó automáticamente.`
    );

    setTimeout(() => {
      setIsSuccessAnimated(false);
    }, 2500);
  };

  const handleSos = async () => {
    setIsSosSent(true);
    // 1. Sirena auditiva de emergencia
    soundEffects.playSosAlertSound();

    // 2. Voz inmediata avisando al adulto mayor
    setTimeout(() => {
      speakText(`Alerta de auxilio activada. Avisando de inmediato a tu familiar.`);
    }, 700);
    
    await alertService.triggerSosAlert(activePatient.id, 'Alerta disparada desde el botón de pánico SOS del móvil.');
    
    toast.error(
      '🚨 ALERTA SOS RECIBIDA',
      `${activePatient.fullName} ha presionado el botón de auxilio inmediato SOS. Alerta crítica enviada al cuidador.`
    );

    setTimeout(() => {
      setIsSosSent(false);
    }, 4000);
  };

  const handleQuickBloodPressure = async (systolic: number, diastolic: number, pulse: number) => {
    await vitalsService.addBloodPressureLog({
      patientId: activePatient.id,
      systolic,
      diastolic,
      pulse,
      recordedAt: new Date().toISOString(),
      recordedVia: 'VOICE_PATIENT',
      notes: 'Medición rápida simulada desde el teléfono'
    });

    speakText(`Presión arterial de ${systolic} sobre ${diastolic} registrada con éxito.`);

    if (systolic >= 140 || diastolic >= 90) {
      toast.error(
        '⚠️ Alerta de Hipertensión Detectada',
        `Presión elevada (${systolic}/${diastolic} mmHg). Se ha generado una notificación médica urgente.`
      );
    } else {
      toast.success(
        '🩺 Presión Arterial Sincronizada',
        `${activePatient.fullName} registró ${systolic}/${diastolic} mmHg (Pulso: ${pulse} bpm).`
      );
    }
  };

  const handleReset = () => {
    resetDemoData();
    toast.info('🔄 Datos de Demostración Reiniciados', 'Valores de tomas, alertas y signos vitales restablecidos.');
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-forest-700 text-[11px] font-heading font-semibold uppercase tracking-wider mb-2">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Interacción Hombre-Máquina • Prototipo Móvil del Anciano</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 tracking-tight">
            Simulador de la App "Contigo" para el Adulto Mayor
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-light mt-1 max-w-3xl leading-relaxed">
            Experimenta la interfaz adaptativa del paciente (<strong>{activePatient.fullName}</strong>) diseñada bajo criterios de accesibilidad <strong>WCAG 2.1 AAA</strong> y heurísticas de Nielsen. Todas las acciones se reflejan en tiempo real en el Portal del Cuidador.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-heading font-semibold uppercase tracking-wider transition-colors shadow-xs"
            title="Restablecer tomas y alertas al estado inicial para otra demostración"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reiniciar Demo</span>
          </button>
          
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-forest-700 hover:bg-forest-800 text-white text-xs font-heading font-semibold uppercase tracking-wider transition-colors shadow-xs"
          >
            <span>Ver Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Grid: Celular Interactivo + Panel de Justificación IHM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Columna Izquierda: Teléfono Smartphone Físico Centrado */}
        <div className="lg:col-span-6 flex flex-col items-center">
          
          <div className="w-full max-w-[360px] bg-slate-950 rounded-[48px] p-3.5 border-4 border-slate-700 shadow-[0_25px_60px_rgba(0,0,0,0.45)] relative flex flex-col">
            
            {/* Isla Dinámica / Notch */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
            </div>

            {/* Pantalla Interna del Teléfono */}
            <div className="w-full bg-slate-50 rounded-[38px] overflow-hidden flex flex-col justify-between text-slate-900 min-h-[660px]">
              
              {/* Barra de Estado Android/iOS */}
              <div className="pt-3.5 px-6 pb-2.5 flex items-center justify-between text-[11px] font-heading font-medium text-slate-600 bg-white border-b border-slate-200/60">
                <span className="font-semibold">08:05</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-600 font-bold">4G</span>
                  <Wifi className="w-3.5 h-3.5 text-slate-600" />
                  <BatteryMedium className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-[10px]">100%</span>
                </div>
              </div>

              {/* Contenido Asistivo para el Anciano */}
              <div className="p-4 flex-1 space-y-4 overflow-y-auto">
                
                {/* Saludo con Asistente de Voz */}
                <div className="bg-emerald-50 border border-emerald-200/80 p-3.5 rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] uppercase font-heading font-bold text-forest-700 tracking-wider">
                      Modo Fácil Asistido
                    </span>
                    <h3 className="font-heading font-bold text-slate-900 text-base leading-tight">
                      Hola, {activePatient.fullName.split(' ')[0]}
                    </h3>
                  </div>
                  <button 
                    onClick={() => speakText(`Hola ${activePatient.fullName.split(' ')[0]}. Tu próxima medicina es ${pendingIntake?.medicationName || 'Losartán'} a las 8 de la mañana.`)}
                    title="Escuchar indicaciones en voz alta (Text-to-Speech)"
                    className="w-10 h-10 rounded-full bg-forest-700 text-white flex items-center justify-center shadow-md hover:bg-forest-800 transition-transform active:scale-95"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Tarjeta Principal: Medicamento de la Hora */}
                {pendingIntake ? (
                  <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                    isSuccessAnimated || pendingIntake.status === 'TAKEN'
                      ? 'bg-emerald-50 border-emerald-400 text-forest-900 shadow-xs'
                      : 'bg-white border-slate-200/90 shadow-sm'
                  }`}>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-heading font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-slate-600" /> {pendingIntake.scheduledTime}
                      </span>
                      {pendingIntake.status === 'TAKEN' && (
                        <span className="inline-flex items-center gap-1 text-xs font-heading font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          <CheckCircle className="w-4 h-4 text-emerald-600" /> Tomada
                        </span>
                      )}
                    </div>

                    {/* Foto Real del Medicamento (Heurística Nielsen H6: Reconocimiento) */}
                    <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-100 mb-3 border border-slate-200/80 relative shadow-inner">
                      <img 
                        src={pendingIntake.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300'} 
                        alt={pendingIntake.medicationName}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-heading font-medium tracking-wide">
                        Foto Real del Comprimido
                      </span>
                    </div>

                    <h4 className="font-heading font-bold text-lg text-slate-900 leading-snug">
                      {pendingIntake.medicationName}
                    </h4>
                    <p className="text-xs text-slate-700 font-semibold mt-0.5">
                      Dosis recetada: {pendingIntake.dosage}
                    </p>
                    <p className="text-xs text-slate-500 font-light mt-1">
                      {pendingIntake.instructions || 'Tomar con un vaso de agua tibia.'}
                    </p>

                    {/* Botón Táctil Gigante de 64px (WCAG 2.5.5) */}
                    <div className="mt-4">
                      {pendingIntake.status === 'TAKEN' ? (
                        <div className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs">
                          <CheckCircle className="w-4 h-4" />
                          <span>¡Dosis Registrada con Éxito!</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleTakePill(pendingIntake)}
                          disabled={isSuccessAnimated}
                          className="w-full h-16 bg-forest-700 hover:bg-forest-800 active:scale-98 text-white rounded-2xl font-heading font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-lg transition-all"
                        >
                          <CheckCircle className="w-6 h-6 text-emerald-300" />
                          <span>YA LA TOMÉ</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 p-4">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                    <p className="font-heading font-bold text-base text-slate-900">¡Al día con las pastillas!</p>
                    <p className="text-xs text-slate-500 mt-1 font-light">Todas las dosis de hoy han sido confirmadas.</p>
                  </div>
                )}

                {/* Toma Rápida de Signos Vitales */}
                <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-heading font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                      <Heart className="w-4 h-4 text-rose-500" /> Medir Presión
                    </span>
                    <span className="text-[10px] text-slate-400 font-light">Registro en 1 toque</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleQuickBloodPressure(120, 80, 72)}
                      className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-heading font-semibold text-center transition-colors shadow-xs"
                    >
                      Presión Normal<br />
                      <strong className="text-sm">120 / 80</strong>
                    </button>
                    <button
                      onClick={() => handleQuickBloodPressure(145, 92, 85)}
                      className="p-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-xl text-xs font-heading font-semibold text-center transition-colors shadow-xs"
                    >
                      Presión Alta<br />
                      <strong className="text-sm">145 / 92</strong>
                    </button>
                  </div>
                </div>

                {/* Botón de Pánico SOS Inmediato */}
                <div className="pt-1">
                  <button
                    onClick={handleSos}
                    className={`w-full py-4 rounded-2xl font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all ${
                      isSosSent 
                        ? 'bg-rose-900 text-white animate-pulse'
                        : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-98'
                    }`}
                  >
                    <PhoneCall className="w-5 h-5 animate-bounce" />
                    <span>{isSosSent ? '¡ALERTA SOS ENVIADA AL CUIDADOR!' : '🚨 BOTÓN DE AUXILIO SOS'}</span>
                  </button>
                </div>

              </div>

              {/* Botón de Inicio Virtual Inferior */}
              <div className="pb-2.5 pt-1.5 flex justify-center bg-white border-t border-slate-200/60">
                <div className="w-28 h-1 bg-slate-300 rounded-full"></div>
              </div>

            </div>

          </div>

          <div className="mt-3 text-center">
            <span className="text-[11px] text-slate-400 font-light">
              Dispositivo Vinculado: Samsung Galaxy A14 • Paciente: {activePatient.fullName}
            </span>
          </div>
        </div>

        {/* Columna Derecha: Justificación HCI/UCD y Pruebas en Vivo */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Card 1: Criterios de Evaluación Docente (IHM / HCI) */}
          <div className="bg-white border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-forest-700" />
              <h2 className="text-sm font-heading font-bold uppercase tracking-wider text-slate-900">
                Fundamentación IHM: Diseño Centrado en el Adulto Mayor
              </h2>
            </div>
            <p className="text-xs text-slate-600 font-light leading-relaxed mb-4">
              La interfaz móvil fue diseñada específicamente para mitigar las pérdidas sensoriales, motoras y cognitivas asociadas al envejecimiento (en base a ISO 9241-210 y WCAG 2.1):
            </p>

            <div className="space-y-3.5">
              
              <div className="p-3 bg-slate-50 border border-slate-200/70">
                <div className="flex items-center justify-between text-xs font-heading font-semibold text-slate-900">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-forest-700 flex items-center justify-center text-[10px] font-bold">1</span>
                    Botón Táctil de 64x64 px (WCAG 2.5.5 Target Size)
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 font-heading">Nivel AAA</span>
                </div>
                <p className="text-[11px] text-slate-500 font-light mt-1">
                  Los adultos mayores con temblor esencial o artritis sufren con botones estándar de 44px. El botón <strong>"YA LA TOMÉ"</strong> de 64px reduce los toques erróneos a cero.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/70">
                <div className="flex items-center justify-between text-xs font-heading font-semibold text-slate-900">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-bold">2</span>
                    Reconocimiento Visual (Nielsen H6)
                  </span>
                  <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 font-heading">Cognitivo</span>
                </div>
                <p className="text-[11px] text-slate-500 font-light mt-1">
                  Prioriza el reconocimiento visual mediante la <strong>fotografía real del comprimido</strong>, eliminando la confusión con nombres genéricos complejos como <em>Losartán Potásico 50mg</em>.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/70">
                <div className="flex items-center justify-between text-xs font-heading font-semibold text-slate-900">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-bold">3</span>
                    Doble Canal Sensorial (Audio TTS + Visual)
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 font-heading">Multimodal</span>
                </div>
                <p className="text-[11px] text-slate-500 font-light mt-1">
                  Integra la API nativa de <strong>SpeechSynthesis</strong> para leer en voz alta las instrucciones con acento neutro/local, compensando la presbicia o pérdida de agudeza visual.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200/70">
                <div className="flex items-center justify-between text-xs font-heading font-semibold text-slate-900">
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-bold">4</span>
                    Botón de Pánico Directo (Nielsen H10)
                  </span>
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 font-heading">Crítico</span>
                </div>
                <p className="text-[11px] text-slate-500 font-light mt-1">
                  En emergencias o caídas no se pueden requerir pasos intermedios. Un solo toque dispara una alerta con sirena visual y notificación urgente en el panel del cuidador.
                </p>
              </div>

            </div>
          </div>

          {/* Card: Selector y Prueba de Voz en Español (Web Speech API) */}
          <div className="bg-white border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-forest-700" />
                <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-900">
                  Configuración de Voz Asistiva (Español)
                </h3>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 font-heading font-semibold">
                Web Speech API
              </span>
            </div>

            <p className="text-xs text-slate-600 font-light leading-relaxed mb-4">
              Garantiza que las indicaciones se pronuncien en español con cadencia pausada (<strong>0.88x</strong>) para facilitar la audición y comprensión del adulto mayor.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-heading font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Voz Activa Seleccionada:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedVoice?.name || ''}
                    onChange={(e) => {
                      const found = (spanishVoices.length > 0 ? spanishVoices : speechService.getAllVoices()).find(v => v.name === e.target.value);
                      if (found) {
                        speechService.setVoice(found);
                        setSelectedVoice(found);
                      }
                    }}
                    className="flex-1 bg-slate-50 border border-slate-300 text-slate-900 text-xs px-3 py-2 focus:outline-none focus:border-forest-700 cursor-pointer font-sans"
                  >
                    {(spanishVoices.length > 0 ? spanishVoices : speechService.getAllVoices()).map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name} ({v.lang}) {v.lang.toLowerCase().startsWith('es') ? '🇪🇸/🇲🇽/🇵🇪' : ''}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      speechService.speak(
                        `Hola, soy la voz asistente de Contigo. Te recordaré tomar tus medicinas a tiempo.`,
                        { playChimeBefore: true }
                      );
                    }}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-forest-800 text-xs font-heading font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Probar Voz</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-3 border border-slate-200/80 text-[11px] text-slate-600 font-light leading-relaxed">
                <span className="font-heading font-semibold text-slate-800">💡 Nota Técnica: </span>
                {spanishVoices.length > 0 ? (
                  <span>
                    Se detectaron <strong>{spanishVoices.length} voces en español</strong> instaladas en tu navegador. Si deseas una voz más natural, el navegador seleccionará preferentemente voces con acento latinoamericano o Google/Microsoft en español.
                  </span>
                ) : (
                  <span>
                    Tu navegador o sistema operativo no tiene instalado el paquete de voz en español por defecto, por lo que podría sonar con acento inglés de Windows. Puedes instalar el paquete de voz en español desde <em>Configuración de Windows &gt; Hora e idioma &gt; Voz</em>.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Estado de Sincronización en Vivo */}
          <div className="bg-white border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-900">
                  Canal de Sincronización en Tiempo Real
                </h3>
              </div>
              <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                {syncCount} Eventos Emitidos
              </span>
            </div>
            
            <p className="text-xs text-slate-600 font-light leading-relaxed mb-4">
              Cada botón presionado en la app móvil del paciente actualiza inmediatamente el gráfico de adherencia, el registro de tomas y el feed de alertas del cuidador sin necesidad de recargar la página.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-heading font-semibold text-slate-900">
                  Ver reflejado en el Dashboard
                </p>
                <p className="text-[11px] text-slate-500 font-light">
                  Comprueba el porcentaje de adherencia y las alertas generadas.
                </p>
              </div>
              <Link
                to="/dashboard"
                className="px-3 py-1.5 bg-forest-700 hover:bg-forest-800 text-white font-heading font-semibold text-xs uppercase tracking-wider transition-colors"
              >
                Ir al Dashboard
              </Link>
            </div>
          </div>

          {/* Card 3: Cronograma de Tomas del Paciente */}
          <div className="bg-white border border-slate-200 p-6 shadow-xs">
            <h3 className="text-xs font-heading font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-forest-700" />
              <span>Cronograma de Hoy para {activePatient.fullName}</span>
            </h3>
            
            <div className="space-y-2">
              {intakes.map(item => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-2.5 border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 border border-slate-200">
                      {item.scheduledTime}
                    </span>
                    <div>
                      <p className="text-xs font-heading font-semibold text-slate-900">{item.medicationName}</p>
                      <p className="text-[10px] text-slate-500 font-light">{item.dosage}</p>
                    </div>
                  </div>
                  
                  {item.status === 'TAKEN' ? (
                    <span className="text-[11px] font-heading font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Tomada
                    </span>
                  ) : (
                    <button
                      onClick={() => handleTakePill(item)}
                      className="text-[11px] font-heading font-semibold text-forest-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 border border-emerald-300 transition-colors"
                    >
                      Tomar ahora
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
