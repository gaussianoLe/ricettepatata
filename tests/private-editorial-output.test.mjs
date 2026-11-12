import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {gunzipSync,brotliDecompressSync} from 'node:zlib';
import {outputFiles} from '../src/catalog/integration.mjs';
test('public distribution contains no editorial UI, route, source module or private artifact',()=>{
 const files=outputFiles();assert.ok(files.length);
 const markers=['Ambiente editoriale privato','Proposta di arricchimento · candidate','Differenze strutturate P1.6','editorialData','EDITORIAL_TEST_OUTPUT'];
 for(const file of files){
  assert.ok(!/(?:^|\/)(?:editorial|enrichments|recipes|p1\.7)(?:\/|$)/.test(file));
  let bytes=readFileSync(file);if(file.endsWith('.gz'))bytes=gunzipSync(bytes);if(file.endsWith('.br'))bytes=brotliDecompressSync(bytes);
  for(const marker of markers)assert.equal(bytes.includes(Buffer.from(marker)),false,file);
 }
 assert.equal(existsSync('editorial/dist'),false);assert.equal(existsSync('editorial/.astro'),false);
});
