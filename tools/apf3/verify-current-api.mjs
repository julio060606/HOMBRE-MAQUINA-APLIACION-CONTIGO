import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '../..');
const base = new URL(process.argv[2] || 'http://127.0.0.1:3001');
if (base.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(base.hostname)) throw new Error('Esta comprobación solo admite el proyecto local.');
const output = path.join(root, 'output/apf3/evidence/current-2026-11-03/api-database.json');
const report = {
  timestamp: new Date().toISOString(), baseUrl: base.origin, mode: 'API central y PostgreSQL; sin mocks',
  method: 'Salud de API, autenticación sintética por rol, lecturas autorizadas y aislamiento de pacientes.',
  limitations: ['No modifica tomas, mediciones, recetas, inventario ni citas.', 'No acredita una sesión de usabilidad ni el despliegue público.', 'Inicia y cierra únicamente sus propias sesiones de prueba.'],
  checks: [], source: [], complete: false,
};
await fs.mkdir(path.dirname(output), { recursive: true });
const assert = (ok, message) => { if (!ok) throw new Error(message); };
async function request(url, token, options = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(10000), headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
}
try {
  for (const file of ['frontend/src/config/env.ts', 'frontend/src/services/http/httpService.ts', 'backend/src/main/java/com/sanpablo/contigo/controller/HealthController.java']) {
    report.source.push({ file, sha256: crypto.createHash('sha256').update(await fs.readFile(path.join(root, file))).digest('hex') });
  }
  const healthResponse = await request(new URL('/api/v1/health', base));
  const health = await healthResponse.json();
  assert(healthResponse.ok && health.status === 'UP' && health.storage === 'postgresql', 'La API no acredita PostgreSQL disponible.');
  report.health = { httpStatus: healthResponse.status, ...health };
  for (const actor of [{ email: 'dacio@contigo.example', role: 'ROLE_PATIENT' }, { email: 'cuidador@contigo.example', role: 'ROLE_CAREGIVER' }]) {
    let token;
    try {
      const login = await request(new URL('/api/v1/auth/login', base), null, { method: 'POST', body: JSON.stringify({ email: actor.email, password: process.env.CONTIGO_QA_PASSWORD || 'Contigo2026!' }) });
      assert(login.ok, `No se pudo autenticar el rol ${actor.role}: HTTP ${login.status}.`);
      const session = await login.json();
      assert(typeof session.token === 'string' && session.user?.role === actor.role, 'El servidor devolvió un rol inesperado.');
      token = session.token;
      const patientsResponse = await request(new URL('/api/v1/patients', base), token);
      const patients = await patientsResponse.json();
      assert(patientsResponse.ok && Array.isArray(patients) && patients.some(p => p.id === 'pat_001'), 'La lista autorizada no contiene el caso sintético esperado.');
      const dashboardResponse = await request(new URL('/api/v1/patients/pat_001/dashboard', base), token);
      const dashboard = await dashboardResponse.json();
      assert(dashboardResponse.ok && dashboard.patient?.id === 'pat_001' && Array.isArray(dashboard.medications) && Array.isArray(dashboard.supplies) && Array.isArray(dashboard.appointments), 'El seguimiento no devolvió su estructura esperada.');
      const syncResponse = await request(new URL('/api/v1/patients/pat_001/clinical-sync', base), token);
      const sync = await syncResponse.json();
      const check = {
        role: actor.role, loginHttpStatus: login.status, allowedPatientCount: patients.length,
        dashboardHttpStatus: dashboardResponse.status, medications: dashboard.medications.length,
        supplies: dashboard.supplies.length, appointments: dashboard.appointments.length,
        homePressures: dashboard.pressures.filter(p => p.source === 'HOME').length,
        clinicalPressures: dashboard.pressures.filter(p => p.source === 'CLINIC').length,
        clinicalSync: { httpStatus: syncResponse.status, status: sync.status },
      };
      if (actor.role === 'ROLE_PATIENT') {
        assert(patients.every(p => p.id === 'pat_001'), 'La cuenta paciente recibió otros pacientes.');
        const denied = await request(new URL('/api/v1/patients/pat_002/dashboard', base), token);
        assert(denied.status === 403 || denied.status === 404, 'El caso paciente no está aislado.');
        check.otherPatientAccessHttpStatus = denied.status;
      }
      report.checks.push(check);
    } finally {
      if (token) {
        const logout = await request(new URL('/api/v1/auth/logout', base), token, { method: 'POST' });
        assert(logout.ok, `No se pudo cerrar la sesión de prueba ${actor.role}.`);
      }
    }
  }
  report.complete = true;
} catch (error) { report.error = error.message; process.exitCode = 1; }
finally {
  await fs.writeFile(output, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ complete: report.complete, health: report.health, checks: report.checks, error: report.error }, null, 2));
}
