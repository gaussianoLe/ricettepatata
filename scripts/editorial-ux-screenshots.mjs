import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {chromium} from '@playwright/test';
import {startEditorial,repository} from '../editorial/runtime.mjs';
if(process.env.CI || process.env.GITHUB_ACTIONS)throw new Error('Screenshot editoriali vietati in CI; usare solo una sessione locale temporanea');
if(process.argv.length>2)throw new Error('Nessun percorso/output/host personalizzato consentito');
process.chdir(repository);process.env.ASTRO_TELEMETRY_DISABLED='1';
let session,browser;
try{
 session=await startEditorial({},{});
 const finished=new Promise(resolve=>{process.once('SIGINT',resolve);process.once('SIGTERM',resolve);});
 const output=path.join(session.directory,'review');mkdirSync(output);
 browser=await chromium.launch();
 for(const slug of ['gatto-di-patate','papas-arrugadas-con-mojo'])for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:960}});
  await page.goto(`http://127.0.0.1:${session.address.port}/release/${slug}/`);
  await page.screenshot({path:path.join(output,`${slug}-${width}.png`),fullPage:true});
  await page.getByRole('button',{name:'Modalità cucina',exact:true}).click();
  await page.screenshot({path:path.join(output,`${slug}-${width}-cucina.png`),fullPage:true});
  await page.close();
 }
 await browser.close();browser=null;
 console.log(`Screenshot privati temporanei: ${output}`);
 console.log('Aprire i PNG durante questa sessione. Ctrl+C rimuove screenshot, cache e server. Non caricarli in artifact CI o dist.');
 await finished;
}finally{await browser?.close();await session?.stop();}
