import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import{createRequire}from'node:module';
const require=createRequire(import.meta.url);
const[baseUrl='http://127.0.0.1:3001',variant='after']=process.argv.slice(2);
const out=path.resolve(import.meta.dirname,'../../output/apf3/evidence',variant);await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:390,height:844},locale:'es-PE',reducedMotion:'reduce'});
await context.addInitScript(()=>sessionStorage.setItem('contigo-demo-actor-v1','patient_dacio'));
const page=await context.newPage(),results={metadata:{timestamp:new Date().toISOString(),variant,baseUrl,scope:'Automated technical checks; no native browser zoom, screen reader or participant data'},checks:[]};
async function ready(){await page.waitForLoadState('networkidle');await page.waitForTimeout(220)}
async function save(id,method,extra={}){
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const axe=await page.evaluate(()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}}));
  const geometry=await page.evaluate(()=>({width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,
    nav:[...document.querySelectorAll('.patient-navigation')].map(e=>({clientWidth:e.clientWidth,scrollWidth:e.scrollWidth,labels:[...e.querySelectorAll('span')].map(s=>({text:s.textContent,fontSize:getComputedStyle(s).fontSize}))})),
    patientFont:document.querySelector('.patient-app')?getComputedStyle(document.querySelector('.patient-app')).fontSize:null,controls:[...document.querySelectorAll('.patient-app button')].map(e=>({text:e.textContent.trim(),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})),
    highContrast:document.documentElement.classList.contains('site-high-contrast'),tables:document.querySelectorAll('table').length,transientTooltips:document.querySelectorAll('.recharts-tooltip-wrapper').length}));
  const screenshot=`output/apf3/evidence/${variant}/${id}.png`;await page.screenshot({path:path.join(out,`${id}.png`),fullPage:true});
  results.checks.push({id,method,screenshot,geometry,axe,...extra});await fs.writeFile(path.join(out,'additional.json'),JSON.stringify(results,null,2));console.log(`${id}: ${axe.violations.length} rules`);
}
try{
  await page.goto(`${baseUrl}/patient-app`);await ready();await save('38-orientation-portrait','Viewport390x844; no orientation lock forced by test');
  await page.setViewportSize({width:960,height:540});await ready();await save('39-orientation-landscape','Viewport960x540; compare content/control availability with portrait');
  await page.setViewportSize({width:320,height:800});await ready();
  await page.addStyleTag({content:'*:not(svg):not(svg *){line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}'});await ready();
  await save('40-text-spacing-320','CSS stress: line-height1.5,paragraph margin2em,letter spacing.12em,word spacing.16em at320CSSpx; visually inspect clipping');
  await page.goto(`${baseUrl}/patient-app`);await page.setViewportSize({width:1280,height:960});await ready();
  if(variant!=='baseline'){
    await page.getByText('Opciones de lectura',{exact:true}).click();await page.getByLabel(/Tamaño del texto/).selectOption('200');await ready();
    await save('41-reading-option-200','Actual application text200% option; NOT native browser zoom');
    await page.getByRole('checkbox',{name:'Alto contraste en este dispositivo',exact:true}).check();await ready();
    await save('42-global-high-contrast-200','Actual application highcontrast+text200% preferences combined; no overlay');
    await page.getByRole('button',{name:'Restablecer lectura',exact:true}).click();await ready();
    await page.getByRole('navigation',{name:'Navegación del paciente'}).getByRole('button',{name:'Mi salud',exact:true}).click();await ready();
    await save('43-charts-table-alternative','Actual Mi salud chart and permanent exact-value table; inspect absence of transient tooltip');
    const focusTargets=[['secondary',page.getByRole('button',{name:'Ajustes',exact:true})],['navigation',page.getByRole('navigation',{name:'Navegación del paciente'}).getByRole('button',{name:'Medición',exact:true})]];
    for(const[name,target]of focusTargets){await target.focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');await page.waitForTimeout(150);await save(`44-focus-${name}`,'Actual keyboard focus with computed outline', {focus:await page.evaluate(()=>{const e=document.activeElement,s=getComputedStyle(e);return{text:e.textContent.trim(),outline:s.outline,offset:s.outlineOffset,shadow:s.boxShadow}})});}
    await page.getByRole('navigation',{name:'Navegación del paciente'}).getByRole('button',{name:'Medición',exact:true}).click();await ready();await page.getByTestId('input-systolic').focus();await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');await page.waitForTimeout(150);await save('45-focus-input','Actual keyboard focus on pressure field',{focus:await page.evaluate(()=>{const e=document.activeElement,s=getComputedStyle(e);return{id:e.id,outline:s.outline,offset:s.outlineOffset,shadow:s.boxShadow}})});
    await page.goto(`${baseUrl}/accessibility`);await ready();await save('46-accessibility-statement','Actual public accessibility statement: partial status, limits, plan and contact; no full-AA claim');
  }
}catch(error){results.fatal={message:error.message,stack:error.stack};console.error(error);process.exitCode=1}
finally{await fs.writeFile(path.join(out,'additional.json'),JSON.stringify(results,null,2));await browser.close()}
