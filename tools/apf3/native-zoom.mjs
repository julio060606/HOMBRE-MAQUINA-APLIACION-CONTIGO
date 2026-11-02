import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

const root=path.resolve(import.meta.dirname,'../..');
const baseUrl=process.argv[2]||'http://127.0.0.1:3001';
const parsed=new URL(baseUrl);
if(parsed.protocol!=='http:'||!['localhost','127.0.0.1'].includes(parsed.hostname))throw new Error('Only local HTTP test URLs are authorized by this script.');
const runLabel=process.argv[3]||`run-${new Date().toISOString().replaceAll(':','-').replaceAll('.','-')}`;
if(!/^[a-zA-Z0-9_-]+$/.test(runLabel))throw new Error('Run label may contain only letters, numbers, underscores and hyphens.');
const out=path.join(root,'output/apf3/evidence/native-zoom',runLabel);await fs.mkdir(out,{recursive:true});
try{await fs.access(path.join(out,'native-zoom.json'));throw new Error('This evidence run already exists. Choose a new label to preserve prior records.')}catch(error){if(error.code!=='ENOENT')throw error}
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'contigo-native-zoom-'));
const extension=path.join(import.meta.dirname,'native-zoom-extension');
const report={metadata:{startedAt:new Date().toISOString(),baseUrl,method:'Browser-native chrome.tabs.setZoom(tabId,2) with automatic mode; chrome.tabs.getZoom verifies actual factor. Isolated Chromium persistent profile with localhost-only helper extension.',
  cssZoomUsed:false,deviceScaleFactorOverridden:false,viewportEmulationUsed:false,nativeUIKeyboardShortcutUsed:false,
  headless:true,profileKind:'Unique temporary isolated test profile; no user browser profile modified',browserExecutable:chromium.executablePath(),
  screenshotMethod:'CDP Page.captureScreenshot without clip, fromSurface=true, captureBeyondViewport=false; actual visible browser viewport, no image editing or emulation.',
  sources:[{title:'Chrome Tabs API setZoom/getZoom/ZoomSettings',url:'https://developer.chrome.com/docs/extensions/reference/api/tabs'},{title:'Playwright official extension testing',url:'https://playwright.dev/docs/chrome-extensions'},{title:'Chrome DevTools Protocol Page.captureScreenshot',url:'https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot'}],
  limitations:['Automated technical execution using synthetic demo data, not participant success, times or satisfaction.','No screen reader is exercised or inferred from browser accessibility tree.','Native zoom at one desktop window size does not establish complete WCAG 1.4.4 or 1.4.10 conformance.']},measurements:[],tasks:[]};
