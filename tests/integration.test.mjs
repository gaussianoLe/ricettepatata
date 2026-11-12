import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,mkdtempSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {gzipSync,brotliCompressSync} from 'node:zlib';
import {readCatalog} from '../src/catalog/io.mjs';
import {integrationInputs,validateIntegration,auditPublicOutput,outputFingerprint} from '../src/catalog/integration.mjs';
import {isVisible} from '../src/catalog/policy.mjs';
import {publicStore} from '../src/catalog/public-store.mjs';
import {planImport} from '../src/catalog/import.mjs';
const inputs=integrationInputs();
let current=readCatalog(),registryText=readFileSync('src/catalog/registry.json','utf8');
let registry=JSON.parse(registryText);
// Growth fixtures are separate synthetic input; integration is asserted against the unchanged operational snapshot.
if(existsSync('.astro/p1-catalog-fixtures.json')){
 const fixture=JSON.parse(readFileSync('.astro/p1-catalog-fixtures.json','utf8'));
 current=current.filter(e=>!fixture.files.includes(e.file));registryText=fixture.registryText;registry=JSON.parse(registryText);
}
const check=(entries=current,reg=registry,source=inputs)=>validateIntegration(source,entries,reg,file=>file==='src/catalog/registry.json'?Buffer.from(registryText):readFileSync(file));
const modified=fn=>{const e=structuredClone(current);fn(e);return e;};
const ids=new Set(inputs.entries.map(e=>e.data.catalogId));

