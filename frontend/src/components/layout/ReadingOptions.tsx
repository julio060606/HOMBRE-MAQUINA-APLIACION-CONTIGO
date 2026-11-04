import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Check, CheckCircle2, Eye, Hand, HelpCircle, RotateCcw, Settings2, ShieldCheck, VolumeX, X } from 'lucide-react';
import { useReadingPreferences } from '../../hooks/useReadingPreferences';
import { DEFAULT_READING_PREFERENCES, setReadingPreferences } from '../../services/accessibilityPreferences';
import { soundEffects, speechService } from '../../services/speechService';
import { requestVibration } from '../../services/accessibleFeedback';
import { CommunicationBoard } from '../../features/accessibility/CommunicationBoard';
import styles from './ReadingOptions.module.css';
import { useAppDialogFrame } from '../../hooks/useAppDialogFrame';

type ToggleKey = 'contrast' | 'silent' | 'vibration' | 'largeTargets' | 'reducedMotion' | 'pauseUpdates';
export function ReadingOptions({ placement = 'global' }: { placement?: 'global' | 'patient' | 'caregiver' }) {
  const { pathname } = useLocation();
  const preferences = useReadingPreferences();
  const [open, setOpen] = useState(false);
  const [vibrationStatus, setVibrationStatus] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const vibrationSupported = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  const activeCount = Object.entries(preferences).filter(([key, value]) => key === 'scale' ? value !== '100' : value === true).length;
  useEffect(() => {
    document.documentElement.classList.toggle('site-high-contrast', preferences.contrast);
    document.documentElement.classList.toggle('site-reduced-motion', preferences.reducedMotion);
    document.documentElement.classList.toggle('site-large-targets', preferences.largeTargets);
    document.documentElement.classList.toggle('site-expanded-text', Number(preferences.scale) >= 150);
    document.documentElement.style.fontSize = `${Number(preferences.scale)}%`;
    if (preferences.silent) { speechService.stop(); soundEffects.stop(); }
  }, [preferences]);
  useEffect(() => {
    if (open && !dialog.current?.open) { dialog.current?.showModal(); title.current?.focus(); }
    else if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  useEffect(() => { dialog.current?.close(); }, [pathname]);
  useAppDialogFrame(dialog, open);
  function toggle(key: ToggleKey, value: boolean) {
    setReadingPreferences({ ...preferences, [key]: value });
    if (key === 'vibration') setVibrationStatus('');
  }
  const option = (key: ToggleKey, label: string, hint: string, disabled = false) => <label className={`${styles.option} ${disabled ? styles.unavailable : ''}`}>
    <span className={styles.optionText}><strong>{label}</strong><span id={`${id}-${key}-hint`}>{hint}</span></span>
    <input type="checkbox" checked={preferences[key]} disabled={disabled} aria-label={label} aria-describedby={`${id}-${key}-hint`} onChange={event => toggle(key, event.target.checked)} />
    <span className={styles.switch} aria-hidden="true"><span>{preferences[key] && <Check size={12} />}</span></span>
  </label>;
  const close = () => { setOpen(false); setVibrationStatus(''); };
  const appRoute = ['/patient-app', '/dashboard', '/medications', '/appointments', '/clinical-profile', '/vitals', '/reports', '/settings', '/demo/patient-lab', '/patient-simulator'].some(route => pathname === route || pathname.startsWith(route + '/'));
  if (placement === 'global' && appRoute) return null;
  return <div data-reading-placement={placement} className={`${styles.bar} reading-options ${placement === 'patient' ? styles.patientBar : ''} ${placement === 'caregiver' ? styles.caregiverBar : ''} ${pathname === '/clinic' ? styles.clinicBar : ''}`}>
    {placement !== 'patient' && <a className="skip-link" href="#main-content" onClick={() => document.getElementById('main-content')?.focus()}>Saltar al contenido principal</a>}
    <div className={styles.toolbar}>
      <button ref={trigger} type="button" className={styles.trigger} aria-haspopup="dialog" aria-describedby={`${id}-active`} onClick={() => { setVibrationStatus(''); setOpen(true); }}>
        <Settings2 size={19} aria-hidden="true" /><span>Opciones de lectura</span>{activeCount > 0 && <span className={styles.count} aria-hidden="true">{activeCount}</span>}
      </button>
      <span id={`${id}-active`} className="sr-only">{activeCount ? `${activeCount} ajustes activos` : 'Sin ajustes personalizados'}</span>
      <CommunicationBoard key={pathname} speechEnabled={!preferences.silent} />
      {placement !== 'patient' && <Link to="/accessibility" className={styles.helpLink}><HelpCircle size={18} aria-hidden="true" /><span>Accesibilidad y ayuda</span></Link>}
    </div>
    {preferences.pauseUpdates && <div className={styles.pausedUpdates}>
      <p role="status">Actualizaciones en pausa. El SOS sigue activo.</p>
      <button type="button" onClick={() => { setReadingPreferences({ ...preferences, pauseUpdates: false }); trigger.current?.focus(); }}>Reanudar actualizaciones</button>
    </div>}
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
      onCancel={event => { event.preventDefault(); close(); }} onClose={() => { setOpen(false); trigger.current?.focus(); }}
      onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button, input, a[href], select, summary, [tabindex]')].filter(element => element.tabIndex >= 0 && !element.hasAttribute('disabled') && element.getClientRects().length > 0);
        const first = controls[0], last = controls[controls.length - 1];
        if (first && last && event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement as HTMLElement))) { event.preventDefault(); last.focus(); }
        else if (first && last && !event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}>
      <header className={styles.header}>
        <span className={styles.headerIcon} aria-hidden="true"><Settings2 size={24} /></span>
        <div><p className={styles.eyebrow}>CONTIGO, a tu manera</p><h2 ref={title} id={`${id}-title`} tabIndex={-1}>Opciones de lectura</h2><p id={`${id}-description`}>Ajusta la pantalla y los avisos para usarlos con comodidad.</p></div>
        <button type="button" className={styles.close} aria-label="Cerrar opciones de lectura" onClick={close}><X size={20} aria-hidden="true" /></button>
      </header>
      <div className={styles.body} data-dialog-scroll-body>
        <section className={styles.section} aria-labelledby={`${id}-visual`}>
          <h3 id={`${id}-visual`}><Eye size={20} aria-hidden="true" />Lectura y contraste</h3>
          <fieldset className={styles.scaleField}>
            <legend>Tamaño del texto</legend><p id={`${id}-scale-hint`}>Elige el tamaño que te resulte más cómodo.</p>
            <div className={styles.scaleChoices}>{['100', '125', '150', '200'].map(value => <button type="button" key={value} aria-pressed={preferences.scale === value} aria-label={`Texto al ${value} %`} aria-describedby={`${id}-scale-hint`} onClick={() => setReadingPreferences({ ...preferences, scale: value })}>
              <span>{value} %</span>{preferences.scale === value && <Check size={16} aria-hidden="true" />}
            </button>)}</div>
          </fieldset>
          <div className={styles.preview}><span>Así se verá el texto</span><p>Tu información, más fácil de leer.</p></div>
          {option('contrast', 'Alto contraste en este dispositivo', 'Distingue mejor el texto y los controles.')}
        </section>
        <section className={styles.section} aria-labelledby={`${id}-audio`}>
          <h3 id={`${id}-audio`}><VolumeX size={20} aria-hidden="true" />Sonido y avisos</h3>
          {option('silent', 'Modo sin sonido', 'Detiene la voz. Los avisos siguen por escrito.')}
          {option('vibration', 'Vibración al completar acciones', vibrationSupported ? 'Añade una vibración breve a las confirmaciones.' : 'No disponible en este navegador. Usa los avisos escritos.', !vibrationSupported)}
          {vibrationSupported && <div className={styles.vibrationTest}><button type="button" className={styles.textButton} disabled={!preferences.vibration} onClick={() => {
            const result = requestVibration();
            setVibrationStatus(result === 'requested' ? 'Se solicitó una vibración breve. Comprueba si la percibes en tu dispositivo.' : 'No se pudo solicitar vibración. Puedes seguir usando los avisos en texto.');
          }}>Probar vibración</button><p role="status">{vibrationStatus}</p></div>}
        </section>
        <section className={styles.section} aria-labelledby={`${id}-interaction`}>
          <h3 id={`${id}-interaction`}><Hand size={20} aria-hidden="true" />Movimiento y precisión</h3>
          {option('largeTargets', 'Controles más grandes', 'Más espacio para pulsar con comodidad.')}
          {option('reducedMotion', 'Reducir animaciones', 'Una interfaz con menos movimiento.')}
          {option('pauseUpdates', 'Pausar actualizaciones automáticas', 'Mantiene los datos estables mientras lees. El SOS sigue activo y puedes actualizar manualmente.')}
        </section>
        <p className={styles.deviceNote}><ShieldCheck size={18} aria-hidden="true" /><span>Estos ajustes son para este dispositivo. No cambian tu tratamiento.</span></p>
        <details className={styles.quickHelp}><summary><HelpCircle size={18} aria-hidden="true" />Cómo usar CONTIGO</summary><ol><li>Revisa el nombre, la dosis y la hora del medicamento.</li><li>Elige «Ya la tomé» o «No la tomé». Puedes corregir tu respuesta.</li><li>En «Comunicarme» puedes escribir y mostrar un mensaje a una persona cercana.</li><li>Con SOS puedes avisar al dashboard y pedir hablar o escribir con una persona. La clínica es de demostración.</li></ol><p>También puedes usar el lector de pantalla de tu dispositivo y recorrer los controles con el teclado.</p></details>
      </div>
      <footer className={styles.footer}>
        <p><CheckCircle2 size={17} aria-hidden="true" />Los cambios se aplican al instante</p>
        <div className={styles.footerActions}><button type="button" className={styles.reset} onClick={() => { setReadingPreferences(DEFAULT_READING_PREFERENCES); setVibrationStatus(''); }}><RotateCcw size={17} aria-hidden="true" />Restablecer ayudas</button><button type="button" className={styles.done} onClick={close}>Listo<Check size={18} aria-hidden="true" /></button></div>
      </footer>
    </dialog>
  </div>;
}
