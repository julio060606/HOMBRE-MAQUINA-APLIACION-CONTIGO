import { SupportEventKind } from './supportApi';

export type VoiceState = 'OFF' | 'REQUESTING' | 'CONNECTING' | 'CONNECTED' | 'FAILED';
type SignalKind = Exclude<SupportEventKind, 'TEXT'>;
type Description = { type: 'offer' | 'answer'; sdp: string; callId: string };
type Candidate = { callId: string; candidate: RTCIceCandidateInit };
type AudioOptions = {
  caller: boolean;
  send: (kind: SignalKind, payload: string) => Promise<unknown>;
  state: (value: VoiceState, error?: string) => void;
  remote: (stream: MediaStream | null) => void;
  getMedia?: () => Promise<MediaStream>;
  createPeer?: () => RTCPeerConnection;
};

/** One explicit audio attempt. Audio never starts from polling or receipt of a signal. */
export class SupportAudioConnection {
  private peer: RTCPeerConnection | null = null;
  private stream: MediaStream | null = null;
  private closed = false;
  private starting: Promise<void> | null = null;
  private chain = Promise.resolve();
  private callId = '';
  private offer: Description | null = null;
  private candidates: Candidate[] = [];
  private timeout: ReturnType<typeof setTimeout> | undefined;
  private generation = 0;

  constructor(private options: AudioOptions) {}

  get active() { return !!this.stream; }

  async start(): Promise<void> {
    if (this.closed || this.stream) return;
    if (this.starting) return this.starting;
    const attempt = this.generation;
    this.options.state('REQUESTING');
    this.starting = (async () => {
      try {
        const stream = await (this.options.getMedia?.() ?? navigator.mediaDevices.getUserMedia({ audio: true, video: false }));
        if (this.closed || attempt !== this.generation) { stream.getTracks().forEach(track => track.stop()); return; }
        this.stream = stream;
        this.options.state('CONNECTING');
        this.timeout = setTimeout(() => {
          if (!this.closed && this.generation === attempt && !this.peer) this.fail(new Error('La otra persona aún no activó el audio. Continúa por escrito o vuelve a activarlo en ambos dispositivos.'));
        }, 30000);
        await this.enqueue(async () => {
          if (attempt !== this.generation) return;
          if (this.options.caller) {
            this.callId = crypto.randomUUID();
            const peer = this.makePeer();
            const offer = await peer.createOffer();
            if (this.closed || attempt !== this.generation || this.peer !== peer) return;
            await peer.setLocalDescription(offer);
            if (this.closed || attempt !== this.generation || this.peer !== peer) return;
            await this.options.send('OFFER', JSON.stringify({ type: 'offer', sdp: peer.localDescription?.sdp, callId: this.callId }));
          } else if (this.offer) await this.answer(this.offer);
        });
      } catch (error) { if (attempt === this.generation) this.fail(error); }
      finally { this.starting = null; }
    })();
    return this.starting;
  }

  setMuted(muted: boolean) { this.stream?.getAudioTracks().forEach(track => { track.enabled = !muted; }); }

  stop() { this.release(); this.options.state('OFF'); }

  async receive(kind: SignalKind, payload: string): Promise<void> {
    if (this.closed) return;
    await this.enqueue(async () => {
      const value: unknown = JSON.parse(payload);
      if (!value || typeof value !== 'object' || !('callId' in value) || typeof value.callId !== 'string') return;
      if (kind === 'OFFER' && !this.options.caller) {
        const offer = value as Description;
        if (offer.type !== 'offer' || typeof offer.sdp !== 'string') return;
        if (this.offer?.callId === offer.callId) return;
        this.offer = offer;
        if (this.stream) await this.answer(offer);
      } else if (kind === 'ANSWER' && this.options.caller) {
        const answer = value as Description;
        if (answer.type !== 'answer' || typeof answer.sdp !== 'string' || answer.callId !== this.callId || !this.peer) return;
        await this.peer.setRemoteDescription({ type: 'answer', sdp: answer.sdp });
        await this.flushCandidates();
      } else if (kind === 'ICE') {
        const candidate = value as Candidate;
        if (!candidate.candidate || typeof candidate.candidate !== 'object') return;
        // ICE can reach the API before the SDP: retain it until setRemoteDescription succeeds.
        if (this.candidates.length < 100) this.candidates.push(candidate);
        await this.flushCandidates();
      }
    });
  }