let context,worker,page;
const write=()=>fs.writeFile(path.join(out,'native-zoom.json'),JSON.stringify(report,null,2));
try{
  context=await chromium.launchPersistentContext(profile,{channel:'chromium',headless:true,viewport:null,locale:'es-PE',reducedMotion:'reduce',args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`,'--window-size=1280,960']});
  report.metadata.browserVersion=context.browser()?.version()||'Persistent browser: version queried below';
  const first=context.pages()[0]||await context.newPage();page=first;
  await context.addInitScript(()=>{if(!sessionStorage.getItem('contigo-demo-actor-v1'))sessionStorage.setItem('contigo-demo-actor-v1','patient_dacio')});
  [worker]=context.serviceWorkers();if(!worker)worker=await context.waitForEvent('serviceworker',{timeout:15000});
  await worker.evaluate(()=>typeof self.setLocalZoom==='function');
  await page.goto(`${baseUrl}/patient-app`);await page.waitForLoadState('networkidle');
  const tabId=await worker.evaluate(async base=>{const tabs=await chrome.tabs.query({});const tab=tabs.find(t=>t.url?.startsWith(base+'/'));if(!tab)throw new Error('No authorized local test tab found.');return tab.id;},baseUrl);
  report.metadata.tabId=tabId;report.metadata.extensionId=worker.url().split('/')[2];
  const session=await context.newCDPSession(page);report.metadata.browserProduct=await session.send('Browser.getVersion');await session.detach();
  async function zoom(factor){const result=await worker.evaluate(args=>self.setLocalZoom(args),{tabId,factor});await page.waitForTimeout(220);return result;}
  async function measure(id,extra={}){
    const actual=await worker.evaluate(id=>self.getLocalZoom(id),tabId);
    const metrics=await page.evaluate(()=>({url:location.href,title:document.title,innerWidth,innerHeight,outerWidth,outerHeight,devicePixelRatio,
      screen:{width:screen.width,height:screen.height,availWidth:screen.availWidth,availHeight:screen.availHeight,colorDepth:screen.colorDepth,pixelDepth:screen.pixelDepth},
      visualViewport:window.visualViewport?{width:visualViewport.width,height:visualViewport.height,scale:visualViewport.scale,pageLeft:visualViewport.pageLeft,pageTop:visualViewport.pageTop}:null,
      htmlFontSize:getComputedStyle(document.documentElement).fontSize,htmlZoom:getComputedStyle(document.documentElement).zoom,bodyZoom:getComputedStyle(document.body).zoom,
      documentWidth:document.documentElement.scrollWidth,horizontalDocumentOverflow:document.documentElement.scrollWidth>innerWidth+1,
      patientNavigation:[...document.querySelectorAll('.patient-navigation')].map(e=>({width:e.clientWidth,scrollWidth:e.scrollWidth,text:e.textContent.trim()})),
      mainHeadings:[...document.querySelectorAll('h1,h2')].filter(e=>e.checkVisibility()).map(e=>({tag:e.tagName,text:e.textContent.trim()})),
      activeElement:{tag:document.activeElement.tagName,text:document.activeElement.textContent.trim().slice(0,180)},
      controls:[...document.querySelectorAll('main button,.patient-app button')].filter(e=>e.checkVisibility()).map(e=>{const r=e.getBoundingClientRect();return{text:e.textContent.trim(),width:r.width,height:r.height,disabled:e.disabled}})}));
    const screenshot=`output/apf3/evidence/native-zoom/${runLabel}/${id}.png`;
    const captureSession=await context.newCDPSession(page);const cdpLayout=await captureSession.send('Page.getLayoutMetrics');const capture=await captureSession.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});await captureSession.detach();
    const buffer=Buffer.from(capture.data,'base64');await fs.writeFile(path.join(out,`${id}.png`),buffer);const pngDimensions={width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)};
    report.measurements.push({id,timestamp:new Date().toISOString(),nativeZoom:actual,metrics,cdpLayout,screenshot,pngDimensions,...extra});await write();console.log(`${id}: native=${actual.zoomFactor}, innerWidth=${metrics.innerWidth}, DPR=${metrics.devicePixelRatio}, htmlFont=${metrics.htmlFontSize}, png=${pngDimensions.width}x${pngDimensions.height}`);return {nativeZoom:actual,metrics,screenshot};
  }
  await zoom(1);await measure('01-home-native100');
  await zoom(2);await measure('02-home-native200');
  const beforeT1=await page.getByTestId('dose-taken').first().getAttribute('aria-label');
  await page.getByTestId('dose-taken').first().click();
  const t1status=page.getByRole('status').filter({hasText:'registraste que la tomaste'}).first();await t1status.waitFor();
  const t1=await measure('03-T1-dose-native200');report.tasks.push({id:'T1',kind:'Automated technical reachability at native 200%',action:beforeT1,confirmation:await t1status.innerText(),nativeFactor:t1.nativeZoom.zoomFactor,completed:true});
  await page.getByRole('navigation',{name:'Navegación del paciente'}).getByRole('button',{name:'Medición',exact:true}).click();
  await page.getByTestId('input-systolic').fill('80');await page.getByTestId('input-diastolic').fill('120');await page.getByTestId('btn-save-vitals').click();
  await page.getByRole('alert').filter({hasText:'La lectura no se guardó'}).waitFor();await page.locator('[id$="-diastolic-error"]').scrollIntoViewIfNeeded();await measure('04-T4-error-native200');
  await page.getByTestId('input-systolic').fill('120');await page.getByTestId('input-diastolic').fill('80');await page.getByTestId('btn-save-vitals').click();await page.getByTestId('measurement-review').waitFor();await measure('05-T4-review-native200');
  await page.getByTestId('btn-confirm-vitals').click();const saved=page.getByRole('status').filter({hasText:'Medición guardada.'}).first();await saved.waitFor();
  const t4=await measure('06-T4-recovery-native200');report.tasks.push({id:'T4',kind:'Automated technical reachability at native 200%',action:'Invalid 80/120 -> real error -> corrected 120/80 -> review -> confirm',confirmation:await saved.innerText(),nativeFactor:t4.nativeZoom.zoomFactor,completed:true});
  await page.getByTestId('patient-sos').click();await page.getByRole('dialog',{name:'SOS de demostración'}).waitFor();await measure('07-T2-SOS-review-native200');
  await page.getByTestId('patient-sos-confirm').click();const helpStatus=page.getByRole('status').filter({hasText:'Petición de prueba registrada.'}).first();await helpStatus.waitFor();
  const t2=await measure('08-T2-SOS-confirm-native200');report.tasks.push({id:'T2',kind:'Automated technical reachability at native 200%',action:'Persistent SOS from Medición -> explanation -> confirm demo request',confirmation:await helpStatus.innerText(),nativeFactor:t2.nativeZoom.zoomFactor,completed:true});await page.getByRole('button',{name:'Entendido, volver',exact:true}).click();
  await page.evaluate(()=>sessionStorage.setItem('contigo-demo-actor-v1','caregiver_demo'));await page.goto(`${baseUrl}/dashboard`);await page.waitForLoadState('networkidle');await zoom(2);
  await measure('09-T3-dashboard-native200');
  await page.getByRole('link',{name:'Tratamiento y existencias',exact:true}).click();await page.waitForLoadState('networkidle');await zoom(2);const medication=page.locator('article').filter({has:page.getByRole('heading',{name:'Losartán',exact:true})}).first();
  const treatmentText=await medication.innerText();await medication.getByText(/29 tabletas/, {exact:true}).waitFor();await medication.getByText(/29 tabletas/, {exact:true}).scrollIntoViewIfNeeded();await measure('10-T3-treatment-stock-native200');
  await page.getByRole('link',{name:'Citas médicas',exact:true}).click();await page.waitForLoadState('networkidle');await zoom(2);const appointmentText=await page.locator('main').innerText();
  await page.getByRole('heading',{name:'Geriatría',exact:true}).scrollIntoViewIfNeeded();const t3=await measure('11-T3-appointments-native200');report.tasks.push({id:'T3',kind:'Automated technical reachability at native 200%',action:'Caregiver reads treatment, stock and appointment in authorized demo',actor:await page.evaluate(()=>sessionStorage.getItem('contigo-demo-actor-v1')),treatment:treatmentText,appointments:appointmentText,nativeFactor:t3.nativeZoom.zoomFactor,completed:true});
  await zoom(1);await measure('12-restored-native100');
  report.zoomEvents=await worker.evaluate(()=>self.localZoomEvents);
  report.metadata.finishedAt=new Date().toISOString();report.result='Native browser zoom factors 1 and 2 verified by chrome.tabs.getZoom; technical T1-T4 paths executed with zoomFactor=2.';
  for(const file of ['manifest.json','service-worker.js']){const b=await fs.readFile(path.join(extension,file));report.metadata[file+'Sha256']=crypto.createHash('sha256').update(b).digest('hex');}
  const snapshot=path.join(root,'output/apf3/evidence/after/source-manifest.json');try{report.metadata.sourceManifestSha256=crypto.createHash('sha256').update(await fs.readFile(snapshot)).digest('hex')}catch{}
  await write();
}catch(error){report.error={message:error.message,stack:error.stack};report.result='Incomplete: inspect explicit error; do not claim native zoom or task success beyond recorded measurements.';await write();console.error(error);process.exitCode=1;}
finally{if(context)await context.close();}
