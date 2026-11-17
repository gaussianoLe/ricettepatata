import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {gzipSync,brotliCompressSync} from 'node:zlib';
import {auditUX} from '../scripts/ux-check.mjs';
test('all new UX text, component and dossier markers stay out of public dist',()=>{assert.equal(auditUX().draftLeaks,0);});
test('UX audit rejects encoded and compressed projection or component leaks',()=>{
 const directory=mkdtempSync(path.join(tmpdir(),'rp-ux-audit-'));
 try{
  for(const [name,bytes] of [['ui.css',Buffer.from('ingredient-amount')],['data.json',Buffer.from(JSON.stringify('Tracciabilità della presentazione P2.1').replace('à','\\u00e0'))],['draft.html.gz',gzipSync(Buffer.from('Dossier di revisione'))],['draft.js.br',brotliCompressSync(Buffer.from('Revisione UX P2.1'))]]){
   writeFileSync(path.join(directory,name),bytes);assert.throws(()=>auditUX(directory),/esposti/);rmSync(path.join(directory,name));
  }
 }finally{rmSync(directory,{recursive:true,force:true});}
});

test('shared existing demo ingredient words are allowed without allowing private article markup',()=>{
 const directory=mkdtempSync(path.join(tmpdir(),'rp-ux-common-'));
 try{
  writeFileSync(path.join(directory,'demo.html'),'olio extravergine');assert.equal(auditUX(directory).draftLeaks,0);
  writeFileSync(path.join(directory,'leak.css'),'ingredient-main');assert.throws(()=>auditUX(directory),/esposti/);
 }finally{rmSync(directory,{recursive:true,force:true});}
});
