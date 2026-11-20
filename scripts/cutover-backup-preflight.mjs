import {createHash} from 'node:crypto';
import {readFileSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export const BACKUP_HASHES=Object.freeze({
 wordpressZip:'92a805c8b8a7d111ab58a1b3d79adc3e27476f57c4cf07e4b2c17c9187f7cb4a',
 mysqlDump:'3b83baec87c8f71d8acce0cc071a9c434597986e3fac5db040ca6fcbadc24e0b',
});
function sha256(file){
 const hash=createHash('sha256');
 hash.update(readFileSync(file));
 return hash.digest('hex');
}
// No network, FTP, database, deletion or write operations.
export function auditBackups({wordpressZip,mysqlDump,checkZip=true}){
 if(!wordpressZip||!mysqlDump)throw new Error('Richiesti --wordpressZip e --mysqlDump');
 const files={wordpressZip:resolve(wordpressZip),mysqlDump:resolve(mysqlDump)};
 const results={};
 for(const [kind,file] of Object.entries(files)){
  const stat=statSync(file);
  if(!stat.isFile()||stat.size===0)throw new Error('Backup vuoto o non regolare: '+kind);
  const actual=sha256(file);
  if(actual!==BACKUP_HASHES[kind])throw new Error('Hash backup discordante: '+kind);
  results[kind]={sha256:actual,bytes:stat.size,valid:true};
 }
 if(checkZip)execFileSync('unzip',['-tqq',files.wordpressZip],{stdio:'pipe',timeout:120000,maxBuffer:1024*1024});
 return {backupIntegrity:'PASS',restoreTested:false,wordpress:results.wordpressZip,mysql:results.mysqlDump,deployAuthorized:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=Object.fromEntries(process.argv.slice(2).map(a=>{
  const match=/^--(wordpressZip|mysqlDump)=(.+)$/.exec(a);
  if(!match)throw new Error('Usare --wordpressZip=percorso --mysqlDump=percorso');
  return [match[1],match[2]];
 }));
 process.stdout.write(JSON.stringify(auditBackups(args),null,2)+'\n');
}
