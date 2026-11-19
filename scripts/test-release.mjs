import {spawn,execFileSync} from 'node:child_process';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createRelease,buildRelease} from '../release/runtime.mjs';
import {serveRelease} from '../release/server.mjs';
import {outputFingerprint} from '../src/catalog/integration.mjs';
import {candidateEntries} from '../release/selection.mjs';
const authBefore=readFileSync('release/authorization.json','utf8');
const original=candidateEntries(),before=existsSync('dist')?outputFingerprint():null;
const base=process.env.BASE_PATH??'/';let session,server;
try{
 session=createRelease({base});const first=await buildRelease(session),second=await buildRelease(session);
 if(JSON.stringify(first)!==JSON.stringify(second))throw new Error('RC non riproducibile');
 server=await serveRelease(session);
 const child=spawn(process.execPath,[fileURLToPath(new URL('../node_modules/@playwright/test/cli.js',import.meta.url)),'test','--config','playwright.release.config.ts'],{stdio:(process.env.CI||process.env.GITHUB_ACTIONS)?'ignore':process.env.RC_DEBUG_LOCAL==='1'?'inherit':'ignore',env:{...process.env,RC_TEST_URL:server.url,RC_TEST_OUTPUT:path.join(session.directory,'test-results')}});
 const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});
 if(code!==0){
  const resultsPath=path.join(session.directory,'test-results','results.json');
  if(existsSync(resultsPath)){
   const report=JSON.parse(readFileSync(resultsPath,'utf8'));
   const failures=[];
   const visit=suite=>{for(const spec of suite.specs??[])for(const t of spec.tests??[])if(t.results?.some(r=>r.status!=='passed'&&r.status!=='skipped'))failures.push(spec.id??'unnamed');for(const nested of suite.suites??[])visit(nested);};
   for(const suite of report.suites??[])visit(suite);
   console.error('RC failing test identifiers:',JSON.stringify([...new Set(failures)].slice(0,20)));
  }
  throw new Error('Browser release candidate falliti; nessun payload/trace privato conservato');
 }
 execFileSync('git',['-c','init.defaultBranch=fixture','init','-q',session.workspace]);
 const approved=spawn(process.execPath,['tests/helpers/release-approval-fixture.mjs'],{cwd:session.workspace,stdio:(process.env.CI||process.env.GITHUB_ACTIONS)?'ignore':process.env.RC_DEBUG_LOCAL==='1'?'inherit':'ignore',env:{...process.env,BASE_PATH:'/',BUILD_TARGET:'production'}});
 const approvedCode=await new Promise((resolve,reject)=>{approved.once('error',reject);approved.once('exit',resolve);});
 if(approvedCode!==0)throw new Error('Percorso produzione approvata sintetica fallito; autorizzazione reale invariata');
 const previous=before??{},added=Object.keys(first).filter(f=>!previous[f]),changed=Object.keys(first).filter(f=>previous[f]&&previous[f]!==first[f]),removed=Object.keys(previous).filter(f=>!first[f]);
 console.log(JSON.stringify({base,recipes:2,browserCases:8,reproducible:true,approvedPathSyntheticTest:true,draftSourceChanges:0,diff:{added,changed,removed},files:first},null,2));
}finally{
 await server?.stop();session?.cleanup();
 if(before&&JSON.stringify(before)!==JSON.stringify(outputFingerprint()))throw new Error('dist pubblico modificato dalla RC');
 if(readFileSync('release/authorization.json','utf8')!==authBefore)throw new Error('Autorizzazione reale modificata');
 if(JSON.stringify(original)!==JSON.stringify(candidateEntries()))throw new Error('Draft operativi modificati');
 console.log('RC rimossa; catalogo e dist invariati; nessun artifact privato CI.');
}
