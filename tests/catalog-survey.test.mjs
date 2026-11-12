import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync,existsSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {readCatalog} from '../src/catalog/io.mjs';
import {stableJSON} from '../src/catalog/research/input.mjs';
import {relatedNames} from '../src/catalog/research/matches.mjs';
import {surveyFields,compareSurveyRepresentations,prepareSurveyLot,stageSurveyQuarantine} from '../src/catalog/research/survey.mjs';
const base='docs/research/lotto-01/';
const json=readFileSync(base+'dataset.json','utf8'),csv=readFileSync(base+'dataset.csv','utf8'),methodology=readFileSync(base+'methodology.md','utf8');
const existing=readCatalog(),registry=JSON.parse(readFileSync('src/catalog/registry.json','utf8'));
const lot=()=>prepareSurveyLot(json,csv,methodology,existing,registry);
const encodeCSV=rows=>[surveyFields.join(','),...rows.map(row=>surveyFields.map(field=>'"'+row[field].replaceAll('"','""')+'"').join(','))].join('\r\n')+'\r\n';
const hash=value=>createHash('sha256').update(value).digest('hex');

test('provided JSON and CSV are the same fifty-record lot with identical values and order',()=>{
 const compared=compareSurveyRepresentations(json,csv);assert.equal(compared.comparison.equivalent,true);assert.equal(compared.comparison.sameOrder,true);assert.equal(compared.comparison.jsonRecords,50);assert.equal(compared.comparison.csvRecords,50);assert.deepEqual(compared.comparison.differences,[]);assert.deepEqual(compared.comparison.duplicateJsonIds,[]);assert.deepEqual(compared.comparison.duplicateCsvIds,[]);
 assert.equal(compared.comparison.jsonFingerprint,'65ba0af4214b56604d9f2ce05854ff555dd309dedde45de41e59bb2414e4486f');
 assert.equal(compared.comparison.csvFingerprint,'98bbb2fe8ffd8317cb8fc87d1cd8931f823fc8d565cfc60b5a37b31166a976ac');
 assert.equal(hash(methodology),'4eec7ba141cb3ace7dc762092f35b8d037439dc35d923c01f6ea6e134e366b43');
});
test('comparison aligns alternatives by source ID without treating a reordered CSV as another import',()=>{
 const rows=JSON.parse(json).entries;const result=compareSurveyRepresentations(json,encodeCSV([...rows].reverse()));assert.equal(result.comparison.equivalent,true);assert.equal(result.comparison.sameOrder,false);
 const report=prepareSurveyLot(json,encodeCSV([...rows].reverse()),methodology,existing,registry).report;assert.equal(report.summary.received,rows.length);assert.equal(report.summary.review,rows.length);
});
test('field mismatches, missing/extra records, duplicate IDs and headers block staging',()=>{
 const rows=JSON.parse(json).entries;const altered=structuredClone(rows);altered[0].paese='DIFFERENT PROVIDED VALUE';
 const mismatched=prepareSurveyLot(json,encodeCSV(altered),methodology,existing,registry);assert.equal(mismatched.report.status,'blocked_inconsistent_representations');assert.ok(mismatched.report.comparison.differences.some(difference=>difference.field==='paese'));assert.throws(()=>stageSurveyQuarantine(mismatched,'/not-used'),/non coerenti/);
 assert.equal(compareSurveyRepresentations(json,encodeCSV(rows.slice(1))).comparison.equivalent,false);
 const extra=structuredClone(rows);extra[0].id='RP-9999';assert.ok(compareSurveyRepresentations(json,encodeCSV(extra)).comparison.differences.some(diff=>diff.kind==='EXTRA_CSV_RECORD'));
 const duplicate=structuredClone(rows);duplicate[1]=structuredClone(duplicate[0]);assert.equal(compareSurveyRepresentations(json,encodeCSV(duplicate)).comparison.equivalent,false);
 assert.throws(()=>compareSurveyRepresentations(json,'id,id\nx,y'),/duplicate/);
});
test('raw research remains candidate; no P1.1 records, sources, translations or recipe details are invented',()=>{
 const prepared=lot();assert.equal(prepared.primary.importable,false);assert.ok(prepared.primary.entries.every(row=>row.stato_editoriale==='candidate'));
 assert.deepEqual(prepared.primary,JSON.parse(json));assert.equal(prepared.plan.additions.length,0);assert.equal(prepared.report.summary.accepted,0);assert.equal(prepared.report.summary.excluded,0);assert.equal(prepared.report.summary.review,50);assert.equal(prepared.report.importExecuted,false);
 for(const row of prepared.report.review){assert.equal(row.p11RecordCreated,false);assert.equal(row.editorialState,'candidate');assert.ok(row.reasons.some(reason=>reason.code==='MISSING_ORIGINAL_LANGUAGE'));assert.ok(row.reasons.some(reason=>reason.code==='POTATO_ROLE_NOT_CONFIRMED'));}
 assert.equal(prepared.report.statistics.missingIndividualSources,50);
});
test('collision and name matching works even when records cannot satisfy the P1.1 schema',()=>{
 const prepared=lot();const rows=new Map(prepared.report.review.map(row=>[row.sourceId,row]));
 for(const id of ['RP-0079','RP-0113','RP-0237'])assert.ok(rows.get(id).reasons.some(reason=>reason.code==='SLUG_COLLISION'));
 for(const [id,slug] of [['RP-0001','pitta-di-patate'],['RP-0039','gnocchi'],['RP-0148','hasselback']])assert.ok(rows.get(id).matches.some(match=>match.scope==='catalog' && match.slug===slug));
 assert.equal(relatedNames(['rosti'],['rosti croccanti','rosti']),'EXACT_NORMALIZED_NAME');
 assert.ok(rows.get('RP-0113').matches.some(match=>match.kind==='EXACT_NORMALIZED_NAME'));
});
test('proposed identities are stable and never registered; duplicate representations count once',()=>{
 const one=lot(),two=prepareSurveyLot(JSON.stringify({...JSON.parse(json),entries:[...JSON.parse(json).entries].reverse()}),encodeCSV([...JSON.parse(json).entries].reverse()),methodology,existing,registry);
 const ids=new Map(one.report.review.map(row=>[row.sourceId,row.proposedCatalogId]));
 for(const row of two.report.review)assert.equal(row.proposedCatalogId,ids.get(row.sourceId));
 assert.equal(one.report.summary.received,50);assert.equal(one.report.summary.alternativeRowsNotProcessed,50);assert.deepEqual(one.plan.registry,registry);
 const collisions={...registry,[one.report.review[0].proposedCatalogId]:{collection:'ricette',slug:'reserved-identity'}};
 const result=prepareSurveyLot(json,csv,methodology,existing,collisions);assert.ok(result.report.review[0].reasons.some(reason=>reason.code==='IDENTITY_COLLISION'));
});
test('quarantine exports the primary dataset and methodology without applying either representation to Astro',()=>{
 const folder=mkdtempSync(path.join(tmpdir(),'ricettepatata-survey-')),prepared=lot();
 const before=stableJSON(readCatalog()),registryBefore=readFileSync('src/catalog/registry.json','utf8');
 try {
  const output=stageSurveyQuarantine(prepared,path.join(folder,'quarantine'));
  assert.equal(existsSync(path.join(output,'content')),false);assert.equal(existsSync(path.join(output,'candidates.json')),false);
  assert.deepEqual(JSON.parse(readFileSync(path.join(output,'research-quarantine.json'),'utf8')),JSON.parse(json));
  const inputs=JSON.parse(readFileSync(path.join(output,'source-inputs.json'),'utf8'));assert.equal(inputs.json.text,json);assert.equal(inputs.csv.text,csv);assert.equal(inputs.methodology.text,methodology);assert.equal(inputs.csv.role,'alternative_only');
  assert.deepEqual(JSON.parse(readFileSync(path.join(output,'registry.json'),'utf8')),registry);
  assert.equal(JSON.parse(readFileSync(path.join(output,'lot-report.json'),'utf8')).stagingPrepared,true);
  assert.equal(stableJSON(readCatalog()),before);assert.equal(readFileSync('src/catalog/registry.json','utf8'),registryBefore);
  assert.throws(()=>stageSurveyQuarantine(prepared,output),/EEXIST/);
 } finally {rmSync(folder,{recursive:true,force:true});}
});
test('modifications after comparison and attempts to promote research records cannot be staged',()=>{
 const prepared=lot();prepared.primary.entries[0].stato_editoriale='published';assert.throws(()=>stageSurveyQuarantine(prepared,'/not-used'),/modificato/);
 const changed=lot();changed.sourceTexts.csv=csv.replaceAll('\r\n','\n');assert.throws(()=>stageSurveyQuarantine(changed,'/not-used'),/modificato/);
 assert.throws(()=>compareSurveyRepresentations(JSON.stringify({...JSON.parse(json),importable:true}),csv));
 const generic={formatVersion:1,entries:[]};assert.throws(()=>compareSurveyRepresentations(JSON.stringify(generic),csv));
});
test('CLI verifies a single real lot, writes only external research quarantine and signals review required',()=>{
 const folder=mkdtempSync(path.join(tmpdir(),'ricettepatata-survey-cli-'));
 try {
  const output=path.join(folder,'quarantine');
  const result=spawnSync(process.execPath,['scripts/catalog-survey.mjs','--json',base+'dataset.json','--csv',base+'dataset.csv','--methodology',base+'methodology.md','--stage',output],{encoding:'utf8'});
  assert.equal(result.status,2,result.stderr);const report=JSON.parse(result.stdout);assert.equal(report.summary.received,50);assert.equal(report.summary.review,50);assert.ok(existsSync(path.join(output,'lot-report.json')));assert.equal(existsSync(path.join(output,'content')),false);
  const csvFile=path.join(folder,'mismatched.csv');writeFileSync(csvFile,csv.replace('RP-0001','RP-9999'));
  const rejected=spawnSync(process.execPath,['scripts/catalog-survey.mjs','--json',base+'dataset.json','--csv',csvFile,'--methodology',base+'methodology.md','--stage',path.join(folder,'blocked')],{encoding:'utf8'});
  assert.notEqual(rejected.status,0);assert.equal(existsSync(path.join(folder,'blocked')),false);
 } finally {rmSync(folder,{recursive:true,force:true});}
});
