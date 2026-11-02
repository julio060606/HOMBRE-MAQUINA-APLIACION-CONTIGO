import {chromium} from 'playwright';
import os from 'node:os';
import path from 'node:path';

const context=await chromium.launchPersistentContext(path.join(os.tmpdir(),'contigo-apf3-native-proof'),{
  channel:'chrome',headless:false,viewport:null,locale:'es-PE',
  args:['--remote-debugging-port=9223','--window-size=1280,960','--force-renderer-accessibility']
});
await context.addInitScript(()=>sessionStorage.setItem('contigo-demo-actor-v1','patient_dacio'));
const page=context.pages()[0]||await context.newPage();
await page.goto('http://127.0.0.1:3001/patient-app');await page.waitForLoadState('networkidle');
console.log(JSON.stringify({endpoint:'http://127.0.0.1:9223',title:await page.title(),url:page.url(),pid:process.pid}));
console.log('Interactive native proof browser is ready; do not close until screenshots/logs are recorded.');
await new Promise(resolve=>{process.once('SIGINT',resolve);context.once('close',resolve)});
await context.close();
