import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '../..');
const base = new URL(process.argv[2] || 'http://127.0.0.1:3001');
if (!['localhost', '127.0.0.1'].includes(base.hostname)) throw Error('Solo se permite el origen local del proyecto.');
const output = path.join(root, 'output/live-sos-2026-11-03');
const require = createRequire(import.meta.url);
const axeSource = await fs.readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
await fs.mkdir(output, { recursive: true });
const report = { complete: false, timestamp: new Date().toISOString(), base: base.origin,
  mode: 'API central/PostgreSQL y dos contextos Chrome separados; micrófonos sintéticos de Chrome, sin dispositivos reales.',
  limitations: ['Verificación técnica headless, sin participantes ni lector de pantalla.', 'El audio usa dispositivos sintéticos y conexión local; no acredita micrófonos físicos, operadores de una clínica real ni conexión TURN en redes diferentes.', 'Solo se crean solicitudes SOS sintéticas identificadas por este informe. No se modifican tratamientos, mediciones ni citas. Los avisos propios se reconocen al limpiar y permanecen en el historial académico.'],
  checks: [], sessions: [], sourceHashes: {}, requests: [], errors: [], consoleErrors: [] };
const sourceFiles = ['frontend/src/features/patient-app/PatientHelp.tsx', 'frontend/src/features/patient-app/PatientHelp.module.css', 'frontend/src/features/support/LiveSupportConversation.tsx', 'frontend/src/features/support/LiveSupportConversation.module.css', 'frontend/src/features/support/SupportAudioConnection.ts', 'frontend/src/features/support/supportApi.ts', 'frontend/src/features/support/SupportInbox.tsx', 'frontend/src/features/support/SupportInbox.module.css', 'frontend/src/components/layout/MainLayout.tsx', 'backend/src/main/java/com/sanpablo/contigo/controller/SupportSessionController.java', 'backend/src/main/java/com/sanpablo/contigo/service/SupportSessionService.java', 'backend/src/main/java/com/sanpablo/contigo/dto/telemetry/SupportDtos.java'];
const assert = (condition, message) => { if (!condition) throw Error(message); };
const created = [];
let browser;
let patient;
let caregiver;

