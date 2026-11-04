import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { Check, Mic, MicOff, MessageSquare, Phone, Send } from 'lucide-react';
import { User } from '../../types';
import { useReadingPreferences } from '../../hooks/useReadingPreferences';
import { ApiError } from '../../services/http/apiTransport';
import { supportApi, SupportEvent, supportOperationId, SupportSession } from './supportApi';
import { SupportAudioConnection, VoiceState } from './SupportAudioConnection';
import styles from './LiveSupportConversation.module.css';

type Props = { sessionId: string; patientId: string; actor: User; onEnded?: () => void; stopping?: boolean };
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'No se pudo conectar. Vuelve a intentarlo.';
const time = (date: string) => new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' }).format(new Date(date));

export function LiveSupportConversation(props: Props) {
  return <Conversation key={`${props.actor.id}:${props.patientId}:${props.sessionId}`} {...props} />;
}

function Conversation({ sessionId, patientId, actor, onEnded, stopping = false }: Props) {
  const id = useId();
  const { silent } = useReadingPreferences();
  const [session, setSession] = useState<SupportSession | null>(null);
  const [messages, setMessages] = useState<SupportEvent[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [now, setNow] = useState(Date.now);
  const [extending, setExtending] = useState(false);
  const [extensionError, setExtensionError] = useState('');
  const [extensionStatus, setExtensionStatus] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [voiceState, setVoiceState] = useState<VoiceState>('OFF');
  const [muted, setMuted] = useState(false);
  const [needsPlay, setNeedsPlay] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const voice = useRef<SupportAudioConnection | null>(null);
  const onEndedRef = useRef(onEnded);
  const pendingText = useRef<{ text: string; operationId: string } | null>(null);
  const extensionOperation = useRef<string>();
  const extensionLock = useRef(false);
  const caller = actor.role === 'ROLE_PATIENT';
  const supported = typeof window !== 'undefined' && window.isSecureContext && typeof RTCPeerConnection !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => { onEndedRef.current = onEnded; }, [onEnded]);

  useEffect(() => {
    let active = true;
    let cursor = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let endedNotified = false;
    const abort = new AbortController();
    const audioConnection = new SupportAudioConnection({
      caller,
      send: (kind, payload) => supportApi.send(patientId, sessionId, kind, payload),
      state: (value, error) => { if (active) { setVoiceState(value); setVoiceError(error ?? ''); } },
      remote: stream => { if (active) setRemoteStream(stream); },
    });
    voice.current = audioConnection;
    const poll = async () => {
      let delay = 1000;
      try {
        const update = await supportApi.events(patientId, sessionId, cursor, abort.signal);
        if (!active) return;
        setSession(current => current && update.session.status !== 'ENDED' && Date.parse(current.expiresAt) > Date.parse(update.session.expiresAt)
          ? { ...update.session, expiresAt: current.expiresAt } : update.session);
        setConnectionError('');
        const newMessages: SupportEvent[] = [];
        for (const event of update.events) {
          if (!active) return;
          if (event.id <= cursor) continue;
          if (event.kind === 'TEXT') newMessages.push(event);
          else if (event.senderId !== actor.id && update.session.status !== 'ENDED') await audioConnection.receive(event.kind, event.payload);
          cursor = Math.max(cursor, event.id);
        }
        if (newMessages.length) setMessages(previous => [...new Map([...previous, ...newMessages].map(event => [event.id, event])).values()]);
        if (update.session.status === 'ENDED') {
          audioConnection.dispose();
          if (!endedNotified) { endedNotified = true; onEndedRef.current?.(); }
          return;
        }
        // Catch up without dropping events when a batch reaches the API page limit.
        if (update.events.length === 100) delay = 0;
      } catch (error) {
        if (!active || abort.signal.aborted) return;
        setConnectionError(errorMessage(error));
        if (error instanceof ApiError && [401, 403, 404].includes(error.status)) { audioConnection.dispose(); return; }
        delay = 2500;
      }
      if (active) timer = setTimeout(() => { void poll(); }, delay);
    };
    void poll();
    return () => {
      active = false; abort.abort(); if (timer) clearTimeout(timer);
      audioConnection.dispose(); if (voice.current === audioConnection) voice.current = null;
    };
  }, [actor.id, caller, patientId, sessionId]);

  useEffect(() => {
    if (silent || stopping) { voice.current?.stop(); setMuted(false); }
    const player = audio.current;
    if (!player) return;
    player.muted = silent || stopping;
    player.srcObject = silent || stopping ? null : remoteStream;
    if (remoteStream && !silent && !stopping) {
      void player.play().then(() => setNeedsPlay(false)).catch(() => setNeedsPlay(true));
    } else { player.pause(); setNeedsPlay(false); }
  }, [remoteStream, silent, stopping]);

  const ended = session?.status === 'ENDED';
  const accepted = session?.status === 'ACCEPTED';
  const expiresAt = session?.expiresAt;
  const expiring = !!session && !ended && Date.parse(session.expiresAt) - now <= 120000;
  useEffect(() => {
    if (!expiresAt || ended) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAt, ended]);

  async function extendTime() {
    if (!session || ended || stopping || extensionLock.current) return;
    extensionLock.current = true;
    setExtending(true); setExtensionError(''); setExtensionStatus('');
    extensionOperation.current ??= supportOperationId();
    try {
      const extended = await supportApi.extend(patientId, sessionId, extensionOperation.current);
      setSession(current => current?.status === 'ENDED' ? current : extended);
      extensionOperation.current = undefined;
      setNow(Date.now());
      setExtensionStatus(extended.status === 'ENDED' ? 'La conversación ya terminó. Tu mensaje sin enviar sigue disponible.' : `Tiempo ampliado. La conversación está disponible hasta las ${time(extended.expiresAt)}.`);
    } catch (error) { setExtensionError(errorMessage(error)); }
    finally { extensionLock.current = false; setExtending(false); }
  }
  const microphoneOn = voiceState === 'CONNECTING' || voiceState === 'CONNECTED';
  const sendText = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim() || text.length > 1000 || sending || stopping || ended || !session) return;
    if (!pendingText.current || pendingText.current.text !== text.trim()) pendingText.current = { text: text.trim(), operationId: supportOperationId() };
    const operation = pendingText.current;
    setSending(true); setSendError('');
    try {
      const sent = await supportApi.send(patientId, sessionId, 'TEXT', operation.text, operation.operationId);
      setMessages(previous => [...new Map([...previous, sent].map(value => [value.id, value])).values()].sort((a, b) => a.id - b.id));
      setText(''); pendingText.current = null;
    } catch (error) { setSendError(errorMessage(error)); }
    finally { setSending(false); }
  };

  return <section className={styles.conversation} data-testid="support-conversation" aria-label="Conversación de apoyo">
    <div className={`${styles.status} ${accepted ? styles.accepted : ''}`} role="status" aria-live="polite" data-testid="support-status">
      {ended ? <><Check size={22} aria-hidden="true" /><div><strong>Conversación finalizada</strong><span>El micrófono está apagado.</span></div></> : accepted ? <><Check size={22} aria-hidden="true" /><div><strong>{caller ? `${session.responderName || 'Una persona del equipo'} te atiende` : 'Solicitud aceptada'}</strong><span>{caller ? 'Ya pueden hablar o escribir.' : 'Ya puedes responder al paciente por voz o texto.'}</span></div></> : <><MessageSquare size={22} aria-hidden="true" /><div><strong>{session ? 'Esperando respuesta' : 'Conectando con el panel…'}</strong><span>{caller ? 'Tu solicitud está en el dashboard de la clínica de demostración.' : 'Acepta la solicitud para conversar.'}</span></div></>}
    </div>
    {connectionError && <p role="alert" className={styles.error}>No se puede actualizar la conversación. {connectionError} Los mensajes enviados se conservan.</p>}
    {session && !ended && <section className={styles.timeLimit} aria-label="Tiempo de conversación">
      {expiring && <p role="alert" className={styles.expiryWarning}>La conversación está por terminar. Añade más tiempo para seguir hablando o escribiendo.</p>}
      <p>Disponible hasta las <time dateTime={session.expiresAt}>{time(session.expiresAt)}</time>. Puedes ampliar el tiempo cuando lo necesites.</p>
      <button type="button" className={styles.secondary} data-testid="support-extend" disabled={stopping || extending} onClick={() => void extendTime()}>{extending ? 'Ampliando tiempo…' : 'Añadir 30 minutos'}</button>
      {extensionError && <p role="alert" className={styles.error}>{extensionError} Puedes volver a intentar ampliar el tiempo.</p>}
    </section>}
    <p role="status" className={extensionStatus && !ended ? styles.hint : 'sr-only'}>{!ended && extensionStatus}</p>
    {!ended && <div className={styles.voiceArea}>
      <div className={styles.voiceHeading}><Phone size={20} aria-hidden="true" /><h3>Hablar por voz</h3></div>
      {!accepted && <p>Podrás activar tu micrófono cuando alguien acepte la solicitud.</p>}
      {!supported && <p>La voz necesita un navegador compatible y una conexión HTTPS o localhost. Puedes escribir aquí.</p>}
      {silent && <p>El modo sin sonido está activo. Para usar la voz, desactívalo en Opciones de lectura.</p>}
      {supported && accepted && !silent && <>
        {!microphoneOn ? <button type="button" className={styles.primary} data-testid="support-enable-mic" disabled={stopping || voiceState === 'REQUESTING' || !!connectionError} onClick={() => { setMuted(false); void voice.current?.start(); }}><Mic size={20} aria-hidden="true" />{voiceState === 'REQUESTING' ? 'Permite el micrófono…' : 'Activar micrófono'}</button> : <>
          <p className={styles.voiceState} role="status">{voiceState === 'CONNECTED' ? (muted ? 'Audio conectado · micrófono silenciado' : 'Audio conectado · micrófono encendido') : muted ? 'Micrófono silenciado · conectando el audio…' : 'Micrófono encendido · conectando el audio…'}</p>
          <button type="button" className={styles.secondary} data-testid="support-mute-mic" aria-pressed={muted} onClick={() => { voice.current?.setMuted(!muted); setMuted(!muted); }}>{muted ? <Mic size={20} aria-hidden="true" /> : <MicOff size={20} aria-hidden="true" />}{muted ? 'Volver a hablar' : 'Silenciar micrófono'}</button>
          <button type="button" className={styles.secondary} data-testid="support-stop-audio" onClick={() => { voice.current?.stop(); setMuted(false); }}>Apagar audio y seguir por escrito</button>
        </>}
        <p className={styles.hint}>Ambas personas deben activar su micrófono. No se graba el audio.</p>
        {voiceState === 'OFF' && <p className={styles.hint}>Tu micrófono está apagado. Puedes usar solo los mensajes.</p>}
      </>}
      {voiceError && <p role="alert" className={styles.error}>{voiceError}</p>}
      {needsPlay && !silent && <button type="button" className={styles.secondary} data-testid="support-play-audio" onClick={() => { void audio.current?.play().then(() => setNeedsPlay(false)).catch(() => setVoiceError('El navegador bloqueó el sonido. Revisa sus permisos o continúa por escrito.')); }}>Escuchar llamada</button>}
      <audio ref={audio} autoPlay playsInline aria-label="Audio de la conversación" />
    </div>}
    <div className={styles.textArea}>
      <h3><MessageSquare size={20} aria-hidden="true" />Comunicarme por escrito</h3>
      <div className={styles.messages} role="log" aria-live="polite" aria-relevant="additions" tabIndex={0} aria-label="Mensajes de la conversación" data-testid="support-messages">
        {!messages.length && <p className={styles.empty}>{ended ? 'Esta conversación terminó sin mensajes enviados.' : caller ? 'Puedes escribir mientras esperas. Tu mensaje llegará al panel.' : 'Los mensajes aparecerán aquí.'}</p>}
        {messages.map(message => <article key={message.id} className={`${styles.message} ${message.senderId === actor.id ? styles.mine : ''}`}><div><strong>{message.senderId === actor.id ? 'Tú' : message.senderName}</strong><time dateTime={message.createdAt}>{time(message.createdAt)}</time></div><p>{message.payload}</p></article>)}
      </div>
      {(!ended || !!text) && <form onSubmit={event => { void sendText(event); }} className={styles.composer}>
        <label htmlFor={`${id}-text`}>{ended ? 'Tu mensaje sin enviar' : 'Escribe tu mensaje'}</label>
        <textarea id={`${id}-text`} rows={3} maxLength={1000} data-testid="support-message-input" value={text} readOnly={ended} disabled={sending || stopping} aria-describedby={`${id}-limit ${id}-draft-hint`} onChange={event => setText(event.target.value)} />
        <div className={styles.sendRow}><span id={`${id}-limit`}>{text.length}/1000</span>{!ended && <button className={styles.primary} type="submit" data-testid="support-send-message" disabled={!session || !text.trim() || sending || stopping || !!connectionError}><Send size={18} aria-hidden="true" />{sending ? 'Enviando…' : 'Enviar mensaje'}</button>}</div>
        <p id={`${id}-draft-hint`} className={styles.hint}>{ended ? 'La conversación terminó. Tu borrador sigue aquí para que puedas seleccionarlo y copiarlo antes de cerrar.' : 'Los mensajes enviados quedan guardados en esta conversación para el paciente y la persona que la atiende.'}</p>
        {!ended && sendError && <p role="alert" className={styles.error}>{sendError} Tu texto se conserva para intentarlo otra vez.</p>}
      </form>}
    </div>
  </section>;
}