  dispose() {
    if (this.closed) return;
    this.closed = true;
    this.release();
    this.options.state('OFF');
  }

  private enqueue(task: () => Promise<void>): Promise<void> {
    const generation = this.generation;
    const work = this.chain.then(async () => { if (!this.closed) await task(); });
    this.chain = work.catch(error => { if (generation === this.generation) this.fail(error); });
    return this.chain;
  }

  private makePeer(): RTCPeerConnection {
    if (this.timeout) clearTimeout(this.timeout);
    this.peer?.close();
    // No external STUN/TURN service receives connection metadata in this local demonstration.
    const peer = this.options.createPeer?.() ?? new RTCPeerConnection({ iceServers: [] });
    this.peer = peer;
    this.stream?.getAudioTracks().forEach(track => peer.addTrack(track, this.stream!));
    peer.onicecandidate = event => {
      if (!event.candidate || this.closed || this.peer !== peer) return;
      void this.options.send('ICE', JSON.stringify({ callId: this.callId, candidate: event.candidate.toJSON() }))
        .catch(error => { if (this.peer === peer) this.fail(error); });
    };
    peer.ontrack = event => {
      if (!this.closed && this.peer === peer) this.options.remote(event.streams[0] ?? new MediaStream([event.track]));
    };
    peer.onconnectionstatechange = () => {
      if (this.closed || this.peer !== peer) return;
      if (peer.connectionState === 'connected') {
        if (this.timeout) clearTimeout(this.timeout);
        this.options.state('CONNECTED');
      } else if (peer.connectionState === 'failed') this.fail(new Error('No se pudo establecer el audio. Puedes seguir escribiendo.'));
      else if (peer.connectionState === 'disconnected') {
        this.options.state('CONNECTING');
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
          if (!this.closed && this.peer === peer && peer.connectionState === 'disconnected') this.fail(new Error('La otra persona perdió la conexión de audio. Se apagó tu micrófono. Puedes seguir escribiendo.'));
        }, 10000);
      }
    };
    this.timeout = setTimeout(() => {
      if (!this.closed && this.peer === peer && peer.connectionState !== 'connected') this.fail(new Error('El audio no logró conectarse. Continúa por escrito o vuelve a activarlo en ambos dispositivos.'));
    }, 30000);
    this.options.state('CONNECTING');
    return peer;
  }

  private async answer(offer: Description) {
    if (!this.stream || this.closed) return;
    this.callId = offer.callId;
    const peer = this.makePeer();
    await peer.setRemoteDescription({ type: 'offer', sdp: offer.sdp });
    if (this.closed || this.peer !== peer) return;
    await this.flushCandidates();
    if (this.closed || this.peer !== peer) return;
    const answer = await peer.createAnswer();
    if (this.closed || this.peer !== peer) return;
    await peer.setLocalDescription(answer);
    if (this.closed || this.peer !== peer) return;
    await this.options.send('ANSWER', JSON.stringify({ type: 'answer', sdp: peer.localDescription?.sdp, callId: this.callId }));
  }

  private async flushCandidates() {
    if (!this.peer?.remoteDescription) return;
    const matching = this.candidates.filter(candidate => candidate.callId === this.callId);
    this.candidates = this.candidates.filter(candidate => candidate.callId !== this.callId);
    for (const value of matching) {
      if (this.closed) return;
      await this.peer.addIceCandidate(value.candidate);
    }
  }

  private fail(error: unknown) {
    if (this.closed) return;
    this.release();
    const denied = error instanceof Error && ['NotAllowedError', 'PermissionDeniedError'].includes(error.name);
    this.options.state('FAILED', denied ? 'No se permitió usar el micrófono. Puedes comunicarte por escrito.' : error instanceof Error ? error.message : 'El audio no está disponible. Puedes escribir.');
  }

  private release() {
    this.generation++;
    if (this.timeout) clearTimeout(this.timeout);
    this.peer?.close(); this.peer = null;
    this.stream?.getTracks().forEach(track => track.stop()); this.stream = null;
    this.options.remote(null);
  }
}
