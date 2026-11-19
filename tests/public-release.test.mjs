import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {releaseOptions,buildRelease,createRelease} from '../release/runtime.mjs';
import {candidateEntries,approvedEntries,digest,recordDigest} from '../release/selection.mjs';
import {releaseCandidate,releaseArtifact} from '../release/context.mjs';
import {reader} from '../release/reader.mjs';
import {verifiedPhotos} from '../release/photos.mjs';
import {historicalInterface,verifyInterfaces} from '../release/compatibility.mjs';
import {deployment} from '../src/lib/config.mjs';
const originals=()=>candidateEntries();
function fixture(){const entries=originals().map(e=>({collection:e.collection,body:e.body,data:{...structuredClone(e.data),editorial:{...e.data.editorial,status:'published',reviewer:'CI TEST ONLY reviewer',reviewedAt:'2026-11-17',publishedAt:'2026-11-17'}}}));return {entries,auth:{formatVersion:1,approved:true,approvedBy:'CI TEST ONLY approver',approvedAt:'2026-11-17',photographicFallbackAccepted:true,recordHashes:Object.fromEntries(entries.map(e=>[e.data.catalogId,recordDigest(e)]))}};}
test('ordinary public context is permanently off; no distributable RC/editorial target',()=>{
 assert.equal(releaseCandidate,false);assert.equal(releaseArtifact,false);
 for(const target of ['release-candidate','candidate','editorial'])assert.throws(()=>deployment(target));
});
test('release config forbids user roots/output and noncanonical bases; fake sessions cannot build',async()=>{
 for(const options of [{outDir:'dist'},{root:'.'},{host:'0.0.0.0'},{mode:'production'},{base:'//evil/'}])assert.throws(()=>releaseOptions(options));
 for(const base of ['/','/anteprima/','/magazine/'])assert.equal(releaseOptions({base}).base,base);
 await assert.rejects(()=>buildRelease({site:'dist'}),/Sessione release/);
 assert.throws(()=>createRelease({mode:'approved'}),/BLOCKED/);
 assert.throws(()=>releaseOptions({mode:'approved',base:'/anteprima/'}),/solo per root/);
});
test('RC selection is exactly the two stable real drafts, no promotions or mutations',()=>{
 const entries=originals();assert.deepEqual(entries.map(e=>e.data.slug),['gatto-di-patate','papas-arrugadas-con-mojo']);
 for(const entry of entries){assert.equal(entry.data.editorial.status,'draft');assert.equal(entry.data.demo,false);assert.equal(entry.body,originals().find(e=>e.data.catalogId===entry.data.catalogId).body);}
});
test('publication remains blocked while explicit P1.1 published snapshots and user authorization are absent',()=>{
 assert.throws(()=>approvedEntries(),/BLOCKED/);
 const {auth,entries}=fixture();assert.equal(approvedEntries(auth,entries).length,2);
 assert.throws(()=>approvedEntries({...auth,approved:false},entries),/BLOCKED/);
 assert.throws(()=>approvedEntries({...auth,recordHashes:{}},entries),/Hash/);
 assert.throws(()=>approvedEntries(auth,[]),/esattamente/);
 assert.equal(JSON.parse(readFileSync('release/authorization.json')).approved,false);
});
test('even an authorization fixture cannot alter ingredients, identity, body or status silently',()=>{
 const {auth,entries}=fixture();
 for(const edit of [e=>e[0].data.ingredients[0].quantity.value++,e=>e[0].data.slug='different',e=>e[0].body+='changed',e=>e[0].data.editorial.status='draft']){
  const changed=structuredClone(entries);edit(changed);assert.throws(()=>approvedEntries(auth,changed));
 }
 assert.equal(originals()[0].data.editorial.status,'draft');
});
test('historical interfaces are preserved exactly while current interface edits are independently pinned',()=>{
 const plan=verifyInterfaces();
 for(const item of plan.files){assert.equal(digest(historicalInterface(item.file)),item.beforeSha256);assert.throws(()=>historicalInterface(item.file,f=>f===item.file?Buffer.concat([readFileSync(f),Buffer.from('tamper')]):readFileSync(f)),/Baseline/);assert.throws(()=>historicalInterface(item.file,f=>f===item.beforeFile?Buffer.from('tamper'):readFileSync(f)),/Baseline/);}
});
test('public metadata distinguishes editorial author and formula sources without private working notes',()=>{
 for(const entry of originals()){
  const {seo,presentation}=reader(entry);assert.equal(seo.schema.author.name,'RicettePatata.it');assert.equal(seo.description,presentation.intro);
  assert.deepEqual(seo.schema.recipeInstructions.map(s=>s.text),entry.data.steps.map(s=>s.text));
  assert.deepEqual(seo.schema.citation,entry.data.sources.map(s=>s.url));
  for(const field of ['nutrition','aggregateRating','review','datePublished','totalTime'])assert.equal(field in seo.schema,false);
  assert.ok(!JSON.stringify(seo).includes('assistita'));assert.ok(!JSON.stringify(seo).includes('Uso richiesto dal procedimento'));
 }
});
test('licensed Commons photo and generated Gatto illustration retain distinct provenance',()=>{
 const photos=verifiedPhotos();assert.equal(photos.length,2);
 const papas=photos.find(p=>p.slug==='papas-arrugadas-con-mojo');
 assert.equal(papas.status,'licensed');assert.equal(papas.license,'CC BY 2.0');
 assert.ok(papas.sourcePage.startsWith('https://commons.wikimedia.org/'));
 const gatto=photos.find(p=>p.slug==='gatto-di-patate');
 assert.equal(gatto.status,'generated');assert.equal(gatto.origin,'openai-image-generation');
 assert.equal(gatto.license,undefined);assert.equal(gatto.sourcePage,undefined);
 assert.equal(gatto.sha256,digest(readFileSync(gatto.file)));
});
