import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {readCatalog} from '../src/catalog/io.mjs';
import {resolutionInputs,validateResolution} from '../src/catalog/editorial-resolution.mjs';
import {recipeSchema} from '../src/catalog/schema.mjs';
import {planImport} from '../src/catalog/import.mjs';
const inputs=resolutionInputs();let current=readCatalog(),registryText=readFileSync('src/catalog/registry.json','utf8');
if(existsSync('.astro/p1-catalog-fixtures.json')){const fixture=JSON.parse(readFileSync('.astro/p1-catalog-fixtures.json'));current=current.filter(e=>!fixture.files.includes(e.file));registryText=fixture.registryText;}
const registry=JSON.parse(registryText),bytes=file=>file==='src/catalog/registry.json'?Buffer.from(registryText):readFileSync(file);
const check=(data=inputs,entries=current,reg=registry,read=bytes)=>validateResolution(data,entries,reg,read);
test('P1.9 report and diffs reproduce zero operational changes and one unapplied proposal',()=>{
 const result=check();assert.deepEqual(result.report,JSON.parse(readFileSync('docs/editorial/p1.9/report.json')));assert.deepEqual(result.diffs,JSON.parse(readFileSync('docs/editorial/p1.9/diffs.json')));
 assert.deepEqual(result.report.summary,{reviewed:3,readyForIndependentReview:2,needsRevision:1,operationalChanges:0,proposalsPrepared:1,proposalsApplied:0,promotions:0,newIdentities:0});
 for(const d of result.diffs.operational){assert.equal(d.beforeSha256,d.afterSha256);assert.deepEqual(d.changes,[]);}
 assert.ok(result.diffs.unappliedAlternative.changes.length>0);
});
test('historical snapshots, records, registry and underlying validation code remain byte-identical',()=>{
 for(const file of ['src/content/ricette/gratin-dauphinois.md','src/catalog/registry.json','src/catalog/policy.mjs','src/catalog/validation-cycle.mjs','docs/editorial/p1.8/report.json','docs/editorial/p1.8/before/gatto-di-patate.md','docs/editorial/p1.7/baseline.json','docs/editorial/first-ten/report.json'])assert.throws(()=>check(inputs,current,registry,f=>f===file?Buffer.concat([bytes(f),Buffer.from('changed')]):bytes(f)),/modificato/);
 const changed=structuredClone(current);changed[0].data.description+=' changed';assert.throws(()=>check(inputs,changed),/diverso/);
 const permission=structuredClone(inputs);permission.plan.operationalWritesAuthorized=['src/content/ricette/gratin-dauphinois.md'];assert.throws(()=>check(permission),/Scrittura/);
});
test('missing geometry is not filled from another source or confused with a five-centimetre food layer',()=>{
 for(const [field,value] of [['panWallDepthCm',5],['panFootprintCm',[20,30]],['sliceMm',{min:2,max:3}]]){const mixed=structuredClone(inputs);mixed.comparison.items.find(i=>i.sourceId==='eurial-gratin')[field]=value;assert.throws(()=>check(mixed));}
 const mixed=structuredClone(inputs);mixed.comparison.items[0].oven.mode='static';assert.throws(()=>check(mixed),/inventata/);
 assert.equal(inputs.alternative.parameters.panWallDepthCm,null);assert.equal(inputs.alternative.parameters.panFootprintCm,null);assert.equal(inputs.alternative.parameters.foodLayerDepthCm.value,5);
});
test('all critical checklist topics are reviewed while unresolved gratin issues and approvals stay open',()=>{
 for(const mutate of [d=>d.kitchenTestPerformed=true,d=>d.independentApproval=true,d=>d.independentReview='approved',d=>d.checklist.pop()]){const bad=structuredClone(inputs);mutate(bad.dossiers[0]);assert.throws(()=>check(bad));}
 const ready=structuredClone(inputs);const gratin=ready.dossiers.find(d=>d.researchId==='RP-0062');gratin.outcome='ready_for_independent_review';gratin.essentialIssues=[];assert.throws(()=>check(ready),/risolto/);
 for(const d of inputs.dossiers){assert.ok(d.checklist.every(i=>i.checked));assert.equal(d.independentApproval,false);}
});
test('proposal cannot drift from its SHA plan, be applied, be promoted or cite mixed formula sources',()=>{
 for(const mutate of [a=>a.applicationApproved=true,a=>a.status='applied',a=>a.kitchenTestPerformed=true,a=>a.entry.data.editorial.status='published',a=>a.sourceId='eurial-gratin',a=>a.parameters.panWallDepthCm=5]){const bad=structuredClone(inputs);mutate(bad.alternative);assert.throws(()=>check(bad));}
 const stale=structuredClone(inputs);stale.plan.proposal.sha256='0'.repeat(64);assert.throws(()=>check(stale),/alterata/);
});
test('single-source P1.1 candidate retains identity, uses potato count and optional cheese without an upsert',()=>{
 const candidate=recipeSchema.parse(inputs.alternative.entry.data),live=current.find(e=>e.data.catalogId===candidate.catalogId);
 assert.equal(candidate.catalogId,live.data.catalogId);assert.equal(candidate.slug,live.data.slug);assert.equal(candidate.editorial.status,'candidate');assert.equal(candidate.demo,false);
 assert.equal(candidate.ingredients.find(i=>i.id==='patata').quantity.unit,'piece');assert.equal(candidate.ingredients.find(i=>i.id==='patata').quantity.value,8);assert.equal(candidate.ingredients.find(i=>i.id==='gruyere').optional,true);assert.equal(candidate.timing,null);assert.equal(candidate.sources.length,1);
 assert.throws(()=>planImport([inputs.alternative.entry],current,registry),/Conflitto/);
 assert.equal(live.data.editorial.status,'draft');assert.ok(!live.data.ingredients.some(i=>i.id==='gruyere'));
});
test('consulted sources remain distinct from failed attempts and checklist claims reference actual consultations',()=>{
 assert.equal(inputs.sources.sources.length,12);assert.ok(inputs.sources.sources.every(s=>s.accessedAt==='2026-11-16'&&s.consultedInP19));
 const bad=structuredClone(inputs);bad.dossiers[0].checklist[0].sourceIds=['unread-brochure'];assert.throws(()=>check(bad),/fonte/);
 const failed=structuredClone(inputs);failed.sources.sources[0].url=failed.sources.limitations[0].url;assert.throws(()=>check(failed),/Consultazione/);
});
