import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, HandHelping, LockKeyhole, MessageCircleOff, MessageSquareText, Pencil, Reply, RotateCcw, Square, Trash2, Volume2, X } from 'lucide-react';
import { speechService } from '../../services/speechService';
import styles from './CommunicationBoard.module.css';
import { useAppDialogFrame } from '../../hooks/useAppDialogFrame';

const phrases = [
  { text: 'Necesito ayuda', icon: HandHelping },
  { text: 'Prefiero comunicarme por escrito', icon: Pencil },
  { text: 'No puedo hablar en este momento', icon: MessageCircleOff },
  { text: 'Por favor, escriba su respuesta', icon: Reply },
  { text: 'Necesito que repita la información', icon: RotateCcw },
];
const limit = 240;

/** Local, temporary communication with a person beside the device. */
export function CommunicationBoard({ speechEnabled = true }: { speechEnabled?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const messageHeading = useRef<HTMLHeadingElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const responseInput = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const id = useId();
  const supportsSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (open && !dialog.current?.open) {
      dialog.current?.showModal();
      title.current?.focus();
    } else if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  useEffect(() => {
    if (showMessage) messageHeading.current?.focus();
  }, [showMessage]);
  useEffect(() => {
    if (showResponse) responseInput.current?.focus();
  }, [showResponse]);
  useEffect(() => {
    if (!speechEnabled) speechService.stop();
  }, [speechEnabled]);
  useEffect(() => () => speechService.stop(), []);
  useAppDialogFrame(dialog, open);

  const clear = () => {
    speechService.stop();
    setMessage('');
    setResponse('');
    setShowMessage(false);
    setShowResponse(false);
  };
  const close = () => {
    clear();
    setOpen(false);
  };
  const edit = () => {
    speechService.stop();
    setShowMessage(false);
    requestAnimationFrame(() => input.current?.focus());
  };
  const askForResponse = () => {
    if (showResponse) responseInput.current?.focus();
    else setShowResponse(true);
  };

  return <>
    <button ref={trigger} type="button" className={styles.trigger} aria-haspopup="dialog" onClick={() => setOpen(true)}>
      <MessageSquareText size={20} aria-hidden="true" />Comunicarme
    </button>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
      onCancel={event => { event.preventDefault(); close(); }}
      onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button, textarea, input, select, summary, a[href], [tabindex]'))
          .filter(element => element.tabIndex >= 0 && !element.hasAttribute('disabled') && element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (first && last && event.shiftKey && (document.activeElement === first || !controls.includes(document.activeElement as HTMLElement))) {
          event.preventDefault();
          last.focus();
        } else if (first && last && !event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onClose={() => { clear(); setOpen(false); trigger.current?.focus(); }}>
      <div className={styles.shell} data-dialog-shell>
        <header className={styles.header}>
          <span className={styles.headerIcon} aria-hidden="true"><MessageSquareText size={24} /></span>
          <div className={styles.heading}><h2 ref={title} id={`${id}-title`} tabIndex={-1}>Comunicarme<span className="sr-only"> por escrito</span></h2>
            <p id={`${id}-description`}>Muestra tu mensaje a quien está contigo.</p></div>
          <button type="button" className={styles.close} onClick={close}><X size={19} aria-hidden="true" /><span>Cerrar</span></button>
        </header>
        <div className={styles.body} data-dialog-scroll-body>
          {showMessage ? <section className={styles.presentation} aria-labelledby={`${id}-display-title`}>
            <div className={styles.messageLabel}><MessageSquareText size={18} aria-hidden="true" /><h3 ref={messageHeading} id={`${id}-display-title`} tabIndex={-1}>Mi mensaje</h3></div>
            <p className={styles.largeMessage}>{message.trim()}</p>
          </section> : <>
            <fieldset className={styles.phrases}>
              <legend>Frases rápidas</legend>
              <div className={styles.phraseGrid}>{phrases.map(({ text, icon: Icon }) => <button key={text} type="button" className={styles.phrase}
                aria-pressed={message === text} onClick={() => { speechService.stop(); setMessage(text); }}>
                <span className={styles.phraseIcon} aria-hidden="true"><Icon size={19} /></span><span>{text}</span>
                {message === text && <Check size={17} className={styles.selectedCheck} aria-hidden="true" />}
              </button>)}</div>
            </fieldset>
            <div className={styles.field}>
              <div className={styles.fieldHeading}><label htmlFor={`${id}-message`}>Mi mensaje</label><span id={`${id}-message-length`} className={styles.counter}>{message.length} / {limit}</span></div>
              <textarea ref={input} id={`${id}-message`} rows={3} maxLength={limit} value={message} aria-describedby={`${id}-message-length`}
                placeholder="Escribe aquí o elige una frase" onChange={event => { speechService.stop(); setMessage(event.target.value); }} />
            </div>
          </>}

          {showResponse && <section className={styles.response} aria-labelledby={`${id}-response-heading`}>
            <div className={styles.responseHeading}><Reply size={19} aria-hidden="true" /><h3 id={`${id}-response-heading`}>Respuesta</h3></div>
            <div className={styles.field}>
              <label htmlFor={`${id}-response`}>Respuesta de la persona que está contigo</label>
              <textarea ref={responseInput} id={`${id}-response`} rows={3} maxLength={limit} value={response}
                aria-describedby={`${id}-response-length`} placeholder="Escribe la respuesta aquí" onChange={event => setResponse(event.target.value)} />
              <p id={`${id}-response-length`} className={styles.counter}>{response.length} / {limit}</p>
            </div>
          </section>}

          <div className={styles.tools}>
            <div className={styles.voiceTools}>
              <button type="button" className={styles.tool} aria-label="Leer mi mensaje en voz alta" disabled={!message.trim() || !speechEnabled || !supportsSpeech}
                aria-describedby={`${id}-voice-hint`} onClick={() => speechService.speak(message.trim())}><Volume2 size={19} aria-hidden="true" /><span>Leer mi mensaje</span></button>
              <button type="button" className={styles.tool} onClick={() => speechService.stop()}><Square size={15} aria-hidden="true" /><span>Detener voz</span></button>
            </div>
            <button type="button" className={styles.clear} onClick={() => { clear(); requestAnimationFrame(() => input.current?.focus()); }}>
              <Trash2 size={17} aria-hidden="true" /><span>Borrar conversación</span>
            </button>
            {(!speechEnabled || !supportsSpeech) && <p id={`${id}-voice-hint`} className={styles.voiceHint}>{!speechEnabled ? 'La voz está desactivada en las opciones de accesibilidad.' : 'Este navegador no ofrece lectura por voz. Puedes mostrar el mensaje por escrito.'}</p>}
          </div>
          <details className={styles.localNotice}>
            <summary><LockKeyhole size={16} aria-hidden="true" /><span>Se borra al cerrar</span><ChevronDown size={16} className={styles.chevron} aria-hidden="true" /></summary>
            <div><p>El texto solo se muestra en este dispositivo. No se envía al cuidador ni se registra en tu historia.</p>
              {speechEnabled && supportsSpeech && <p id={`${id}-voice-hint`}>La voz es opcional y depende de las voces disponibles en tu navegador.</p>}</div>
          </details>
        </div>
        <footer className={styles.footer}>
          {showMessage ? <div className={styles.presentationActions}>
            <button type="button" className={styles.secondary} onClick={edit}><Pencil size={18} aria-hidden="true" />Editar mensaje</button>
            <button type="button" className={styles.primary} onClick={askForResponse}><Reply size={19} aria-hidden="true" />Escribir una respuesta</button>
          </div> : <button type="button" className={styles.primary} disabled={!message.trim()} onClick={() => setShowMessage(true)}>
            <MessageSquareText size={20} aria-hidden="true" />Mostrar mensaje grande
          </button>}
        </footer>
      </div>
    </dialog>
  </>;
}
