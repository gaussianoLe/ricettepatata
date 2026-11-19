import {stableJSON} from '../src/catalog/research/input.mjs';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {readCatalog} from '../src/catalog/io.mjs';
import {recipeSchema} from '../src/catalog/schema.mjs';
import {parseImport} from '../src/catalog/import.mjs';
export const identities=Object.freeze([
 {researchId:'RP-0011',catalogId:'3f5f6cf2-d990-5bcb-92e5-9c388233acbb',slug:'gatto-di-patate',sha256:'b254c688010ba8eab102f33af0aa6e342c9d104ab9543601297a51fd350d2419'},
 {researchId:'RP-0080',catalogId:'8bb84554-1db7-58df-a43a-c5bea8155ff0',slug:'papas-arrugadas-con-mojo',sha256:'a4337e8ec67af0a73054fe9619d3da34d11b2e6d5e254f5ad4106c7ce48f888d'},
]);
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export const recordDigest=entry=>digest(stableJSON(entry));
export const selected=record=>identities.some(i=>i.catalogId===record.catalogId && i.slug===record.slug);
export function candidateEntries(){
 const catalog=readCatalog();
 return identities.map(i=>{
  const entry=catalog.find(e=>e.data.catalogId===i.catalogId);
  if(!entry || !selected(entry.data)||entry.data.editorial.status!=='draft'||entry.data.demo||digest(readFileSync(entry.file))!==i.sha256)throw new Error('RC: identità, formula o draft operativo discordanti');
  return entry;
 });
}
export function approvedEntries(authorization=JSON.parse(readFileSync('release/authorization.json')),entries=parseImport(readFileSync('release/approved-records.json','utf8'),'json')){
 if(authorization.formatVersion!==1 || authorization.approved!==true || !authorization.approvedBy?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(authorization.approvedAt??''))throw new Error('BLOCKED: approvazione editoriale esplicita dell’utente assente');
 if(authorization.photographicFallbackAccepted!==true && !['licensed','generated'].includes(JSON.parse(readFileSync('release/photos.json'))['gatto-di-patate']?.status))throw new Error('BLOCKED: fotografia Gattò mancante; accettazione esplicita del placeholder richiesta');
 const approvalDate=new Date(authorization.approvedAt);
 if(!Number.isFinite(approvalDate.getTime()) || approvalDate.toISOString().slice(0,10)!==authorization.approvedAt)throw new Error('BLOCKED: data di approvazione non valida');
 if(!authorization.recordHashes || Object.keys(authorization.recordHashes).sort().join()!==identities.map(i=>i.catalogId).sort().join())throw new Error('Hash delle sole due identità richiesto');
 const current=candidateEntries();
 if(entries.length!==identities.length || new Set(entries.map(e=>e.data.catalogId)).size!==identities.length)throw new Error('Release approvata: richiesti esattamente i due record P1.1 espliciti');
 return current.map(old=>{
  const incoming=entries.find(e=>e.data.catalogId===old.data.catalogId);
  if(!incoming || incoming.collection!=='ricette')throw new Error('Record approvato mancante');
  const data=recipeSchema.parse(incoming.data);
  if(data.editorial.reviewedAt>authorization.approvedAt)throw new Error('BLOCKED: approvazione precedente alla review dichiarata');
  const strip=record=>({...record,editorial:undefined});
  if(JSON.stringify(strip(data))!==JSON.stringify(strip(old.data)) || incoming.body!==old.body || data.editorial.status!=='published')throw new Error('Consentiti solo metadati editoriali espliciti, mai formule/identità/testi nuovi');
  if(authorization.recordHashes[data.catalogId]!==recordDigest(incoming))throw new Error('Hash del record approvato non corrispondente');
  return {...old,data,body:incoming.body};
 });
}