async function sourceHashes() {
  const values = {};
  for (const file of sourceFiles) {
    try { values[file] = crypto.createHash('sha256').update(await fs.readFile(path.join(root, file))).digest('hex'); }
    catch { /* Source additions can be named differently; report the existing ones only. */ }
  }
  return values;
}
async function api(page, route, method = 'GET', body) {
  return page.evaluate(async ({ route, method, body }) => {
    const { fetchAuthenticated } = await import('/src/services/http/apiTransport.ts');
    const response = await fetchAuthenticated(route, { method, headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const text = await response.text();
    let data; try { data = JSON.parse(text); } catch { data = text; }
    return { status: response.status, data };
  }, { route, method, body });
}
async function snapshot(page) {
  return page.evaluate(async () => {
    const qa = window.__sosQa;
    const peers = [];
    for (const peer of qa.peers) {
      const stats = [];
      try { (await peer.getStats()).forEach(entry => {
        if (['inbound-rtp', 'outbound-rtp', 'transport'].includes(entry.type)) stats.push({ type: entry.type, kind: entry.kind, packetsReceived: entry.packetsReceived, packetsSent: entry.packetsSent, bytesReceived: entry.bytesReceived, bytesSent: entry.bytesSent, dtlsState: entry.dtlsState });
      }); } catch { /* Closed connections need not expose statistics. */ }
      peers.push({ connectionState: peer.connectionState, iceConnectionState: peer.iceConnectionState, signalingState: peer.signalingState, stats });
    }
    return { peers, tracks: qa.streams.flatMap(stream => stream.getTracks().map(track => ({ kind: track.kind, enabled: track.enabled, readyState: track.readyState }))), microphoneCalls: qa.microphoneCalls };
  });
}
async function waitAudio(page) {
  for (let attempt = 0; attempt < 35; attempt++) {
    const result = await snapshot(page);
    if (result.peers.some(peer => peer.connectionState === 'connected' && peer.stats.some(stat => stat.type === 'inbound-rtp' && stat.kind === 'audio' && stat.packetsReceived > 0))) return result;
    await page.waitForTimeout(500);
  }
  throw Error('No se acreditaron paquetes de audio entrantes en un peer conectado: ' + JSON.stringify(await snapshot(page)));
}
async function waitTracksStopped(page) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const result = await snapshot(page);
    if (result.tracks.length > 0 && result.tracks.every(track => track.readyState === 'ended')) return result;
    await page.waitForTimeout(500);
  }
  throw Error('No se apagó el micrófono después de desconectarse el otro extremo: ' + JSON.stringify(await snapshot(page)));
}
async function picture(page, filename) { await page.screenshot({ path: path.join(output, filename), fullPage: true }); return filename; }
async function auditAccessibility(page, selector) {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async selector => {
    const result = await window.axe.run({ include: [[selector]] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
    const concise = entry => ({ id: entry.id, impact: entry.impact, description: entry.description, nodes: entry.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) });
    return { violations: result.violations.map(concise), incomplete: result.incomplete.map(concise) };
  }, selector);
}
async function tabTo(page, locator) {
  for (let count = 0; count < 140; count++) {
    if (await locator.evaluate(element => element === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw Error('El control no se alcanzó por Tab.');
}
async function setScale(page, scale) {
  await page.evaluate(async scale => {
    const { getReadingPreferences, setReadingPreferences } = await import('/src/services/accessibilityPreferences.ts');
    setReadingPreferences({ ...getReadingPreferences(), scale });
  }, scale);
  await page.waitForTimeout(150);
}
async function overflow(page, selector) {
  return page.locator(selector).evaluate(element => {
    const rect = element.getBoundingClientRect();
    const surface = element.closest('[data-app-surface]')?.getBoundingClientRect();
    const outside = surface ? rect.left < Math.max(0, surface.left) - 1 || rect.right > Math.min(innerWidth, surface.right) + 1 || rect.top < Math.max(0, surface.top) - 1 || rect.bottom > Math.min(innerHeight, surface.bottom) + 1 : false;
    const wide = [element, ...element.querySelectorAll('*')].filter(node => node.clientWidth > 0 && node.scrollWidth > node.clientWidth + 2 && !['TEXTAREA', 'INPUT'].includes(node.tagName)).map(node => ({ tag: node.tagName, text: node.textContent?.slice(0, 70), client: node.clientWidth, scroll: node.scrollWidth }));
    return { rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }, surface: surface && { left: surface.left, right: surface.right, top: surface.top, bottom: surface.bottom }, outside, wide };
  });
}
async function newActor(email, route, viewport = { width: 1280, height: 1000 }) {
  const context = await browser.newContext({ viewport, locale: 'es-PE', reducedMotion: 'reduce', permissions: ['microphone'] });
  await context.addInitScript(() => {
    window.__sosQa = { peers: [], streams: [], microphoneCalls: 0 };
    if (window.RTCPeerConnection) {
      const NativePeer = window.RTCPeerConnection;
      window.RTCPeerConnection = class extends NativePeer { constructor(...args) { super(...args); window.__sosQa.peers.push(this); } };
    }
    if (navigator.mediaDevices?.getUserMedia) {
      const nativeMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async constraints => { window.__sosQa.microphoneCalls++; const stream = await nativeMedia(constraints); window.__sosQa.streams.push(stream); return stream; };
    }
  });
  await context.route('**/api/v1/**', routeHandler => {
    const req = routeHandler.request();
    const pathname = new URL(req.url()).pathname;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method())) {
      report.requests.push({ method: req.method(), pathname });
      const ownAcknowledgement = created.some(session => pathname === `/api/v1/patients/${session.patientId}/alerts/${session.alertId}/acknowledgements`);
      if (!pathname.startsWith('/api/v1/auth/') && !pathname.includes('/support-sessions') && !ownAcknowledgement) return routeHandler.abort('blockedbyclient');
    }
    return routeHandler.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', error => report.consoleErrors.push(error.message));
  await page.goto(new URL('/login', base).href);
  await page.evaluate(async ({ email, password }) => { const { loginWithApi } = await import('/src/services/http/authApi.ts'); await loginWithApi(email, password); }, { email, password: process.env.CONTIGO_QA_PASSWORD || 'Contigo2026!' });
  await page.goto(new URL(route, base).href);
  await page.getByRole('heading', { level: 1 }).waitFor();
  return { page, context };
}

/** A narrow historical cleanup mode: only alert IDs proven by this script's three owned reports. */
async function cleanupOwnedArchives() {
  const receipt = { complete: false, timestamp: new Date().toISOString(), base: base.origin,
    purpose: 'Reconocer exclusivamente los avisos sintéticos de las tres ejecuciones acreditadas de verify-live-sos. Conserva el historial y no borra datos.',
    sources: [], allowlist: [], actions: [], errors: [] };
  let token;
  const request = async (route, method = 'GET', body) => {
    const response = await fetch(new URL('/api/v1' + route, base), { method, signal: AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
    return { status: response.status, data };
  };
  try {
    const owned = new Map();
    for (const filename of ['audit.json', 'diagnostic-script-send-race.json', 'diagnostic-mobile-overflow.json']) {
      const raw = await fs.readFile(path.join(output, filename), 'utf8');
      const prior = JSON.parse(raw);
      assert(prior.base === base.origin && prior.mode?.includes('micrófonos sintéticos de Chrome'), 'Proveniencia inesperada en ' + filename);
      receipt.sources.push({ filename, sha256: crypto.createHash('sha256').update(raw).digest('hex') });
      for (const session of prior.sessions ?? []) {
        assert(/^[a-f\d-]{36}$/.test(session.id) && /^[a-f\d-]{36}$/.test(session.alertId) && ['pat_001', 'pat_002'].includes(session.patientId), 'Identificador inesperado en el informe propio.');
        owned.set(session.id, { ...session, source: filename });
      }
    }
    receipt.allowlist = [...owned.values()];
    const login = await request('/auth/login', 'POST', { email: 'cuidador@contigo.example', password: process.env.CONTIGO_QA_PASSWORD || 'Contigo2026!' });
    assert(login.status === 200 && login.data.user?.role === 'ROLE_CAREGIVER', 'No se pudo autenticar la cuenta de limpieza autorizada.');
    token = login.data.token;
    for (const session of owned.values()) {
      const room = await request(`/patients/${session.patientId}/support-sessions/${session.id}`);
      assert(room.status === 200 && room.data.id === session.id && room.data.alertId === session.alertId && room.data.status === 'ENDED', 'El servidor no acredita una sesión propia finalizada: ' + session.id);
      const before = await request(`/patients/${session.patientId}/alerts`);
      const alert = before.data.find(alert => alert.id === session.alertId);
      assert(before.status === 200 && alert?.patientId === session.patientId && alert.type === 'PANIC_BUTTON', 'El aviso no corresponde a la solicitud propia.');
      const ack = await request(`/patients/${session.patientId}/alerts/${session.alertId}/acknowledgements`, 'POST');
      assert(ack.status === 200 && ack.data.id === session.alertId && ack.data.isResolved === true, 'No se reconoció el aviso de ensayo: ' + session.alertId);
      receipt.actions.push({ sessionId: session.id, patientId: session.patientId, alertId: session.alertId, source: session.source, previouslyResolved: alert.isResolved, httpStatus: ack.status, notificationStatus: ack.data.notificationStatus, isResolved: ack.data.isResolved, acknowledgedAt: ack.data.acknowledgedAt });
    }
    receipt.complete = true;
  } catch (error) { receipt.errors.push(error.message); process.exitCode = 1; }
  finally {
    if (token) await request('/auth/logout', 'POST').catch(error => receipt.errors.push('No se confirmó logout: ' + error.message));
    await fs.writeFile(path.join(output, 'owned-alert-cleanup.json'), JSON.stringify(receipt, null, 2));
    console.log(JSON.stringify(receipt, null, 2));
  }
}

if (process.argv.includes('--cleanup-owned')) {
  await cleanupOwnedArchives();
  process.exit(process.exitCode ?? 0);
}

try {
  report.sourceHashes = await sourceHashes();
  const health = await (await fetch(new URL('/api/v1/health', base))).json();
  assert(health.status === 'UP' && health.storage === 'postgresql', 'La API central/PostgreSQL no está disponible.');
  report.health = health;
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
  report.browser = browser.version();
  patient = await newActor('dacio@contigo.example', '/patient-app', { width: 390, height: 1000 });
  caregiver = await newActor('cuidador@contigo.example', '/dashboard');
  const page = patient.page;
  await page.getByTestId('patient-sos').waitFor();
  await picture(page, '00-boton-sos.png');
  await page.setViewportSize({ width: 1280, height: 1000 });
  await picture(page, '00-boton-sos-contexto.png');
  await page.setViewportSize({ width: 390, height: 1000 });
  const picker = caregiver.page.getByTestId('select-patient-active');
  if (await picker.locator('option[value="pat_002"]').count()) await picker.selectOption('pat_002');
  report.dashboardSelectedPatientAtStart = await picker.inputValue();
  const initial = await api(page, '/patients/pat_001/support-sessions');
  assert(initial.status === 200 && Array.isArray(initial.data), 'Falta el endpoint de sesiones de apoyo.');
  assert(!initial.data.some(session => session.status !== 'ENDED'), 'Ya existe una solicitud activa de otro trabajo: no se modifica.');

  const responsePromise = page.waitForResponse(response => /\/patients\/pat_001\/support-sessions$/.test(new URL(response.url()).pathname) && response.request().method() === 'POST');
  await tabTo(page, page.getByTestId('patient-sos'));
  const clickedAt = performance.now();
  await page.keyboard.press('Enter');
  const response = await responsePromise;
  const session = await response.json();
  assert(response.ok() && session.status === 'WAITING' && session.id, 'El primer click no creó una solicitud pendiente.');
  created.push({ id: session.id, patientId: session.patientId, alertId: session.alertId });
  report.sessions.push({ id: session.id, alertId: session.alertId, patientId: session.patientId, createdAt: session.createdAt });
  const request = caregiver.page.locator(`[data-testid="support-request"][data-session-id="${session.id}"]`);
  await request.waitFor({ timeout: 12000 });
  const latencyMs = Math.round(performance.now() - clickedAt);
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  assert((await snapshot(page)).microphoneCalls === 0, 'Se pidió micrófono sin decisión explícita.');
  report.checks.push({ name: 'Primer click crea alerta y solicitud WAITING visible en otra sesión del dashboard', passed: true, latencyMs, dashboardSelectedPatient: report.dashboardSelectedPatientAtStart, requestedPatient: session.patientId, screenshots: [await picture(page, '01-solicitud-espera.png'), await picture(caregiver.page, '02-alerta-dashboard.png')] });

  const sessionRoute = `/patients/${session.patientId}/support-sessions/${session.id}`;
  const ownView = await api(page, sessionRoute + '/events?after=0');
  assert(ownView.status === 200 && ownView.data.session.status === 'WAITING', 'No se mantiene el estado pendiente.');
  const forbidden = await api(page, `/patients/pat_002/support-sessions/${session.id}/events?after=0`);
  assert([403, 404].includes(forbidden.status), 'La sesión expone información de otro paciente.');
  const patientText = `QA SOS ${session.id.slice(0, 8)}: prefiero comunicarme por escrito.`;
  await page.getByTestId('support-message-input').fill(patientText);
  await page.getByTestId('support-send-message').click();
  await page.getByTestId('support-messages').getByText(patientText, { exact: true }).waitFor();
  const queued = await api(page, sessionRoute + '/events?after=0');
  assert(queued.data.events.some(event => event.kind === 'TEXT' && event.payload === patientText), 'El mensaje escrito durante la espera no se guarda.');
  assert(await page.getByTestId('support-enable-mic').count() === 0, 'Se permite micrófono antes de atender.');

  await tabTo(caregiver.page, request.getByTestId('support-accept'));
  await caregiver.page.keyboard.press('Enter');
  await page.getByTestId('support-conversation').waitFor();
  await caregiver.page.getByTestId('support-conversation').waitFor();
  await page.waitForFunction(async route => { const { fetchAuthenticated } = await import('/src/services/http/apiTransport.ts'); const r = await fetchAuthenticated(route); return r.ok && (await r.json()).session.status === 'ACCEPTED'; }, sessionRoute + '/events?after=0', { polling: 500, timeout: 15000 });
  assert((await snapshot(caregiver.page)).microphoneCalls === 0, 'Atender activó el micrófono sin permiso explícito.');

  await caregiver.page.getByTestId('support-conversation').getByText(patientText, { exact: true }).waitFor({ timeout: 10000 });
  const caregiverText = `QA respuesta ${session.id.slice(0, 8)}: he recibido su mensaje.`;
  await caregiver.page.getByTestId('support-message-input').fill(caregiverText);
  await caregiver.page.getByTestId('support-send-message').click();
  await page.getByTestId('support-conversation').getByText(caregiverText, { exact: true }).waitFor({ timeout: 10000 });
  report.checks.push({ name: 'Una persona acepta explícitamente; texto real viaja en ambas direcciones sin micrófono', passed: true, screenshot: await picture(page, '03-conversacion-texto.png') });

  const retryText = `QA reintento ${session.id.slice(0, 8)}: mensaje conservado.`;
  let abortedText = false;
  const injectOffline = route => {
    const request = route.request();
    if (!abortedText && request.method() === 'POST' && request.postDataJSON()?.kind === 'TEXT') { abortedText = true; return route.abort('internetdisconnected'); }
    return route.continue();
  };
  await page.route('**/support-sessions/*/events', injectOffline);
  await page.getByTestId('support-message-input').fill(retryText);
  await page.getByTestId('support-send-message').click();
  await page.getByRole('alert').filter({ hasText: 'Tu texto se conserva' }).waitFor();
  assert(await page.getByTestId('support-message-input').inputValue() === retryText, 'El error de envío perdió el texto.');
  await page.unroute('**/support-sessions/*/events', injectOffline);
  await page.getByTestId('support-send-message').click();
  await caregiver.page.getByTestId('support-conversation').getByText(retryText, { exact: true }).waitFor();
  const retried = await api(page, sessionRoute + '/events?after=0');
  assert(retried.data.events.filter(event => event.kind === 'TEXT' && event.payload === retryText).length === 1, 'El reintento duplicó el mensaje.');
  report.checks.push({ name: 'Fallo de red al enviar conserva el texto y el reintento entrega un único mensaje', passed: true });

  await page.evaluate(() => {
    window.__sosQa.allowedGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Permiso denegado por la prueba sintética.', 'NotAllowedError'); };
  });
  await page.getByTestId('support-enable-mic').click();
  await page.getByTestId('support-conversation').getByText('No se permitió usar el micrófono. Puedes comunicarte por escrito.', { exact: true }).waitFor();
  assert((await snapshot(page)).tracks.every(track => track.readyState === 'ended'), 'El fallo de permiso dejó un micrófono activo.');
  assert(await page.getByTestId('support-message-input').isEnabled(), 'Denegar micrófono bloquea la alternativa escrita.');
  report.checks.push({ name: 'Permiso de micrófono denegado conserva la alternativa escrita y no abre pistas', passed: true, screenshot: await picture(page, '04-permiso-denegado.png') });
  await page.evaluate(() => { navigator.mediaDevices.getUserMedia = window.__sosQa.allowedGetUserMedia; });
  await page.getByTestId('support-enable-mic').click();
  await caregiver.page.getByTestId('support-enable-mic').click();
  const audio = await Promise.all([waitAudio(page), waitAudio(caregiver.page)]);
  report.checks.push({ name: 'WebRTC conectado con paquetes de audio entrantes en ambos extremos', passed: true, patient: audio[0], responder: audio[1], screenshots: [await picture(page, '04-audio-paciente.png'), await picture(caregiver.page, '05-audio-dashboard.png')] });
  const dashboardAxe = await auditAccessibility(caregiver.page, 'dialog[open]');
  assert(dashboardAxe.violations.length === 0, 'Axe detectó barreras en el diálogo del dashboard: ' + JSON.stringify(dashboardAxe.violations));
  report.checks.push({ name: 'Revisión automática de accesibilidad del diálogo de atención', passed: true, axe: dashboardAxe });

  await page.getByTestId('support-mute-mic').click();
  const muted = await snapshot(page);
  assert(muted.tracks.filter(track => track.readyState === 'live').every(track => !track.enabled), 'Silenciar no desactiva las pistas de audio.');
  await page.getByTestId('support-mute-mic').click();
  const unmuted = await snapshot(page);
  assert(unmuted.tracks.some(track => track.readyState === 'live' && track.enabled), 'Volver a hablar no reactiva el audio.');
  await page.getByTestId('support-stop-audio').click();
  const localStopped = await snapshot(page);
  assert(localStopped.tracks.every(track => track.readyState === 'ended'), 'Apagar audio no libera las pistas locales.');
  const remoteStopped = await waitTracksStopped(caregiver.page);
  const afterAudioText = `QA sin audio ${session.id.slice(0, 8)}: seguimos por escrito.`;
  await page.getByTestId('support-message-input').fill(afterAudioText);
  await page.getByTestId('support-send-message').click();
  await caregiver.page.getByTestId('support-messages').getByText(afterAudioText, { exact: true }).waitFor();
  await page.getByTestId('support-enable-mic').click();
  await caregiver.page.getByTestId('support-enable-mic').click();
  const reconnected = await Promise.all([waitAudio(page), waitAudio(caregiver.page)]);
  report.checks.push({ name: 'Silenciar, apagar audio, protección de micrófono remoto y reconexión conservan el chat', passed: true, muted, localStopped, remoteStopped, reconnected });

  await page.setViewportSize({ width: 320, height: 900 });
  await setScale(page, '200');
  const bounds = await overflow(page, 'dialog[open]');
  assert(!bounds.outside && bounds.wide.length === 0, 'El diálogo se sale del teléfono o tiene desbordamiento horizontal: ' + JSON.stringify(bounds));
  const focus = await dialog.evaluate(element => { const first = element.querySelector('button:not([disabled]), textarea:not([disabled])'); first?.focus(); return element.contains(document.activeElement); });
  assert(focus, 'No se puede enfocar un control del diálogo.');
  for (let i = 0; i < 24; i++) { await page.keyboard.press('Tab'); assert(await dialog.evaluate(element => element.contains(document.activeElement)), 'El foco sale del diálogo.'); }
  const mobileAxe = await auditAccessibility(page, 'dialog[open]');
  assert(mobileAxe.violations.length === 0, 'Axe detectó barreras en el diálogo móvil: ' + JSON.stringify(mobileAxe.violations));
  report.checks.push({ name: 'Diálogo móvil320px con texto200%, sin desbordamiento y con foco contenido', passed: true, bounds, axe: mobileAxe, screenshot: await picture(page, '06-movil-320-texto-200.png') });

  await page.getByTestId('support-end').click();
  await page.waitForFunction(async route => { const { fetchAuthenticated } = await import('/src/services/http/apiTransport.ts'); const r = await fetchAuthenticated(route); return r.ok && (await r.json()).session.status === 'ENDED'; }, sessionRoute + '/events?after=0', { polling: 500, timeout: 15000 });
  await caregiver.page.waitForTimeout(2000);
  const stopped = await Promise.all([snapshot(page), snapshot(caregiver.page)]);
  assert(stopped.every(side => side.tracks.every(track => track.readyState === 'ended')), 'Al finalizar quedan pistas de micrófono activas.');
  report.checks.push({ name: 'Finalizar detiene los micrófonos de ambos participantes', passed: true, patient: stopped[0], responder: stopped[1] });

  const beforeFinal = report.sourceHashes;
  const afterFinal = await sourceHashes();
  report.sourceHashesAtEnd = afterFinal;
  report.changedSourcesDuringRun = Object.keys(beforeFinal).filter(file => beforeFinal[file] !== afterFinal[file]);
  assert(report.changedSourcesDuringRun.length === 0, 'Se modificó código durante la comprobación. Repetir con fuentes estables.');
  assert(report.consoleErrors.length === 0, 'La aplicación emitió errores JavaScript.');
  report.complete = true;
} catch (error) {
  report.errors.push({ message: error.message, stack: error.stack });
  if (patient) await picture(patient.page, 'failure-patient.png').catch(() => undefined);
  if (caregiver) await picture(caregiver.page, 'failure-dashboard.png').catch(() => undefined);
  process.exitCode = 1;
} finally {
  report.cleanup = [];
  for (const session of created) {
    const receipt = { sessionId: session.id, patientId: session.patientId, alertId: session.alertId };
    try {
      const result = await api(patient.page, `/patients/${session.patientId}/support-sessions/${session.id}/end`, 'POST');
      receipt.endHttpStatus = result.status;
    } catch (error) { receipt.endError = error.message; }
    try {
      if (!caregiver || !session.alertId) throw Error('No está disponible la cuenta autorizada o el identificador propio del aviso.');
      const result = await api(caregiver.page, `/patients/${session.patientId}/alerts/${session.alertId}/acknowledgements`, 'POST');
      receipt.acknowledgementHttpStatus = result.status; receipt.isResolved = result.data.isResolved;
      assert(result.status === 200 && result.data.id === session.alertId && result.data.isResolved === true, 'El aviso propio no se pudo reconocer.');
    } catch (error) { receipt.acknowledgementError = error.message; }
    report.cleanup.push(receipt);
  }
  if (report.cleanup.some(receipt => receipt.endHttpStatus !== 200 || receipt.acknowledgementHttpStatus !== 200 || receipt.acknowledgementError)) {
    report.complete = false; process.exitCode = 1;
  }
  for (const actor of [patient, caregiver]) if (actor) {
    await actor.page.evaluate(async () => { const { logoutApi } = await import('/src/services/http/authApi.ts'); await logoutApi(); }).catch(() => undefined);
    await actor.context.close();
  }
  await browser?.close();
  await fs.writeFile(path.join(output, 'audit.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ complete: report.complete, checks: report.checks.map(check => check.name), errors: report.errors.map(error => error.message), sessions: report.sessions, cleanup: report.cleanup }, null, 2));
}
