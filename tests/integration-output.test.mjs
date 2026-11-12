import test from 'node:test';
import assert from 'node:assert/strict';
import {integrationInputs,auditPublicOutput} from '../src/catalog/integration.mjs';
import {readFileSync,readdirSync} from 'node:fs';
const inputs=integrationInputs();
test('entire static deployment excludes all three draft identities, formulas and source/body data',()=>{
 const audit=auditPublicOutput(inputs.entries);assert.equal(audit.draftLeaks,0);assert.ok(audit.filesScanned>0);assert.equal(audit.allFileTypes,true);
});
test('Astro persisted collections omit the integrated drafts at the loader boundary',()=>{
 // Astro stores chunked data below .astro/content; inspect only actual content-store data files.
 const scan=folder=>readdirSync(folder,{withFileTypes:true}).flatMap(item=>item.isDirectory()?scan(folder+'/'+item.name):[folder+'/'+item.name]);
 const files=scan('.astro').filter(f=>/content(?:\/|[-.]|$)/.test(f) && /\.(json|mjs)$/.test(f));
 assert.ok(files.length>0);
 for(const file of files)for(const e of inputs.entries)assert.equal(readFileSync(file).includes(Buffer.from(e.data.catalogId)),false,file);
});
