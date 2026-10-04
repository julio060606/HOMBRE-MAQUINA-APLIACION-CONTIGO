import React, { useState, useEffect } from 'react';
import { usePatient } from '../../context/PatientContext';
import { useToast } from '../../context/ToastContext';
import { medicationService, vitalsService, alertService, syncEvents } from '../../services/apiClient';
import { speechService, soundEffects } from '../../services/speechService';
import { PillIntake } from '../../types';
import { 
  X, 
  Wifi, 
  BatteryMedium, 
  Volume2, 
  CheckCircle, 
  AlertTriangle, 
  Pill, 
  Heart, 
  PhoneCall, 
  RefreshCw,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MobilePatientSimulatorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { activePatient } = usePatient();
  const toast = useToast();
  const [intakes, setIntakes] = useState<PillIntake[]>([]);
  const [lastSpoken, setLastSpoken] = useState<string | null>(null);
  const [isSuccessAnimated, setIsSuccessAnimated] = useState(false);
  const [isSosSent, setIsSosSent] = useState(false);

  const loadData = () => {
    if (!activePatient) return;
    medicationService.getTodayIntakes(activePatient.id).then(setIntakes);
  };

  useEffect(() => {
    loadData();
    const unsub = syncEvents.subscribe(loadData);
    return unsub;
  }, [activePatient]);

  if (!isOpen || !activePatient) return null;

  // Próxima dosis pendiente para mostrar en la pantalla asistiva
  const pendingIntake = intakes.find(i => i.status === 'PENDING') || intakes[0];

  const speakText = (text: string, playChime = false) => {
    setLastSpoken(text);
    speechService.speak(text, { playChimeBefore: playChime });
  };

  const handleTakePill = async () => {
    if (!pendingIntake) return;
    
    setIsSuccessAnimated(true);
    speakText(
      `Muy bien, ${activePatient.fullName.split(' ')[0]}. Tu toma de ${pendingIntake.medicationName} ha sido confirmada y enviada a tu familiar.`,
      true
    );
    
    await medicationService.confirmIntake(pendingIntake.id, 'MANUAL_PATIENT');
    
    toast.success(
      '📱 Sincronización Móvil en Vivo',
      `${activePatient.fullName} confirmó la toma de ${pendingIntake.medicationName} (${pendingIntake.dosage}). Adherencia actualizada.`
    );

    setTimeout(() => {
      setIsSuccessAnimated(false);
    }, 2500);
  };

  const handleSos = async () => {
    setIsSosSent(true);
    soundEffects.playSosAlertSound();
    
    setTimeout(() => {
      speakText(`Alerta de auxilio activada. Avisando a tu familiar y al centro médico.`);
    }, 700);
    
    await alertService.triggerSosAlert(activePatient.id, 'Alerta disparada desde el botón SOS del móvil.');
    
    toast.error(
      '🚨 ALERTA SOS RECIBIDA',
      `${activePatient.fullName} ha presionado el botón de auxilio inmediato SOS. Ubicación enviada.`
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
      notes: 'Medición rápida desde el móvil'
    });

    speakText(`Presión arterial de ${systolic} sobre ${diastolic} registrada con éxito.`);

    toast.success(
      '🩺 Presión Arterial Sincronizada',
      `${activePatient.fullName} registró ${systolic}/${diastolic} mmHg (Pulso: ${pulse} bpm).`
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      
      {/* Contenedor Principal */}
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 shadow-2xl flex flex-col lg:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Columna Izquierda: Panel Explicativo para el Docente / Evaluador */}
        <div className="lg:w-1/2 p-6 sm:p-8 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-forest-700">
                Herramienta de Evaluación Experimental (APF2)
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 tracking-tight">
              Simulador del Móvil del Paciente
            </h2>

            <p className="text-xs text-slate-600 font-light mt-2 leading-relaxed">
              Este entorno simula la experiencia táctil y auditiva que tiene el adulto mayor (<strong>{activePatient.fullName}</strong>) en su teléfono. 
              Al interactuar con los botones de la derecha, verás cómo el <strong>Dashboard del Cuidador</strong> se actualiza y recalcula métricas en tiempo real.
            </p>

            <div className="mt-6 space-y-3.5">
              <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
                <p className="text-xs font-heading font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-forest-700 flex items-center justify-center text-[10px] font-bold">1</span>
                  Botón Gigante de 64x64 px (WCAG 2.5.5)
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-light">
                  Elimina los deslices motores. Al presionar <strong>"Ya la tomé"</strong>, la pastilla se marca como completada y emite confirmación auditiva por voz (TTS).
                </p>
              </div>

              <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
                <p className="text-xs font-heading font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-bold">2</span>
                  Botón de Auxilio SOS (Heurística H10)
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-light">
                  Un solo toque activa la sirena y genera un evento crítico visible en el feed de alertas del cuidador.
                </p>
              </div>

              <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
                <p className="text-xs font-heading font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[10px] font-bold">3</span>
                  Reconocimiento vs. Recuerdo (Heurística H6)
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-light">
                  El paciente reconoce la dosis por la <strong>foto real del comprimido</strong>, sin depender de textos químicos pequeños.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-light">
              Paciente: {activePatient.fullName} (ID: {activePatient.id})
            </span>
            <button
              onClick={onClose}
              className="text-xs font-heading font-medium text-slate-600 hover:text-slate-900 underline"
            >
              Cerrar simulador
            </button>
          </div>
        </div>

        {/* Columna Derecha: Marco del Smartphone Físico */}
        <div className="lg:w-1/2 p-6 sm:p-8 bg-slate-900 flex items-center justify-center">
          
          {/* Chasis del Celular */}
          <div className="w-[320px] sm:w-[340px] h-[600px] bg-slate-950 rounded-[44px] p-3 border-4 border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative flex flex-col justify-between">
            
            {/* Altavoz y Cámara Frontal (Notch) */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full z-20 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800"></div>
            </div>

            {/* Pantalla del Teléfono (Interior) */}
            <div className="w-full h-full bg-slate-50 rounded-[34px] overflow-hidden flex flex-col justify-between text-slate-900 relative font-sans">
              
              {/* Barra de Estado Superior */}
              <div className="pt-3 px-5 pb-2 flex items-center justify-between text-[11px] font-heading font-medium text-slate-600 bg-white/80 border-b border-slate-200/60">
                <span>08:05</span>
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5" />
                  <BatteryMedium className="w-3.5 h-3.5" />
                  <span>100%</span>
                </div>
              </div>

              {/* Contenido Principal de la Pantalla del Anciano */}
              <div className="p-4 flex-1 overflow-y-auto space-y-3.5">
                
                {/* Banner de Saludo Asistivo */}
                <div className="bg-emerald-50 border border-emerald-200/70 p-3 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-heading font-bold text-forest-700 tracking-wider">
                      Modo Fácil Activo
                    </span>
                    <h3 className="font-heading font-bold text-slate-900 text-sm">
                      Hola, {activePatient.fullName.split(' ')[0]}
                    </h3>
                  </div>
                  <button 
                    onClick={() => speakText(`Hola ${activePatient.fullName.split(' ')[0]}. Tu próxima pastilla es ${pendingIntake?.medicationName || 'Losartán'} a las 8 de la mañana.`)}
                    title="Escuchar en voz alta"
                    className="w-8 h-8 rounded-full bg-white border border-emerald-200 text-forest-700 flex items-center justify-center shadow-xs hover:bg-emerald-100 transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Tarjeta de la Toma del Momento */}
                {pendingIntake ? (
                  <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                    isSuccessAnimated || pendingIntake.status === 'TAKEN'
                      ? 'bg-emerald-50 border-emerald-400 text-forest-900'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-heading font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        ⏰ {pendingIntake.scheduledTime}
                      </span>
                      {pendingIntake.status === 'TAKEN' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-heading font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" /> Tomada
                        </span>
                      )}
                    </div>

                    {/* Foto Real del Medicamento (Nielsen H6) */}
                    <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-100 mb-2.5 border border-slate-200/80 relative">
                      <img 
                        src={pendingIntake.imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300'} 
                        alt={pendingIntake.medicationName}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-heading">
                        Foto Real
                      </span>
                    </div>

                    <h4 className="font-heading font-bold text-base text-slate-900 leading-tight">
                      {pendingIntake.medicationName}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">
                      Dosis: {pendingIntake.dosage}
                    </p>
                    <p className="text-[11px] text-slate-500 font-light mt-1">
                      {pendingIntake.instructions || 'Tomar después del desayuno.'}
                    </p>

                    {/* Botón Gigante de Confirmación (64px) */}
                    <div className="mt-3.5">
                      {pendingIntake.status === 'TAKEN' ? (
                        <div className="w-full py-3 bg-emerald-600 text-white rounded-xl font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-xs">
                          <CheckCircle className="w-4 h-4" />
                          <span>¡Dosis de hoy registrada!</span>
                        </div>
                      ) : (
                        <button
                          onClick={handleTakePill}
                          disabled={isSuccessAnimated}
                          className="w-full h-16 bg-forest-700 hover:bg-forest-800 active:scale-98 text-white rounded-2xl font-heading font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-md transition-all"
                        >
                          <CheckCircle className="w-5 h-5" />
                          <span>YA LA TOMÉ</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 p-4">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                    <p className="font-heading font-bold text-sm text-slate-900">¡Al día con tus pastillas!</p>
                    <p className="text-xs text-slate-500 mt-1 font-light">No tienes más dosis pendientes por hoy.</p>
                  </div>
                )}

                {/* Sección de Signos Vitales Rápidos */}
                <div className="bg-white border border-slate-200 p-3 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-heading font-semibold text-slate-800 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500" /> Presión Arterial
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleQuickBloodPressure(120, 80, 72)}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-[10px] font-heading font-semibold text-center transition-colors"
                    >
                      Registrar Normal<br /><strong>120 / 80 mmHg</strong>
                    </button>
                    <button
                      onClick={() => handleQuickBloodPressure(145, 92, 85)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-xl text-[10px] font-heading font-semibold text-center transition-colors"
                    >
                      Registrar Alta<br /><strong>145 / 92 mmHg</strong>
                    </button>
                  </div>
                </div>

                {/* Botón de Emergencia SOS */}
                <div className="pt-1">
                  <button
                    onClick={handleSos}
                    className={`w-full py-3.5 rounded-2xl font-heading font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
                      isSosSent 
                        ? 'bg-rose-900 text-white animate-pulse'
                        : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-98'
                    }`}
                  >
                    <PhoneCall className="w-4 h-4 animate-bounce" />
                    <span>{isSosSent ? '¡ALERTA SOS ENVIADA!' : '🚨 BOTÓN DE AUXILIO SOS'}</span>
                  </button>
                </div>

              </div>

              {/* Botón de Inicio Virtual Inferior */}
              <div className="pb-2 pt-1 flex justify-center bg-white/80 border-t border-slate-200/60">
                <div className="w-28 h-1 bg-slate-300 rounded-full"></div>
              </div>

            </div>

          </div>

        </div>

        {/* Botón flotante para cerrar la ventana */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-md transition-all"
        >
          <X className="w-4 h-4" />
        </button>

      </div>

    </div>
  );
};
