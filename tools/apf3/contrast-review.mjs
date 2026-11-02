/** Review historical axe incomplete colour-contrast nodes with conservative, per-node rendered backgrounds. */
import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const root=path.resolve(import.meta.dirname,'../..');
const output=path.join(root,'output/apf3/evidence/contrast-review');
await fs.mkdir(output,{recursive:true});
const baseUrl=process.argv[2]??'http://127.0.0.1:3001';
if(!/^http:\/\/(127\.0\.0\.1|localhost):3001$/.test(baseUrl))throw Error('Only local development server port3001 is allowed.');
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:960},locale:'es-PE',deviceScaleFactor:1,reducedMotion:'reduce'});
const page=await context.newPage();
const report={metadata:{date:new Date().toISOString(),baseUrl,browser:await browser.version(),playwright:require('playwright/package.json').version,method:'Original locator screenshot, temporary foreground-only transparency/visibility probe, exact inline-style restoration, per-pixel conservative sRGB contrast over text-layout bounding rectangles expanded1pixel. Each node is measured separately.',historicalSource:'output/apf3/evidence/after/audit.json',limitations:['Not Stark and not a complete WCAG audit.','A minimum over text-layout rectangles is conservative: failing this bound does not establish a failure at glyph pixels.','No antialiasing text pixels are used to estimate the foreground. CSS computed ink is composited over rendered background pixels.','Ancestor opacity below1 or text clipping/overlap prevents an unqualified pass.','No participant, screen-reader or native zoom claim.'],sourceFiles:{}},screens:[],nodes:[]};
for(const file of ['frontend/src/features/auth/LoginPage.tsx','frontend/src/components/ui/MedicationImage.tsx','frontend/src/features/vitals/TrendPlot.tsx','frontend/src/styles/index.css'])report.metadata.sourceFiles[file]=crypto.createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex');
const rel=file=>path.relative(root,file).replaceAll('\\','/');
async function ready(){await page.waitForLoadState('networkidle');await page.waitForTimeout(160);}
async function actor(id,route){await page.goto(baseUrl+'/login');await page.evaluate(id=>sessionStorage.setItem('contigo-demo-actor-v1',id),id);await page.goto(baseUrl+route);await ready();}
async function tab(name){await page.getByRole('navigation',{name:'Navegación del paciente'}).getByRole('button',{name,exact:true}).click();await ready();}
async function measureScreen(id,locator,expected){
  const count=await locator.count();
  const original=path.join(output,id+'-original-page.png');await page.screenshot({path:original,fullPage:true,animations:'disabled'});
  report.screens.push({id,url:page.url(),expectedHistoricalNodeCount:expected,currentNodeCount:count,viewport:page.viewportSize(),original:rel(original)});
  for(let i=0;i<count;i++){
    const target=locator.nth(i);
    await target.evaluate(el=>el.scrollIntoView({block:'center',inline:'center'}));await page.waitForTimeout(90);
    const prefix=id+'-node-'+String(i+1).padStart(2,'0');
    const originalElement=path.join(output,prefix+'-original.png'),probe=path.join(output,prefix+'-background-probe.png'),restored=path.join(output,prefix+'-restored.png');
    const measured=await target.evaluate(el=>{
      const s=getComputedStyle(el),r=el.getBoundingClientRect(),anc=[];
      const ranges=[];const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
      while(walker.nextNode())if(walker.currentNode.textContent.trim()){
        const range=document.createRange();range.selectNodeContents(walker.currentNode);
        for(const box of range.getClientRects())ranges.push({x:box.x-r.x,y:box.y-r.y,width:box.width,height:box.height});
      }
      for(let x=el;x;x=x.parentElement){const c=getComputedStyle(x);anc.push({tag:x.tagName,opacity:c.opacity,background:c.backgroundColor,backgroundImage:c.backgroundImage,blend:c.mixBlendMode});}
      const points=ranges.flatMap(box=>[[r.x+box.x+box.width/2,r.y+box.y+box.height/2],[r.x+box.x+Math.min(2,box.width/3),r.y+box.y+Math.min(2,box.height/3)],[r.x+box.x+box.width-Math.min(2,box.width/3),r.y+box.y+box.height-Math.min(2,box.height/3)]]);
      const overlap=points.map(([x,y])=>{const at=document.elementFromPoint(x,y);return {x,y,tag:at?.tagName,text:at?.textContent?.trim().slice(0,80),withinTarget:!!at&&(at===el||el.contains(at))};});
      return {text:el.textContent?.trim(),tag:el.tagName,html:el.outerHTML,color:s.color,fill:s.fill,fontSize:s.fontSize,fontWeight:s.fontWeight,textOpacity:s.opacity,rect:{x:r.x,y:r.y,width:r.width,height:r.height},pageX:r.x+scrollX,pageY:r.y+scrollY,textLayoutRectangles:ranges,ancestors:anc,pointHits:overlap};
    });
    await target.screenshot({path:originalElement,animations:'disabled'});
    // The probe removes only the ink (and decorative foreground descendants) of this target. Backgrounds/images/layout remain unchanged.
    const previous=await target.evaluate(el=>{
      const elements=[el,...el.querySelectorAll('*')];const old=elements.map(x=>x.getAttribute('style'));
      elements.forEach(x=>{x.style.setProperty('color','transparent','important');x.style.setProperty('-webkit-text-fill-color','transparent','important');x.style.setProperty('fill','transparent','important');x.style.setProperty('stroke','transparent','important');x.style.setProperty('text-shadow','none','important');if(el.tagName==='tspan')x.style.setProperty('visibility','hidden','important');});
      return old;
    });
    let fullSvgProbe;
    try{if(measured.tag==='tspan'){fullSvgProbe=path.join(output,prefix+'-background-full-page.png');await page.screenshot({path:fullSvgProbe,fullPage:true,animations:'disabled'});}else await target.screenshot({path:probe,animations:'disabled'});}
    finally{await target.evaluate((el,old)=>[el,...el.querySelectorAll('*')].forEach((x,j)=>old[j]===null?x.removeAttribute('style'):x.setAttribute('style',old[j])),previous);}
    await target.screenshot({path:restored,animations:'disabled'});
    const [first,last]=await Promise.all([fs.readFile(originalElement),fs.readFile(restored)]);
    const inlineStylesRestored=await target.evaluate((el,old)=>[el,...el.querySelectorAll('*')].every((x,j)=>x.getAttribute('style')===old[j]),previous);
    report.nodes.push({id:prefix,screen:id,...measured,foregroundProperty:measured.tag==='tspan'?'fill':'color',original:rel(originalElement),backgroundProbe:rel(probe),backgroundFullPage:fullSvgProbe?rel(fullSvgProbe):null,restored:rel(restored),inlineStylesRestored,restoredBytesEqual:crypto.createHash('sha256').update(first).digest('hex')===crypto.createHash('sha256').update(last).digest('hex')});
    console.log(prefix+' '+measured.text.slice(0,50));
  }
  await fs.writeFile(path.join(output,'raw-measurements.json'),JSON.stringify(report,null,2));
}
try{
  await page.goto(baseUrl+'/login');await ready();
  const loginTargets=page.locator('a.tracking-tight, span.bg-emerald-500\\/20, h2.text-white, p.text-emerald-100\\/90, .pt-6 > .flex > span');
  await measureScreen('01-login',loginTargets,7);
  await actor('patient_dacio','/patient-app');await measureScreen('02-patient-home',page.getByText('Foto de referencia',{exact:true}),1);
  await tab('Tratamiento');await measureScreen('03-patient-treatment',page.getByText('Foto de referencia',{exact:true}),1);
  await tab('Medición');await page.getByTestId('input-systolic').fill('120');await page.getByTestId('input-diastolic').fill('80');await page.getByTestId('btn-save-vitals').click();
  await page.getByTestId('btn-confirm-vitals').click();await ready();
  await tab('Inicio');await page.getByTestId('dose-taken').first().click();await ready();
  await measureScreen('12-dose-recorded',page.getByText('Foto de referencia',{exact:true}),1);
  await page.setViewportSize({width:320,height:800});await tab('Tratamiento');await measureScreen('15-patient-320',page.getByText('Foto de referencia',{exact:true}),1);
  await page.setViewportSize({width:640,height:900});await page.addStyleTag({content:'html { font-size:200% !important; }'});await ready();await measureScreen('16-patient-text-200',page.getByText('Foto de referencia',{exact:true}),1);
  await page.setViewportSize({width:1280,height:960});await actor('caregiver_demo','/medications');await measureScreen('18-caregiver-medications',page.getByText('Foto de referencia',{exact:true}),2);
  await page.goto(baseUrl+'/vitals');await ready();
  await measureScreen('21-caregiver-vitals',page.locator('.recharts-cartesian-axis-tick tspan, .recharts-legend-item-text'),21);
  await page.setViewportSize({width:320,height:800});await page.goto(baseUrl+'/medications');await ready();await measureScreen('24-caregiver-320',page.getByText('Foto de referencia',{exact:true}),2);
}catch(error){report.fatal={message:error.message};console.error(error.message);process.exitCode=1;}
finally{
  report.metadata.finishedAt=new Date().toISOString();
  await fs.writeFile(path.join(output,'raw-measurements.json'),JSON.stringify(report,null,2));await browser.close();
}
if(!report.fatal){
  execFileSync('C:/Users/vegac/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',[path.join(import.meta.dirname,'contrast-review.py')],{cwd:root,stdio:'inherit'});
}
