import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {candidateEntries,digest,identities} from '../release/selection.mjs';
import {verifiedPhotos} from '../release/photos.mjs';
import {isVisible} from '../src/catalog/policy.mjs';

const packet=JSON.parse(readFileSync('docs/editorial/p2.7/decision.json'));
// The growth scenario adds nine temporary identities; compare the saved registry baseline.
// The existing registry tests independently validate the synthetic additions and restoration.
const growth=existsSync('.astro/p1-catalog-fixtures.json')?JSON.parse(readFileSync('.astro/p1-catalog-fixtures.json')):null;
const protectedBytes=file=>file==='src/catalog/registry.json'&&growth?Buffer.from(growth.registryText):readFileSync(file);
test('decision identifies the actual two unchanged drafts and images, never another formula or asset',()=>{
 assert.deepEqual(packet.records.map(r=>r.catalogId),identities.map(i=>i.catalogId));
 for(const record of packet.records){
  const entry=candidateEntries().find(e=>e.data.catalogId===record.catalogId);
  const photo=verifiedPhotos().find(p=>p.slug===record.slug);
  assert.equal(record.slug,entry.data.slug);assert.equal(record.file,entry.file);
  assert.equal(record.sourceFileSha256,digest(readFileSync(entry.file)));
  assert.equal(record.catalogStatus,entry.data.editorial.status);
  assert.equal(record.image.file,photo.file);assert.equal(record.image.status,photo.status);
  assert.equal(record.image.sha256,digest(readFileSync(photo.file)));
  assert.ok(readFileSync(record.dossier,'utf8').includes(record.catalogId));
  for(const target of ['production','preview'])assert.equal(isVisible(entry.data,target),false);
 }
});
test('decision packet cannot attest consent, an independent review, kitchen trials or authorization changes',()=>{
 assert.equal(packet.status,'ready_for_user_decision');
 assert.equal(packet.publicationApproval,null);assert.equal(packet.deploymentApproval,null);
 assert.equal(packet.independentEditorialReview,'pending');
 for(const record of packet.records){
  assert.equal(record.independentEditorialReview,'pending');
  assert.equal(record.kitchenTestPerformed,false);assert.equal(record.publicationApproval,null);
 }
 for(const [file,sha] of Object.entries(packet.protectedFileSha256))assert.equal(digest(protectedBytes(file)),sha,file);
 const authorization=JSON.parse(readFileSync('release/authorization.json'));
 assert.equal(authorization.approved,false);assert.deepEqual(authorization.recordHashes,{});
 assert.deepEqual(JSON.parse(readFileSync('release/approved-records.json')).entries,[]);
 assert.equal(packet.remoteAccessPerformed,false);assert.ok(packet.preserveRemoteDirectories.includes('/anteprima/'));
});
test('documentary decisions retain specific sources, locators and distinct independence groups',()=>{
 const matrix=JSON.parse(readFileSync('docs/editorial/p2.7/sources.json'));
 const byId=new Map(matrix.sources.map(s=>[s.id,s]));
 assert.equal(byId.size,matrix.sources.length);
 for(const source of matrix.sources){
  assert.equal(new URL(source.url).protocol,'https:');
  assert.equal(source.accessedAt,packet.preparedOn);
  assert.ok(source.authorOrOrganization&&source.title&&source.locator&&source.supports);
 }
 for(const id of ['ruggiero-gatto','bonviveur-papas','fsa-cooking','govuk-allergens']){
  const recorded=candidateEntries().flatMap(e=>e.data.sources).find(s=>s.id===id);
  assert.equal(byId.get(id).url,recorded.url);
 }
 assert.notEqual(byId.get('ruggiero-gatto').independenceGroup,byId.get('cucchiaio-gatto').independenceGroup);
 assert.notEqual(byId.get('bonviveur-papas').independenceGroup,byId.get('canarias-gastronomia').independenceGroup);
});
