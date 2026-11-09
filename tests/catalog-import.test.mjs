import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {readCatalog,parseMarkdown} from '../src/catalog/io.mjs';
import {parseImport,planImport,stageImport,csvColumns} from '../src/catalog/import.mjs';
const existing=readCatalog(),registry=JSON.parse(readFileSync('src/catalog/registry.json','utf8'));
const fixture=()=>{
 const data=structuredClone(existing.find(entry=>entry.collection==='ricette').data);data.catalogId=randomUUID();data.slug=`import-${data.catalogId}`;data.editorial.status='candidate';data.ingredients=[];data.steps=[];data.timing=null;data.servings=null;
 return {collection:'ricette',data,body:'Test di importazione, con virgole\ne più righe.\n'};
};
const quote=value=>`"${String(value).replaceAll('"','""')}"`;
function csv(entries) {
 return '\uFEFF'+[csvColumns.map(quote).join(','),...entries.map(entry=>csvColumns.map(key=>quote(key==='collection'?entry.collection:key==='body'?entry.body:entry.data[key]===undefined?'':typeof entry.data[key]==='object'||typeof entry.data[key]==='boolean'||typeof entry.data[key]==='number'?JSON.stringify(entry.data[key]):entry.data[key])).join(','))].join('\r\n')+'\r\n';
}

test('JSON and RFC4180 CSV produce equivalent nested records, Unicode and multiline text',()=>{
 const entry=fixture();entry.data.names.italian='Patate, "speciali" — 日本語';
 assert.deepEqual(parseImport(JSON.stringify({formatVersion:1,entries:[entry]}),'json'),[entry]);
 assert.deepEqual(parseImport(csv([entry]),'csv'),[entry]);
 assert.equal(planImport(parseImport(csv([entry]),'csv'),existing,registry).additions.length,1);
});
test('CSV rejects unknown/duplicate headers, malformed rows and invalid JSON cells',()=>{
 for(const source of ['collection,catalogId,slug,unknown\nricette,id,test,x','collection,catalogId,slug,slug\nricette,id,x,x','collection,catalogId\nricette,id','collection,catalogId,slug,ingredients\nricette,id,test,not-json','collection,catalogId,slug\nricette,id,test,extra']) assert.throws(()=>parseImport(source,'csv'));
 assert.throws(()=>parseImport('{}','xml'));assert.throws(()=>parseImport('{"formatVersion":2,"entries":[]}','json'));
 assert.throws(()=>parseMarkdown('---\ntitle: one\ntitle: two\n---\nbody'));
});
test('same IDs and identical records are idempotent; conflicting updates never overwrite',()=>{
 const entry=fixture();const plan=planImport([entry,entry],existing,registry);assert.equal(plan.additions.length,1);assert.equal(plan.skipped,1);
 const original=existing.find(entry=>entry.collection==='ricette' && entry.data.slug==='rosti');assert.equal(planImport([original],existing,registry).skipped,1);
 const conflict=structuredClone(original);conflict.data.names.italian='Changed';assert.throws(()=>planImport([conflict],existing,registry),/Conflitto/);
 const renamed=structuredClone(original);renamed.data.slug='changed';assert.throws(()=>planImport([renamed],existing,registry),/Conflitto/);
});
test('reserved URLs and duplicated external identifiers require explicit editorial reconciliation',()=>{
 const entry=fixture();entry.data.slug=existing.find(entry=>entry.collection==='ricette').data.slug;assert.throws(()=>planImport([entry],existing,registry),/Slug riservato/);
 const one=fixture(),two=fixture();one.data.externalIds=two.data.externalIds=[{namespace:'source',value:'same'}];assert.throws(()=>planImport([one,two],existing,registry),/esterno duplicato/);
});
test('imports cannot verify or publish, and dangling variants are rejected before staging',()=>{
 for(const status of ['verified','published']) {
  const entry=fixture();entry.data.editorial={status,author:'Test author',reviewer:'Test reviewer',reviewedAt:'2026-11-09',...(status==='published'?{publishedAt:'2026-11-09'}:{})};entry.data.demo=false;entry.data.sources=[{id:'external',kind:'secondary',url:'https://example.org/test',title:'Synthetic source',author:'Test author',accessedAt:'2026-11-09'}];
  const complete=existing.find(record=>record.collection==='ricette').data;entry.data.ingredients=complete.ingredients;entry.data.steps=complete.steps;entry.data.timing=complete.timing;entry.data.servings=complete.servings;
  assert.throws(()=>planImport([entry],existing,registry),/non può verificare o pubblicare/);
 }
 const variant=fixture();variant.data.relation={kind:'variant',primaryId:randomUUID()};assert.throws(()=>planImport([variant],existing,registry),/inesistente/);
});
test('staging writes a complete reviewable proposal outside the checkout and never overwrites',()=>{
 const folder=mkdtempSync(path.join(tmpdir(),'ricettepatata-import-test-'));
 try {
  const entry=fixture(),plan=planImport([entry],existing,registry),output=path.join(folder,'proposal');
  stageImport(plan,output);const staged=parseMarkdown(readFileSync(path.join(output,'content','ricette',`${entry.data.slug}.md`),'utf8'));
  assert.deepEqual(staged.data,entry.data);assert.equal(staged.body,entry.body);
  assert.ok(JSON.parse(readFileSync(path.join(output,'registry.json'),'utf8'))[entry.data.catalogId]);
  assert.throws(()=>stageImport(plan,output),/EEXIST/);
  assert.throws(()=>stageImport(plan,path.join(process.cwd(),'src/content/staging')),/esterno al checkout/);
  assert.ok(!existsSync(path.join(process.cwd(),'src/content/ricette',`${entry.data.slug}.md`)));
  assert.deepEqual(JSON.parse(readFileSync('src/catalog/registry.json','utf8')),registry);
 } finally {rmSync(folder,{recursive:true,force:true});}
});
