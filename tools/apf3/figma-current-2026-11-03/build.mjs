import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, '../../..');
const out = path.join(root, 'output/apf3/figma-current-2026-11-03');
const api = path.join(root, 'output/apf3/evidence/current-2026-11-03/api-audit');
const audit = JSON.parse(fs.readFileSync(path.join(api, 'audit.json'), 'utf8').replace(/^\uFEFF/, ''));
if (audit.complete !== true || audit.screens?.length !== 15) throw Error('Current audit must complete 15 guarded captures before embedding');
const expectedPaths = {
  '01-patient-home':'/patient-app','02-sos-review':'/patient-app','03-measurement-input':'/patient-app','04-measurement-error':'/patient-app','05-measurement-review':'/patient-app','06-weight-input':'/patient-app','07-weight-review':'/patient-app',
  '08-caregiver-summary':'/dashboard','09-treatment-supplies':'/medications','10-appointments':'/appointments','11-vitals':'/vitals','12-profile':'/clinical-profile','13-preferences':'/settings','14-login':'/login','15-accessibility':'/accessibility',
};
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function asset(id, name, file, group, url) {
  const bytes = fs.readFileSync(path.join(root, file));
  if (bytes.readUInt32BE(0) !== 0x89504e47) throw Error('Not a PNG: ' + file);
  return { id, name, file, group, url, base64: bytes.toString('base64'), width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), sha256: hash(bytes) };
}
const assets = audit.screens.map(screen => {
  const url = new URL(screen.url);
  if (url.pathname !== expectedPaths[screen.id]) throw Error('Capture scope/URL mismatch: ' + screen.id + ' at ' + url.pathname);
  return asset(screen.id, 'Captura actual API / ' + screen.id, 'output/apf3/evidence/current-2026-11-03/api-audit/' + screen.screenshot, 'current', screen.url);
});
for (const [id, file] of [['baseline-home','02-patient-home.png'],['baseline-treatment','03-patient-treatment.png'],['baseline-measurement','04-patient-measurement.png'],['baseline-caregiver','17-caregiver-dashboard.png'],['baseline-supplies','18-caregiver-medications.png']]) {
  const full = 'output/apf3/evidence/baseline/' + file;
  assets.push(asset(id, 'Captura histórica v2.0 / ' + id, full, 'before', 'Copia histórica local; consultar manifiesto de línea base'));
}
const sourceHashes = {};
for (const source of ['frontend/src/features/patient-app/PatientAppContent.tsx','frontend/src/features/patient-app/MeasurementForm.tsx','frontend/src/features/patient-app/MeasurementForm.module.css','frontend/src/features/patient-app/PatientHelp.tsx','frontend/src/styles/index.css']) sourceHashes[source] = hash(fs.readFileSync(path.join(root, source)));
const metadata = { generatedAt: new Date().toISOString(), sourceHashes, captureTimestamp: audit.metadata.timestamp, currentMode: audit.metadata.mode };
execFileSync(process.execPath, [path.join(root,'frontend/node_modules/typescript/bin/tsc'), '-p', path.join(here,'tsconfig.json')], { stdio: 'inherit' });
fs.mkdirSync(path.join(out,'sources'),{recursive:true});
const code = '// Current guarded real screenshots and native design generator. No network.\nconst CAPTURE_ASSETS = ' + JSON.stringify(assets) + ';\nconst PACKAGE_METADATA = ' + JSON.stringify(metadata) + ';\n' + fs.readFileSync(path.join(here,'compiled/plugin.js'),'utf8');
fs.writeFileSync(path.join(out,'code.js'),code,'utf8');
for (const file of ['manifest.json','plugin.ts','globals.d.ts','tsconfig.json','build.mjs','test-mock.mjs','README.md','LICENSE-FIGMA-TYPINGS.txt']) {
  const source = fs.readFileSync(path.join(here,file),'utf8');
  fs.writeFileSync(path.join(out,'sources',file),file==='tsconfig.json'?source.replace('../figma/plugin-api.reference.d.ts','plugin-api.reference.d.ts'):source,'utf8');
}
fs.copyFileSync(path.join(here,'manifest.json'),path.join(out,'manifest.json'));
fs.copyFileSync(path.join(here,'README.md'),path.join(out,'LEEME.md'));
fs.copyFileSync(path.join(root,'tools/apf3/figma/plugin-api.reference.d.ts'),path.join(out,'sources/plugin-api.reference.d.ts'));
const expectedScopeIds = ['patient-home','patient-recorded','patient-not-taken','patient-correction-taken','patient-correction-not-taken','measurement-input','measurement-error','measurement-review','measurement-saved','weight-input','weight-review','sos-review','sos-result','caregiver-summary','caregiver-treatment','caregiver-appointments','reading-options'];
fs.writeFileSync(path.join(out,'status.json'),JSON.stringify({
  status:'PAQUETE PREPARATORIO LOCAL; NO EJECUTADO NI PUBLICADO EN FIGMA', ...metadata,
  figmaConnected:false, nativeFigmaCreated:false, starkExecuted:false, expectedPages:6, expectedNativeScreens:85, expectedScopeIds,
  pageNames:['00 Leyenda y resumen','01 Antes (v2.0)','02 Después (v3.0 objetivo AA)','03 Kit accesible','04 Anotaciones de accesibilidad','05 Variante alto contraste y texto ampliado'],
  design:'Vista única actual paciente: medicamentos, medición de dos pasos y citas; sin navegación inferior retirada.',
  currentControlBorderToken:'#74887E', currentApiScreens:15, historicalBaselineScreens:5,
  captures:assets.map(({base64,...item})=>item), codeSha256:hash(Buffer.from(code)),
  sourceAttribution:'Código propio del proyecto adaptado; tipos Figma Plugin API proceden de figma/plugin-typings y se preservan como referencia.',
  pending:['Ejecutar plugin en Figma','Inspeccionar renderizado y conexiones reales','Medir y documentar Stark','Compartir con permiso de lectura y comprobar incógnito','Registrar enlace real','Validar con participantes y completar lectura T3 NVDA actual']
},null,2));
execFileSync(process.execPath,['--check',path.join(out,'code.js')],{stdio:'inherit'});
console.log(JSON.stringify({output:out,currentCaptures:15,historicalCaptures:5,expectedNativeScreens:85,codeBytes:Buffer.byteLength(code)},null,2));