test('exactly three operational drafts preserve P1.4 data, bodies, identity and formula',()=>{
 const report=check(),saved=JSON.parse(readFileSync('docs/integration/p1.5/report.json','utf8'));
 assert.deepEqual(report,saved);
 assert.deepEqual(report.summary,{integratedDrafts:3,newlyPublished:0,demoUpdates:0,enrichmentsApplied:0,identityOrSlugCollisions:0});
 for(const source of inputs.entries){
  const actual=current.find(e=>e.data.catalogId===source.data.catalogId);
  assert.deepEqual(actual.data,source.data);assert.equal(actual.body,source.body);
  assert.equal(actual.data.editorial.status,'draft');assert.equal(actual.data.demo,false);
 }
});
test('registry allows only the three exact additions and preserves every old reserved URL',()=>{
 assert.equal(Object.keys(registry).length,Object.keys(inputs.historical.registry).length+3);
 for(const [id,route] of Object.entries(inputs.historical.registry))assert.deepEqual(registry[id],route);
 const changed=structuredClone(registry);changed[inputs.entries[0].data.catalogId].slug='renamed';assert.throws(()=>check(current,changed));
 assert.throws(()=>check([...current,current.find(e=>ids.has(e.data.catalogId))]),/catalogId duplicato/);
 const changedSource={...inputs,entries:structuredClone(inputs.entries)};changedSource.entries[0].data.slug='patatas-bravas';assert.throws(()=>check(current,registry,changedSource),/Slug/);
});
test('non-destructive import is idempotent and conflicts never overwrite integrated drafts',()=>{
 const repeat=planImport(inputs.entries,current,registry);assert.equal(repeat.additions.length,0);assert.equal(repeat.skipped,3);
 const changed=structuredClone(inputs.entries);changed[0].data.description+=' changed';assert.throws(()=>planImport(changed,current,registry),/Conflitto/);
 for(const proposal of inputs.proposals)assert.throws(()=>planImport([{collection:'ricette',data:proposal.proposedRecord,body:''}],current,registry),/Conflitto/);
});
test('formula, source, state and body drift are rejected without promoting any recipe',()=>{
 for(const mutate of [e=>e.data.ingredients[0].quantity.value=999,e=>e.data.sources[0].author='changed',e=>e.body+=' changed',e=>e.data.editorial.status='review']){
  assert.throws(()=>check(modified(all=>mutate(all.find(e=>ids.has(e.data.catalogId))))));
 }
 for(const status of ['verified','published'])assert.throws(()=>check(modified(all=>all.find(e=>ids.has(e.data.catalogId)).data.editorial.status=status)));
});
test('all real editorial drafts are private in both targets, while existing demos keep their preview',()=>{
 for(const target of ['production','preview'])for(const source of inputs.entries)assert.equal(isVisible(source.data,target),false);
 for(const before of inputs.historical.entries){
  assert.equal(isVisible(before.data,'preview'),true);
  assert.equal(isVisible(before.data,'production'),false);
 }
 const arbitrary=structuredClone(inputs.entries[0].data);arbitrary.catalogId='00000000-0000-4000-8000-000000000001';assert.equal(isVisible(arbitrary,'preview'),false);
 assert.throws(()=>isVisible(arbitrary,'unknown'));
});
test('loader gate removes stale cached drafts and rejects subsequent private writes',()=>{
 for(const target of ['production','preview']){
  const privateEntry={id:'private',data:inputs.entries[0].data,body:'private body'};
  const storeMap=new Map([['private',privateEntry]]);
  const store={values:()=>[...storeMap.values()],get:id=>storeMap.get(id),delete:id=>storeMap.delete(id),set:entry=>{storeMap.set(entry.id,entry);return true;}};
  const filtered=publicStore(store,target);assert.equal(storeMap.size,0);assert.equal(filtered.set(privateEntry),false);assert.equal(storeMap.size,0);
  const publicData=structuredClone(inputs.historical.entries[0].data);
  if(target==='production'){publicData.demo=false;publicData.editorial.status='published';}
  assert.equal(filtered.set({id:'eligible',data:publicData}),true);assert.equal(storeMap.size,1);
  assert.equal(filtered.set({...privateEntry,id:'eligible'}),false);assert.equal(storeMap.size,0);
 }
});
test('preconditions and individual enrichment checklists stay pending and demos unchanged',()=>{
 const report=check();assert.equal(report.enrichments.length,inputs.proposals.length);
 for(const item of report.enrichments){assert.equal(item.applied,false);assert.equal(item.preconditionVerified,true);assert.ok(item.openIssues.length);}
 const changed=modified(all=>all.find(e=>e.data.slug==='patatas-bravas').data.description+=' changed');
 assert.throws(()=>check(changed),/preesistente/);
 const checklists=JSON.parse(readFileSync('docs/integration/p1.5/enrichment-checklists.json','utf8'));
 for(const item of checklists.items){assert.equal(item.applied,false);assert.ok(item.approvals.length>=4);assert.ok(item.approvals.every(a=>a.approved===false));}
});
test('raw public-output audit checks scripts, source maps, JSON, gzip and Brotli, not just HTML',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'ricettepatata-p15-output-'));
 try{
  mkdirSync(path.join(root,'assets'));writeFileSync(path.join(root,'index.html'),'<p>public test</p>');
  assert.equal(auditPublicOutput(inputs.entries,root).draftLeaks,0);
  const marker=inputs.entries[0].data.catalogId;
  for(const [name,bytes] of [['leak.js',Buffer.from('const raw='+JSON.stringify(marker))],['leak.map',Buffer.from(JSON.stringify({sourcesContent:[marker]}))],['leak.json',Buffer.from(JSON.stringify({data:marker}))],['leak.txt.gz',gzipSync(marker)],['leak.txt.br',brotliCompressSync(Buffer.from(marker))]]){
   const file=path.join(root,'assets',name);writeFileSync(file,bytes);assert.throws(()=>auditPublicOutput(inputs.entries,root),/Dati draft/);rmSync(file);
  }
  const before=outputFingerprint(root);writeFileSync(path.join(root,'index.html'),'<p>changed</p>');assert.notDeepEqual(outputFingerprint(root),before);
 }finally{rmSync(root,{recursive:true,force:true});}
});
