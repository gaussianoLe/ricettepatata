import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync,brotliDecompressSync} from 'node:zlib';
import {outputFiles} from '../src/catalog/integration.mjs';
import {reviewInputs} from '../src/catalog/enrichment-review.mjs';
const {decisions,sources}=reviewInputs();
test('P1.6 review documents and unapplied formula sources never enter deployed static assets',()=>{
 const files=outputFiles();assert.ok(files.length>0);
 for(const file of files){
  assert.ok(!file.includes('p1.6/'));
  let bytes=readFileSync(file);if(file.endsWith('.gz'))bytes=gunzipSync(bytes);if(file.endsWith('.br'))bytes=brotliDecompressSync(bytes);
  for(const marker of [...decisions.flatMap(d=>[d.formulaDecision,...d.findings.map(f=>f.text)]),...sources.map(s=>s.url)]){
   assert.equal(bytes.includes(Buffer.from(marker)),false,file);
   assert.equal(bytes.includes(Buffer.from(JSON.stringify(marker).slice(1,-1))),false,file);
  }
 }
});
