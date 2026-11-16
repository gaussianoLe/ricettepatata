import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {releaseEntry} from '../editorial/release.mjs';
import {auditPublicOutput} from '../src/catalog/integration.mjs';
const dir='docs/editorial/p2.0';
export function verifyRelease(read=file=>readFileSync(file)){
 const baseline=JSON.parse(read(dir+'/baseline.json'));
 if(baseline.baseCommit!=='8ae5168d54283d61ba73369dd63b7f6b5a884825')throw new Error('Baseline P2.0 inattesa');
 for(const [file,hash] of Object.entries(baseline.files)){
  if(createHash('sha256').update(read(file)).digest('hex')!==hash)throw new Error('Baseline P2.0 alterata: '+file);
 }
 const entries=['gatto-di-patate','papas-arrugadas-con-mojo'].map(slug=>releaseEntry(slug));
 if(entries.some(e=>!e)||releaseEntry('gratin-dauphinois'))throw new Error('Selezione del rilascio non conforme');
 const gratin=JSON.parse(read('docs/editorial/p1.9/dossiers/RP-0062.json'));
 if(gratin.outcome!=='needs_revision')throw new Error('Gratin deve restare escluso');
 return {prepared:entries.length,published:0,operationalChanges:0,protectedFiles:Object.keys(baseline.files).length,gratin:'needs_revision'};
}
export function auditRelease(){
 const entries=['gatto-di-patate','papas-arrugadas-con-mojo'].map(slug=>releaseEntry(slug).entry);
 const privateMarkers=['Bozza non pubblicata','Pagina pronta per revisione, pubblicazione non autorizzata','/release/gatto-di-patate/','/release/papas-arrugadas-con-mojo/','data-cooking-toggle','Fotografia non disponibile.','La ricetta, per ora, si racconta con le parole.'];
 // Reuse encoding/compression-aware scanner for UI markers as well as recipe data.
 return auditPublicOutput([...entries,...privateMarkers.map(marker=>({...entries[0],data:{...entries[0].data,description:marker}}))]);
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){console.log(JSON.stringify(process.argv.includes('--output')?auditRelease():verifyRelease(),null,2));}
