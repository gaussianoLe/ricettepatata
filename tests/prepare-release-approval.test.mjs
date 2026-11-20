import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareApproval} from '../scripts/prepare-release-approval.mjs';

const valid={
 reviewer:'Federico',
 reviewedAt:'2026-11-20',
 approvedBy:'Titolare del progetto',
 approvedAt:'2026-11-20',
 publishedAt:'2026-11-21'
};

test('release proposal refuses absent reviewer and unverified metadata',()=>{
 assert.throws(()=>prepareApproval({...valid,reviewer:''}),/Reviewer reale/);
 assert.throws(()=>prepareApproval({...valid,approvedBy:''}),/Autore consenso/);
 assert.throws(()=>prepareApproval({...valid,reviewedAt:'2026-02-30'}),/Data ISO/);
 assert.throws(()=>prepareApproval({...valid,reviewedAt:'2026-11-21'}),/Cronologia/);
 assert.throws(()=>prepareApproval({...valid,publishedAt:'2026-11-19'}),/Cronologia/);
});

test('release proposal requires actual draft files and matching identities',()=>{
 // Positive generation is deliberately not a publication action: output is an
 // in-memory proposal and is never written to the authorization manifests.
 const result=prepareApproval(valid);
 assert.equal(result.approvedRecords.formatVersion,1);
 assert.equal(result.approvedRecords.entries.length,2);
 assert.equal(result.authorization.approved,true);
 assert.equal(Object.keys(result.authorization.recordHashes).length,2);
 for(const record of result.approvedRecords.entries){
   assert.equal(record.data.editorial.reviewer,'Federico');
   assert.equal(record.data.editorial.status,'published');
   assert.equal(result.authorization.recordHashes[record.data.catalogId].length,64);
 }
});
