import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {candidateEntries,approvedEntries,recordDigest} from '../release/selection.mjs';
import {prepareApproval} from '../scripts/prepare-release-approval.mjs';

// Fixture dates and authority are synthetic; this test is NOT a publication approval.
const fixture={reviewer:'Federico',reviewedAt:'2026-11-20',approvedBy:'Synthetic test only',
 approvedAt:'2026-11-20',publishedAt:'2026-11-21'};

test('in-memory promoted records satisfy the actual release validator',()=>{
 const beforeApproval=readFileSync('release/authorization.json','utf8');
 const beforeRecords=readFileSync('release/approved-records.json','utf8');
 assert.equal(JSON.parse(beforeApproval).approved,false);
 assert.equal(JSON.parse(beforeRecords).entries.length,0);
 const proposal=prepareApproval(fixture);
 const validated=approvedEntries(proposal.authorization,proposal.approvedRecords.entries);
 const drafts=candidateEntries();
 assert.equal(validated.length,2);
 for(let i=0;i<2;i++){
  assert.equal(validated[i].data.catalogId,drafts[i].data.catalogId);
  assert.equal(validated[i].body,drafts[i].body);
  assert.deepEqual({...validated[i].data,editorial:undefined},{...drafts[i].data,editorial:undefined});
  assert.equal(recordDigest(proposal.approvedRecords.entries[i]),proposal.authorization.recordHashes[validated[i].data.catalogId]);
 }
 assert.equal(readFileSync('release/authorization.json','utf8'),beforeApproval);
 assert.equal(readFileSync('release/approved-records.json','utf8'),beforeRecords);
});

test('real approval validator rejects tampering and missing consent',()=>{
 const proposal=prepareApproval(fixture);
 assert.throws(()=>approvedEntries({...proposal.authorization,approved:false},proposal.approvedRecords.entries),/BLOCKED/);
 const bad=structuredClone(proposal.approvedRecords.entries);
 bad[0].data.ingredients[0].quantity.value=9999;
 assert.throws(()=>approvedEntries(proposal.authorization,bad),/Consentiti solo metadati editoriali/);
 const hashes=structuredClone(proposal.authorization);
 hashes.recordHashes[bad[0].data.catalogId]='0'.repeat(64);
 assert.throws(()=>approvedEntries(hashes,proposal.approvedRecords.entries),/Hash del record approvato/);
});
