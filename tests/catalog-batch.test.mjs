import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,existsSync,symlinkSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {readCatalog} from '../src/catalog/io.mjs';
import {recipeSchema} from '../src/catalog/schema.mjs';
import {isVisible} from '../src/catalog/policy.mjs';
import {profileSchema,parseResearchInput,researchId,stableJSON} from '../src/catalog/research/input.mjs';
import {pendingBatchReport,prepareResearchBatch,stageResearchBatch} from '../src/catalog/research/batch.mjs';
const existing=readCatalog(),registry=JSON.parse(readFileSync('src/catalog/registry.json','utf8'));
const profile={formatVersion:1,datasetId:'ci-synthetic-research',editorialAuthor:'TEST ONLY: adapter operator',recordDate:'2026-11-11',columns:Object.fromEntries(['sourceId','catalogId','slug','italianTitle','originalTitle','originalLanguage','description','potatoRole','relationKind','primaryId','primarySourceId','duplicateOf','sources','sourceUrl','sourceTitle','sourceAuthor','sourceAccessedAt','sourceKind','ingredients','steps','timing','servings','countryCode','countryName','continent','region','alternativeNames','notes','courses','body'].map(field=>[field,field]))};
// Synthetic input lives only in tests. It is not the missing research dataset.
const row=(key)=>({sourceId:`test-${key}`,slug:`test-batch-${key}`,italianTitle:`zzfixture${key}`,originalTitle:`zzfixture${key}`,originalLanguage:'it',description:'TEST ONLY: schema adapter fixture, not a recipe.',potatoRole:'protagonist',relationKind:'primary'});
const input=rows=>parseResearchInput(JSON.stringify({formatVersion:1,rows}),'json');
const prepare=(rows,p=profile)=>prepareResearchBatch(input(rows),p,existing,registry);
const codes=record=>record.reasons.map(reason=>reason.code);
function asCSV(rows) {
 const columns=[...new Set(rows.flatMap(Object.keys))],quote=value=>'"'+String(value).replaceAll('"','""')+'"';
 return '\uFEFF'+[columns.map(quote).join(','),...rows.map(record=>columns.map(column=>quote(record[column]===undefined?'':typeof record[column]==='object'||typeof record[column]==='number'||typeof record[column]==='boolean'?JSON.stringify(record[column]):record[column])).join(','))].join('\r\n')+'\r\n';
}

