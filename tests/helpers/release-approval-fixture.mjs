// Executed only in the disposable source copy by the RC tests. Never changes real authorization.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {candidateEntries,recordDigest} from '../../release/selection.mjs';
import {createRelease,buildRelease,repository} from '../../release/runtime.mjs';
const parent=path.dirname(repository);
if(path.dirname(parent)!==realpathSync(tmpdir())||!/^ricettepatata-release-[A-Za-z0-9]+$/.test(path.basename(parent))||path.basename(repository)!=='workspace'||realpathSync(process.cwd())!==repository)throw new Error('Fixture autorizzazione consentita solo nella copia temporanea dei test');
const original=candidateEntries();
const entries=original.map(e=>({collection:e.collection,body:e.body,data:{...e.data,editorial:{...e.data.editorial,status:'published',reviewer:'CI TEST ONLY reviewer',reviewedAt:'2026-11-17',publishedAt:'2026-11-17'}}}));
writeFileSync('release/approved-records.json',JSON.stringify({formatVersion:1,entries}));
writeFileSync('release/authorization.json',JSON.stringify({formatVersion:1,approved:true,approvedBy:'CI TEST ONLY approver',approvedAt:'2026-11-17',photographicFallbackAccepted:true,recordHashes:Object.fromEntries(entries.map(e=>[e.data.catalogId,recordDigest(e)]))}));
writeFileSync('.git/info/exclude','/node_modules\n');
execFileSync('git',['add','--all']);
execFileSync('git',['-c','user.name=CI TEST ONLY','-c','user.email=ci@example.invalid','-c','commit.gpgsign=false','-c','core.hooksPath=/dev/null','commit','-qm','Synthetic publication fixture, never user approval']);
let session;
try{
 session=createRelease({mode:'approved'});const first=await buildRelease(session),second=await buildRelease(session);
 if(JSON.stringify(first)!==JSON.stringify(second))throw new Error('Artefatto approvato sintetico non riproducibile');
 for(const entry of original){const html=readFileSync(path.join(session.site,'ricette',entry.data.slug,'index.html'),'utf8');if(html.includes('noindex')||html.includes('Release candidate privata')||!html.includes('datePublished'))throw new Error('Gate indicizzazione/produzione non corretto');}
 if(!readFileSync(path.join(session.site,'robots.txt'),'utf8').includes('Allow: /'))throw new Error('Robots produzione non corretto');
 console.log('Approved production path: synthetic fixture passed; real approval remains blocked.');
}finally{session?.cleanup();}
