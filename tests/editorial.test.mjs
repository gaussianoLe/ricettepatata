import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readEditorialBundle,validateEditorialBundle,renderSourceMatrix} from '../src/catalog/editorial.mjs';
import {historicalCatalog} from '../src/catalog/history.mjs';
import {isVisible} from '../src/catalog/policy.mjs';
const root='docs/editorial/first-ten';
const bundle=readEditorialBundle(root),dataset=readFileSync('docs/research/lotto-01/dataset.json','utf8');
const {entries:current,registry}=historicalCatalog();
const check=value=>validateEditorialBundle(value,dataset,current,registry);
const altered=change=>{const copy=structuredClone(bundle);change(copy);return copy;};

test('editorial selection preserves P1.2 identities and actual outcome totals',()=>{
 const report=check(bundle),saved=JSON.parse(readFileSync(root+'/report.json','utf8'));
 assert.deepEqual(report.summary,{selected:10,dossiers:10,sources:24,readyForConversion:2,needsReview:5,duplicateOrVariant:3,p11Records:2});
 assert.deepEqual(report.identityChecks,saved.identityChecks);
 assert.deepEqual(report.inputHashes,saved.inputHashes);
 assert.equal(report.plan.additions,report.summary.p11Records);
 assert.equal(report.appliedToAstro,false);assert.equal(report.publicationAuthorized,false);
});
test('editorial records remain drafts outside Astro and source content is preserved',()=>{
 for(const entry of bundle.records.entries){
  assert.equal(entry.data.editorial.status,'draft');assert.equal(entry.data.demo,false);
  assert.equal(isVisible(entry.data,'production'),false);
  assert.equal(current.some(e=>e.data.catalogId===entry.data.catalogId),false);
  assert.equal(Object.hasOwn(registry,entry.data.catalogId),false);
 }
 const preserved=JSON.parse(readFileSync(root+'/preserved-catalog.json','utf8'));
 for(const [file,digest] of Object.entries(preserved)){
  // Growth fixtures deliberately extend the registry in one CI configuration.
  if(file==='src/catalog/registry.json'){
   const originalIds=bundle.dossiers.map(d=>d.identity.existingCatalogId).filter(Boolean);
   for(const id of originalIds)assert.ok(registry[id]);
  }else assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),digest,file);
 }
});
test('editorial validation rejects promotion, demo content and changed technical identities',()=>{
 for(const status of ['review','verified','published'])assert.throws(()=>check(altered(b=>b.records.entries[0].data.editorial.status=status)));
 assert.throws(()=>check(altered(b=>b.records.entries[0].data.demo=true)));
 assert.throws(()=>check(altered(b=>b.dossiers[0].researchTechnicalId=b.dossiers[1].researchTechnicalId)),/Identità/);
 assert.throws(()=>validateEditorialBundle(bundle,dataset+' ',current,registry),/Dataset/);
});
test('reserved bravas identity cannot be bypassed with another UUID or slug',()=>{
 const position=bundle.dossiers.findIndex(d=>d.researchId==='RP-0079');
 assert.equal(bundle.dossiers[position].identity.existingCatalogId,'449f2fe8-e698-5a54-9ea7-8a29984f5de8');
 for(const id of ['RP-0001','RP-0039','RP-0079']){
  assert.throws(()=>check(altered(b=>{const d=b.dossiers.find(d=>d.researchId===id);d.decision.outcome='ready_for_conversion';d.identity={disposition:'new-primary',existingCatalogId:null};})),/Collisione/);
 }
 assert.throws(()=>check(altered(b=>b.dossiers[position].identity.existingCatalogId='00000000-0000-4000-8000-000000000000')),/Identità esistente/);
});
test('source matrix rejects absent references and claims without evidence',()=>{
 assert.throws(()=>check(altered(b=>b.dossiers[0].claims[0].sourceIds=['inventata'])),/Riferimento/);
 assert.throws(()=>check(altered(b=>b.dossiers[0].claims[0].sourceIds=[])),/senza fonte/);
 assert.throws(()=>check(altered(b=>b.sources.sources[0].accessedAt='2026-11-11')),/data incoerente/);
 assert.throws(()=>check(altered(b=>b.sources.sources[0].url='http://example.org')));
 assert.throws(()=>check(altered(b=>b.sources.sources.push(b.sources.sources[0]))),/Duplicati/);
});
test('unresolved cases cannot generate records and conversions need independent full sources',()=>{
 assert.throws(()=>check(altered(b=>b.dossiers.find(d=>d.researchId==='RP-0080').decision.outcome='needs_review')),/caso irrisolto/);
 assert.throws(()=>check(altered(b=>{for(const s of b.sources.sources)s.independenceGroup='one-publisher';})),/insufficienti/);
 assert.throws(()=>check(altered(b=>{b.sources.sources.find(s=>s.id==='bonviveur-papas').access='partial-paywall';})),/non integralmente/);
 assert.throws(()=>check(altered(b=>b.records.entries.push(b.records.entries[0]))),/duplicata/);
});
test('P1.1 quantities, servings and formula source metadata are validated',()=>{
 assert.throws(()=>check(altered(b=>b.records.entries[0].data.ingredients[0].quantity.value=-1)));
 assert.throws(()=>check(altered(b=>b.records.entries[0].data.servings=8)),/Porzioni/);
 assert.throws(()=>check(altered(b=>b.records.entries[0].data.sources[0].author='Autore inventato')),/Fonte record/);
 const papas=bundle.records.entries.find(e=>e.data.externalIds[0].value==='RP-0080').data;
 assert.equal(papas.provenance.continent,'africa');
 assert.equal(papas.provenance.country.code,'ES');
 assert.deepEqual(papas.timing,{prepMinutes:5,cookMinutes:30,restMinutes:0});
 assert.equal(papas.ingredients.find(i=>i.id==='mojo').quantity.value,null);
 const gratin=bundle.records.entries.find(e=>e.data.externalIds[0].value==='RP-0062').data;
 assert.deepEqual(gratin.timing,{prepMinutes:40,cookMinutes:35,restMinutes:0});
 assert.equal(gratin.ingredients.find(i=>i.id==='panna').quantity.value,500);
});
test('dossiers, decisions and generated source matrix cannot silently disappear',()=>{
 assert.equal(renderSourceMatrix(bundle),readFileSync(root+'/source-matrix.md','utf8'));
 assert.throws(()=>check(altered(b=>b.dossiers.pop())),/selezione/);
 assert.throws(()=>check(altered(b=>b.dossiers.push(b.dossiers[0]))),/Duplicati/);
 assert.throws(()=>check(altered(b=>b.dossiers[0].claims=b.dossiers[0].claims.filter(c=>c.field!=='ingredients'))),/obbligatoria/);
 const unresolved=bundle.dossiers.find(d=>d.researchId==='RP-0005');
 assert.equal(unresolved.documentedFormula,null);assert.equal(unresolved.potatoRole,null);
 assert.equal(unresolved.decision.outcome,'needs_review');
 assert.ok(bundle.sources.sources.find(s=>s.id==='ducasse-tartiflette').access==='partial-paywall');
});
test('CLI validates the frozen historical baseline without rewriting research inputs',()=>{
 const output=execFileSync(process.execPath,['scripts/editorial-check.mjs'],{encoding:'utf8'});
 assert.equal(JSON.parse(output).dossiers,bundle.selection.sourceIds.length);
 assert.throws(()=>execFileSync(process.execPath,['scripts/editorial-check.mjs','--write'],{encoding:'utf8',stdio:'pipe'}),/immutabile/);
});
