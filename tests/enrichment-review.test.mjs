import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {readCatalog} from '../src/catalog/io.mjs';
import {reviewInputs,validateReview,structuredDiff,replacementVisibility,digest} from '../src/catalog/enrichment-review.mjs';
import {recipeSchema} from '../src/catalog/schema.mjs';
const inputs=reviewInputs();
let entries=readCatalog(),registryText=readFileSync('src/catalog/registry.json','utf8');
// Synthetic growth is separate test input. CLI validates the exact operational baseline before fixtures.
if(existsSync('.astro/p1-catalog-fixtures.json')){
 const fixture=JSON.parse(readFileSync('.astro/p1-catalog-fixtures.json'));
 entries=entries.filter(e=>!fixture.files.includes(e.file));registryText=fixture.registryText;
}
const registry=JSON.parse(registryText),bytes=file=>file==='src/catalog/registry.json'?Buffer.from(registryText):readFileSync(file);
const check=(data=inputs,catalog=entries,reg=registry,read=bytes)=>validateReview(data,catalog,reg,read);
test('three blocked decisions and reproducible diffs preserve all P1.2–P1.5 baselines',()=>{
 const result=check();assert.deepEqual(result.report,JSON.parse(readFileSync('docs/editorial/p1.6/report.json')));
 assert.deepEqual(result.diffs,JSON.parse(readFileSync('docs/editorial/p1.6/diffs.json')));
 assert.deepEqual(result.report.summary,{reviewed:3,applied:0,prepared_not_applied:0,blocked:3,newIdentities:0,promotions:0});
 assert.equal(result.report.baseline.p12ThroughP15Unchanged,true);
});
test('UUID, slugs, relations and URLs keep the operational identity, with no duplicated records',()=>{
 for(const plan of inputs.plans){
  const current=entries.find(e=>e.data.catalogId===plan.catalogId);
  assert.equal(current.file,plan.targetPath);assert.equal(current.data.slug,plan.slug);
  assert.deepEqual(current.data.relation,plan.proposedRecord.relation);
  assert.equal(registry[plan.catalogId].slug,plan.slug);
 }
 assert.throws(()=>check(inputs,[...entries,entries[0]]),/duplicato/);
 const altered=structuredClone(inputs);altered.decisions[0].catalogId='00000000-0000-4000-8000-000000000001';assert.throws(()=>check(altered),/Identità/);
});
test('SHA mismatch rejects before any application, including historical evidence drift',()=>{
 const plan=inputs.plans[0];assert.equal(digest(bytes(plan.targetPath)),plan.beforeSha256);
 const stale=structuredClone(inputs);stale.plans[0].beforeSha256='0'.repeat(64);assert.throws(()=>check(stale),/SHA/);
 for(const file of [plan.targetPath,'docs/integration/p1.5/report.json','docs/editorial/p1.4/enrichments.json','docs/editorial/first-ten/report.json']){
  assert.throws(()=>check(inputs,entries,registry,f=>f===file?Buffer.concat([bytes(f),Buffer.from('changed')]):bytes(f)),/Baseline/);
 }
});
test('no authorization flag, status edit or partial replacement can silently apply an enrichment',()=>{
 for(const change of [d=>d.applied=true,d=>d.applicationApproved=true,d=>d.status='applied',d=>d.status='prepared_not_applied',d=>d.independentReview='approved',d=>d.allowedOperationalChanges=['ingredients']]){
  const altered=structuredClone(inputs);change(altered.decisions[0]);assert.throws(()=>check(altered),/non autorizzata/);
 }
 const altered=structuredClone(entries);altered.find(e=>e.data.catalogId===inputs.plans[0].catalogId).data.servings=6;
 assert.throws(()=>check(inputs,altered),/operativa non autorizzata/);
 for(const status of ['verified','published']){
  const forged=structuredClone(inputs);forged.plans[0].proposedRecord.editorial.status=status;assert.throws(()=>check(forged));
 }
});
test('gastronomic formulas remain candidate without fabricating missing totals, doses or regions',()=>{
 const [pitta,gnocchi,bravas]=inputs.plans.map(p=>recipeSchema.parse(p.proposedRecord));
 assert.equal(pitta.servings,6);assert.equal(pitta.timing,null);
 assert.equal(gnocchi.timing,null);assert.equal(gnocchi.provenance.region,null);
 assert.equal(gnocchi.ingredients.find(i=>i.id==='farina').quantity.max,undefined);
 assert.equal(bravas.ingredients.find(i=>i.id==='brodo').name,'brodo di pollo');
 assert.ok(bravas.taxonomy.cookingMethods.includes('frittura'));assert.ok(!bravas.taxonomy.cookingMethods.includes('forno'));
 for(const decision of inputs.decisions){assert.ok(decision.findings.every(f=>f.sourceIds.length && f.locator));assert.ok(decision.openIssues.length);}
 const invalid=structuredClone(inputs);invalid.decisions[0].findings[0].sourceIds=['invented'];assert.throws(()=>check(invalid),/fonte/);
});
test('replacement would remove preview demos; no demo flag can disguise a real draft as public',()=>{
 for(const plan of inputs.plans){
  const before=entries.find(e=>e.data.catalogId===plan.catalogId).data;
  const result=replacementVisibility(before,plan.proposedRecord);
  assert.deepEqual(result,{production:{before:false,after:false},preview:{before:true,after:false},regressesPreview:true});
  const realDraft={...plan.proposedRecord,editorial:{...before.editorial,status:'draft'}};
  // pitta/gnocchi lack scalar times: visibility is tested independently of schema eligibility.
  assert.equal(replacementVisibility(before,realDraft).preview.after,false);
  assert.equal(replacementVisibility(before,{...realDraft,demo:true}).preview.after,true);
 }
});
test('structured diff distinguishes absent values, nested arrays and zeroes without mutating either side',()=>{
 const before={n:0,a:[{x:1},{x:2}],missing:null},after={n:1,a:[{x:3}],new:false};
 const copy=structuredClone(before),changes=structuredDiff(before,after);
 assert.deepEqual(before,copy);assert.deepEqual(structuredDiff(before,before),[]);
 assert.ok(changes.some(c=>c.path==='/a/1' && c.after.present===false));
 assert.ok(changes.some(c=>c.path==='/new' && c.before.present===false && c.after.value===false));
 assert.ok(changes.some(c=>c.path==='/missing' && c.before.value===null));
 assert.ok(changes.some(c=>c.path==='/n' && c.before.value===0));
});
