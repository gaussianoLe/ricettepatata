import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {startEditorial,repository} from '../editorial/runtime.mjs';
import {outputFingerprint} from '../src/catalog/integration.mjs';
process.chdir(repository);process.env.ASTRO_TELEMETRY_DISABLED='1';
const protectedFiles=JSON.parse(readFileSync('docs/editorial/p1.7/baseline.json','utf8')).files;
const fingerprint=()=>Object.fromEntries(Object.keys(protectedFiles).map(file=>[file,createHash('sha256').update(readFileSync(file)).digest('hex')]));
const before=fingerprint(),publicBefore=existsSync('dist')?outputFingerprint():null;
let session,child,failed=false;
try{
 session=await startEditorial({},{});
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{child?.kill(signal);});
 child=spawn(process.execPath,[fileURLToPath(new URL('../node_modules/@playwright/test/cli.js',import.meta.url)),'test','--config','playwright.editorial.config.ts'],{stdio:'ignore',env:{...process.env,EDITORIAL_TEST_OUTPUT:path.join(session.directory,'test-results'),EDITORIAL_TEST_URL:`http://127.0.0.1:${session.address.port}`}});
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});
 if(code!==0)throw new Error('Test browser editoriali falliti; payload privati non conservati nei log o negli artefatti CI');
 console.log('Browser editoriali: 10 test Chromium desktop/mobile superati. Nessun trace, screenshot, video o report HTML.');
} catch(error){failed=true;console.error(error.message);}
finally{
 if(session){await session.stop();if(existsSync(session.directory))throw new Error('Sessione temporanea non rimossa');}
 if(JSON.stringify(before)!==JSON.stringify(fingerprint()))throw new Error('Mutazione di un file operativo/storico');
 if(publicBefore && JSON.stringify(publicBefore)!==JSON.stringify(outputFingerprint()))throw new Error('Output pubblico modificato dalla sessione editoriale');
 console.log('Isolamento verificato: sessione temporanea rimossa, baseline e dist invariati.');
}
process.exitCode=failed?1:0;
