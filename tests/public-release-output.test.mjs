import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {outputFiles} from '../src/catalog/integration.mjs';
test('ordinary dist contains no RC banner, private photos or release manifest',()=>{
 for(const file of outputFiles()){
  assert.ok(!file.includes('/media/'));
  for(const marker of ['Release candidate privata','CC BY 2.0','Fer..','recordHashes','papasarrugadas.jpg'])assert.equal(readFileSync(file).includes(Buffer.from(marker)),false,file);
 }
});
