import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {readConsolidation,verifyHistoricalBaseline,validateConsolidation,renderConsolidationMatrix} from '../src/catalog/consolidation.mjs';
import {readEditorialBundle} from '../src/catalog/editorial.mjs';
import {historicalCatalog} from '../src/catalog/history.mjs';
import {recipeSchema,ingredientSchema} from '../src/catalog/schema.mjs';
import {formatIngredient,recipeView} from '../src/catalog/view.mjs';
import {planImport,parseImport,csvColumns} from '../src/catalog/import.mjs';
import {isVisible} from '../src/catalog/policy.mjs';
const root='docs/editorial/p1.4',bundle=readConsolidation(root),baseline=readEditorialBundle();
const {entries:catalog,registry,readHistorical}=historicalCatalog();
const check=b=>validateConsolidation(b,baseline,catalog,registry,readHistorical);
const edit=fn=>{const copy=structuredClone(bundle);fn(copy);return copy;};
const forId=(b,id)=>b.dossiers.find(d=>d.researchId===id);
const record=(b,id)=>b.records.entries.find(e=>e.data.externalIds[0].value===id).data;

test('consolidation accounts for ten assessments without forcing draft quotas',()=>{
 const r=check(bundle),saved=JSON.parse(readFileSync(root+'/report.json','utf8'));
 assert.deepEqual(r.summary,{assessed:10,consolidated:6,newDrafts:1,retainedDrafts:2,enrichmentProposals:3,blocked:4,addedSources:8,reconsultedSources:7});
 assert.deepEqual(r.identityChecks,saved.identityChecks);assert.deepEqual(r.inputHashes,saved.inputHashes);
 assert.equal(r.plan.updatesApplied,0);assert.equal(r.appliedToAstro,false);
 assert.equal(renderConsolidationMatrix(bundle),readFileSync(root+'/source-matrix.md','utf8'));
});
test('P1.3 artifacts and P1.2 sources remain byte-identical to the historical baseline',()=>{
 verifyHistoricalBaseline(bundle.baseline,readHistorical);
 for(const selected of ['docs/editorial/first-ten/records.json','docs/research/lotto-01/dataset.json','src/content/ricette/patatas-bravas.md']){
  assert.throws(()=>verifyHistoricalBaseline(bundle.baseline,file=>file===selected?Buffer.concat([readHistorical(file),Buffer.from(' ')]):readHistorical(file)),/Baseline storica modificata/);
 }
 const bad=structuredClone(bundle.baseline);bad.files['../outside']=Object.values(bad.files)[0];assert.throws(()=>verifyHistoricalBaseline(bad,readHistorical),/Percorso/);
});
test('draft identity and operational bravas/pitta/gnocchi identities cannot be bypassed',()=>{
 for(const plan of bundle.enrichments.plans){
  assert.equal(plan.catalogId,registry[plan.catalogId] && forId(bundle,plan.researchId).identity.existingCatalogId);
  assert.equal(plan.slug,registry[plan.catalogId].slug);assert.equal(plan.proposedRecord.catalogId,plan.catalogId);
  assert.throws(()=>check(edit(b=>b.enrichments.plans.find(p=>p.researchId===plan.researchId).proposedRecord.catalogId=forId(b,plan.researchId).researchTechnicalId)),/identità/);
 }
 assert.throws(()=>check(edit(b=>record(b,'RP-0011').slug='patatas-bravas')),/Identità/);
 assert.throws(()=>check(edit(b=>forId(b,'RP-0079').decision.outcome='new-draft')),/Draft/);
 assert.throws(()=>check(edit(b=>forId(b,'RP-0011').researchTechnicalId=forId(b,'RP-0002').researchTechnicalId)),/Identità/);
});
test('importer still rejects enrichment updates instead of performing an implicit upsert',()=>{
 for(const plan of bundle.enrichments.plans){
  assert.equal(plan.application,'manual-only');assert.equal(plan.requiresIndependentReview,true);
  assert.throws(()=>planImport([{collection:'ricette',data:plan.proposedRecord,body:''}],catalog,registry),/Conflitto sul catalogId/);
 }
 assert.equal(planImport(bundle.records.entries,catalog,registry).additions.length,bundle.records.entries.length);
});
test('formula quantities, steps, timing and servings must agree with dossier and draft',()=>{
 for(const mutate of [d=>d.ingredients[0].quantity.value=999,d=>d.steps[0].text+=' invented',d=>d.timing.cookMinutes=1,d=>d.servings=99]){
  assert.throws(()=>check(edit(b=>mutate(record(b,'RP-0011')))),/Formula\/record discordanti/);
 }
 assert.throws(()=>check(edit(b=>b.enrichments.plans[0].fieldChanges.pop())),/Differenze/);
 assert.throws(()=>check(edit(b=>b.enrichments.plans[0].beforeSha256='0'.repeat(64))),/Base proposta/);
 const g=record(bundle,'RP-0011');assert.equal(g.servings,6);assert.equal(g.ingredients.find(i=>i.id==='patata').quantity.value,500);assert.equal(g.timing.cookMinutes,70);
 assert.match(g.steps[0].text,/30–40/);assert.match(forId(bundle,'RP-0011').formula.timingBasis,/limite alto/);
});
test('derived sources cannot be counted as independent confirmations or replace unread formulas',()=>{
 const s=bundle.sources.sources.find(s=>s.id==='ruggiero-gatto');assert.deepEqual(s.derivedFrom,['gz-gatto']);assert.equal(s.independenceGroup,'mondadori');
 assert.throws(()=>check(edit(b=>b.sources.sources.find(s=>s.id==='ruggiero-gatto').independenceGroup='pretend-independent')),/Dipendenza/);
 assert.throws(()=>check(edit(b=>b.sources.sources.find(s=>s.id==='ruggiero-gatto').access='partial-paywall')),/Consultazione/);
 assert.throws(()=>check(edit(b=>forId(b,'RP-0011').claims[0].sourceIds=['missing'])),/Citazione/);
 assert.throws(()=>check(edit(b=>b.sources.sources[0].author='invented')),/Fonte P1.3 alterata/);
});
test('automatic editorial promotions and conversions of unresolved cases are rejected',()=>{
 for(const status of ['review','verified','published'])assert.throws(()=>check(edit(b=>record(b,'RP-0011').editorial.status=status)));
 assert.throws(()=>check(edit(b=>record(b,'RP-0011').editorial.reviewer='self-certified')),/Promozione/);
 assert.throws(()=>check(edit(b=>forId(b,'RP-0011').decision.outcome='needs_review')),/Conversione/);
 for(const id of ['RP-0002','RP-0005','RP-0077','RP-0063']){
  assert.equal(forId(bundle,id).decision.proposedStatus,'candidate');assert.equal(bundle.records.entries.some(e=>e.data.externalIds[0].value===id),false);
 }
 assert.equal(forId(bundle,'RP-0005').formula,null);
});
test('approximate numeric quantities survive schema, view, JSON and CSV without false precision',()=>{
 const papas=record(bundle,'RP-0080'),water=papas.ingredients.find(i=>i.id==='acqua');
 assert.equal(water.quantity.approximate,true);assert.match(formatIngredient(water),/^circa 2 l /);
 assert.ok(recipeView(papas).ingredients.some(s=>s.startsWith('circa 2 l ')));
 const plain=structuredClone(water);delete plain.quantity.approximate;assert.match(formatIngredient(plain),/^2 l /);
 const cells=csvColumns.map(col=>col==='collection'?'ricette':col==='body'?'':Object.hasOwn(papas,col)?(typeof papas[col]==='string'?papas[col]:JSON.stringify(papas[col])):'');
 const quote=s=>'"'+String(s).replaceAll('"','""')+'"';
 const csv=csvColumns.join(',')+'\n'+cells.map(quote).join(',')+'\n';
 const parsed=recipeSchema.parse(parseImport(csv,'csv')[0].data);assert.equal(parsed.ingredients.find(i=>i.id==='acqua').quantity.approximate,true);
 for(const q of [{value:2,unit:'l',approximate:'yes'},{value:null,unit:'qb',approximate:true}])assert.equal(ingredientSchema.safeParse({...water,quantity:q}).success,false);
});
test('retained drafts preserve their formulas, prepared mojo scope and isolated publication state',()=>{
 const previous=baseline.records.entries.find(e=>e.data.externalIds[0].value==='RP-0062').data;
 assert.deepEqual(record(bundle,'RP-0062'),previous);
 const papas=record(bundle,'RP-0080');assert.equal(papas.timing.prepMinutes+papas.timing.cookMinutes,35);
 assert.match(papas.ingredients.find(i=>i.id==='mojo').preparation,/esclusa dai tempi/);
 for(const e of bundle.records.entries){assert.equal(isVisible(e.data,'production'),false);assert.equal(catalog.some(c=>c.data.catalogId===e.data.catalogId),false);assert.equal(Object.hasOwn(registry,e.data.catalogId),false);}
});
test('the consolidation CLI checks the historical snapshot and rejects rewriting it',()=>{
 const result=execFileSync(process.execPath,['scripts/consolidation-check.mjs'],{encoding:'utf8'});
 assert.equal(JSON.parse(result).blocked,4);
 assert.throws(()=>execFileSync(process.execPath,['scripts/consolidation-check.mjs','--write'],{encoding:'utf8',stdio:'pipe'}),/immutabile/);
});
