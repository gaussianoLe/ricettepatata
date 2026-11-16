import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {readCatalog} from '../src/catalog/io.mjs';
import {validationInputs,validateDraftRevisions,draftAuditEntries} from '../src/catalog/validation-cycle.mjs';
import {auditPublicOutput} from '../src/catalog/integration.mjs';
import {planImport} from '../src/catalog/import.mjs';
const inputs=validationInputs();let current=readCatalog(),registryText=readFileSync('src/catalog/registry.json','utf8');
if(existsSync('.astro/p1-catalog-fixtures.json')){const fixture=JSON.parse(readFileSync('.astro/p1-catalog-fixtures.json'));current=current.filter(e=>!fixture.files.includes(e.file));registryText=fixture.registryText;}
const registry=JSON.parse(registryText),bytes=file=>file==='src/catalog/registry.json'?Buffer.from(registryText):readFileSync(file);
const check=(data=inputs,entries=current,reg=registry,read=bytes)=>validateDraftRevisions(data,entries,reg,read);
test('three sourced manual amendments validate current state and reproduce report/diffs',()=>{
 const result=check();assert.deepEqual(result.report,JSON.parse(readFileSync('docs/editorial/p1.8/report.json')));assert.deepEqual(result.diffs,JSON.parse(readFileSync('docs/editorial/p1.8/diffs.json')));
 assert.deepEqual(result.report.summary,{revisedDrafts:3,readyForIndependentReview:2,needsRevision:1,blocked:0,promoted:0,demoUpdates:0,registryUpdates:0,newIdentities:0});
 for(const change of inputs.amendments.entries){
  const old=result.historicalEntries.find(e=>e.data.catalogId===change.catalogId),now=current.find(e=>e.data.catalogId===change.catalogId);
  assert.equal(old.data.catalogId,now.data.catalogId);assert.equal(old.data.slug,now.data.slug);assert.equal(now.data.editorial.status,'draft');assert.equal(now.data.demo,false);assert.notEqual(old.body,now.body);
  assert.deepEqual(result.readHistorical(change.file),readFileSync(change.beforeFile));
 }
});
test('archive tampering, undocumented changes, duplicate identities and demo edits fail closed',()=>{
 const first=inputs.amendments.entries[0];
 for(const file of [first.beforeFile,first.file,'src/content/ricette/pitta-di-patate.md','docs/editorial/p1.4/report.json','docs/integration/p1.5/report.json','docs/editorial/p1.6/report.json','docs/editorial/p1.7/baseline.json'])assert.throws(()=>check(inputs,current,registry,f=>f===file?Buffer.concat([bytes(f),Buffer.from('changed')]):bytes(f)));
 assert.throws(()=>check(inputs,[...current,current[0]]),/duplicato/);
 const changed=structuredClone(current);changed.find(e=>e.data.catalogId===first.catalogId).data.steps[0].text+=' changed';assert.throws(()=>check(inputs,changed),/discordanti/);
 const demo=structuredClone(current);demo.find(e=>e.data.demo).data.description+=' changed';assert.throws(()=>check(inputs,demo),/discordanti/);
 const badPlan=structuredClone(inputs);badPlan.amendments.entries[0].file='src/content/ricette/pitta-di-patate.md';assert.throws(()=>check(badPlan));
});
test('a ready label cannot hide essential unresolved issues or invent completed review/kitchen trials',()=>{
 const gratin=inputs.dossiers.find(d=>d.researchId==='RP-0062');assert.ok(gratin.essentialIssues.length);assert.equal(gratin.outcome,'needs_revision');
 const fake=structuredClone(inputs);fake.dossiers.find(d=>d.researchId==='RP-0062').outcome='ready_for_independent_review';assert.throws(()=>check(fake),/criticità/);
 for(const field of ['kitchenTestPerformed','independentReview']){const bad=structuredClone(inputs);bad.dossiers[0][field]=field==='independentReview'?'approved':true;assert.throws(()=>check(bad),/inventata/);}
});
test('formulas retain original numerical quantities, scope and the single unquantified pan ingredient',()=>{
 const history=check().historicalEntries;
 for(const item of inputs.amendments.entries){const before=history.find(e=>e.data.catalogId===item.catalogId).data,now=current.find(e=>e.data.catalogId===item.catalogId).data;assert.deepEqual(now.timing,before.timing);assert.equal(now.servings,before.servings);for(const i of before.ingredients)assert.deepEqual(now.ingredients.find(j=>j.id===i.id),i);}
 const gatto=current.find(e=>e.data.slug==='gatto-di-patate').data;assert.deepEqual(gatto.ingredients.find(i=>i.id==='pangrattato-pirofila').quantity,{value:null,unit:'qb'});
 const gratin=current.find(e=>e.data.slug==='gratin-dauphinois').data;assert.ok(!gratin.ingredients.some(i=>/formaggio|gruy|parmigiano/i.test(i.name)));
 const papas=current.find(e=>e.data.slug==='papas-arrugadas-con-mojo').data;assert.equal(papas.ingredients.find(i=>i.id==='acqua').quantity.approximate,true);assert.equal(papas.ingredients.find(i=>i.id==='mojo').quantity.value,null);assert.equal(papas.provenance.country.code,'ES');assert.equal(papas.provenance.continent,'africa');
});
test('source claims refer to consulted URLs and Ruggiero/GZ remain a dependent group',()=>{
 const all=inputs.sources.sources;assert.equal(all.length,13);assert.equal(new Set(all.map(s=>s.url)).size,all.length);
 for(const s of all){assert.equal(s.accessedAt,'2026-11-13');assert.equal(s.consultedInP18,true);}
 const a=all.find(s=>s.id==='ruggiero-gatto'),b=all.find(s=>s.id==='gz-gatto');assert.ok(a.derivedFrom.includes(b.id));assert.equal(a.independenceGroup,b.independenceGroup);
 const bad=structuredClone(inputs);bad.dossiers[0].claims[0].sourceIds=['invented-source'];assert.throws(()=>check(bad),/riscontro/);
});
test('current and archived raw payloads are audited; reimport never silently restores old drafts',()=>{
 const result=check();const incoming=inputs.amendments.entries.map(a=>current.find(e=>e.data.catalogId===a.catalogId));
 assert.equal(planImport(incoming,current,registry).skipped,3);
 assert.throws(()=>planImport(result.historicalEntries.filter(e=>incoming.some(i=>i.data.catalogId===e.data.catalogId)),current,registry),/Conflitto/);
 const directory=mkdtempSync(path.join(tmpdir(),'ricettepatata-p18-audit-'));
 try{const marker=incoming[0].data.steps[0].text;writeFileSync(path.join(directory,'leak.js'),'const leaked='+JSON.stringify(marker));assert.throws(()=>auditPublicOutput(draftAuditEntries(),directory),/Dati draft/);}finally{rmSync(directory,{recursive:true,force:true});}
});
test('historical P1.5/P1.6 writers are disabled instead of overwriting frozen snapshots',()=>{
 for(const file of ['scripts/integration-check.mjs','scripts/enrichment-review.mjs']){const result=spawnSync(process.execPath,[file,'--write'],{encoding:'utf8'});assert.notEqual(result.status,0);assert.match(result.stderr,/storica/);}
});
