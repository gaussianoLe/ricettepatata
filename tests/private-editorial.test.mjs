import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import {parse} from 'yaml';
import {editorialOptions,createSession,privateConfig,assertSessionConfig,assertTestSession,allowedRequest} from '../editorial/runtime.mjs';
import {editorialEligible,editorialData,issues} from '../editorial/data.mjs';
import {deployment} from '../src/lib/config.mjs';
import {isVisible} from '../src/catalog/policy.mjs';
import {outputFingerprint} from '../src/catalog/integration.mjs';
test('editorial has its own local contract and cannot be selected as a distributable target',()=>{
 assert.deepEqual(editorialOptions(),{target:'editorial',host:'127.0.0.1',port:4322});
 for(const options of [{host:'0.0.0.0'},{host:'localhost'},{host:true},{host:'::'},{port:80},{port:0},{port:NaN},{outDir:'dist'},{root:'.'},{target:'production'}])assert.throws(()=>editorialOptions(options));
 for(const env of [{HOST:'0.0.0.0'},{BUILD_TARGET:'preview'},{BASE_PATH:'/anteprima/'},{SITE_URL:'https://ricettepatata.it'}])assert.throws(()=>editorialOptions({},env));
 assert.throws(()=>deployment('editorial'));
});
test('isolated session uses private external paths, refuses shared output and cannot build/preview/sync',()=>{
 const session=createSession();
 try{
  const options=editorialOptions(),config=privateConfig(session,options);
  const resolved={...config,...Object.fromEntries(['srcDir','publicDir','outDir','cacheDir'].map(k=>[k,pathToFileURL(config[k])]))};
  assert.doesNotThrow(()=>assertSessionConfig(resolved,session,options));
  for(const field of ['root','publicDir','outDir','cacheDir'])assert.throws(()=>assertSessionConfig({...resolved,[field]:pathToFileURL(path.resolve('dist')+'/')},session,options));
  assert.throws(()=>assertSessionConfig({...resolved,server:{host:'0.0.0.0',port:4322}},session,options));
  const guard=config.integrations[0].hooks['astro:config:setup'];assert.doesNotThrow(()=>guard({command:'dev'}));
  for(const command of ['build','preview','sync'])assert.throws(()=>guard({command}),/solo dev/);
  assert.doesNotThrow(()=>assertTestSession(path.join(session.directory,'test-results'),'http://127.0.0.1:4322'));
  for(const output of ['dist/test-results','test-results',path.join(session.directory,'root/test-results')])assert.throws(()=>assertTestSession(output,'http://127.0.0.1:4322'));
  assert.throws(()=>assertTestSession(path.join(session.directory,'test-results'),'https://remote.example'));
 }finally{session.cleanup();session.cleanup();}
 assert.equal(existsSync(session.directory),false);
});
test('request gate rejects foreign sockets, DNS rebinding hosts, cross-origin reads, writes and raw data',()=>{
 const request={remoteAddress:'127.0.0.1',host:'127.0.0.1:4322',origin:undefined,method:'GET',url:'/'};
 assert.equal(allowedRequest(request,4322),true);
 for(const altered of [{remoteAddress:'192.168.1.12'},{remoteAddress:'::'},{host:'evil.example:4322'},{host:'127.0.0.1.evil.example:4322'},{origin:'https://evil.example'},{method:'POST'},{url:'/@fs/etc/passwd'},{url:'/docs/enrichments.json'},{url:'/%40fs/private'},{url:'/%GG'}])assert.equal(allowedRequest({...request,...altered},4322),false);
});
test('candidate, draft and review are readable locally without altering either public policy',()=>{
 const {catalog,proposals}=editorialData(),sample=catalog.find(e=>!e.data.demo).data;
 for(const status of ['candidate','draft','review'])assert.equal(editorialEligible({...sample,editorial:{...sample.editorial,status}}),true);
 for(const status of ['verified','published'])assert.equal(editorialEligible({...sample,editorial:{...sample.editorial,status}}),false);
 const realDrafts=catalog.filter(e=>!e.data.demo && e.data.editorial.status==='draft');assert.ok(realDrafts.length>=3);
 for(const e of realDrafts){assert.equal(isVisible(e.data,'production'),false);assert.equal(isVisible(e.data,'preview'),false);}
 assert.equal(proposals.length,3);
 for(const p of proposals){assert.equal(p.operational.data.demo,true);assert.equal(p.record.demo,false);assert.equal(p.record.editorial.status,'candidate');assert.equal(p.preconditionMatches,true);assert.equal(p.decision.status,'blocked');assert.equal(p.decision.applicationApproved,false);assert.ok(p.diff.changes.length);assert.equal(isVisible(p.operational.data,'preview'),true);}
 assert.ok(issues({...sample,timing:null,servings:null,ingredients:[],steps:[],sources:[]}).length>=5);
});
test('actual attempts to build editorial fail before touching any public output',()=>{
 const before=existsSync('dist')?outputFingerprint():null;
 for(const [args,env] of [[['scripts/build.mjs','editorial'],{}],[['scripts/build.mjs','production'],{BUILD_TARGET:'editorial'}],[['node_modules/astro/bin/astro.mjs','build','--mode','editorial'],{BUILD_TARGET:'production'}],[['node_modules/astro/bin/astro.mjs','build','--root','editorial'],{BUILD_TARGET:'editorial'}]]){
  const result=spawnSync(process.execPath,args,{encoding:'utf8',env:{...process.env,...env},timeout:20000});
  assert.notEqual(result.status,0);assert.match(result.stderr+result.stdout,/editorial|Editorial/);
 }
 if(before)assert.deepEqual(outputFingerprint(),before);
});
test('CI uploads only public browser failures; private browser evidence is disabled and temporary',()=>{
 const workflow=parse(readFileSync('.github/workflows/ci.yml','utf8'));
 const steps=workflow.jobs.verify.steps;
 const uploads=steps.filter(s=>s.uses?.startsWith('actions/upload-artifact'));
 assert.equal(uploads.length,1);assert.equal(uploads[0].with.path,'test-results/');
 assert.ok(steps.some(s=>s.run==='npm run test:editorial'));
 const config=readFileSync('playwright.editorial.config.ts','utf8');
 for(const setting of ["trace:'off'","screenshot:'off'","video:'off'","preserveOutput:'never'","reporter:'dot'",'assertTestSession'])assert.ok(config.includes(setting));
 const runner=readFileSync('scripts/test-editorial.mjs','utf8');assert.ok(runner.includes("stdio:'ignore'"));assert.ok(runner.includes('await session.stop()'));
});

test('Astro programmatic build also rejects the private dev configuration and creates no output',async()=>{
 const session=createSession();
 try{
  const {build}=await import('astro');
  await assert.rejects(()=>build(privateConfig(session,editorialOptions())),/solo dev/);
  assert.equal(existsSync(path.join(session.directory,'forbidden-output')),false);
 }finally{session.cleanup();}
 assert.equal(existsSync(session.directory),false);
});
