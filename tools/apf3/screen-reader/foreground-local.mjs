import { chromium } from '../node_modules/playwright/index.mjs';
const browser=await chromium.connectOverCDP('http://127.0.0.1:9223');
const page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('http://127.0.0.1:3001/'));
if(!page)throw new Error('No local test tab');
if(new URL(page.url()).origin!=='http://127.0.0.1:3001')throw new Error('Unexpected URL');
await page.bringToFront();
console.log(JSON.stringify({url:page.url(),title:await page.title(),prepared:true}));
process.exit(0);
