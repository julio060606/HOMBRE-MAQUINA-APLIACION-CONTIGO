import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const root = path.resolve(import.meta.dirname, '../..');
const output = path.join(root, 'output/public-navigation-2026-11-03');
const base = 'http://127.0.0.1:3001';
await fs.mkdir(output, { recursive:true });
const require = createRequire(import.meta.url);
const axe = await fs.readFile(require.resolve('axe-core/axe.min.js'), 'utf8');
const files = ['frontend/src/App.tsx','frontend/src/components/layout/RouteAccessibility.tsx','frontend/src/components/layout/PublicHeader.tsx','frontend/src/components/layout/PublicHeader.module.css','frontend/src/features/auth/LoginPage.tsx','frontend/src/features/auth/LoginPage.module.css','frontend/src/features/landing/ContigoLandingPage.tsx','frontend/src/features/landing/ContigoLandingPage.css','frontend/src/features/landing/ClinicPortalPage.tsx','frontend/src/features/landing/ClinicPortalPage.module.css'];
async function hashes() { return Object.fromEntries(await Promise.all(files.map(async file => [file,crypto.createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex')]))); }
const report = { complete:false, timestamp:new Date().toISOString(), mode:'API central, contextos Chrome independientes; solo autenticación y lecturas, sin escrituras clínicas.', checks:[], layouts:[], errors:[], unexpectedWrites:[], sourceHashes:await hashes() };
const assert = (value,message) => { if (!value) throw Error(message); };
const browser = await chromium.launch({channel:'chrome',headless:true});
const context = await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce',locale:'es-PE'});
await context.route('**/api/**',route => {
  const req = route.request();
  if (req.method() !== 'GET' && !/\/auth\/(login|logout|refresh)$/.test(new URL(req.url()).pathname)) { report.unexpectedWrites.push({method:req.method(),url:req.url()}); return route.abort(); }
  return route.continue();
});
const page = await context.newPage();
page.on('pageerror',error => report.errors.push(error.message));
async function ready(route) { await page.locator(`main[data-page-path="${route}"] h1`).waitFor(); await page.waitForFunction(route => document.activeElement?.closest('main')?.dataset.pagePath === route,route); }
async function focusIs(selector) { await page.waitForFunction(selector => document.activeElement === document.querySelector(selector),selector); }
async function screenshot(name) { await page.screenshot({path:path.join(output,name),fullPage:true}); return name; }
async function prefs(scale,contrast=false,largeTargets=false) { await page.evaluate(async value => { const {setReadingPreferences,DEFAULT_READING_PREFERENCES}=await import('/src/services/accessibilityPreferences.ts'); setReadingPreferences({...DEFAULT_READING_PREFERENCES,...value}); },{scale:String(scale),contrast,largeTargets}); await page.waitForTimeout(80); }
try {
  await page.goto(base+'/landing'); await ready('/landing'); await focusIs('#contigo-hero-title');
  await page.getByTestId('btn-hero-access-web').click(); await ready('/login'); await focusIs('#login-title');
  assert((await page.title()).startsWith('Iniciar sesión'),'El título no corresponde al login.');
  assert(await page.getByRole('button',{name:'Entrar',exact:true}).count()===1,'Debe existir una sola acción de ingreso.');
  assert(await page.locator('main button').filter({hasText:'Entrada Rápida'}).count()===0,'Persiste el acceso duplicado.');
  assert(!(await page.locator('main').innerText()).includes('Sesión con datos centrales'),'Texto técnico innecesario.');
  await page.getByRole('link',{name:'Volver al inicio',exact:true}).click(); await ready('/landing'); await focusIs('#contigo-hero-title');
  report.checks.push({name:'Landing → login → inicio con título/foco correctos y una acción principal',passed:true});

  const patientEntry = page.getByRole('link',{name:'Entrar como paciente',exact:true});
  await patientEntry.scrollIntoViewIfNeeded(); await page.waitForTimeout(120); const before = await page.evaluate(()=>window.scrollY);
  await patientEntry.click(); await ready('/login');
  assert(await page.locator('#email-input').inputValue()==='dacio@contigo.example','La entrada del paciente no prepara su cuenta.');
  await page.goBack(); await ready('/landing'); await page.waitForTimeout(150);
  const restored = await page.evaluate(()=>window.scrollY);
  assert(Math.abs(restored-before)<5,`Atrás no restaura la posición ${before} → ${restored}.`);
  report.checks.push({name:'Acceso de paciente preselecciona cuenta y Atrás recupera la posición',passed:true,position:{before,restored}});

  await page.goto(base+'/login'); await ready('/login');
  const navigation = page.getByRole('navigation',{name:'Navegación principal',exact:true});
  await navigation.getByRole('link',{name:'Cómo funciona',exact:true}).click();
  await page.waitForURL('**/landing#como-funciona'); await focusIs('#contigo-how-title');
  assert(await page.locator('#contigo-how-title').evaluate(element=>element.getBoundingClientRect().top>=0 && element.getBoundingClientRect().top<innerHeight),'Sección no visible al navegar desde login.');
  await page.getByRole('navigation',{name:'Navegación principal',exact:true}).getByRole('link',{name:'Cómo funciona',exact:true}).click(); await focusIs('#contigo-how-title');
  report.checks.push({name:'Enlaces a secciones entre páginas y al repetir ancla mantienen el foco en destino',passed:true});

  await page.setViewportSize({width:320,height:900}); await page.goto(base+'/landing'); await ready('/landing');
  const menu = page.getByTestId('public-header').getByRole('button',{name:'Menú',exact:true});
  await menu.focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Tab');
  assert(await page.getByRole('link',{name:'Inicio',exact:true}).first().evaluate(e=>e===document.activeElement),'El menú no se recorre por teclado.');
  await page.keyboard.press('Escape'); assert(await menu.getAttribute('aria-expanded')==='false','Escape no cierra el menú.'); assert(await menu.evaluate(e=>e===document.activeElement),'Escape no devuelve el foco.');
  await menu.click(); await page.getByRole('navigation',{name:'Navegación principal',exact:true}).getByRole('link',{name:'Iniciar sesión',exact:true}).click(); await ready('/login');
  assert(await menu.getAttribute('aria-expanded')==='false','El menú permanece abierto al cambiar de página.');
  report.checks.push({name:'Menú móvil: teclado, Escape, retorno de foco y cierre al navegar',passed:true});

  for (const width of [320,1280]) for (const scale of [100,125,150,200]) for (const route of ['/login','/landing','/clinic']) {
    await page.setViewportSize({width,height:900}); await page.goto(base+route); await ready(route); await prefs(scale);
    const dimensions = await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,
      overflows:[...document.querySelectorAll('main *,header *')].filter(e=>getComputedStyle(e).display!=='none' && e.getBoundingClientRect().width>0 && (e.getBoundingClientRect().right>innerWidth+1 || e.getBoundingClientRect().left < -1)).slice(0,12).map(e=>({tag:e.tagName,class:e.className,text:e.textContent?.trim().slice(0,80),left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}))}));
    await page.addScriptTag({content:axe});
    const accessibility = await page.evaluate(async()=>{const result=await window.axe.run({runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return{violations:result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:result.incomplete.map(v=>({id:v.id,nodes:v.nodes.length}))};});
    const filename=`${route.slice(1)}-${width}-${scale}.png`;
    const entry={route,width,scale,...dimensions,...accessibility,screenshot:await screenshot(filename)};
    report.layouts.push(entry);
    assert(dimensions.scroll<=dimensions.client+1,`Desborde horizontal ${route} ${width} ${scale}: ${JSON.stringify(dimensions)}`);
    assert(!accessibility.violations.length,`Axe ${route} ${width} ${scale}: ${JSON.stringify(accessibility.violations)}`);
  }
  for (const route of ['/login','/landing']) {
    await page.setViewportSize({width:320,height:900}); await page.goto(base+route); await ready(route); await prefs(200,true,true);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Contraste y controles grandes desbordan ${route}`);
    report.layouts.push({route,width:320,scale:200,contrast:true,largeTargets:true,screenshot:await screenshot(`${route.slice(1)}-320-200-high.png`)});
  }
  report.checks.push({name:'24 combinaciones de pantalla y letra +2 de alto contraste y controles grandes',passed:true});

  await prefs(100); await page.setViewportSize({width:1280,height:900}); await page.goto(base+'/login'); await ready('/login');
  await page.getByText('Cambiar cuenta de prueba',{exact:true}).click(); await page.getByTestId('login-patient_dacio').click();
  assert(await page.locator('#email-input').inputValue()==='dacio@contigo.example','Cambiar cuenta no prepara el correo.');
  assert(await page.locator('#email-input').evaluate(e=>e===document.activeElement),'Cambiar cuenta no retorna al campo.');
  await page.getByRole('button',{name:'Ver contraseña',exact:true}).click(); assert(await page.locator('#password-input').getAttribute('type')==='text','Mostrar contraseña no funciona.');
  await page.getByRole('button',{name:'Ocultar contraseña',exact:true}).click();
  await page.locator('#password-input').fill('Incorrecta-de-prueba');
  await page.getByRole('button',{name:'Entrar',exact:true}).click(); await page.getByRole('alert').waitFor(); await focusIs('[role="alert"]');
  assert(await page.locator('#email-input').inputValue()==='dacio@contigo.example','El fallo borra el correo.');
  await page.locator('#password-input').fill('Contigo2026!');
  let loginRequests=0;
  await page.route('**/auth/login',async route=>{loginRequests++;await new Promise(resolve=>setTimeout(resolve,200));await route.continue();});
  await page.getByRole('button',{name:'Entrar',exact:true}).focus(); await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
  await page.waitForURL('**/patient-app'); await page.getByRole('heading',{name:'Hola, Dacio',exact:true}).waitFor();
  assert(loginRequests===1,`Solicitud duplicada de login: ${loginRequests}`);
  report.checks.push({name:'Cambio de cuenta, mostrar clave, error con foco y reintento real único hacia paciente',passed:true});

  await page.goto(base+'/landing'); await ready('/landing'); assert(await page.getByTestId('btn-hero-access-web').innerText()==='Volver a mi aplicación','El landing no reconoce la sesión paciente.');
  await page.goto(base+'/login'); await ready('/login'); await page.getByRole('link',{name:'Volver a mi aplicación',exact:true}).waitFor();
  assert(await page.locator('form').count()===0,'La sesión abierta vuelve a pedir credenciales.');
  await page.getByRole('button',{name:'Cerrar sesión y usar otra cuenta',exact:true}).click(); await page.locator('#email-input').waitFor();
  await page.getByText('Cambiar cuenta de prueba',{exact:true}).click(); await page.getByTestId('login-caregiver_demo').click();
  await page.getByRole('button',{name:'Entrar',exact:true}).click(); await page.waitForURL('**/dashboard'); await page.getByRole('heading',{name:'Resumen del día',exact:true}).waitFor();
  report.checks.push({name:'Sesión existente ofrece continuar; cambio explícito de cuenta y acceso a dashboard',passed:true});
  await page.goto(base+'/login'); await ready('/login');
  await page.getByRole('button',{name:'Cerrar sesión y usar otra cuenta',exact:true}).click(); await page.locator('#email-input').waitFor();
  await page.route('**/auth/login',async route=>{await new Promise(resolve=>setTimeout(resolve,700));await route.fallback();});
  const pendingResponse=page.waitForResponse(response=>response.url().endsWith('/auth/login') && response.request().method()==='POST');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await page.getByRole('link',{name:'Volver al inicio',exact:true}).click(); await ready('/landing'); await pendingResponse;
  await page.getByRole('navigation',{name:'Navegación principal',exact:true}).getByRole('link',{name:'Mi panel',exact:true}).waitFor();
  assert(new URL(page.url()).pathname==='/landing','Una respuesta tardía del login impone una navegación después de salir.');
  report.checks.push({name:'Salir del login mientras responde conserva la página elegida, sin redirección tardía',passed:true});
  assert(!report.unexpectedWrites.length,'Se intentaron escrituras clínicas.');
  report.sourceHashesAfter=await hashes(); report.changedSources=files.filter(file=>report.sourceHashes[file]!==report.sourceHashesAfter[file]);
  assert(!report.changedSources.length,'Las fuentes cambiaron durante la verificación.');
  report.complete=true;
} catch(error) {report.errors.push({message:error.message,stack:error.stack}); await screenshot('failure.png').catch(()=>{});process.exitCode=1;}
finally { await browser.close(); await fs.writeFile(path.join(output,'audit.json'),JSON.stringify(report,null,2)); }
console.log(JSON.stringify({complete:report.complete,checks:report.checks.length,layouts:report.layouts.length,errors:report.errors,unexpectedWrites:report.unexpectedWrites}));
