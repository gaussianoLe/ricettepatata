import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {auditBackups} from '../scripts/cutover-backup-preflight.mjs';

test('cutover preflight rejects missing backup arguments',()=>{
 assert.throws(()=>auditBackups({}),/Richiesti/);
});
test('cutover preflight fails closed on empty or nonmatching backup',()=>{
 const dir=mkdtempSync(join(tmpdir(),'rp-cutover-test-'));
 try{
  const wp=join(dir,'wp.zip'),sql=join(dir,'db.sql');
  writeFileSync(wp,'');
  writeFileSync(sql,'INSERT INTO demo VALUES (1);');
  assert.throws(()=>auditBackups({wordpressZip:wp,mysqlDump:sql,checkZip:false}),/vuoto/);
  writeFileSync(wp,'not an actual WordPress backup');
  assert.throws(()=>auditBackups({wordpressZip:wp,mysqlDump:sql,checkZip:false}),/Hash backup discordante/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
