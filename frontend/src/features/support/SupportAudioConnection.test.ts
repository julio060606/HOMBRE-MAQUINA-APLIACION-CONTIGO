import { afterEach, describe, expect, it, vi } from 'vitest';
import { SupportAudioConnection, VoiceState } from './SupportAudioConnection';

function setup(caller = true, media?: () => Promise<MediaStream>) {
  const track = { enabled: true, stop: vi.fn() };
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream;
  const peer = {
    remoteDescription: null as RTCSessionDescriptionInit | null,
    localDescription: null as RTCSessionDescriptionInit | null,
    connectionState: 'new',
    onconnectionstatechange: null as ((event: Event) => void) | null,
    addTrack: vi.fn(), close: vi.fn(),
    createOffer: vi.fn(async () => ({ type: 'offer', sdp: 'offer-sdp' })),
    createAnswer: vi.fn(async () => ({ type: 'answer', sdp: 'answer-sdp' })),
    setLocalDescription: vi.fn(async function(this: { localDescription: RTCSessionDescriptionInit | null }, value: RTCSessionDescriptionInit) { this.localDescription = value; }),
    setRemoteDescription: vi.fn(async function(this: { remoteDescription: RTCSessionDescriptionInit | null }, value: RTCSessionDescriptionInit) { this.remoteDescription = value; }),
    addIceCandidate: vi.fn(async () => {}),
  };
  const getMedia = vi.fn(media ?? (async () => stream));
  const send = vi.fn<(kind: string, payload: string) => Promise<void>>(async () => {});
  const state = vi.fn<(state: VoiceState, error?: string) => void>();
  const remote = vi.fn();
  const connection = new SupportAudioConnection({ caller, getMedia, createPeer: () => peer as unknown as RTCPeerConnection, send, state, remote });
  return { connection, track, stream, peer, getMedia, send, state, remote };
}

afterEach(() => { vi.useRealTimers(); });