test('missing dataset yields an explicit waiting report, with no invented 50 records or staging',()=>{
 const report=pendingBatchReport();assert.equal(report.status,'waiting_for_dataset');assert.equal(report.datasetAvailable,false);assert.equal(report.importExecuted,false);assert.equal(report.expectedCandidates,50);
 assert.deepEqual(report.summary,{received:0,accepted:0,excluded:0,review:0});
 assert.deepEqual(JSON.parse(readFileSync('docs/research/readiness-report.json','utf8')),report);
 const stdout=execFileSync(process.execPath,['scripts/catalog-batch.mjs'],{encoding:'utf8'});assert.deepEqual(JSON.parse(stdout),report);
 assert.throws(()=>stageResearchBatch({report},'/not-used'),/non disponibile/);
});
test('mapping is explicit, required and never auto-detected from unknown headers',()=>{
 const p=structuredClone(profile);delete p.columns.originalLanguage;assert.equal(profileSchema.safeParse(p).success,false);
 p.columns.originalLanguage='language';p.columns.status='editorial_status';assert.equal(profileSchema.safeParse(p).success,false);
 const batch=prepare([{title:'Only an unmapped title',secretColumn:'not copied'}]);assert.equal(batch.report.summary.review,1);assert.equal(batch.entries.length,0);
 assert.ok(batch.report.unmappedColumns.includes('secretColumn'));assert.ok(!JSON.stringify(batch.report).includes('not copied'));
});
test('valid CSV/JSON inputs produce equivalent P1.1 candidates and preserve supplied facts',()=>{
 const data={...row('csv'),italianTitle:'Nome, "quotato" — 日本語',originalTitle:'Original 日本語',originalLanguage:'ja',sources:[{id:'provided',kind:'secondary',title:'TEST ONLY',url:'https://example.org/test-source',author:'TEST source author',accessedAt:'2026-11-11'}],timing:{prepMinutes:10,cookMinutes:20,restMinutes:0},servings:4,body:'TEST ONLY\nMultiline body.'};
 const one=prepare([data]);const two=prepareResearchBatch(parseResearchInput(asCSV([data]),'csv'),profile,existing,registry);
 assert.deepEqual(one.entries,two.entries);assert.equal(one.entries[0].data.servings,4);assert.deepEqual(one.entries[0].data.sources,data.sources);assert.equal(one.entries[0].body,data.body);
});
test('absent optional facts remain empty/null and no source, ingredient, procedure or translation is fabricated',()=>{
 const batch=prepare([row('missing')]),data=batch.entries[0].data;
 assert.deepEqual(data.sources,[]);assert.deepEqual(data.ingredients,[]);assert.deepEqual(data.steps,[]);assert.equal(data.timing,null);assert.equal(data.servings,null);assert.equal(data.provenance.country,null);
 assert.equal(data.editorial.status,'candidate');assert.ok(batch.report.accepted[0].warnings.some(warning=>warning.field==='sources'));
 const incomplete=row('no-translation');delete incomplete.italianTitle;
 assert.equal(prepare([incomplete]).report.summary.review,1);assert.equal(prepare([incomplete]).entries.length,0);
});
test('source metadata is copied only when complete and is never inferred from a bare URL',()=>{
 const partial=prepare([{...row('source'),sourceUrl:'https://example.org/test-only'}]);assert.equal(partial.entries.length,0);assert.ok(codes(partial.report.review[0]).includes('INCOMPLETE_SOURCE'));
 const full={...row('full-source'),sourceUrl:'https://example.org/test-only',sourceTitle:'TEST ONLY',sourceAuthor:'Test author',sourceAccessedAt:'2026-11-11',sourceKind:'secondary'};
 assert.equal(prepare([full]).entries[0].data.sources[0].accessedAt,'2026-11-11');
 const invalid=prepare([{...full,sourceAccessedAt:'unknown'}]);assert.equal(invalid.entries.length,0);
 const ambiguity=prepare([{...full,sources:[]}]);assert.ok(codes(ambiguity.report.review[0]).includes('AMBIGUOUS_SOURCE_MAPPING'));
});
test('all new states remain candidate even with a publication request in an unmapped dataset column',()=>{
 const batch=prepare([{...row('state'),editorial:{status:'published'},status:'verified',demo:false}]);
 assert.equal(batch.entries[0].data.editorial.status,'candidate');assert.ok(!('publishedAt' in batch.entries[0].data.editorial));
 assert.equal(isVisible(batch.entries[0].data,'preview'),false);assert.equal(isVisible(batch.entries[0].data,'production'),false);
});
test('IDs are deterministic from dataset/source identity, independent of title, slug, row order and date',()=>{
 const a=row('stablea'),b=row('stableb');const first=prepare([a,b]),second=prepare([b,{...a,italianTitle:'changed nonmatching title',slug:'changed-slug'}],{...profile,recordDate:'2026-11-12'});
 assert.equal(first.entries[0].data.catalogId,second.entries[1].data.catalogId);assert.equal(first.entries[1].data.catalogId,second.entries[0].data.catalogId);
 assert.notEqual(researchId(profile.datasetId,a.sourceId),researchId('other-dataset',a.sourceId));
 assert.deepEqual(prepare([a]).report,prepare([a]).report);
});
test('identical rows are excluded, conflicting repeated source IDs all require review',()=>{
 const one=row('repeat');const same=prepare([one,structuredClone(one)]);assert.deepEqual(same.report.summary,{received:2,accepted:1,excluded:1,review:0});assert.ok(codes(same.report.excluded[0]).includes('DUPLICATE_INPUT_ROW'));
 const conflict=prepare([one,{...one,description:'Different input fact'}]);assert.equal(conflict.entries.length,0);assert.equal(conflict.report.summary.review,2);
 assert.ok(conflict.report.review.every(record=>codes(record).includes('CONFLICTING_SOURCE_ROWS')));
});
test('collisions against existing and retired identity/slug reservations do not overwrite anything',()=>{
 const baseline=existing.find(entry=>entry.collection==='ricette' && entry.data.slug==='rosti');
 for(const data of [{...row('id'),catalogId:baseline.data.catalogId},{...row('slug'),slug:baseline.data.slug}])assert.equal(prepare([data]).report.summary.review,1);
 const id=randomUUID(),retiredRegistry={...registry,[id]:{collection:'ricette',slug:'retired-route'}};
 const retired=prepareResearchBatch(input([{...row('retired'),slug:'retired-route'}]),profile,existing,retiredRegistry);assert.ok(codes(retired.report.review[0]).includes('SLUG_COLLISION'));
 const shared=randomUUID();assert.equal(prepare([{...row('x'),catalogId:shared},{...row('y'),catalogId:shared}]).report.summary.review,2);
 assert.equal(prepare([{...row('x'),slug:'shared-slug'},{...row('y'),slug:'shared-slug'}]).report.summary.review,2);
});
test('previously registered source IDs are excluded; explicit contradictory IDs require review',()=>{
 const original=structuredClone(existing),target=original.find(entry=>entry.collection==='ricette');target.data.externalIds.push({namespace:profile.datasetId,value:'registered'});
 const data={...row('registered'),sourceId:'registered'};
 const batch=prepareResearchBatch(input([data]),profile,original,registry);assert.equal(batch.report.summary.excluded,1);assert.equal(batch.entries.length,0);assert.equal(batch.report.excluded[0].catalogId,target.data.catalogId);
 const conflict=prepareResearchBatch(input([{...data,catalogId:randomUUID()}]),profile,original,registry);assert.equal(conflict.report.summary.review,1);assert.ok(codes(conflict.report.review[0]).includes('IDENTITY_SOURCE_MISMATCH'));
});
test('normalized aliases and possible regional variants require review without automatic merging',()=>{
 const data={...row('rosti-region'),italianTitle:'Rosti bernese',originalTitle:'Rösti',originalLanguage:'de',countryCode:'CH',countryName:'Svizzera',continent:'europe',region:'Area di test'};
 const batch=prepare([data]);assert.equal(batch.entries.length,0);assert.ok(codes(batch.report.review[0]).includes('POSSIBLE_DUPLICATE_OR_VARIANT'));assert.ok(batch.report.review[0].matches.some(match=>match.slug==='rosti'));
 const sameName=prepare([{...row('one'),italianTitle:'zzidentico'},{...row('two'),italianTitle:'zzidentico'}]);assert.equal(sameName.report.summary.review,2);
});
test('explicit primary/variant references resolve across the batch independently of input order',()=>{
 const primary=row('anchor'),variant={...row('variant'),relationKind:'variant',primarySourceId:primary.sourceId,originalTitle:primary.originalTitle};
 const id=randomUUID();primary.catalogId=id;
 const batch=prepare([variant,primary]);assert.equal(batch.entries.length,2);assert.deepEqual(batch.entries[0].data.relation,{kind:'variant',primaryId:id});
 const dangling=prepare([variant]);assert.ok(codes(dangling.report.review[0]).includes('UNRESOLVED_PRIMARY'));
 const ambiguous=prepare([variant,{...primary,slug:'rosti'}]);assert.equal(ambiguous.entries.length,0);assert.ok(ambiguous.report.review.some(record=>codes(record).includes('UNRESOLVED_PRIMARY')));
});
test('explicit duplicates are excluded and never staged as new canonical recipes',()=>{
 const existingId=existing.find(entry=>entry.collection==='ricette').data.catalogId;
 const duplicate=prepare([{...row('dup'),duplicateOf:existingId}]);assert.equal(duplicate.report.summary.excluded,1);assert.equal(duplicate.entries.length,0);
 const unresolved=prepare([{...row('dup'),duplicateOf:randomUUID()}]);assert.equal(unresolved.report.summary.review,1);
 const primary=row('canonical');const other={...row('dup-new'),originalTitle:primary.originalTitle,duplicateOf:researchId(profile.datasetId,primary.sourceId)};
 const batch=prepare([other,primary]);assert.equal(batch.report.summary.accepted,1);assert.equal(batch.report.summary.excluded,1);
});
test('the batch never silently truncates or invents replacement records to reach fifty',()=>{
 const fifty=prepare(Array.from({length:50},(_,index)=>row(`r${index}`)));assert.equal(fifty.entries.length,50);assert.equal(fifty.report.summary.received,50);assert.ok(fifty.entries.every(entry=>recipeSchema.safeParse(entry.data).success && entry.data.editorial.status==='candidate'));
 const excessive=prepare(Array.from({length:51},(_,index)=>row(`r${index}`)));assert.equal(excessive.report.status,'blocked');assert.equal(excessive.report.summary.review,51);assert.equal(excessive.entries.length,0);assert.ok(!excessive.plan);
 const empty=prepare([]);assert.ok(empty.report.blockingReasons.includes('EMPTY_DATASET'));assert.equal(empty.entries.length,0);
});
test('malformed cells, unknown relation/role, missing IDs and unsafe source fields require review',()=>{
 for(const update of [{ingredients:'not json'},{ingredients:['unstructured text']},{relationKind:undefined},{potatoRole:undefined},{sourceId:12},{sourceId:' padded '},{countryCode:'IT',countryName:undefined},{primaryId:randomUUID(),primarySourceId:'other',relationKind:'variant'}]) {
  const batch=prepare([{...row('bad'),...update}]);assert.equal(batch.entries.length,0);assert.equal(batch.report.summary.review,1);
 }
 assert.throws(()=>parseResearchInput('id,id\na,b','csv'),/duplicate/);assert.throws(()=>parseResearchInput('id,slug\na,b,c','csv'));
 assert.throws(()=>parseResearchInput('{bad','json'));assert.throws(()=>parseResearchInput('{"formatVersion":2,"rows":[]}','json'));
 assert.throws(()=>parseResearchInput('{}','xml'));
 const invalid=prepareResearchBatch(input([null,42,[]]),profile,existing,registry);assert.equal(invalid.report.summary.review,3);
});
test('staging exports only accepted candidates with report and P1.1 JSON, leaving sources intact',()=>{
 const folder=mkdtempSync(path.join(tmpdir(),'ricettepatata-batch-test-'));
 const before=stableJSON(readCatalog()),registryBefore=readFileSync('src/catalog/registry.json','utf8');
 try {
  const batch=prepare([row('staged')]),destination=path.join(folder,'proposal');
  assert.throws(()=>stageResearchBatch(batch,destination),/parziale/);assert.equal(existsSync(destination),false);
  const output=stageResearchBatch(batch,destination,{allowPartial:true});
  const report=JSON.parse(readFileSync(path.join(output,'batch-report.json'),'utf8'));
  const candidates=JSON.parse(readFileSync(path.join(output,'candidates.json'),'utf8'));
  assert.equal(report.importExecuted,false);assert.equal(report.partialAcknowledged,true);assert.equal(report.stagingPrepared,true);assert.equal(candidates.entries.length,1);assert.equal(candidates.entries[0].data.editorial.status,'candidate');
  assert.ok(existsSync(path.join(output,'content/ricette',batch.entries[0].data.slug+'.md')));
  assert.throws(()=>stageResearchBatch(batch,destination,{allowPartial:true}),/EEXIST/);
  assert.equal(stableJSON(readCatalog()),before);assert.equal(readFileSync('src/catalog/registry.json','utf8'),registryBefore);
  const link=path.join(folder,'checkout-link');symlinkSync(process.cwd(),link,'dir');assert.throws(()=>stageResearchBatch(batch,path.join(link,'bad-stage'),{allowPartial:true}),/esterno al checkout/);
 } finally {rmSync(folder,{recursive:true,force:true});}
});
test('partial batches require explicit acknowledgement and reviewed/excluded rows never enter staging',()=>{
 const batch=prepare([row('good'),{...row('bad'),slug:'rosti'}]);assert.equal(batch.entries.length,1);assert.equal(batch.report.summary.review,1);
 const folder=mkdtempSync(path.join(tmpdir(),'ricettepatata-batch-partial-'));
 try {
  assert.throws(()=>stageResearchBatch(batch,path.join(folder,'no')),/parziale/);
  const output=stageResearchBatch(batch,path.join(folder,'yes'),{allowPartial:true});
  assert.equal(JSON.parse(readFileSync(path.join(output,'candidates.json'),'utf8')).entries.length,1);
  batch.plan.additions[0].data.editorial.status='draft';assert.throws(()=>stageResearchBatch(batch,path.join(folder,'tampered'),{allowPartial:true}),/incoerente|solo ricette candidate/);
 } finally {rmSync(folder,{recursive:true,force:true});}
});
test('optional staging artifacts use the same secured writer and cannot overwrite registry or escape',async()=>{
 const {stageImport}=await import('../src/catalog/import.mjs');
 const folder=mkdtempSync(path.join(tmpdir(),'ricettepatata-batch-artifact-'));
 try {
  const batch=prepare([row('artifact')]);
  for(const name of ['../escape.json','registry.json','content/escape.json']) {
   const output=path.join(folder,'invalid');assert.throws(()=>stageImport(batch.plan,output,process.cwd(),{[name]:{}}),/non valido o riservato/);assert.equal(existsSync(output),false);
  }
 } finally {rmSync(folder,{recursive:true,force:true});}
});
test('CLI without dataset refuses staging and never starts an import',()=>{
 const folder=mkdtempSync(path.join(tmpdir(),'ricettepatata-batch-cli-'));
 try {
  const destination=path.join(folder,'no-import');
  const result=spawnSync(process.execPath,['scripts/catalog-batch.mjs','--stage',destination],{encoding:'utf8'});
  assert.equal(result.status,2);assert.equal(JSON.parse(result.stdout).datasetAvailable,false);assert.equal(existsSync(destination),false);
 } finally {rmSync(folder,{recursive:true,force:true});}
});


