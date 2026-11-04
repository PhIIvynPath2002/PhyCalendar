import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const profile=mkdtempSync(join(tmpdir(),'phy-v2-ui-'));
const server=spawn(process.execPath,['server.js'],{env:{...process.env,PORT:'3107'},stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('exit',()=>reject(Error('Static server failed')));});
const options={headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}:{})};
let context;
const errors=[],dataRequests=[];mkdirSync('artifacts',{recursive:true});
try{
 context=await chromium.launchPersistentContext(profile,options);
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/'))dataRequests.push(r.url());});
 await page.goto('http://127.0.0.1:3107');await page.locator('#calendar-grid .day').first().waitFor();assert.equal(await page.locator('input[type=password]').count(),0);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();
 await page.locator('#add-subscription').click();await page.locator('#subscription-form [name=name]').fill('ChatGPT（演示值）');await page.locator('#subscription-form [name=amount]').fill('20');await page.locator('#subscription-form [name=currency]').selectOption('USD');await page.locator('#subscription-form [type=submit]').click();await page.locator('#editor').waitFor({state:'hidden'});
 await page.locator('[data-tab=list]').click();await page.locator('.subscription-row').click();await page.locator('#detail-pay').click();await page.locator('#payment-form [type=submit]').click();await page.locator('#payment-dialog').waitFor({state:'hidden'});assert.match(await page.locator('.paid-stat').innerText(),/20.00/);
 await context.setOffline(true);await page.reload();await page.locator('#calendar-grid .day').first().waitFor();assert.match(await page.locator('.paid-stat').innerText(),/20.00/);
 await page.locator('#add-subscription').click();await page.locator('#subscription-form [name=name]').fill('离线记录（演示）');await page.locator('#subscription-form [type=submit]').click();await page.locator('#editor').waitFor({state:'hidden'});
 await page.locator('[data-tab=settings]').click();const downloaded=page.waitForEvent('download');await page.locator('#export-json').click();const file=await downloaded;const fs=await import('node:fs/promises');const backup=JSON.parse(await fs.readFile(await file.path(),'utf8'));assert.equal(backup.version,2);assert.equal(backup.subscriptions.length,2);assert.equal(backup.payments.length,1);
 const icsEvent=page.waitForEvent('download');await page.locator('#export-ics').click();const ics=await icsEvent;assert.match(await fs.readFile(await ics.path(),'utf8'),/BEGIN:VCALENDAR/);
 // Invalid future-format imports must not replace existing records.
 await page.locator('#import-file').setInputFiles({name:'future.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...backup,version:99}))});await page.waitForTimeout(150);assert.equal(await page.locator('#import-preview').isVisible(),false);
 for(const width of [320,393,430,768,1440]){await page.setViewportSize({width,height:900});await page.locator('[data-tab=calendar]').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 await page.setViewportSize({width:393,height:852});await page.screenshot({path:'artifacts/v2-phone.png',fullPage:true});await context.close();
 context=await chromium.launchPersistentContext(profile,options);await context.setOffline(true);const reopened=await context.newPage();await reopened.goto('http://127.0.0.1:3107');await reopened.locator('#calendar-grid .day').first().waitFor();await reopened.locator('[data-tab=list]').click();assert.equal(await reopened.locator('.subscription-row').count(),2);assert.match(await reopened.locator('.paid-stat').innerText(),/20.00/);
 await context.setOffline(false);
 const browser=await chromium.launch(options);const isolated=await browser.newPage();await isolated.goto('http://127.0.0.1:3107');await isolated.locator('#calendar-grid .day').first().waitFor();assert.equal(await isolated.locator('#side-count').innerText(),'0');
 // Legacy JSON migration is also exercised through the real import UI.
 await isolated.locator('[data-tab=settings]').click();await isolated.locator('#import-file').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...backup,version:1}))});await isolated.locator('#before-import').click();isolated.on('dialog',d=>d.accept());await isolated.locator('#confirm-import').click();await isolated.locator('#import-preview').waitFor({state:'hidden'});assert.equal(await isolated.locator('#side-count').innerText(),'2');
 await browser.close();assert.deepEqual(errors,[]);assert.deepEqual(dataRequests,[]);
 console.log('PASS: no login/API requests; offline read/write/export, full browser restart persistence, independent data spaces, v1 import, future-version rejection, 320–1440px layout.');
}finally{if(context)await context.close();server.kill();await once(server,'exit');rmSync(profile,{recursive:true,force:true});}