describe('voz SOS con permiso explícito', () => {
  it('recibir una oferta no enciende el micrófono ni responde hasta que la persona lo activa', async () => {
    const ctx = setup(false);
    await ctx.connection.receive('OFFER', JSON.stringify({ type: 'offer', sdp: 'offer-sdp', callId: 'attempt-1' }));
    expect(ctx.getMedia).not.toHaveBeenCalled();
    expect(ctx.peer.setRemoteDescription).not.toHaveBeenCalled();
    expect(ctx.send).not.toHaveBeenCalled();
    await ctx.connection.start();
    expect(ctx.getMedia).toHaveBeenCalledTimes(1);
    expect(ctx.peer.setRemoteDescription).toHaveBeenCalledWith({ type: 'offer', sdp: 'offer-sdp' });
    expect(ctx.send).toHaveBeenCalledWith('ANSWER', JSON.stringify({ type: 'answer', sdp: 'answer-sdp', callId: 'attempt-1' }));
    ctx.connection.dispose();
  });

  it('retiene ICE que llega antes del SDP y descarta respuestas de otro intento', async () => {
    const ctx = setup();
    await ctx.connection.start();
    const offer = JSON.parse(ctx.send.mock.calls[0][1] as string) as { callId: string };
    const candidate = { candidate: 'candidate:1', sdpMid: '0', sdpMLineIndex: 0 };
    await ctx.connection.receive('ICE', JSON.stringify({ callId: offer.callId, candidate }));
    expect(ctx.peer.addIceCandidate).not.toHaveBeenCalled();
    await ctx.connection.receive('ANSWER', JSON.stringify({ type: 'answer', sdp: 'stale', callId: 'old' }));
    expect(ctx.peer.setRemoteDescription).not.toHaveBeenCalled();
    await ctx.connection.receive('ANSWER', JSON.stringify({ type: 'answer', sdp: 'answer-sdp', callId: offer.callId }));
    expect(ctx.peer.addIceCandidate).toHaveBeenCalledExactlyOnceWith(candidate);
    ctx.connection.dispose();
  });

  it('silencia pistas y al cerrar detiene el micrófono y la conexión', async () => {
    const ctx = setup();
    await ctx.connection.start();
    ctx.connection.setMuted(true); expect(ctx.track.enabled).toBe(false);
    ctx.connection.setMuted(false); expect(ctx.track.enabled).toBe(true);
    ctx.connection.dispose();
    expect(ctx.track.stop).toHaveBeenCalledTimes(1);
    expect(ctx.peer.close).toHaveBeenCalledTimes(1);
    expect(ctx.remote).toHaveBeenLastCalledWith(null);
    expect(ctx.state).toHaveBeenLastCalledWith('OFF');
    await ctx.connection.start();
    expect(ctx.getMedia).toHaveBeenCalledTimes(1);
  });

  it('cerrar durante la solicitud de permiso también detiene las pistas que llegan tarde', async () => {
    let resolve!: (stream: MediaStream) => void;
    const ctx = setup(true, () => new Promise<MediaStream>(done => { resolve = done; }));
    const starting = ctx.connection.start();
    ctx.connection.dispose();
    resolve(ctx.stream); await starting;
    expect(ctx.track.stop).toHaveBeenCalledTimes(1);
    expect(ctx.peer.addTrack).not.toHaveBeenCalled();
    expect(ctx.send).not.toHaveBeenCalled();
  });

  it('activar el modo sin sonido mientras el permiso está pendiente impide encender el micrófono tarde', async () => {
    let resolve!: (stream: MediaStream) => void;
    const ctx = setup(true, () => new Promise<MediaStream>(done => { resolve = done; }));
    const starting = ctx.connection.start();
    ctx.connection.stop();
    resolve(ctx.stream); await starting;
    expect(ctx.track.stop).toHaveBeenCalledTimes(1);
    expect(ctx.peer.addTrack).not.toHaveBeenCalled();
    expect(ctx.send).not.toHaveBeenCalled();
    expect(ctx.state).toHaveBeenLastCalledWith('OFF');
    ctx.connection.dispose();
  });

  it('el receptor indica micrófono activo aunque todavía no haya llegado la oferta', async () => {
    const ctx = setup(false);
    await ctx.connection.start();
    expect(ctx.connection.active).toBe(true);
    expect(ctx.state).toHaveBeenLastCalledWith('CONNECTING');
    expect(ctx.send).not.toHaveBeenCalled();
    ctx.connection.dispose();
  });

  it('rechazar permiso mantiene una explicación escrita y permite volver a intentarlo', async () => {
    const ctx = setup();
    ctx.getMedia.mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'));
    await ctx.connection.start();
    expect(ctx.state).toHaveBeenLastCalledWith('FAILED', 'No se permitió usar el micrófono. Puedes comunicarte por escrito.');
    expect(ctx.send).not.toHaveBeenCalled();
    await ctx.connection.start();
    expect(ctx.getMedia).toHaveBeenCalledTimes(2);
    expect(ctx.send).toHaveBeenCalledTimes(1);
    ctx.connection.dispose();
  });

  it('dos pulsaciones simultáneas solicitan el permiso una sola vez', async () => {
    let resolve!: (stream: MediaStream) => void;
    const ctx = setup(true, () => new Promise<MediaStream>(done => { resolve = done; }));
    const first = ctx.connection.start(); const second = ctx.connection.start();
    resolve(ctx.stream); await Promise.all([first, second]);
    expect(ctx.getMedia).toHaveBeenCalledTimes(1);
    expect(ctx.peer.createOffer).toHaveBeenCalledTimes(1);
    ctx.connection.dispose();
  });

  it('si nadie conecta el audio deja de usar el micrófono después de 30 segundos', async () => {
    vi.useFakeTimers();
    const ctx = setup();
    await ctx.connection.start();
    await vi.advanceTimersByTimeAsync(30000);
    expect(ctx.track.stop).toHaveBeenCalledTimes(1);
    expect(ctx.peer.close).toHaveBeenCalledTimes(1);
    expect(ctx.state).toHaveBeenLastCalledWith('FAILED', expect.stringContaining('Continúa por escrito'));
    ctx.connection.dispose();
  });

  it('apagar audio detiene las pistas y permite otro intento explícito con una oferta nueva', async () => {
    const ctx = setup();
    await ctx.connection.start();
    const firstOffer = JSON.parse(ctx.send.mock.calls[0][1]) as { callId: string };
    ctx.connection.stop();
    expect(ctx.connection.active).toBe(false);
    expect(ctx.track.stop).toHaveBeenCalledTimes(1);
    await ctx.connection.start();
    const secondOffer = JSON.parse(ctx.send.mock.calls[1][1]) as { callId: string };
    expect(secondOffer.callId).not.toBe(firstOffer.callId);
    expect(ctx.getMedia).toHaveBeenCalledTimes(2);
    ctx.connection.dispose();
  });

  it('perder la conexión tras hablar apaga el micrófono si no se recupera en diez segundos', async () => {
    vi.useFakeTimers();
    const ctx = setup();
    await ctx.connection.start();
    ctx.peer.connectionState = 'connected'; ctx.peer.onconnectionstatechange?.(new Event('connectionstatechange'));
    ctx.peer.connectionState = 'disconnected'; ctx.peer.onconnectionstatechange?.(new Event('connectionstatechange'));
    await vi.advanceTimersByTimeAsync(10000);
    expect(ctx.track.stop).toHaveBeenCalledTimes(1);
    expect(ctx.state).toHaveBeenLastCalledWith('FAILED', expect.stringContaining('Se apagó tu micrófono'));
    ctx.connection.dispose();
  });

  it('recuperar la conexión cancela el apagado por desconexión', async () => {
    vi.useFakeTimers();
    const ctx = setup();
    await ctx.connection.start();
    ctx.peer.connectionState = 'connected'; ctx.peer.onconnectionstatechange?.(new Event('connectionstatechange'));
    ctx.peer.connectionState = 'disconnected'; ctx.peer.onconnectionstatechange?.(new Event('connectionstatechange'));
    await vi.advanceTimersByTimeAsync(5000);
    ctx.peer.connectionState = 'connected'; ctx.peer.onconnectionstatechange?.(new Event('connectionstatechange'));
    await vi.advanceTimersByTimeAsync(10000);
    expect(ctx.track.stop).not.toHaveBeenCalled();
    expect(ctx.state).toHaveBeenLastCalledWith('CONNECTED');
    ctx.connection.dispose();
  });
});