test('CLI stages a full fifty-row synthetic fixture and refuses missing files without touching catalog sources',()=>{
 const folder=mkdtempSync(path.join(tmpdir(),'ricettepatata-full-batch-cli-'));
 const before=stableJSON(readCatalog()),registryBefore=readFileSync('src/catalog/registry.json','utf8');
 try {
  const dataset=path.join(folder,'TEST-ONLY.json'),mapping=path.join(folder,'profile.json'),destination=path.join(folder,'proposal');
  writeFileSync(dataset,JSON.stringify({formatVersion:1,rows:Array.from({length:50},(_,index)=>row(`cli${index}`))}));
  writeFileSync(mapping,JSON.stringify(profile));
  const result=spawnSync(process.execPath,['scripts/catalog-batch.mjs','--input',dataset,'--profile',mapping,'--stage',destination],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);assert.equal(JSON.parse(result.stdout).summary.accepted,50);
  const exported=JSON.parse(readFileSync(path.join(destination,'candidates.json'),'utf8'));assert.equal(exported.entries.length,50);assert.ok(exported.entries.every(entry=>entry.data.editorial.status==='candidate'));
  assert.equal(JSON.parse(readFileSync(path.join(destination,'batch-report.json'),'utf8')).importExecuted,false);
  const missing=path.join(folder,'missing-output');
  const failed=spawnSync(process.execPath,['scripts/catalog-batch.mjs','--input',path.join(folder,'not-provided.csv'),'--profile',mapping,'--stage',missing],{encoding:'utf8'});
  assert.notEqual(failed.status,0);assert.equal(existsSync(missing),false);
  assert.equal(stableJSON(readCatalog()),before);assert.equal(readFileSync('src/catalog/registry.json','utf8'),registryBefore);
  assert.equal(profileSchema.safeParse(JSON.parse(readFileSync('docs/research/profile.template.json','utf8'))).success,false);
 } finally {rmSync(folder,{recursive:true,force:true});}
});
