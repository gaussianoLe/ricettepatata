import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolutionInputs} from '../src/catalog/editorial-resolution.mjs';
import {auditPublicOutput,outputFiles} from '../src/catalog/integration.mjs';
test('P1.9 alternative and private resolution interface never enter distributable output',()=>{
 const proposal=resolutionInputs().alternative;assert.equal(auditPublicOutput([proposal.entry]).draftLeaks,0);
 assert.equal(existsSync('dist/resolution'),false);
 for(const file of outputFiles())for(const marker of ['Risoluzione editoriale P1.9','Alternativa P1.9 · non applicata','prepared_not_applied'])assert.equal(readFileSync(file).includes(Buffer.from(marker)),false,file);
});
