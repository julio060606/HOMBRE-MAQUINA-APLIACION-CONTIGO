import { chromium } from '../apf3/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const config = JSON.parse(readFileSync(path.join(root, '.runtime/local-config.json'), 'utf8').replace(/^\uFEFF/, ''));
const out = path.join(root, 'output/integration');
await fs.mkdir(out, { recursive: true });
const base = `http://127.0.0.1:${config.apiPort}/api/v1`;
const report = { at: new Date().toISOString(), checks: [], errors: [], screenshots: [] };
const sessions = [];
function check(condition, message) { if (!condition) throw new Error(message); report.checks.push(message); }
function sql(database, statement, reader = false) {
  const clinic = database === 'san_pablo_clinic';
  const user = reader ? config.readerUser : clinic ? config.clinicUser : config.contigoUser;
  const password = reader ? config.readerPassword : clinic ? config.clinicPassword : config.contigoPassword;
  // SQL goes through UTF-8 stdin: Windows psql's argv otherwise uses the system code page.
  return execFileSync(path.join(config.postgresBin, 'psql.exe'), ['-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-h', '127.0.0.1', '-p', String(config.postgresPort), '-U', user, '-d', database, '-f', '-'], { input: statement + '\n', env: { ...process.env, PGPASSWORD: password, PGCLIENTENCODING: 'UTF8' }, encoding: 'utf8', windowsHide: true }).trim();
}
async function api(endpoint, token, options = {}) {
  const response = await fetch(base + endpoint, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const text = await response.text();
  let body; try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: response.status, body };
}
async function login(email) {
  const result = await api('/auth/login', null, { method: 'POST', body: JSON.stringify({ email, password: 'Contigo2026!' }) });
  check(result.status === 200 && typeof result.body?.token === 'string', `API login ${email}`);
  sessions.push(result.body.token);
  return result.body.token;
}
async function view(token, patient = 'pat_001') {
  const result = await api(`/patients/${patient}/dashboard`, token);
  check(result.status === 200, `Dashboard API ${patient}`);
  return result.body;
}
async function uiLogin(page, origin, email, route) {
  await page.goto(origin + '/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill('Contigo2026!');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(`**/${route}`, { timeout: 30000 });
}

let browser;
let originalPrescription;
let sourceChanged = false;
let admin;
try {
  const health = await api('/health');
  check(health.status === 200 && health.body.storage === 'postgresql', 'API connected to PostgreSQL');
  const clinicRows = JSON.parse(sql('san_pablo_clinic', "SELECT json_agg(r) FROM (SELECT * FROM clinic.contigo_prescriptions WHERE external_patient_id='demo-pat_001' ORDER BY external_prescription_id) r", true));
  check(clinicRows.length === 2, 'Dacio has two prescribed medicines in the clinic database');
  check(sql('san_pablo_clinic', "SELECT has_table_privilege(current_user,'clinic.contigo_prescriptions','SELECT') AND NOT has_table_privilege(current_user,'clinic.prescription_items','SELECT') AND NOT has_table_privilege(current_user,'clinic.prescription_items','UPDATE')", true) === 't', 'Clinic connector can read integration views but cannot read or modify source tables');
  const caregiver = await login('cuidador@contigo.example');
  const patient = await login('dacio@contigo.example');
  const unlinked = await login('sinvinculo@contigo.example');
  admin = await login('admin@contigo.example');
  const initial = await view(caregiver);
  check(initial.patient.fullName === 'Dacio Ramos', 'Dashboard selects Dacio Ramos');
  for (const row of clinicRows) {
    const medication = initial.medications.find(m => m.externalPrescriptionId === row.external_prescription_id);
    check(medication?.name === row.name && medication.diagnosis === row.diagnosis && medication.doctor === row.doctor, `Clinic prescription, diagnosis and doctor imported: ${row.name}`);
  }
  const clinicAppointments = JSON.parse(sql('san_pablo_clinic', "SELECT json_agg(r) FROM (SELECT * FROM clinic.contigo_appointments WHERE external_patient_id='demo-pat_001' AND status='SCHEDULED') r", true));
  check(clinicAppointments.length >= 2 && clinicAppointments.every(a => initial.appointments.some(b => b.externalId === a.external_id)), 'Dacio scheduled appointments imported from clinic database');
  check((await api('/patients/pat_002/dashboard', patient)).status === 403, 'Dacio cannot read another patient');
  check((await api('/patients/pat_001/dashboard', unlinked)).status === 403, 'Unlinked caregiver cannot read Dacio');
  check((await api('/clinical-sync/pat_001', caregiver, { method: 'POST' })).status === 403, 'Caregiver cannot alter or trigger clinical imports');
  check((await api('/patients/pat_001/dashboard')).status === 401, 'Anonymous dashboard access rejected');

  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const caregiverContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', locale: 'es-PE' });
  const patientContext = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', locale: 'es-PE' });
  const caregiverPage = await caregiverContext.newPage();
  const patientPage = await patientContext.newPage();
  for (const page of [caregiverPage, patientPage]) page.on('pageerror', error => report.errors.push(error.message));
  await uiLogin(caregiverPage, `http://127.0.0.1:${config.frontendPort}`, 'cuidador@contigo.example', 'dashboard');
  await caregiverPage.getByTestId('select-patient-active').selectOption('pat_001');
  await caregiverPage.getByRole('heading', { level: 1, name: /Dacio Ramos/ }).waitFor();
  await uiLogin(patientPage, `http://localhost:${config.frontendPort}`, 'dacio@contigo.example', 'patient-app');
  await patientPage.getByRole('heading', { level: 1, name: /Hola, Dacio/ }).waitFor();
  check(await patientPage.getByRole('heading', { name: /citas/i }).count() > 0, 'Patient app shows scheduled appointments');
  check(await patientPage.getByText(clinicRows[0].doctor, { exact: false }).count() > 0, 'Patient app shows prescribing doctor');
  const firstDose = initial.today.find(d => ['PENDING', 'UNCONFIRMED'].includes(d.status) && Date.parse(d.scheduledAt) <= Date.now());
  if (firstDose) {
    await patientPage.getByTestId('dose-taken').first().click();
    await patientPage.getByRole('status').filter({ hasText: /registrad|tomad/i }).first().waitFor();
    const updated = await view(caregiver);
    check(updated.today.some(d => d.id === firstDose.id && d.status === 'TAKEN'), 'Patient intake persists in CONTIGO and is visible to caregiver');
  }
  const beforePressure = new Set(initial.pressures.map(p => p.id));
  await patientPage.getByTestId('input-systolic').fill('127');
  await patientPage.getByTestId('input-diastolic').fill('83');
  await patientPage.getByTestId('btn-save-vitals').click();
  await patientPage.getByTestId('btn-confirm-vitals').click();
  await patientPage.getByText('Medición guardada.', { exact: false }).first().waitFor();
  const updateStart = Date.now();
  await caregiverPage.getByText('127/83', { exact: true }).waitFor({ timeout: 10000 });
  report.liveUpdateMilliseconds = Date.now() - updateStart;
  check(true, 'Independent patient and caregiver browser contexts synchronize without reloading');
  const recorded = await view(caregiver);
  const pressure = recorded.pressures.find(p => !beforePressure.has(p.id) && p.systolic === 127 && p.diastolic === 83);
  check(pressure?.source === 'HOME' && pressure.pulse == null, 'Home reading persisted with optional pulse absent');
  check(sql('contigo_db', `SELECT count(*) FROM telemetry.blood_pressure_logs WHERE id='${pressure.id.replaceAll("'", "''")}' AND patient_id='pat_001'`) === '1', 'Measurement exists in CONTIGO PostgreSQL database');
  check((await view(patient, 'pat_001')).pressures.some(p => p.id === pressure.id), 'Fresh API read returns persisted measurement');
  await caregiverPage.screenshot({ path: path.join(out, 'caregiver-dashboard.png'), fullPage: true });
  await patientPage.screenshot({ path: path.join(out, 'patient-app.png'), fullPage: true });
  report.screenshots.push('caregiver-dashboard.png', 'patient-app.png');

  originalPrescription = clinicRows.find(r => r.external_prescription_id === 'rx-med_001');
  const tag = ' Verificación de sincronización del proyecto.';
  sql('san_pablo_clinic', `UPDATE clinic.prescription_items SET version=version+1, instructions=instructions || '${tag}' WHERE external_prescription_id='rx-med_001' AND organization_id='clinic_demo'`);
  sourceChanged = true;
  check((await api('/clinical-sync/pat_001', admin, { method: 'POST' })).status === 200, 'Clinic administrator synchronizes a source prescription update');
  const synced = await view(caregiver);
  check(synced.medications.find(m => m.externalPrescriptionId === 'rx-med_001')?.instructions.endsWith(tag), 'Source clinic change reaches CONTIGO database and dashboard API');
  check(sql('contigo_db', "SELECT count(*) FROM clinical.medications WHERE patient_id='pat_001' AND external_prescription_id='rx-med_001' AND instructions LIKE '%Verificación de sincronización del proyecto.%'") === '1', 'Source update persisted in separate CONTIGO database');
  await patientPage.reload();
  await patientPage.getByRole('heading', { level: 1, name: /Hola, Dacio/ }).waitFor();
  check(await patientPage.locator('input[type="email"]').count() === 0, 'API session survives a page reload');
  const isolated = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const disconnected = await isolated.newPage();
  await disconnected.route('**/api/v1/auth/login', route => route.abort('connectionfailed'));
  await disconnected.goto(`http://127.0.0.1:${config.frontendPort}/login`);
  await disconnected.locator('button[type="submit"]').click();
  await disconnected.getByRole('alert').filter({ hasText: /conectar|conexión/i }).waitFor();
  check(!disconnected.url().includes('/dashboard'), 'Network failure displays an error and never falls back to browser mock data');
  await isolated.close();
  check(report.errors.length === 0, 'Browser application has no uncaught JavaScript errors');
  report.status = 'PASS';
} catch (error) {
  report.status = 'FAIL'; report.failure = error.message; throw error;
} finally {
  try {
    if (sourceChanged && originalPrescription && admin) {
      const escaped = originalPrescription.instructions.replaceAll("'", "''");
      sql('san_pablo_clinic', `UPDATE clinic.prescription_items SET version=version+1,instructions='${escaped}' WHERE external_prescription_id='rx-med_001' AND organization_id='clinic_demo'`);
      await api('/clinical-sync/pat_001', admin, { method: 'POST' });
    }
  } catch (cleanupError) { report.cleanupFailure = cleanupError.message; report.status = 'FAIL'; }
  if (browser) await browser.close();
  for (const token of sessions) await api('/auth/logout', token, { method: 'POST' }).catch(() => {});
  await fs.writeFile(path.join(out, 'verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ status: report.status, checks: report.checks.length, errors: report.errors, failure: report.failure, liveUpdateMilliseconds: report.liveUpdateMilliseconds }));
}
